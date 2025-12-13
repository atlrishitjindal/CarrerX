import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Video, Clock, MapPin, Calendar as CalendarIcon, ExternalLink } from 'lucide-react';
import { Application, UserRole } from '../types';
import { motion } from 'framer-motion';
import { Card, Button, Badge } from './ui/DesignSystem';
import { containerVariants, itemVariants, cn } from '../lib/utils';

interface CalendarViewProps {
  applications: Application[];
  user: { name: string; email: string; role?: UserRole };
}

const CalendarView: React.FC<CalendarViewProps> = ({ applications, user }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const isEmployer = user.role === 'employer';
  
  // Filter interviews
  const interviews = applications.filter(app => {
    if (app.status !== 'Interview' || !app.interviewDate) return false;
    return isEmployer ? true : app.candidateEmail === user.email;
  });

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay };
  };

  const { days, firstDay } = getDaysInMonth(currentDate);
  
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const getInterviewsForDate = (day: number) => {
    return interviews.filter(i => {
      const d = new Date(i.interviewDate!);
      return d.getDate() === day && 
             d.getMonth() === currentDate.getMonth() && 
             d.getFullYear() === currentDate.getFullYear();
    });
  };

  const selectedInterviews = selectedDate 
    ? interviews.filter(i => {
        const d = new Date(i.interviewDate!);
        return d.getDate() === selectedDate.getDate() && 
               d.getMonth() === selectedDate.getMonth() && 
               d.getFullYear() === selectedDate.getFullYear();
      })
    : [];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-6xl mx-auto space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-display">Calendar</h1>
           <p className="text-slate-500 mt-2">Manage your upcoming interviews and events.</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
           <Button variant="ghost" onClick={prevMonth}><ChevronLeft className="w-5 h-5" /></Button>
           <span className="font-bold text-lg min-w-[140px] text-center text-slate-900">
             {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
           </span>
           <Button variant="ghost" onClick={nextMonth}><ChevronRight className="w-5 h-5" /></Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 flex-1">
         {/* Calendar Grid */}
         <Card className="lg:col-span-2 p-6 h-fit">
            <div className="grid grid-cols-7 gap-4 mb-4 text-center">
               {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                 <div key={d} className="text-sm font-bold text-slate-400 uppercase tracking-wider">{d}</div>
               ))}
            </div>
            <div className="grid grid-cols-7 gap-4">
               {Array.from({ length: firstDay }).map((_, i) => (
                 <div key={`empty-${i}`} className="aspect-square" />
               ))}
               {Array.from({ length: days }).map((_, i) => {
                 const day = i + 1;
                 const dayInterviews = getInterviewsForDate(day);
                 const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
                 const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === currentDate.getMonth();

                 return (
                   <button
                     key={day}
                     onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                     className={cn(
                       "aspect-square rounded-xl border flex flex-col items-start justify-between p-2 transition-all hover:shadow-md relative overflow-hidden group",
                       isSelected 
                         ? "border-purple-500 ring-2 ring-purple-100 bg-purple-50/50" 
                         : isToday
                           ? "border-brand-300 bg-brand-50/30"
                           : "border-slate-100 hover:border-slate-300 bg-white"
                     )}
                   >
                     <span className={cn(
                       "text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full",
                       isToday ? "bg-brand-600 text-white" : "text-slate-700"
                     )}>
                       {day}
                     </span>
                     
                     <div className="w-full space-y-1">
                        {dayInterviews.map((int, idx) => (
                           <div key={idx} className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded font-medium truncate w-full text-left">
                              {new Date(int.interviewDate!).toLocaleTimeString([], {hour:'numeric', minute:'2-digit'})}
                           </div>
                        ))}
                     </div>
                   </button>
                 );
               })}
            </div>
         </Card>

         {/* Side Panel: Events for Selected Date */}
         <div className="space-y-6">
            <Card className="p-6 h-full flex flex-col bg-slate-50 border-slate-200">
               <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                 <CalendarIcon className="w-5 h-5 text-purple-600" />
                 {selectedDate ? selectedDate.toLocaleDateString(undefined, {weekday: 'long', month: 'long', day: 'numeric'}) : "Select a date"}
               </h3>
               
               <div className="space-y-4 flex-1 overflow-y-auto">
                 {selectedInterviews.length > 0 ? (
                   selectedInterviews.map(app => (
                     <div key={app.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                        <div className="flex items-start justify-between">
                           <div>
                              <h4 className="font-bold text-slate-900">{app.jobTitle}</h4>
                              <p className="text-sm text-slate-500 font-medium">{isEmployer ? app.candidateName : app.candidateName}</p> 
                           </div>
                           <Badge variant="success" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                              {new Date(app.interviewDate!).toLocaleTimeString([], {hour:'numeric', minute:'2-digit'})}
                           </Badge>
                        </div>
                        
                        <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                           <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Video className="w-3.5 h-3.5" /> Jitsi Meet
                           </div>
                           {app.meetingLink && (
                              <a 
                                href={app.meetingLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-full"
                              >
                                <Button size="sm" variant="primary" className="w-full bg-purple-600 hover:bg-purple-700 h-8 text-xs">
                                   Join Call <ExternalLink className="w-3 h-3 ml-2" />
                                </Button>
                              </a>
                           )}
                        </div>
                     </div>
                   ))
                 ) : (
                   <div className="text-center py-12 text-slate-400">
                      <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>No interviews scheduled for this day.</p>
                   </div>
                 )}
               </div>
            </Card>
         </div>
      </div>
    </motion.div>
  );
};

export default CalendarView;