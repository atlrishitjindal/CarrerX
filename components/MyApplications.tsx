import React from 'react';
import { Calendar, MapPin, DollarSign, Building, ExternalLink, Clock, CheckCircle, Crown, XCircle, Video, Briefcase } from 'lucide-react';
import { Application, Job, UserRole } from '../types';
import { motion } from 'framer-motion';
import { Card, Badge, Button } from './ui/DesignSystem';
import { containerVariants, itemVariants, cn } from '../lib/utils';

interface MyApplicationsProps {
  applications: Application[];
  jobs: Job[];
  userEmail: string;
}

const MyApplications: React.FC<MyApplicationsProps> = ({ applications, jobs, userEmail }) => {
  const myApps = applications.filter(app => app.candidateEmail === userEmail);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-display">My Applications</h1>
        <p className="text-slate-500 mt-2">Track status, manage interviews, and review your job submissions.</p>
      </div>

      {myApps.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 bg-slate-50 border-dashed">
           <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
              <Briefcase className="w-8 h-8 text-slate-400" />
           </div>
           <h3 className="text-lg font-bold text-slate-900">No Applications Yet</h3>
           <p className="text-slate-500 text-center max-w-sm mt-2">
             Start exploring job matches to find your next role.
           </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {myApps.map((app) => {
            const job = jobs.find(j => j.id === app.jobId);
            const isInterview = app.status === 'Interview';
            const isShortlisted = app.status === 'Shortlisted';
            
            return (
              <motion.div key={app.id} variants={itemVariants}>
                <Card className={cn(
                    "overflow-hidden transition-all duration-300 hover:shadow-md",
                    isShortlisted ? "border-purple-200 bg-purple-50/30" : "border-slate-200"
                )}>
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      
                      {/* Job Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                           <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-xl font-bold text-slate-900 font-display">{app.jobTitle}</h3>
                                {isShortlisted && (
                                   <Badge variant="brand" className="animate-pulse">
                                      <Crown className="w-3 h-3 mr-1" /> Shortlisted
                                   </Badge>
                                )}
                              </div>
                              <p className="text-slate-600 font-medium flex items-center gap-2">
                                 <Building className="w-4 h-4 text-slate-400" /> 
                                 {job?.company || "Company Name"}
                              </p>
                           </div>
                           <Badge variant={
                             app.status === 'Shortlisted' ? 'brand' :
                             app.status === 'Interview' ? 'success' :
                             app.status === 'Rejected' ? 'error' : 'neutral'
                           } className="md:hidden">
                             {app.status}
                           </Badge>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-slate-500 mt-3">
                           {job?.location && (
                             <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {job.location}</span>
                           )}
                           {job?.salary && (
                             <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> {job.salary}</span>
                           )}
                           <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Applied {new Date(app.timestamp).toLocaleDateString()}</span>
                        </div>
                        
                        {job?.description && (
                           <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm text-slate-600 border border-slate-100">
                              <p className="line-clamp-2">{job.description}</p>
                           </div>
                        )}
                      </div>

                      {/* Status & Actions Column */}
                      <div className="flex-none md:w-72 flex flex-col gap-3 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                        <div className="hidden md:flex justify-end mb-2">
                           <Badge variant={
                             app.status === 'Shortlisted' ? 'brand' :
                             app.status === 'Interview' ? 'success' :
                             app.status === 'Rejected' ? 'error' : 'neutral'
                           } className="px-3 py-1 text-sm">
                             {app.status}
                           </Badge>
                        </div>

                        {isInterview && app.interviewDate ? (
                          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 space-y-3">
                             <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                                <Video className="w-4 h-4" /> Interview Scheduled
                             </div>
                             <div className="text-xs text-emerald-700 space-y-1">
                                <p>{new Date(app.interviewDate).toLocaleDateString(undefined, {weekday: 'long', month: 'long', day: 'numeric'})}</p>
                                <p>{new Date(app.interviewDate).toLocaleTimeString(undefined, {hour: 'numeric', minute: '2-digit'})}</p>
                             </div>
                             {app.meetingLink && (
                               <a href={app.meetingLink} target="_blank" rel="noopener noreferrer" className="block">
                                 <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white border-transparent">
                                    Join Meeting <ExternalLink className="w-3 h-3 ml-2" />
                                 </Button>
                               </a>
                             )}
                          </div>
                        ) : isShortlisted ? (
                           <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                              <p className="text-sm text-purple-800 font-medium leading-relaxed">
                                 Great news! You've been shortlisted. The employer will contact you soon for the next steps.
                              </p>
                           </div>
                        ) : app.status === 'Rejected' ? (
                           <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center gap-3 text-slate-500 text-sm">
                              <XCircle className="w-5 h-5 text-slate-400" />
                              <p>Application closed.</p>
                           </div>
                        ) : (
                           <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center gap-3 text-slate-500 text-sm">
                              <CheckCircle className="w-5 h-5 text-blue-400" />
                              <p>Application sent. Waiting for review.</p>
                           </div>
                        )}
                      </div>

                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default MyApplications;