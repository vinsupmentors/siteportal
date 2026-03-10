import { useState, useEffect } from 'react';
import { superAdminAPI } from '../../services/api';
import { MessageSquare, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { format, differenceInHours } from 'date-fns';

export const SAStudentDoubts = () => {
    const [doubts, setDoubts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, open, resolved, overdue

    useEffect(() => {
        fetchDoubts();
    }, []);

    const fetchDoubts = async () => {
        try {
            const res = await superAdminAPI.getStudentDoubts();
            setDoubts(res.data.doubts);
        } catch (error) {
            console.error("Failed to fetch doubts:", error);
        } finally {
            setLoading(false);
        }
    };

    const isOverdue = (created_at) => {
        const hours = differenceInHours(new Date(), new Date(created_at));
        return hours > 24;
    };

    const filteredDoubts = doubts.filter(d => {
        if (filter === 'all') return true;
        if (filter === 'resolved') return d.status === 'resolved';
        if (filter === 'open') return d.status !== 'resolved';
        if (filter === 'overdue') return d.status !== 'resolved' && isOverdue(d.created_at);
        return true;
    });

    const metrics = {
        total: doubts.length,
        open: doubts.filter(d => d.status !== 'resolved').length,
        resolved: doubts.filter(d => d.status === 'resolved').length,
        overdue: doubts.filter(d => d.status !== 'resolved' && isOverdue(d.created_at)).length
    };

    return (
        <div className="portal-page">
            <div className="page-header">
                <div>
                    <h1>System-Wide Doubts Monitor</h1>
                    <p>Track all technical doubts raised by students to ensure timely trainer responses (24h SLA).</p>
                </div>
            </div>

            <div className="grid grid-4 gap-4 mb-4">
                <div className="stat-card" onClick={() => setFilter('all')} style={{ cursor: 'pointer' }}>
                    <div className="stat-value">{metrics.total}</div>
                    <div className="stat-label">Total Doubts</div>
                </div>
                <div className="stat-card" onClick={() => setFilter('open')} style={{ cursor: 'pointer', borderLeft: filter === 'open' ? '4px solid var(--primary)' : '' }}>
                    <div className="stat-value">{metrics.open}</div>
                    <div className="stat-label">Open / Pending</div>
                </div>
                <div className="stat-card" onClick={() => setFilter('resolved')} style={{ cursor: 'pointer', borderLeft: filter === 'resolved' ? '4px solid var(--success)' : '' }}>
                    <div className="stat-value text-success">{metrics.resolved}</div>
                    <div className="stat-label">Resolved</div>
                </div>
                <div className="stat-card" onClick={() => setFilter('overdue')} style={{ cursor: 'pointer', borderLeft: filter === 'overdue' ? '4px solid var(--danger)' : '' }}>
                    <div className="stat-value text-danger">{metrics.overdue}</div>
                    <div className="stat-label">SLA Breached (&gt;24h)</div>
                </div>
            </div>

            <div className="card">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h3>{filter.charAt(0).toUpperCase() + filter.slice(1)} Doubts</h3>
                    <button className="btn btn-secondary text-sm" onClick={fetchDoubts}>Refresh Data</button>
                </div>

                {loading ? (
                    <p>Loading monitor data...</p>
                ) : filteredDoubts.length === 0 ? (
                    <div className="empty-state">
                        <MessageSquare size={48} className="text-secondary mb-3" />
                        <h4>No queries match the current filter</h4>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Status / SLA</th>
                                    <th>Student</th>
                                    <th>Batch</th>
                                    <th>Trainer</th>
                                    <th>Created At</th>
                                    <th>Query Preview</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDoubts.map(doubt => {
                                    const overdue = doubt.status !== 'resolved' && isOverdue(doubt.created_at);

                                    return (
                                        <tr key={doubt.id} style={{ backgroundColor: overdue ? 'rgba(239, 68, 68, 0.05)' : '' }}>
                                            <td>
                                                <span className={`badge ${doubt.status === 'resolved' ? 'badge-success' : overdue ? 'badge-danger' : 'badge-warning'}`}>
                                                    {doubt.status === 'resolved' ? <CheckCircle size={14} /> : overdue ? <AlertTriangle size={14} /> : <Clock size={14} />}
                                                    <span className="ml-1">
                                                        {doubt.status === 'resolved' ? 'RESOLVED' : overdue ? 'OVERDUE' : 'PENDING'}
                                                    </span>
                                                </span>
                                            </td>
                                            <td>
                                                <div className="font-medium">{doubt.student_name}</div>
                                                <div className="text-xs text-secondary">{doubt.student_email}</div>
                                            </td>
                                            <td>{doubt.batch_name}</td>
                                            <td>{doubt.trainer_name || <span className="text-danger">Unassigned</span>}</td>
                                            <td>
                                                <div>{format(new Date(doubt.created_at), 'MMM d, yyyy')}</div>
                                                <div className="text-xs text-secondary">{format(new Date(doubt.created_at), 'h:mm a')}</div>
                                            </td>
                                            <td style={{ maxWidth: '250px' }}>
                                                <div className="text-truncate" title={doubt.query_text}>
                                                    {doubt.query_text}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
