import { useState, useEffect } from 'react';
import { superAdminAPI } from '../../services/api';
import {
    Plus, Trash2, Pencil, Upload, FileText, X,
    Award, ChevronDown, ChevronRight, CheckCircle,
    AlertCircle, Download, Package
} from 'lucide-react';

const fmtSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const FileRow = ({ file, onDelete }) => {
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        if (!window.confirm(`Delete "${file.original_name}"?`)) return;
        setDeleting(true);
        try {
            await superAdminAPI.deleteCapstoneFile(file.id);
            onDelete(file.id);
        } catch (err) {
            alert(err.response?.data?.message || 'Error deleting file');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '10px 14px', borderRadius: '8px',
            background: 'var(--bg-dark)', border: '1px solid var(--border-color)',
            marginBottom: '6px',
        }}>
            <FileText size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    fontSize: '13px', fontWeight: 600, color: 'var(--text-main)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                    {file.original_name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {fmtSize(file.file_size)} · {file.mime_type?.split('/')[1]?.toUpperCase() || 'FILE'}
                </div>
            </div>
            <a
                href={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/uploads/content/${file.stored_name}`}
                target="_blank" rel="noreferrer"
                style={{
                    color: 'var(--primary)', padding: '5px', borderRadius: '6px',
                    background: 'rgba(99,102,241,0.1)', display: 'flex',
                }}
                title="Download"
            >
                <Download size={14} />
            </a>
            <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: '6px', cursor: deleting ? 'not-allowed' : 'pointer',
                    color: '#f87171', padding: '5px 8px', opacity: deleting ? 0.6 : 1,
                }}
            >
                <Trash2 size={14} />
            </button>
        </div>
    );
};

const CapstoneCard = ({ capstone, index, onEdit, onDelete, onRefresh }) => {
    const [expanded, setExpanded] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        setUploading(true);
        try {
            const fd = new FormData();
            files.forEach(f => fd.append('files', f));
            await superAdminAPI.uploadCapstoneFiles(capstone.id, fd);
            onRefresh();
        } catch (err) {
            alert(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleFileDeleted = (fileId) => {
        onRefresh();
    };

    return (
        <div className="glass-card" style={{
            marginBottom: '14px', padding: 0,
            overflow: 'hidden', borderTop: '3px solid var(--primary)',
        }}>
            {/* Header */}
            <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                    width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0,
                    background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontWeight: 800, fontSize: '16px', color: 'var(--primary)',
                }}>
                    C{index + 1}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                            {capstone.name}
                        </h3>
                        <span style={{
                            fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px',
                            background: capstone.file_count > 0 ? 'rgba(16,185,129,0.15)' : 'var(--bg-dark)',
                            color: capstone.file_count > 0 ? '#10b981' : 'var(--text-muted)',
                            border: `1px solid ${capstone.file_count > 0 ? 'rgba(16,185,129,0.3)' : 'var(--border-color)'}`,
                        }}>
                            {capstone.file_count} file{capstone.file_count !== 1 ? 's' : ''}
                        </span>
                        <span style={{
                            fontSize: '10px', padding: '2px 8px', borderRadius: '20px',
                            background: 'var(--bg-dark)', color: 'var(--text-muted)',
                            border: '1px solid var(--border-color)',
                        }}>
                            Order: {capstone.sequence_order}
                        </span>
                    </div>
                    {capstone.description && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0', lineHeight: 1.5 }}>
                            {capstone.description}
                        </p>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignItems: 'center' }}>
                    <button
                        onClick={() => onEdit(capstone)}
                        style={{
                            background: 'var(--bg-dark)', border: '1px solid var(--border-color)',
                            borderRadius: '6px', cursor: 'pointer', color: 'var(--text-muted)', padding: '7px 10px',
                        }}
                    >
                        <Pencil size={14} />
                    </button>
                    <button
                        onClick={() => onDelete(capstone.id)}
                        style={{
                            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                            borderRadius: '6px', cursor: 'pointer', color: '#f87171', padding: '7px 10px',
                        }}
                    >
                        <Trash2 size={14} />
                    </button>
                    <button
                        onClick={() => setExpanded(p => !p)}
                        style={{
                            background: 'var(--bg-dark)', border: '1px solid var(--border-color)',
                            borderRadius: '6px', cursor: 'pointer', color: 'var(--text-muted)', padding: '7px 10px',
                        }}
                    >
                        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                </div>
            </div>

            {/* Expanded files section */}
            {expanded && (
                <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ paddingTop: '16px' }}>

                        {/* File list */}
                        {capstone.files?.length > 0 ? (
                            <div style={{ marginBottom: '14px' }}>
                                {capstone.files.filter(Boolean).map(file => (
                                    <FileRow
                                        key={file.id}
                                        file={file}
                                        onDelete={handleFileDeleted}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div style={{
                                textAlign: 'center', padding: '20px',
                                background: 'var(--bg-dark)', borderRadius: '8px',
                                marginBottom: '14px', color: 'var(--text-muted)', fontSize: '0.9rem',
                            }}>
                                No files uploaded yet for this capstone.
                            </div>
                        )}

                        {/* Upload area */}
                        <label style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                            padding: '12px 20px', border: '2px dashed var(--border-color)',
                            borderRadius: '8px', cursor: uploading ? 'not-allowed' : 'pointer',
                            color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600,
                            transition: 'all 0.2s', opacity: uploading ? 0.6 : 1,
                        }}
                            onMouseEnter={e => {
                                if (!uploading) {
                                    e.currentTarget.style.borderColor = 'var(--primary)';
                                    e.currentTarget.style.color = 'var(--primary)';
                                }
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.borderColor = 'var(--border-color)';
                                e.currentTarget.style.color = 'var(--text-muted)';
                            }}
                        >
                            <Upload size={16} />
                            {uploading ? 'Uploading...' : 'Upload Project Files (PDF, ZIP, DOCX, etc.)'}
                            <input
                                type="file"
                                multiple
                                disabled={uploading}
                                onChange={handleFileUpload}
                                accept=".pdf,.zip,.docx,.doc,.pptx,.txt,.csv,.xlsx,.rar,.png,.jpg"
                                style={{ display: 'none' }}
                            />
                        </label>
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Main Component ─────────────────────────────────────────────────────────────
export const SACapstoneManager = ({ courseId, courseName }) => {
    const [capstones, setCapstones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ name: '', description: '', sequence_order: 1 });
    const [saving, setSaving] = useState(false);

    const inputStyle = {
        width: '100%', padding: '10px 12px', borderRadius: '8px',
        background: 'var(--bg-dark)', border: '1px solid var(--border-color)',
        color: 'var(--text-main)', outline: 'none', fontSize: '0.9rem',
        boxSizing: 'border-box',
    };

    const load = async () => {
        setLoading(true);
        try {
            const res = await superAdminAPI.getCourseCapstones(courseId);
            setCapstones(res.data.capstones || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (courseId) load(); }, [courseId]);

    const handleEdit = (cap) => {
        setEditId(cap.id);
        setForm({ name: cap.name, description: cap.description || '', sequence_order: cap.sequence_order || 1 });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this capstone project and all its files?')) return;
        try {
            await superAdminAPI.deleteCapstone(id);
            setCapstones(p => p.filter(c => c.id !== id));
        } catch (err) {
            alert(err.response?.data?.message || 'Error deleting');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editId) {
                await superAdminAPI.updateCapstone(editId, form);
            } else {
                await superAdminAPI.createCapstone(courseId, form);
            }
            await load();
            setShowForm(false);
            setEditId(null);
            setForm({ name: '', description: '', sequence_order: capstones.length + 2 });
        } catch (err) {
            alert(err.response?.data?.message || 'Error saving');
        } finally {
            setSaving(false);
        }
    };

    if (!courseId) return null;

    return (
        <div>
            {/* Section header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                    <h3 style={{
                        fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-accent)',
                        display: 'flex', alignItems: 'center', gap: '8px', margin: 0,
                    }}>
                        <Award size={18} /> Capstone Projects
                        {courseName && (
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                                — {courseName}
                            </span>
                        )}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                        Course-level final projects. Trainers release these to batches with due dates.
                    </p>
                </div>
                <button
                    onClick={() => {
                        setShowForm(true);
                        setEditId(null);
                        setForm({ name: '', description: '', sequence_order: capstones.length + 1 });
                    }}
                    style={{
                        padding: '9px 16px', borderRadius: '8px', cursor: 'pointer',
                        background: 'var(--primary)', color: 'white', border: 'none',
                        display: 'flex', alignItems: 'center', gap: '6px',
                        fontWeight: 600, fontSize: '0.85rem',
                    }}
                >
                    <Plus size={15} /> Add Capstone
                </button>
            </div>

            {/* Add / Edit form */}
            {showForm && (
                <div className="glass-card" style={{ marginBottom: '16px', borderLeft: '3px solid var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h4 style={{ color: 'var(--text-accent)', fontSize: '0.95rem', margin: 0 }}>
                            {editId ? 'Edit Capstone Project' : 'New Capstone Project'}
                        </h4>
                        <button
                            onClick={() => { setShowForm(false); setEditId(null); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '12px' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                                    Project Name *
                                </label>
                                <input
                                    required
                                    placeholder="e.g. E-Commerce Sales Dashboard"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                                    Order
                                </label>
                                <input
                                    required
                                    type="number"
                                    min="1"
                                    value={form.sequence_order}
                                    onChange={e => setForm({ ...form, sequence_order: parseInt(e.target.value) || 1 })}
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                                Description
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Brief project description — what students need to build..."
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                style={{ ...inputStyle, resize: 'vertical' }}
                            />
                        </div>

                        <div style={{
                            display: 'flex', gap: '8px', alignItems: 'flex-start',
                            padding: '10px 14px', borderRadius: '8px',
                            background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                            fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5,
                        }}>
                            <AlertCircle size={14} color="var(--primary)" style={{ marginTop: '1px', flexShrink: 0 }} />
                            After creating, expand the card to upload project files. Trainers then release this to batches with a due date.
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                onClick={() => { setShowForm(false); setEditId(null); }}
                                style={{
                                    padding: '9px 18px', borderRadius: '8px', background: 'transparent',
                                    color: 'var(--text-muted)', border: '1px solid var(--border-color)', cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                style={{
                                    padding: '9px 20px', borderRadius: '8px', background: 'var(--primary)',
                                    color: 'white', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                                    fontWeight: 600, opacity: saving ? 0.7 : 1,
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                }}
                            >
                                <CheckCircle size={14} />
                                {saving ? 'Saving...' : (editId ? 'Save Changes' : 'Create Capstone')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    <div className="spinner" style={{ margin: '0 auto 12px' }} />
                    Loading capstones...
                </div>
            )}

            {/* Empty state */}
            {!loading && capstones.length === 0 && !showForm && (
                <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
                    <Package size={40} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                        No capstone projects yet
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Add 2–3 course-wide final projects for students to complete as their final deliverables.
                    </p>
                </div>
            )}

            {/* Capstone cards */}
            {!loading && capstones.map((cap, idx) => (
                <CapstoneCard
                    key={cap.id}
                    capstone={cap}
                    index={idx}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onRefresh={load}
                />
            ))}
        </div>
    );
};

export default SACapstoneManager;