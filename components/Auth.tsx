import React, { useState } from 'react';
import { ArrowRight, Github, Chrome, Command, Briefcase, User, AlertCircle, ArrowLeft, CheckCircle, KeyRound, Mail, Info, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button, Input, Card } from './ui/DesignSystem';
import { UserRole } from '../types';
import { supabase } from '../lib/supabaseClient';

interface AuthProps {
  onComplete: (user: { name: string; email: string; role: UserRole; id: string; phone?: string; address?: string }) => void;
  initialMode?: 'login' | 'signup';
}

const Auth: React.FC<AuthProps> = ({ onComplete, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot_password'>(initialMode);
  const [role, setRole] = useState<UserRole>('candidate');
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const handleRateLimitError = (error: any) => {
    const msg = error?.message?.toLowerCase() || '';
    if (
      error?.status === 429 || 
      msg.includes("rate limit") || 
      msg.includes("sending recovery email") ||
      msg.includes("too many requests") ||
      msg.includes("security purposes")
    ) {
      return new Error("Service is busy (Rate Limit). Please wait 60 seconds before trying again.");
    }
    return error;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      const cleanEmail = email.trim();
      
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: name,
              role: role,
              phone: phone,
              address: address
            }
          }
        });

        if (error) throw handleRateLimitError(error);
        
        setMessage("Account created! Please check your email (and spam folder) to verify your account.");
        
      } else if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password
        });

        if (error) throw error;

        if (data.user) {
          onComplete({
            name: data.user.user_metadata.full_name || cleanEmail.split('@')[0],
            email: data.user.email || cleanEmail,
            role: (data.user.user_metadata.role as UserRole) || 'candidate',
            id: data.user.id,
            phone: data.user.user_metadata.phone,
            address: data.user.user_metadata.address
          });
        }
      } else if (mode === 'forgot_password') {
        if (!cleanEmail) throw new Error("Please enter your email address.");

        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: window.location.origin,
        });
        
        if (error) {
          console.error("Reset Password Error:", error);
          throw handleRateLimitError(error);
        }
        setResetSent(true);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError(null);
    setMessage(null);
    setResetSent(false);
    // Clear sensitive fields but keep email if user is just switching modes
    setPassword('');
  };

  const handleSocialLogin = async (provider: 'github' | 'google') => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 paper-pattern">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md my-8" 
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-600 shadow-lg shadow-brand-600/20 mb-6">
            <Command className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-display">
            {mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create your account' : 'Reset Password'}
          </h2>
          <p className="text-slate-500 mt-2 text-sm">
            {mode === 'login' ? 'Enter your details to access your workspace.' : 
             mode === 'signup' ? 'Start your journey today.' : 
             'Enter your email to receive a reset link.'}
          </p>
        </div>

        <Card className="shadow-xl shadow-slate-200/50 p-8 border-slate-200">
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-none" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2 text-emerald-700 text-sm">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-none" />
              <span>{message}</span>
            </div>
          )}

          {resetSent && mode === 'forgot_password' ? (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <Mail className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Check your inbox</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  We've sent a password reset link to <strong>{email}</strong>.
                </p>
                <div className="mt-6 bg-slate-50 p-4 rounded-lg text-left text-xs text-slate-500 space-y-3 border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-700 font-semibold border-b border-slate-200 pb-2">
                    <Info className="w-4 h-4" /> Facing Some Issues?
                  </div>
                  <ul className="list-disc pl-4 space-y-2 leading-normal">
                    <li>Check your <strong>Spam</strong> or Junk folder.</li>
                    <li>
                      <strong>Reset link opens a blank page:</strong><br/>
                      Your app must not be running in the same browser session.
                    </li>
                    <li className="text-brand-700 font-semibold bg-brand-50 p-2 rounded">
                      Fix: Right-click the link in email, select "Copy Link", and paste it into THIS tab's address bar.
                    </li>
                  </ul>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => { setMode('login'); setResetSent(false); }}
              >
                Back to Log In
              </Button>
            </div>
          ) : (
            <>
              {/* Role Toggle - Now visible in both login and signup modes */}
              {(mode === 'login' || mode === 'signup') && (
                <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
                  <button
                    type="button"
                    onClick={() => setRole('candidate')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-md transition-all ${
                      role === 'candidate' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <User className="w-4 h-4" /> Candidate
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('employer')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-md transition-all ${
                      role === 'employer' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Briefcase className="w-4 h-4" /> Employer
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Full Name</label>
                      <Input 
                        type="text" 
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="bg-slate-50 border-slate-300"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Phone Number</label>
                      <Input 
                        type="tel" 
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className="bg-slate-50 border-slate-300"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    {role === 'employer' && mode !== 'forgot_password' ? 'Work Email' : 'Email Address'}
                  </label>
                  <Input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={role === 'employer' && mode !== 'forgot_password' ? "recruiter@company.com" : "name@example.com"}
                    className="bg-slate-50 border-slate-300"
                  />
                </div>

                {mode === 'signup' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Address</label>
                    <Input 
                      type="text" 
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="123 Main St, City, Country"
                      className="bg-slate-50 border-slate-300"
                    />
                  </div>
                )}

                {(mode === 'login' || mode === 'signup') && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Password</label>
                      {mode === 'login' && (
                        <button 
                          type="button" 
                          onClick={() => { setMode('forgot_password'); setError(null); setMessage(null); setResetSent(false); }}
                          className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <Input 
                      type="password" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-slate-50 border-slate-300"
                    />
                  </div>
                )}

                <Button 
                  type="submit"
                  variant={role === 'employer' ? 'primary' : 'primary'} 
                  className={`w-full ${role === 'employer' && mode !== 'forgot_password' ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/20' : ''}`}
                  isLoading={loading}
                >
                  {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'} 
                  {mode !== 'forgot_password' && <ArrowRight className="w-4 h-4 ml-2" />}
                  {mode === 'forgot_password' && <KeyRound className="w-4 h-4 ml-2" />}
                </Button>
                
                {mode === 'forgot_password' && (
                  <Button 
                    type="button"
                    variant="ghost"
                    className="w-full mt-2"
                    onClick={() => { setMode('login'); setError(null); setMessage(null); setResetSent(false); }}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
                  </Button>
                )}
              </form>
            </>
          )}

          {(mode === 'login' || mode === 'signup') && (
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-400 font-medium">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <Button variant="outline" className="w-full gap-2" onClick={() => handleSocialLogin('github')}>
                  <Github className="w-4 h-4" /> GitHub
                </Button>
                <Button variant="outline" className="w-full gap-2" onClick={() => handleSocialLogin('google')}>
                  <Chrome className="w-4 h-4" /> Google
                </Button>
              </div>
            </div>
          )}
        </Card>

        {(mode === 'login' || mode === 'signup') && (
          <p className="mt-8 text-center text-sm text-slate-500 pb-8">
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={toggleMode}
              className={`font-bold hover:underline ${role === 'employer' ? 'text-purple-600' : 'text-brand-600'}`}
            >
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default Auth;