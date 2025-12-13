import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Award, Zap, TrendingUp, Lightbulb, ChevronRight, Hash, Clock, File } from 'lucide-react';
import { analyzeResume, generateImprovementExample } from '../services/gemini';
import { ResumeAnalysis, SavedResume } from '../types';
import { Button, Card } from './ui/DesignSystem';
import { cn } from '../lib/utils';

interface ResumeAnalyzerProps {
  analysisResult: ResumeAnalysis | null;
  onAnalysisComplete: (result: ResumeAnalysis) => void;
  onActivity: (title: string, meta: string) => void;
  savedResumes?: SavedResume[];
  onLoadResume?: (resume: SavedResume) => void;
}

const ResumeAnalyzer: React.FC<ResumeAnalyzerProps> = ({ 
  analysisResult, 
  onAnalysisComplete, 
  onActivity, 
  savedResumes = [], 
  onLoadResume 
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Interactive example state
  const [activeExampleIndex, setActiveExampleIndex] = useState<number | null>(null);
  const [exampleLoading, setExampleLoading] = useState(false);
  const [examples, setExamples] = useState<Record<number, string>>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setExamples({});
      setActiveExampleIndex(null);
      setError(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleAnalyze = async () => {
    if (!file || !preview) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const base64Data = preview.split(',')[1];
      const analysis = await analyzeResume(base64Data, file.type);
      
      const fullAnalysis: ResumeAnalysis = {
        ...analysis,
        file: {
            name: file.name,
            type: file.type,
            size: file.size,
            data: base64Data
        }
      };

      onAnalysisComplete(fullAnalysis);
      onActivity("Resume Analysis", `Scored ${analysis.score}/100`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to analyze resume. Please ensure it's a clear file.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleShowExample = async (index: number, improvement: string) => {
    if (activeExampleIndex === index) {
      setActiveExampleIndex(null);
      return;
    }
    
    setActiveExampleIndex(index);
    if (!examples[index]) {
      setExampleLoading(true);
      try {
        const example = await generateImprovementExample(improvement, analysisResult?.summary || "General Context");
        setExamples(prev => ({ ...prev, [index]: example }));
      } catch (err) {
        setExamples(prev => ({ ...prev, [index]: "Could not generate example." }));
      } finally {
        setExampleLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[calc(100vh-8rem)]">
      
      {/* LEFT SIDEBAR: Saved Resumes */}
      <div className="w-full lg:w-72 flex-none space-y-4">
         <Card className="h-full bg-white border-slate-200 p-0 overflow-hidden flex flex-col max-h-[600px] lg:max-h-full">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
               <h3 className="font-bold text-slate-900 flex items-center gap-2">
                 <Clock className="w-4 h-4 text-slate-500" />
                 History
               </h3>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-1">
               {savedResumes.length === 0 ? (
                 <div className="p-6 text-center text-slate-500 text-sm">
                   <p>No uploaded resumes yet.</p>
                 </div>
               ) : (
                 savedResumes.map((resume) => {
                   if (!resume.data) return null; // Safety check for bad data
                   return (
                     <button
                       key={resume.id}
                       onClick={() => onLoadResume && onLoadResume(resume)}
                       className={cn(
                         "w-full text-left p-3 rounded-lg text-sm transition-all border border-transparent",
                         analysisResult && analysisResult.summary === resume.data.summary // Simple equality check for active state
                           ? "bg-brand-50 border-brand-200 text-brand-700" 
                           : "hover:bg-slate-50 text-slate-700 hover:border-slate-200"
                       )}
                     >
                       <div className="flex items-start gap-3">
                          <div className="mt-1 w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-400 flex-none">
                             <File className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                             <p className="font-semibold truncate">{resume.data.file?.name || "Resume"}</p>
                             <p className="text-xs opacity-70 mt-0.5">
                               {new Date(resume.created_at).toLocaleDateString()}
                             </p>
                             <div className="mt-1 flex items-center gap-2">
                                <span className={cn(
                                  "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                                  resume.data.score > 80 ? "bg-emerald-100 text-emerald-700" :
                                  resume.data.score > 60 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                                )}>
                                  Score: {resume.data.score}
                                </span>
                             </div>
                          </div>
                       </div>
                     </button>
                   );
                 })
               )}
            </div>
         </Card>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 min-w-0 space-y-8 animate-in fade-in duration-500">
        <div className="text-center space-y-2 lg:text-left">
          <h2 className="text-3xl font-bold text-slate-900 font-display">Resume Optimizer</h2>
          <p className="text-slate-500 max-w-2xl">
            Upload your resume to get an AI-powered score and actionable feedback.
          </p>
        </div>

        {!analysisResult && (
          <div className="bg-slate-900 rounded-2xl shadow-sm border-2 border-dashed border-slate-700 p-12 text-center transition-all hover:border-brand-500 hover:bg-slate-900/80 group max-w-3xl mx-auto lg:mx-0">
            <input
              type="file"
              id="resume-upload"
              className="hidden"
              accept="image/png, image/jpeg, image/jpg, application/pdf"
              onChange={handleFileChange}
            />
            <label htmlFor="resume-upload" className="cursor-pointer flex flex-col items-center gap-4">
              {preview ? (
                <div className="relative group-hover:opacity-90 transition-opacity">
                  {file?.type === 'application/pdf' ? (
                    <div className="w-64 h-64 bg-slate-950 rounded-lg border border-slate-700 flex flex-col items-center justify-center p-4 shadow-lg">
                      <FileText className="w-16 h-16 text-red-500 mb-4" />
                      <p className="text-sm font-medium text-slate-300 text-center break-all line-clamp-3">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">PDF Document</p>
                    </div>
                  ) : (
                    <img src={preview} alt="Resume Preview" className="h-64 object-contain shadow-lg rounded-lg border border-slate-800" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white opacity-0 group-hover:opacity-100 rounded-lg transition-opacity font-medium">
                    Change File
                  </div>
                </div>
              ) : (
                <div className="w-20 h-20 bg-slate-800 text-brand-500 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-inner">
                  <Upload className="w-8 h-8" />
                </div>
              )}
              
              {!preview && (
                <>
                  <h3 className="text-xl font-semibold text-white">Click to Upload Resume</h3>
                  <p className="text-slate-500 text-sm">Supports PDF, JPG, PNG (Max 5MB)</p>
                </>
              )}
            </label>

            {file && !isAnalyzing && (
              <div className="mt-8">
                <button
                  onClick={handleAnalyze}
                  className="bg-brand-600 hover:bg-brand-500 text-white px-8 py-3 rounded-full font-semibold shadow-lg shadow-brand-900/20 transition-all hover:scale-105 flex items-center gap-2 mx-auto"
                >
                  <Zap className="w-5 h-5" />
                  Analyze Resume
                </button>
              </div>
            )}

            {isAnalyzing && (
              <div className="mt-8 flex flex-col items-center text-brand-400">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p className="font-medium">Reading and Analyzing...</p>
              </div>
            )}
            
            {error && (
                <div className="mt-6 p-4 bg-red-900/20 border border-red-500/50 rounded-xl text-red-200 text-sm max-w-lg mx-auto">
                    <p className="font-bold flex items-center justify-center gap-2 mb-1"><AlertCircle className="w-4 h-4" /> Analysis Failed</p>
                    <p>{error}</p>
                </div>
            )}
          </div>
        )}

        {analysisResult && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Action Bar for New Upload */}
            <div className="flex justify-end">
               <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                     // Reset state to show upload area
                     onAnalysisComplete(null as any); 
                     setFile(null); 
                     setPreview(null);
                  }}
                  className="gap-2"
               >
                 <Upload className="w-4 h-4" /> Upload New Version
               </Button>
            </div>

            {/* Score Card */}
            <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-6 flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-none relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-800" />
                  <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" 
                    strokeDasharray={351.86} 
                    strokeDashoffset={351.86 - (351.86 * analysisResult.score) / 100}
                    className={`transition-all duration-1000 ease-out ${analysisResult.score > 80 ? 'text-green-500' : analysisResult.score > 60 ? 'text-yellow-500' : 'text-red-500'}`} 
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  <span className="text-3xl font-bold">{analysisResult.score}</span>
                  <span className="text-xs uppercase tracking-wider text-slate-500">ATS Score</span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-2xl font-bold text-white">Executive Summary</h3>
                  <span className="bg-brand-900/30 text-brand-400 border border-brand-900/50 px-3 py-0.5 rounded-full text-sm font-semibold">AI Generated</span>
                </div>
                <p className="text-slate-400 leading-relaxed">{analysisResult.summary}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Strengths */}
              <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 p-6">
                <div className="flex items-center gap-2 mb-4 text-green-400">
                  <CheckCircle className="w-6 h-6" />
                  <h3 className="font-bold text-lg text-white">Strengths</h3>
                </div>
                <ul className="space-y-3">
                  {analysisResult.strengths.map((item, i) => (
                    <li key={i} className="flex gap-3 text-slate-300 text-sm">
                      <span className="flex-none w-1.5 h-1.5 rounded-full bg-green-500 mt-2" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 p-6">
                <div className="flex items-center gap-2 mb-4 text-amber-400">
                  <AlertCircle className="w-6 h-6" />
                  <h3 className="font-bold text-lg text-white">ATS Gaps</h3>
                </div>
                <ul className="space-y-3">
                  {analysisResult.weaknesses.map((item, i) => (
                    <li key={i} className="flex gap-3 text-slate-300 text-sm">
                      <span className="flex-none w-1.5 h-1.5 rounded-full bg-amber-500 mt-2" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Improvements with Interactive Examples */}
              <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 p-6">
                <div className="flex items-center gap-2 mb-4 text-brand-400">
                  <TrendingUp className="w-6 h-6" />
                  <h3 className="font-bold text-lg text-white">Improvements</h3>
                </div>
                <ul className="space-y-4">
                  {analysisResult.improvements.map((item, i) => (
                    <li key={i} className="text-slate-300 text-sm">
                      <div className="flex gap-3 mb-2">
                        <span className="flex-none w-1.5 h-1.5 rounded-full bg-brand-500 mt-2" />
                        <span>{item}</span>
                      </div>
                      
                      <button
                        onClick={() => handleShowExample(i, item)}
                        className="ml-5 text-brand-400 text-xs font-semibold flex items-center gap-1 hover:text-brand-300 transition-colors"
                      >
                        <Lightbulb className="w-3 h-3" />
                        {activeExampleIndex === i ? 'Hide Example' : 'See Example'}
                        <ChevronRight className={`w-3 h-3 transition-transform ${activeExampleIndex === i ? 'rotate-90' : ''}`} />
                      </button>

                      {activeExampleIndex === i && (
                        <div className="ml-5 mt-2 p-3 bg-slate-950 border border-slate-800 rounded-lg animate-in slide-in-from-top-2">
                          {exampleLoading && !examples[i] ? (
                            <div className="flex items-center gap-2 text-slate-500">
                              <Loader2 className="w-3 h-3 animate-spin" /> Generating...
                            </div>
                          ) : (
                            <div className="text-slate-400 italic">
                              "{examples[i]}"
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Detected Skills - NEW SECTION */}
              <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 p-6">
                <div className="flex items-center gap-2 mb-4 text-purple-400">
                  <Hash className="w-6 h-6" />
                  <h3 className="font-bold text-lg text-white">Detected Skills</h3>
                </div>
                <div className="space-y-4">
                  <p className="text-slate-400 text-xs">These skills were extracted from your resume and are used to personalize job matches and recommendations.</p>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.skills && analysisResult.skills.length > 0 ? (
                      analysisResult.skills.map((skill, i) => (
                        <span key={i} className="bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-700 hover:border-purple-500 hover:text-white transition-colors cursor-default">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-slate-500 text-sm italic">No specific technical skills detected in this pass.</p>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeAnalyzer;