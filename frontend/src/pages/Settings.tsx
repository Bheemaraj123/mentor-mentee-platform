import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Lock, User, AlertCircle, CheckCircle, Bell, Palette, LogOut } from 'lucide-react';
import { toast } from 'sonner';

export const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Profile form state
  const [profile, setProfile] = useState({
    full_name: user?.full_name || '',
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'appearance'>('profile');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => (localStorage.getItem('theme') as any) || 'light');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', systemDark);
    }
    toast.success('Theme updated');
  };

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationKey: ['update-profile'],
    mutationFn: (data: { full_name: string }) =>
      api.put('/auth/profile', data).then(r => r.data),
    onSuccess: () => {
      setMessage({ type: 'success', text: 'Profile updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast.success('Profile updated');
    },
    onError: (err: any) => {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to update profile' });
      toast.error('Failed to update profile');
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationKey: ['change-password'],
    mutationFn: (data: { current_password: string; new_password: string }) =>
      api.post('/auth/change-password', data).then(r => r.data),
    onSuccess: () => {
      setMessage({ type: 'success', text: 'Password changed successfully' });
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      toast.success('Password changed');
    },
    onError: (err: any) => {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to change password' });
      toast.error('Failed to change password');
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profile);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      toast.error('Passwords do not match');
      return;
    }
    if (passwordForm.new_password.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      toast.error('Password must be at least 8 characters');
      return;
    }
    changePasswordMutation.mutate({
      current_password: passwordForm.current_password,
      new_password: passwordForm.new_password,
    });
  };

  return (
    <div className="page-content">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Workspace settings</p>
          <h1>Settings</h1>
          <p className="page-description">Manage your profile, security, and preferences.</p>
        </div>
      </section>

      {message && (
        <div className={`surface-card pill ${message.type === 'success' ? 'pill-ready' : 'pill-high'}`} style={{width: 'fit-content', marginBottom: '24px'}}>
          {message.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="surface-card" style={{padding: '16px 16px 8px', marginBottom: '24px'}}>
        <div className="flex gap-4" role="tablist">
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'security', label: 'Security', icon: Lock },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'appearance', label: 'Appearance', icon: Palette },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`nav-item ${activeTab === tab.id ? 'nav-active' : ''}`}
                style={{height: '40px', padding: '0 12px', background: activeTab === tab.id ? '#e6efff' : 'transparent'}}
              >
                <Icon size={18} strokeWidth={activeTab === tab.id ? 2.2 : 1.8} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSubmit} className="surface-card" style={{maxWidth: '520px', padding: '24px'}}>
          <div className="card-heading" style={{marginBottom: '24px', borderBottom: 'none', paddingBottom: '0'}}>
            <div>
              <span className="section-kicker">Personal info</span>
              <h3>Profile information</h3>
            </div>
          </div>

          <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium mb-1" style={{color: '#6a7a92'}}>Full Name</label>
              <input
                id="fullName"
                type="text"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                required
                style={{fontSize: '13px', background: 'white', borderColor: '#dfe7f0', borderRadius: '9px', padding: '10px 11px'}}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1" style={{color: '#6a7a92'}}>Email</label>
              <input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 bg-gray-100 dark:bg-gray-800"
                style={{fontSize: '13px', background: '#f4f7fb', borderColor: '#dfe7f0', borderRadius: '9px', padding: '10px 11px'}}
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium mb-1" style={{color: '#6a7a92'}}>Role</label>
              <input
                id="role"
                type="text"
                value={user?.role || ''}
                disabled
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 bg-gray-100 dark:bg-gray-800"
                style={{fontSize: '13px', background: '#f4f7fb', borderColor: '#dfe7f0', borderRadius: '9px', padding: '10px 11px'}}
              />
            </div>

            <div>
              <label htmlFor="memberSince" className="block text-sm font-medium mb-1" style={{color: '#6a7a92'}}>Member Since</label>
              <input
                id="memberSince"
                type="text"
                value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : ''}
                disabled
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 bg-gray-100 dark:bg-gray-800"
                style={{fontSize: '13px', background: '#f4f7fb', borderColor: '#dfe7f0', borderRadius: '9px', padding: '10px 11px'}}
              />
            </div>

            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="primary-button"
              style={{marginTop: '8px', width: '100%'}}
            >
              <Save className="w-4 h-4" />
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>

            <button
              type="button"
              onClick={() => { logout(); navigate('/login'); }}
              className="outline-button"
              style={{marginTop: '8px', width: '100%', color: '#e11d48', borderColor: '#e11d48'}}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </form>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <form onSubmit={handlePasswordSubmit} className="surface-card" style={{maxWidth: '520px', padding: '24px'}}>
          <div className="card-heading" style={{marginBottom: '24px', borderBottom: 'none', paddingBottom: '0'}}>
            <div>
              <span className="section-kicker">Account security</span>
              <h3>Change password</h3>
            </div>
          </div>

          <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium mb-1" style={{color: '#6a7a92'}}>Current Password</label>
              <input
                id="currentPassword"
                type="password"
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                required
                style={{fontSize: '13px', background: 'white', borderColor: '#dfe7f0', borderRadius: '9px', padding: '10px 11px'}}
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium mb-1" style={{color: '#6a7a92'}}>New Password</label>
              <input
                id="newPassword"
                type="password"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                required
                minLength={8}
                style={{fontSize: '13px', background: 'white', borderColor: '#dfe7f0', borderRadius: '9px', padding: '10px 11px'}}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1" style={{color: '#6a7a92'}}>Confirm New Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                required
                style={{fontSize: '13px', background: 'white', borderColor: '#dfe7f0', borderRadius: '9px', padding: '10px 11px'}}
              />
            </div>

            <button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="primary-button"
              style={{marginTop: '8px', width: '100%'}}
            >
              <Lock className="w-4 h-4" />
              {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="surface-card" style={{maxWidth: '520px', padding: '24px'}}>
          <div className="card-heading" style={{marginBottom: '24px', borderBottom: 'none', paddingBottom: '0'}}>
            <div>
              <span className="section-kicker">Notification preferences</span>
              <h3>Manage notifications</h3>
            </div>
          </div>

          <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
            {[
              { id: 'email-reports', label: 'Report updates', desc: 'Get notified when reports are shared or approved' },
              { id: 'email-tasks', label: 'Task assignments', desc: 'Receive alerts when new tasks are assigned to you' },
              { id: 'email-mentions', label: 'Mentions', desc: 'Get notified when you are mentioned in comments' },
              { id: 'email-digest', label: 'Weekly digest', desc: 'Receive a weekly summary of your mentorship activity' },
            ].map((item) => (
              <label key={item.id} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #edf1f5'}}>
                <div>
                  <strong style={{fontSize: '13px', color: '#15233e'}}>{item.label}</strong>
                  <div style={{fontSize: '11px', color: '#9aa7b8', marginTop: '2px'}}>{item.desc}</div>
                </div>
                <input
                  type="checkbox"
                  defaultChecked={true}
                  style={{width: '20px', height: '20px', accentColor: '#2f6bff'}}
                />
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Appearance Tab */}
      {activeTab === 'appearance' && (
        <div className="surface-card" style={{maxWidth: '520px', padding: '24px'}}>
          <div className="card-heading" style={{marginBottom: '24px', borderBottom: 'none', paddingBottom: '0'}}>
            <div>
              <span className="section-kicker">Visual preferences</span>
              <h3>Appearance</h3>
            </div>
          </div>

          <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #edf1f5'}}>
              <div>
                <strong style={{fontSize: '13px', color: '#15233e'}}>Theme</strong>
                <div style={{fontSize: '11px', color: '#9aa7b8', marginTop: '2px'}}>Choose your preferred color scheme</div>
              </div>
              <div style={{display: 'flex', gap: '8px'}}>
                <button className={theme === 'light' ? 'secondary-button' : 'outline-button'} onClick={() => handleThemeChange('light')} style={{padding: '8px 12px', fontSize: '11px'}}>Light</button>
                <button className={theme === 'dark' ? 'secondary-button' : 'outline-button'} onClick={() => handleThemeChange('dark')} style={{padding: '8px 12px', fontSize: '11px'}}>Dark</button>
                <button className={theme === 'system' ? 'secondary-button' : 'outline-button'} onClick={() => handleThemeChange('system')} style={{padding: '8px 12px', fontSize: '11px'}}>System</button>
              </div>
            </div>

            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #edf1f5'}}>
              <div>
                <strong style={{fontSize: '13px', color: '#15233e'}}>Density</strong>
                <div style={{fontSize: '11px', color: '#9aa7b8', marginTop: '2px'}}>Adjust spacing and compactness</div>
              </div>
              <div style={{display: 'flex', gap: '8px'}}>
                <button className="outline-button" style={{padding: '8px 12px', fontSize: '11px'}}>Comfortable</button>
                <button className="secondary-button" style={{padding: '8px 12px', fontSize: '11px'}}>Compact</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};