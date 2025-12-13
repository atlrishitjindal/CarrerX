import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import LiveInterview from './components/LiveInterview';
import ResumeAnalyzer from './components/ResumeAnalyzer';
import MarketInsights from './components/MarketInsights';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Jobs from './components/Jobs';
import CoverLetter from './components/CoverLetter';
import { AppView, ResumeAnalysis, ActivityLog } from './types';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [user, setUser] = useState<{name: string, email: string} | null>(null);
  const [viewState, setViewState] = useState<'landing' | 'auth_login' | 'auth_signup' | 'app'>('landing');
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Global State for Shared Data
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysis | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  // Handlers
  const handleLogin = (u: {name: string, email: string}) => {
    setUser(u);
    setViewState('app');
  };

  const handleLogout = () => {
    setUser(null);
    setViewState('landing');
    setCurrentView(AppView.DASHBOARD);
    setResumeAnalysis(null);
    setActivities([]);
  };

  const addActivity = (title: string, meta: string) => {
    const newActivity: ActivityLog = {
      id: Date.now().toString(),
      type: title.toLowerCase().includes('resume') ? 'resume' : 
            title.toLowerCase().includes('interview') ? 'interview' : 
            title.toLowerCase().includes('job') ? 'job_match' : 'cover_letter',
      title,
      meta,
      timestamp: new Date()
    };
    setActivities(prev => [newActivity, ...prev].slice(0, 20));
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

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      <Sidebar 
        currentView={currentView}
        setCurrentView={setCurrentView}
        isOpen={isSidebarOpen}
        user={user!}
        onLogout={handleLogout}
      />

      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-20">
          <div className="flex items-center gap-3">
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
               {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
             </button>
             <span className="font-bold text-slate-900 tracking-tight">CareerMint</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-10 scroll-smooth">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full max-w-7xl mx-auto w-full"
            >
              {currentView === AppView.DASHBOARD && (
                 <Dashboard 
                   user={user!} 
                   setCurrentView={setCurrentView} 
                   resumeAnalysis={resumeAnalysis}
                   activities={activities}
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
                  onAnalysisComplete={(result) => {
                    setResumeAnalysis(result);
                    addActivity("Resume Analysis", `Scored ${result.score}/100`);
                  }}
                  onActivity={addActivity}
                />
              )}
              
              {currentView === AppView.INSIGHTS && <MarketInsights />}
              
              {currentView === AppView.JOBS && (
                <Jobs 
                  resumeAnalysis={resumeAnalysis} 
                  onActivity={addActivity}
                />
              )}
              
              {currentView === AppView.COVER_LETTER && (
                <CoverLetter 
                  resumeAnalysis={resumeAnalysis} 
                  onActivity={addActivity}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default App;