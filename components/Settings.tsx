import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Save, Loader2, Lock, Bell, Moon } from 'lucide-react';
import { Card, Button, Input, Badge } from './ui/DesignSystem';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { UserRole } from '../types';
import { containerVariants, itemVariants } from '../lib/utils';

interface SettingsProps {
  user: { name: string; email: string; role?: UserRole };
  onUpdateProfile: (name: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onUpdateProfile }) => {
  const [name, setName] = useState(user.name);
  const [password, setPassword] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Load existing preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser?.user_metadata) {
        if (currentUser.user_metadata.email_notifications !== undefined) {
          setEmailNotifications(currentUser.user_metadata.email_notifications);
        }
        if (currentUser.user_metadata.marketing_emails !== undefined) {
          setMarketingEmails(currentUser.user_metadata.marketing_emails);
        }
      }
    };
    loadPreferences();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const updates: any = {
        data: { 
            full_name: name,
            email_notifications: emailNotifications,
            marketing_emails: marketingEmails
        }
      };

      if (password) {
        updates.password = password;
      }

      const { error } = await supabase.auth.updateUser(updates);

      if (error) throw error;

      onUpdateProfile(name);
      setMessage({ type: 'success', text: 'Profile updated successfully' });
      setPassword('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const Toggle = ({ checked, onChange }: { checked: boolean, onChange: (val: boolean) => void }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
        transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2
        ${checked ? 'bg-brand-600' : 'bg-slate-200 hover:bg-slate-300'}
      `}
    >
      <span
        aria-hidden="true"
        className={`
          pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
          transition duration-200 ease-in-out
          ${checked ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  );

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-display">Account Settings</h1>
        <p className="text-slate-500 mt-2">Manage your profile information and account security.</p>
      </div>

      <form onSubmit={handleUpdate}>
        <div className="grid gap-8">
          {/* Profile Section */}
          <motion.div variants={itemVariants}>
            <Card className="p-0 overflow-hidden border-slate-200">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600">
                   <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Profile Information</h3>
                  <p className="text-xs text-slate-500">Update your public profile details.</p>
                </div>
              </div>
              <div className="p-6 space-y-6 bg-white">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <Input 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        className="pl-10"
                        placeholder="Your full name"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <Input 
                        value={user.email} 
                        disabled 
                        className="pl-10 bg-slate-50 text-slate-500"
                      />
                    </div>
                    <p className="text-xs text-slate-400">Email cannot be changed.</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Account Role</label>
                  <div>
                    <Badge variant={user.role === 'employer' ? 'brand' : 'info'} className="text-sm px-3 py-1 capitalize">
                      {user.role || 'Candidate'}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Security Section */}
          <motion.div variants={itemVariants}>
            <Card className="p-0 overflow-hidden border-slate-200">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                   <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Security</h3>
                  <p className="text-xs text-slate-500">Manage your password and security settings.</p>
                </div>
              </div>
              <div className="p-6 space-y-6 bg-white">
                <div className="space-y-2 max-w-md">
                   <label className="text-sm font-semibold text-slate-700">New Password</label>
                   <div className="relative">
                      <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <Input 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        placeholder="Leave blank to keep current password"
                        minLength={6}
                      />
                   </div>
                   <p className="text-xs text-slate-400">Must be at least 6 characters long.</p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Notifications Section */}
           <motion.div variants={itemVariants}>
            <Card className="p-0 overflow-hidden border-slate-200">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                   <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Notifications</h3>
                  <p className="text-xs text-slate-500">Manage your email and push notifications.</p>
                </div>
              </div>
              <div className="p-6 space-y-6 bg-white">
                 <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <div>
                        <span className="text-sm font-medium text-slate-900 block">Email Notifications</span>
                        <span className="text-xs text-slate-500">Receive updates about your account activity.</span>
                    </div>
                    <Toggle checked={emailNotifications} onChange={setEmailNotifications} />
                 </div>
                 <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <div>
                        <span className="text-sm font-medium text-slate-900 block">Marketing Emails</span>
                        <span className="text-xs text-slate-500">Receive news, tips, and special offers.</span>
                    </div>
                    <Toggle checked={marketingEmails} onChange={setMarketingEmails} />
                 </div>
              </div>
              
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                 <div className="text-sm">
                   {message && (
                     <span className={message.type === 'success' ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>
                       {message.text}
                     </span>
                   )}
                 </div>
                 <Button type="submit" disabled={loading} className="min-w-[120px]">
                   {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
                 </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </form>
    </motion.div>
  );
};

export default Settings;