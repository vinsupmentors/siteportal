import { useState, useEffect } from 'react';
import { studentAPI } from '../../services/api';
import theme from './theme';
import {
    PageHeader, Card, LoadingSpinner, ActionButton, FormField, inputStyle,
} from './StudentComponents';
import {
    User, Briefcase, Link as LinkIcon, Star, Image as ImageIcon,
    Plus, Trash2, CheckCircle, ChevronRight, ChevronLeft, Send,
    ExternalLink, Clock, Sparkles, Smartphone, Monitor, QrCode as QrIcon
} from 'lucide-react';

const STEPS = [
    { id: 1, name: 'Identity', icon: User },
    { id: 2, name: 'Contact', icon: LinkIcon },
    { id: 3, name: 'Projects', icon: Briefcase },
    { id: 4, name: 'Skills', icon: Star },
];

const ROLES = ['Data Analyst', 'Frontend Developer', 'Digital Marketer', 'UI/UX Designer', 'Backend Developer', 'Full Stack Developer'];

const defaultFormData = {
    personal: { name: '', role: 'Data Analyst', email: '', phone: '', address: '', about_text: '', profile_img: '', about_img: '' },
    links: { linkedin: '', indeed: '', naukri: '' },
    projects: [{ title: '', desc: '', link: '' }],
    skills: [{ category: 'Languages', items: '' }, { category: 'Tools', items: '' }],
};

export const StudentPortfolioForm = () => {
    const [step, setStep] = useState(1);
    const [previewMode, setPreviewMode] = useState('desktop');
    const [existingPortfolio, setExistingPortfolio] = useState(null);
    const [formData, setFormData] = useState(defaultFormData);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await studentAPI.getPortfolioRequest();
                if (res.data.portfolio) setExistingPortfolio(res.data.portfolio);
            } catch { } finally { setLoading(false); }
        };
        fetchStatus();
    }, [submitted]);

    const handleInput = (section, field, value) =>
        setFormData(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));

    const handleImageUpload = (e, section, field) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => handleInput(section, field, ev.target.result);
        reader.readAsDataURL(file);
    };

    const addProject = () => {
        if (formData.projects.length < 10)
            setFormData(prev => ({ ...prev, projects: [...prev.projects, { title: '', desc: '', link: '' }] }));
    };
    const removeProject = (i) => setFormData(prev => ({ ...prev, projects: prev.projects.filter((_, idx) => idx !== i) }));
    const updateProject = (i, field, value) => {
        const updated = [...formData.projects]; updated[i][field] = value;
        setFormData(prev => ({ ...prev, projects: updated }));
    };
    const addSkill = () => setFormData(prev => ({ ...prev, skills: [...prev.skills, { category: '', items: '' }] }));
    const removeSkill = (i) => setFormData(prev => ({ ...prev, skills: prev.skills.filter((_, idx) => idx !== i) }));
    const updateSkill = (i, field, value) => {
        const updated = [...formData.skills]; updated[i][field] = value;
        setFormData(prev => ({ ...prev, skills: updated }));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await studentAPI.submitPortfolioRequest(formData);
            setSubmitted(true);
        } catch (err) {
            alert('Error submitting portfolio: ' + (err.response?.data?.message || err.message));
        } finally { setSubmitting(false); }
    };

    if (loading) return <LoadingSpinner label="Loading portfolio..." />;

    // ── Approved State ──
    if (existingPortfolio?.status === 'approved') {
        return (
            <div style={{ animation: 'fadeIn 0.4s ease-out', maxWidth: '680px', margin: '0 auto', paddingTop: '32px' }}>
                <Card style={{ textAlign: 'center', padding: '48px 32px', borderTop: `3px solid ${theme.accent.green}` }}>
                    <div style={{
                        width: '72px', height: '72px', borderRadius: theme.radius.lg,
                        background: `${theme.accent.green}15`, margin: '0 auto 20px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <CheckCircle size={36} color={theme.accent.green} />
                    </div>
                    <h2 style={{ fontSize: '26px', fontWeight: 800, color: theme.text.primary, marginBottom: '8px' }}>Your Portfolio is Live!</h2>
                    <p style={{ color: theme.text.muted, fontSize: '14px', maxWidth: '420px', margin: '0 auto 24px', lineHeight: 1.6 }}>
                        Your professional identity has been deployed. Recruiters can now view your complete journey.
                    </p>

                    <div style={{
                        background: theme.bg.input, border: `1px solid ${theme.border.subtle}`,
                        borderRadius: theme.radius.lg, padding: '24px', marginBottom: '24px',
                        display: 'flex', alignItems: 'center', gap: '24px', textAlign: 'left',
                    }}>
                        {existingPortfolio.qr_code && (
                            <div style={{
                                background: '#fff', padding: '10px', borderRadius: theme.radius.md, flexShrink: 0,
                            }}>
                                <img src={existingPortfolio.qr_code} style={{ width: '120px', height: '120px' }} alt="QR" />
                            </div>
                        )}
                        <div>
                            <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.text.label, marginBottom: '8px' }}>
                                Live Deployment URL
                            </div>
                            <a href={existingPortfolio.hosted_url} target="_blank" rel="noreferrer"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    color: theme.accent.blue, fontSize: '15px', fontWeight: 700, textDecoration: 'none',
                                }}>
                                <ExternalLink size={16} /> {existingPortfolio.hosted_url}
                            </a>
                            <p style={{ fontSize: '12px', color: theme.text.muted, marginTop: '8px', lineHeight: 1.5 }}>
                                This URL and QR code are permanent identifiers for your professional profile.
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <ActionButton onClick={() => window.open(existingPortfolio.hosted_url, '_blank')}
                            icon={<ExternalLink size={14} />} style={{ flex: 1, justifyContent: 'center' }}>
                            Launch Portfolio
                        </ActionButton>
                        <ActionButton variant="secondary"
                            onClick={() => {
                                const details = typeof existingPortfolio.details === 'string'
                                    ? JSON.parse(existingPortfolio.details) : existingPortfolio.details;
                                if (details?.personal) setFormData(details);
                                setExistingPortfolio(null); setStep(1);
                            }}
                            style={{ flex: 1, justifyContent: 'center' }}>
                            Update Details
                        </ActionButton>
                    </div>
                </Card>

                <div style={{
                    marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px',
                    background: `${theme.accent.yellow}08`, border: `1px solid ${theme.accent.yellow}20`,
                    borderRadius: theme.radius.lg, padding: '16px 20px',
                }}>
                    <Sparkles size={20} color={theme.accent.yellow} style={{ flexShrink: 0 }} />
                    <p style={{ fontSize: '12px', color: theme.accent.yellow, fontWeight: 600, margin: 0, lineHeight: 1.5 }}>
                        Adding new certifications or projects? Update your details and we'll re-deploy while keeping your QR code and link active.
                    </p>
                </div>
                <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
            </div>
        );
    }

    // ── Pending State ──
    if (existingPortfolio?.status === 'pending' && !submitted) {
        return (
            <div style={{ animation: 'fadeIn 0.4s ease-out', maxWidth: '580px', margin: '0 auto', paddingTop: '48px' }}>
                <Card style={{ textAlign: 'center', padding: '48px 32px', borderTop: `3px solid ${theme.accent.yellow}` }}>
                    <div style={{
                        width: '72px', height: '72px', borderRadius: theme.radius.lg,
                        background: `${theme.accent.yellow}15`, margin: '0 auto 20px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Clock size={36} color={theme.accent.yellow} />
                    </div>
                    <h2 style={{ fontSize: '26px', fontWeight: 800, color: theme.text.primary, marginBottom: '8px' }}>Refining Your Brand</h2>
                    <p style={{ color: theme.text.muted, fontSize: '14px', maxWidth: '400px', margin: '0 auto 24px', lineHeight: 1.6 }}>
                        We've received your request! Our system is generating your high-fidelity portfolio and preparing secure deployment.
                    </p>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        padding: '10px 20px', borderRadius: theme.radius.full,
                        background: `${theme.accent.yellow}12`, border: `1px solid ${theme.accent.yellow}25`,
                        color: theme.accent.yellow, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                    }}>
                        <Sparkles size={14} /> Est. Readiness: 24-48 Business Hours
                    </div>
                </Card>
                <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
            </div>
        );
    }

    // ── Submitted State ──
    if (submitted) {
        return (
            <div style={{ animation: 'fadeIn 0.4s ease-out', maxWidth: '580px', margin: '0 auto', paddingTop: '48px' }}>
                <Card style={{ textAlign: 'center', padding: '48px 32px', borderTop: `3px solid ${theme.accent.blue}` }}>
                    <div style={{
                        width: '72px', height: '72px', borderRadius: theme.radius.lg,
                        background: `${theme.accent.blue}15`, margin: '0 auto 20px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <CheckCircle size={36} color={theme.accent.blue} />
                    </div>
                    <h2 style={{ fontSize: '26px', fontWeight: 800, color: theme.text.primary, marginBottom: '8px' }}>Submission Complete!</h2>
                    <p style={{ color: theme.text.muted, fontSize: '14px', maxWidth: '400px', margin: '0 auto 24px', lineHeight: 1.6 }}>
                        Your career details have been securely sent. We'll notify you here as soon as your professional portal goes live.
                    </p>
                    <ActionButton variant="secondary" onClick={() => setSubmitted(false)}>Back to Hub</ActionButton>
                </Card>
                <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
            </div>
        );
    }

    // ── Main Wizard Form ──
    return (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <PageHeader
                title="Portfolio Builder"
                subtitle="Build your professional identity in 4 steps"
                icon={<Briefcase size={24} />}
                accentColor={theme.accent.blue}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'start' }}>
                {/* Form Side */}
                <Card noPadding>
                    {/* Step Tracker */}
                    <div style={{ padding: '20px 24px', borderBottom: `1px solid ${theme.border.subtle}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                            <div style={{
                                position: 'absolute', top: '18px', left: '24px', right: '24px',
                                height: '2px', background: 'rgba(255,255,255,0.06)', zIndex: 0,
                            }}>
                                <div style={{
                                    height: '100%', background: theme.accent.blue,
                                    width: `${((step - 1) / (STEPS.length - 1)) * 100}%`,
                                    transition: 'width 0.4s',
                                }} />
                            </div>
                            {STEPS.map(s => {
                                const Icon = s.icon;
                                const active = step >= s.id;
                                const current = step === s.id;
                                return (
                                    <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 1 }}>
                                        <div style={{
                                            width: '38px', height: '38px', borderRadius: '50%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            border: `2px solid ${active ? theme.accent.blue : theme.border.subtle}`,
                                            background: active ? `${theme.accent.blue}20` : theme.bg.input,
                                            color: active ? theme.accent.blue : theme.text.muted,
                                            transition: 'all 0.3s',
                                        }}>
                                            <Icon size={16} />
                                        </div>
                                        <span style={{
                                            fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                                            color: current ? theme.accent.blue : theme.text.muted,
                                        }}>
                                            {s.name}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Step Content */}
                    <div style={{ padding: '24px', minHeight: '420px' }}>
                        {step === 1 && (
                            <div>
                                <h3 style={{ fontSize: '20px', fontWeight: 800, color: theme.text.primary, marginBottom: '4px' }}>Personal Identity</h3>
                                <p style={{ color: theme.text.muted, fontSize: '13px', marginBottom: '20px' }}>How should the world see you?</p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                    <FormField label="Professional Name">
                                        <input style={inputStyle} placeholder="e.g. John Doe" value={formData.personal.name}
                                            onChange={e => handleInput('personal', 'name', e.target.value)} />
                                    </FormField>
                                    <FormField label="Core Role">
                                        <select style={{ ...inputStyle, cursor: 'pointer' }} value={formData.personal.role}
                                            onChange={e => handleInput('personal', 'role', e.target.value)}>
                                            {ROLES.map(r => <option key={r}>{r}</option>)}
                                        </select>
                                    </FormField>
                                    <FormField label="Profile Avatar">
                                        <label style={{
                                            display: 'flex', alignItems: 'center', gap: '10px', padding: '12px',
                                            background: theme.bg.input, border: `2px dashed ${theme.border.light}`,
                                            borderRadius: theme.radius.md, cursor: 'pointer',
                                        }}>
                                            <div style={{
                                                width: '38px', height: '38px', borderRadius: theme.radius.sm,
                                                background: 'rgba(255,255,255,0.06)', border: `1px solid ${theme.border.subtle}`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                                            }}>
                                                {formData.personal.profile_img
                                                    ? <img src={formData.personal.profile_img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                                    : <ImageIcon size={16} color={theme.text.muted} />}
                                            </div>
                                            <span style={{ fontSize: '12px', fontWeight: 600, color: theme.text.muted }}>
                                                {formData.personal.profile_img ? 'Change Photo' : 'Upload Headshot'}
                                            </span>
                                            <input type="file" style={{ display: 'none' }} accept="image/*"
                                                onChange={e => handleImageUpload(e, 'personal', 'profile_img')} />
                                        </label>
                                    </FormField>
                                    <FormField label="Cover Image">
                                        <label style={{
                                            display: 'flex', alignItems: 'center', gap: '10px', padding: '12px',
                                            background: theme.bg.input, border: `2px dashed ${theme.border.light}`,
                                            borderRadius: theme.radius.md, cursor: 'pointer',
                                        }}>
                                            <div style={{
                                                width: '38px', height: '38px', borderRadius: theme.radius.sm,
                                                background: 'rgba(255,255,255,0.06)', border: `1px solid ${theme.border.subtle}`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                                            }}>
                                                {formData.personal.about_img
                                                    ? <img src={formData.personal.about_img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                                    : <Plus size={16} color={theme.text.muted} />}
                                            </div>
                                            <span style={{ fontSize: '12px', fontWeight: 600, color: theme.text.muted }}>
                                                {formData.personal.about_img ? 'Change Cover' : 'Portfolio Cover'}
                                            </span>
                                            <input type="file" style={{ display: 'none' }} accept="image/*"
                                                onChange={e => handleImageUpload(e, 'personal', 'about_img')} />
                                        </label>
                                    </FormField>
                                </div>
                                <FormField label="Professional Philosophy">
                                    <textarea rows={4} placeholder="Write a summary that speaks to recruiters..."
                                        style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }}
                                        value={formData.personal.about_text}
                                        onChange={e => handleInput('personal', 'about_text', e.target.value)} />
                                </FormField>
                            </div>
                        )}

                        {step === 2 && (
                            <div>
                                <h3 style={{ fontSize: '20px', fontWeight: 800, color: theme.text.primary, marginBottom: '4px' }}>Connectivity</h3>
                                <p style={{ color: theme.text.muted, fontSize: '13px', marginBottom: '20px' }}>How can recruiters reach you?</p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                    {[
                                        { label: 'Professional Email', field: 'email', section: 'personal', placeholder: 'you@email.com' },
                                        { label: 'Contact Number', field: 'phone', section: 'personal', placeholder: '+91 9876543210' },
                                        { label: 'LinkedIn URL', field: 'linkedin', section: 'links', placeholder: 'linkedin.com/in/you' },
                                        { label: 'Indeed / Other URL', field: 'indeed', section: 'links', placeholder: 'indeed.com/...' },
                                    ].map(({ label, field, section, placeholder }) => (
                                        <FormField key={field} label={label}>
                                            <input style={inputStyle} placeholder={placeholder}
                                                value={formData[section][field]}
                                                onChange={e => handleInput(section, field, e.target.value)} />
                                        </FormField>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
                                    <div>
                                        <h3 style={{ fontSize: '20px', fontWeight: 800, color: theme.text.primary, marginBottom: '4px' }}>Work Showcase</h3>
                                        <p style={{ color: theme.text.muted, fontSize: '13px' }}>Add up to 10 projects.</p>
                                    </div>
                                    <span style={{ fontSize: '20px', fontWeight: 800, color: theme.accent.blue }}>{formData.projects.length}/10</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
                                    {formData.projects.map((proj, idx) => (
                                        <div key={idx} style={{
                                            background: theme.bg.input, padding: '18px', borderRadius: theme.radius.md,
                                            border: `1px solid ${theme.border.subtle}`, position: 'relative',
                                        }}>
                                            <button onClick={() => removeProject(idx)} style={{
                                                position: 'absolute', top: '10px', right: '10px',
                                                background: 'none', border: 'none', color: theme.text.muted, cursor: 'pointer',
                                            }}>
                                                <Trash2 size={14} />
                                            </button>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                                <FormField label="Project Name">
                                                    <input style={inputStyle} placeholder="e.g. Sales Dashboard" value={proj.title}
                                                        onChange={e => updateProject(idx, 'title', e.target.value)} />
                                                </FormField>
                                                <FormField label="Demo Link">
                                                    <input style={inputStyle} placeholder="https://..." value={proj.link}
                                                        onChange={e => updateProject(idx, 'link', e.target.value)} />
                                                </FormField>
                                            </div>
                                            <FormField label="Description">
                                                <textarea rows={2} placeholder="Tools used, impact, results..."
                                                    style={{ ...inputStyle, resize: 'none' }} value={proj.desc}
                                                    onChange={e => updateProject(idx, 'desc', e.target.value)} />
                                            </FormField>
                                        </div>
                                    ))}
                                    {formData.projects.length < 10 && (
                                        <button onClick={addProject} style={{
                                            padding: '20px', border: `2px dashed ${theme.border.light}`,
                                            borderRadius: theme.radius.md, background: 'transparent',
                                            color: theme.text.muted, cursor: 'pointer', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center', gap: '8px',
                                            fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                                        }}>
                                            <Plus size={16} /> Add Project
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div>
                                <h3 style={{ fontSize: '20px', fontWeight: 800, color: theme.text.primary, marginBottom: '4px' }}>Technical Arsenal</h3>
                                <p style={{ color: theme.text.muted, fontSize: '13px', marginBottom: '16px' }}>Categorize your skills by type.</p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}>
                                    {formData.skills.map((skill, idx) => (
                                        <div key={idx} style={{
                                            background: theme.bg.input, padding: '16px', borderRadius: theme.radius.md,
                                            border: `1px solid ${theme.border.subtle}`, position: 'relative',
                                        }}>
                                            <button onClick={() => removeSkill(idx)} style={{
                                                position: 'absolute', top: '8px', right: '8px',
                                                background: 'none', border: 'none', color: theme.text.muted, cursor: 'pointer',
                                            }}>
                                                <Trash2 size={12} />
                                            </button>
                                            <FormField label="Category">
                                                <input style={{ ...inputStyle, color: theme.accent.blue, fontWeight: 700 }}
                                                    placeholder="e.g. Visualization" value={skill.category}
                                                    onChange={e => updateSkill(idx, 'category', e.target.value)} />
                                            </FormField>
                                            <FormField label="Items (comma separated)">
                                                <input style={inputStyle} placeholder="PowerBI, Tableau, Matplotlib"
                                                    value={skill.items} onChange={e => updateSkill(idx, 'items', e.target.value)} />
                                            </FormField>
                                        </div>
                                    ))}
                                    <button onClick={addSkill} style={{
                                        padding: '32px 16px', border: `2px dashed ${theme.border.light}`,
                                        borderRadius: theme.radius.md, background: 'transparent',
                                        color: theme.text.muted, cursor: 'pointer', display: 'flex', flexDirection: 'column',
                                        alignItems: 'center', justifyContent: 'center', gap: '6px',
                                        fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                                    }}>
                                        <Plus size={16} /> New Group
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
                    <div style={{
                        padding: '18px 24px', borderTop: `1px solid ${theme.border.subtle}`,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                        <button onClick={() => setStep(s => s - 1)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none',
                                color: step === 1 ? 'transparent' : theme.text.muted, cursor: step === 1 ? 'default' : 'pointer',
                                fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                                pointerEvents: step === 1 ? 'none' : 'auto',
                            }}>
                            <ChevronLeft size={16} /> Back
                        </button>
                        {step < 4 ? (
                            <ActionButton onClick={() => setStep(s => s + 1)} icon={<ChevronRight size={14} />}>Continue</ActionButton>
                        ) : (
                            <ActionButton onClick={handleSubmit} disabled={submitting} variant="success" icon={<Send size={14} />}>
                                {submitting ? 'Submitting...' : 'Submit Portfolio'}
                            </ActionButton>
                        )}
                    </div>
                </Card>

                {/* Preview Side */}
                <div style={{ position: 'sticky', top: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', padding: '0 4px' }}>
                        <span style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                            letterSpacing: '0.1em', color: theme.text.label,
                        }}>
                            <Sparkles size={14} color={theme.accent.yellow} /> Live Preview
                        </span>
                        <div style={{
                            display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: theme.radius.sm,
                            border: `1px solid ${theme.border.subtle}`, padding: '2px',
                        }}>
                            <button onClick={() => setPreviewMode('mobile')} style={{
                                padding: '5px 8px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                                background: previewMode === 'mobile' ? `${theme.accent.blue}20` : 'transparent',
                                color: previewMode === 'mobile' ? theme.accent.blue : theme.text.muted,
                            }}>
                                <Smartphone size={14} />
                            </button>
                            <button onClick={() => setPreviewMode('desktop')} style={{
                                padding: '5px 8px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                                background: previewMode === 'desktop' ? `${theme.accent.blue}20` : 'transparent',
                                color: previewMode === 'desktop' ? theme.accent.blue : theme.text.muted,
                            }}>
                                <Monitor size={14} />
                            </button>
                        </div>
                    </div>

                    <div style={{
                        margin: previewMode === 'mobile' ? '0 auto' : 0,
                        width: previewMode === 'mobile' ? '280px' : '100%',
                        transition: 'all 0.4s',
                        background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '18px',
                        border: `1px solid ${theme.border.subtle}`,
                    }}>
                        <div style={{
                            background: '#0f172a', borderRadius: '14px', height: '520px', overflowY: 'auto',
                        }}>
                            {/* Browser bar */}
                            <div style={{
                                position: 'sticky', top: 0, background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(8px)',
                                borderBottom: `1px solid ${theme.border.subtle}`, height: '32px',
                                display: 'flex', alignItems: 'center', padding: '0 10px', gap: '6px', zIndex: 1,
                            }}>
                                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ef4444' }} />
                                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#f59e0b' }} />
                                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e' }} />
                                <div style={{
                                    flex: 1, marginLeft: '6px', background: 'rgba(255,255,255,0.06)',
                                    borderRadius: '4px', height: '16px', display: 'flex', alignItems: 'center', padding: '0 8px',
                                }}>
                                    <span style={{ fontSize: '7px', color: theme.text.muted }}>
                                        portfolio.pro/{formData.personal.name?.toLowerCase().replace(/\s+/g, '') || 'your-name'}
                                    </span>
                                </div>
                            </div>

                            {/* Hero */}
                            <div style={{
                                background: 'linear-gradient(135deg, #3b82f6, #6366f1)', padding: '32px 20px',
                                textAlign: 'center', color: '#fff',
                            }}>
                                <div style={{
                                    width: '60px', height: '60px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.2)',
                                    margin: '0 auto 10px', overflow: 'hidden', background: 'rgba(255,255,255,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    {formData.personal.profile_img
                                        ? <img src={formData.personal.profile_img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                        : <span style={{ fontSize: '24px', fontWeight: 800 }}>{formData.personal.name?.[0] || '?'}</span>
                                    }
                                </div>
                                <h2 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 4px', color: '#fff' }}>
                                    {formData.personal.name || 'Your Name'}
                                </h2>
                                <p style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#93c5fd', margin: 0 }}>
                                    {formData.personal.role}
                                </p>
                            </div>

                            {/* Content */}
                            <div style={{ padding: '16px' }}>
                                {formData.personal.about_text && (
                                    <div style={{ marginBottom: '14px' }}>
                                        <p style={{ fontSize: '8px', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', borderBottom: '1px solid rgba(96,165,250,0.2)', paddingBottom: '4px' }}>About</p>
                                        <p style={{ fontSize: '10px', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>{formData.personal.about_text}</p>
                                    </div>
                                )}

                                {formData.projects.some(p => p.title) && (
                                    <div style={{ marginBottom: '14px' }}>
                                        <p style={{ fontSize: '8px', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', borderBottom: '1px solid rgba(96,165,250,0.2)', paddingBottom: '4px' }}>Projects</p>
                                        {formData.projects.filter(p => p.title).map((p, i) => (
                                            <div key={i} style={{
                                                padding: '8px 10px', background: 'rgba(255,255,255,0.03)',
                                                borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '6px',
                                            }}>
                                                <p style={{ fontSize: '10px', fontWeight: 800, color: '#e2e8f0', margin: 0 }}>{p.title}</p>
                                                {p.desc && <p style={{ fontSize: '8px', color: '#64748b', marginTop: '2px', margin: 0 }}>{p.desc}</p>}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {formData.skills.some(s => s.category) && (
                                    <div>
                                        <p style={{ fontSize: '8px', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', borderBottom: '1px solid rgba(96,165,250,0.2)', paddingBottom: '4px' }}>Skills</p>
                                        {formData.skills.filter(s => s.category).map((s, i) => (
                                            <div key={i} style={{ marginBottom: '8px' }}>
                                                <p style={{ fontSize: '9px', fontWeight: 800, color: '#64748b', margin: '0 0 4px' }}>{s.category}</p>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                    {s.items.split(',').filter(Boolean).map((item, j) => (
                                                        <span key={j} style={{
                                                            fontSize: '8px', padding: '2px 8px', borderRadius: '20px',
                                                            background: 'rgba(96,165,250,0.1)', color: '#60a5fa', fontWeight: 700,
                                                        }}>{item.trim()}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div style={{
                        marginTop: '14px', display: 'flex', alignItems: 'center', gap: '10px',
                        background: `${theme.accent.blue}08`, border: `1px solid ${theme.accent.blue}15`,
                        borderRadius: theme.radius.md, padding: '14px 16px',
                    }}>
                        <QrIcon size={18} color={theme.accent.blue} style={{ flexShrink: 0 }} />
                        <div>
                            <p style={{ fontSize: '10px', fontWeight: 700, color: theme.text.primary, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>QR Code Generation</p>
                            <p style={{ fontSize: '10px', color: theme.text.muted, margin: 0 }}>Every portfolio gets a unique QR code optimized for fast scanning.</p>
                        </div>
                    </div>
                </div>
            </div>
            <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
    );
};
