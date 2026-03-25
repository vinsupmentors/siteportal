import { useState, useEffect, useRef } from 'react';
import { superAdminAPI } from '../../services/api';
import {
    Search, Upload, UserPlus, Pencil, Trash2,
    Users, Plus, ChevronDown, ChevronRight, BookOpen
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
    const [studentForm, setStudentForm] = useState({ first_name: '', last_name: '', email: '', phone: '', batch_id: '', student_status: 'Regular', program_type: 'JRP' });
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [assignBatchId, setAssignBatchId] = useState('');
    const [transferModal, setTransferModal] = useState({ show: false, studentId: null, newBatchId: '' });
    const [showBulkUpload, setShowBulkUpload] = useState(false);
    const [bulkData, setBulkData] = useState(null);
    const [bulkStatus, setBulkStatus] = useState('');
    const fileRef = useRef(null);
    const [filterBatch, setFilterBatch] = useState('');
    const [filterCourse, setFilterCourse] = useState('');
    const [filterTrainer, setFilterTrainer] = useState('');
    const [filterProgram, setFilterProgram] = useState('');
    const [bulkErrors, setBulkErrors] = useState([]);

    // --- BATCH STATE ---
    const [batchFilter, setBatchFilter] = useState('all');
    const [expandedGroups, setExpandedGroups] = useState({});
    const [prefillBatchName, setPrefillBatchName] = useState('');
    const [showBatchForm, setShowBatchForm] = useState(false);
    const [editingBatchId, setEditingBatchId] = useState(null);
    const [batchForm, setBatchForm] = useState({ batch_name: '', course_id: '', trainer_id: '', iop_trainer_id: '', schedule_type: 'weekday', timing: 'morning', start_date: '', end_date: '', meeting_link: '', status: 'active' });

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
        setBulkErrors([]);
        try {
            const res = await superAdminAPI.bulkCreateStudents({ students: bulkData });
            setBulkStatus(`✅ ${res.data.created} students created${res.data.errors?.length ? ` (${res.data.errors.length} failed)` : ''}.`);
            if (res.data.errors?.length) setBulkErrors(res.data.errors);
            setBulkData(null);
            if (fileRef.current) fileRef.current.value = '';
            fetchData();
        } catch (err) { setBulkStatus('❌ Upload failed: ' + (err.response?.data?.message || err.message)); }
    };

    // --- BATCH HANDLERS ---
    const handleBatchSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingBatchId) await superAdminAPI.updateBatch(editingBatchId, batchForm);
            else await superAdminAPI.createBatch(batchForm);
            setShowBatchForm(false); setEditingBatchId(null); setPrefillBatchName('');
            setBatchForm({ batch_name: '', course_id: '', trainer_id: '', iop_trainer_id: '', schedule_type: 'weekday', timing: 'morning', start_date: '', end_date: '', meeting_link: '', status: 'active' });
            fetchData();
        } catch (err) { alert(err.response?.data?.message || 'Error saving batch'); }
    };

    const handleBatchDelete = async (id) => {
        if (!confirm('Delete this course from the batch? All student enrollments will be removed.')) return;
        try { await superAdminAPI.deleteBatch(id); fetchData(); }
        catch { alert('Error deleting batch'); }
    };

    const openNewCourse = (batchName = '') => {
        setPrefillBatchName(batchName);
        setEditingBatchId(null);
        setBatchForm({ batch_name: batchName, course_id: '', trainer_id: '', schedule_type: 'weekday', timing: 'morning', start_date: '', end_date: '', meeting_link: '', status: 'active' });
        setShowBatchForm(true);
    };

    const openEdit = (b) => {
        setPrefillBatchName('');
        setEditingBatchId(b.id);
        setBatchForm({ ...b, start_date: b.start_date?.split('T')[0], end_date: b.end_date?.split('T')[0] || '' });
        setShowBatchForm(true);
    };

    const toggleGroup = (name) => setExpandedGroups(prev => ({ ...prev, [name]: !prev[name] }));

    const filteredStudents = students.filter(s => {
        const searchMatch = `${s.first_name} ${s.last_name} ${s.email}`.toLowerCase().includes(studentSearch.toLowerCase());
        const batchMatch = !filterBatch || String(s.batch_id) === filterBatch;
        const courseMatch = !filterCourse || String(s.course_id) === filterCourse;
        const trainerMatch = !filterTrainer || String(s.trainer_id) === filterTrainer;
        const programMatch = !filterProgram || s.program_type === filterProgram;
        return searchMatch && batchMatch && courseMatch && trainerMatch && programMatch;
    });

    const filteredBatches = batches.filter(b => batchFilter === 'all' || b.status === batchFilter);

    const statusColors = { active: '#51cf66', upcoming: '#4c6ef5', completed: '#868e96', technical_class_completed: '#f97316' };
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
                            <button onClick={() => { setShowStudentForm(true); setEditingStudentId(null); setStudentForm({ first_name: '', last_name: '', email: '', phone: '', batch_id: '', student_status: 'Regular', program_type: 'JRP' }); }}
                                style={{ padding: '10px 16px', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>
                                <UserPlus size={16} /> Add Student
                            </button>
                        </div>
                    </div>

                    {/* Filter row */}
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <select value={filterBatch} onChange={e => setFilterBatch(e.target.value)}
                            style={{ ...inputStyle, width: 'auto', minWidth: '160px', cursor: 'pointer' }}>
                            <option value="">All Batches</option>
                            {batches.map(b => <option key={b.id} value={String(b.id)}>{b.batch_name}</option>)}
                        </select>
                        <select value={filterCourse} onChange={e => setFilterCourse(e.target.value)}
                            style={{ ...inputStyle, width: 'auto', minWidth: '160px', cursor: 'pointer' }}>
                            <option value="">All Courses</option>
                            {courses.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                        </select>
                        <select value={filterTrainer} onChange={e => setFilterTrainer(e.target.value)}
                            style={{ ...inputStyle, width: 'auto', minWidth: '160px', cursor: 'pointer' }}>
                            <option value="">All Trainers</option>
                            {trainers.map(t => <option key={t.id} value={String(t.id)}>{t.first_name} {t.last_name}</option>)}
                        </select>
                        <select value={filterProgram} onChange={e => setFilterProgram(e.target.value)}
                            style={{ ...inputStyle, width: 'auto', minWidth: '120px', cursor: 'pointer' }}>
                            <option value="">All Programs</option>
                            <option value="JRP">JRP</option>
                            <option value="IOP">IOP</option>
                        </select>
                        {(filterBatch || filterCourse || filterTrainer || filterProgram) && (
                            <button onClick={() => { setFilterBatch(''); setFilterCourse(''); setFilterTrainer(''); setFilterProgram(''); }}
                                style={{ padding: '8px 12px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}>
                                Clear Filters
                            </button>
                        )}
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                            {filteredStudents.length} of {students.length} students
                        </span>
                    </div>

                    {showBulkUpload && (
                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}><Upload size={20} /> Bulk Enroll Students</h3>
                                <button
                                    onClick={async () => {
                                        const res = await superAdminAPI.downloadStudentTemplate();
                                        const url = URL.createObjectURL(new Blob([res.data]));
                                        const a = document.createElement('a');
                                        a.href = url; a.download = 'student_bulk_upload_template.csv'; a.click();
                                        URL.revokeObjectURL(url);
                                    }}
                                    style={{ padding: '8px 14px', borderRadius: '8px', background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                    ⬇ Download Sample CSV
                                </button>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                CSV columns: <code>first_name, last_name, email, phone, program_type (JRP/IOP), batch_id (optional), student_status (optional)</code>
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <input type="file" accept=".csv" ref={fileRef} onChange={handleCSVFile} style={{ ...inputStyle, maxWidth: '400px' }} />
                                {bulkData && (
                                    <button onClick={submitBulkUpload} style={{ padding: '10px 20px', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                                        Confirm & Upload {bulkData.length} Students
                                    </button>
                                )}
                            </div>
                            {bulkStatus && (
                                <p style={{ marginTop: '1rem', color: bulkStatus.startsWith('❌') ? '#ff6b6b' : '#51cf66', fontSize: '0.9rem' }}>{bulkStatus}</p>
                            )}
                            {bulkErrors.length > 0 && (
                                <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(255,107,107,0.08)', borderRadius: '8px', border: '1px solid rgba(255,107,107,0.2)' }}>
                                    <p style={{ margin: '0 0 6px', fontSize: '0.8rem', fontWeight: 700, color: '#ff6b6b' }}>{bulkErrors.length} rows failed:</p>
                                    {bulkErrors.map((e, i) => <p key={i} style={{ margin: '2px 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{e.email}: {e.error}</p>)}
                                </div>
                            )}
                            {bulkData && bulkData.length > 0 && (
                                <div style={{ marginTop: '1rem', overflowX: 'auto' }}>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Preview ({bulkData.length} rows):</p>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                {['first_name','last_name','email','phone','program_type','batch_id','student_status'].map(h => (
                                                    <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.7rem' }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bulkData.slice(0, 5).map((row, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                    {['first_name','last_name','email','phone','program_type','batch_id','student_status'].map(h => (
                                                        <td key={h} style={{ padding: '6px 10px', color: 'var(--text-main)' }}>{row[h] || '—'}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                            {bulkData.length > 5 && (
                                                <tr><td colSpan={7} style={{ padding: '6px 10px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>...and {bulkData.length - 5} more rows</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
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
                                {/* Program Type — JRP / IOP */}
                                <div style={{ gridColumn: editingStudentId ? 'span 1' : 'span 1' }}>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Program Type</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {['JRP', 'IOP'].map(pt => (
                                            <button key={pt} type="button" onClick={() => setStudentForm({ ...studentForm, program_type: pt })}
                                                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${studentForm.program_type === pt ? (pt === 'IOP' ? '#10b981' : 'var(--primary)') : 'var(--border-color)'}`, background: studentForm.program_type === pt ? (pt === 'IOP' ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)') : 'transparent', color: studentForm.program_type === pt ? (pt === 'IOP' ? '#10b981' : 'var(--primary)') : 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
                                                {pt === 'JRP' ? 'JRP (Job Readiness)' : 'IOP (Interview Opp.)'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
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
                                            <span style={{ marginLeft: '8px', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, background: s.program_type === 'IOP' ? 'rgba(16,185,129,0.12)' : 'rgba(59,130,246,0.12)', color: s.program_type === 'IOP' ? '#10b981' : '#3b82f6' }}>{s.program_type || 'JRP'}</span>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button onClick={() => setTransferModal({ show: true, studentId: s.id, newBatchId: '' })} style={{ padding: '4px 10px', borderRadius: '6px', background: '#ffb90020', border: '1px solid #ffb90040', color: '#ffb900', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>Transfer</button>
                                                <button onClick={() => { setEditingStudentId(s.id); setStudentForm({ first_name: s.first_name, last_name: s.last_name, email: s.email, phone: s.phone || '', status: s.status, student_status: s.student_status || 'Regular', program_type: s.program_type || 'JRP' }); setShowStudentForm(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><Pencil size={18} /></button>
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
                            {[
                                { key: 'all', label: 'All' },
                                { key: 'active', label: 'Active' },
                                { key: 'upcoming', label: 'Upcoming' },
                                { key: 'technical_class_completed', label: 'Tech Done' },
                                { key: 'completed', label: 'Completed' },
                            ].map(({ key, label }) => (
                                <button key={key} onClick={() => setBatchFilter(key)}
                                    style={{
                                        padding: '8px 18px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem',
                                        background: batchFilter === key ? 'var(--primary)' : 'var(--bg-surface)',
                                        color: batchFilter === key ? 'white' : 'var(--text-muted)',
                                        border: `1px solid ${batchFilter === key ? 'var(--primary)' : 'var(--border-color)'}`
                                    }}>
                                    {label}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => openNewCourse()}
                            style={{ padding: '10px 20px', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, cursor: 'pointer' }}>
                            <Plus size={18} /> New Batch
                        </button>
                    </div>

                    {showBatchForm && (
                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                            <h3 style={{ marginBottom: '1.5rem' }}>{editingBatchId ? 'Edit Course Details' : prefillBatchName ? `Add Course to "${prefillBatchName}"` : 'Create New Batch'}</h3>
                            <form onSubmit={handleBatchSubmit} className="grid-cols-2" style={{ display: 'grid', gap: '1rem' }}>
                                <input required placeholder="Batch Name (e.g. Batch 11)" value={batchForm.batch_name}
                                    onChange={e => setBatchForm({ ...batchForm, batch_name: e.target.value })}
                                    style={inputStyle} readOnly={!!prefillBatchName && !editingBatchId} />
                                <select required value={batchForm.course_id} onChange={e => setBatchForm({ ...batchForm, course_id: e.target.value })} style={inputStyle}>
                                    <option value="">Select Course</option>
                                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <select value={batchForm.trainer_id} onChange={e => setBatchForm({ ...batchForm, trainer_id: e.target.value })} style={inputStyle}>
                                    <option value="">Assign Technical Trainer</option>
                                    {trainers.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                                </select>
                                <select value={batchForm.iop_trainer_id || ''} onChange={e => setBatchForm({ ...batchForm, iop_trainer_id: e.target.value })} style={inputStyle}>
                                    <option value="">Assign IOP Trainer (optional)</option>
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
                                <select value={batchForm.status} onChange={e => setBatchForm({ ...batchForm, status: e.target.value })} style={inputStyle}>
                                    <option value="active">Active</option>
                                    <option value="upcoming">Upcoming</option>
                                    <option value="technical_class_completed">Technical Class Completed</option>
                                    <option value="completed">Completed</option>
                                </select>
                                <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                    <button type="button" onClick={() => { setShowBatchForm(false); setPrefillBatchName(''); }} style={{ padding: '10px 20px', borderRadius: '8px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>Cancel</button>
                                    <button type="submit" style={{ padding: '10px 25px', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Save</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Grouped batch list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {(() => {
                            const batchGroups = Object.entries(
                                filteredBatches.reduce((groups, batch) => {
                                    const key = batch.batch_name;
                                    if (!groups[key]) groups[key] = [];
                                    groups[key].push(batch);
                                    return groups;
                                }, {})
                            );
                            if (batchGroups.length === 0) return (
                                <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    No batches found.
                                </div>
                            );
                            return batchGroups.map(([batchName, batchCourses]) => {
                                const totalStudents = batchCourses.reduce((sum, c) => sum + (c.student_count || 0), 0);
                                const isExpanded = expandedGroups[batchName] !== false;
                                return (
                                    <div key={batchName} className="glass-card" style={{ overflow: 'hidden' }}>
                                        <div onClick={() => toggleGroup(batchName)}
                                            style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: 'var(--bg-surface)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                {isExpanded ? <ChevronDown size={18} color="var(--primary)" /> : <ChevronRight size={18} color="var(--text-muted)" />}
                                                <div>
                                                    <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{batchName}</span>
                                                    <span style={{ marginLeft: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                        {batchCourses.length} course{batchCourses.length !== 1 ? 's' : ''} · {totalStudents} student{totalStudents !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                            </div>
                                            <button onClick={e => { e.stopPropagation(); openNewCourse(batchName); }}
                                                style={{ padding: '6px 14px', borderRadius: '6px', background: 'var(--primary)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                                                <Plus size={14} /> Add Course
                                            </button>
                                        </div>
                                        {isExpanded && (
                                            <div>
                                                {batchCourses.map((b, idx) => (
                                                    <div key={b.id} style={{
                                                        padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center', gap: '12px',
                                                        borderTop: '1px solid var(--border-color)',
                                                        background: idx % 2 === 0 ? 'transparent' : 'var(--bg-dark)'
                                                    }}>
                                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColors[b.status] || '#868e96', flexShrink: 0 }} />
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 180, flex: '1' }}>
                                                            <BookOpen size={14} color="var(--primary)" />
                                                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{b.course_name}</span>
                                                        </div>
                                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'capitalize', minWidth: 130 }}>{b.timing} · {b.schedule_type}</span>
                                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', minWidth: 140 }}>
                                                            {b.trainer_name || 'No trainer'}
                                                            {b.iop_trainer_name && <span style={{ display: 'block', fontSize: '0.73rem', color: '#10b981' }}>IOP: {b.iop_trainer_name}</span>}
                                                        </span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 80 }}>
                                                            <Users size={13} color="var(--text-muted)" />
                                                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{b.student_count || 0}</span>
                                                        </div>
                                                        <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, background: `${statusColors[b.status] || '#868e96'}20`, color: statusColors[b.status] || '#868e96', textTransform: 'uppercase', minWidth: 80, textAlign: 'center' }}>{b.status}</span>
                                                        <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
                                                            <button onClick={() => openEdit(b)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}><Pencil size={15} /></button>
                                                            <button onClick={() => handleBatchDelete(b.id)} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', padding: 4 }}><Trash2 size={15} /></button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
};
