import { useState, useEffect } from 'react';
import { superAdminAPI } from '../../services/api';
import { HelpCircle, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

export const SAStudentHelpdesk = () => {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('open'); // open, resolved
    const [resolvingId, setResolvingId] = useState(null);
    const [adminResponse, setAdminResponse] = useState('');
    const [resolutionStatus, setResolutionStatus] = useState('resolved');

    useEffect(() => {
        fetchIssues();
    }, []);

    const fetchIssues = async () => {
        setLoading(true);
        try {
            const res = await superAdminAPI.getStudentIssues();
            setIssues(res.data.issues);
        } catch (error) {
            console.error("Failed to fetch issues:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (id) => {
        if (!adminResponse.trim()) return;
        try {
            await superAdminAPI.updateStudentIssue(id, {
                status: resolutionStatus,
                admin_response: adminResponse
            });
            setResolvingId(null);
            setAdminResponse('');
            setResolutionStatus('resolved');
            fetchIssues();
        } catch (error) {
            console.error("Failed to update issue:", error);
            alert("Error updating issue.");
        }
    };

    const filteredIssues = issues.filter(i =>
        filter === 'open' ? (i.status === 'open' || i.status === 'in_progress') : (i.status === 'resolved' || i.status === 'rejected')
    );

    return (
        <div className="portal-page">
            <div className="page-header">
                <div>
                    <h1>Student Escalations Helpdesk</h1>
                    <p>Manage and resolve administrative or behavioral issues raised by students.</p>
                </div>
            </div>

            <div className="flex gap-2 mb-4">
                <button
                    className={`btn ${filter === 'open' ? 'btn-danger' : 'btn-secondary'}`}
                    onClick={() => setFilter('open')}
                >
                    Action Required
                </button>
                <button
                    className={`btn ${filter === 'resolved' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilter('resolved')}
                >
                    Archived / Closed
                </button>
            </div>

            <div className="card border-top-danger mt-2">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h3>{filter === 'open' ? 'Pending Action' : 'Closed Issues'}</h3>
                    <button className="btn btn-secondary text-sm" onClick={fetchIssues}>Refresh</button>
                </div>

                {loading ? (
                    <p>Loading escalations...</p>
                ) : filteredIssues.length === 0 ? (
                    <div className="empty-state">
                        <HelpCircle size={48} className="text-secondary mb-3" />
                        <h4>No {filter === 'open' ? 'pending' : 'closed'} issues found</h4>
                    </div>
                ) : (
                    <div className="grid grid-2 gap-4">
                        {filteredIssues.map(issue => (
                            <div key={issue.id} className="card bg-light">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div>
                                        <span className={`badge ${issue.status === 'resolved' ? 'badge-success' :
                                                issue.status === 'rejected' ? 'badge-danger' :
                                                    issue.status === 'in_progress' ? 'badge-warning' : 'badge-danger'
                                            }`}>
                                            {issue.status === 'resolved' ? <CheckCircle size={14} /> :
                                                issue.status === 'open' ? <AlertTriangle size={14} /> : <Clock size={14} />}
                                            <span className="ml-1">{issue.status.replace('_', ' ').toUpperCase()}</span>
                                        </span>
                                    </div>
                                    <div className="text-sm text-secondary text-right">
                                        <div>{format(new Date(issue.created_at), 'MMM d, yyyy')}</div>
                                        <div className="text-xs">{format(new Date(issue.created_at), 'h:mm a')}</div>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <div className="mb-2">
                                        <span className="font-medium text-dark">{issue.first_name} {issue.last_name}</span>
                                        <span className="text-xs text-secondary ml-2">({issue.email})</span>
                                    </div>
                                    <h5 className="mb-1 text-sm text-danger">{issue.issue_type}</h5>
                                    <p className="m-0 text-dark font-medium">{issue.description}</p>
                                </div>

                                {filter === 'open' ? (
                                    <div className="mt-auto pt-3 border-top">
                                        {resolvingId === issue.id ? (
                                            <div>
                                                <select
                                                    className="w-full mb-2 p-2 border-radius form-control"
                                                    value={resolutionStatus}
                                                    onChange={(e) => setResolutionStatus(e.target.value)}
                                                >
                                                    <option value="in_progress">Mark In Progress (Temporary)</option>
                                                    <option value="resolved">Mark Resolved</option>
                                                    <option value="rejected">Reject / Dismiss</option>
                                                </select>
                                                <textarea
                                                    className="w-full mb-2 p-2 border-radius form-control"
                                                    rows="3"
                                                    placeholder="Type official admin response..."
                                                    value={adminResponse}
                                                    onChange={(e) => setAdminResponse(e.target.value)}
                                                />
                                                <div className="flex gap-2">
                                                    <button className="btn btn-danger text-sm flex-1" onClick={() => handleResolve(issue.id)}>Confirm Update</button>
                                                    <button className="btn btn-secondary text-sm flex-1" onClick={() => { setResolvingId(null); setAdminResponse(''); }}>Cancel</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button className="btn btn-outline-danger w-full text-sm" onClick={() => {
                                                setResolvingId(issue.id);
                                                setResolutionStatus(issue.status === 'open' ? 'in_progress' : issue.status);
                                            }}>
                                                Take Action
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    issue.admin_response && (
                                        <div className="bg-white p-3 border-radius mt-auto" style={{ borderLeft: `4px solid var(--${issue.status === 'rejected' ? 'danger' : 'success'})` }}>
                                            <h5 className={`mb-1 text-sm text-${issue.status === 'rejected' ? 'danger' : 'success'}`}>Official Super Admin Response:</h5>
                                            <p className="m-0 text-sm">{issue.admin_response}</p>
                                            <div className="text-xs text-secondary mt-2">
                                                Last updated: {format(new Date(issue.updated_at), 'MMM d, yyyy h:mm a')}
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
