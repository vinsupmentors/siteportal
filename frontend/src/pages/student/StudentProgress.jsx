import { useState, useEffect } from 'react';
import { studentAPI, jobAPI } from '../../services/api';
import theme from './theme';
import {
    PageHeader, StatCard, Card, LoadingSpinner,
} from './StudentComponents';
import {
    TrendingUp, Award, Target, BarChart3, CheckCircle,
    Flame, Star, Calendar, BookOpen, Briefcase, AlertCircle,
    FileText, MessageSquare, ChevronDown, ChevronRight, Trophy,
    GraduationCap, Rocket, Download, Clock, BadgeCheck, Layers, Lock,
} from 'lucide-react';

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (d) => {
    if (!d) return null;
    try {
        const date = new Date(d);
        if (isNaN(date.getTime())) return null;
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return null; }
};

const scoreColor = (marks) => {
    if (marks === null || marks === undefined) return theme.text.muted;
    if (marks >= 80) return theme.accent.green;
    if (marks >= 50) return theme.accent.yellow;
    return theme.accent.red;
};

const scoreLabel = (marks) => {
    if (marks === null || marks === undefined) return 'Not graded';
    if (marks >= 80) return 'Excellent';
    if (marks >= 60) return 'Good';
    if (marks >= 50) return 'Average';
    return 'Needs improvement';
};

const TYPE_META = {
    module_project:   { label: 'Project',  color: theme.accent.blue,   icon: Briefcase  },
    module_test:      { label: 'Test',     color: theme.accent.yellow, icon: FileText   },
    capstone_project: { label: 'Capstone', color: '#f97316',           icon: Trophy     },
};

// ─── Score Ring ────────────────────────────────────────────────────────────────
const ScoreRing = ({ value, size = 120, label }) => {
    const radius = (size / 2) - 10;
    const circumference = 2 * Math.PI * radius;
    const pct = Math.min(100, Math.max(0, value || 0));
    const strokeDash = (pct / 100) * circumference;
    const color = scoreColor(value);

    return (
        <div style={{ position: 'relative', width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth="8"
                    strokeDasharray={circumference} strokeDashoffset={circumference - strokeDash}
                    strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: size > 100 ? '28px' : '20px', fontWeight: 800, color }}>{value ?? '—'}</span>
                {label && <span style={{ fontSize: '9px', fontWeight: 600, color: theme.text.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>}
            </div>
        </div>
    );
};

// ─── Grade Card ────────────────────────────────────────────────────────────────
const GradeCard = ({ item }) => {
    const [expanded, setExpanded] = useState(false);
    const meta = TYPE_META[item.release_type] || { label: 'Submission', color: theme.accent.blue, icon: FileText };
    const Icon = meta.icon;
    const isGraded = item.status === 'graded' && item.marks !== null;
    const color = isGraded ? scoreColor(item.marks) : theme.text.muted;

    return (
        <div style={{
            background: theme.bg.card,
            border: `1px solid ${isGraded ? `${color}30` : theme.border.subtle}`,
            borderLeft: `4px solid ${meta.color}`,
            borderRadius: theme.radius.lg,
            overflow: 'hidden',
            transition: 'box-shadow 0.2s',
            boxShadow: theme.shadow.card,
        }}>
            {/* Header row */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '16px 20px', cursor: 'pointer',
            }} onClick={() => setExpanded(p => !p)}>
                {/* Icon */}
                <div style={{
                    width: '40px', height: '40px', borderRadius: theme.radius.md, flexShrink: 0,
                    background: `${meta.color}15`, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: meta.color,
                }}>
                    <Icon size={18} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: theme.text.primary }}>{item.name}</span>
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: theme.radius.full, background: `${meta.color}15`, color: meta.color }}>
                            {meta.label}
                        </span>
                        {item.status === 'returned' && (
                            <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: theme.radius.full, background: `${theme.accent.yellow}15`, color: theme.accent.yellow }}>
                                Returned for Rework
                            </span>
                        )}
                    </div>
                    <div style={{ fontSize: '11px', color: theme.text.muted }}>
                        Submitted {fmtDate(item.submitted_at)}
                        {item.graded_at && ` · Graded ${fmtDate(item.graded_at)}`}
                    </div>
                </div>

                {/* Score */}
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    {isGraded ? (
                        <>
                            <div style={{ fontSize: '28px', fontWeight: 800, color, lineHeight: 1 }}>
                                {item.marks}
                            </div>
                            <div style={{ fontSize: '10px', color: theme.text.muted, marginTop: '2px' }}>/100</div>
                            <div style={{ fontSize: '10px', fontWeight: 700, color, marginTop: '2px' }}>
                                {scoreLabel(item.marks)}
                            </div>
                        </>
                    ) : (
                        <div style={{ fontSize: '12px', color: theme.text.muted, fontWeight: 600 }}>
                            {item.status === 'submitted' ? 'Pending Review' : 'Not Graded'}
                        </div>
                    )}
                </div>

                {/* Expand */}
                <div style={{ color: theme.text.muted, flexShrink: 0 }}>
                    {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>
            </div>

            {/* Score bar */}
            {isGraded && (
                <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', margin: '0 20px' }}>
                    <div style={{
                        height: '100%', background: color,
                        width: `${item.marks}%`, transition: 'width 0.8s ease-out',
                        borderRadius: '2px',
                    }} />
                </div>
            )}

            {/* Expanded feedback */}
            {expanded && item.feedback && (
                <div style={{
                    padding: '14px 20px 16px',
                    borderTop: `1px solid ${theme.border.subtle}`,
                }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.text.label, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MessageSquare size={12} /> Trainer Feedback
                    </div>
                    <div style={{
                        padding: '12px 14px', borderRadius: theme.radius.md,
                        background: `${theme.accent.green}08`, border: `1px solid ${theme.accent.green}20`,
                        fontSize: '13px', color: theme.text.secondary, lineHeight: 1.6,
                    }}>
                        {item.feedback}
                    </div>
                </div>
            )}

            {expanded && !item.feedback && (
                <div style={{ padding: '12px 20px 14px', borderTop: `1px solid ${theme.border.subtle}` }}>
                    <div style={{ fontSize: '12px', color: theme.text.muted, fontStyle: 'italic' }}>
                        No feedback provided yet.
                    </div>
                </div>
            )}
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export const StudentProgress = () => {
    const [progress, setProgress] = useState(null);
    const [eligibility, setEligibility] = useState(null);
    const [careerData, setCareerData] = useState(null);
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState('marks');
    const [generatingCert, setGeneratingCert] = useState(null);
    const [markingReady, setMarkingReady] = useState(false);
    const [certMsg, setCertMsg] = useState('');
    const [iopModules, setIopModules] = useState([]);
    const [iopTypeFilter, setIopTypeFilter] = useState('soft_skills');

    const fetchCareerData = async () => {
        const [careerRes, certsRes] = await Promise.all([
            studentAPI.getInternshipEligibility().catch(() => ({ data: null })),
            studentAPI.getCertificates().catch(() => ({ data: { certificates: [] } })),
        ]);
        setCareerData(careerRes.data || null);
        setCertificates(certsRes.data?.certificates || []);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [progRes, eligRes] = await Promise.all([
                    studentAPI.getProgress(),
                    jobAPI.getEligibility().catch(() => ({ data: null })),
                ]);
                setProgress(progRes.data || {});
                setEligibility(eligRes.data || null);
                await fetchCareerData();
                // Fetch IOP curriculum — server returns 403 for JRP students (silently ignored)
                studentAPI.getIOPCurriculum()
                    .then(r => setIopModules(r.data.modules || []))
                    .catch(() => {});
            } catch (error) {
                console.error('Error fetching progress data', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleGenerateCert = async (cert_type) => {
        setGeneratingCert(cert_type);
        setCertMsg('');
        try {
            const res = await studentAPI.generateCertificate({ cert_type });
            setCertMsg(`Certificate generated! Opening preview...`);
            // Open the HTML cert in a new window
            const w = window.open('', '_blank');
            if (w) w.document.write(res.data.html);
            await fetchCareerData();
        } catch (err) {
            setCertMsg(err.response?.data?.message || 'Failed to generate certificate');
        } finally {
            setGeneratingCert(null);
        }
    };

    const handleDownloadCert = async (certId, certType) => {
        try {
            const res = await studentAPI.downloadCertificate(certId);
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/html' }));
            const a = document.createElement('a');
            a.href = url; a.download = `${certType}_certificate.html`;
            document.body.appendChild(a); a.click(); a.remove();
        } catch { setCertMsg('Download failed'); }
    };

    const handleMarkReady = async () => {
        setMarkingReady(true);
        try {
            await studentAPI.markReadyForInterview();
            await fetchCareerData();
        } catch (err) {
            setCertMsg(err.response?.data?.message || 'Failed');
        } finally {
            setMarkingReady(false);
        }
    };

    if (loading) return <LoadingSpinner label="Loading progress..." />;

    if (progress?.noBatch) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '16px' }}>
            <div style={{ fontSize: '48px' }}>📊</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: theme.text.primary }}>No Active Batch</div>
            <div style={{ fontSize: '14px', color: theme.text.muted }}>Enroll in a batch to track your progress.</div>
        </div>
    );

    const p = progress || {};
    const attendance = p.attendance?.pct || 0;
    const streak = p.streak || 0;
    const rank = p.rank || {};
    const loyaltyMarks = p.loyaltyMarks || 0;
    const avgTestScore = p.avgTestScore || 0;
    const worksheets = p.worksheets || { submitted: 0, total: 0, pct: 0 };
    const moduleRoadmap = p.moduleRoadmap || [];
    const gradedItems = p.gradedItems || [];
    const passedModules = p.passedModules || 0;
    const totalModules = p.totalModules || 0;

    // Split graded items by type
    const gradedTests = gradedItems.filter(i => i.release_type === 'module_test');
    const gradedProjects = gradedItems.filter(i => i.release_type === 'module_project');
    const gradedCapstones = gradedItems.filter(i => i.release_type === 'capstone_project');

    // Average of graded items
    const gradedWithMarks = gradedItems.filter(i => i.marks !== null && i.marks !== undefined);
    const overallAvg = gradedWithMarks.length > 0
        ? Math.round(gradedWithMarks.reduce((a, i) => a + parseFloat(i.marks), 0) / gradedWithMarks.length)
        : null;

    const attendanceColor = attendance >= 85 ? theme.accent.green : attendance >= 60 ? theme.accent.yellow : theme.accent.red;

    const isIOP = careerData?.program_type === 'IOP';

    const SECTIONS = [
        { id: 'marks',    label: 'Marks & Grades',   count: gradedItems.length     },
        { id: 'overview', label: 'Overview',          count: null                   },
        { id: 'modules',  label: 'Module Roadmap',    count: moduleRoadmap.length   },
        { id: 'career',   label: 'Career Readiness',  count: null                   },
        ...(isIOP ? [{ id: 'iop', label: 'IOP Training', count: iopModules.length, accent: '#10b981' }] : []),
    ];

    return (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <PageHeader
                title="My Progress"
                subtitle="Track your marks, grades and learning journey"
                icon={<TrendingUp size={24} />}
                accentColor={theme.accent.green}
            />

            {/* Top Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                <StatCard icon={<Calendar size={22} />} label="Attendance" value={`${attendance}%`} accentColor={theme.accent.cyan} />
                <StatCard icon={<Flame size={22} />} label="Streak" value={`${streak} days`} accentColor={theme.accent.red} />
                <StatCard icon={<Award size={22} />} label="Class Rank" value={rank.total ? `#${rank.position}/${rank.total}` : '—'} accentColor={theme.accent.yellow} />
                <StatCard icon={<Star size={22} />} label="Loyalty Points" value={loyaltyMarks} accentColor={theme.accent.purple} />
                <StatCard icon={<Trophy size={22} />} label="Overall Avg" value={overallAvg !== null ? `${overallAvg}%` : '—'} accentColor={theme.accent.green} />
            </div>

            {/* IOP Journey Banner — shown only for IOP students */}
            {isIOP && (
                <div style={{
                    marginBottom: '24px', padding: '16px 20px',
                    background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
                    borderRadius: theme.radius.lg,
                }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#10b981', marginBottom: '12px' }}>
                        IOP Student Journey
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0', flexWrap: 'wrap', rowGap: '8px' }}>
                        {[
                            { label: 'Joined',                  done: true,                                    emoji: '🎓' },
                            { label: 'Soft Skills & Aptitude',  done: iopModules.some(m => m.is_unlocked),    emoji: '🧠' },
                            { label: 'Technical Class',         done: passedModules > 0,                       emoji: '💻' },
                            { label: 'Projects',                done: gradedCapstones.length > 0,              emoji: '🏗️' },
                            { label: 'Certificate',             done: certificates.length > 0,                 emoji: '🏆' },
                            { label: 'Placements',              done: careerData?.ready_for_interview,         emoji: '🚀' },
                        ].map((step, i, arr) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    padding: '5px 12px', borderRadius: '20px',
                                    background: step.done ? 'rgba(16,185,129,0.14)' : 'rgba(255,255,255,0.04)',
                                    border: `1px solid ${step.done ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.08)'}`,
                                    fontSize: '12px', fontWeight: step.done ? 700 : 500,
                                    color: step.done ? '#10b981' : theme.text.muted,
                                    opacity: step.done ? 1 : 0.6,
                                }}>
                                    <span>{step.emoji}</span>
                                    <span>{step.label}</span>
                                    {step.done && <CheckCircle size={11} color="#10b981" />}
                                </div>
                                {i < arr.length - 1 && (
                                    <span style={{ padding: '0 6px', color: theme.text.muted, fontSize: '14px', opacity: 0.4 }}>→</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Section Tabs */}
            <div style={{
                display: 'flex', gap: '4px', marginBottom: '20px',
                background: theme.bg.input, border: `1px solid ${theme.border.subtle}`,
                borderRadius: theme.radius.lg, padding: '5px', width: 'fit-content',
            }}>
                {SECTIONS.map(s => {
                    const isActive = activeSection === s.id;
                    return (
                        <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '9px 20px', borderRadius: theme.radius.md,
                            border: 'none', cursor: 'pointer', fontSize: '13px',
                            fontWeight: isActive ? 700 : 500,
                            background: isActive ? theme.bg.card : 'transparent',
                            color: isActive ? (s.accent || theme.text.primary) : theme.text.muted,
                            boxShadow: isActive ? theme.shadow.card : 'none',
                            transition: 'all 0.15s',
                        }}>
                            {s.id === 'iop' && <Layers size={13} />}
                            {s.label}
                            {s.count !== null && (
                                <span style={{
                                    fontSize: '10px', fontWeight: 800, padding: '1px 6px',
                                    borderRadius: theme.radius.full,
                                    background: isActive ? `${s.accent || theme.accent.blue}20` : theme.bg.input,
                                    color: isActive ? (s.accent || theme.accent.blue) : theme.text.muted,
                                }}>
                                    {s.count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ══ SECTION: MARKS & GRADES ══ */}
            {activeSection === 'marks' && (
                <div>
                    {gradedItems.length === 0 ? (
                        <div style={{
                            textAlign: 'center', padding: '48px',
                            background: theme.bg.card, border: `1px solid ${theme.border.subtle}`,
                            borderRadius: theme.radius.lg,
                        }}>
                            <Trophy size={48} color={theme.text.muted} style={{ marginBottom: '16px', opacity: 0.4 }} />
                            <div style={{ fontSize: '18px', fontWeight: 700, color: theme.text.primary, marginBottom: '8px' }}>
                                No grades yet
                            </div>
                            <div style={{ fontSize: '14px', color: theme.text.muted }}>
                                Submit your projects and tests to see your grades here.
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                            {/* Summary row */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                                {[
                                    { label: 'Tests Submitted',    value: gradedTests.length,    color: theme.accent.yellow },
                                    { label: 'Projects Submitted', value: gradedProjects.length, color: theme.accent.blue   },
                                    { label: 'Capstones Done',     value: gradedCapstones.length,color: '#f97316'           },
                                    { label: 'Overall Average',    value: overallAvg !== null ? `${overallAvg}%` : '—', color: theme.accent.green },
                                ].map((s, i) => (
                                    <div key={i} style={{
                                        padding: '16px 20px', borderRadius: theme.radius.md,
                                        background: theme.bg.card, border: `1px solid ${s.color}20`,
                                        borderLeft: `4px solid ${s.color}`,
                                    }}>
                                        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.text.label, marginBottom: '6px' }}>
                                            {s.label}
                                        </div>
                                        <div style={{ fontSize: '26px', fontWeight: 800, color: s.color }}>
                                            {s.value}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Tests */}
                            {gradedTests.length > 0 && (
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', paddingBottom: '8px', borderBottom: `1px solid ${theme.border.subtle}` }}>
                                        <FileText size={16} color={theme.accent.yellow} />
                                        <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: theme.text.label }}>
                                            Tests ({gradedTests.length})
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {gradedTests.map(item => <GradeCard key={item.id} item={item} />)}
                                    </div>
                                </div>
                            )}

                            {/* Projects */}
                            {gradedProjects.length > 0 && (
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', paddingBottom: '8px', borderBottom: `1px solid ${theme.border.subtle}` }}>
                                        <Briefcase size={16} color={theme.accent.blue} />
                                        <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: theme.text.label }}>
                                            Projects ({gradedProjects.length})
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {gradedProjects.map(item => <GradeCard key={item.id} item={item} />)}
                                    </div>
                                </div>
                            )}

                            {/* Capstones */}
                            {gradedCapstones.length > 0 && (
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', paddingBottom: '8px', borderBottom: `1px solid ${theme.border.subtle}` }}>
                                        <Trophy size={16} color="#f97316" />
                                        <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: theme.text.label }}>
                                            Capstone Projects ({gradedCapstones.length})
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {gradedCapstones.map(item => <GradeCard key={item.id} item={item} />)}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ══ SECTION: OVERVIEW ══ */}
            {activeSection === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {/* Attendance Ring */}
                    <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '32px 24px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.text.label, marginBottom: '24px' }}>
                            Attendance Overview
                        </div>
                        <ScoreRing value={attendance} size={140} label="Present" />
                        <div style={{ marginTop: '20px', padding: '8px 18px', borderRadius: theme.radius.full, background: `${attendanceColor}12`, border: `1px solid ${attendanceColor}25`, fontSize: '11px', fontWeight: 700, color: attendanceColor }}>
                            {attendance >= 85 ? '✅ Placement Eligible' : attendance >= 60 ? '⚠️ Needs Improvement' : '🚨 At Risk'}
                        </div>
                        <div style={{ marginTop: '12px', fontSize: '12px', color: theme.text.muted }}>
                            {p.attendance?.present || 0} present / {p.attendance?.total || 0} total days
                        </div>
                    </Card>

                    {/* Performance Metrics */}
                    <Card>
                        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.text.label, marginBottom: '20px' }}>
                            Performance Metrics
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Test Avg */}
                            <div style={{ background: theme.bg.input, border: `1px solid ${theme.border.subtle}`, borderRadius: theme.radius.md, padding: '18px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <BarChart3 size={16} color={theme.accent.blue} />
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: theme.text.secondary }}>Test Average</span>
                                    </div>
                                    <span style={{ fontSize: '22px', fontWeight: 800, color: scoreColor(avgTestScore) }}>
                                        {avgTestScore > 0 ? `${avgTestScore}%` : '—'}
                                    </span>
                                </div>
                                <div style={{ height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)' }}>
                                    <div style={{ height: '100%', borderRadius: '3px', width: `${avgTestScore}%`, background: scoreColor(avgTestScore), transition: 'width 0.6s' }} />
                                </div>
                            </div>

                            {/* Worksheets */}
                            <div style={{ background: theme.bg.input, border: `1px solid ${theme.border.subtle}`, borderRadius: theme.radius.md, padding: '18px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <BookOpen size={16} color={theme.accent.cyan} />
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: theme.text.secondary }}>Worksheets</span>
                                    </div>
                                    <span style={{ fontSize: '22px', fontWeight: 800, color: theme.text.primary }}>
                                        {worksheets.submitted}/{worksheets.total}
                                    </span>
                                </div>
                                <div style={{ height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)' }}>
                                    <div style={{ height: '100%', borderRadius: '3px', width: `${worksheets.pct}%`, background: theme.accent.cyan, transition: 'width 0.6s' }} />
                                </div>
                            </div>

                            {/* Modules */}
                            <div style={{ background: theme.bg.input, border: `1px solid ${theme.border.subtle}`, borderRadius: theme.radius.md, padding: '18px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Target size={16} color={theme.accent.green} />
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: theme.text.secondary }}>Modules Passed</span>
                                    </div>
                                    <span style={{ fontSize: '22px', fontWeight: 800, color: theme.text.primary }}>{passedModules}/{totalModules}</span>
                                </div>
                                <div style={{ height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)' }}>
                                    <div style={{ height: '100%', borderRadius: '3px', width: totalModules ? `${(passedModules / totalModules) * 100}%` : '0%', background: theme.accent.green, transition: 'width 0.6s' }} />
                                </div>
                            </div>

                            {/* Loyalty */}
                            <div style={{ background: `${theme.accent.yellow}08`, border: `1px solid ${theme.accent.yellow}20`, borderRadius: theme.radius.md, padding: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Star size={20} color={theme.accent.yellow} />
                                    <div>
                                        <div style={{ fontSize: '12px', fontWeight: 700, color: theme.text.primary }}>Loyalty Tier</div>
                                        <div style={{ fontSize: '10px', color: theme.text.muted, marginTop: '2px' }}>{loyaltyMarks} points earned</div>
                                    </div>
                                </div>
                                <span style={{ fontSize: '28px' }}>
                                    {loyaltyMarks >= 500 ? '💎' : loyaltyMarks >= 200 ? '🥇' : loyaltyMarks >= 100 ? '🥈' : '🥉'}
                                </span>
                            </div>
                        </div>
                    </Card>

                    {/* Placement Eligibility */}
                    {eligibility?.criteria && (
                        <Card style={{ gridColumn: '1 / -1' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Briefcase size={20} color={theme.accent.purple} />
                                    <div style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.text.label }}>
                                        Placement Eligibility
                                    </div>
                                </div>
                                {eligibility.canRequest ? (
                                    <span style={{ padding: '6px 12px', background: `${theme.accent.green}20`, color: theme.accent.green, borderRadius: theme.radius.full, fontSize: '12px', fontWeight: 700 }}>
                                        ✅ Eligible to Apply
                                    </span>
                                ) : (
                                    <span style={{ padding: '6px 12px', background: `${theme.accent.red}20`, color: theme.accent.red, borderRadius: theme.radius.full, fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <AlertCircle size={14} /> Action Required
                                    </span>
                                )}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                                {Object.entries(eligibility.criteria).map(([key, data]) => {
                                    const isMet = data.met;
                                    const progressPct = key === 'portfolio' ? (isMet ? 100 : 0) : Math.min(100, (data.value / data.target) * 100);
                                    return (
                                        <div key={key} style={{ padding: '14px', borderRadius: theme.radius.md, background: isMet ? `${theme.accent.green}05` : `${theme.accent.red}05`, border: `1px solid ${isMet ? theme.accent.green + '20' : theme.accent.red + '20'}` }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                                <span style={{ fontSize: '13px', fontWeight: 600, color: theme.text.secondary, textTransform: 'capitalize' }}>{key}</span>
                                                <span style={{ fontSize: '13px', fontWeight: 800, color: isMet ? theme.accent.green : theme.text.primary }}>
                                                    {key === 'portfolio' ? (isMet ? 'Approved' : 'Pending') : `${data.value} / ${data.target}${key !== 'capstone' ? '%' : ''}`}
                                                </span>
                                            </div>
                                            <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)' }}>
                                                <div style={{ height: '100%', borderRadius: '3px', width: `${progressPct}%`, background: isMet ? theme.accent.green : theme.accent.yellow, transition: 'width 0.6s' }} />
                                            </div>
                                            <div style={{ fontSize: '11px', marginTop: '8px', color: theme.text.muted }}>
                                                {isMet ? 'Requirement met ✓' : `Need: ${data.target}${key !== 'capstone' && key !== 'portfolio' ? '%' : ''}`}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    )}
                </div>
            )}

            {/* ══ SECTION: MODULE ROADMAP ══ */}
            {activeSection === 'modules' && (
                <Card>
                    <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.text.label, marginBottom: '20px' }}>
                        Module Roadmap — {passedModules}/{totalModules} Passed
                    </div>
                    {moduleRoadmap.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '24px', color: theme.text.muted }}>No modules found.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {moduleRoadmap.map((mod, idx) => {
                                const statusColors = {
                                    passed:  theme.accent.green,
                                    failed:  theme.accent.red,
                                    active:  theme.accent.blue,
                                    pending: theme.accent.yellow,
                                    locked:  theme.text.muted,
                                };
                                const statusLabels = {
                                    passed:  'Passed ✓',
                                    failed:  'Failed',
                                    active:  'In Progress',
                                    pending: 'Pending Review',
                                    locked:  'Locked',
                                };
                                const color = statusColors[mod.status] || theme.text.muted;
                                return (
                                    <div key={mod.id} style={{
                                        display: 'flex', alignItems: 'center', gap: '14px',
                                        padding: '16px 18px', borderRadius: theme.radius.md,
                                        background: mod.status === 'passed' ? `${theme.accent.green}06` : 'rgba(255,255,255,0.02)',
                                        border: `1px solid ${color}20`,
                                    }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: theme.radius.sm, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '13px', fontWeight: 800, color }}>
                                            {mod.status === 'passed' ? <CheckCircle size={18} /> : mod.sequence_order}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '14px', fontWeight: 700, color: theme.text.primary, marginBottom: '4px' }}>{mod.name}</div>
                                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: '11px', color, fontWeight: 700 }}>{statusLabels[mod.status]}</span>
                                                {mod.best_score !== null && (
                                                    <span style={{ fontSize: '11px', color: theme.text.muted }}>Best score: <strong style={{ color: scoreColor(mod.best_score) }}>{mod.best_score}/100</strong></span>
                                                )}
                                                {mod.attempts > 0 && (
                                                    <span style={{ fontSize: '11px', color: theme.text.muted }}>{mod.attempts} attempt{mod.attempts !== 1 ? 's' : ''}</span>
                                                )}
                                            </div>
                                        </div>
                                        {mod.best_score !== null && (
                                            <div style={{ textAlign: 'center', flexShrink: 0 }}>
                                                <div style={{ fontSize: '24px', fontWeight: 800, color: scoreColor(mod.best_score) }}>{mod.best_score}</div>
                                                <div style={{ fontSize: '10px', color: theme.text.muted }}>/100</div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>
            )}

            {/* ══ SECTION: CAREER READINESS ══ */}
            {activeSection === 'career' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Program Type Badge */}
                    {careerData && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                            <div style={{
                                padding: '8px 18px', borderRadius: theme.radius.full, fontWeight: 800, fontSize: '14px',
                                background: careerData.program_type === 'IOP' ? `${theme.accent.green}20` : `${theme.accent.blue}20`,
                                color: careerData.program_type === 'IOP' ? theme.accent.green : theme.accent.blue,
                                border: `1px solid ${careerData.program_type === 'IOP' ? theme.accent.green : theme.accent.blue}40`,
                                display: 'flex', alignItems: 'center', gap: '8px',
                            }}>
                                <Rocket size={16} />
                                {careerData.program_type === 'IOP' ? 'Interview Opportunity Program (IOP)' : 'Job Readiness Program (JRP)'}
                            </div>
                            {careerData.internshipEligible && (
                                <div style={{ padding: '6px 14px', borderRadius: theme.radius.full, background: `${theme.accent.green}15`, color: theme.accent.green, fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <BadgeCheck size={14} /> All Criteria Met
                                </div>
                            )}
                        </div>
                    )}

                    {certMsg && (
                        <div style={{ padding: '12px 16px', borderRadius: theme.radius.md, background: `${theme.accent.blue}10`, border: `1px solid ${theme.accent.blue}30`, color: theme.accent.blue, fontSize: '13px' }}>
                            {certMsg}
                        </div>
                    )}

                    {/* Eligibility Criteria */}
                    {careerData?.criteria && (
                        <Card>
                            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.text.label, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Target size={14} /> Internship Criteria Checklist
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                                {[
                                    { key: 'attendance',      label: 'Attendance',            value: `${careerData.criteria.attendance.value}%`,      required: '≥ 80%',  met: careerData.criteria.attendance.met },
                                    { key: 'module_projects', label: 'Module Projects Avg',   value: `${careerData.criteria.module_projects.value}%`,  required: '≥ 75%',  met: careerData.criteria.module_projects.met },
                                    { key: 'capstone',        label: 'Capstone Completed',    value: careerData.criteria.capstone.value,              required: 'Min 1',  met: careerData.criteria.capstone.met },
                                    { key: 'test_attendance', label: 'Test Attendance',       value: `${careerData.criteria.test_attendance.value}%`, required: '100%',   met: careerData.criteria.test_attendance.met },
                                    { key: 'feedback_forms',  label: 'Feedback Forms',        value: `${careerData.criteria.feedback_forms.value}%`,  required: '100%',   met: careerData.criteria.feedback_forms.met },
                                    { key: 'portfolio',       label: 'Portfolio',             value: careerData.criteria.portfolio.status,            required: 'Approved', met: careerData.criteria.portfolio.met },
                                ].map(item => (
                                    <div key={item.key} style={{
                                        display: 'flex', alignItems: 'center', gap: '12px', padding: '14px',
                                        borderRadius: theme.radius.md,
                                        background: item.met ? `${theme.accent.green}06` : `${theme.accent.red}06`,
                                        border: `1px solid ${item.met ? theme.accent.green + '25' : theme.accent.red + '20'}`,
                                    }}>
                                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: item.met ? `${theme.accent.green}20` : `${theme.accent.red}15` }}>
                                            {item.met
                                                ? <CheckCircle size={16} color={theme.accent.green} />
                                                : <AlertCircle size={16} color={theme.accent.red} />
                                            }
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '12px', fontWeight: 700, color: theme.text.primary }}>{item.label}</div>
                                            <div style={{ fontSize: '11px', color: theme.text.muted, marginTop: '2px' }}>
                                                {item.value} <span style={{ color: theme.text.label }}>/ required {item.required}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Certificates */}
                    <Card>
                        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.text.label, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <GraduationCap size={14} /> Certificates
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                            {[
                                {
                                    type: 'completion',
                                    label: 'Course Completion Certificate',
                                    desc: 'Requires 75% attendance',
                                    eligible: careerData?.completionEligible,
                                    color: theme.accent.blue,
                                },
                                {
                                    type: 'internship',
                                    label: 'Internship Certificate',
                                    desc: 'Requires all criteria met',
                                    eligible: careerData?.internshipEligible,
                                    color: theme.accent.green,
                                },
                            ].map(cert => {
                                const existing = certificates.find(c => c.cert_type === cert.type && !c.reset_by_admin);
                                return (
                                    <div key={cert.type} style={{
                                        padding: '20px', borderRadius: theme.radius.md,
                                        background: theme.bg.input, border: `1px solid ${cert.color}25`,
                                        borderTop: `3px solid ${cert.color}`,
                                    }}>
                                        <div style={{ fontSize: '13px', fontWeight: 700, color: theme.text.primary, marginBottom: '6px' }}>{cert.label}</div>
                                        <div style={{ fontSize: '11px', color: theme.text.muted, marginBottom: '16px' }}>{cert.desc}</div>
                                        {existing ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <div style={{ fontSize: '11px', color: theme.accent.green, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <CheckCircle size={13} /> Generated on {fmtDate(existing.generated_at)}
                                                </div>
                                                <button
                                                    onClick={() => handleDownloadCert(existing.id, cert.type)}
                                                    style={{ padding: '8px 14px', borderRadius: theme.radius.sm, background: `${cert.color}15`, color: cert.color, border: `1px solid ${cert.color}30`, cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Download size={13} /> Download
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => cert.eligible && handleGenerateCert(cert.type)}
                                                disabled={!cert.eligible || generatingCert === cert.type}
                                                style={{
                                                    width: '100%', padding: '10px', borderRadius: theme.radius.sm, fontSize: '12px', fontWeight: 700,
                                                    cursor: cert.eligible ? 'pointer' : 'not-allowed',
                                                    background: cert.eligible ? cert.color : 'transparent',
                                                    color: cert.eligible ? '#fff' : theme.text.muted,
                                                    border: `1px solid ${cert.eligible ? cert.color : theme.border.subtle}`,
                                                    opacity: generatingCert === cert.type ? 0.6 : 1,
                                                }}>
                                                {generatingCert === cert.type ? 'Generating...' : cert.eligible ? 'Generate Certificate' : 'Not Yet Eligible'}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    {/* IOP: Ready for Interview */}
                    {careerData?.program_type === 'IOP' && (
                        <Card>
                            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.text.label, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Briefcase size={14} /> Interview Readiness (IOP)
                            </div>
                            {careerData.ready_for_interview ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{ padding: '16px', borderRadius: theme.radius.md, background: `${theme.accent.green}08`, border: `1px solid ${theme.accent.green}25`, display: 'flex', alignItems: 'center', gap: '14px' }}>
                                        <BadgeCheck size={32} color={theme.accent.green} />
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: 700, color: theme.accent.green }}>Ready for Interview</div>
                                            <div style={{ fontSize: '12px', color: theme.text.muted, marginTop: '4px' }}>
                                                Course completion date: {fmtDate(careerData.course_completion_date)}
                                            </div>
                                        </div>
                                    </div>
                                    {careerData.course_completion_date && (() => {
                                        const deadline = new Date(careerData.course_completion_date);
                                        deadline.setDate(deadline.getDate() + 90);
                                        const daysLeft = Math.max(0, Math.round((deadline - new Date()) / (1000 * 60 * 60 * 24)));
                                        return (
                                            <div style={{ padding: '12px 16px', borderRadius: theme.radius.md, background: daysLeft < 30 ? `${theme.accent.red}08` : `${theme.accent.yellow}08`, border: `1px solid ${daysLeft < 30 ? theme.accent.red : theme.accent.yellow}25`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <Clock size={18} color={daysLeft < 30 ? theme.accent.red : theme.accent.yellow} />
                                                <span style={{ fontSize: '13px', fontWeight: 700, color: daysLeft < 30 ? theme.accent.red : theme.accent.yellow }}>
                                                    90-day interview window: {daysLeft} days remaining
                                                </span>
                                            </div>
                                        );
                                    })()}
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ fontSize: '13px', color: theme.text.muted }}>
                                        Once all internship criteria are met, mark yourself as ready to start your 90-day interview window.
                                    </div>
                                    <button
                                        onClick={handleMarkReady}
                                        disabled={!careerData.internshipEligible || markingReady}
                                        style={{
                                            width: 'fit-content', padding: '12px 24px', borderRadius: theme.radius.md,
                                            fontSize: '13px', fontWeight: 700, cursor: careerData.internshipEligible ? 'pointer' : 'not-allowed',
                                            background: careerData.internshipEligible ? theme.gradient.green : 'transparent',
                                            color: careerData.internshipEligible ? '#fff' : theme.text.muted,
                                            border: `1px solid ${careerData.internshipEligible ? 'transparent' : theme.border.subtle}`,
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                        }}>
                                        <Rocket size={15} />
                                        {markingReady ? 'Processing...' : 'Mark Ready for Interview'}
                                    </button>
                                </div>
                            )}
                        </Card>
                    )}
                </div>
            )}

            {/* ══ SECTION: IOP TRAINING ══ */}
            {activeSection === 'iop' && isIOP && (
                <div>
                    {iopModules.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '48px', background: theme.bg.card, border: `1px solid ${theme.border.subtle}`, borderRadius: theme.radius.lg }}>
                            <Layers size={48} color={theme.text.muted} style={{ marginBottom: '16px', opacity: 0.4 }} />
                            <div style={{ fontSize: '18px', fontWeight: 700, color: theme.text.primary, marginBottom: '8px' }}>No IOP modules yet</div>
                            <div style={{ fontSize: '14px', color: theme.text.muted }}>Your IOP trainer will unlock modules as sessions progress.</div>
                        </div>
                    ) : (
                        <div>
                            {/* Type filter pills */}
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                {[
                                    { key: 'soft_skills', label: 'Soft Skills', color: '#10b981' },
                                    { key: 'aptitude',    label: 'Aptitude',    color: '#fb923c' },
                                ].map(t => (
                                    <button key={t.key} onClick={() => setIopTypeFilter(t.key)} style={{
                                        padding: '7px 18px', borderRadius: '24px', fontWeight: 700, fontSize: '12px', cursor: 'pointer', transition: 'all .2s',
                                        background: iopTypeFilter === t.key ? `rgba(${t.key === 'soft_skills' ? '16,185,129' : '251,146,60'},0.12)` : 'transparent',
                                        color: iopTypeFilter === t.key ? t.color : theme.text.muted,
                                        border: `1.5px solid ${iopTypeFilter === t.key ? t.color : theme.border.subtle}`,
                                    }}>{t.label} ({iopModules.filter(m => m.type === t.key).length})</button>
                                ))}
                            </div>

                            {iopModules.filter(m => m.type === iopTypeFilter).length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '32px', color: theme.text.muted, fontSize: '14px' }}>
                                    No {iopTypeFilter === 'soft_skills' ? 'Soft Skills' : 'Aptitude'} modules configured yet.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {iopModules.filter(m => m.type === iopTypeFilter).map(mod => {
                                        const typeColor = iopTypeFilter === 'soft_skills' ? '#10b981' : '#fb923c';
                                        const unlockedDay = mod.unlocked_up_to_day || 0;
                                        const totalTopics = mod.topics.length;
                                        const unlockedCount = mod.topics.filter(t => t.is_unlocked).length;
                                        return (
                                            <Card key={mod.id}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: totalTopics > 0 ? '14px' : 0 }}>
                                                    <div style={{ width: '36px', height: '36px', borderRadius: theme.radius.md, background: `rgba(${iopTypeFilter === 'soft_skills' ? '16,185,129' : '251,146,60'},0.12)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <Layers size={16} color={typeColor} />
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: 700, fontSize: '14px', color: theme.text.primary }}>
                                                            {mod.sequence_order}. {mod.title}
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: theme.text.muted, marginTop: '2px' }}>
                                                            {unlockedCount} / {totalTopics} topics unlocked
                                                        </div>
                                                    </div>
                                                    {/* Progress pill */}
                                                    <div style={{ fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', background: unlockedCount > 0 ? `rgba(${iopTypeFilter === 'soft_skills' ? '16,185,129' : '251,146,60'},0.12)` : 'rgba(255,255,255,0.04)', color: unlockedCount > 0 ? typeColor : theme.text.muted, border: `1px solid ${unlockedCount > 0 ? typeColor + '40' : 'transparent'}` }}>
                                                        Day {unlockedDay}/{totalTopics}
                                                    </div>
                                                </div>

                                                {totalTopics > 0 && (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: `1px solid ${theme.border.subtle}`, paddingTop: '12px' }}>
                                                        {mod.topics.map(t => (
                                                            <div key={t.id} style={{
                                                                display: 'flex', alignItems: 'center', gap: '10px',
                                                                padding: '8px 10px', borderRadius: '6px',
                                                                background: t.is_unlocked ? `rgba(${iopTypeFilter === 'soft_skills' ? '16,185,129' : '251,146,60'},0.05)` : 'transparent',
                                                                border: `1px solid ${t.is_unlocked ? typeColor + '20' : 'transparent'}`,
                                                            }}>
                                                                {t.is_unlocked
                                                                    ? <CheckCircle size={13} color={typeColor} />
                                                                    : <Lock size={13} color={theme.text.muted} style={{ opacity: 0.35 }} />}
                                                                <span style={{ fontSize: '11px', fontWeight: 700, color: typeColor, minWidth: '48px' }}>Day {t.day_number}</span>
                                                                <span style={{ fontSize: '13px', color: t.is_unlocked ? theme.text.primary : theme.text.muted, flex: 1 }}>{t.topic_name}</span>
                                                                {t.notes && <span style={{ fontSize: '11px', color: theme.text.muted, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.notes}</span>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
    );
};

export default StudentProgress;