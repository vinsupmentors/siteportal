import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI, authAPI } from '../../services/api';
import { User, Lock, Save, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export const Settings = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');

    return (
        <div className="p-6 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-main">Account Settings</h1>
                <p className="text-secondary">Manage your profile, security, and preferences</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-4 border-b border-subtle mb-6">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`pb-3 px-2 font-medium transition-colors ${activeTab === 'profile' ? 'border-b-2 border-main text-main' : 'text-secondary hover:text-main'}`}
                >
                    <div className="flex items-center gap-2">
                        <User size={18} /> Profile Details
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('security')}
                    className={`pb-3 px-2 font-medium transition-colors ${activeTab === 'security' ? 'border-b-2 border-main text-main' : 'text-secondary hover:text-main'}`}
                >
                    <div className="flex items-center gap-2">
                        <Lock size={18} /> Security
                    </div>
                </button>
                {user?.role === 'superadmin' && (
                    <button
                        onClick={() => setActiveTab('preferences')}
                        className={`pb-3 px-2 font-medium transition-colors ${activeTab === 'preferences' ? 'border-b-2 border-main text-main' : 'text-secondary hover:text-main'}`}
                    >
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={18} /> Global Preferences
                        </div>
                    </button>
                )}
            </div>

            {/* Tab Content */}
            <div className="pt-2">
                {activeTab === 'profile' && <ProfileTab />}
                {activeTab === 'security' && <SecurityTab />}
                {activeTab === 'preferences' && user?.role === 'superadmin' && <PreferencesTab />}
            </div>
        </div>
    );
};

// --- Sub Components for Tabs ---

const ProfileTab = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState({ first_name: '', last_name: '', phone: '', email: '', role: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await userAPI.getProfile();
                setProfile(res.data.user);
            } catch (err) {
                console.error('Failed to load profile', err);
                setStatus('❌ Failed to load profile details.');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setStatus('');
        try {
            await userAPI.updateProfile({
                first_name: profile.first_name,
                last_name: profile.last_name,
                phone: profile.phone
            });
            setStatus('✅ Profile updated successfully.');
        } catch (err) {
            setStatus('❌ Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-secondary p-4">Loading profile data...</div>;

    return (
        <form onSubmit={handleSave} className="space-y-6 max-w-xl">
            <h2 className="text-xl font-bold mb-4">Personal Information</h2>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="label">First Name</label>
                    <input
                        type="text"
                        className="input"
                        required
                        value={profile.first_name}
                        onChange={e => setProfile({ ...profile, first_name: e.target.value })}
                    />
                </div>
                <div>
                    <label className="label">Last Name</label>
                    <input
                        type="text"
                        className="input"
                        required
                        value={profile.last_name}
                        onChange={e => setProfile({ ...profile, last_name: e.target.value })}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="label">Phone Number</label>
                    <input
                        type="tel"
                        className="input"
                        value={profile.phone || ''}
                        onChange={e => setProfile({ ...profile, phone: e.target.value })}
                        placeholder="e.g. +91 9876543210"
                    />
                </div>
                <div>
                    <label className="label">Account Role</label>
                    <input
                        type="text"
                        className="input opacity-50 cursor-not-allowed capitalize"
                        disabled
                        value={profile.role}
                    />
                </div>
            </div>

            <div>
                <label className="label">Email Address (Immutable)</label>
                <input
                    type="email"
                    className="input opacity-50 cursor-not-allowed"
                    disabled
                    value={profile.email}
                />
                <p className="text-xs text-muted mt-1">Contact your administrator if you need to change your registered email address.</p>
            </div>

            {status && (
                <div className={`p-3 rounded text-sm ${status.startsWith('✅') ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {status}
                </div>
            )}

            <div className="pt-4 flex justify-end">
                <button type="submit" disabled={saving} className="btn btn-primary flex items-center gap-2">
                    <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </form>
    );
};

const SecurityTab = () => {
    const [form, setForm] = useState({ old_password: '', new_password: '', confirm_password: '' });
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.new_password !== form.confirm_password) {
            setStatus('❌ New passwords do not match.');
            return;
        }
        if (form.new_password.length < 4) {
            setStatus('❌ Password must be at least 4 characters.');
            return;
        }
        setLoading(true);
        setStatus('');
        try {
            await authAPI.changePassword({ old_password: form.old_password, new_password: form.new_password });
            setStatus('✅ Password changed successfully! Use your new password next time you log in.');
            setForm({ old_password: '', new_password: '', confirm_password: '' });
        } catch (err) {
            setStatus('❌ ' + (err.response?.data?.message || 'Failed to change password.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
            <h2 className="text-xl font-bold mb-4">Change Password</h2>

            <div>
                <label className="label">Current Password</label>
                <div className="relative">
                    <input
                        required
                        type={showOld ? 'text' : 'password'}
                        className="input"
                        placeholder="Enter current password"
                        value={form.old_password}
                        onChange={e => setForm({ ...form, old_password: e.target.value })}
                    />
                    <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-main">
                        {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
            </div>

            <div>
                <label className="label">New Password</label>
                <div className="relative">
                    <input
                        required
                        type={showNew ? 'text' : 'password'}
                        className="input"
                        placeholder="Enter new password"
                        value={form.new_password}
                        onChange={e => setForm({ ...form, new_password: e.target.value })}
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-main">
                        {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
            </div>

            <div>
                <label className="label">Confirm New Password</label>
                <input
                    required
                    type="password"
                    className="input"
                    placeholder="Re-enter new password"
                    value={form.confirm_password}
                    onChange={e => setForm({ ...form, confirm_password: e.target.value })}
                />
            </div>

            {status && (
                <div className={`p-3 rounded text-sm ${status.startsWith('✅') ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {status}
                </div>
            )}

            <div className="pt-4 flex justify-end">
                <button type="submit" disabled={loading} className="btn btn-primary flex items-center gap-2">
                    <Lock size={18} /> {loading ? 'Updating...' : 'Update Password'}
                </button>
            </div>
        </form>
    );
};

const PreferencesTab = () => {
    return (
        <div className="max-w-2xl py-4">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-main">
                <ShieldCheck /> System wide rules (SuperAdmin)
            </h2>
            <div className="border border-orange-500/20 bg-orange-500/5 p-4 rounded-xl text-orange-200">
                <p className="font-bold mb-2">Notice</p>
                <p className="text-sm">Global preferences like registration locks, batch migrations, and system-wide default assignments are managed here. This module is currently under development.</p>
            </div>
        </div>
    );
};
