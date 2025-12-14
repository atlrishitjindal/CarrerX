import React, { useState, useEffect } from 'react';
import { Menu, X, Rocket } from 'lucide-react';
import LiveInterview from './components/LiveInterview';
import ResumeAnalyzer from './components/ResumeAnalyzer';
import MarketInsights from './components/MarketInsights';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Jobs from './components/Jobs';
import Applicants from './components/Applicants';
import CoverLetter from './components/CoverLetter';
import SkillSuggestions from './components/SkillSuggestions';
import MyApplications from './components/MyApplications';
import CalendarView from './components/CalendarView';
import Settings from './components/Settings';
import ResetPassword from "./components/ResetPassword";
import ChatBot from './components/ChatBot';

import { AppView, ResumeAnalysis, ActivityLog, UserRole, Job, Application, SavedResume } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

function App() {
  const [user, setUser] = useState<{ name: string, email: string, role: UserRole, id: string, phone?: string, address?: string } | null>(null);
  const [viewState, setViewState] = useState<'landing' | 'auth_login' | 'auth_signup' | 'auth_reset' | 'app'>('landing');
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Global State for Shared Data
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysis | null>(null);
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  // Shared Job/Recruitment State
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  // Track ownership of applications to prevent employers from overwriting candidate ownership
  const [applicationOwners, setApplicationOwners] = useState<Record<string, string>>({});

  // Navigation Intents
  const [postJobIntent, setPostJobIntent] = useState(false);

  // Initialize Auth Listener & Session Restoration
  useEffect(() => {
    const isRecovery = typeof window !== 'undefined' && window.location.hash && window.location.hash.includes('type=recovery');

    if (isRecovery) {
      setViewState('auth_reset');
    }

    // Restore Session on App Load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isRecovery) return;

      if (session?.user) {
        // Check pending role here too for immediate UI feedback during redirects
        let role = session.user.user_metadata.role as UserRole;
        const pendingRole = localStorage.getItem('carrerx_pending_role') as UserRole | null;
        if (pendingRole) role = pendingRole;

        setUser({
          name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          role: role || 'candidate',
          id: session.user.id,
          phone: session.user.user_metadata.phone,
          address: session.user.user_metadata.address
        });
        setViewState(prev => prev === 'auth_reset' ? 'auth_reset' : 'app');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (_event === "PASSWORD_RECOVERY") {
        setViewState("auth_reset");
        return;
      }

      if ((_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED') && session?.user) {
        // Determine Role (Handle OAuth post-login role assignment)
        let userRole = (session.user.user_metadata.role as UserRole);

        // Always check for pending role from login/signup flow
        // This ensures if a user explicitly selects "Employer" then uses Google, they get the Employer role
        const pendingRole = localStorage.getItem('carrerx_pending_role') as UserRole | null;

        if (pendingRole) {
          userRole = pendingRole;
          // Update the user metadata in Supabase to persist this role
          await supabase.auth.updateUser({
            data: { role: userRole }
          });
          localStorage.removeItem('carrerx_pending_role');
        } else if (!userRole) {
          // Fallback default if no role in metadata and no pending role
          userRole = 'candidate';
        }

        if (viewState !== 'app' || user?.role !== userRole || user?.id !== session.user.id) {
          setUser({
            name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            role: userRole,
            id: session.user.id,
            phone: session.user.user_metadata.phone,
            address: session.user.user_metadata.address
          });
          setViewState('app');

          if (userRole === 'employer') {
            setCurrentView(AppView.EMPLOYER_DASHBOARD);
          } else {
            setCurrentView(AppView.DASHBOARD);
          }
        }
      }

      if (_event === 'SIGNED_OUT') {
        setUser(null);
        setViewState('landing');
        setResumeAnalysis(null);
        setSavedResumes([]);
        setActivities([]);
        setApplications([]);
        setJobs([]);
        setApplicationOwners({});
        localStorage.removeItem('carrerx_pending_role');
      }
    });

    return () => subscription.unsubscribe();
  }, [user?.role, viewState, user?.id]);

  // Fetch Data from DB/LocalStorage when User Logs In
  useEffect(() => {
    let isMounted = true;

    const loadUserData = async () => {
      if (!user?.id) return;

      // Reset states to ensure no cross-contamination between logins if re-running
      if (isMounted) {
        setJobs([]);
        setApplications([]);
        setSavedResumes([]);
        setResumeAnalysis(null);
      }

      try {
        // 1. FETCH RESUMES
        let loadedResumes: SavedResume[] = [];

        // Try DB
        const { data: resumesData } = await supabase
          .from('resumes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (resumesData && resumesData.length > 0) {
          loadedResumes = resumesData
            .map((row: any) => ({
              id: row.id,
              created_at: row.created_at,
              data: row.data
            }))
            .filter((r: SavedResume) => r.data && r.data.score !== undefined); // Filter out corrupt data
        } else {
          // Fallback to LocalStorage
          const localResumes = localStorage.getItem(`carrerx_resumes_${user.id}`);
          if (localResumes) {
            const parsed = JSON.parse(localResumes);
            if (Array.isArray(parsed)) {
              loadedResumes = parsed.filter((r: any) => r && r.data && r.data.score !== undefined);
            }
          }
        }

        if (isMounted) {
          setSavedResumes(loadedResumes);
          if (loadedResumes.length > 0) {
            setResumeAnalysis(loadedResumes[0].data);
          }
        }

        // 2. FETCH JOBS (Real Jobs from Supabase posted_jobs)
        let globalJobs: Job[] = [];
        const { data: dbJobs, error: dbJobError } = await supabase
          .from('posted_jobs')
          .select('*')
          .order('posted_at', { ascending: false });

        if (dbJobs) {
          globalJobs = dbJobs.map((j: any) => ({
            id: j.id,
            employerId: j.employer_id, // Map from snake_case
            title: j.title,
            company: j.company,
            location: j.location,
            salary: j.salary,
            type: j.type,
            description: j.description,
            requirements: j.requirements || [],
            postedAt: j.posted_at
          }));
        } else {
          // Fallback to localStorage if DB fails or is empty for demo continuity
          if (dbJobError) console.error("Error fetching posted_jobs:", dbJobError);
          const globalJobsStr = localStorage.getItem('carrerx_global_jobs');
          if (globalJobsStr) globalJobs = JSON.parse(globalJobsStr);
        }

        // 3. FETCH APPLICATIONS
        // LOAD GLOBAL APPS (Source of Truth)
        const globalAppsStr = localStorage.getItem('carrerx_global_applications');
        let globalApps: Application[] = globalAppsStr ? JSON.parse(globalAppsStr) : [];

        // If global is empty but we have local candidate data, migrate it up (self-healing)
        if (globalApps.length === 0 && user.role === 'candidate') {
          const localLegacyApps = localStorage.getItem(`carrerx_apps_${user.id}`);
          if (localLegacyApps) {
            globalApps = JSON.parse(localLegacyApps);
            localStorage.setItem('carrerx_global_applications', JSON.stringify(globalApps));
          }
        }

        // Also attempt DB fetch to see if we have fresher data there
        let dbApps: Application[] = [];
        let query = supabase.from('applications').select('user_id, data');
        if (user.role === 'candidate') {
          query = query.eq('user_id', user.id);
        }
        const { data: appsData } = await query;
        if (appsData && appsData.length > 0) {
          dbApps = appsData.map((row: any) => row.data).filter((a: any) => a);
          // Merge DB apps into globalApps if missing
          dbApps.forEach(dbApp => {
            if (!globalApps.find(g => g.id === dbApp.id)) {
              globalApps.push(dbApp);
            }
          });
        }

        let displayedJobs: Job[] = [];
        let displayedApps: Application[] = [];

        // Filter: Employers see ONLY THEIR OWN JOBS/APPS. Candidates see ALL JOBS, but only THEIR APPS.
        if (user.role === 'employer') {
          // EMPLOYER VIEW:
          // 1. Jobs: Only show jobs posted by THIS employer (matching employerId)
          // STRICT CHECK: employerId must exist and match exactly
          displayedJobs = globalJobs.filter(j => j.employerId && j.employerId === user.id);

          // 2. Apps: Only show applications for the jobs owned by this employer
          const myJobIds = new Set(displayedJobs.map(j => j.id));
          displayedApps = globalApps.filter(app => myJobIds.has(app.jobId));

        } else {
          // CANDIDATE VIEW:
          // 1. Jobs: See ALL Global Jobs (from all employers) + Local AI Matches
          const localJobsStr = localStorage.getItem(`carrerx_jobs_${user.id}`);
          const localJobs: Job[] = localJobsStr ? JSON.parse(localJobsStr) : [];

          displayedJobs = [...globalJobs];
          const globalIds = new Set(globalJobs.map(j => j.id));

          localJobs.forEach(j => {
            if (!globalIds.has(j.id)) {
              displayedJobs.push(j);
            }
          });

          // 2. Apps: See only their own applications
          displayedApps = globalApps.filter(app => app.candidateEmail === user.email);
        }

        if (isMounted) {
          setJobs(displayedJobs);
          // Sort by timestamp descending
          displayedApps.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setApplications(displayedApps);
        }

      } catch (e) {
        console.error("Error loading user data:", e);
      }
    };

    if (user?.id) {
      loadUserData();
    }

    return () => { isMounted = false; };
  }, [user?.id, user?.role]); // Re-run if role changes


  // Persistence Effects (Save to LocalStorage on Change as Backup)
  useEffect(() => {
    if (user?.id && jobs.length > 0) {
      // We save the CURRENT view of jobs to the user's local storage. 
      // This effectively caches the global jobs for them too, which is fine for this architecture.
      localStorage.setItem(`carrerx_jobs_${user.id}`, JSON.stringify(jobs));
    }
  }, [jobs, user?.id]);

  useEffect(() => {
    if (user?.id && savedResumes.length > 0) {
      localStorage.setItem(`carrerx_resumes_${user.id}`, JSON.stringify(savedResumes));
    }
  }, [savedResumes, user?.id]);

  // Note: We handle application persistence manually in the handlers to ensure Global Sync


  // Handlers
  const handleLogin = (u: { name: string, email: string, role: UserRole, id: string, phone?: string, address?: string }) => {
    setUser(u);
    setViewState('app');
    if (u.role === 'employer') {
      setCurrentView(AppView.EMPLOYER_DASHBOARD);
    } else {
      setCurrentView(AppView.DASHBOARD);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setViewState('landing');
    setCurrentView(AppView.DASHBOARD);
    setResumeAnalysis(null);
    setSavedResumes([]);
    setActivities([]);
    setApplications([]);
    setJobs([]);
    setApplicationOwners({});
    localStorage.removeItem('carrerx_pending_role');
  };

  const handleUpdateProfile = (name: string) => {
    if (user) {
      setUser({ ...user, name });
    }
  };

  const addActivity = (title: string, meta: string) => {
    const newActivity: ActivityLog = {
      id: Date.now().toString(),
      type: title.toLowerCase().includes('resume') ? 'resume' :
        title.toLowerCase().includes('interview') ? 'interview' :
          title.toLowerCase().includes('job') ? 'job_match' :
            title.toLowerCase().includes('skill') ? 'skills' : 'cover_letter',
      title,
      meta,
      timestamp: new Date()
    };
    setActivities(prev => [newActivity, ...prev].slice(0, 20));
  };

  const handleResumeAnalysisComplete = async (result: ResumeAnalysis) => {
    setResumeAnalysis(result);
    setJobs([]); // Clear previous jobs so they can be regenerated for the new resume
    addActivity("Resume Analysis", `Scored ${result.score}/100`);

    // Save Resume
    if (user?.id) {
      const newId = uuidv4();
      const newEntry: SavedResume = {
        id: newId,
        created_at: new Date().toISOString(),
        data: result
      };

      // Optimistic update (triggers LocalStorage save via useEffect)
      setSavedResumes(prev => [newEntry, ...prev]);

      // DB Insert (Fire and forget, with logging)
      supabase.from('resumes').insert({
        id: newId,
        user_id: user.id,
        data: result,
        created_at: newEntry.created_at
      }).then(({ error }) => {
        if (error) console.warn("DB Save Error (Resume):", error.message);
      });
    }
  };

  const handleLoadSavedResume = (resume: SavedResume) => {
    if (!resume.data) return;
    setResumeAnalysis(resume.data);
    setJobs([]); // Clear previous jobs so they can be regenerated for the loaded resume
    addActivity("Resume Loaded", `Loaded resume from ${new Date(resume.created_at).toLocaleDateString()}`);
  };

  const handleApplyToJob = async (job: Job) => {
    if (!user) return;

    const newApplication: Application = {
      id: Date.now().toString(),
      jobId: job.id,
      jobTitle: job.title,
      companyName: job.company, // Snapshot
      location: job.location,   // Snapshot
      salary: job.salary,       // Snapshot
      candidateName: user.name,
      candidateEmail: user.email,
      candidatePhone: user.phone,
      candidateAddress: user.address,
      matchScore: resumeAnalysis ? resumeAnalysis.score : Math.floor(Math.random() * (98 - 70 + 1) + 70),
      status: 'New',
      timestamp: new Date(),
      resumeFile: resumeAnalysis?.file
    };

    setApplications(prev => [newApplication, ...prev]);
    addActivity("Job Application", `Applied to ${job.company}`);

    // SYNC: Update Global Storage (Demo Mode)
    const existingGlobal: Application[] = JSON.parse(localStorage.getItem('carrerx_global_applications') || '[]');
    localStorage.setItem('carrerx_global_applications', JSON.stringify([newApplication, ...existingGlobal]));

    // SYNC: DB Update
    if (user?.id) {
      supabase.from('applications').upsert({
        id: newApplication.id,
        user_id: user.id,
        data: newApplication,
        updated_at: new Date().toISOString()
      }).then(({ error }) => {
        if (error) console.warn("DB Save Error (Application):", error.message);
      });
    }
  };

  const handlePostJobRequest = () => {
    setCurrentView(AppView.JOBS);
    setPostJobIntent(true);
  };

  const handlePostJob = async (job: Job) => {
    if (!user?.id) return; // Strict safety check

    // IMPORTANT: Attach the current employer's ID to the job so they own it
    const jobWithOwnership = { ...job, employerId: user.id };

    setJobs(prev => [jobWithOwnership, ...prev]);
    addActivity("Job Posted", job.title);

    // Save to Supabase 'posted_jobs' table
    const dbJob = {
      id: jobWithOwnership.id,
      employer_id: jobWithOwnership.employerId, // DB uses snake_case
      title: jobWithOwnership.title,
      company: jobWithOwnership.company,
      location: jobWithOwnership.location,
      salary: jobWithOwnership.salary,
      type: jobWithOwnership.type,
      description: jobWithOwnership.description,
      requirements: jobWithOwnership.requirements,
      posted_at: jobWithOwnership.postedAt
    };

    const { error } = await supabase.from('posted_jobs').insert(dbJob);
    if (error) {
      console.error("Failed to post job to Supabase:", error);
    }

    // Save to Global Storage (so candidates can see it immediately in this session)
    const globalJobs = JSON.parse(localStorage.getItem('carrerx_global_jobs') || '[]');
    const updatedGlobalJobs = [jobWithOwnership, ...globalJobs];
    localStorage.setItem('carrerx_global_jobs', JSON.stringify(updatedGlobalJobs));
  };

  const handleUpdateJob = async (updatedJob: Job) => {
    setJobs(prev => prev.map(j => j.id === updatedJob.id ? updatedJob : j));
    addActivity("Job Updated", updatedJob.title);

    // Update Supabase
    const dbJobUpdates = {
      title: updatedJob.title,
      company: updatedJob.company,
      location: updatedJob.location,
      salary: updatedJob.salary,
      type: updatedJob.type,
      description: updatedJob.description,
      requirements: updatedJob.requirements
    };

    const { error } = await supabase
      .from('posted_jobs')
      .update(dbJobUpdates)
      .eq('id', updatedJob.id);

    if (error) {
      console.error("Failed to update job in Supabase:", error);
    }

    // Sync Global
    const globalJobs = JSON.parse(localStorage.getItem('carrerx_global_jobs') || '[]');
    if (globalJobs.some((j: Job) => j.id === updatedJob.id)) {
      // Ensure we preserve the employerId even if updatedJob somehow lost it (safeguard)
      const newGlobal = globalJobs.map((j: Job) => j.id === updatedJob.id ? { ...updatedJob, employerId: j.employerId } : j);
      localStorage.setItem('carrerx_global_jobs', JSON.stringify(newGlobal));
    }
  };

  const handleUpdateApplicationStatus = async (id: string, newStatus: Application['status'], interviewDate?: Date) => {
    // 1. Calculate the updates first
    let updates: Partial<Application> = { status: newStatus };
    let meetingLink = '';

    if (newStatus === 'Interview' && interviewDate) {
      updates.interviewDate = interviewDate;
      // Generate link if needed, check existing app in state
      const existingApp = applications.find(a => a.id === id);
      if (existingApp && !existingApp.meetingLink) {
        const chars = 'abcdefghijklmnopqrstuvwxyz';
        const segment = (len: number) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        meetingLink = `https://meet.jit.si/CarrerX-${segment(3)}-${segment(4)}-${segment(3)}`;
        updates.meetingLink = meetingLink;
      } else if (existingApp?.meetingLink) {
        meetingLink = existingApp.meetingLink;
      }
    }

    // 2. Update React State
    setApplications(prev => prev.map(app => {
      if (app.id === id) {
        return { ...app, ...updates };
      }
      return app;
    }));

    const appToUpdate = applications.find(a => a.id === id);
    if (appToUpdate && user?.id) {
      let meta = `Marked ${appToUpdate.candidateName} as ${newStatus}`;
      if (newStatus === 'Interview' && interviewDate) {
        meta += ` on ${interviewDate.toLocaleDateString()}`;
      }
      addActivity("Application Update", meta);

      const fullUpdatedApp = { ...appToUpdate, ...updates };

      // SYNC: Global Storage (Demo Mode)
      const globalApps: Application[] = JSON.parse(localStorage.getItem('carrerx_global_applications') || '[]');
      const newGlobalApps = globalApps.map(gApp => gApp.id === id ? { ...gApp, ...updates } : gApp);
      localStorage.setItem('carrerx_global_applications', JSON.stringify(newGlobalApps));

      // SYNC: DB Update
      // Use the original owner ID logic if we tracked it, otherwise assume global visibility handles it locally.
      const originalOwnerId = applicationOwners[id] || user.id; // Fallback to current user if untracked, but global storage saves the day.

      supabase.from('applications').upsert({
        id: id,
        // Try to preserve original ownership if possible, but for update we mostly care about the 'data' column
        user_id: originalOwnerId,
        data: fullUpdatedApp,
        updated_at: new Date().toISOString()
      }).then(({ error }) => {
        if (error) console.warn("DB Update Error (Application):", error.message);
      });
    }
  };

  // Render Views
  if (viewState === 'landing') {
    return (
      <LandingPage
        onGetStarted={() => setViewState('auth_signup')}
        onLogin={() => setViewState('auth_login')}
      />
    );
  }

  if (viewState === 'auth_login' || viewState === 'auth_signup') {
    return (
      <Auth
        initialMode={viewState === 'auth_login' ? 'login' : 'signup'}
        onComplete={handleLogin}
      />
    );
  }

  if (viewState === 'auth_reset') {
    return (
      <ResetPassword
        onComplete={handleLogout}
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        isOpen={isSidebarOpen}
        user={user!}
        onLogout={handleLogout}
        applications={applications}
      />

      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <span className="font-bold text-slate-900 tracking-tight">CarrerX</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 scroll-smooth">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              {...({
                initial: { opacity: 0, y: 10 },
                animate: { opacity: 1, y: 0 },
                exit: { opacity: 0, y: -10 },
                transition: { duration: 0.2 }
              } as any)}
              className="h-full"
            >
              {(currentView === AppView.DASHBOARD || currentView === AppView.EMPLOYER_DASHBOARD) && (
                <Dashboard
                  user={user!}
                  setCurrentView={setCurrentView}
                  resumeAnalysis={resumeAnalysis}
                  activities={activities}
                  applications={applications}
                  jobs={jobs}
                  onPostJob={handlePostJobRequest}
                />
              )}

              {currentView === AppView.MY_APPLICATIONS && (
                <MyApplications
                  applications={applications}
                  jobs={jobs}
                  userEmail={user?.email || ''}
                />
              )}

              {currentView === AppView.INTERVIEW && (
                <LiveInterview
                  resumeAnalysis={resumeAnalysis}
                />
              )}

              {currentView === AppView.RESUME && (
                <ResumeAnalyzer
                  analysisResult={resumeAnalysis}
                  onAnalysisComplete={handleResumeAnalysisComplete}
                  onActivity={addActivity}
                  savedResumes={savedResumes}
                  onLoadResume={handleLoadSavedResume}
                />
              )}

              {currentView === AppView.INSIGHTS && <MarketInsights />}

              {currentView === AppView.JOBS && (
                <Jobs
                  resumeAnalysis={resumeAnalysis}
                  onActivity={addActivity}
                  jobs={jobs}
                  setJobs={setJobs}
                  onApply={handleApplyToJob}
                  appliedJobIds={new Set(applications.filter(a => a.candidateEmail === user?.email).map(a => a.jobId))}
                  userRole={user?.role}
                  applications={applications}
                  onPostJob={handlePostJob}
                  onUpdateJob={handleUpdateJob}
                  postJobIntent={postJobIntent}
                  onClearPostJobIntent={() => setPostJobIntent(false)}
                />
              )}

              {currentView === AppView.APPLICANTS && (
                <Applicants
                  applications={applications}
                  jobs={jobs}
                  onUpdateStatus={handleUpdateApplicationStatus}
                />
              )}

              {currentView === AppView.SHORTLISTED && (
                <Applicants
                  applications={applications}
                  jobs={jobs}
                  onUpdateStatus={handleUpdateApplicationStatus}
                  showShortlistedOnly={true}
                />
              )}

              {currentView === AppView.COVER_LETTER && (
                <CoverLetter
                  resumeAnalysis={resumeAnalysis}
                  onActivity={addActivity}
                />
              )}

              {currentView === AppView.SKILLS && (
                <SkillSuggestions
                  resumeAnalysis={resumeAnalysis}
                  onActivity={addActivity}
                />
              )}

              {currentView === AppView.CALENDAR && (
                <CalendarView
                  applications={applications}
                  user={user!}
                />
              )}

              {currentView === AppView.SETTINGS && (
                <Settings
                  user={user!}
                  onUpdateProfile={handleUpdateProfile}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Global ChatBot accessible on any authorized page */}
      {viewState === 'app' && <ChatBot currentView={currentView} />}
    </div>
  );
}

export default App;