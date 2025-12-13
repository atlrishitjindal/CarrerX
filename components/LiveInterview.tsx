import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, Volume2, Loader2, Play, Square, FileText, CheckCircle, BarChart } from 'lucide-react';
import { base64ToBytes, createPcmBlob, decodeAudioData, downsampleBuffer } from '../services/audioUtils';
import { generateInterviewReport } from '../services/gemini';
import { InterviewReport, ResumeAnalysis } from '../types';

interface LiveInterviewProps {
    resumeAnalysis: ResumeAnalysis | null;
}

interface Transcription {
    role: 'user' | 'model';
    text: string;
}

const LiveInterview: React.FC<LiveInterviewProps> = ({ resumeAnalysis }) => {
    const [isActive, setIsActive] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [transcripts, setTranscripts] = useState<Transcription[]>([]);
    const [interimTranscript, setInterimTranscript] = useState<{ role: 'user' | 'model'; text: string } | null>(null);
    const [currentInputVolume, setCurrentInputVolume] = useState(0);
    const [report, setReport] = useState<InterviewReport | null>(null);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);

    const audioContextRef = useRef<AudioContext | null>(null);
    const inputContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const sessionPromiseRef = useRef<Promise<any> | null>(null);

    const currentInputTransRef = useRef<string>('');
    const currentOutputTransRef = useRef<string>('');
    const transcriptEndRef = useRef<HTMLDivElement>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);

    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcripts, interimTranscript]);

    const stopSession = useCallback(async () => {
        setIsActive(false);
        setIsConnecting(false);
        setCurrentInputVolume(0);
        setInterimTranscript(null);

        // 1. Close Session
        if (sessionPromiseRef.current) {
            try {
                const session = await sessionPromiseRef.current;
                session.close();
            } catch (e) {
                console.warn("Error closing session", e);
            }
            sessionPromiseRef.current = null;
        }

        // 2. Stop Audio Tracks
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        // 3. Disconnect ScriptProcessor
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }

        // 4. Close Audio Contexts
        if (audioContextRef.current) {
            try { await audioContextRef.current.close(); } catch (e) { }
            audioContextRef.current = null;
        }
        if (inputContextRef.current) {
            try { await inputContextRef.current.close(); } catch (e) { }
            inputContextRef.current = null;
        }

        // 5. Stop Sources
        sourcesRef.current.forEach(source => {
            try { source.stop(); } catch (e) { }
        });
        sourcesRef.current.clear();

    }, []);

    const startSession = async () => {
        setError(null);
        setReport(null);
        setTranscripts([]);
        setInterimTranscript(null);
        setIsConnecting(true);

        try {
            const apiKey = process.env.API_KEY;
            if (!apiKey) throw new Error("API Key missing");

            const ai = new GoogleGenAI({ apiKey });

            // Construct system instruction with resume context
            const contextPrompt = resumeAnalysis
                ? `
          The candidate's background summary is: "${resumeAnalysis.summary}". 
          Their key skills are: ${resumeAnalysis.skills?.join(', ')}. 
          Tailor your questions specifically to this background and their inferred target role.
          `
                : "The candidate has not uploaded a resume yet. Ask general behavioral questions suitable for any professional role.";

            const systemInstruction = `
        You are an expert technical hiring manager conducting a professional job interview.
        
        CONTEXT:
        ${contextPrompt}

        RULES:
        1. LANGUAGE: You MUST speak ONLY in English. Even if the user sounds like they are speaking another language (which might be audio noise), continue in English. politely ask them to repeat in English if unclear.
        2. INTERACTION: Ask ONE question at a time. Wait for the user to answer.
        3. FEEDBACK: After the user answers, provide brief, constructive feedback (1-2 sentences) on their answer, then move to the next question.
        4. TONE: Professional, encouraging, but rigorous.
        5. INITIALIZATION: Start by briefly introducing yourself as "CareerCraft AI Interviewer" and ask the candidate to introduce themselves.
      `;

            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const inputCtx = new AudioContextClass();
            const outputCtx = new AudioContextClass({ sampleRate: 24000 });

            inputContextRef.current = inputCtx;
            audioContextRef.current = outputCtx;
            nextStartTimeRef.current = 0;

            // Add constraints for better audio quality
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    channelCount: 1
                }
            });
            streamRef.current = stream;

            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
                    },
                    systemInstruction: systemInstruction,
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                },
                callbacks: {
                    onopen: () => {
                        console.log("Session opened");
                        setIsActive(true);
                        setIsConnecting(false);

                        const source = inputCtx.createMediaStreamSource(stream);
                        const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
                        processorRef.current = scriptProcessor;

                        scriptProcessor.onaudioprocess = (e) => {
                            if (!inputCtx || inputCtx.state === 'closed') return;

                            const inputData = e.inputBuffer.getChannelData(0);

                            // Volume meter
                            let sum = 0;
                            for (let i = 0; i < inputData.length; i += 10) sum += inputData[i] * inputData[i];
                            const rms = Math.sqrt(sum / (inputData.length / 10));
                            setCurrentInputVolume(Math.min(100, rms * 1000));

                            // Downsample to 16000Hz
                            const downsampledData = downsampleBuffer(inputData, inputCtx.sampleRate, 16000);
                            const pcmBlob = createPcmBlob(downsampledData);

                            sessionPromise.then(session => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            }).catch(err => {
                                // Suppress sending errors if session closed
                            });
                        };

                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputCtx.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        let userSpeaking = false;
                        let modelSpeaking = false;

                        if (message.serverContent?.outputTranscription) {
                            currentOutputTransRef.current += message.serverContent.outputTranscription.text;
                            modelSpeaking = true;
                        } else if (message.serverContent?.inputTranscription) {
                            currentInputTransRef.current += message.serverContent.inputTranscription.text;
                            userSpeaking = true;
                        }

                        if (userSpeaking) {
                            setInterimTranscript({ role: 'user', text: currentInputTransRef.current });
                        } else if (modelSpeaking) {
                            setInterimTranscript({ role: 'model', text: currentOutputTransRef.current });
                        }

                        if (message.serverContent?.turnComplete) {
                            const userText = currentInputTransRef.current.trim();
                            const modelText = currentOutputTransRef.current.trim();

                            if (userText || modelText) {
                                setTranscripts(prev => [
                                    ...prev,
                                    ...(userText ? [{ role: 'user', text: userText } as Transcription] : []),
                                    ...(modelText ? [{ role: 'model', text: modelText } as Transcription] : [])
                                ]);
                            }
                            currentInputTransRef.current = '';
                            currentOutputTransRef.current = '';
                            setInterimTranscript(null);
                        }

                        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (base64Audio && outputCtx && outputCtx.state !== 'closed') {
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);

                            try {
                                const audioBuffer = await decodeAudioData(
                                    base64ToBytes(base64Audio),
                                    outputCtx,
                                    24000,
                                    1
                                );

                                const source = outputCtx.createBufferSource();
                                source.buffer = audioBuffer;
                                source.connect(outputCtx.destination);

                                source.addEventListener('ended', () => {
                                    sourcesRef.current.delete(source);
                                });

                                source.start(nextStartTimeRef.current);
                                nextStartTimeRef.current += audioBuffer.duration;
                                sourcesRef.current.add(source);
                            } catch (e) {
                                console.error("Audio decode error", e);
                            }
                        }

                        if (message.serverContent?.interrupted) {
                            sourcesRef.current.forEach(s => s.stop());
                            sourcesRef.current.clear();
                            nextStartTimeRef.current = 0;
                        }
                    },
                    onclose: () => {
                        console.log("Session closed");
                        stopSession();
                    },
                    onerror: (e) => {
                        console.error("Session error", e);
                        setError("Connection interrupted. Please try again.");
                        stopSession();
                    }
                }
            });

            sessionPromiseRef.current = sessionPromise;

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to start session");
            setIsConnecting(false);
            stopSession();
        }
    };

    const handleGenerateReport = async () => {
        if (transcripts.length === 0) return;
        setIsGeneratingReport(true);
        try {
            const fullText = transcripts.map(t => `${t.role.toUpperCase()}: ${t.text}`).join('\n');
            const data = await generateInterviewReport(fullText);
            setReport(data);
        } catch (err) {
            console.error(err);
            setError("Failed to generate report");
        } finally {
            setIsGeneratingReport(false);
        }
    };

    useEffect(() => {
        return () => {
            stopSession();
        };
    }, [stopSession]);

    return (
        <div className="flex flex-col h-full max-h-[calc(100vh-6rem)]">
            <div className="flex-none mb-6">
                <h2 className="text-2xl font-bold text-white">Mock Interview</h2>
                <p className="text-slate-400">Practice behavioral questions with an AI hiring manager. Speak naturally.</p>
                {!resumeAnalysis && (
                    <div className="mt-2 text-amber-400 text-sm flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                        Tip: Upload your resume first for role-specific questions.
                    </div>
                )}
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
                <div className="flex-1 space-y-6 overflow-y-auto pr-2 scrollbar-thin">
                    <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-8 flex flex-col items-center justify-center relative overflow-hidden min-h-[400px]">
                        {isActive && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                                <div
                                    className="w-64 h-64 rounded-full bg-blue-500 blur-2xl transition-transform duration-75"
                                    style={{ transform: `scale(${1 + currentInputVolume * 0.05})` }}
                                />
                            </div>
                        )}

                        <div className="mb-8 text-center z-10">
                            {isConnecting ? (
                                <div className="flex items-center gap-2 text-blue-400 font-medium">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Connecting...
                                </div>
                            ) : isActive ? (
                                <div className="flex items-center gap-2 text-green-400 font-medium bg-green-900/20 border border-green-900/50 px-4 py-2 rounded-full">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    Live Session Active
                                </div>
                            ) : (
                                <div className="text-slate-500 font-medium">
                                    {transcripts.length > 0 ? "Session Ended" : "Ready to start"}
                                </div>
                            )}
                        </div>

                        <div className="z-10 flex flex-wrap justify-center gap-4">
                            {!isActive ? (
                                <>
                                    <button
                                        onClick={startSession}
                                        disabled={isConnecting}
                                        className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-semibold shadow-lg shadow-blue-900/20 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                                    >
                                        <Play className="w-6 h-6 fill-current" />
                                        {transcripts.length > 0 ? "Start New Session" : "Start Interview"}
                                    </button>
                                    {transcripts.length > 0 && !report && (
                                        <button
                                            onClick={handleGenerateReport}
                                            disabled={isGeneratingReport}
                                            className="flex items-center gap-3 bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-full font-semibold border border-slate-700 transition-all hover:scale-105 disabled:opacity-50"
                                        >
                                            {isGeneratingReport ? <Loader2 className="w-6 h-6 animate-spin" /> : <BarChart className="w-6 h-6" />}
                                            Generate Report
                                        </button>
                                    )}
                                </>
                            ) : (
                                <button
                                    onClick={stopSession}
                                    className="flex items-center gap-3 bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-full font-semibold shadow-lg shadow-red-900/20 transition-all hover:scale-105"
                                >
                                    <Square className="w-6 h-6 fill-current" />
                                    End Session
                                </button>
                            )}
                        </div>

                        <div className="mt-8 flex gap-6 text-slate-500 z-10">
                            <div className={`flex flex-col items-center gap-1 ${isActive ? 'text-blue-400' : ''}`}>
                                {isActive ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                                <span className="text-xs">Input</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <Volume2 className="w-6 h-6" />
                                <span className="text-xs">Output</span>
                            </div>
                        </div>

                        {error && (
                            <div className="absolute bottom-4 left-0 right-0 text-center text-red-400 text-sm px-4">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Report Card */}
                    {report && (
                        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 animate-in fade-in slide-in-from-bottom-4">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-purple-400" /> Interview Report
                                </h3>
                                <div className="text-3xl font-bold text-blue-400">{report.overallScore}<span className="text-sm text-slate-500 ml-1">/100</span></div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                                    <div className="text-slate-400 text-sm mb-1">Communication</div>
                                    <div className="text-2xl font-bold text-white">{report.communicationScore}</div>
                                </div>
                                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                                    <div className="text-slate-400 text-sm mb-1">Technical</div>
                                    <div className="text-2xl font-bold text-white">{report.technicalScore}</div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold text-green-400 mb-2 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Strengths</h4>
                                    <ul className="list-disc list-inside text-slate-300 text-sm space-y-1">
                                        {report.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-amber-400 mb-2 flex items-center gap-2"><BarChart className="w-4 h-4" /> Improvements</h4>
                                    <ul className="list-disc list-inside text-slate-300 text-sm space-y-1">
                                        {report.improvements.map((s, i) => <li key={i}>{s}</li>)}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="w-full lg:w-96 bg-slate-900 rounded-2xl shadow-sm border border-slate-800 flex flex-col overflow-hidden max-h-[600px] lg:max-h-none">
                    <div className="p-4 border-b border-slate-800 bg-slate-950/50">
                        <h3 className="font-semibold text-slate-300">Live Transcript</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                        {transcripts.length === 0 && !interimTranscript && (
                            <p className="text-slate-600 text-sm text-center italic mt-10">
                                Conversation will appear here...
                            </p>
                        )}
                        {transcripts.map((msg, idx) => (
                            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                                    }`}>
                                    {msg.text}
                                </div>
                                <span className="text-xs text-slate-500 mt-1 px-1 capitalize">{msg.role}</span>
                            </div>
                        ))}

                        {/* Interim Transcript Display */}
                        {interimTranscript && (
                            <div className={`flex flex-col ${interimTranscript.role === 'user' ? 'items-end' : 'items-start'} animate-pulse`}>
                                <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${interimTranscript.role === 'user'
                                        ? 'bg-blue-600/70 text-white rounded-tr-none'
                                        : 'bg-slate-800/70 text-slate-200 rounded-tl-none border border-slate-700'
                                    }`}>
                                    {interimTranscript.text}
                                    <span className="inline-block w-1.5 h-3 ml-1 bg-current animate-bounce align-middle" />
                                </div>
                                <span className="text-xs text-slate-500 mt-1 px-1 capitalize">{interimTranscript.role} (speaking...)</span>
                            </div>
                        )}

                        <div ref={transcriptEndRef} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveInterview;