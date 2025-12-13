import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, PhoneOff, Loader2, Volume2, AlertCircle, Video, VideoOff, Play } from 'lucide-react';
import { generateInterviewResponse } from '../services/gemini';
import { ResumeAnalysis } from '../types';
import { Button, Card, Badge } from './ui/DesignSystem';
import { cn } from '../lib/utils';

interface LiveInterviewProps {
  resumeAnalysis: ResumeAnalysis | null;
}

const LiveInterview: React.FC<LiveInterviewProps> = ({ resumeAnalysis }) => {
  const [isActive, setIsActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<{role: 'user'|'ai', text: string}[]>([]);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopVideo();
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  const startSession = () => {
     if (!resumeAnalysis) {
         setError("Resume required to start.");
         return;
     }
     setIsActive(true);
     setTranscript([]);
     speak("Hello! I've reviewed your resume. Are you ready to begin the interview?");
  };

  const endSession = () => {
     setIsActive(false);
     stopVideo();
     if (window.speechSynthesis) window.speechSynthesis.cancel();
     setTranscript([]);
  };

  const toggleVideo = async () => {
      if (isVideoOn) {
          stopVideo();
      } else {
          try {
              const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
              videoStreamRef.current = stream;
              if (videoRef.current) {
                  videoRef.current.srcObject = stream;
              }
              setIsVideoOn(true);
          } catch (e) {
              console.error("Failed to access camera", e);
              setError("Could not access camera.");
          }
      }
  };

  const stopVideo = () => {
    if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach(track => track.stop());
        videoStreamRef.current = null;
    }
    setIsVideoOn(false);
  };

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    
    // Cancel current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    // Try to find a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha'));
    if (preferredVoice) utterance.voice = preferredVoice;
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
    
    setTranscript(prev => [...prev, { role: 'ai', text }]);
  };

  const toggleRecording = async () => {
     if (isRecording) {
         stopRecording();
     } else {
         startRecording();
     }
  };

  const startRecording = async () => {
     try {
         const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
         const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
         
         mediaRecorderRef.current = recorder;
         audioChunksRef.current = [];
         
         recorder.ondataavailable = (event) => {
             if (event.data.size > 0) {
                 audioChunksRef.current.push(event.data);
             }
         };
         
         recorder.onstop = processAudio;
         
         recorder.start();
         setIsRecording(true);
         
         // Cancel AI speech if user interrupts
         if (window.speechSynthesis) window.speechSynthesis.cancel();
         setIsSpeaking(false);
         
     } catch (e) {
         console.error("Mic error", e);
         setError("Could not access microphone.");
     }
  };

  const stopRecording = () => {
     if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
         mediaRecorderRef.current.stop();
         setIsRecording(false);
         
         // Stop tracks
         mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
     }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove data url prefix (e.g. "data:audio/webm;base64,")
        const base64 = base64String.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const processAudio = async () => {
      setIsProcessing(true);
      try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const base64Audio = await blobToBase64(audioBlob);
          
          setTranscript(prev => [...prev, { role: 'user', text: '(Audio Response)' }]);

          // Send to Gemini
          const context = `${resumeAnalysis?.summary}. Strengths: ${resumeAnalysis?.strengths.join(', ')}`;
          
          // Note: In a real turn-based system we'd send history, but generateContent with audio 
          // works best as a single prompt in the JS SDK unless using the ChatSession with multimodal history (advanced).
          // For this demo, we use a single turn response.
          const responseText = await generateInterviewResponse(base64Audio, context, []);
          
          speak(responseText);
          
      } catch (e: any) {
          console.error("Processing error", e);
          setError(e.message || "Failed to process audio.");
      } finally {
          setIsProcessing(false);
      }
  };

  if (!resumeAnalysis) {
      return (
        <Card className="flex flex-col items-center justify-center min-h-[400px] text-center p-12 bg-white shadow-none border border-slate-200 rounded-2xl">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-6">
             <Mic className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Resume Required</h3>
          <p className="text-slate-500 max-w-md">Please upload your resume first to start the interview simulation.</p>
        </Card>
      );
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-6">
         <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-display">Interview Sim</h1>
            <p className="text-slate-500 mt-2">Practice answering questions with an AI hiring manager.</p>
         </div>
         {isActive && (
             <Badge variant="success" className="bg-emerald-50 text-emerald-600 border-emerald-200">
                <div className="w-2 h-2 rounded-full bg-emerald-600 mr-2 animate-pulse" /> Active
             </Badge>
         )}
      </div>

      <Card className="flex-1 bg-slate-900 border-slate-800 relative overflow-hidden flex flex-col">
          {/* Main Visual Area */}
          <div className="flex-1 relative flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center">
             <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" />
             
             {/* AI Avatar / Visualization */}
             <div className="relative z-10 flex flex-col items-center gap-6">
                <div className={cn(
                    "w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 relative",
                    isSpeaking ? "bg-purple-600 shadow-[0_0_40px_-10px_rgba(147,51,234,0.5)] scale-110" : "bg-slate-700"
                )}>
                    {isSpeaking ? (
                        <>
                           <div className="absolute inset-0 rounded-full border-2 border-purple-400 opacity-50 animate-ping" style={{ animationDuration: '2s' }} />
                           <Volume2 className="w-12 h-12 text-white" />
                        </>
                    ) : (
                        <Mic className="w-12 h-12 text-slate-400" />
                    )}
                </div>
                
                <div className="text-center space-y-2 px-4">
                    <h3 className="text-2xl font-bold text-white">AI Interviewer</h3>
                    {transcript.length > 0 && (
                        <div className="max-w-md mx-auto h-16 flex items-center justify-center">
                           <p className="text-slate-300 text-sm italic line-clamp-2">
                              "{transcript[transcript.length - 1].text}"
                           </p>
                        </div>
                    )}
                </div>
             </div>
             
             {/* Self View (Video) */}
             <div className="absolute bottom-6 right-6 w-48 h-36 bg-black rounded-lg border border-slate-700 overflow-hidden shadow-xl">
                 {isVideoOn ? (
                     <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                 ) : (
                     <div className="w-full h-full flex items-center justify-center text-slate-600">
                         <VideoOff className="w-8 h-8" />
                     </div>
                 )}
                 <div className="absolute bottom-2 left-2 flex gap-2">
                      <div className={cn("w-2 h-2 rounded-full", isActive ? "bg-green-500" : "bg-red-50")} />
                 </div>
             </div>
          </div>

          {/* Controls Bar */}
          <div className="p-6 bg-slate-950 border-t border-slate-800 flex items-center justify-center gap-6 relative z-20">
              {!isActive ? (
                  <Button 
                    size="xl" 
                    onClick={startSession} 
                    className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20 rounded-full px-8"
                  >
                    <Play className="w-5 h-5 mr-2" /> Start Interview
                  </Button>
              ) : (
                  <>
                      {/* Record Button */}
                      <button 
                         onClick={toggleRecording}
                         disabled={isProcessing || isSpeaking}
                         className={cn(
                             "w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-xl border-4",
                             isRecording 
                                ? "bg-red-600 border-red-800 animate-pulse scale-110" 
                                : isProcessing 
                                   ? "bg-slate-700 border-slate-600 cursor-wait"
                                   : "bg-white text-slate-900 border-slate-200 hover:bg-slate-100"
                         )}
                      >
                          {isProcessing ? (
                              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                          ) : isRecording ? (
                              <div className="w-8 h-8 bg-white rounded-md" /> // Stop icon
                          ) : (
                              <Mic className="w-8 h-8" />
                          )}
                      </button>
                      
                      <button 
                         onClick={toggleVideo}
                         className={cn(
                             "absolute right-24 w-12 h-12 rounded-full flex items-center justify-center transition-all",
                             !isVideoOn ? "bg-slate-800 text-slate-400 hover:bg-slate-700" : "bg-slate-800 text-white hover:bg-slate-700"
                         )}
                      >
                          {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                      </button>

                      <button 
                         onClick={endSession}
                         className="absolute right-6 w-12 h-12 rounded-full bg-red-900/50 text-red-500 flex items-center justify-center hover:bg-red-900/80 transition-all"
                         title="End Interview"
                      >
                          <PhoneOff className="w-5 h-5" />
                      </button>
                  </>
              )}
          </div>
          
          {error && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 backdrop-blur-sm z-30">
                  <AlertCircle className="w-4 h-4" /> {error}
              </div>
          )}
      </Card>
      
      {isActive && (
          <div className="mt-4 text-center text-slate-500 text-sm">
             {isRecording ? "Listening... click to stop." : isProcessing ? "Thinking..." : isSpeaking ? "Interviewer speaking..." : "Click microphone to answer."}
          </div>
      )}
    </div>
  );
};

export default LiveInterview;