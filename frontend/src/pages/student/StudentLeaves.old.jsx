import React, { useState, useEffect } from 'react';
import {
    Calendar, CheckCircle, XCircle, Clock,
    Plus, Send, UserCheck, AlertCircle, ArrowRight, X
} from 'lucide-react';

// Fallback/Mock definitions for preview compilation
const studentAPI = {
    getLeaves: async () => ({ data: [] }),
    getDashboardStats: async () => ({ data: { activeBatch: { id: 'batch_123' } } }),
    applyForLeave: async (data) => new Promise(resolve => setTimeout(resolve, 800))
};

const format = (date, fmt) => new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: fmt.includes('h:mm') ? 'short' : undefined
}).format(date);

const differenceInDays = (end, start) => Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));

export const StudentLeaves = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({ start_date: '', end_date: '', reason: '' });
    const [filter, setFilter] = useState('all');

    const fetchLeaves = async () => {
        try {
            const res = await studentAPI.getLeaves();
            setLeaves(res.data || []);
        } catch { }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchLeaves(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const dashRes = await studentAPI.getDashboardStats();
            const batchId = dashRes.data.activeBatch?.id;
            await studentAPI.applyForLeave({ ...formData, batch_id: batchId });
            setFormData({ start_date: '', end_date: '', reason: '' });
            setShowForm(false);
            fetchLeaves();
        } catch (err) {
            alert("Failed: " + (err.response?.data?.message || err.message));
        } finally { setSubmitting(false); }
    };

    const statusConfig = {
        approved: {
            label: 'APPROVED',
            badge: 'text-emerald-400',
            bar: 'from-emerald-400 to-teal-400',
            dot: 'bg-emerald-400',
            iconBg: 'bg-emerald-500/15',
            iconColor: 'text-emerald-400',
            icon: <CheckCircle size={18} />,
        },
        rejected: {
            label: 'REJECTED',
            badge: 'text-red-400',
            bar: 'from-red-400 to-rose-400',
            dot: 'bg-red-400',
            iconBg: 'bg-red-500/15',
            iconColor: 'text-red-400',
            icon: <XCircle size={18} />,
        },
        pending: {
            label: 'PENDING',
            badge: 'text-amber-400',
            bar: 'from-amber-400 to-orange-400',
            dot: 'bg-amber-400',
            iconBg: 'bg-amber-500/15',
            iconColor: 'text-amber-400',
            icon: <Clock size={18} />,
        },
    };

    const leaveStats = {
        total: leaves.length,
        approved: leaves.filter(l => l.status === 'approved').length,
        pending: leaves.filter(l => l.status === 'pending').length,
        rejected: leaves.filter(l => l.status === 'rejected').length,
    };

    const filtered = filter === 'all' ? leaves : leaves.filter(l => l.status === filter);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh] bg-[#0f1523]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500" />
        </div>
    );

    return (
        <div className="animate-fadeIn pb-12 bg-[#0f1523] min-h-screen text-white p-6 md:p-10 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* ═══════ Header ═══════ */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Leave Management</h1>
                        <p className="text-gray-400 text-sm font-medium mt-1">Apply for absence and track approvals</p>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-teal-500 text-white rounded-full font-semibold text-xs hover:bg-teal-400 transition-colors shadow-lg shadow-teal-500/10 shrink-0"
                    >
                        <Plus size={16} strokeWidth={2.5} /> Apply for Leave
                    </button>
                </div>

                {/* ═══════ Stat Cards ═══════ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'TOTAL LEAVES', value: leaveStats.total, bg: 'bg-teal-500/10', color: 'text-teal-400', icon: <Calendar size={18} /> },
                        { label: 'PENDING', value: leaveStats.pending, bg: 'bg-amber-500/10', color: 'text-amber-400', icon: <Clock size={18} /> },
                        { label: 'APPROVED', value: leaveStats.approved, bg: 'bg-emerald-500/10', color: 'text-emerald-400', icon: <CheckCircle size={18} /> },
                        { label: 'REJECTED', value: leaveStats.rejected, bg: 'bg-red-500/10', color: 'text-red-400', icon: <XCircle size={18} /> },
                    ].map((s, i) => (
                        <div key={i} className="bg-[#141d2f] border border-white/[0.04] rounded-2xl p-5 flex items-center gap-4 hover:border-white/[0.08] transition-colors">
                            <div className={`w-10 h-10 rounded-full ${s.bg} flex items-center justify-center ${s.color} shrink-0`}>
                                {s.icon}
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">{s.label}</p>
                                <p className="text-2xl font-bold text-white leading-none">{s.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ═══════ Leave Application Form ═══════ */}
                {showForm && (
                    <div className="bg-[#141d2f] border border-teal-500/20 rounded-2xl mb-8 overflow-hidden transition-all duration-300">
                        <div className="flex items-center justify-between bg-teal-500/5 px-6 py-4 border-b border-teal-500/10">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-teal-500/20 rounded-lg flex items-center justify-center">
                                    <Calendar size={16} className="text-teal-400" />
                                </div>
                                <h3 className="font-bold text-white text-sm">New Leave Application</h3>
                            </div>
                            <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 block">Start Date</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full px-4 py-2.5 bg-[#0a0f18] border border-white/[0.06] rounded-xl text-sm font-medium text-white focus:ring-1 focus:ring-teal-500/50 focus:border-teal-500/50 outline-none transition-all"
                                            value={formData.start_date}
                                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 block">End Date</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full px-4 py-2.5 bg-[#0a0f18] border border-white/[0.06] rounded-xl text-sm font-medium text-white focus:ring-1 focus:ring-teal-500/50 focus:border-teal-500/50 outline-none transition-all"
                                            value={formData.end_date}
                                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="w-full py-2.5 bg-teal-500 text-white rounded-xl font-bold text-sm hover:bg-teal-400 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:hover:bg-teal-500"
                                        >
                                            <Send size={14} /> {submitting ? 'Submitting...' : 'Submit Application'}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 block">Reason for Leave</label>
                                    <textarea
                                        rows="2"
                                        required
                                        placeholder="Briefly explain your reason for leave..."
                                        className="w-full p-4 bg-[#0a0f18] border border-white/[0.06] rounded-xl text-sm font-medium text-white focus:ring-1 focus:ring-teal-500/50 focus:border-teal-500/50 outline-none transition-all resize-none placeholder:text-gray-600"
                                        value={formData.reason}
                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    />
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ═══════ My Applications Header + Filters ═══════ */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                    <h2 className="text-base font-bold text-white">My Applications</h2>
                    <div className="flex flex-wrap gap-2">
                        {['All', 'Pending', 'Approved', 'Rejected'].map(f => {
                            const key = f.toLowerCase();
                            return (
                                <button
                                    key={key}
                                    onClick={() => setFilter(key)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${filter === key
                                        ? 'bg-teal-500 text-white'
                                        : 'bg-[#141d2f] border border-white/[0.04] text-gray-400 hover:text-white'
                                        }`}
                                >
                                    {f}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ═══════ Leave Cards ═══════ */}
                <div className="mb-8">
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 bg-[#141d2f] rounded-2xl border border-white/[0.04]">
                            <div className="w-16 h-16 bg-[#0a0f18] rounded-full flex items-center justify-center mb-4">
                                <Calendar size={28} className="text-teal-500/40" />
                            </div>
                            <h4 className="text-base font-bold text-white">No applications</h4>
                            <p className="text-gray-400 mt-1 mb-5 font-medium text-xs text-center">
                                {filter === 'all' ? "You haven't applied for any leaves yet." : `No ${filter} applications found.`}
                            </p>
                            {filter === 'all' && (
                                <button
                                    onClick={() => setShowForm(true)}
                                    className="flex items-center gap-1.5 px-4 py-1.5 bg-teal-500 text-white rounded-full font-semibold text-xs hover:bg-teal-400 transition-colors shadow-lg shadow-teal-500/10"
                                >
                                    <Plus size={14} /> Apply for Leave
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filtered.map(leave => {
                                const s = statusConfig[leave.status] || statusConfig.pending;
                                const start = new Date(leave.start_date);
                                const end = new Date(leave.end_date);
                                const days = Math.max(1, differenceInDays(end, start) + 1);
                                return (
                                    <div key={leave.id} className="bg-[#141d2f] rounded-2xl overflow-hidden border border-white/[0.04] hover:border-white/[0.08] transition-colors">
                                        <div className={`h-[2px] w-full bg-gradient-to-r ${s.bar}`} />
                                        <div className="p-6">
                                            {/* Status Row */}
                                            <div className="flex items-center justify-between mb-5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-full ${s.iconBg} flex items-center justify-center ${s.iconColor}`}>
                                                        {s.icon}
                                                    </div>
                                                    <div>
                                                        <p className={`text-xs font-bold tracking-wide ${s.badge}`}>✓ {s.label}</p>
                                                        <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                                                            {format(new Date(leave.created_at || leave.start_date), 'MMM d, yyyy · h:mm a')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Date Range Card */}
                                            <div className="bg-[#0a0f18]/50 border border-white/[0.04] rounded-xl p-5 mb-4">
                                                <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
                                                    <Calendar size={12} /> LEAVE PERIOD
                                                </p>
                                                <div className="flex items-center gap-6">
                                                    <div>
                                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">From</p>
                                                        <p className="text-base font-bold text-white">{format(start, 'MMM d, yyyy')}</p>
                                                    </div>
                                                    <ArrowRight size={16} className="text-gray-600" />
                                                    <div>
                                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">To</p>
                                                        <p className="text-base font-bold text-white">{format(end, 'MMM d, yyyy')}</p>
                                                    </div>
                                                    <div className="ml-auto bg-teal-500/10 border border-teal-500/20 rounded-lg px-4 py-2 text-center">
                                                        <p className="text-xl font-bold text-teal-400 leading-none">{days}</p>
                                                        <p className="text-[8px] font-bold uppercase tracking-widest text-gray-500 mt-1">Day{days > 1 ? 's' : ''}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Reason Card */}
                                            <div className="bg-[#0a0f18]/50 border border-white/[0.04] rounded-xl p-5">
                                                <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
                                                    <UserCheck size={12} /> REASON
                                                </p>
                                                <p className="text-sm font-medium text-gray-300 leading-relaxed">{leave.reason}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ═══════ Policy & Warning Footer ═══════ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Attendance Policy */}
                    <div className="bg-[#141d2f] border border-white/[0.04] rounded-2xl p-6 relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-8 h-8 bg-teal-500/10 rounded-full flex items-center justify-center">
                                    <UserCheck size={16} className="text-teal-400" />
                                </div>
                                <h4 className="font-bold text-base text-white">Attendance Policy</h4>
                            </div>
                            <div className="space-y-4">
                                {[
                                    'Maintain 85% attendance for placement eligibility.',
                                    'Inform your trainer 24 hours in advance.',
                                    'Medical leaves require official documentation.',
                                ].map((rule, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <span className="w-5 h-5 rounded bg-teal-500/15 flex items-center justify-center shrink-0 text-[10px] font-bold text-teal-400">{i + 1}</span>
                                        <p className="text-xs font-medium text-gray-400 leading-relaxed pt-0.5">{rule}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Important Notice */}
                    <div className="bg-[#1e160f] border border-amber-900/30 rounded-2xl p-6">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-amber-500/10 rounded-full flex items-center justify-center shrink-0">
                                <AlertCircle size={16} className="text-amber-500" />
                            </div>
                            <div>
                                <h4 className="font-bold text-base text-amber-500 mb-2">Important Notice</h4>
                                <p className="text-xs font-medium text-amber-500/70 leading-relaxed">
                                    Approved leaves still count toward your attendance calculation. Check your attendance record regularly and plan your leaves wisely to maintain eligibility.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentLeaves;