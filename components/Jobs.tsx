import React, { useState, useMemo, useEffect } from 'react';
import { Briefcase, MapPin, DollarSign, Loader2, Sparkles, AlertTriangle, Search, CheckCircle, RefreshCw, Filter, Users, Eye, Plus, X } from 'lucide-react';
import { Job, JobMatchResult, ResumeAnalysis, UserRole, Application } from '../types';
import { analyzeJobMatch, generateTailoredJobs } from '../services/gemini';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Button, Badge, Input, Textarea } from './ui/DesignSystem';
import { cn, containerVariants, itemVariants } from '../lib/utils';

interface JobsProps {
  resumeAnalysis: ResumeAnalysis | null;
  onActivity: (title: string, meta: string) => void;
  jobs: Job[];
  setJobs: React.Dispatch<React.SetStateAction<Job[]>>;
  onApply: (job: Job) => void;
  appliedJobIds: Set<string>;
  userRole?: UserRole;
  applications?: Application[];
  onPostJob?: (job: Job) => void;
}

const Jobs: React.FC<JobsProps> = ({ resumeAnalysis, onActivity, jobs, setJobs, onApply, appliedJobIds, userRole = 'candidate', applications = [], onPostJob }) => {
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, JobMatchResult>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [isGeneratingJobs, setIsGeneratingJobs] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  
  // Employer Job Posting State
  const [isPosting, setIsPosting] = useState(false);
  const [newJob, setNewJob] = useState<Partial<Job>>({
    title: '',
    company: '',
    location: '',
    salary: '',
    type: 'Full-time',
    description: '',
    requirements: []
  });
  const [reqInput, setReqInput] = useState('');

  const isEmployer = userRole === 'employer';

  // Initial generation only if empty and user is candidate
  useEffect(() => {
    if (!isEmployer && resumeAnalysis && jobs.length === 0 && !isGeneratingJobs) {
      handleGenerateJobs();
    }
  }, [resumeAnalysis, isEmployer]);

  const handleGenerateJobs = async () => {
    if (!resumeAnalysis) return;
    setIsGeneratingJobs(true);
    // Don't clear immediately to keep UI stable
    try {
      const tailoredJobs = await generateTailoredJobs(resumeAnalysis.summary, resumeAnalysis.skills || []);
      
      // Merge with Global Jobs (Employer Posted)
      const globalJobsStr = localStorage.getItem('carrerx_global_jobs');
      const globalJobs: Job[] = globalJobsStr ? JSON.parse(globalJobsStr) : [];
      
      // We prioritize Global jobs, then new tailored AI jobs
      setJobs([...globalJobs, ...tailoredJobs]);
      
      onActivity("Job Search", `Found ${tailoredJobs.length} roles`);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingJobs(false);
    }
  };

  const filteredAndSortedJobs = useMemo(() => {
    let result = [...jobs];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(job => 
        job.title.toLowerCase().includes(q) || 
        job.company.toLowerCase().includes(q)
      );
    }
    if (filterType !== 'All') {
      result = result.filter(job => job.type === filterType);
    }
    return result;
  }, [jobs, searchQuery, filterType]);

  const handleAnalyzeFit = async (job: Job) => {
    if (!resumeAnalysis) return;
    setAnalyzingId(job.id);
    try {
      const result = await analyzeJobMatch(resumeAnalysis.summary, resumeAnalysis.skills || [], job.description);
      setMatches(prev => ({ ...prev, [job.id]: result }));
      onActivity("Job Analysis", `Analyzed ${job.company}`);
    } catch (error) {
      console.error(error);
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleApplyClick = async (job: Job) => {
    setApplyingId(job.id);
    // Simulate network delay for application process
    await new Promise(resolve => setTimeout(resolve, 1000));
    onApply(job);
    setApplyingId(null);
  };

  const handleAddRequirement = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && reqInput.trim()) {
      e.preventDefault();
      setNewJob(prev => ({ ...prev, requirements: [...(prev.requirements || []), reqInput.trim()] }));
      setReqInput('');
    }
  };

  const handleSubmitJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (onPostJob && newJob.title && newJob.company) {
       onPostJob({
         id: Date.now().toString(),
         title: newJob.title!,
         company: newJob.company!,
         location: newJob.location || 'Remote',
         salary: newJob.salary || 'Competitive',
         type: newJob.type || 'Full-time',
         description: newJob.description || '',
         requirements: newJob.requirements || [],
         postedAt: 'Just now'
       });
       setIsPosting(false);
       setNewJob({ title: '', company: '', location: '', salary: '', type: 'Full-time', description: '', requirements: [] });
    }
  };

  if (!isEmployer && !resumeAnalysis) {
    return (
      <Card className="flex flex-col items-center justify-center min-h-[400px] text-center p-12 bg-white shadow-none border border-slate-200 rounded-2xl">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-6">
           <Briefcase className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Resume Required</h3>
        <p className="text-slate-500 max-w-md">We need to know your skills to find the perfect job matches. Please upload your resume first.</p>
      </Card>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      
      {/* Job Posting Modal/Overlay */}
      <AnimatePresence>
        {isPosting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <h2 className="text-xl font-bold text-slate-900">Post New Job</h2>
                <button onClick={() => setIsPosting(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSubmitJob} className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Job Title</label>
                    <Input required value={newJob.title} onChange={e => setNewJob({...newJob, title: e.target.value})} placeholder="e.g. Senior Product Manager" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Company</label>
                    <Input required value={newJob.company} onChange={e => setNewJob({...newJob, company: e.target.value})} placeholder="Company Name" />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Location</label>
                    <Input value={newJob.location} onChange={e => setNewJob({...newJob, location: e.target.value})} placeholder="e.g. New York, NY" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Salary Range</label>
                    <Input value={newJob.salary} onChange={e => setNewJob({...newJob, salary: e.target.value})} placeholder="e.g. $120k - $150k" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Type</label>
                    <select 
                      className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                      value={newJob.type}
                      onChange={e => setNewJob({...newJob, type: e.target.value})}
                    >
                      <option>Full-time</option>
                      <option>Contract</option>
                      <option>Part-time</option>
                      <option>Remote</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                   <label className="text-sm font-semibold text-slate-700">Description</label>
                   <Textarea required value={newJob.description} onChange={e => setNewJob({...newJob, description: e.target.value})} placeholder="Describe the role responsibilities and culture..." className="min-h-[120px]" />
                </div>

                <div className="space-y-2">
                   <label className="text-sm font-semibold text-slate-700">Requirements (Press Enter to add)</label>
                   <Input 
                     value={reqInput} 
                     onChange={e => setReqInput(e.target.value)} 
                     onKeyDown={handleAddRequirement} 
                     placeholder="Type a skill and press Enter" 
                   />
                   <div className="flex flex-wrap gap-2 mt-2">
                     {newJob.requirements?.map((req, i) => (
                       <Badge key={i} variant="brand" className="flex items-center gap-1 pr-1">
                         {req} <button type="button" onClick={() => setNewJob(prev => ({...prev, requirements: prev.requirements?.filter((_, idx) => idx !== i)}))} className="hover:text-red-600"><X className="w-3 h-3" /></button>
                       </Badge>
                     ))}
                   </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={() => setIsPosting(false)}>Cancel</Button>
                  <Button type="submit" variant="primary" className="bg-purple-600 hover:bg-purple-700">Create Listing</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header & Controls */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-display">
              {isEmployer ? "Posted Jobs" : "Job Matches"}
            </h2>
            <p className="text-slate-500">
              {isEmployer 
                ? `You have ${jobs.length} active listings.` 
                : `Curated opportunities based on your ${resumeAnalysis?.skills?.length || 0} skills.`
              }
            </p>
          </div>
          {isEmployer ? (
             <Button onClick={() => setIsPosting(true)} variant="primary" className="bg-purple-600 hover:bg-purple-700 gap-2">
               <Plus className="w-4 h-4" /> Post New Job
             </Button>
          ) : (
            <Button onClick={handleGenerateJobs} disabled={isGeneratingJobs} variant="outline" className="gap-2">
              <RefreshCw className={cn("w-4 h-4", isGeneratingJobs && "animate-spin")} /> Refresh Feed
            </Button>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by job title or company..."
              className="pl-10"
            />
          </div>
          <div className="relative min-w-[180px]">
             <Filter className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
             <select 
               value={filterType}
               onChange={(e) => setFilterType(e.target.value)}
               className="h-11 w-full bg-white border border-slate-300 rounded-lg pl-10 pr-4 text-sm text-slate-700 focus:ring-2 focus:ring-brand-500/20 outline-none appearance-none"
             >
               <option value="All">All Job Types</option>
               <option value="Full-time">Full-time</option>
               <option value="Contract">Contract</option>
               <option value="Remote">Remote</option>
             </select>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {isGeneratingJobs ? (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
             <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-brand-600" />
             <h3 className="text-lg font-semibold text-slate-900">Scanning Top Job Boards...</h3>
             <p className="text-slate-500">Finding roles that match your expertise.</p>
          </div>
        ) : filteredAndSortedJobs.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
             {isEmployer ? "You haven't posted any jobs yet." : "No jobs found matching your criteria."}
          </div>
        ) : (
          filteredAndSortedJobs.map((job) => {
            const applicantCount = applications.filter(a => a.jobId === job.id).length;
            return (
              <motion.div key={job.id} variants={itemVariants}>
                <Card className="hover:border-brand-300 hover:shadow-md transition-all group overflow-hidden border-l-4 border-l-transparent hover:border-l-brand-500">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-600 transition-colors font-display">{job.title}</h3>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 mt-1">
                            <span className="font-semibold text-slate-700">{job.company}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {job.location}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> {job.salary}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span>{job.postedAt}</span>
                          </div>
                        </div>
                        
                        <p className="text-slate-600 text-sm leading-relaxed max-w-3xl">{job.description}</p>
                        
                        <div className="flex flex-wrap gap-2 pt-2">
                          {job.requirements.slice(0, 4).map((r, i) => (
                            <Badge key={i} variant="neutral" className="bg-slate-100 text-slate-600">{r}</Badge>
                          ))}
                          <Badge variant="brand" className="bg-brand-50 text-brand-700 border-brand-100">{job.type}</Badge>
                        </div>
                      </div>

                      <div className="flex-none flex flex-row md:flex-col items-center md:items-end gap-3 justify-between md:justify-start min-w-[160px] border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                        {isEmployer ? (
                          // EMPLOYER ACTIONS
                          <div className="flex flex-col gap-2 w-full md:items-end">
                            <div className="text-center md:text-right mb-2">
                               <div className="text-2xl font-bold text-slate-900">{applicantCount}</div>
                               <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Applicants</div>
                            </div>
                            <Button variant="outline" size="sm" className="w-full">
                               <Eye className="w-4 h-4 mr-2" /> Edit Job
                            </Button>
                          </div>
                        ) : (
                          // CANDIDATE ACTIONS
                          <>
                            {matches[job.id] ? (
                              <div className={cn(
                                "flex flex-col items-center md:items-end justify-center p-3 rounded-lg border w-full text-center md:text-right",
                                matches[job.id].matchScore >= 80 ? "bg-emerald-50 border-emerald-100 text-emerald-700" :
                                matches[job.id].matchScore >= 60 ? "bg-amber-50 border-amber-100 text-amber-700" :
                                "bg-red-50 border-red-100 text-red-700"
                              )}>
                                <span className="text-3xl font-bold tracking-tight">{matches[job.id].matchScore}%</span>
                                <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">Fit Score</span>
                              </div>
                            ) : (
                              <Button onClick={() => handleAnalyzeFit(job)} disabled={analyzingId === job.id} variant="primary" className="w-full">
                                {analyzingId === job.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4 mr-2" /> Analyze Fit</>}
                              </Button>
                            )}
                            
                            <Button 
                              onClick={() => handleApplyClick(job)}
                              disabled={appliedJobIds.has(job.id) || applyingId === job.id}
                              variant={appliedJobIds.has(job.id) ? "secondary" : "outline"} 
                              size="sm" 
                              className={cn("w-full transition-all duration-300", appliedJobIds.has(job.id) && "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-700")}
                            >
                              {appliedJobIds.has(job.id) ? (
                                <><CheckCircle className="w-4 h-4 mr-2" /> Applied</>
                              ) : applyingId === job.id ? (
                                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Applying...</>
                              ) : (
                                "Apply Now"
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {!isEmployer && matches[job.id] && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="bg-slate-50 border-t border-slate-200 px-6 py-4">
                      <div className="grid md:grid-cols-2 gap-6 text-sm">
                        <div>
                          <h4 className="font-bold text-emerald-700 text-xs uppercase tracking-wide mb-2">Why you're a match</h4>
                          <ul className="space-y-2">
                            {matches[job.id].pros.map((p, i) => (
                              <li key={i} className="flex gap-2 text-slate-700"><CheckCircle className="w-4 h-4 text-emerald-500 flex-none mt-0.5" /> {p}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-bold text-amber-700 text-xs uppercase tracking-wide mb-2">Missing Skills</h4>
                          <ul className="space-y-2">
                            {matches[job.id].missingKeywords.map((k, i) => (
                              <li key={i} className="flex gap-2 text-slate-700"><AlertTriangle className="w-4 h-4 text-amber-500 flex-none mt-0.5" /> Missing: <span className="font-medium text-slate-900">{k}</span></li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};

export default Jobs;