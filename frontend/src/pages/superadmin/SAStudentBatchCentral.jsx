import { useState, useEffect, useRef } from 'react';
import { superAdminAPI } from '../../services/api';
import {
    Search, Upload, UserPlus, Pencil, Trash2, Download,
    Users, CheckSquare, Plus, PlusCircle, LayoutGrid, List
} from 'lucide-react';

export const SAStudentBatchCentral = () => {
    const [activeTab, setActiveTab] = useState('students');
    const [loading, setLoading] = useState(true);

    // --- SHARED DATA ---
    const [batches, setBatches] = useState([]);
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [trainers, setTrainers] = useState([]);

    // --- STUDENT STATE ---
    const [studentSearch, setStudentSearch] = useState('');
    const [showStudentForm, setShowStudentForm] = useState(false);
    const [editingStudentId, setEditingStudentId] = useState(null);
    const [studentForm, setStudentForm] = useState({ first_name: '', last_name: '', email: '', phone: '', batch_id: '', student_status: 'Regular' });
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [assignBatchId, setAssignBatchId] = useState('');
    const [transferModal, setTransferModal] = useState({ show: false, studentId: null, newBatchId: '' });
    const [showBulkUpload, setShowBulkUpload] = useState(false);
    const [bulkData, setBulkData] = useState(null);
    const [bulkStatus, setBulkStatus] = useState('');
    const fileRef = useRef(null);

    // --- BATCH STATE ---
    const [batchFilter, setBatchFilter] = useState('all');
    const [showBatchForm, setShowBatchForm] = useState(false);
    const [editingBatchId, setEditingBatchId] = useState(null);
    const [batchForm, setBatchForm] = useState({ batch_name: '', course_id: '', trainer_id: '', schedule_type: 'weekday', timing: 'morning', start_date: '', end_date: '', meeting_link: '' });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [studRes, batchRes, courseRes, trainerRes] = await Promise.all([
                superAdminAPI.getStudents(),
                superAdminAPI.getBatches(),
                superAdminAPI.getCourses(),
                superAdminAPI.getTrainers()
            ]);
            setStudents(studRes.data.students);
            setBatches(batchRes.data.batches);
            setCourses(courseRes.data.courses);
            setTrainers(trainerRes.data.trainers);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // --- STUDENT HANDLERS ---
    const handleStudentSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingStudentId) await superAdminAPI.updateStudent(editingStudentId, studentForm);
            else await superAdminAPI.createStudent(studentForm);
            setShowStudentForm(false); setEditingStudentId(null);
            setStudentForm({ first_name: '', last_name: '', email: '', phone: '', batch_id: '' });
            fetchData();
        } catch (err) { alert(err.response?.data?.message || 'Error saving student'); }
    };

    const handleStudentDelete = async (id) => {
        if (!confirm('Delete this student?')) return;
        try { await superAdminAPI.deleteStudent(id); fetchData(); }
        catch { alert('Error deleting student'); }
    };

    const toggleStudentSelect = (id) => {
        setSelectedStudents(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleSelectAllStudents = (filtered) => {
        if (selectedStudents.length === filtered.length) setSelectedStudents([]);
        else setSelectedStudents(filtered.map(s => s.id));
    };

    const handleBulkAssign = async () => {
        if (!assignBatchId || !selectedStudents.length) return;
        try {
            const res = await superAdminAPI.bulkAssignBatch({ student_ids: selectedStudents, batch_id: Number(assignBatchId) });
            alert(res.data.message);
            setSelectedStudents([]);
            setAssignBatchId('');
            fetchData();
        } catch (err) { alert(err.response?.data?.message || 'Error assigning batch'); }
    };

    const handleTransferSubmit = async () => {
        if (!transferModal.newBatchId) return;
        try {
            const res = await superAdminAPI.transferStudentBatch(transferModal.studentId, { new_batch_id: Number(transferModal.newBatchId) });
            alert(res.data.message);
            setTransferModal({ show: false, studentId: null, newBatchId: '' });
            fetchData();
        } catch (err) { alert(err.response?.data?.message || 'Error transferring student'); }
    };


    const handleCSVFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target.result;
            const lines = text.split('\n').filter(l => l.trim());
            if (lines.length < 2) { alert('CSV must have a header row and at least one data row.'); return; }
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            const rows = lines.slice(1).map(line => {
                const vals = line.split(',').map(v => v.trim());
                const obj = {};
                headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
                return obj;
            });
            setBulkData(rows);
            setBulkStatus(`Parsed ${rows.length} students from CSV.`);
        };
        reader.readAsText(file);
    };

    const submitBulkUpload = async () => {
        if (!bulkData || !bulkData.length) return;
        setBulkStatus('Uploading...');
        try {
            const res = await superAdminAPI.bulkCreateStudents({ students: bulkData });
            setBulkStatus(`✅ ${res.data.created} students created.`);
            setBulkData(null);
            if (fileRef.current) fileRef.current.value = '';
            fetchData();
        } catch (err) { setBulkStatus('❌ Upload failed'); }
    };

    // --- BATCH HANDLERS ---
    const handleBatchSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingBatchId) await superAdminAPI.updateBatch(editingBatchId, batchForm);
            else await superAdminAPI.createBatch(batchForm);
            setShowBatchForm(false); setEditingBatchId(null);
            setBatchForm({ batch_name: '', course_id: '', trainer_id: '', schedule_type: 'weekday', timing: 'morning', start_date: '', end_date: '', meeting_link: '' });
            fetchData();
        } catch (err) { alert(err.response?.data?.message || 'Error saving batch'); }
    };

    const handleBatchDelete = async (id) => {
        if (!confirm('Delete this batch? All student enrollments will be removed.')) return;
        try { await superAdminAPI.deleteBatch(id); fetchData(); }
        catch { alert('Error deleting batch'); }
    };

    const filteredStudents = students.filter(s =>
        `${s.first_name} ${s.last_name} ${s.email}`.toLowerCase().includes(studentSearch.toLowerCase())
    );

    const filteredBatches = batches.filter(b => batchFilter === 'all' || b.status === batchFilter);

    const statusColors = { active: '#51cf66', upcoming: '#4c6ef5', completed: '#868e96' };
    const inputStyle = { padding: '10px', borderRadius: '8px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none', width: '100%' };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><div className="spinner" /></div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Page Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Students & Batches</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Comprehensive management of academic cycles</p>
                </div>
                <div style={{ display: 'flex', background: 'var(--bg-surface)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <button onClick={() => setActiveTab('students')}
                        style={{ padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', border: 'none', fontSize: '0.9rem', fontWeight: 600, background: activeTab === 'students' ? 'var(--primary)' : 'transparent', color: activeTab === 'students' ? 'white' : 'var(--text-muted)', transition: '0.2s' }}>
                        Students
                    </button>
                    <button onClick={() => setActiveTab('batches')}
                        style={{ padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', border: 'none', fontSize: '0.9rem', fontWeight: 600, background: activeTab === 'batches' ? 'var(--primary)' : 'transparent', color: activeTab === 'batches' ? 'white' : 'var(--text-muted)', transition: '0.2s' }}>
                        Batches
                    </button>
                </div>
            </div>

            {activeTab === 'students' ? (
                /* --- STUDENTS TAB --- */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-color)', minWidth: '350px' }}>
                            <Search size={16} color="var(--text-muted)" />
                            <input type="text" placeholder="Search students..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)}
                                style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none', fontSize: '0.9rem' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={() => setShowBulkUpload(!showBulkUpload)}
                                style={{ padding: '10px 16px', borderRadius: '8px', background: 'var(--bg-surface)', color: 'var(--text-main)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer' }}>
                                <Upload size={16} /> Bulk Upload
                            </button>
                            <button onClick={() => { setShowStudentForm(true); setEditingStudentId(null); setStudentForm({ first_name: '', last_name: '', email: '', phone: '', batch_id: '' }); }}
                                style={{ padding: '10px 16px', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>
                                <UserPlus size={16} /> Add Student
                            </button>
                        </div>
                    </div>

                    {showBulkUpload && (
                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                            <h3 style={{ marginBottom: '1rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}><Upload size={20} /> Bulk Enroll Students</h3>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <input type="file" accept=".csv" ref={fileRef} onChange={handleCSVFile} style={{ ...inputStyle, maxWidth: '400px' }} />
                                {bulkData && (
                                    <button onClick={submitBulkUpload} style={{ padding: '10px 20px', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                                        Confirm & Upload {bulkData.length} Students
                                    </button>
                                )}
                            </div>
                            {bulkStatus && <p style={{ marginTop: '1rem', color: '#51cf66', fontSize: '0.9rem' }}>{bulkStatus}</p>}
                        </div>
                    )}

                    {showStudentForm && (
                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                            <h3 style={{ marginBottom: '1.5rem' }}>{editingStudentId ? 'Edit Student' : 'Onboard New Student'}</h3>
                            <form onSubmit={handleStudentSubmit} className="grid-cols-2" style={{ display: 'grid', gap: '1rem' }}>
                                <input required placeholder="First Name" value={studentForm.first_name} onChange={e => setStudentForm({ ...studentForm, first_name: e.target.value })} style={inputStyle} />
                                <input required placeholder="Last Name" value={studentForm.last_name} onChange={e => setStudentForm({ ...studentForm, last_name: e.target.value })} style={inputStyle} />
                                <input required type="email" placeholder="Email Address" value={studentForm.email} onChange={e => setStudentForm({ ...studentForm, email: e.target.value })} style={inputStyle} />
                                <input placeholder="Phone Number" value={studentForm.phone} onChange={e => setStudentForm({ ...studentForm, phone: e.target.value })} style={inputStyle} />
                                {!editingStudentId && (
                                    <select value={studentForm.batch_id} onChange={e => setStudentForm({ ...studentForm, batch_id: e.target.value })} style={inputStyle}>
                                        <option value="">Select Initial Batch (Optional)</option>
                                        {batches.map(b => <option key={b.id} value={b.id}>{b.batch_name} — {b.course_name}</option>)}
                                    </select>
                                )}
                                {editingStudentId && (
                                    <select value={studentForm.student_status} onChange={e => setStudentForm({ ...studentForm, student_status: e.target.value })} style={inputStyle}>
                                        <option value="Regular">Regular</option>
                                        <option value="Irregular">Irregular</option>
                                        <option value="Dropout">Dropout</option>
                                        <option value="Batch Transfer" disabled>Batch Transfer (Managed via Transfer button)</option>
                                        <option value="Course Completed">Course Completed</option>
                                    </select>
                                )}
                                <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                    <button type="button" onClick={() => setShowStudentForm(false)} style={{ padding: '10px 20px', borderRadius: '8px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>Cancel</button>
                                    <button type="submit" style={{ padding: '10px 25px', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Save Student</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {transferModal.show && (
                        <div className="glass-card" style={{ padding: '1.5rem', background: 'var(--bg-card)' }}>
                            <h3 style={{ marginBottom: '1.5rem', color: '#ffb900' }}>Transfer Student to New Batch</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                                <select value={transferModal.newBatchId} onChange={e => setTransferModal({ ...transferModal, newBatchId: e.target.value })} style={inputStyle}>
                                    <option value="">Select Destination Batch</option>
                                    {batches.map(b => <option key={b.id} value={b.id}>{b.batch_name} — {b.course_name}</option>)}
                                </select>
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                    <button type="button" onClick={() => setTransferModal({ show: false, studentId: null, newBatchId: '' })} style={{ padding: '10px 20px', borderRadius: '8px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>Cancel</button>
                                    <button onClick={handleTransferSubmit} disabled={!transferModal.newBatchId} style={{ padding: '10px 25px', borderRadius: '8px', background: '#ffb900', color: 'black', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Execute Transfer</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedStudents.length > 0 && (
                        <div className="glass-card" style={{ padding: '1rem', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{selectedStudents.length} Students Selected</span>
                                <select value={assignBatchId} onChange={e => setAssignBatchId(e.target.value)} style={{ ...inputStyle, width: '250px' }}>
                                    <option value="">Select Destination Batch...</option>
                                    {batches.map(b => <option key={b.id} value={b.id}>{b.batch_name}</option>)}
                                </select>
                                <button onClick={handleBulkAssign} disabled={!assignBatchId}
                                    style={{ padding: '10px 20px', borderRadius: '8px', background: assignBatchId ? '#51cf66' : 'var(--bg-dark)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                                    Assign to Batch
                                </button>
                            </div>
                            <button onClick={() => setSelectedStudents([])} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>Clear Selection</button>
                        </div>
                    )}

                    <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)' }}>
                                    <th style={{ padding: '1.25rem', textAlign: 'center', width: '50px' }}>
                                        <input type="checkbox" checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0} onChange={() => toggleSelectAllStudents(filteredStudents)} style={{ accentColor: 'var(--primary)' }} />
                                    </th>
                                    <th style={{ padding: '1.25rem', textAlign: 'left', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Student Name</th>
                                    <th style={{ padding: '1.25rem', textAlign: 'left', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Email</th>
                                    <th style={{ padding: '1.25rem', textAlign: 'left', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Batch / Course</th>
                                    <th style={{ padding: '1.25rem', textAlign: 'left', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Phase</th>
                                    <th style={{ padding: '1.25rem', textAlign: 'right', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map(s => (
                                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)', transition: '0.2s' }}>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <input type="checkbox" checked={selectedStudents.includes(s.id)} onChange={() => toggleStudentSelect(s.id)} style={{ accentColor: 'var(--primary)' }} />
                                        </td>
                                        <td style={{ padding: '1rem', fontWeight: 600 }}>{s.first_name} {s.last_name}</td>
                                        <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{s.email}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ display: 'block', fontSize: '0.9rem' }}>{s.batch_name || 'No Batch'}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.course_name || 'Unassigned'}</span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(255,255,255,0.05)', color: 'var(--text-accent)' }}>{s.student_phase || 'Joined'}</span>
                                            <span style={{ marginLeft: '8px', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(255,100,100,0.1)', color: 'var(--text-main)' }}>{s.student_status || 'Regular'}</span>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button onClick={() => setTransferModal({ show: true, studentId: s.id, newBatchId: '' })} style={{ padding: '4px 10px', borderRadius: '6px', background: '#ffb90020', border: '1px solid #ffb90040', color: '#ffb900', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>Transfer</button>
                                                <button onClick={() => { setEditingStudentId(s.id); setStudentForm({ first_name: s.first_name, last_name: s.last_name, email: s.email, phone: s.phone || '', status: s.status, student_status: s.student_status || 'Regular' }); setShowStudentForm(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><Pencil size={18} /></button>
                                                <button onClick={() => handleStudentDelete(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff6b6b' }}><Trash2 size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* --- BATCHES TAB --- */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {['all', 'active', 'upcoming', 'completed'].map(s => (
                                <button key={s} onClick={() => setBatchFilter(s)}
                                    style={{
                                        padding: '8px 18px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem', textTransform: 'capitalize',
                                        background: batchFilter === s ? 'var(--primary)' : 'var(--bg-surface)',
                                        color: batchFilter === s ? 'white' : 'var(--text-muted)',
                                        border: `1px solid ${batchFilter === s ? 'var(--primary)' : 'var(--border-color)'}`
                                    }}>
                                    {s}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => { setShowBatchForm(true); setEditingBatchId(null); setBatchForm({ batch_name: '', course_id: '', trainer_id: '', schedule_type: 'weekday', timing: 'morning', start_date: '', end_date: '', meeting_link: '' }); }}
                            style={{ padding: '10px 20px', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, cursor: 'pointer' }}>
                            <Plus size={18} /> New Batch
                        </button>
                    </div>

                    {showBatchForm && (
                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                            <h3 style={{ marginBottom: '1.5rem' }}>{editingBatchId ? 'Edit Batch Details' : 'Create New Academic Batch'}</h3>
                            <form onSubmit={handleBatchSubmit} className="grid-cols-2" style={{ display: 'grid', gap: '1rem' }}>
                                <input required placeholder="Batch Unique Name (e.g. SEP-23-WEB)" value={batchForm.batch_name} onChange={e => setBatchForm({ ...batchForm, batch_name: e.target.value })} style={inputStyle} />
                                <select required value={batchForm.course_id} onChange={e => setBatchForm({ ...batchForm, course_id: e.target.value })} style={inputStyle}>
                                    <option value="">Select Primary Course</option>
                                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <select value={batchForm.trainer_id} onChange={e => setBatchForm({ ...batchForm, trainer_id: e.target.value })} style={inputStyle}>
                                    <option value="">Assign Chief Trainer</option>
                                    {trainers.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                                </select>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <select required value={batchForm.schedule_type} onChange={e => setBatchForm({ ...batchForm, schedule_type: e.target.value })} style={inputStyle}>
                                        <option value="weekday">Weekday</option>
                                        <option value="weekend">Weekend</option>
                                    </select>
                                    <select required value={batchForm.timing} onChange={e => setBatchForm({ ...batchForm, timing: e.target.value })} style={inputStyle}>
                                        <option value="morning">Morning</option>
                                        <option value="afternoon">Afternoon</option>
                                        <option value="evening">Evening</option>
                                    </select>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <input required type="date" value={batchForm.start_date} onChange={e => setBatchForm({ ...batchForm, start_date: e.target.value })} style={inputStyle} />
                                    <input type="date" value={batchForm.end_date} onChange={e => setBatchForm({ ...batchForm, end_date: e.target.value })} style={inputStyle} />
                                </div>
                                <input placeholder="Meeting Link (Classroom URL)" value={batchForm.meeting_link} onChange={e => setBatchForm({ ...batchForm, meeting_link: e.target.value })} style={inputStyle} />
                                {editingBatchId && (
                                    <select value={batchForm.status} onChange={e => setBatchForm({ ...batchForm, status: e.target.value })} style={inputStyle}>
                                        <option value="active">Active</option>
                                        <option value="upcoming">Upcoming</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                )}
                                <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                    <button type="button" onClick={() => setShowBatchForm(false)} style={{ padding: '10px 20px', borderRadius: '8px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>Cancel</button>
                                    <button type="submit" style={{ padding: '10px 25px', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Confirm Batch</button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                        {filteredBatches.map(b => (
                            <div key={b.id} className="glass-card" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: statusColors[b.status] || 'var(--primary)' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{b.batch_name}</h3>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{b.course_name}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => { setEditingBatchId(b.id); setBatchForm({ ...b, start_date: b.start_date?.split('T')[0], end_date: b.end_date?.split('T')[0] || '' }); setShowBatchForm(true); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Pencil size={16} /></button>
                                        <button onClick={() => handleBatchDelete(b.id)} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div style={{ background: 'var(--bg-dark)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                                        <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>{b.student_count}</p>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Students</p>
                                    </div>
                                    <div style={{ background: 'var(--bg-dark)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                                        <p style={{ fontSize: '0.9rem', fontWeight: 600, textTransform: 'capitalize' }}>{b.timing}</p>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Session</p>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>{b.trainer_name || 'No lead trainer'}</span>
                                    <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, background: `${statusColors[b.status]}20`, color: statusColors[b.status], textTransform: 'uppercase' }}>{b.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
