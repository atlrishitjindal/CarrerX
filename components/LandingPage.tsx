import React from 'react';
import { ArrowRight, Mic, FileText, CheckCircle, Upload, Star, Zap, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button, Card, Badge } from './ui/DesignSystem';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-brand-100 selection:text-brand-900">
      {/* Navbar */}
      <nav className="fixed top-0 w-full border-b border-slate-100 bg-white/90 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-600/20">
              <span className="font-bold text-white text-xl font-display">C</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900 font-display">CarrerX</span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
              <a href="#features" className="hover:text-brand-600 transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-brand-600 transition-colors">How it Works</a>
              <a href="#testimonials" className="hover:text-brand-600 transition-colors">Success Stories</a>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={onLogin} className="text-sm font-bold text-slate-600 hover:text-brand-600 px-4 py-2 rounded-lg hover:bg-slate-50 transition-all">
                Log In
              </button>
              <Button onClick={onGetStarted} size="md" className="rounded-full px-6 shadow-brand-200">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-32 pb-20 lg:pt-48 lg:pb-32 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
           <div className="absolute top-20 right-0 w-[800px] h-[800px] bg-slate-100/50 rounded-full blur-3xl -z-10" />
           <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-slate-50/50 rounded-full blur-3xl -z-10" />
        </div>

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-left space-y-8"
          >
            <Badge variant="brand" className="pl-2 pr-4 py-1.5 bg-brand-50 border-brand-100 text-brand-700 text-sm font-medium rounded-full inline-flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-brand-600 animate-pulse"></span>
              v2.0 is now live
            </Badge>
            
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-[1.05] font-display">
              Land your dream job <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-blue-500">faster.</span>
            </h1>
            
            <p className="text-xl text-slate-500 leading-relaxed max-w-lg">
              The only AI career assistant that optimizes your resume, simulates real interviews, and tracks your applications in one place.
            </p>
            
            <div className="flex flex-col sm:flex-row items-start gap-4 pt-2">
              <Button onClick={onGetStarted} size="xl" className="w-full sm:w-auto rounded-full px-8 shadow-xl shadow-brand-600/20 text-lg h-14">
                Analyze My Resume <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <div className="flex items-center gap-4 px-4 h-14">
                <div className="flex -space-x-3">
                   {[1,2,3].map(i => (
                     <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center overflow-hidden">
                        <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" className="w-full h-full object-cover" />
                     </div>
                   ))}
                </div>
                <div className="text-sm">
                  <p className="font-bold text-slate-900">2,000+ Hired</p>
                  <div className="flex text-yellow-400">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 fill-current" />)}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="relative hidden lg:block"
          >
             <div className="absolute inset-0 bg-gradient-to-br from-slate-200/50 to-transparent rounded-3xl transform rotate-3 scale-105" />
             <Card className="relative bg-white shadow-2xl shadow-slate-200/50 p-8 border-slate-100 backdrop-blur-sm">
                <div className="absolute -top-6 -right-6 bg-white p-4 rounded-xl shadow-xl border border-slate-100 flex items-center gap-3 animate-bounce duration-[3000ms]">
                   <div className="bg-emerald-100 p-2 rounded-lg"><CheckCircle className="w-6 h-6 text-emerald-600" /></div>
                   <div>
                      <p className="font-bold text-slate-900 text-sm">Resume Score</p>
                      <p className="text-emerald-600 font-bold text-lg">98/100</p>
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-2xl font-bold text-slate-400">JD</div>
                      <div>
                         <h3 className="text-xl font-bold text-slate-900">John Doe</h3>
                         <p className="text-slate-500">Senior Product Designer</p>
                      </div>
                   </div>
                   
                   <div className="space-y-4">
                      <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                      <div className="h-4 bg-slate-100 rounded w-full"></div>
                      <div className="h-4 bg-slate-100 rounded w-5/6"></div>
                   </div>

                   <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="bg-brand-50 p-4 rounded-xl border border-brand-100">
                         <p className="text-xs font-bold text-brand-700 uppercase mb-1">Skills Match</p>
                         <p className="text-2xl font-bold text-brand-900">95%</p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                         <p className="text-xs font-bold text-purple-700 uppercase mb-1">Interview Prep</p>
                         <p className="text-2xl font-bold text-purple-900">Ready</p>
                      </div>
                   </div>
                </div>
             </Card>
          </motion.div>
        </div>
      </div>

      {/* Social Proof */}
      <div className="py-12 border-y border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">Used by candidates hired at</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
             {['Google', 'Microsoft', 'Spotify', 'Airbnb', 'Notion', 'Slack'].map(brand => (
                <span key={brand} className="text-xl md:text-2xl font-bold text-slate-800 font-display">{brand}</span>
             ))}
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div id="how-it-works" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
             <Badge variant="neutral" className="mb-4">Process</Badge>
             <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 font-display">How CarrerX works</h2>
             <p className="text-lg text-slate-500">Three simple steps to transform your job search from stressful to successful.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
             <div className="absolute top-12 left-0 w-full h-0.5 bg-slate-100 hidden md:block" />
             
             {[
               { icon: Upload, title: "Upload Resume", desc: "Drag and drop your PDF. We parse it instantly using advanced AI." },
               { icon: Zap, title: "Get AI Analysis", desc: "Receive a detailed ATS score and line-by-line improvement suggestions." },
               { icon: Award, title: "Get Hired", desc: "Apply with confidence using tailored documents and interview practice." }
             ].map((step, i) => (
               <div key={i} className="relative bg-white p-6 pt-0 text-center">
                  <div className="w-24 h-24 bg-white rounded-full border-8 border-slate-50 flex items-center justify-center mx-auto mb-6 relative z-10 shadow-sm">
                     <step.icon className="w-10 h-10 text-brand-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                  <p className="text-slate-500 leading-relaxed">{step.desc}</p>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Features Deep Dive */}
      <div id="features" className="py-24 bg-slate-50 overflow-hidden">
         <div className="max-w-7xl mx-auto px-6 space-y-32">
            
            {/* Feature 1 */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
               <div className="order-2 lg:order-1">
                  <div className="relative">
                     <div className="absolute inset-0 bg-slate-200 blur-3xl opacity-20 rounded-full" />
                     <Card className="relative p-0 overflow-hidden shadow-2xl border-0">
                        <div className="bg-slate-900 p-4 flex items-center gap-2">
                           <div className="flex gap-1.5">
                              <div className="w-3 h-3 rounded-full bg-red-500" />
                              <div className="w-3 h-3 rounded-full bg-yellow-500" />
                              <div className="w-3 h-3 rounded-full bg-green-500" />
                           </div>
                           <div className="text-xs text-slate-400 font-mono ml-4">resume_analysis.json</div>
                        </div>
                        <div className="p-8 bg-white font-mono text-sm space-y-4">
                           <div className="flex gap-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-100">
                              <div className="font-bold">ATS Error:</div>
                              <div>Missing keywords: "React", "TypeScript"</div>
                           </div>
                           <div className="flex gap-4 p-4 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
                              <div className="font-bold">Suggestion:</div>
                              <div>Quantify achievements. E.g., "Increased sales by 20%..."</div>
                           </div>
                        </div>
                     </Card>
                  </div>
               </div>
               <div className="order-1 lg:order-2 space-y-6">
                  <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-brand-600 mb-4 shadow-sm">
                     <FileText className="w-6 h-6" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-slate-900 font-display">Beat the ATS Robots.</h2>
                  <p className="text-lg text-slate-500 leading-relaxed">
                     75% of resumes are rejected by automated systems before a human ever sees them. Our AI checks your resume against the exact criteria recruiters use.
                  </p>
                  <ul className="space-y-3 pt-4">
                     {['Keyword Gap Analysis', 'Formatting Check', 'Impact Scoring'].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                           <CheckCircle className="w-5 h-5 text-brand-500" /> {item}
                        </li>
                     ))}
                  </ul>
               </div>
            </div>

            {/* Feature 2 */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
               <div className="space-y-6">
                  <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-purple-600 mb-4 shadow-sm">
                     <Mic className="w-6 h-6" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-slate-900 font-display">Practice Makes Perfect.</h2>
                  <p className="text-lg text-slate-500 leading-relaxed">
                     Nervous about interviews? Practice with our AI hiring manager. It speaks, listens, and gives you feedback on your answers, tone, and pacing.
                  </p>
                  <Button onClick={onGetStarted} variant="outline" className="mt-4">
                     Try Interview Sim
                  </Button>
               </div>
               <div className="relative">
                  <div className="absolute inset-0 bg-slate-200 blur-3xl opacity-20 rounded-full" />
                  <Card className="relative p-8 shadow-2xl border-slate-200">
                     <div className="flex items-center justify-center h-48 bg-slate-50 rounded-2xl mb-6 border border-slate-100 relative overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center gap-1">
                           {[1,2,3,4,5].map(i => (
                              <motion.div 
                                 key={i}
                                 animate={{ height: [20, 40 + Math.random()*40, 20] }}
                                 transition={{ repeat: Infinity, duration: 1 }}
                                 className="w-2 bg-purple-500 rounded-full"
                              />
                           ))}
                        </div>
                     </div>
                     <div className="space-y-3">
                        <div className="flex gap-3 items-start">
                           <div className="w-8 h-8 rounded-full bg-slate-200 flex-none" />
                           <div className="bg-slate-100 p-3 rounded-r-xl rounded-bl-xl text-sm text-slate-600">
                              Can you describe a challenging project you managed?
                           </div>
                        </div>
                        <div className="flex gap-3 items-start flex-row-reverse">
                           <div className="w-8 h-8 rounded-full bg-brand-600 flex-none" />
                           <div className="bg-brand-50 p-3 rounded-l-xl rounded-br-xl text-sm text-brand-900">
                              Yes, in my last role I led a cross-functional team...
                           </div>
                        </div>
                     </div>
                  </Card>
               </div>
            </div>
         </div>
      </div>

      {/* Testimonials */}
      <div id="testimonials" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 font-display">Don't just take our word for it.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
             {[
               {
                 quote: "I applied to 50 jobs with no response. After using CarrerX, I got 3 interviews in a week.",
                 author: "Sarah J.",
                 role: "Marketing Manager",
                 company: "Spotify"
               },
               {
                 quote: "The interview simulator is scary accurate. It asked the exact questions I got in my real interview.",
                 author: "Michael C.",
                 role: "Software Engineer",
                 company: "Google"
               },
               {
                 quote: "Finally, a tool that actually helps you improve your resume instead of just formatting it.",
                 author: "Jessica L.",
                 role: "Product Owner",
                 company: "Airbnb"
               }
             ].map((t, i) => (
               <Card key={i} className="p-8 hover:shadow-lg transition-shadow bg-slate-50 border-transparent">
                  <div className="flex gap-1 mb-4">
                     {[1,2,3,4,5].map(star => <Star key={star} className="w-4 h-4 text-yellow-400 fill-current" />)}
                  </div>
                  <p className="text-slate-700 text-lg mb-6 leading-relaxed">"{t.quote}"</p>
                  <div>
                     <p className="font-bold text-slate-900">{t.author}</p>
                     <p className="text-sm text-slate-500">{t.role} at {t.company}</p>
                  </div>
               </Card>
             ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-24 bg-white">
         <div className="max-w-5xl mx-auto px-6">
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 md:p-20 text-center relative overflow-hidden shadow-sm">
               
               <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-8 relative z-10 font-display">Ready to accelerate your career?</h2>
               <p className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto mb-10 relative z-10">
                  Join thousands of professionals who are landing better jobs, faster.
               </p>
               <Button onClick={onGetStarted} size="xl" variant="primary" className="relative z-10 shadow-xl shadow-brand-600/20">
                  Get Started Now <ArrowRight className="w-5 h-5 ml-2" />
               </Button>
               <p className="mt-6 text-slate-400 text-sm font-medium relative z-10">No credit card required</p>
            </div>
         </div>
      </div>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-6">
           <div className="grid md:grid-cols-4 gap-8 mb-12">
              <div className="col-span-1 md:col-span-2">
                 <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                       <span className="font-bold text-white text-lg font-display">C</span>
                    </div>
                    <span className="font-bold text-xl text-slate-900 font-display">CarrerX</span>
                 </div>
                 <p className="text-slate-500 max-w-xs leading-relaxed">
                    Empowering job seekers with AI-driven tools to land their dream roles.
                 </p>
              </div>
              <div>
                 <h4 className="font-bold text-slate-900 mb-4">Product</h4>
                 <ul className="space-y-2 text-slate-500">
                    <li><a href="#" className="hover:text-brand-600">Resume Builder</a></li>
                    <li><a href="#" className="hover:text-brand-600">Interview Prep</a></li>
                    <li><a href="#" className="hover:text-brand-600">Job Match</a></li>
                    <li><a href="#" className="hover:text-brand-600">Skill Suggestion</a></li>
                 </ul>
              </div>
              <div>
                 <h4 className="font-bold text-slate-900 mb-4">Company</h4>
                 <ul className="space-y-2 text-slate-500">
                    <li><a href="#" className="hover:text-brand-600">About</a></li>
                    <li><a href="#" className="hover:text-brand-600">Blog</a></li>
                    <li><a href="#" className="hover:text-brand-600">Careers</a></li>
                    <li><a href="#" className="hover:text-brand-600">Contact</a></li>
                 </ul>
              </div>
           </div>
           <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-slate-400 text-sm">© 2025 CarrerX AI. All rights reserved.</p>
              <div className="flex gap-6 text-sm text-slate-500">
                 <a href="#" className="hover:text-brand-600">Privacy Policy</a>
                 <a href="#" className="hover:text-brand-600">Terms of Service</a>
              </div>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;