import { useState, useEffect } from 'react';
import { studentAPI } from '../../services/api';
import theme from './theme';
import {
    PageHeader, Card, EmptyState, LoadingSpinner,
    ActionButton, FormField, inputStyle,
} from './StudentComponents';
import { Star, ChevronRight, ArrowLeft, Send, CheckCircle } from 'lucide-react';

export const StudentFeedback = () => {
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeForm, setActiveForm] = useState(null);
    const [responses, setResponses] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        const fetchForms = async () => {
            try {
                const res = await studentAPI.getReleasedFeedback();
                const d = res.data;
                const list = Array.isArray(d) ? d : Array.isArray(d?.forms) ? d.forms : Array.isArray(d?.data) ? d.data : [];
                setForms(list);
            }
            catch { } finally { setLoading(false); }
        };
        fetchForms();
    }, []);

    const handleSubmit = async () => {
        if (!activeForm) return;
        setSubmitting(true);
        try {
            await studentAPI.submitFeedback({
                feedback_form_id: activeForm.id,
                release_id: activeForm.release_id,
                responses,
            });
            setSubmitted(true); setActiveForm(null); setResponses({});
        } catch (err) {
            alert('Error: ' + (err.response?.data?.message || err.message));
        } finally { setSubmitting(false); }
    };

    const renderStarRating = (qid, val) => (
        <div style={{ display: 'flex', gap: '6px' }}>
            {[1, 2, 3, 4, 5].map(star => (
                <button key={star} type="button"
                    onClick={() => setResponses(p => ({ ...p, [qid]: star }))}
                    style={{
                        width: '42px', height: '42px', borderRadius: theme.radius.sm,
                        background: (val || 0) >= star ? `${theme.accent.yellow}20` : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${(val || 0) >= star ? theme.accent.yellow : theme.border.subtle}`,
                        color: (val || 0) >= star ? theme.accent.yellow : theme.text.muted,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '18px', transition: 'all 0.15s',
                    }}
                >
                    ★
                </button>
            ))}
        </div>
    );

    if (loading) return <LoadingSpinner label="Loading feedback forms..." />;

    if (submitted) return (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <div style={{
                maxWidth: '500px', margin: '80px auto', textAlign: 'center',
                background: theme.bg.card, borderRadius: theme.radius.lg, border: `1px solid ${theme.accent.green}30`,
                padding: '48px 32px', boxShadow: theme.shadow.card,
            }}>
                <div style={{
                    width: '72px', height: '72px', borderRadius: theme.radius.lg,
                    background: `${theme.accent.green}15`, margin: '0 auto 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <CheckCircle size={36} color={theme.accent.green} />
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: theme.text.primary, marginBottom: '10px' }}>Feedback Submitted!</h2>
                <p style={{ color: theme.text.muted, fontSize: theme.font.size.sm, marginBottom: '24px', lineHeight: 1.6 }}>
                    Thank you for your valuable input. Your feedback helps us improve.
                </p>
                <ActionButton onClick={() => setSubmitted(false)} variant="secondary">Back to Forms</ActionButton>
            </div>
        </div>
    );

    // ── Active Form View ──
    if (activeForm) {
        const questions = typeof activeForm.questions === 'string' ? JSON.parse(activeForm.questions) : (activeForm.questions || []);
        return (
            <div style={{ animation: 'fadeIn 0.4s ease-out', maxWidth: '720px', margin: '0 auto' }}>
                <button onClick={() => { setActiveForm(null); setResponses({}); }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        background: 'none', border: 'none', color: theme.text.muted,
                        cursor: 'pointer', fontSize: '13px', fontWeight: 600, marginBottom: '20px',
                    }}>
                    <ArrowLeft size={16} /> Back to forms
                </button>

                <Card style={{ marginBottom: '24px', borderTop: `3px solid ${theme.accent.purple}` }}>
                    <div style={{ marginBottom: '4px' }}>
                        <span style={{
                            fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                            color: theme.accent.purple, background: `${theme.accent.purple}12`,
                            padding: '3px 10px', borderRadius: '4px',
                        }}>Feedback Form</span>
                    </div>
                    <h2 style={{ fontSize: '22px', fontWeight: 800, color: theme.text.primary, margin: '12px 0 6px' }}>
                        {activeForm.title}
                    </h2>
                    {activeForm.description && (
                        <p style={{ color: theme.text.muted, fontSize: theme.font.size.sm, lineHeight: 1.6, margin: 0 }}>
                            {activeForm.description}
                        </p>
                    )}
                </Card>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {questions.map((q, idx) => (
                        <Card key={q.id || idx}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
                                <span style={{
                                    width: '28px', height: '28px', borderRadius: '8px',
                                    background: `${theme.accent.blue}12`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '12px', fontWeight: 800, color: theme.accent.blue, flexShrink: 0,
                                }}>
                                    {idx + 1}
                                </span>
                                <div style={{ fontSize: '14px', fontWeight: 600, color: theme.text.primary, paddingTop: '3px' }}>
                                    {q.question || q.label}
                                    {q.required && <span style={{ color: theme.accent.red, marginLeft: '4px' }}>*</span>}
                                </div>
                            </div>

                            {q.type === 'star_rating' && renderStarRating(q.id || idx, responses[q.id || idx])}

                            {q.type === 'text' && (
                                <textarea rows="3" placeholder="Type your answer..."
                                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                                    value={responses[q.id || idx] || ''}
                                    onChange={(e) => setResponses(p => ({ ...p, [q.id || idx]: e.target.value }))}
                                />
                            )}

                            {q.type === 'radio' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {(q.options || []).map((opt, oi) => {
                                        const sel = responses[q.id || idx] === opt;
                                        return (
                                            <button key={oi} onClick={() => setResponses(p => ({ ...p, [q.id || idx]: opt }))}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '10px',
                                                    padding: '12px 16px', borderRadius: theme.radius.sm,
                                                    background: sel ? `${theme.accent.blue}12` : theme.bg.input,
                                                    border: `1px solid ${sel ? theme.accent.blue : theme.border.subtle}`,
                                                    cursor: 'pointer', textAlign: 'left', color: sel ? theme.accent.blue : theme.text.secondary,
                                                    fontSize: '13px', fontWeight: sel ? 700 : 500, transition: 'all 0.15s',
                                                }}>
                                                <span style={{
                                                    width: '16px', height: '16px', borderRadius: '50%',
                                                    border: `2px solid ${sel ? theme.accent.blue : theme.border.light}`,
                                                    background: sel ? theme.accent.blue : 'transparent',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                }}>
                                                    {sel && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />}
                                                </span>
                                                {opt}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {q.type === 'checkbox' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {(q.options || []).map((opt, oi) => {
                                        const vals = responses[q.id || idx] || [];
                                        const checked = vals.includes(opt);
                                        return (
                                            <button key={oi}
                                                onClick={() => setResponses(p => ({
                                                    ...p,
                                                    [q.id || idx]: checked ? vals.filter(v => v !== opt) : [...vals, opt],
                                                }))}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '10px',
                                                    padding: '12px 16px', borderRadius: theme.radius.sm,
                                                    background: checked ? `${theme.accent.blue}12` : theme.bg.input,
                                                    border: `1px solid ${checked ? theme.accent.blue : theme.border.subtle}`,
                                                    cursor: 'pointer', textAlign: 'left',
                                                    color: checked ? theme.accent.blue : theme.text.secondary,
                                                    fontSize: '13px', fontWeight: checked ? 700 : 500, transition: 'all 0.15s',
                                                }}>
                                                <span style={{
                                                    width: '16px', height: '16px', borderRadius: '4px',
                                                    border: `2px solid ${checked ? theme.accent.blue : theme.border.light}`,
                                                    background: checked ? theme.accent.blue : 'transparent',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                    fontSize: '10px', color: '#fff',
                                                }}>
                                                    {checked && '✓'}
                                                </span>
                                                {opt}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {q.type === 'dropdown' && (
                                <select style={{ ...inputStyle, cursor: 'pointer' }}
                                    value={responses[q.id || idx] || ''}
                                    onChange={(e) => setResponses(p => ({ ...p, [q.id || idx]: e.target.value }))}>
                                    <option value="">Select an option</option>
                                    {(q.options || []).map((opt, oi) => <option key={oi} value={opt}>{opt}</option>)}
                                </select>
                            )}
                        </Card>
                    ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                    <ActionButton variant="secondary" onClick={() => { setActiveForm(null); setResponses({}); }}>Cancel</ActionButton>
                    <ActionButton onClick={handleSubmit} disabled={submitting} icon={<Send size={14} />}>
                        {submitting ? 'Submitting...' : 'Submit Feedback'}
                    </ActionButton>
                </div>
                <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
            </div>
        );
    }

    // ── Forms List ──
    return (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <PageHeader
                title="Feedback"
                subtitle="Share your experience to help us improve"
                icon={<Star size={24} />}
                accentColor={theme.accent.purple}
            />

            {forms.length === 0 ? (
                <EmptyState
                    icon={<Star size={32} />}
                    title="No feedback forms available"
                    message="Check back later — your trainers will release feedback forms for you."
                />
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                    {forms.map(form => (
                        <Card key={form.id || form.release_id} hoverable noPadding>
                            <div style={{ height: '3px', background: `linear-gradient(90deg, ${theme.accent.purple}, ${theme.accent.blue})` }} />
                            <div style={{ padding: '22px 24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <div style={{
                                        width: '42px', height: '42px', borderRadius: theme.radius.sm,
                                        background: `${theme.accent.purple}15`, display: 'flex',
                                        alignItems: 'center', justifyContent: 'center', color: theme.accent.purple,
                                    }}>
                                        <Star size={20} />
                                    </div>
                                    {form.already_submitted ? (
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                                            padding: '4px 12px', borderRadius: theme.radius.full,
                                            fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                                            background: `${theme.accent.green}15`, color: theme.accent.green,
                                        }}>
                                            <CheckCircle size={12} /> Completed
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

                                <h3 style={{ fontSize: '16px', fontWeight: 700, color: theme.text.primary, marginBottom: '6px' }}>
                                    {form.title}
                                </h3>
                                {form.description && (
                                    <p style={{ fontSize: '13px', color: theme.text.muted, lineHeight: 1.5, marginBottom: '14px' }}>
                                        {form.description}
                                    </p>
                                )}
                                {form.trainer_name && (
                                    <div style={{ fontSize: '11px', color: theme.text.muted, marginBottom: '16px' }}>
                                        Released by <span style={{ color: theme.text.secondary, fontWeight: 600 }}>{form.trainer_name}</span>
                                    </div>
                                )}

                                {!form.already_submitted && (
                                    <ActionButton onClick={() => setActiveForm(form)} icon={<ChevronRight size={14} />}
                                        style={{ width: '100%', justifyContent: 'center' }}>
                                        Fill Feedback
                                    </ActionButton>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
            <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
    );
};

export default StudentFeedback;
