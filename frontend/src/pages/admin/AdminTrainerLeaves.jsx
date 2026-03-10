import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Calendar, Clock, CheckCircle, XCircle, User, Briefcase, Filter, Info } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

export const AdminTrainerLeaves = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
    const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });

    const fetchLeaves = async () => {
        setLoading(true);
        try {
            const res = await adminAPI.getTrainerLeaves();
            setLeaves(res.data);

            // Calculate stats
            const s = res.data.reduce((acc, curr) => {
                acc[curr.status]++;
                return acc;
            }, { pending: 0, approved: 0, rejected: 0 });
            setStats(s);
        } catch (error) {
            console.error("Failed to fetch trainer leaves:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaves();
    }, []);

    const filteredLeaves = leaves.filter(l => filter === 'all' ? true : l.status === filter);

    return (
        <div className="portal-page" style={{ animation: 'fadeIn 0.5s ease' }}>
            <div className="page-header">
                <div>
                    <h1>Operational Attendance (Staff)</h1>
                    <p>Monitoring trainer leave schedules and availability across the ecosystem.</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-secondary flex gap-2" onClick={fetchLeaves}>
                        <Clock size={16} /> Refresh Watchlist
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-3 gap-4 mb-4">
                <div className="card" style={{ borderLeft: '4px solid #fab005' }}>
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="text-secondary text-xs font-bold uppercase tracking-wider mb-1">Awaiting Action</div>
                            <h2 style={{ color: '#fab005', margin: 0 }}>{stats.pending}</h2>
                        </div>
                        <Clock size={32} style={{ opacity: 0.2 }} />
                    </div>
                </div>
                <div className="card" style={{ borderLeft: '4px solid #20c997' }}>
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="text-secondary text-xs font-bold uppercase tracking-wider mb-1">Approved This Month</div>
                            <h2 style={{ color: '#20c997', margin: 0 }}>{stats.approved}</h2>
                        </div>
                        <CheckCircle size={32} style={{ opacity: 0.2 }} />
                    </div>
                </div>
                <div className="card" style={{ borderLeft: '4px solid #ff6b6b' }}>
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="text-secondary text-xs font-bold uppercase tracking-wider mb-1">Total Rejected</div>
                            <h2 style={{ color: '#ff6b6b', margin: 0 }}>{stats.rejected}</h2>
                        </div>
                        <XCircle size={32} style={{ opacity: 0.2 }} />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card mb-4 p-3 flex justify-between items-center flex-wrap gap-4">
                <div className="flex gap-2">
                    {['all', 'pending', 'approved', 'rejected'].map(s => (
                        <button
                            key={s}
                            className={`btn text-sm capitalize ${filter === s ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setFilter(s)}
                        >
                            {s}
                        </button>
                    ))}
                </div>
                <div className="text-secondary text-sm flex items-center gap-2">
                    <Filter size={14} /> Showing {filteredLeaves.length} items
                </div>
            </div>

            {/* Leave List */}
            {loading ? (
                <div className="card text-center p-5">
                    <div className="spinner mb-3"></div>
                    <p className="text-secondary">Syncing staff records...</p>
                </div>
            ) : filteredLeaves.length === 0 ? (
                <div className="card text-center p-5 bg-light">
                    <Calendar size={48} className="text-secondary mb-3 opacity-20" />
                    <h4>No records found</h4>
                    <p className="text-secondary">There are no leave requests matching the current filters.</p>
                </div>
            ) : (
                <div className="grid grid-1 gap-4">
                    {filteredLeaves.map(leave => {
                        const start = new Date(leave.start_date);
                        const end = new Date(leave.end_date);
                        const days = differenceInDays(end, start) + 1;

                        return (
                            <div key={leave.id} className="card shadow-sm" style={{ borderLeft: `4px solid ${leave.status === 'approved' ? '#20c997' : leave.status === 'rejected' ? '#ff6b6b' : '#fab005'}` }}>
                                <div className="flex justify-between items-start flex-wrap gap-4">
                                    <div className="flex gap-4">
                                        <div className="bg-dark rounded p-3 flex flex-column items-center justify-center text-white" style={{ minWidth: '70px', height: '70px' }}>
                                            <span className="text-xs font-bold uppercase">{format(start, 'MMM')}</span>
                                            <span className="text-2xl font-black">{format(start, 'dd')}</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="m-0 text-lg font-bold">{leave.trainer_name}</h4>
                                                <span className={`badge ${leave.status === 'pending' ? 'badge-warning' : leave.status === 'approved' ? 'badge-success' : 'badge-danger'}`}>
                                                    {leave.status.toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="text-secondary text-sm flex items-center gap-3">
                                                <span className="flex items-center gap-1 text-primary font-bold">
                                                    <Briefcase size={12} /> {leave.leave_type.toUpperCase()}
                                                    {leave.session !== 'full_day' && ` (${leave.session.replace('_', ' ').toUpperCase()})`}
                                                </span>
                                                <span className="flex items-center gap-1 font-bold">
                                                    <Calendar size={12} /> {leave.session === 'full_day' ? `${days} Day${days > 1 ? 's' : ''}` : '0.5 Day'}
                                                </span>
                                            </div>
                                            <div className="mt-2 text-dark font-medium leading-relaxed">
                                                <Info size={14} className="text-primary mr-1 inline" /> {leave.reason}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="ml-auto text-right">
                                        <div className="text-xs text-secondary mb-2">
                                            Log ID: {leave.id} • Applied {format(new Date(leave.created_at), 'MMM d, yyyy')}
                                        </div>
                                        {leave.status !== 'pending' && (
                                            <div className="bg-light p-2 rounded border text-sm text-left" style={{ minWidth: '220px' }}>
                                                <div className="text-xs font-bold text-secondary mb-1">REVIEWED BY: {leave.reviewed_by_name || 'SYSTEM/SA'}</div>
                                                {leave.rejection_reason && (
                                                    <div className="text-danger italic mt-1">"{leave.rejection_reason}"</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-3 border-top pt-2 flex items-center gap-4 text-xs text-secondary">
                                    <div className="flex items-center gap-1">
                                        <Clock size={12} /> Timeframe: {format(start, 'MMM d')} — {format(end, 'MMM d, yyyy')}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default AdminTrainerLeaves;
