import { useState, useEffect } from 'react';
import { superAdminAPI } from '../../services/api';
import { Calendar, ChevronDown, ChevronRight, FileText, CheckCircle, Clock, BookOpen } from 'lucide-react';

export const SATrainersKRA = () => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [trainers, setTrainers] = useState([]);
    const [kras, setKras] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [otherWorks, setOtherWorks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expandedTrainer, setExpandedTrainer] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await superAdminAPI.getDailyKRA(date);
            setTrainers(res.data.trainers);
            setKras(res.data.kras);
            setTasks(res.data.tasks);
            setOtherWorks(res.data.otherWorks || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [date]);

    const getTrainerData = (trainerId) => ({
        kras: kras.filter(k => k.trainer_id === trainerId),
        tasks: tasks.filter(t => t.trainer_id === trainerId),
        otherWorks: otherWorks.filter(w => w.trainer_id === trainerId)
    });

    const toggleExpand = (id) => {
        setExpandedTrainer(expandedTrainer === id ? null : id);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 700, background: 'linear-gradient(to right, var(--text-main), var(--primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Trainers KRA Daily Report
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>Daily overview of classes, tasks, and additional activities for all active trainers.</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-card)', padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <Calendar size={18} color="var(--primary)" />
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Select Date:</span>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        style={{ padding: '6px 12px', borderRadius: '6px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none' }}
                    />
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}><div className="spinner" /></div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {trainers.length === 0 ? (
                        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                            No active trainers found.
                        </div>
                    ) : (
                        trainers.map(trainer => {
                            const data = getTrainerData(trainer.id);
                            const totalItems = data.kras.length + data.tasks.length + data.otherWorks.length;
                            const isExpanded = expandedTrainer === trainer.id;

                            return (
                                <div key={trainer.id} style={{ borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', overflow: 'hidden' }}>

                                    {/* Header / Accordion Toggle */}
                                    <div
                                        onClick={() => toggleExpand(trainer.id)}
                                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', cursor: 'pointer', background: isExpanded ? 'var(--primary)05' : 'transparent', transition: 'background 0.2s' }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #15aabf)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 600, fontSize: '1.2rem' }}>
                                                {trainer.first_name[0]}{trainer.last_name[0]}
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>{trainer.first_name} {trainer.last_name}</h3>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{trainer.email}</p>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                {data.kras.length > 0 && <span style={{ background: '#51cf6615', color: '#51cf66', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>{data.kras.length} Classes</span>}
                                                {data.tasks.length > 0 && <span style={{ background: '#ffd43b15', color: '#ffd43b', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>{data.tasks.length} Tasks</span>}
                                                {data.otherWorks.length > 0 && <span style={{ background: '#15aabf15', color: '#15aabf', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>{data.otherWorks.length} Other</span>}
                                                {totalItems === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '4px 0' }}>No activity</span>}
                                            </div>
                                            {isExpanded ? <ChevronDown size={20} color="var(--text-muted)" /> : <ChevronRight size={20} color="var(--text-muted)" />}
                                        </div>
                                    </div>

                                    {/* Expanded Content */}
                                    {isExpanded && (
                                        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', background: 'var(--bg-dark)50' }}>

                                            {/* Column 1: Classes */}
                                            <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: '8px', border: '1px solid #51cf6630' }}>
                                                <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#51cf66', textTransform: 'uppercase', marginBottom: '1rem' }}>
                                                    <BookOpen size={16} /> Classes Taken KRA
                                                </h4>
                                                {data.kras.length === 0 ? (
                                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No class KRA logged.</p>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                        {data.kras.map(k => (
                                                            <div key={k.id} style={{ background: 'var(--bg-dark)', padding: '10px', borderRadius: '6px', borderLeft: '3px solid #51cf66' }}>
                                                                <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>{k.batch_name} - {k.course_name}</p>
                                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Topic: {k.topics_covered}</p>
                                                                {k.notes && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Notes: {k.notes}</p>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Column 2: Tasks */}
                                            <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: '8px', border: '1px solid #ffd43b30' }}>
                                                <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#ffd43b', textTransform: 'uppercase', marginBottom: '1rem' }}>
                                                    <CheckCircle size={16} /> Task Updates
                                                </h4>
                                                {data.tasks.length === 0 ? (
                                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No task updates.</p>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                        {data.tasks.map(t => (
                                                            <div key={t.id} style={{ background: 'var(--bg-dark)', padding: '10px', borderRadius: '6px', borderLeft: '3px solid #ffd43b' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                                                    <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t.title}</p>
                                                                    <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: '#ffd43b20', color: '#ffd43b', textTransform: 'uppercase', fontWeight: 600 }}>{t.status}</span>
                                                                </div>
                                                                {t.review_notes && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>"{t.review_notes}"</p>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Column 3: Other Works */}
                                            <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: '8px', border: '1px solid #15aabf30' }}>
                                                <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#15aabf', textTransform: 'uppercase', marginBottom: '1rem' }}>
                                                    <Clock size={16} /> Other Works
                                                </h4>
                                                {data.otherWorks.length === 0 ? (
                                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No other works logged.</p>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                        {data.otherWorks.map(w => (
                                                            <div key={w.id} style={{ background: 'var(--bg-dark)', padding: '10px', borderRadius: '6px', borderLeft: '3px solid #15aabf' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                                                    <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{w.title}</p>
                                                                    <span style={{ fontSize: '0.75rem', color: '#15aabf', fontWeight: 600 }}>{w.time_spent || 'N/A'}</span>
                                                                </div>
                                                                {w.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{w.description}</p>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};
