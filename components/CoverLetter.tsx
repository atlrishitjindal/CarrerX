import React, { useState } from 'react';
import { Mail, Loader2, Copy, Check, FileText, ArrowRight } from 'lucide-react';
import { ResumeAnalysis } from '../types';
import { generateCoverLetter } from '../services/gemini';
import { Card, Button, Textarea } from './ui/DesignSystem';

interface CoverLetterProps {
  resumeAnalysis: ResumeAnalysis | null;
  onActivity: (title: string, meta: string) => void;
}

const CoverLetter: React.FC<CoverLetterProps> = ({ resumeAnalysis, onActivity }) => {
  const [jobDescription, setJobDescription] = useState('');
  const [generatedLetter, setGeneratedLetter] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!resumeAnalysis || !jobDescription.trim()) return;
    
    setIsGenerating(true);
    try {
      const letter = await generateCoverLetter(resumeAnalysis.summary, jobDescription);
      setGeneratedLetter(letter);
      onActivity("Cover Letter", "Generated letter for new role");
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!resumeAnalysis) {
    return (
      <Card className="flex flex-col items-center justify-center min-h-[400px] text-center p-12 shadow-none border border-slate-200">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-6">
           <Mail className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Resume Required</h3>
        <p className="text-slate-500 max-w-md">Please upload your resume first. We use it to personalize your cover letter.</p>
      </Card>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8 h-[calc(100vh-8rem)]">
      {/* Input Side */}
      <div className="flex flex-col space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2 font-display">Cover Letter Writer</h2>
          <p className="text-slate-500">Paste the job description below. We'll craft a compelling story connecting your resume to their requirements.</p>
        </div>

        <Card className="flex-1 flex flex-col p-1 shadow-sm">
           <div className="p-3 border-b border-slate-100 bg-slate-50 rounded-t-lg">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Job Description</label>
           </div>
           <Textarea
             value={jobDescription}
             onChange={(e) => setJobDescription(e.target.value)}
             className="flex-1 w-full border-0 focus:ring-0 resize-none p-4 text-base rounded-b-lg"
             placeholder="Paste the full job listing here..."
           />
        </Card>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !jobDescription.trim()}
          size="lg"
          className="w-full shadow-lg shadow-brand-600/20"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Writing your letter...
            </>
          ) : (
            <>
              Generate Letter <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Output Side */}
      <div className="flex flex-col h-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500">
             <FileText className="w-4 h-4" />
             <span className="text-sm font-medium">Draft Preview</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={copyToClipboard}
            disabled={!generatedLetter}
            className={copied ? "text-emerald-600 bg-emerald-50" : ""}
          >
            {copied ? <><Check className="w-4 h-4 mr-2" /> Copied</> : <><Copy className="w-4 h-4 mr-2" /> Copy Text</>}
          </Button>
        </div>
        
        <div className="flex-1 p-8 overflow-y-auto bg-white">
          {generatedLetter ? (
            <div className="prose prose-slate max-w-none prose-p:leading-relaxed whitespace-pre-wrap font-serif text-slate-800">
              {generatedLetter}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <div className="w-16 h-16 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center mb-4">
                 <Mail className="w-6 h-6 opacity-40" />
              </div>
              <p>Your generated letter will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoverLetter;