import React, { useState } from 'react';
import { LayoutDashboard, Mic, FileText, TrendingUp, Briefcase, LogOut, Mail, Command, ChevronRight, GraduationCap, Users, UserCheck, Settings, Bookmark, FolderOpen, Calendar } from 'lucide-react';
import { AppView, UserRole, Application } from '../types';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { Button } from './ui/DesignSystem';

interface SidebarProps {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  isOpen: boolean;
  user: { name: string; email: string; role?: UserRole };
  onLogout: () => void;
  applications?: Application[];
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isOpen, user, onLogout, applications = [] }) => {
  const isEmployer = user.role === 'employer';

  const NavItem = ({ view, icon: Icon, label }: { view: AppView; icon: any; label: string }) => {
    const isActive = currentView === view;
    // Helper to determine active color based on role
    const activeClass = isEmployer 
      ? "text-purple-700 bg-purple-50 shadow-sm border border-purple-100" 
      : "text-brand-700 bg-brand-50 shadow-sm border border-brand-100";
    
    const iconClass = isActive 
      ? (isEmployer ? "text-purple-600" : "text-brand-600")
      : "text-slate-400 group-hover:text-slate-600";

    return (
      <button
        onClick={() => setCurrentView(view)}
        className={cn(
          "group w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium relative",
          isActive ? activeClass : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
        )}
      >
        <Icon className={cn("w-4 h-4 transition-colors", iconClass)} />
        {label}
        {isActive && (
          <ChevronRight className={cn("w-4 h-4 ml-auto", isEmployer ? "text-purple-400" : "text-brand-400")} />
        )}
      </button>
    );
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 280 : 0, opacity: isOpen ? 1 : 0 }}
      className="h-full bg-white border-r border-slate-200 flex flex-col z-30 absolute md:relative overflow-hidden shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]"
    >
      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
        <div className="flex items-center gap-3 mb-8">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-md", isEmployer ? "bg-purple-600 shadow-purple-600/20" : "bg-brand-600 shadow-brand-600/20")}>
            <Command className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-slate-900 block font-display">CarrerX</span>
            <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">
              {isEmployer ? "Recruiter OS" : "AI Assistant"}
            </span>
          </div>
        </div>

        <nav className="space-y-8">
          {isEmployer ? (
            // EMPLOYER NAVIGATION
            <>
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-4">Recruitment</div>
                <div className="space-y-1">
                  <NavItem view={AppView.EMPLOYER_DASHBOARD} icon={LayoutDashboard} label="Dashboard" />
                  <NavItem view={AppView.JOBS} icon={Briefcase} label="Posted Jobs" />
                  <NavItem view={AppView.APPLICANTS} icon={Users} label="Applicants" />
                  <NavItem view={AppView.SHORTLISTED} icon={Bookmark} label="Shortlisted" />
                  <NavItem view={AppView.CALENDAR} icon={Calendar} label="Calendar" />
                </div>
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-4">Account</div>
                <div className="space-y-1">
                  <NavItem view={AppView.SETTINGS} icon={Settings} label="Settings" />
                </div>
              </div>
            </>
          ) : (
            // CANDIDATE NAVIGATION
            <>
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-4">Dashboard</div>
                <div className="space-y-1">
                  <NavItem view={AppView.DASHBOARD} icon={LayoutDashboard} label="Overview" />
                  <NavItem view={AppView.MY_APPLICATIONS} icon={FolderOpen} label="My Applications" />
                  <NavItem view={AppView.RESUME} icon={FileText} label="Resume Analyzer" />
                  <NavItem view={AppView.JOBS} icon={Briefcase} label="Job Matches" />
                </div>
              </div>
              
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-4">Career Tools</div>
                <div className="space-y-1">
                  <NavItem view={AppView.SKILLS} icon={GraduationCap} label="Skill Suggestions" />
                  <NavItem view={AppView.COVER_LETTER} icon={Mail} label="Cover Letter" />
                  <NavItem view={AppView.INTERVIEW} icon={Mic} label="Interview Prep" />
                  <NavItem view={AppView.INSIGHTS} icon={TrendingUp} label="Market Data" />
                  <NavItem view={AppView.CALENDAR} icon={Calendar} label="Calendar" />
                </div>
              </div>

              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-4">Account</div>
                <div className="space-y-1">
                  <NavItem view={AppView.SETTINGS} icon={Settings} label="Settings" />
                </div>
              </div>
            </>
          )}
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className={cn("w-9 h-9 rounded-full border flex items-center justify-center font-bold shadow-sm", isEmployer ? "bg-purple-50 border-purple-200 text-purple-700" : "bg-white border-slate-200 text-brand-700")}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate capitalize">{user.name}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
        </div>
        <Button 
          variant="outline"
          size="sm"
          onClick={onLogout}
          className="w-full justify-center gap-2 border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50"
        >
          <LogOut className="w-3 h-3" />
          Sign Out
        </Button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;