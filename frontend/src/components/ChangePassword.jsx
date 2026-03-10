import { useState } from 'react';
import { authAPI } from '../services/api';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';

export const ChangePassword = () => {
    const [form, setForm] = useState({ old_password: '', new_password: '', confirm_password: '' });
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);

    const inputStyle = { padding: '12px 14px', borderRadius: '8px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none', fontSize: '0.9rem', width: '100%' };

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
        <div style={{ maxWidth: '480px' }}>
            <div className="glass-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Lock size={20} />
                    </div>
                    <div>
                        <h3 style={{ fontWeight: 600, fontSize: '1.1rem' }}>Change Password</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Update your login password</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Current Password</label>
                        <div style={{ position: 'relative' }}>
                            <input required type={showOld ? 'text' : 'password'} placeholder="Enter current password"
                                value={form.old_password} onChange={e => setForm({ ...form, old_password: e.target.value })} style={inputStyle} />
                            <button type="button" onClick={() => setShowOld(!showOld)}
                                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>New Password</label>
                        <div style={{ position: 'relative' }}>
                            <input required type={showNew ? 'text' : 'password'} placeholder="Enter new password"
                                value={form.new_password} onChange={e => setForm({ ...form, new_password: e.target.value })} style={inputStyle} />
                            <button type="button" onClick={() => setShowNew(!showNew)}
                                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Confirm New Password</label>
                        <input required type="password" placeholder="Re-enter new password"
                            value={form.confirm_password} onChange={e => setForm({ ...form, confirm_password: e.target.value })} style={inputStyle} />
                    </div>

                    {status && (
                        <p style={{ fontSize: '0.85rem', padding: '10px', borderRadius: '6px', background: status.startsWith('✅') ? '#51cf6615' : '#ff6b6b15', color: status.startsWith('✅') ? '#51cf66' : '#ff6b6b' }}>
                            {status}
                        </p>
                    )}

                    <button type="submit" disabled={loading}
                        style={{ padding: '12px', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', cursor: loading ? 'wait' : 'pointer', fontWeight: 600, fontSize: '0.95rem' }}>
                        {loading ? 'Changing...' : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};
