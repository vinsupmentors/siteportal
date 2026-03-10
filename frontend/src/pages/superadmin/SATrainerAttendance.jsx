import { useState, useEffect } from 'react';
import { superAdminAPI } from '../../services/api';
import { FileText, Download } from 'lucide-react';

const statusLabels = { present: '#51cf66', leave: '#ff6b6b', wfh: '#4c6ef5', leave_with_comp: '#7950f2' };
const statusDisplay = { present: 'Present', leave: 'Leave', wfh: 'WFH', leave_with_comp: 'Comp Leave' };
const SESSIONS = ['morning', 'afternoon'];
const SESSION_LABELS = { morning: '🌅 Morning', afternoon: '🌆 Afternoon' };

export const SATrainerAttendance = () => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [records, setRecords] = useState([]);
    const [allTrainers, setAllTrainers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reportYear, setReportYear] = useState(new Date().getFullYear());
    const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
    const [showReport, setShowReport] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [editingLeave, setEditingLeave] = useState(null);
    const [leaveVal, setLeaveVal] = useState('');

    const inputStyle = { padding: '10px', borderRadius: '8px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none' };

    const fetchData = async () => {
        try {
            const res = await superAdminAPI.getTrainerAttendance(date);
            setRecords(res.data.records);
            setAllTrainers(res.data.allTrainers);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [date]);

    const handleMark = async (trainer_id, status, session) => {
        try {
            await superAdminAPI.markTrainerAttendance({ trainer_id, date, status, session });
            fetchData();
        } catch (err) { alert('Error marking attendance'); }
    };

    const getTrainerSessionStatus = (tid, session) => records.find(r => r.trainer_id === tid && r.session === session);

    const saveCasualLeave = async (trainerId) => {
        try {
            await superAdminAPI.updateCasualLeaveCount(trainerId, { casual_leave_count: Number(leaveVal) });
            setEditingLeave(null);
            fetchData();
        } catch { alert('Error saving'); }
    };

    const fetchReport = async () => {
        try {
            const res = await superAdminAPI.getMonthlyAttendanceReport(reportYear, reportMonth);
            setReportData(res.data);
        } catch { alert('Error fetching report'); }
    };

    const downloadCSV = async () => {
        try {
            const res = await superAdminAPI.getMonthlyAttendanceReport(reportYear, reportMonth, 'csv');
            const blob = new Blob([res.data], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `attendance_${reportYear}_${String(reportMonth).padStart(2, '0')}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch { alert('Failed to download report'); }
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><div className="spinner" /></div>;

    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem' }}>Trainer Attendance</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Mark morning & afternoon sessions separately</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input type="date" value={date} onChange={e => { setDate(e.target.value); setLoading(true); }}
                        style={{ ...inputStyle, fontSize: '0.9rem' }} />
                    <button onClick={() => setShowReport(!showReport)}
                        style={{ padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', background: '#7950f215', color: '#7950f2', border: '1px solid #7950f230', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 500 }}>
                        <FileText size={14} /> Monthly Report
                    </button>
                </div>
            </div>

            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
                {Object.entries(statusDisplay).map(([key, label]) => {
                    const count = records.filter(r => r.status === key).length;
                    return (
                        <div key={key} className="glass-card" style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                            <p style={{ fontSize: '1.3rem', fontWeight: 700, color: statusLabels[key] }}>{count}</p>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{label}</p>
                        </div>
                    );
                })}
            </div>

            {/* Monthly Report Panel */}
            {showReport && (
                <div className="glass-card">
                    <h3 style={{ marginBottom: '1rem', color: '#7950f2', display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={18} /> Monthly Report</h3>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
                        <select value={reportMonth} onChange={e => setReportMonth(Number(e.target.value))} style={inputStyle}>
                            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                        </select>
                        <input type="number" value={reportYear} onChange={e => setReportYear(Number(e.target.value))} min="2024" max="2030" style={{ ...inputStyle, width: '100px' }} />
                        <button onClick={fetchReport}
                            style={{ padding: '10px 14px', borderRadius: '8px', background: '#7950f2', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                            View Report
                        </button>
                        <button onClick={downloadCSV}
                            style={{ padding: '10px 14px', borderRadius: '8px', background: '#51cf66', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Download size={14} /> Download CSV
                        </button>
                    </div>
                    {reportData && reportData.trainers && (
                        <div style={{ overflow: 'auto', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <thead><tr style={{ background: 'var(--bg-surface)' }}>
                                    {['Trainer', 'Full Day', 'Morning', 'Afternoon', 'WFH', 'CL Used', 'Comp Leave', 'CL Balance', 'Total'].map(h =>
                                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{h}</th>
                                    )}
                                </tr></thead>
                                <tbody>
                                    {reportData.trainers.map((t, i) => (
                                        <tr key={i} style={{ borderTop: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '10px 14px', fontWeight: 500 }}>{t.name}</td>
                                            <td style={{ padding: '10px 14px', color: '#51cf66', fontWeight: 600 }}>{t.present_full}</td>
                                            <td style={{ padding: '10px 14px', color: '#15aabf' }}>{t.present_morning}</td>
                                            <td style={{ padding: '10px 14px', color: '#fab005' }}>{t.present_afternoon}</td>
                                            <td style={{ padding: '10px 14px', color: '#4c6ef5' }}>{t.wfh}</td>
                                            <td style={{ padding: '10px 14px', color: '#ff6b6b' }}>{t.cl_used}</td>
                                            <td style={{ padding: '10px 14px', color: '#7950f2' }}>{t.comp_leave}</td>
                                            <td style={{ padding: '10px 14px', color: '#4c6ef5', fontWeight: 600 }}>{t.cl_balance}</td>
                                            <td style={{ padding: '10px 14px', fontWeight: 600 }}>{t.total_records}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Trainer Attendance Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {allTrainers.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>No active trainers found.</div>
                ) : (
                    allTrainers.map(t => {
                        const isEditingCL = editingLeave === t.id;
                        return (
                            <div key={t.id} className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                                    <div>
                                        <h3 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '4px' }}>{t.first_name} {t.last_name}</h3>
                                        {t.is_probation && <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '12px', background: '#ff6b6b20', color: '#ff6b6b', fontWeight: 700, textTransform: 'uppercase' }}>Probation</span>}
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>CL Left</p>
                                        {isEditingCL ? (
                                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center', justifyContent: 'flex-end' }}>
                                                <input type="number" value={leaveVal} onChange={e => setLeaveVal(e.target.value)} min="0" style={{ width: '45px', padding: '2px 4px', borderRadius: '4px', background: 'var(--bg-dark)', border: '1px solid var(--primary)', color: 'var(--text-main)', outline: 'none', textAlign: 'center', fontSize: '0.85rem' }} autoFocus onKeyDown={e => e.key === 'Enter' && saveCasualLeave(t.id)} />
                                                <button onClick={() => saveCasualLeave(t.id)} style={{ padding: '2px 6px', borderRadius: '4px', background: '#51cf66', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.7rem' }}>✓</button>
                                                <button onClick={() => setEditingLeave(null)} style={{ padding: '2px 6px', borderRadius: '4px', background: '#ff6b6b', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.7rem' }}>✕</button>
                                            </div>
                                        ) : (
                                            <span onClick={() => { setEditingLeave(t.id); setLeaveVal(t.casual_leave_count ?? 12); }} style={{ cursor: 'pointer', display: 'inline-block', padding: '2px 10px', borderRadius: '6px', background: t.is_probation ? '#ff6b6b15' : 'var(--primary)15', color: t.is_probation ? '#ff6b6b' : 'var(--primary)', fontWeight: 700, fontSize: '1rem', border: `1px solid ${t.is_probation ? '#ff6b6b30' : 'var(--primary)30'}` }}>
                                                {t.is_probation ? '0' : (t.casual_leave_count ?? 12)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {SESSIONS.map(session => {
                                        const record = getTrainerSessionStatus(t.id, session);
                                        return (
                                            <div key={session} style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '0.75rem', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>{SESSION_LABELS[session].split(' ')[0]} <span style={{ color: 'var(--text-muted)' }}>{SESSION_LABELS[session].split(' ')[1]}</span></span>
                                                    {record ? (
                                                        <span style={{ padding: '2px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700, background: `${statusLabels[record.status] || '#888'}20`, color: statusLabels[record.status] || '#888', textTransform: 'uppercase' }}>
                                                            {statusDisplay[record.status] || record.status}
                                                        </span>
                                                    ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>Pending</span>}
                                                </div>

                                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                                                    {Object.entries(statusDisplay).map(([key, label]) => (
                                                        <button key={key} onClick={() => handleMark(t.id, key, session)}
                                                            style={{
                                                                flex: '1 1 auto', padding: '6px 4px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600,
                                                                background: record?.status === key ? statusLabels[key] : 'var(--bg-dark)',
                                                                color: record?.status === key ? '#fff' : 'var(--text-main)',
                                                                border: `1px solid ${record?.status === key ? statusLabels[key] : 'var(--border-color)'}`,
                                                                transition: '0.2s'
                                                            }}>
                                                            {label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
