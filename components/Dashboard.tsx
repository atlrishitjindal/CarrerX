import React from 'react';
import { Mic, FileText, Briefcase, Mail, Clock, Star, Zap, Activity, ChevronRight, Plus, Crown, Users, TrendingUp, Search, UserCheck, Calendar } from 'lucide-react';
import { AppView, ResumeAnalysis, ActivityLog, UserRole, Application, Job } from '../types';
import { motion } from 'framer-motion';
import { Card, Button, Badge } from './ui/DesignSystem';
import { containerVariants, itemVariants, cn } from '../lib/utils';

interface DashboardProps {
  user: { name: string; email: string; role?: UserRole };
  setCurrentView: (view: AppView) => void;
  resumeAnalysis: ResumeAnalysis | null;
  activities: ActivityLog[];
  applications?: Application[];
  jobs?: Job[];
}

const Dashboard: React.FC<DashboardProps> = ({ user, setCurrentView, resumeAnalysis, activities, applications = [], jobs = [] }) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const isEmployer = user.role === 'employer';

  // --- EMPLOYER DASHBOARD ---
  if (isEmployer) {
     const newApplicantsCount = applications.filter(a => a.status === 'New').length;
     const avgMatchScore = applications.length > 0 
        ? Math.round(applications.reduce((acc, curr) => acc + curr.matchScore, 0) / applications.length) 
        : 0;

     return (
       <motion.div 
         variants={containerVariants}
         initial="hidden"
         animate="visible"
         className="max-w-7xl mx-auto space-y-8"
       >
         {/* Header */}
         <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
           <div>
             <div className="flex items-center gap-3 mb-2">
                <Badge variant="brand" className="bg-purple-50 text-purple-700 border-purple-200">Employer Workspace</Badge>
             </div>
             <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">
               {getGreeting()}, <span className="text-purple-600 capitalize">{user.name}</span>
             </h1>
             <p className="text-slate-500 mt-2 text-base">Manage your talent pipeline and open positions.</p>
           </div>
           <div className="flex gap-3">
             <Button onClick={() => setCurrentView(AppView.JOBS)} variant="secondary" className="shadow-sm">
               <Briefcase className="w-4 h-4 mr-2" /> View Jobs
             </Button>
             <Button onClick={() => {}} variant="primary" className="bg-purple-600 hover:bg-purple-700 shadow-purple-600/20">
                <Plus className="w-4 h-4 mr-2" /> Post Job
             </Button>
           </div>
         </motion.div>
   
         {/* Employer Stats Grid */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
           <StatCard 
             title="Active Jobs" 
             value={jobs.length.toString()} 
             icon={<Briefcase className="w-5 h-5 text-purple-600" />}
             desc={jobs.length > 0 ? "Open positions" : "No active jobs"}
             variant="purple"
           />
           <StatCard 
             title="Applicants" 
             value={applications.length.toString()}
             suffix={newApplicantsCount > 0 ? `+${newApplicantsCount} new` : ""}
             icon={<Users className="w-5 h-5 text-blue-600" />}
             desc="Total candidates"
             variant="info"
           />
           <StatCard 
             title="Interviews Set" 
             value={applications.filter(a => a.status === 'Interview').length.toString()} 
             icon={<Clock className="w-5 h-5 text-orange-600" />}
             desc="Scheduled"
             variant="warning"
           />
           <StatCard 
             title="Avg. Match Score" 
             value={avgMatchScore > 0 ? `${avgMatchScore}%` : "--"}
             icon={<Star className="w-5 h-5 text-emerald-600" />}
             desc="Candidate quality"
             variant="success"
           />
         </div>
   
         <div className="grid lg:grid-cols-3 gap-8">
           {/* Main Content Area */}
           <motion.div variants={itemVariants} className="lg:col-span-2 space-y-8">
             
             {/* Recent Applicants */}
             <section>
               <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900 font-display">Recent Applicants</h3>
                  <Button variant="ghost" size="sm" className="text-purple-600">View All</Button>
               </div>
               <Card className="p-0 overflow-hidden min-h-[200px]">
                  {applications.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Users className="w-6 h-6 text-slate-300" />
                      </div>
                      <p>No applications received yet.</p>
                      <p className="text-xs mt-1">Candidates applying to your jobs will appear here.</p>
                    </div>
                  ) : (
                    applications.slice(0, 5).map((app, i) => (
                      <div key={app.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group border-b border-slate-100 last:border-0">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200 capitalize">
                               {app.candidateName.charAt(0)}
                            </div>
                            <div>
                               <h4 className="font-semibold text-slate-900 group-hover:text-purple-600 transition-colors capitalize">{app.candidateName}</h4>
                               <p className="text-xs text-slate-500">Applied for <span className="font-medium">{app.jobTitle}</span></p>
                            </div>
                         </div>
                         <div className="flex items-center gap-4">
                            <Badge variant={app.matchScore > 80 ? 'success' : app.matchScore > 60 ? 'warning' : 'neutral'}>
                              Match: {app.matchScore}%
                            </Badge>
                            <Button size="sm" variant="secondary">Review</Button>
                         </div>
                      </div>
                    ))
                  )}
               </Card>
             </section>
           </motion.div>
   
           {/* Sidebar Feed */}
           <motion.div variants={itemVariants} className="space-y-6">
             <section>
                <h3 className="text-lg font-bold text-slate-900 font-display mb-4">Pipeline Activity</h3>
                <Card className="p-0">
                   <div className="divide-y divide-slate-100">
                     {applications.length > 0 ? (
                        applications.slice(0, 5).map((app, i) => (
                           <div key={i} className="p-4 hover:bg-slate-50 transition-colors group">
                             <div className="flex items-start gap-3">
                               <div className="mt-0.5 w-2 h-2 rounded-full flex-none bg-blue-500" />
                               <div>
                                 <h4 className="text-sm font-semibold text-slate-900">New Application</h4>
                                 <p className="text-xs text-slate-500 mt-0.5"><span className="capitalize">{app.candidateName}</span> for {app.jobTitle}</p>
                                 <span className="text-[10px] text-slate-400 mt-2 block">
                                   {new Date(app.timestamp).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})}
                                 </span>
                               </div>
                            </div>
                           </div>
                        ))
                     ) : (
                        <div className="p-4 text-center text-xs text-slate-400">No activity yet</div>
                     )}
                   </div>
                </Card>
             </section>
           </motion.div>
         </div>
       </motion.div>
     );
  }

  // --- CANDIDATE DASHBOARD ---
  const jobsAnalyzed = activities.filter(a => a.type === 'job_match').length;
  const interviewSessions = activities.filter(a => a.type === 'interview').length;
  const myApplications = applications.filter(a => a.candidateEmail === user.email);
  
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">
            {getGreeting()}, <span className="text-brand-600 capitalize">{user.name}</span>
          </h1>
          <p className="text-slate-500 mt-2 text-base">Your career control center is ready.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setCurrentView(AppView.RESUME)} variant="secondary" className="shadow-sm">
            <FileText className="w-4 h-4 mr-2" /> Upload Resume
          </Button>
          <Button onClick={() => setCurrentView(AppView.INTERVIEW)} variant="primary" className="shadow-brand-500/20">
             <Mic className="w-4 h-4 mr-2" /> Start Practice
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Resume Score" 
          value={resumeAnalysis ? `${resumeAnalysis.score}` : "--"} 
          suffix="/100"
          icon={<Activity className="w-5 h-5 text-emerald-600" />}
          desc="Based on ATS standards"
          variant="success"
        />
        <StatCard 
          title="Jobs Matched" 
          value={jobs.length.toString()} 
          icon={<Briefcase className="w-5 h-5 text-brand-600" />}
          desc="Opportunities found"
          variant="info"
        />
        <StatCard 
          title="Applications" 
          value={myApplications.length.toString()} 
          icon={<Mail className="w-5 h-5 text-purple-600" />}
          desc="Jobs applied to"
          variant="purple"
        />
        <StatCard 
          title="Verified Skills" 
          value={resumeAnalysis?.skills?.length.toString() || "0"} 
          icon={<Star className="w-5 h-5 text-amber-600" />}
          desc="Detected in profile"
          variant="warning"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-8">
          
          {/* Active Applications Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 font-display">My Applications</h3>
            </div>
            <Card className="p-0 overflow-hidden">
               {myApplications.length === 0 ? (
                 <div className="p-8 text-center text-slate-500">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                       <Briefcase className="w-6 h-6 text-slate-300" />
                    </div>
                    <p>You haven't applied to any jobs yet.</p>
                 </div>
               ) : (
                 <div className="divide-y divide-slate-100">
                   {myApplications.map((app) => {
                     // Get company name from jobs if available, otherwise mock it for display
                     const relatedJob = jobs.find(j => j.id === app.jobId);
                     const companyName = relatedJob?.company || "Tech Corp Inc."; // Fallback if job list was refreshed/cleared
                     
                     return (
                        <div key={app.id} className="p-5 hover:bg-slate-50 transition-colors">
                           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex items-start gap-4">
                                 <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                                    <Briefcase className="w-6 h-6" />
                                 </div>
                                 <div>
                                    <h4 className="font-bold text-slate-900">{app.jobTitle}</h4>
                                    <p className="text-sm text-slate-600">{companyName}</p>
                                    <p className="text-xs text-slate-400 mt-1">Applied {new Date(app.timestamp).toLocaleDateString()}</p>
                                 </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                 <Badge variant={
                                   app.status === 'Shortlisted' ? 'brand' : 
                                   app.status === 'Interview' ? 'success' : 
                                   app.status === 'Rejected' ? 'error' : 'neutral'
                                 } className="text-sm px-3 py-1">
                                    {app.status === 'Shortlisted' ? <><Crown className="w-3 h-3 mr-1" /> Shortlisted</> : app.status}
                                 </Badge>
                                 
                                 {app.status === 'Interview' && app.interviewDate && (
                                   <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded flex items-center gap-1">
                                     <Calendar className="w-3 h-3" /> 
                                     {new Date(app.interviewDate).toLocaleString([], {weekday:'short', month:'short', day:'numeric', hour:'numeric', minute:'2-digit'})}
                                   </span>
                                 )}
                              </div>
                           </div>
                        </div>
                     );
                   })}
                 </div>
               )}
            </Card>
          </section>

          {/* Quick Actions */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 font-display">Recommended Actions</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <ActionCard 
                 title="Mock Interview" 
                 desc="Practice behavioral & technical questions with AI." 
                 icon={<Mic className="w-5 h-5" />}
                 color="text-purple-600"
                 bg="bg-purple-50"
                 border="hover:border-purple-200"
                 onClick={() => setCurrentView(AppView.INTERVIEW)}
              />
              <ActionCard 
                 title="Smart Job Match" 
                 desc="Find roles that perfectly fit your skill set." 
                 icon={<Briefcase className="w-5 h-5" />}
                 color="text-brand-600"
                 bg="bg-brand-50"
                 border="hover:border-brand-200"
                 onClick={() => setCurrentView(AppView.JOBS)}
              />
            </div>
          </section>

          {/* Documents Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-bold text-slate-900 font-display">My Documents</h3>
               <Button variant="ghost" size="sm" className="text-brand-600">View All</Button>
            </div>
            <Card className="p-0 overflow-hidden">
               {resumeAnalysis ? (
                 <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group border-b border-slate-100 last:border-0">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
                          <FileText className="w-5 h-5" />
                       </div>
                       <div>
                          <h4 className="font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">Software_Engineer_Resume.pdf</h4>
                          <p className="text-xs text-slate-500">Last updated today</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <Badge variant={resumeAnalysis.score > 70 ? 'success' : 'warning'}>Score: {resumeAnalysis.score}</Badge>
                       <Button size="sm" variant="secondary">Edit</Button>
                    </div>
                 </div>
               ) : (
                 <div className="p-8 text-center">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                       <FileText className="w-6 h-6 text-slate-300" />
                    </div>
                    <h4 className="text-slate-900 font-medium">No resumes uploaded</h4>
                    <p className="text-slate-500 text-sm mb-4">Upload your first resume to get started.</p>
                    <Button onClick={() => setCurrentView(AppView.RESUME)} size="sm" variant="outline"><Plus className="w-4 h-4 mr-2" /> Upload PDF</Button>
                 </div>
               )}
            </Card>
          </section>
        </motion.div>

        {/* Sidebar Activity Feed */}
        <motion.div variants={itemVariants} className="space-y-6">
          <section>
             <h3 className="text-lg font-bold text-slate-900 font-display mb-4">Recent Activity</h3>
             <Card className="p-0">
              {activities.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No activity yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {activities.map((act) => (
                    <div key={act.id} className="p-4 hover:bg-slate-50 transition-colors group">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "mt-0.5 w-2 h-2 rounded-full flex-none",
                          act.type === 'resume' ? 'bg-emerald-500' :
                          act.type === 'interview' ? 'bg-purple-500' :
                          act.type === 'job_match' ? 'bg-brand-500' : 'bg-pink-500'
                        )} />
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">{act.title}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">{act.meta}</p>
                          <span className="text-[10px] text-slate-400 mt-2 block">
                            {new Date(act.timestamp).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="p-3 text-center">
                    <button className="text-xs font-medium text-slate-500 hover:text-brand-600 transition-colors">View Full History</button>
                  </div>
                </div>
              )}
             </Card>
          </section>
        </motion.div>
      </div>
    </motion.div>
  );
};

const StatCard = ({ title, value, suffix, icon, desc, variant }: any) => {
  return (
    <motion.div variants={itemVariants}>
      <Card className="p-5 hover:shadow-md transition-all duration-300 border-l-4 border-l-transparent hover:border-l-brand-500">
        <div className="flex items-start justify-between mb-4">
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-600">
            {icon}
          </div>
          {variant === 'success' && <div className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+12%</div>}
        </div>
        <div>
          <div className="flex items-baseline gap-1">
             <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
             {suffix && <span className="text-sm font-medium text-slate-500">{suffix}</span>}
          </div>
          <p className="text-slate-500 text-sm mt-1">{title}</p>
        </div>
      </Card>
    </motion.div>
  );
};

const ActionCard = ({ title, desc, icon, color, bg, border, onClick }: any) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full bg-white p-5 rounded-xl border border-slate-200 hover:shadow-md transition-all text-left flex items-start gap-4 group relative",
      border
    )}
  >
    <div className={cn("p-3 rounded-lg transition-transform group-hover:scale-110 flex-none", bg, color)}>
      {icon}
    </div>
    <div>
      <h3 className="font-semibold text-slate-900 group-hover:text-brand-600 transition-colors text-sm">{title}</h3>
      <p className="text-slate-500 text-xs mt-1 leading-relaxed">{desc}</p>
    </div>
    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-hover:text-brand-400 group-hover:translate-x-1 transition-all" />
  </button>
);

export default Dashboard;