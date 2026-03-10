import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trainerAPI } from '../../services/api';
import {
    PageHeader, Card, StatCard, ActionButton, LoadingSpinner, theme,
} from './TrainerComponents';
import {
    Check, X, Save, ArrowLeft, Calendar as CalendarIcon,
    UserCheck, UserX, Users, Search,
} from 'lucide-react';

export const TrainerAttendance = () => {
    const { batchId } = useParams();
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [records, setRecords] = useState({});
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const [sRes, aRes] = await Promise.all([
                    trainerAPI.getBatchStudents(batchId),
                    trainerAPI.getBatchAttendance(batchId, date),
                ]);
                setStudents(sRes.data);
                const map = {};
                aRes.data.forEach(r => { map[r.student_id] = { status: r.status, notes: r.notes }; });
                sRes.data.forEach(s => { if (!map[s.id]) map[s.id] = { status: 'present', notes: '' }; });
                setRecords(map);
            } catch (err) { console.error(err); } finally { setLoading(false); }
        })();
    }, [batchId, date]);

    const toggle = (id, status) => setRecords(p => ({ ...p, [id]: { ...p[id], status } }));

    const handleSave = async () => {
        setSaving(true);
        try {
            const attendance = Object.entries(records).map(([sid, d]) => ({ student_id: parseInt(sid), status: d.status, notes: d.notes }));
            await trainerAPI.markAttendance({ batch_id: batchId, date, attendance });
            alert('Attendance saved!');
        } catch (err) { alert('Error: ' + err.message); } finally { setSaving(false); }
    };

    if (loading) return <LoadingSpinner label="Loading students..." />;

    const filtered = students.filter(s => `${s.first_name} ${s.last_name} ${s.email}`.toLowerCase().includes(search.toLowerCase()));
    const presentCount = Object.values(records).filter(r => r.status === 'present').length;
    const absentCount = Object.values(records).filter(r => r.status === 'absent').length;

    return (
        <div style={{ animation: 'fadeIn 0.4s ease-out', paddingBottom: '100px' }}>
            <PageHeader
                title="Mark Attendance"
                subtitle={`Batch #${batchId} · ${new Date(date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}`}
                icon={<UserCheck size={24} />}
                accentColor={theme.accent.green}
                actions={
                    <>
                        <ActionButton variant="secondary" icon={<ArrowLeft size={14} />} onClick={() => navigate(-1)}>Back</ActionButton>
                        <div style={{ background: theme.bg.card, border: `1px solid ${theme.border.subtle}`, borderRadius: theme.radius.md, padding: '4px' }}>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)}
                                style={{ background: 'transparent', border: 'none', color: theme.text.primary, fontSize: '12px', fontWeight: 600, outline: 'none', padding: '6px 8px' }} />
                        </div>
                        <ActionButton icon={<Save size={14} />} onClick={handleSave} disabled={saving} variant="success">
                            {saving ? 'Saving...' : 'Save'}
                        </ActionButton>
                    </>
                }
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
                <StatCard label="Total Strength" value={students.length} icon={<Users size={18} />} accentColor={theme.accent.blue} />
                <StatCard label="Present Today" value={presentCount} icon={<UserCheck size={18} />} accentColor={theme.accent.green} />
                <StatCard label="Absent Today" value={absentCount} icon={<UserX size={18} />} accentColor={theme.accent.red} />
            </div>

            <Card noPadding>
                {/* Search */}
                <div style={{ padding: '16px 24px', borderBottom: `1px solid ${theme.border.subtle}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Search size={16} color={theme.text.muted} />
                    <input type="text" placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: theme.text.primary, fontSize: '13px', fontWeight: 500, outline: 'none', flex: 1 }} />
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                {['Student', 'Status', 'Notes'].map(h => (
                                    <th key={h} style={{ padding: '14px 24px', textAlign: h === 'Status' ? 'center' : 'left', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.text.label, borderBottom: `1px solid ${theme.border.subtle}` }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(s => {
                                const rec = records[s.id] || { status: 'present', notes: '' };
                                return (
                                    <tr key={s.id} style={{ borderBottom: `1px solid ${theme.border.subtle}`, transition: 'background 0.15s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = theme.bg.cardHover}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <td style={{ padding: '14px 24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{
                                                    width: '36px', height: '36px', borderRadius: '50%',
                                                    background: `${theme.accent.purple}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: theme.accent.purple, fontSize: '13px', fontWeight: 800,
                                                }}>{s.first_name?.charAt(0)}</div>
                                                <div>
                                                    <div style={{ fontSize: '13px', fontWeight: 700, color: theme.text.primary }}>{s.first_name} {s.last_name}</div>
                                                    <div style={{ fontSize: '10px', color: theme.text.muted }}>{s.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '14px 24px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                                <button onClick={() => toggle(s.id, 'present')}
                                                    style={{
                                                        padding: '7px 16px', borderRadius: theme.radius.md, border: 'none', cursor: 'pointer',
                                                        fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px',
                                                        transition: 'all 0.15s',
                                                        background: rec.status === 'present' ? theme.accent.green : 'rgba(255,255,255,0.04)',
                                                        color: rec.status === 'present' ? '#fff' : theme.text.muted,
                                                    }}>
                                                    <Check size={12} /> Present
                                                </button>
                                                <button onClick={() => toggle(s.id, 'absent')}
                                                    style={{
                                                        padding: '7px 16px', borderRadius: theme.radius.md, border: 'none', cursor: 'pointer',
                                                        fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px',
                                                        transition: 'all 0.15s',
                                                        background: rec.status === 'absent' ? theme.accent.red : 'rgba(255,255,255,0.04)',
                                                        color: rec.status === 'absent' ? '#fff' : theme.text.muted,
                                                    }}>
                                                    <X size={12} /> Absent
                                                </button>
                                            </div>
                                        </td>
                                        <td style={{ padding: '14px 24px' }}>
                                            <input type="text" placeholder="Add notes..." value={rec.notes || ''}
                                                onChange={e => setRecords(p => ({ ...p, [s.id]: { ...p[s.id], notes: e.target.value } }))}
                                                style={{
                                                    width: '100%', background: 'rgba(255,255,255,0.03)', border: `1px solid ${theme.border.subtle}`,
                                                    borderRadius: theme.radius.sm, padding: '8px 10px', color: theme.text.primary, fontSize: '12px', fontWeight: 500, outline: 'none',
                                                }} />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Floating Save Bar */}
            <div style={{
                position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
                width: '100%', maxWidth: '700px', padding: '0 20px', zIndex: 50,
            }}>
                <div style={{
                    background: theme.bg.card, border: `1px solid ${theme.border.subtle}`,
                    borderRadius: theme.radius.lg, padding: '14px 24px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}>
                    <div>
                        <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.text.label }}>Marked</span>
                        <p style={{ fontSize: '18px', fontWeight: 800, color: theme.text.primary, margin: '2px 0 0' }}>{presentCount + absentCount} / {students.length}</p>
                    </div>
                    <ActionButton onClick={handleSave} disabled={saving} variant="success" icon={<Save size={14} />}>
                        {saving ? 'Processing...' : 'Finish Marking'}
                    </ActionButton>
                </div>
            </div>
            <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
    );
};
