import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Button, Input, Card } from './ui/DesignSystem';
import { Lock, CheckCircle, AlertCircle, ArrowRight, KeyRound, Command } from 'lucide-react';
import { motion } from 'framer-motion';

interface ResetPasswordProps {
  onComplete: () => void;
}

const ResetPassword: React.FC<ResetPasswordProps> = ({ onComplete }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
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
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-600 shadow-lg shadow-purple-600/20 mb-6">
            <Command className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-display">
            Set New Password
          </h2>
          <p className="text-slate-500 mt-2 text-sm">
            Please enter your new password below.
          </p>
        </div>

        <Card className="shadow-xl shadow-slate-200/50 p-8 border-slate-200">
          {success ? (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Password Updated</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Your password has been successfully reset. You can now log in with your new password.
                </p>
              </div>
              <Button 
                variant="primary" 
                className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                onClick={onComplete}
              >
                Return to Home <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          ) : (
            <form onSubmit={handleUpdate} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-none" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">New Password</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <Input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 bg-slate-50 border-slate-300"
                    />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Confirm Password</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <Input 
                    type="password" 
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 bg-slate-50 border-slate-300"
                    />
                </div>
              </div>

              <Button 
                type="submit"
                variant="primary" 
                className="w-full bg-purple-600 hover:bg-purple-700 shadow-purple-600/20"
                isLoading={loading}
              >
                Update Password <KeyRound className="w-4 h-4 ml-2" />
              </Button>
            </form>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default ResetPassword;