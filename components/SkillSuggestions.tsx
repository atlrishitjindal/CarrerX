import React, { useState, useEffect } from 'react';
import { GraduationCap, ExternalLink, Loader2, BookOpen, Search, ArrowRight, Zap, Target, PlayCircle } from 'lucide-react';
import { ResumeAnalysis, SkillSuggestion } from '../types';
import { suggestSkills } from '../services/gemini';
import { motion } from 'framer-motion';
import { Card, Button, Badge, Input } from './ui/DesignSystem';
import { containerVariants, itemVariants, cn } from '../lib/utils';

interface SkillSuggestionsProps {
  resumeAnalysis: ResumeAnalysis | null;
  onActivity: (title: string, meta: string) => void;
}

const SkillSuggestions: React.FC<SkillSuggestionsProps> = ({ resumeAnalysis, onActivity }) => {
  const [skills, setSkills] = useState<SkillSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [manualRole, setManualRole] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);

  useEffect(() => {
    if (resumeAnalysis && !hasGenerated && skills.length === 0) {
      generateSuggestions(resumeAnalysis.skills || [], resumeAnalysis.summary);
    }
  }, [resumeAnalysis]);

  const generateSuggestions = async (currentSkills: string[], context: string) => {
    setLoading(true);
    try {
      const suggestions = await suggestSkills(currentSkills, context);
      setSkills(suggestions);
      setHasGenerated(true);
      onActivity("Skill Suggestions", `Found ${suggestions.length} new skills to learn`);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualRole.trim()) {
      generateSuggestions([], `Target Role: ${manualRole}`);
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Beginner': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Intermediate': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Advanced': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  if (!resumeAnalysis && !hasGenerated && !loading) {
    return (
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-xl mx-auto py-12"
      >
        <Card className="p-8 text-center space-y-6 shadow-lg shadow-brand-500/5 border-slate-200">
          <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4 transform rotate-3">
             <GraduationCap className="w-8 h-8 text-brand-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 font-display">Skill Explorer</h2>
            <p className="text-slate-500 mt-2">
              Upload your resume for personalized recommendations, or enter your target role below to see what skills are in demand.
            </p>
          </div>
          
          <form onSubmit={handleManualSearch} className="relative">
            <Input 
              value={manualRole}
              onChange={(e) => setManualRole(e.target.value)}
              placeholder="E.g. Full Stack Developer, Product Manager"
              className="pr-32 py-6 text-lg"
            />
            <div className="absolute right-2 top-2 bottom-2">
               <Button type="submit" disabled={!manualRole.trim()} className="h-full px-6">
                 Explore
               </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants} 
      initial="hidden" 
      animate="visible" 
      className="space-y-8 max-w-7xl mx-auto"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-display">Skill Suggestions</h1>
          <p className="text-slate-500 mt-2">
            Upskill to advance your career. Based on your {resumeAnalysis ? "resume profile" : "target role"}.
          </p>
        </div>
        <div className="flex gap-3">
           <Button variant="outline" onClick={() => generateSuggestions(resumeAnalysis?.skills || [], manualRole || resumeAnalysis?.summary || "")}>
             <Zap className="w-4 h-4 mr-2" /> Refresh
           </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
           {[1, 2, 3, 4, 5, 6].map((i) => (
             <Card key={i} className="h-48 animate-pulse bg-slate-50 border-slate-100 shadow-none">
               <div className="h-6 bg-slate-200 rounded w-1/2 mb-4"></div>
               <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
               <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
               <div className="mt-auto h-10 bg-slate-200 rounded w-full"></div>
             </Card>
           ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skills.map((item, idx) => (
            <motion.div key={idx} variants={itemVariants}>
              <Card className="h-full flex flex-col p-6 hover:shadow-lg transition-all duration-300 border-t-4 border-t-transparent hover:border-t-brand-500 group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                    {item.category === 'Technical' ? <Target className="w-5 h-5" /> : 
                     item.category === 'Soft Skill' ? <BookOpen className="w-5 h-5" /> : 
                     <Zap className="w-5 h-5" />}
                  </div>
                  <Badge className={cn(getDifficultyColor(item.difficulty))}>
                    {item.difficulty}
                  </Badge>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-brand-600 transition-colors">
                  {item.skill}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-1">
                  {item.reason}
                </p>

                <div className="mt-auto space-y-3 pt-4 border-t border-slate-100">
                   <div className="flex flex-wrap gap-2 mb-2">
                      <Badge variant="neutral" className="bg-slate-50">{item.category}</Badge>
                   </div>
                   
                   <div className="grid grid-cols-1 gap-2">
                     <a 
                       href={`https://www.google.com/search?q=${encodeURIComponent(item.searchQuery)}`} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="block w-full"
                     >
                       <Button variant="secondary" className="w-full justify-between group/btn hover:border-brand-300 hover:text-brand-700 shadow-sm">
                         Find Courses <ExternalLink className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                       </Button>
                     </a>
                     
                     <a 
                       href={`https://www.youtube.com/results?search_query=${encodeURIComponent(item.skill + " course")}`} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="block w-full"
                     >
                       <Button variant="ghost" size="sm" className="w-full justify-center text-slate-500 hover:text-red-600 hover:bg-red-50">
                         <PlayCircle className="w-4 h-4 mr-2" /> Video Tutorials
                       </Button>
                     </a>
                   </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default SkillSuggestions;