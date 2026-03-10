import { useState, useEffect } from 'react';
import { trainerAPI } from '../../services/api';
import { Link } from 'react-router-dom';
import {
    PageHeader, StatCard, Card, StatusBadge, ActionButton, EmptyState, LoadingSpinner, theme,
} from './TrainerComponents';
import {
    Users, GraduationCap, Clock, Calendar, ExternalLink, CheckCircle, BookOpenCheck,
} from 'lucide-react';

export const TrainerBatches = () => {
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await trainerAPI.getMyCalendar();
                setBatches(res.data.batches || []);
            } catch (err) { console.error(err); } finally { setLoading(false); }
        })();
    }, []);

    if (loading) return <LoadingSpinner label="Loading batches..." />;

    return (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <PageHeader
                title="Your Active Batches"
                subtitle="Manage attendance, curriculum, and students across your assigned batches"
                icon={<Users size={24} />}
                accentColor={theme.accent.purple}
                actions={
                    <div style={{
                        padding: '8px 18px', borderRadius: theme.radius.full,
                        background: `${theme.accent.blue}12`, color: theme.accent.blue,
                        fontSize: '12px', fontWeight: 700,
                    }}>
                        {batches.length} Total
                    </div>
                }
            />

            {batches.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                    {batches.map(batch => (
                        <Card key={batch.id} noPadding style={{ overflow: 'hidden', transition: 'border-color 0.2s' }}>
                            <div style={{ padding: '24px 24px 0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                    <div style={{
                                        width: '48px', height: '48px', borderRadius: theme.radius.md,
                                        background: `${theme.accent.purple}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: theme.accent.purple, fontSize: '20px', fontWeight: 800,
                                    }}>
                                        {batch.batch_name?.charAt(0)}
                                    </div>
                                    <StatusBadge status={batch.status} />
                                </div>

                                <h3 style={{ fontSize: '20px', fontWeight: 800, color: theme.text.primary, margin: '0 0 4px' }}>{batch.batch_name}</h3>
                                <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.text.muted, display: 'flex', alignItems: 'center', gap: '6px', margin: '0 0 20px' }}>
                                    <GraduationCap size={13} /> {batch.course_name}
                                </p>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', fontWeight: 600, color: theme.text.secondary }}>
                                        <div style={{ width: '30px', height: '30px', borderRadius: theme.radius.sm, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Clock size={14} color={theme.text.muted} />
                                        </div>
                                        {batch.timing} · {batch.schedule_type}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', fontWeight: 600, color: theme.text.secondary }}>
                                        <div style={{ width: '30px', height: '30px', borderRadius: theme.radius.sm, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Calendar size={14} color={theme.text.muted} />
                                        </div>
                                        Started {new Date(batch.start_date).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: '16px 24px 24px', borderTop: `1px solid ${theme.border.subtle}`, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                <Link to={`/trainer/attendance/${batch.id}`} style={{ textDecoration: 'none' }}>
                                    <ActionButton icon={<CheckCircle size={12} />} style={{ width: '100%', justifyContent: 'center', padding: '9px 8px', fontSize: '10px' }}>
                                        Attendance
                                    </ActionButton>
                                </Link>
                                <Link to={`/trainer/content-manager?batch=${batch.id}`} style={{ textDecoration: 'none' }}>
                                    <ActionButton variant="secondary" icon={<BookOpenCheck size={12} />} style={{ width: '100%', justifyContent: 'center', padding: '9px 8px', fontSize: '10px' }}>
                                        Content
                                    </ActionButton>
                                </Link>
                                {batch.meeting_link ? (
                                    <a href={batch.meeting_link} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                                        <ActionButton variant="secondary" icon={<ExternalLink size={12} />} style={{ width: '100%', justifyContent: 'center', padding: '9px 8px', fontSize: '10px' }}>
                                            Classroom
                                        </ActionButton>
                                    </a>
                                ) : (
                                    <ActionButton variant="secondary" disabled style={{ width: '100%', justifyContent: 'center', padding: '9px 8px', fontSize: '10px' }}>
                                        No Link
                                    </ActionButton>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <EmptyState icon={<Users size={28} />} title="No Active Batches" subtitle="You are currently not assigned to any live batches." />
            )}
            <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
    );
};
