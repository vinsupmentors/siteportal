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
        requiresPhoto: true,
        preview: [
            'Issued by Vinsup Skill Academy',
            'Student name highlighted in navy blue',
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
        requiresPhoto: false,
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
    const [msgType, setMsgType] = useState('info'); // 'success' | 'error' | 'info'
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [photoUploading, setPhotoUploading] = useState(false);

    const showMsg = (text, type = 'info') => { setMsg(text); setMsgType(type); };

    const fetchData = async () => {
        try {
            const [cRes, certsRes, photoRes] = await Promise.all([
                studentAPI.getInternshipEligibility().catch(() => ({ data: null })),
                studentAPI.getCertificates().catch(() => ({ data: { certificates: [] } })),
                studentAPI.getProfilePhoto().catch(() => ({ data: { photo: null } })),
            ]);
            setCareerData(cRes.data || null);
            setCertificates(certsRes.data?.certificates || []);
            if (photoRes.data?.photo) setProfilePhoto(photoRes.data.photo);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handlePhotoChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { showMsg('Please upload an image file', 'error'); return; }
        const reader = new FileReader();
        reader.onload = async (ev) => {
            const dataUrl = ev.target.result;
            setProfilePhoto(dataUrl);
            setPhotoUploading(true);
            showMsg('');
            try {
                await studentAPI.uploadProfilePhoto(dataUrl);
                showMsg('Photo saved! It will appear on your certificate.', 'success');
            } catch {
                showMsg('Photo upload failed. Please try again.', 'error');
            } finally {
                setPhotoUploading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleGenerate = async (cert_type) => {
        // Completion certificate requires a photo
        const certCfg = CERT_CONFIG.find(c => c.type === cert_type);
        if (certCfg?.requiresPhoto && !profilePhoto) {
            showMsg('Please upload your photo above before generating the Completion Certificate.', 'error');
            return;
        }

        setGenerating(cert_type);
        showMsg('');
        try {
            const res = await studentAPI.generateCertificate({ cert_type });
            showMsg('Certificate generated! Opening preview…', 'success');
            // Open HTML in new window — user uses "Save as PDF" button inside the page
            const w = window.open('', '_blank');
            if (w) {
                w.document.write(res.data.html);
                w.document.close();
            }
            await fetchData();
        } catch (err) {
            showMsg(err.response?.data?.message || 'Failed to generate certificate', 'error');
        } finally {
            setGenerating(null);
        }
    };

    const handleDownload = async (certId) => {
        try {
            // Fetch the stored HTML and open it in a new window for printing as PDF
            const res = await studentAPI.downloadCertificate(certId);
            const blob = new Blob([res.data], { type: 'text/html' });
            const htmlText = await blob.text();
            const w = window.open('', '_blank');
            if (w) {
                w.document.write(htmlText);
                w.document.close();
                // Give images time to load then prompt print
                w.onload = () => setTimeout(() => w.print(), 600);
            }
        } catch {
            showMsg('Could not open certificate. Please try again.', 'error');
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

    // Resolve status message colour
    const msgBg = msgType === 'error'
        ? 'rgba(245,101,101,0.10)' : msgType === 'success'
        ? 'rgba(72,187,120,0.10)' : 'rgba(99,179,237,0.10)';
    const msgBorder = msgType === 'error' ? '#fc818140' : msgType === 'success' ? '#48bb7840' : '#63b3ed40';
    const msgColor = msgType === 'error' ? '#fc8181' : msgType === 'success' ? '#48bb78' : '#63b3ed';

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
                    background: msgBg, border: `1px solid ${msgBorder}`,
                    color: msgColor, fontSize: '13px', fontWeight: 600,
                }}>
                    {msg}
                </div>
            )}

            {/* Photo Upload Card — required for Completion certificate */}
            <Card style={{ marginBottom: '24px', padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    {/* Preview circle */}
                    <div style={{
                        width: '84px', height: '84px', borderRadius: '50%', flexShrink: 0,
                        background: '#1e2a3a',
                        border: profilePhoto ? '3px solid #48bb78' : '3px dashed #2461a8',
                        overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        {profilePhoto
                            ? <img src={profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <Camera size={28} color="#4a6fa5" />}
                    </div>

                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: '#e2e8f0' }}>
                                Your Photo for Completion Certificate
                            </span>
                            {/* Required badge */}
                            <span style={{
                                padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 700,
                                background: 'rgba(245,101,101,0.12)', color: '#fc8181', border: '1px solid #fc818140',
                            }}>Required</span>
                        </div>
                        <div style={{ fontSize: '12px', color: theme.text.muted, marginBottom: '12px' }}>
                            Your photo will be placed inside the circular badge on the certificate. Upload a clear, passport-style photo.
                        </div>
                        <label style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            padding: '8px 16px', borderRadius: theme.radius.sm, cursor: 'pointer',
                            background: profilePhoto ? '#22543d' : '#2461a8',
                            color: '#fff', fontSize: '12px', fontWeight: 700,
                            opacity: photoUploading ? 0.6 : 1,
                            transition: 'background 0.2s',
                        }}>
                            <Upload size={13} />
                            {photoUploading ? 'Uploading…' : profilePhoto ? '✓ Change Photo' : 'Upload Photo'}
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
                    // Completion cert is blocked without a photo
                    const photoMissing = cert.requiresPhoto && !profilePhoto;

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

                                {/* Photo warning for completion cert */}
                                {photoMissing && (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        padding: '9px 13px', borderRadius: theme.radius.sm, marginBottom: '14px',
                                        background: 'rgba(245,101,101,0.08)', border: '1px solid rgba(245,101,101,0.25)',
                                    }}>
                                        <AlertCircle size={14} color="#fc8181" />
                                        <span style={{ fontSize: '12px', color: '#fc8181', fontWeight: 600 }}>
                                            Upload your photo above to unlock this certificate
                                        </span>
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
                                            onClick={() => handleDownload(existing.id)}
                                            style={{
                                                flex: 1, padding: '11px', borderRadius: theme.radius.sm,
                                                background: cert.color, color: '#fff', border: 'none',
                                                cursor: 'pointer', fontSize: '13px', fontWeight: 700,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                            }}>
                                            <Download size={15} /> Open &amp; Save as PDF
                                        </button>
                                        <button
                                            onClick={() => handleGenerate(cert.type)}
                                            disabled={isGenerating || photoMissing}
                                            title="Regenerate certificate"
                                            style={{
                                                padding: '11px 14px', borderRadius: theme.radius.sm,
                                                background: 'transparent', color: theme.text.muted,
                                                border: `1px solid ${theme.border.subtle}`,
                                                cursor: isGenerating || photoMissing ? 'not-allowed' : 'pointer',
                                                display: 'flex', alignItems: 'center',
                                                opacity: isGenerating || photoMissing ? 0.5 : 1,
                                            }}>
                                            <RefreshCw size={14} className={isGenerating ? 'animate-spin' : ''} />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => !photoMissing && isEligible && handleGenerate(cert.type)}
                                        disabled={!isEligible || isGenerating || photoMissing}
                                        style={{
                                            width: '100%', padding: '12px', borderRadius: theme.radius.sm,
                                            fontSize: '13px', fontWeight: 700,
                                            cursor: (!isEligible || photoMissing) ? 'not-allowed' : 'pointer',
                                            background: (!isEligible || photoMissing) ? 'transparent' : cert.color,
                                            color: (!isEligible || photoMissing) ? theme.text.muted : '#fff',
                                            border: `1px solid ${(!isEligible || photoMissing) ? theme.border.subtle : cert.color}`,
                                            opacity: isGenerating ? 0.6 : 1,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        }}>
                                        <FileText size={15} />
                                        {isGenerating ? 'Generating…'
                                            : photoMissing ? 'Upload Photo First'
                                            : isEligible ? 'Generate Certificate'
                                            : 'Not Yet Eligible'}
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
                💡 Certificates open in a new tab with a <strong style={{ color: theme.text.secondary }}>Save as PDF</strong> button at the top.
                Click it (or press <strong style={{ color: theme.text.secondary }}>Ctrl + P</strong>) and choose <em>"Save as PDF"</em> as the destination to download a permanent PDF copy.
            </div>

            <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
    );
};

export default StudentCertificates;
