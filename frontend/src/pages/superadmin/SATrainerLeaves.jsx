import { useState, useEffect } from 'react';
import { superAdminAPI } from '../../services/api';
import { Calendar, Clock, CheckCircle, XCircle, User, Briefcase, Filter, Info, ChevronRight, MessageSquare } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

export const SATrainerLeaves = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending'); // all, pending, approved, rejected
    const [processingId, setProcessingId] = useState(null);
    const [actionReason, setActionReason] = useState('');
    const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });

    const fetchLeaves = async () => {
        setLoading(true);
        try {
            const res = await superAdminAPI.getAllTrainerLeaves();
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

    const handleAction = async (id, status) => {
        if (status === 'rejected' && !actionReason.trim()) {
            alert("Please provide a reason for rejection.");
            return;
        }

        try {
            await superAdminAPI.updateTrainerLeaveStatus(id, {
                status,
                rejection_reason: actionReason
            });
            setProcessingId(null);
            setActionReason('');
            fetchLeaves();
        } catch (error) {
            console.error("Failed to update leave status:", error);
            alert("Error updating leave request.");
        }
    };

    const filteredLeaves = leaves.filter(l => filter === 'all' ? true : l.status === filter);

    return (
        <div className="portal-page" style={{ animation: 'fadeIn 0.5s ease' }}>
            <div className="page-header">
                <div>
                    <h1>Trainer Leave Management</h1>
                    <p>Review and process leave applications from the training team.</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-secondary flex gap-2" onClick={fetchLeaves}>
                        <Clock size={16} /> Refresh Data
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-3 gap-4 mb-4">
                <div className="card bg-warning-light border-top-warning">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="text-secondary text-xs font-bold uppercase tracking-wider mb-1">Pending Requests</div>
                            <h2 className="text-warning m-0">{stats.pending}</h2>
                        </div>
                        <Clock className="text-warning-subtle" size={32} />
                    </div>
                </div>
                <div className="card bg-success-light border-top-success">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="text-secondary text-xs font-bold uppercase tracking-wider mb-1">Approved This Month</div>
                            <h2 className="text-success m-0">{stats.approved}</h2>
                        </div>
                        <CheckCircle className="text-success-subtle" size={32} />
                    </div>
                </div>
                <div className="card bg-danger-light border-top-danger">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="text-secondary text-xs font-bold uppercase tracking-wider mb-1">Rejected History</div>
                            <h2 className="text-danger m-0">{stats.rejected}</h2>
                        </div>
                        <XCircle className="text-danger-subtle" size={32} />
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
                    <p className="text-secondary">Loading leave applications...</p>
                </div>
            ) : filteredLeaves.length === 0 ? (
                <div className="card text-center p-5 bg-light">
                    <Calendar size={48} className="text-secondary mb-3 opacity-20" />
                    <h4>No {filter !== 'all' ? filter : ''} leave requests found</h4>
                    <p className="text-secondary">All caught up! No requests to display for the current filter.</p>
                </div>
            ) : (
                <div className="grid grid-1 gap-4">
                    {filteredLeaves.map(leave => {
                        const start = new Date(leave.start_date);
                        const end = new Date(leave.end_date);
                        const days = differenceInDays(end, start) + 1;
                        const isPending = leave.status === 'pending';

                        return (
                            <div key={leave.id} className={`card ${isPending ? 'border-left-warning' : leave.status === 'approved' ? 'border-left-success' : 'border-left-danger'}`}>
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
                                                <span className="flex items-center gap-1"><User size={12} /> Trainer</span>
                                                <span className="flex items-center gap-1 text-primary font-bold">
                                                    <Briefcase size={12} /> {leave.leave_type.toUpperCase()}
                                                    {leave.session !== 'full_day' && ` (${leave.session.replace('_', ' ').toUpperCase()})`}
                                                </span>
                                                <span className="flex items-center gap-1 font-bold">
                                                    <Calendar size={12} /> {leave.session === 'full_day' ? `${days} Day${days > 1 ? 's' : ''}` : '0.5 Day'}
                                                </span>
                                            </div>
                                            <div className="mt-3 text-dark font-medium leading-relaxed bg-light p-2 rounded border">
                                                <Info size={14} className="text-primary mr-1 inline" /> {leave.reason}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="ml-auto text-right flex flex-column gap-2" style={{ minWidth: '200px' }}>
                                        <div className="text-xs text-secondary mb-2">
                                            Applied on {format(new Date(leave.created_at), 'MMM d, yyyy h:mm a')}
                                        </div>

                                        {!isPending && (
                                            <div className="bg-white p-2 rounded border text-sm text-left">
                                                <div className="text-xs text-secondary mb-1">Processed By: {leave.reviewed_by_name}</div>
                                                {leave.rejection_reason && (
                                                    <div className="text-danger mt-1">
                                                        <strong>Note:</strong> {leave.rejection_reason}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {isPending && processingId !== leave.id && (
                                            <button className="btn btn-primary w-full" onClick={() => setProcessingId(leave.id)}>
                                                Take Action <ChevronRight size={14} />
                                            </button>
                                        )}

                                        {isPending && processingId === leave.id && (
                                            <div className="bg-white p-3 rounded border shadow-sm text-left" style={{ minWidth: '300px' }}>
                                                <h5 className="mb-2 text-sm flex items-center gap-2">
                                                    <MessageSquare size={14} /> Leave Decision
                                                </h5>
                                                <textarea
                                                    className="form-control w-full mb-2 text-sm"
                                                    placeholder="Add a comment or rejection reason..."
                                                    rows="2"
                                                    value={actionReason}
                                                    onChange={(e) => setActionReason(e.target.value)}
                                                />
                                                <div className="flex gap-2">
                                                    <button className="btn btn-success text-xs flex-1" onClick={() => handleAction(leave.id, 'approved')}>
                                                        Approve
                                                    </button>
                                                    <button className="btn btn-danger text-xs flex-1" onClick={() => handleAction(leave.id, 'rejected')}>
                                                        Reject
                                                    </button>
                                                    <button className="btn btn-secondary text-xs" onClick={() => { setProcessingId(null); setActionReason(''); }}>
                                                        <XCircle size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-3 border-top pt-2 flex items-center gap-4 text-xs text-secondary">
                                    <div className="flex items-center gap-1">
                                        <Clock size={12} /> Period: {format(start, 'MMM d, yyyy')} — {format(end, 'MMM d, yyyy')}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <style>{`
                .border-left-warning { border-left: 4px solid var(--warning) !important; }
                .border-left-success { border-left: 4px solid var(--success) !important; }
                .border-left-danger { border-left: 4px solid var(--danger) !important; }
                .bg-warning-light { background: rgba(255, 193, 7, 0.05); }
                .bg-success-light { background: rgba(40, 167, 69, 0.05); }
                .bg-danger-light { background: rgba(220, 53, 69, 0.05); }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default SATrainerLeaves;
