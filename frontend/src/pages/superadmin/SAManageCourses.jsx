import { useState, useEffect, useRef } from 'react';
import { superAdminAPI } from '../../services/api';
import { Plus, Pencil, Trash2, ChevronRight, ArrowLeft, BookOpen, FileText, ClipboardCheck, HelpCircle, ExternalLink, Save, UploadCloud, Folder, File, Film, Music, Image as ImageIcon, Download } from 'lucide-react';

const COLORS = ['#4c6ef5', '#15aabf', '#7950f2', '#51cf66', '#ffd43b', '#ff6b6b', '#e64980', '#fab005'];

const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const getFileIcon = (mimeType) => {
    if (!mimeType) return <File size={14} />;
    if (mimeType.includes('video')) return <Film size={14} />;
    if (mimeType.includes('audio')) return <Music size={14} />;
    if (mimeType.includes('image')) return <ImageIcon size={14} />;
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return <Folder size={14} />;
    return <File size={14} />;
};

const ContentUploader = ({ entityType, entityId, category, title, subtext, icon: Icon, files = [], onRefresh }) => {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const categoryFiles = files.filter(f => f.category === category);

    const handleUpload = async (e) => {
        if (!e.target.files.length) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('entity_type', entityType);
        formData.append('entity_id', entityId);
        formData.append('category', category);
        Array.from(e.target.files).forEach(file => {
            formData.append('files', file);
        });

        try {
            await superAdminAPI.uploadContentFiles(formData);
            onRefresh();
        } catch (err) {
            alert(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this file permanently?')) return;
        try {
            await superAdminAPI.deleteContentFile(id);
            onRefresh();
        } catch (err) {
            alert('Delete failed');
        }
    };

    return (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={18} />
                    </div>
                    <div>
                        <h4 style={{ fontWeight: 600, fontSize: '0.95rem' }}>{title}</h4>
                        {subtext && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{subtext}</p>}
                    </div>
                </div>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    style={{ padding: '6px 12px', borderRadius: '6px', background: 'var(--primary)', color: 'white', border: 'none', cursor: uploading ? 'wait' : 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}
                >
                    <UploadCloud size={14} /> {uploading ? 'Uploading...' : 'Upload Files'}
                </button>
                <input type="file" multiple ref={fileInputRef} onChange={handleUpload} style={{ display: 'none' }} />
            </div>

            {categoryFiles.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', background: 'var(--bg-dark)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No files uploaded yet.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {categoryFiles.map(f => (
                        <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-dark)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                                <span style={{ color: 'var(--text-muted)' }}>{getFileIcon(f.mime_type)}</span>
                                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '200px' }} title={f.original_name}>{f.original_name}</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{formatBytes(f.file_size)}</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <a href={`${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000'}/uploads/content/${f.stored_name}`} download={f.original_name} target="_blank" rel="noopener noreferrer"
                                    style={{ padding: '6px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '4px', display: 'flex' }}>
                                    <Download size={14} />
                                </a>
                                <button onClick={() => handleDelete(f.id)}
                                    style={{ border: 'none', padding: '6px', background: '#ff6b6b20', color: '#ff6b6b', borderRadius: '4px', cursor: 'pointer', display: 'flex' }}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export const SAManageCourses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('courses'); // 'courses' | 'modules' | 'module-details'
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedModule, setSelectedModule] = useState(null);
    const [activeTab, setActiveTab] = useState('days'); // 'days' | 'resources' | 'projects'

    // Core data caches
    const [modules, setModules] = useState([]);
    const [moduleDetails, setModuleDetails] = useState({ days: [], files: [], projects: [] });

    // Forms
    const [showCourseForm, setShowCourseForm] = useState(false);
    const [editCourseId, setEditCourseId] = useState(null);
    const [courseForm, setCourseForm] = useState({ name: '', description: '' });

    const [showModuleForm, setShowModuleForm] = useState(false);
    const [editModuleId, setEditModuleId] = useState(null);
    const [moduleForm, setModuleForm] = useState({ name: '', sequence_order: 1 });

    const [showDayForm, setShowDayForm] = useState(false);
    const [editDayId, setEditDayId] = useState(null);
    const [dayForm, setDayForm] = useState({ day_number: 1, topic_name: '' });

    const [showProjectForm, setShowProjectForm] = useState(false);
    const [editProjectId, setEditProjectId] = useState(null);
    const [projectForm, setProjectForm] = useState({ name: '', description: '' });

    const inputStyle = { padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none', fontSize: '0.9rem', width: '100%' };

    const fetchCourses = async () => {
        try { const res = await superAdminAPI.getCourses(); setCourses(res.data.courses); }
        catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchCourses(); }, []);

    // Course navigation
    const openCourse = async (course) => {
        setSelectedCourse(course);
        setView('modules');
        try { const res = await superAdminAPI.getModules(course.id); setModules(res.data.modules); }
        catch { setModules([]); }
    };

    // Full Module context navigation
    const openModule = async (mod) => {
        setSelectedModule(mod);
        setView('module-details');
        setActiveTab('days');
        refreshModuleDetails(mod.id);
    };

    const refreshModuleDetails = async (modId = selectedModule?.id) => {
        if (!modId) return;
        try {
            const [daysRes, filesRes, projectsRes] = await Promise.all([
                superAdminAPI.getDays(modId),
                superAdminAPI.getContentFiles('module', modId),
                superAdminAPI.getProjects(modId)
            ]);

            // For days, we need their specific files too. To keep it simple, we fetch day files dynamically upon render, 
            // OR we get them from the full tree. For now, we will fetch day files right here for all days.
            const daysWithFiles = await Promise.all(daysRes.data.days.map(async (d) => {
                const dfRes = await superAdminAPI.getContentFiles('day', d.id);
                return { ...d, files: dfRes.data.files };
            }));

            // Same for projects
            const projectsWithFiles = await Promise.all(projectsRes.data.projects.map(async (p) => {
                const pfRes = await superAdminAPI.getContentFiles('project', p.id);
                return { ...p, files: pfRes.data.files };
            }));

            setModuleDetails({ days: daysWithFiles, files: filesRes.data.files, projects: projectsWithFiles });
        } catch (e) { console.error("Error refreshing module specifics", e); }
    };

    // --- CRUD COURSES ---
    const submitCourse = async (e) => {
        e.preventDefault();
        try {
            if (editCourseId) await superAdminAPI.updateCourse(editCourseId, courseForm);
            else await superAdminAPI.createCourse(courseForm);
            setShowCourseForm(false); setEditCourseId(null); setCourseForm({ name: '', description: '' });
            fetchCourses();
        } catch (err) { alert(err.response?.data?.message || 'Error'); }
    };
    const editCourse = (c) => { setEditCourseId(c.id); setCourseForm({ name: c.name, description: c.description || '' }); setShowCourseForm(true); };
    const deleteCourse = async (id) => { if (!confirm('Delete this course?')) return; try { await superAdminAPI.deleteCourse(id); fetchCourses(); } catch { alert('Error'); } };

    // --- CRUD MODULES ---
    const submitModule = async (e) => {
        e.preventDefault();
        try {
            if (editModuleId) await superAdminAPI.updateModule(editModuleId, moduleForm);
            else await superAdminAPI.createModule({ ...moduleForm, course_id: selectedCourse.id });
            setShowModuleForm(false); setEditModuleId(null); setModuleForm({ name: '', sequence_order: modules.length + 1 });
            const res = await superAdminAPI.getModules(selectedCourse.id); setModules(res.data.modules);
        } catch (err) { alert(err.response?.data?.message || 'Error'); }
    };
    const editModule = (m) => { setEditModuleId(m.id); setModuleForm({ name: m.name, sequence_order: m.sequence_order }); setShowModuleForm(true); };
    const deleteModule = async (id) => {
        if (!confirm('Delete this module?')) return;
        try { await superAdminAPI.deleteModule(id); const res = await superAdminAPI.getModules(selectedCourse.id); setModules(res.data.modules); } catch { alert('Error'); }
    };

    // --- CRUD DAYS ---
    const submitDay = async (e) => {
        e.preventDefault();
        try {
            if (editDayId) await superAdminAPI.updateDay(editDayId, dayForm);
            else await superAdminAPI.createDay({ ...dayForm, module_id: selectedModule.id });
            setShowDayForm(false); setEditDayId(null); setDayForm({ day_number: moduleDetails.days.length + 1, topic_name: '' });
            refreshModuleDetails();
        } catch (err) { alert(err.response?.data?.message || 'Error'); }
    };
    const editDay = (d) => { setEditDayId(d.id); setDayForm({ day_number: d.day_number, topic_name: d.topic_name || '' }); setShowDayForm(true); };
    const deleteDay = async (id) => { if (!confirm('Delete this day?')) return; try { await superAdminAPI.deleteDay(id); refreshModuleDetails(); } catch { alert('Error'); } };

    // --- CRUD PROJECTS ---
    const submitProject = async (e) => {
        e.preventDefault();
        try {
            if (editProjectId) await superAdminAPI.updateProject(editProjectId, projectForm);
            else await superAdminAPI.createProject({ ...projectForm, module_id: selectedModule.id });
            setShowProjectForm(false); setEditProjectId(null); setProjectForm({ name: '', description: '' });
            refreshModuleDetails();
        } catch (err) { alert(err.response?.data?.message || 'Error'); }
    };
    const editProject = (p) => { setEditProjectId(p.id); setProjectForm({ name: p.name, description: p.description || '' }); setShowProjectForm(true); };
    const deleteProject = async (id) => { if (!confirm('Delete this project?')) return; try { await superAdminAPI.deleteProject(id); refreshModuleDetails(); } catch { alert('Error'); } };


    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><div className="spinner" /></div>;

    // ===========================
    // LEVEL 3: MODULE DETAILS UI
    // ===========================
    if (view === 'module-details' && selectedModule) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', flexWrap: 'wrap' }}>
                    <button onClick={() => { setView('courses'); setSelectedCourse(null); setSelectedModule(null); }}
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ArrowLeft size={14} /> All Courses
                    </button>
                    <ChevronRight size={14} color="var(--text-muted)" />
                    <button onClick={() => { setView('modules'); setSelectedModule(null); }}
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }}>
                        {selectedCourse.name}
                    </button>
                    <ChevronRight size={14} color="var(--text-muted)" />
                    <span style={{ color: 'var(--text-accent)', fontWeight: 600 }}>{selectedModule.name}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem' }}>Module {selectedModule.sequence_order}: {selectedModule.name}</h2>
                    </div>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        {['days', 'resources', 'projects'].map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)}
                                style={{
                                    background: 'none', border: 'none', fontSize: '0.95rem', fontWeight: activeTab === tab ? 600 : 500,
                                    color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer',
                                    position: 'relative', padding: '0 4px 10px 4px', marginBottom: '-17px'
                                }}>
                                {tab === 'days' && 'Curriculum (Days)'}
                                {tab === 'resources' && 'Module Resources'}
                                {tab === 'projects' && 'Projects'}
                                {activeTab === tab && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', borderRadius: '3px 3px 0 0', background: 'var(--primary)' }} />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* TAB 1: CURRICULUM (DAYS) */}
                {activeTab === 'days' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={() => { setShowDayForm(true); setEditDayId(null); setDayForm({ day_number: moduleDetails.days.length + 1, topic_name: '' }); }}
                                style={{ padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', background: 'var(--primary)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                                <Plus size={16} /> Add Day
                            </button>
                        </div>

                        {showDayForm && (
                            <div className="glass-card">
                                <h3>{editDayId ? 'Edit Day' : 'Add New Day'}</h3>
                                <form onSubmit={submitDay} style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'flex-end' }}>
                                    <div style={{ width: '80px' }}>
                                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Day #</label>
                                        <input required type="number" min="1" value={dayForm.day_number} onChange={e => setDayForm({ ...dayForm, day_number: e.target.value })} style={inputStyle} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Topic Name</label>
                                        <input required placeholder="Introduction to Arrays" value={dayForm.topic_name} onChange={e => setDayForm({ ...dayForm, topic_name: e.target.value })} style={inputStyle} />
                                    </div>
                                    <button type="submit" style={{ padding: '10px 18px', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, height: '42px' }}>Save</button>
                                    <button type="button" onClick={() => setShowDayForm(false)} style={{ padding: '10px 18px', borderRadius: '8px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)', cursor: 'pointer', height: '42px' }}>Cancel</button>
                                </form>
                            </div>
                        )}

                        {moduleDetails.days.length === 0 ? (
                            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}><p style={{ color: 'var(--text-muted)' }}>No days added to this module yet.</p></div>
                        ) : moduleDetails.days.map((d) => (
                            <div key={d.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <div style={{ width: 44, height: 44, borderRadius: '10px', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem', border: '1px solid var(--border-color)' }}>
                                            D{d.day_number}
                                        </div>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{d.topic_name}</h3>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => editDay(d)} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-main)', padding: '6px 10px' }}><Pencil size={14} /></button>
                                        <button onClick={() => deleteDay(d.id)} style={{ background: '#ff6b6b15', border: '1px solid #ff6b6b30', borderRadius: '6px', cursor: 'pointer', color: '#ff6b6b', padding: '6px 10px' }}><Trash2 size={14} /></button>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
                                    <ContentUploader entityType="day" entityId={d.id} category="material" title="Day Materials" subtext="Lectures, PDFs, PPTs" icon={BookOpen} files={d.files} onRefresh={refreshModuleDetails} />
                                    <ContentUploader entityType="day" entityId={d.id} category="worksheet" title="Worksheets" subtext="Practice questions, coding tasks" icon={ClipboardCheck} files={d.files} onRefresh={refreshModuleDetails} />
                                    <ContentUploader entityType="day" entityId={d.id} category="notes" title="Notes" subtext="Summary, cheatsheets" icon={FileText} files={d.files} onRefresh={refreshModuleDetails} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* TAB 2: MODULE RESOURCES */}
                {activeTab === 'resources' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
                        <ContentUploader entityType="module" entityId={selectedModule.id} category="study_material" title="Study Materials" subtext="Core files applicable to the entire module" icon={BookOpen} files={moduleDetails.files} onRefresh={refreshModuleDetails} />
                        <ContentUploader entityType="module" entityId={selectedModule.id} category="test" title="Module Tests" subtext="Datasets, exam questions, zip files" icon={ClipboardCheck} files={moduleDetails.files} onRefresh={refreshModuleDetails} />
                        <ContentUploader entityType="module" entityId={selectedModule.id} category="interview_questions" title="Interview Questions" subtext="Preparation materials" icon={HelpCircle} files={moduleDetails.files} onRefresh={refreshModuleDetails} />
                    </div>
                )}

                {/* TAB 3: PROJECTS */}
                {activeTab === 'projects' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={() => { setShowProjectForm(true); setEditProjectId(null); setProjectForm({ name: '', description: '' }); }}
                                style={{ padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', background: 'var(--primary)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                                <Plus size={16} /> Add Project
                            </button>
                        </div>

                        {showProjectForm && (
                            <div className="glass-card">
                                <h3>{editProjectId ? 'Edit Project' : 'Add New Project'}</h3>
                                <form onSubmit={submitProject} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Project Name</label>
                                        <input required placeholder="E-Commerce Sales Dashboard" value={projectForm.name} onChange={e => setProjectForm({ ...projectForm, name: e.target.value })} style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Description</label>
                                        <textarea rows={2} placeholder="Project requirements..." value={projectForm.description} onChange={e => setProjectForm({ ...projectForm, description: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                        <button type="button" onClick={() => setShowProjectForm(false)} style={{ padding: '10px 18px', borderRadius: '8px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>Cancel</button>
                                        <button type="submit" style={{ padding: '10px 18px', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Save Project</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {moduleDetails.projects.length === 0 ? (
                            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}><p style={{ color: 'var(--text-muted)' }}>No projects assigned to this module yet.</p></div>
                        ) : moduleDetails.projects.map(p => (
                            <div key={p.id} className="glass-card" style={{ padding: '1.5rem', borderLeft: '3px solid var(--primary)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.3rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>{p.name}</h3>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{p.description}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => editProject(p)} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-main)', padding: '6px 10px' }}><Pencil size={14} /></button>
                                        <button onClick={() => deleteProject(p.id)} style={{ background: '#ff6b6b15', border: '1px solid #ff6b6b30', borderRadius: '6px', cursor: 'pointer', color: '#ff6b6b', padding: '6px 10px' }}><Trash2 size={14} /></button>
                                    </div>
                                </div>
                                <ContentUploader entityType="project" entityId={p.id} category="project_files" title="Project Files" subtext="Datasets, requirement docs, template assets" icon={Folder} files={p.files} onRefresh={refreshModuleDetails} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // ===========================
    // LEVEL 2: MODULE LIST UI
    // ===========================
    if (view === 'modules' && selectedCourse) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                    <button onClick={() => { setView('courses'); setSelectedCourse(null); }}
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ArrowLeft size={14} /> All Courses
                    </button>
                    <ChevronRight size={14} color="var(--text-muted)" />
                    <span style={{ color: 'var(--text-accent)', fontWeight: 600 }}>{selectedCourse.name}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem' }}>📦 Modules: {selectedCourse.name}</h2>
                    </div>
                    <button onClick={() => { setShowModuleForm(true); setEditModuleId(null); setModuleForm({ name: '', sequence_order: modules.length + 1 }); }}
                        style={{ padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', background: 'var(--primary)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                        <Plus size={16} /> Add Module
                    </button>
                </div>

                {showModuleForm && (
                    <div className="glass-card">
                        <h3 style={{ marginBottom: '1rem', color: 'var(--text-accent)', fontSize: '1rem' }}>{editModuleId ? 'Edit Module' : 'Add New Module'}</h3>
                        <form onSubmit={submitModule} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                            <div style={{ width: '80px' }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Order</label>
                                <input required type="number" min="1" value={moduleForm.sequence_order} onChange={e => setModuleForm({ ...moduleForm, sequence_order: e.target.value })} style={inputStyle} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Module Name</label>
                                <input required placeholder="e.g. SQL Fundamentals" value={moduleForm.name} onChange={e => setModuleForm({ ...moduleForm, name: e.target.value })} style={inputStyle} />
                            </div>
                            <button type="button" onClick={() => { setShowModuleForm(false); setEditModuleId(null); }}
                                style={{ padding: '10px 18px', borderRadius: '8px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)', cursor: 'pointer', height: '42px' }}>Cancel</button>
                            <button type="submit" style={{ padding: '10px 18px', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, height: '42px' }}>
                                {editModuleId ? 'Save' : 'Add'}
                            </button>
                        </form>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {modules.length === 0 ? (
                        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>No modules yet.</p>
                        </div>
                    ) : modules.map((m, idx) => {
                        const color = COLORS[idx % COLORS.length];
                        return (
                            <div key={m.id} className="glass-card" style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s', padding: '1.2rem' }}
                                onClick={() => openModule(m)}
                                onMouseOver={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                        <div style={{ width: 50, height: 50, borderRadius: '12px', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color, fontSize: '1.1rem' }}>
                                            M{m.sequence_order}
                                        </div>
                                        <div>
                                            <h3 style={{ fontWeight: 600, fontSize: '1.2rem', marginBottom: '4px' }}>{m.name}</h3>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--bg-dark)', padding: '4px 8px', borderRadius: '6px' }}>Manage Days, Resources & Projects</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                                        <button onClick={() => editModule(m)} style={{ background: 'var(--bg-dark)', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '8px', borderRadius: '6px' }}><Pencil size={16} /></button>
                                        <button onClick={() => deleteModule(m.id)} style={{ background: '#ff6b6b15', border: 'none', cursor: 'pointer', color: '#ff6b6b', padding: '8px', borderRadius: '6px' }}><Trash2 size={16} /></button>
                                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '8px' }}>
                                            <ChevronRight size={18} color={color} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // ===========================
    // LEVEL 1: COURSE LIST
    // ===========================
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem' }}>Course Management</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>Build and manage curriculum: Courses → Modules → Days & Projects</p>
                </div>
                <button onClick={() => { setShowCourseForm(true); setEditCourseId(null); setCourseForm({ name: '', description: '' }); }}
                    style={{ padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', background: 'var(--primary)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                    <Plus size={16} /> Add Course
                </button>
            </div>

            {/* Course Form */}
            {showCourseForm && (
                <div className="glass-card">
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-accent)', fontSize: '1rem' }}>{editCourseId ? 'Edit Course' : 'Add New Course'}</h3>
                    <form onSubmit={submitCourse} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Course Name</label>
                            <input required placeholder="e.g. Data Analytics, MERN Stack, Digital Marketing" value={courseForm.name} onChange={e => setCourseForm({ ...courseForm, name: e.target.value })} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Description</label>
                            <textarea rows={3} placeholder="Brief description of the course..." value={courseForm.description} onChange={e => setCourseForm({ ...courseForm, description: e.target.value })}
                                style={{ ...inputStyle, resize: 'vertical' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => { setShowCourseForm(false); setEditCourseId(null); }}
                                style={{ padding: '10px 18px', borderRadius: '8px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>Cancel</button>
                            <button type="submit" style={{ padding: '10px 18px', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                                {editCourseId ? 'Save Changes' : 'Create Course'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Course Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
                {courses.length === 0 ? (
                    <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
                        <BookOpen size={40} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '0.5rem' }}>No courses created yet</p>
                    </div>
                ) : courses.map((c, idx) => {
                    const color = COLORS[idx % COLORS.length];
                    return (
                        <div key={c.id} className="glass-card" style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.25s' }}
                            onClick={() => openCourse(c)}
                            onMouseOver={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '4px' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '0.75rem' }}>
                                    <div style={{ width: 48, height: 48, borderRadius: '12px', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <BookOpen size={22} color={color} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontWeight: 600, fontSize: '1.05rem' }}>{c.name}</h3>
                                        {c.description && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px' }}>{c.description.substring(0, 60)}{c.description.length > 60 ? '...' : ''}</p>}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                                    <button onClick={() => editCourse(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><Pencil size={14} /></button>
                                    <button onClick={() => deleteCourse(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff6b6b' }}><Trash2 size={14} /></button>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                                <div style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'var(--bg-surface)', textAlign: 'center' }}>
                                    <p style={{ fontSize: '1.3rem', fontWeight: 700, color }}>{c.module_count || 0}</p>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Modules</p>
                                </div>
                                <div style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Open Course</span>
                                        <ChevronRight size={16} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
