import { useState, useEffect } from 'react';
import { superAdminAPI } from '../../services/api';
import {
    Check, X, ExternalLink, Download, User, Info,
    Layers, Link as LinkIcon, QrCode as QrIcon, FileCode, Trash2, Eye
} from 'lucide-react';

const statusConfig = {
    pending: { color: '#ffd43b', label: 'Pending Review' },
    approved: { color: '#51cf66', label: 'Approved & Live' },
    rejected: { color: '#ff6b6b', label: 'Rejected' }
};

export const SAPortfolios = () => {
    const [portfolios, setPortfolios] = useState([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);

    const fetchData = async () => {
        try {
            const res = await superAdminAPI.getPortfolios();
            setPortfolios(res.data.portfolios);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleAction = async (id, status) => {
        if (!window.confirm(`Are you sure you want to mark this portfolio as ${status}?`)) return;

        try {
            await superAdminAPI.updatePortfolio(id, { status });
            fetchData();
            setSelectedRequest(null);
        } catch {
            alert('Error updating portfolio');
        }
    };

    const handleDownload = (id) => {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        window.open(`${API_URL}/super-admin/portfolios/${id}/download`, '_blank');
    };

    const handlePreview = (id) => {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        window.open(`${API_URL}/super-admin/portfolios/${id}/download?preview=true`, '_blank');
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you absolutely sure you want to permanently delete this portfolio request and its hosted file?')) return;

        try {
            await superAdminAPI.deletePortfolio(id);
            fetchData();
        } catch {
            alert('Error deleting portfolio');
        }
    };

    const filtered = portfolios.filter(p => filter === 'all' || p.status === filter);

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><div className="spinner" /></div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem' }}>Portfolio Approval Hub</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Review submissions and generate premium Glassmorphism templates.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['all', 'pending', 'approved', 'rejected'].map(s => (
                        <button key={s} onClick={() => setFilter(s)}
                            style={{
                                padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem',
                                background: filter === s ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                color: filter === s ? 'white' : 'var(--text-muted)',
                                border: '1px solid var(--border-color)'
                            }}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {filtered.map(pf => {
                    const cfg = statusConfig[pf.status];
                    const details = typeof pf.details === 'string' ? JSON.parse(pf.details) : pf.details || {};

                    return (
                        <div key={pf.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                                        {details.personal?.profile_img ? <img src={details.personal.profile_img} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : <User size={20} color="var(--primary)" />}
                                    </div>
                                    <div>
                                        <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>{details.personal?.name || pf.student_name}</h4>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{details.personal?.role}</p>
                                    </div>
                                </div>
                                <span style={{ background: `${cfg.color}15`, color: cfg.color, padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600 }}>
                                    {cfg.label}
                                </span>
                            </div>

                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                                    <Layers size={14} color="var(--text-muted)" />
                                    <span>{details.projects?.length || 0} Projects Submitted</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                                    <LinkIcon size={14} color="var(--text-muted)" />
                                    <span style={{ color: details.links?.linkedin ? '#4dabf7' : 'var(--text-muted)' }}>LinkedIn {details.links?.linkedin ? 'Connected' : 'Missing'}</span>
                                </div>
                                {pf.status === 'approved' && pf.qr_code && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', padding: '10px', background: 'var(--bg-dark)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                        <img src={pf.qr_code} style={{ width: 40, height: 40, borderRadius: '4px' }} alt="QR" />
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Live Link QR Generated</p>
                                            <a href={pf.hosted_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--primary)', wordBreak: 'break-all' }}>{pf.hosted_url}</a>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                                <button className="btn-secondary" style={{ flex: 1, fontSize: '0.8rem' }} onClick={() => setSelectedRequest(pf)}>
                                    <Info size={14} /> Full Details
                                </button>
                                <button className="btn-secondary" style={{ background: 'var(--bg-dark)', border: '1px solid var(--primary)', color: 'var(--primary)', flex: 1, fontSize: '0.8rem' }} onClick={() => handleDownload(pf.id)}>
                                    <Download size={14} /> Get HTML
                                </button>
                                <button className="btn-secondary" style={{ background: 'var(--bg-dark)', border: '1px solid #ff6b6b', color: '#ff6b6b', padding: '0 10px' }} onClick={() => handleDelete(pf.id)}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Detailed View Modal */}
            {selectedRequest && (() => {
                const modalDetails = typeof selectedRequest.details === 'string' ? JSON.parse(selectedRequest.details) : selectedRequest.details;
                return (
                    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="glass-card" style={{ width: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem', position: 'relative' }}>
                            <button onClick={() => setSelectedRequest(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>

                            <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
                                <img src={modalDetails.personal.profile_img} style={{ width: 120, height: 120, borderRadius: '12px', objectFit: 'cover', border: '2px solid var(--primary)' }} />
                                <div>
                                    <h2 style={{ fontSize: '2rem' }}>{selectedRequest.student_name}</h2>
                                    <p style={{ color: 'var(--primary)', fontWeight: 600 }}>{modalDetails.personal.role}</p>
                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                        <span>{selectedRequest.email}</span>
                                        <span>{selectedRequest.batch_name}</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Project List</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {modalDetails.projects.map((p, i) => (
                                            <div key={i} style={{ padding: '1rem', background: 'var(--bg-dark)', borderRadius: '12px' }}>
                                                <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.title}</p>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>{p.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>About Me Text</h3>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{modalDetails.personal.about_text}</p>

                                    <h3 style={{ fontSize: '1.1rem', marginTop: '2rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Skill Matrix</h3>
                                    {modalDetails.skills.map((s, i) => (
                                        <div key={i} style={{ marginBottom: '8px' }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.category}:</span> <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{s.items}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem', borderTop: '1px solid var(--border-color)', paddingTop: '2rem', justifyContent: 'flex-end' }}>
                                <button className="btn-secondary" style={{ flex: 1, borderColor: '#4dabf7', color: '#4dabf7' }} onClick={() => handlePreview(selectedRequest.id)}>
                                    <Eye size={16} /> Live Preview Site
                                </button>
                                <button className="btn-secondary" style={{ borderColor: '#ff6b6b', color: '#ff6b6b' }} onClick={() => handleAction(selectedRequest.id, 'rejected')}>Reject submission</button>
                                <button className="btn-primary" style={{ background: '#51cf66' }} onClick={() => handleAction(selectedRequest.id, 'approved')}>Approve & Deploy</button>
                            </div>
                        </div>
                    </div>
                );
            })()}

        </div>
    );
};
