import { useState, useEffect } from 'react';
import { superAdminAPI } from '../../services/api';
import {
    Award, Search, Plus, Trash2, ExternalLink,
    FileText, User, Calendar, CheckCircle2, ShieldCheck
} from 'lucide-react';

export const SACertificates = () => {
    const [certificates, setCertificates] = useState([]);
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ student_id: '', course_id: '', type: 'course_completion', certificate_url: '' });

    const fetchData = async () => {
        try {
            const [certRes, studRes, courseRes] = await Promise.all([
                superAdminAPI.getAllCertificates(),
                superAdminAPI.getStudents(),
                superAdminAPI.getCourses()
            ]);
            setCertificates(certRes.data.certificates);
            setStudents(studRes.data.students);
            setCourses(courseRes.data.courses);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await superAdminAPI.issueCertificate(form);
            setShowForm(false);
            setForm({ student_id: '', course_id: '', type: 'course_completion', certificate_url: '' });
            fetchData();
            alert('Certificate issued successfully!');
        } catch (err) {
            alert(err.response?.data?.message || 'Error issuing certificate');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to revoke this certificate?')) return;
        try {
            await superAdminAPI.deleteCertificate(id);
            fetchData();
        } catch {
            alert('Error deleting certificate');
        }
    };

    const filtered = certificates.filter(c =>
        c.student_name.toLowerCase().includes(search.toLowerCase()) ||
        c.course_name.toLowerCase().includes(search.toLowerCase())
    );

    const inputStyle = { padding: '12px', borderRadius: '8px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none', width: '100%' };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><div className="spinner" /></div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Award color="var(--primary)" /> Certificate Issuance Hub
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Generate and manage Course Completion & Internship certificates</p>
                </div>
                <button onClick={() => setShowForm(!showForm)}
                    style={{ padding: '10px 20px', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, cursor: 'pointer' }}>
                    <Plus size={18} /> Issue New Certificate
                </button>
            </div>

            {showForm && (
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}><PlusCircle color="var(--primary)" /> Manual Issuance Form</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Student</label>
                            <select required value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })} style={inputStyle}>
                                <option value="">Select Student...</option>
                                {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.email})</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Course / Program</label>
                            <select required value={form.course_id} onChange={e => setForm({ ...form, course_id: e.target.value })} style={inputStyle}>
                                <option value="">Select Course...</option>
                                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Certificate Type</label>
                            <select required value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={inputStyle}>
                                <option value="course_completion">Course Completion Certificate</option>
                                <option value="internship">Internship Certificate</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Hosted URL (Google Drive/S3)</label>
                            <input required placeholder="https://..." value={form.certificate_url} onChange={e => setForm({ ...form, certificate_url: e.target.value })} style={inputStyle} />
                        </div>
                        <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '1rem' }}>
                            <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', borderRadius: '8px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>Cancel</button>
                            <button type="submit" style={{ padding: '10px 30px', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Generate & Notify Student</button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'var(--bg-surface)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <Search size={18} color="var(--text-muted)" />
                <input type="text" placeholder="Search by student or course name..." value={search} onChange={e => setSearch(e.target.value)}
                    style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none' }} />
            </div>

            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)' }}>
                            <th style={{ padding: '1.25rem', textAlign: 'left', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Student Info</th>
                            <th style={{ padding: '1.25rem', textAlign: 'left', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Certificate Type</th>
                            <th style={{ padding: '1.25rem', textAlign: 'left', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Course</th>
                            <th style={{ padding: '1.25rem', textAlign: 'left', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Issued Date</th>
                            <th style={{ padding: '1.25rem', textAlign: 'right', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(c => (
                            <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)', transition: '0.2s' }}>
                                <td style={{ padding: '1.25rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <User size={18} />
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: 600 }}>{c.student_name}</p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.student_email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '1.25rem' }}>
                                    <span style={{
                                        padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                                        background: c.type === 'internship' ? 'rgba(76, 110, 245, 0.1)' : 'rgba(81, 207, 102, 0.1)',
                                        color: c.type === 'internship' ? '#4c6ef5' : '#51cf66',
                                        textTransform: 'uppercase',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        {c.type === 'internship' ? <ShieldCheck size={12} /> : <CheckCircle2 size={12} />}
                                        {c.type.replace('_', ' ')}
                                    </span>
                                </td>
                                <td style={{ padding: '1.25rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                                        <FileText size={14} />
                                        <span style={{ fontSize: '0.9rem' }}>{c.course_name}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '1.25rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                                        <Calendar size={14} />
                                        <span style={{ fontSize: '0.85rem' }}>{new Date(c.issued_date).toLocaleDateString()}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '1.25rem', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                        <a href={c.certificate_url} target="_blank" rel="noreferrer" style={{ width: 32, height: 32, borderRadius: '6px', background: 'var(--bg-surface)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)', transition: '0.2s' }}>
                                            <ExternalLink size={16} />
                                        </a>
                                        <button onClick={() => handleDelete(c.id)} style={{ width: 32, height: 32, borderRadius: '6px', background: 'rgba(255,107,107,0.1)', color: '#ff6b6b', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered.length === 0 && (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <Award size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p>No certificates issued yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
