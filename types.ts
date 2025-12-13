
export enum AppView {
  DASHBOARD = 'DASHBOARD',
  INTERVIEW = 'INTERVIEW',
  RESUME = 'RESUME',
  INSIGHTS = 'INSIGHTS',
  JOBS = 'JOBS',
  COVER_LETTER = 'COVER_LETTER',
  SKILLS = 'SKILLS',
  EMPLOYER_DASHBOARD = 'EMPLOYER_DASHBOARD',
  APPLICANTS = 'APPLICANTS',
  SHORTLISTED = 'SHORTLISTED',
  MY_APPLICATIONS = 'MY_APPLICATIONS',
  CALENDAR = 'CALENDAR',
  SETTINGS = 'SETTINGS'
}

export type UserRole = 'candidate' | 'employer';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface ResumeFile {
  name: string;
  type: string;
  size: number;
  data: string; // Base64 string
}

export interface ResumeAnalysis {
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  skills: string[]; // Added for skills gap analysis
  file?: ResumeFile;
}

export interface SavedResume {
  id: string;
  created_at: string;
  data: ResumeAnalysis;
}

export interface InterviewReport {
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  strengths: string[];
  improvements: string[];
}

export interface GroundingSource {
  uri: string;
  title: string;
  url?: string; // Add url as an optional property if needed, though GroundingSource uses uri
}

export interface InsightResult {
  text: string;
  sources: GroundingSource[];
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  description: string;
  requirements: string[];
  postedAt: string;
}

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  candidateAddress?: string;
  matchScore: number; // Simulated score
  status: 'New' | 'Reviewed' | 'Interview' | 'Rejected' | 'Shortlisted';
  timestamp: Date;
  interviewDate?: Date;
  meetingLink?: string;
  resumeFile?: ResumeFile;
}

export interface JobMatchResult {
  matchScore: number;
  summary: string;
  missingKeywords: string[];
  pros: string[];
  cons: string[];
}

export interface ActivityLog {
  id: string;
  type: 'interview' | 'resume' | 'job_match' | 'cover_letter' | 'skills' | 'recruitment';
  title: string;
  timestamp: Date;
  meta: string;
}

export interface SkillSuggestion {
  skill: string;
  reason: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: 'Technical' | 'Soft Skill' | 'Tool';
  searchQuery: string;
}