import { useState, useEffect } from 'react';
import { studentAPI } from '../../services/api';
import theme from './theme';
import {
    PageHeader, Card, EmptyState, LoadingSpinner,
    ActionButton, StatCard,
} from './StudentComponents';
import {
    BookOpen, Search, Download, Upload, CheckCircle,
    ChevronRight, FileText, FolderOpen, Clock,
    ExternalLink, Briefcase, HelpCircle, FileSignature,
} from 'lucide-react';

export const StudentMaterials = () => {
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedModule, setSelectedModule] = useState(null);
    const [search, setSearch] = useState('');
    const [uploading, setUploading] = useState(null);

    useEffect(() => {
        const fetchCurriculum = async () => {
            try { const res = await studentAPI.getCurriculum(); setModules(res.data?.modules || res.data || []); }
            catch { } finally { setLoading(false); }
        };
        fetchCurriculum();
    }, []);

    const handleFileSubmit = async (dayId, file) => {
        if (!file) return;
        setUploading(dayId);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('day_id', dayId);
            await studentAPI.submitWorksheet(formData);
            const res = await studentAPI.getCurriculum();
            setModules(res.data?.modules || res.data || []);
        } catch (err) {
            alert('Upload failed: ' + (err.response?.data?.message || err.message));
        } finally { setUploading(null); }
    };

    const filteredModules = modules.filter(m =>
        (m.name || m.module_name || '').toLowerCase().includes(search.toLowerCase())
    );
    const active = selectedModule ? modules.find(m => m.id === selectedModule) : null;
    const days = active?.days || active?.Days || [];

    const totalDays = modules.reduce((a, m) => a + ((m.days || m.Days || []).length), 0);
    const completedDays = modules.reduce((a, m) => a + ((m.days || m.Days || []).filter(d => d.submission_status === 'submitted' || d.submitted).length), 0);

    if (loading) return <LoadingSpinner label="Loading curriculum..." />;

    return (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <PageHeader
                title="Course Materials"
                subtitle="Access study resources and submit worksheets"
                icon={<BookOpen size={24} />}
                accentColor={theme.accent.green}
            />

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                <StatCard icon={<FolderOpen size={22} />} label="Modules" value={modules.length} accentColor={theme.accent.blue} />
                <StatCard icon={<FileText size={22} />} label="Total Sessions" value={totalDays} accentColor={theme.accent.cyan} />
                <StatCard icon={<CheckCircle size={22} />} label="Submitted" value={completedDays} accentColor={theme.accent.green} />
                <StatCard icon={<Clock size={22} />} label="Remaining" value={totalDays - completedDays} accentColor={theme.accent.yellow} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
                {/* Module Sidebar */}
                <div>
                    {/* Search */}
                    <div style={{ position: 'relative', marginBottom: '14px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: theme.text.muted }} />
                        <input placeholder="Search modules..." value={search} onChange={(e) => setSearch(e.target.value)}
                            style={{
                                width: '100%', padding: '11px 14px 11px 40px',
                                background: theme.bg.card, border: `1px solid ${theme.border.subtle}`,
                                borderRadius: theme.radius.md, color: theme.text.primary,
                                fontSize: '13px', fontWeight: 500, outline: 'none',
                                transition: 'border-color 0.2s', fontFamily: theme.font.family, boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {filteredModules.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '24px', color: theme.text.muted, fontSize: '13px' }}>No modules found</div>
                        ) : (
                            filteredModules.map((mod, idx) => {
                                const modDays = mod.days || mod.Days || [];
                                const done = modDays.filter(d => d.submission_status === 'submitted' || d.submitted).length;
                                const isActive = selectedModule === mod.id;
                                const progress = modDays.length ? Math.round((done / modDays.length) * 100) : 0;

                                return (
                                    <button key={mod.id} onClick={() => setSelectedModule(isActive ? null : mod.id)}
                                        style={{
                                            width: '100%', textAlign: 'left', cursor: 'pointer',
                                            background: isActive ? `${theme.accent.green}10` : theme.bg.card,
                                            border: `1px solid ${isActive ? theme.accent.green + '40' : theme.border.subtle}`,
                                            borderRadius: theme.radius.md, padding: '14px 16px',
                                            transition: 'all 0.2s',
                                        }}
                                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = theme.bg.card; }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                            <span style={{
                                                fontSize: '9px', fontWeight: 700, textTransform: 'uppercase',
                                                letterSpacing: '0.1em', color: theme.text.muted,
                                            }}>Module {idx + 1}</span>
                                            <span style={{
                                                fontSize: '10px', fontWeight: 700,
                                                color: progress === 100 ? theme.accent.green : theme.text.muted,
                                            }}>{done}/{modDays.length}</span>
                                        </div>
                                        <div style={{
                                            fontSize: '14px', fontWeight: 700,
                                            color: isActive ? theme.accent.green : theme.text.primary,
                                            marginBottom: '10px',
                                        }}>
                                            {mod.name || mod.module_name}
                                        </div>
                                        {/* Progress bar */}
                                        <div style={{ height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)' }}>
                                            <div style={{
                                                height: '100%', borderRadius: '2px', transition: 'width 0.3s',
                                                width: `${progress}%`,
                                                background: progress === 100 ? theme.accent.green : theme.accent.blue,
                                            }} />
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Day Cards Area */}
                <div>
                    {!active ? (
                        <EmptyState
                            icon={<BookOpen size={32} />}
                            title="Select a Module"
                            message="Choose a module from the left to view sessions, materials, and submit your worksheets."
                        />
                    ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* Module-Level Resources */}
                    {(active.study_material_url || (active.files && active.files.length > 0) ||
                      (active.projects && active.projects.length > 0) ||
                      active.interview_questions_url || active.test_url) && (
                        <Card style={{ borderTop: `3px solid ${theme.accent.cyan}` }}>
                            <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.text.label, marginBottom: '14px' }}>
                                Module Resources
                            </p>

                            {/* Study Materials */}
                            {(active.study_material_url || (active.files && active.files.length > 0)) && (
                                <div style={{ marginBottom: '14px' }}>
                                    <p style={{ fontSize: '11px', fontWeight: 700, color: theme.text.muted, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <BookOpen size={13} /> Study Materials
                                    </p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {active.study_material_url && (
                                            <a href={active.study_material_url} target="_blank" rel="noopener noreferrer"
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: theme.radius.sm, background: `${theme.accent.cyan}10`, border: `1px solid ${theme.accent.cyan}30`, color: theme.accent.cyan, fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
                                                <ExternalLink size={13} /> Open Material
                                            </a>
                                        )}
                                        {(active.files || []).map(f => (
                                            <a key={f.id} href={`/uploads/content/${f.stored_name}`} target="_blank" rel="noopener noreferrer"
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: theme.radius.sm, background: `${theme.accent.cyan}10`, border: `1px solid ${theme.accent.cyan}30`, color: theme.accent.cyan, fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
                                                <Download size={13} /> {f.original_name}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Test Link */}
                            {active.test_url && (
                                <div style={{ marginBottom: '14px' }}>
                                    <p style={{ fontSize: '11px', fontWeight: 700, color: theme.text.muted, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <FileSignature size={13} /> Module Test
                                    </p>
                                    <a href={active.test_url} target="_blank" rel="noopener noreferrer"
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: theme.radius.sm, background: `${theme.accent.yellow}10`, border: `1px solid ${theme.accent.yellow}30`, color: theme.accent.yellow, fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
                                        <ExternalLink size={13} /> Take Test
                                    </a>
                                </div>
                            )}

                            {/* Interview Questions */}
                            {active.interview_questions_url && (
                                <div style={{ marginBottom: '14px' }}>
                                    <p style={{ fontSize: '11px', fontWeight: 700, color: theme.text.muted, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <HelpCircle size={13} /> Interview Questions
                                    </p>
                                    <a href={active.interview_questions_url} target="_blank" rel="noopener noreferrer"
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: theme.radius.sm, background: `${theme.accent.purple}10`, border: `1px solid ${theme.accent.purple}30`, color: theme.accent.purple, fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
                                        <ExternalLink size={13} /> View Interview Qs
                                    </a>
                                </div>
                            )}

                            {/* Projects */}
                            {active.projects && active.projects.length > 0 && (
                                <div>
                                    <p style={{ fontSize: '11px', fontWeight: 700, color: theme.text.muted, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Briefcase size={13} /> Projects
                                    </p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {active.module_project_details && (
                                            <p style={{ fontSize: '12px', color: theme.text.muted, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: theme.radius.sm, border: `1px solid ${theme.border.subtle}` }}>
                                                {active.module_project_details}
                                            </p>
                                        )}
                                        {active.projects.map(proj => (
                                            <div key={proj.id} style={{ padding: '10px 14px', borderLeft: `2px solid ${theme.accent.blue}`, background: 'rgba(255,255,255,0.02)', borderRadius: `0 ${theme.radius.sm} ${theme.radius.sm} 0` }}>
                                                <p style={{ fontSize: '13px', fontWeight: 700, color: theme.text.primary, marginBottom: '4px' }}>{proj.name}</p>
                                                {proj.description && <p style={{ fontSize: '12px', color: theme.text.muted, marginBottom: '6px' }}>{proj.description}</p>}
                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                    {(proj.files || []).map(f => (
                                                        <a key={f.id} href={`/uploads/content/${f.stored_name}`} target="_blank" rel="noopener noreferrer"
                                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: theme.accent.blue, textDecoration: 'none' }}>
                                                            <Download size={12} /> {f.original_name}
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>
                    )}

                    {days.length === 0 ? (
                        <EmptyState
                            icon={<FileText size={32} />}
                            title="No sessions yet"
                            message="Sessions will appear here once your trainer adds content for this module."
                        />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {days.map((day, idx) => {
                                const isSubmitted = day.submission_status === 'submitted' || day.submitted;
                                const hasFiles = (day.content_files || day.ContentFiles || []).length > 0;

                                return (
                                    <Card key={day.id} hoverable noPadding>
                                        <div style={{ height: '3px', background: isSubmitted ? theme.accent.green : theme.accent.blue }} />
                                        <div style={{ padding: '18px 22px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <span style={{
                                                        width: '34px', height: '34px', borderRadius: theme.radius.sm,
                                                        background: isSubmitted ? `${theme.accent.green}15` : `${theme.accent.blue}15`,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '13px', fontWeight: 800,
                                                        color: isSubmitted ? theme.accent.green : theme.accent.blue,
                                                    }}>
                                                        {idx + 1}
                                                    </span>
                                                    <div>
                                                        <h4 style={{ fontSize: '15px', fontWeight: 700, color: theme.text.primary, margin: 0 }}>
                                                            {day.title || day.topic || `Day ${day.day_number || idx + 1}`}
                                                        </h4>
                                                        {day.topic && day.title && (
                                                            <div style={{ fontSize: '12px', color: theme.text.muted, marginTop: '2px' }}>{day.topic}</div>
                                                        )}
                                                    </div>
                                                </div>

                                                {isSubmitted ? (
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                        padding: '4px 12px', borderRadius: theme.radius.full,
                                                        fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                                                        background: `${theme.accent.green}15`, color: theme.accent.green,
                                                    }}>
                                                        <CheckCircle size={12} /> Submitted
                                                    </span>
                                                ) : (
                                                    <span style={{
                                                        padding: '4px 12px', borderRadius: theme.radius.full,
                                                        fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                                                        background: `${theme.accent.yellow}15`, color: theme.accent.yellow,
                                                    }}>
                                                        Pending
                                                    </span>
                                                )}
                                            </div>

                                            {/* Materials */}
                                            {hasFiles && (
                                                <div style={{ marginBottom: '12px' }}>
                                                    <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.text.label, marginBottom: '8px' }}>
                                                        Study Materials
                                                    </div>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                        {(day.content_files || day.ContentFiles || []).map((file, fi) => (
                                                            <a key={fi} href={file.url || file.file_url} target="_blank" rel="noreferrer"
                                                                style={{
                                                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                                    padding: '8px 14px', borderRadius: theme.radius.sm,
                                                                    background: `${theme.accent.cyan}08`, border: `1px solid ${theme.accent.cyan}20`,
                                                                    color: theme.accent.cyan, fontSize: '12px', fontWeight: 600,
                                                                    textDecoration: 'none', transition: 'all 0.15s',
                                                                }}
                                                            >
                                                                <Download size={14} /> {file.original_name || file.name || `File ${fi + 1}`}
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Worksheet Submission */}
                                            {!isSubmitted && (
                                                <div style={{
                                                    background: theme.bg.input, border: `1px solid ${theme.border.subtle}`,
                                                    borderRadius: theme.radius.md, padding: '14px 16px',
                                                }}>
                                                    <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.text.label, marginBottom: '8px' }}>
                                                        Submit Worksheet
                                                    </div>
                                                    <label style={{
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                                        padding: '12px', borderRadius: theme.radius.sm,
                                                        border: `2px dashed ${theme.border.light}`, cursor: 'pointer',
                                                        color: theme.text.muted, fontSize: '13px', fontWeight: 600,
                                                        transition: 'all 0.2s',
                                                    }}>
                                                        {uploading === day.id ? (
                                                            <span style={{ color: theme.accent.blue }}>Uploading...</span>
                                                        ) : (
                                                            <>
                                                                <Upload size={16} /> Choose file to upload
                                                                <input type="file" style={{ display: 'none' }}
                                                                    onChange={(e) => handleFileSubmit(day.id, e.target.files[0])} />
                                                            </>
                                                        )}
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                    </div>
                    )}
                </div>
            </div>
            <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
    );
};

export default StudentMaterials;
