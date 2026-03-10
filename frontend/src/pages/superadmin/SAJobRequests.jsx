import React, { useState, useEffect } from 'react';
import { jobAPI } from '../../services/api';
import { Check, X, Eye, ExternalLink, ShieldCheck, Clock } from 'lucide-react';

const SAJobRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await jobAPI.getAllRequests();
            setRequests(res.data);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, status) => {
        const admin_notes = status === 'Rejected' ? prompt('Reason for rejection:') : 'Approved by SuperAdmin';
        if (status === 'Rejected' && !admin_notes) return;

        setActionLoading(true);
        try {
            await jobAPI.updateRequestStatus(id, { status, admin_notes });
            fetchRequests();
            setSelectedRequest(null);
        } catch (err) {
            alert('Action failed');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-main">Job Portal Approvals</h1>
                <p className="text-secondary">Review student submissions and grant placement access</p>
            </div>

            <div className="card overflow-hidden">
                <table className="table">
                    <thead className="bg-secondary/5">
                        <tr>
                            <th>Student</th>
                            <th>Course</th>
                            <th>Submission Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.length === 0 ? (
                            <tr><td colSpan="5" className="text-center py-10 text-muted">No pending requests</td></tr>
                        ) : (
                            requests.map(req => (
                                <tr key={req.id}>
                                    <td>
                                        <div className="font-bold">{req.first_name} {req.last_name}</div>
                                        <div className="text-xs text-muted">{req.email}</div>
                                    </td>
                                    <td>{req.course_name}</td>
                                    <td>{new Date(req.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <span className={`badge ${req.status === 'Approved' ? 'badge-success' : req.status === 'Pending' ? 'badge-warning' : 'badge-danger'}`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td>
                                        <button onClick={() => setSelectedRequest(req)} className="btn btn-secondary btn-sm p-1">
                                            <Eye size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {selectedRequest && (
                <div className="modal-overlay">
                    <div className="modal-content max-w-4xl w-full">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-main">Review Request: {selectedRequest.first_name}</h2>
                            <button onClick={() => setSelectedRequest(null)}>&times;</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-sm uppercase tracking-widest text-muted font-bold mb-3">Google Review Proof</h3>
                                <div className="border border-subtle rounded-lg overflow-hidden bg-black/20 flex items-center justify-center h-80">
                                    <img
                                        src={`${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000'}/uploads/job_requests/${selectedRequest.google_review_img}`}
                                        alt="Google Review"
                                        className="max-h-full object-contain"
                                    />
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm uppercase tracking-widest text-muted font-bold mb-3">Portfolio Verification</h3>
                                    <a
                                        href={selectedRequest.portfolio_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-4 bg-main/5 border border-main/20 rounded-lg text-main hover:bg-main/10 transition-colors"
                                    >
                                        <span className="truncate">{selectedRequest.portfolio_link}</span>
                                        <ExternalLink size={20} />
                                    </a>
                                </div>

                                <div className="card p-4 bg-secondary/5">
                                    <h4 className="font-bold flex items-center gap-2 mb-2 italic">
                                        <ShieldCheck className="text-main" size={18} /> Verification Checklist
                                    </h4>
                                    <ul className="text-sm space-y-1 text-secondary">
                                        <li>✓ Attendance verified by system</li>
                                        <li>✓ Module Projects verified by system</li>
                                        <li>✓ Capstone Project verified by system</li>
                                        <li>? Manual Google Review Check (Current View)</li>
                                    </ul>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        disabled={actionLoading}
                                        onClick={() => handleAction(selectedRequest.id, 'Approved')}
                                        className="btn btn-primary flex-1 py-3 flex items-center justify-center gap-2"
                                    >
                                        <Check size={20} /> Approve & Unlock
                                    </button>
                                    <button
                                        disabled={actionLoading}
                                        onClick={() => handleAction(selectedRequest.id, 'Rejected')}
                                        className="btn btn-danger flex-1 py-3 flex items-center justify-center gap-2"
                                    >
                                        <X size={20} /> Reject
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SAJobRequests;
