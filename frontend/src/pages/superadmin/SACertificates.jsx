import { useState, useEffect } from 'react';
import { superAdminAPI } from '../../services/api';
import {
    Award, Search, Trash2, Eye, RotateCcw,
    FileText, User, Calendar, CheckCircle2, ShieldCheck, XCircle,
    GraduationCap, BookOpen
} from 'lucide-react';

const fmtDate = (d) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return '—'; }
};

export const SACertificates = () => {
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading]           = useState(true);
    const [search, setSearch]             = useState('');
    const [filterType, setFilterType]     = useState('all');
    const [resetting, setResetting]       = useState(null);
    const [msg, setMsg]                   = useState('');

    const fetchData = async () => {
        try {
            const res = await superAdminAPI.getAllCertificates();
            setCertificates(res.data.certificates || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handlePreview = (certId) => {
        const url = superAdminAPI.previewCertificate(certId);
        window.open(url, '_blank');
    };

    const handleReset = async (cert) => {
        const certType = cert.cert_type || (cert.type === 'internship' ? 'internship' : 'completion');
        if (!confirm(`Reset ${certType} certificate for ${cert.student_name}? The student will need to regenerate it.`)) return;
        setResetting(cert.id);
        try {
            await superAdminAPI.resetCertificate(cert.student_id, { cert_type: certType });
            setMsg(`Certificate reset for ${cert.student_name}`);
            fetchData();
        } catch (err) {
            setMsg(err.response?.data?.message || 'Reset failed');
        } finally {
            setResetting(null);
            setTimeout(() => setMsg(''), 4000);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Permanently delete this certificate record?')) return;
        try {
            await superAdminAPI.deleteCertificate(id);
            fetchData();
        } catch { setMsg('Error deleting certificate'); }
    };

    const filtered = certificates.filter(c => {
        const matchSearch = (c.student_name || '').toLowerCase().includes(search.toLowerCase()) ||
                            (c.course_name  || '').toLowerCase().includes(search.toLowerCase()) ||
                            (c.batch_name   || '').toLowerCase().includes(search.toLowerCase());
        const effectiveType = c.cert_type || c.type;
        const matchType = filterType === 'all' ||
            (filterType === 'completion' && (effectiveType === 'completion' || effectiveType === 'course_completion')) ||
            (filterType === 'internship' && effectiveType === 'internship');
        return matchSearch && matchType;
    });

    const completionCount  = certificates.filter(c => { const t = c.cert_type || c.type; return t === 'completion' || t === 'course_completion'; }).length;
    const internshipCount  = certificates.filter(c => (c.cert_type || c.type) === 'internship').length;
    const withPreviewCount = certificates.filter(c => c.has_preview).length;

    const inputSt = { padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none' };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><div className="spinner" /></div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header */}
            <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Award color="var(--primary)" /> Certificate Issuance Hub
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>View and manage all student-generated certificates</p>
            </div>

            {/* Status message */}
            {msg && (
                <div style={{ padding: '12px 18px', borderRadius: '8px', background: 'rgba(72,187,120,0.1)', border: '1px solid rgba(72,187,120,0.3)', color: '#48bb78', fontSize: '13px', fontWeight: 600 }}>
                    {msg}
                </div>
            )}

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {[
                    { icon: Award,          label: 'Completion Certs', value: completionCount,  color: '#51cf66' },
                    { icon: GraduationCap,  label: 'Internship Certs', value: internshipCount,   color: '#4c6ef5' },
                    { icon: Eye,            label: 'With Preview',     value: withPreviewCount,  color: '#fab005' },
                ].map(({ icon: Icon, label, value, color }) => (
                    <div key={label} className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: 44, height: 44, borderRadius: '10px', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon size={22} color={color} />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{value}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', background: 'var(--bg-surface)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <Search size={16} color="var(--text-muted)" />
                    <input type="text" placeholder="Search student, course, batch..." value={search} onChange={e => setSearch(e.target.value)}
                        style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none', fontSize: '14px' }} />
                </div>
                <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ ...inputSt, minWidth: '180px' }}>
                    <option value="all">All Types</option>
                    <option value="completion">Completion Only</option>
                    <option value="internship">Internship Only</option>
                </select>
            </div>

            {/* Table */}
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)' }}>
                            {['Student', 'Batch / Roll #', 'Certificate Type', 'Course', 'Generated On', 'Status', 'Actions'].map(h => (
                                <th key={h} style={{ padding: '1rem 1.25rem', textAlign: h === 'Actions' ? 'right' : 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(c => {
                            const effectiveType = c.cert_type || c.type || '';
                            const isInternship  = effectiveType === 'internship';
                            const isValid       = !c.reset_by_admin;
                            const dateVal       = c.generated_at || c.issued_date;

                            return (
                                <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    {/* Student */}
                                    <td style={{ padding: '1rem 1.25rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <User size={16} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.student_name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.student_email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    {/* Batch */}
                                    <td style={{ padding: '1rem 1.25rem' }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{c.batch_name || '—'}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.roll_number ? `Roll: ${c.roll_number}` : '—'}</div>
                                    </td>
                                    {/* Type */}
                                    <td style={{ padding: '1rem 1.25rem' }}>
                                        <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px', background: isInternship ? 'rgba(76,110,245,0.12)' : 'rgba(81,207,102,0.12)', color: isInternship ? '#4c6ef5' : '#51cf66', textTransform: 'uppercase' }}>
                                            {isInternship ? <ShieldCheck size={11} /> : <CheckCircle2 size={11} />}
                                            {isInternship ? 'Internship' : 'Completion'}
                                        </span>
                                    </td>
                                    {/* Course */}
                                    <td style={{ padding: '1rem 1.25rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            <BookOpen size={13} />
                                            {c.course_name}
                                        </div>
                                    </td>
                                    {/* Date */}
                                    <td style={{ padding: '1rem 1.25rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            <Calendar size={13} />
                                            {fmtDate(dateVal)}
                                        </div>
                                    </td>
                                    {/* Status */}
                                    <td style={{ padding: '1rem 1.25rem' }}>
                                        {isValid
                                            ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, background: 'rgba(72,187,120,0.12)', color: '#48bb78' }}><CheckCircle2 size={11} /> Valid</span>
                                            : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, background: 'rgba(245,101,101,0.12)', color: '#fc8181' }}><XCircle size={11} /> Reset</span>
                                        }
                                    </td>
                                    {/* Actions */}
                                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            {c.has_preview ? (
                                                <button onClick={() => handlePreview(c.id)} title="Preview Certificate"
                                                    style={{ padding: '6px 12px', borderRadius: '6px', background: 'rgba(76,110,245,0.12)', color: '#4c6ef5', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600 }}>
                                                    <Eye size={13} /> Preview
                                                </button>
                                            ) : (
                                                <span style={{ padding: '6px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    <FileText size={13} /> No HTML
                                                </span>
                                            )}
                                            <button onClick={() => handleReset(c)} disabled={resetting === c.id} title="Reset — student can regenerate"
                                                style={{ padding: '6px 12px', borderRadius: '6px', background: 'rgba(250,176,5,0.12)', color: '#fab005', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, opacity: resetting === c.id ? 0.5 : 1 }}>
                                                <RotateCcw size={13} /> Reset
                                            </button>
                                            <button onClick={() => handleDelete(c.id)} title="Delete permanently"
                                                style={{ padding: '6px 10px', borderRadius: '6px', background: 'rgba(255,107,107,0.1)', color: '#ff6b6b', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {filtered.length === 0 && (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <Award size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p>{certificates.length === 0 ? 'No certificates generated yet.' : 'No certificates match your search.'}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
