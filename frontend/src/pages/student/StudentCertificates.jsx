import { useState, useEffect } from 'react';
import { studentAPI } from '../../services/api';
import theme from './theme';
import { PageHeader, Card, LoadingSpinner } from './StudentComponents';
import {
    GraduationCap, Download, CheckCircle, AlertCircle,
    Award, FileText, RefreshCw, Camera, Upload,
} from 'lucide-react';

const fmtDate = (d) => {
    if (!d) return null;
    try {
        const date = new Date(d);
        if (isNaN(date.getTime())) return null;
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return null; }
};

// ── Certificate card config ────────────────────────────────────────────────────
const CERT_CONFIG = [
    {
        type: 'completion',
        label: 'Course Completion Certificate',
        icon: Award,
        color: '#2461a8',
        gradient: 'linear-gradient(135deg,#1a3a6b,#2461a8)',
        desc: 'Awarded on completing the course with ≥ 75% attendance.',
        eligibleKey: 'completionEligible',
        preview: [
            'Issued by Vinsup Skill Academy',
            'Student name highlighted in orange',
            'Course, Batch & Date metadata',
            'Signed by CGO & VP',
        ],
    },
    {
        type: 'internship',
        label: 'Internship Completion Certificate',
        icon: GraduationCap,
        color: '#22543d',
        gradient: 'linear-gradient(135deg,#1a5c40,#38a169)',
        desc: 'Awarded after meeting all internship criteria — attendance, projects, tests, feedback & portfolio.',
        eligibleKey: 'internshipEligible',
        preview: [
            'Issued by Vinsup Infotech Pvt Ltd',
            'Detailed internship body paragraph',
            'Performance bullet points',
            'Signed by CGO & CBPO',
        ],
    },
];

// ── Criteria chip ──────────────────────────────────────────────────────────────
const CriteriaChip = ({ label, met }) => (
    <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
        background: met ? 'rgba(72,187,120,0.12)' : 'rgba(245,101,101,0.10)',
        color: met ? '#48bb78' : '#fc8181',
        border: `1px solid ${met ? '#48bb7840' : '#fc818140'}`,
    }}>
        {met ? <CheckCircle size={11} /> : <AlertCircle size={11} />}
        {label}
    </div>
);

// ══════════════════════════════════════════════════════════════════════════════
export const StudentCertificates = () => {
    const [careerData, setCareerData] = useState(null);
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(null);
    const [msg, setMsg] = useState('');
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [photoUploading, setPhotoUploading] = useState(false);

    const fetchData = async () => {
        try {
            const [cRes, certsRes] = await Promise.all([
                studentAPI.getInternshipEligibility().catch(() => ({ data: null })),
                studentAPI.getCertificates().catch(() => ({ data: { certificates: [] } })),
            ]);
            setCareerData(cRes.data || null);
            setCertificates(certsRes.data?.certificates || []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handlePhotoChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { setMsg('Please upload an image file'); return; }
        const reader = new FileReader();
        reader.onload = async (ev) => {
            const dataUrl = ev.target.result;
            setProfilePhoto(dataUrl);
            setPhotoUploading(true);
            setMsg('');
            try {
                await studentAPI.uploadProfilePhoto(dataUrl);
                setMsg('Photo uploaded! It will appear on your certificate.');
            } catch {
                setMsg('Photo upload failed. Please try again.');
            } finally {
                setPhotoUploading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleGenerate = async (cert_type) => {
        setGenerating(cert_type);
        setMsg('');
        try {
            const res = await studentAPI.generateCertificate({ cert_type });
            setMsg('Certificate generated! Opening preview…');
            const w = window.open('', '_blank');
            if (w) {
                w.document.write(res.data.html);
                w.document.close();
            }
            await fetchData();
        } catch (err) {
            setMsg(err.response?.data?.message || 'Failed to generate certificate');
        } finally {
            setGenerating(null);
        }
    };

    const handleDownload = async (certId, certType) => {
        try {
            const res = await studentAPI.downloadCertificate(certId);
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/html' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = `${certType}_certificate.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch {
            setMsg('Download failed. Please try again.');
        }
    };

    if (loading) return <LoadingSpinner label="Loading certificates…" />;

    const criteria = careerData?.criteria || {};

    // Internship criteria summary chips
    const INTERNSHIP_CRITERIA = [
        { label: `Attendance (≥80%)`,   met: criteria.attendance?.met },
        { label: `Projects (≥75%)`,     met: criteria.module_projects?.met },
        { label: `Capstone (×1)`,       met: criteria.capstone?.met },
        { label: `Tests (100%)`,        met: criteria.test_attendance?.met },
        { label: `Feedback (100%)`,     met: criteria.feedback_forms?.met },
        { label: `Portfolio Approved`,  met: criteria.portfolio?.met },
    ];

    return (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <PageHeader
                title="My Certificates"
                subtitle="Generate and download your Vinsup certificates"
                icon={<GraduationCap size={24} />}
                accentColor="#2461a8"
            />

            {/* Status message */}
            {msg && (
                <div style={{
                    padding: '12px 18px', borderRadius: theme.radius.md, marginBottom: '20px',
                    background: msg.includes('fail') || msg.includes('Failed')
                        ? 'rgba(245,101,101,0.10)' : 'rgba(72,187,120,0.10)',
                    border: `1px solid ${msg.includes('fail') || msg.includes('Failed') ? '#fc818140' : '#48bb7840'}`,
                    color: msg.includes('fail') || msg.includes('Failed') ? '#fc8181' : '#48bb78',
                    fontSize: '13px', fontWeight: 600,
                }}>
                    {msg}
                </div>
            )}

            {/* Photo Upload Card */}
            <Card style={{ marginBottom: '24px', padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    {/* Preview */}
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '50%', flexShrink: 0,
                        background: '#1e2a3a', border: '3px solid #2461a8',
                        overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        {profilePhoto
                            ? <img src={profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <Camera size={28} color="#4a6fa5" />}
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#e2e8f0', marginBottom: '4px' }}>
                            Your Photo for Completion Certificate
                        </div>
                        <div style={{ fontSize: '12px', color: theme.text.muted, marginBottom: '12px' }}>
                            Your photo will be placed in the circular badge on your certificate. Upload a clear, passport-style photo.
                        </div>
                        <label style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            padding: '8px 16px', borderRadius: theme.radius.sm, cursor: 'pointer',
                            background: '#2461a8', color: '#fff', fontSize: '12px', fontWeight: 700,
                            opacity: photoUploading ? 0.6 : 1,
                        }}>
                            <Upload size={13} />
                            {photoUploading ? 'Uploading…' : profilePhoto ? 'Change Photo' : 'Upload Photo'}
                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} disabled={photoUploading} />
                        </label>
                    </div>
                </div>
            </Card>

            {/* Certificate cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: '24px', marginBottom: '32px' }}>
                {CERT_CONFIG.map(cert => {
                    const Icon = cert.icon;
                    const existing = certificates.find(c => c.cert_type === cert.type && !c.reset_by_admin);
                    const isEligible = !!careerData?.[cert.eligibleKey];
                    const isGenerating = generating === cert.type;

                    return (
                        <Card key={cert.type} style={{ borderTop: `4px solid ${cert.color}`, padding: 0, overflow: 'hidden' }}>
                            {/* Card header gradient */}
                            <div style={{
                                background: cert.gradient, padding: '22px 24px',
                                display: 'flex', alignItems: 'center', gap: '14px',
                            }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: theme.radius.md,
                                    background: 'rgba(255,255,255,0.15)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                }}>
                                    <Icon size={24} color="#fff" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>{cert.label}</div>
                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', marginTop: '3px' }}>{cert.desc}</div>
                                </div>
                            </div>

                            <div style={{ padding: '22px 24px' }}>
                                {/* Preview bullet list */}
                                <div style={{ marginBottom: '20px' }}>
                                    <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.text.label, marginBottom: '10px' }}>
                                        Certificate includes
                                    </div>
                                    {cert.preview.map((p, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                            <CheckCircle size={12} color={cert.color} />
                                            <span style={{ fontSize: '12px', color: theme.text.secondary }}>{p}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Internship: show criteria chips */}
                                {cert.type === 'internship' && careerData?.criteria && (
                                    <div style={{ marginBottom: '20px' }}>
                                        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.text.label, marginBottom: '10px' }}>
                                            Eligibility criteria
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            {INTERNSHIP_CRITERIA.map((c, i) => (
                                                <CriteriaChip key={i} label={c.label} met={!!c.met} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Completion: attendance */}
                                {cert.type === 'completion' && careerData?.criteria && (
                                    <div style={{ marginBottom: '20px' }}>
                                        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.text.label, marginBottom: '10px' }}>
                                            Eligibility criteria
                                        </div>
                                        <CriteriaChip
                                            label={`Attendance: ${criteria.attendance?.value ?? '—'}% (need ≥ 75%)`}
                                            met={isEligible}
                                        />
                                    </div>
                                )}

                                {/* Existing certificate info */}
                                {existing && (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        padding: '10px 14px', borderRadius: theme.radius.sm, marginBottom: '14px',
                                        background: 'rgba(72,187,120,0.08)', border: '1px solid rgba(72,187,120,0.25)',
                                    }}>
                                        <CheckCircle size={14} color="#48bb78" />
                                        <span style={{ fontSize: '12px', color: '#48bb78', fontWeight: 700 }}>
                                            Generated on {fmtDate(existing.generated_at)}
                                        </span>
                                    </div>
                                )}

                                {/* Action buttons */}
                                {existing ? (
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={() => handleDownload(existing.id, cert.type)}
                                            style={{
                                                flex: 1, padding: '11px', borderRadius: theme.radius.sm,
                                                background: cert.color, color: '#fff', border: 'none',
                                                cursor: 'pointer', fontSize: '13px', fontWeight: 700,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                            }}>
                                            <Download size={15} /> Download Certificate
                                        </button>
                                        <button
                                            onClick={() => handleGenerate(cert.type)}
                                            disabled={isGenerating}
                                            title="Regenerate"
                                            style={{
                                                padding: '11px 14px', borderRadius: theme.radius.sm,
                                                background: 'transparent', color: theme.text.muted,
                                                border: `1px solid ${theme.border.subtle}`,
                                                cursor: 'pointer', display: 'flex', alignItems: 'center',
                                            }}>
                                            <RefreshCw size={14} className={isGenerating ? 'animate-spin' : ''} />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => isEligible && handleGenerate(cert.type)}
                                        disabled={!isEligible || isGenerating}
                                        style={{
                                            width: '100%', padding: '12px', borderRadius: theme.radius.sm,
                                            fontSize: '13px', fontWeight: 700,
                                            cursor: isEligible ? 'pointer' : 'not-allowed',
                                            background: isEligible ? cert.color : 'transparent',
                                            color: isEligible ? '#fff' : theme.text.muted,
                                            border: `1px solid ${isEligible ? cert.color : theme.border.subtle}`,
                                            opacity: isGenerating ? 0.6 : 1,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        }}>
                                        <FileText size={15} />
                                        {isGenerating ? 'Generating…' : isEligible ? 'Generate Certificate' : 'Not Yet Eligible'}
                                    </button>
                                )}
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Info note */}
            <div style={{
                padding: '14px 18px', borderRadius: theme.radius.md,
                background: 'rgba(255,255,255,0.03)', border: `1px solid ${theme.border.subtle}`,
                fontSize: '12px', color: theme.text.muted, lineHeight: 1.7,
            }}>
                💡 Certificates open as an HTML page in your browser. Use <strong style={{ color: theme.text.secondary }}>File → Print → Save as PDF</strong> to save a permanent PDF copy.
                The Download button saves the HTML file which you can open anytime.
            </div>

            <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
    );
};

export default StudentCertificates;
