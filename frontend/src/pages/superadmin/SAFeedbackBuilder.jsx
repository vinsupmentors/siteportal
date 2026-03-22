import { useState, useEffect } from 'react';
import { superAdminAPI } from '../../services/api';
import {
    Plus, Trash2, Save, Type, Star, CheckSquare,
    List, ArrowDownCircle, Layout, AlertCircle, CheckCircle,
    ChevronLeft, GripVertical, Settings2, Trash
} from 'lucide-react';

export const SAFeedbackBuilder = () => {
    const [modules, setModules] = useState([]);
    const [forms, setForms] = useState([]);
    const [courses, setCourses] = useState([]);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // 'list' or 'create'
    const [saving, setSaving] = useState(false);

    // Form Builder State
    const [newForm, setNewForm] = useState({
        module_id: '',
        title: '',
        fields: [
            { id: Date.now(), type: 'star', label: 'Rate your satisfaction', required: true }
        ]
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [courseRes, formRes] = await Promise.all([
                superAdminAPI.getCourses(),
                superAdminAPI.getFeedbackForms()
            ]);
            setForms(formRes.data.forms);
            setCourses(courseRes.data.courses);
        } catch (err) {
            console.error('Error fetching builder data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedCourseId) {
            superAdminAPI.getModules(selectedCourseId)
                .then(res => setModules(res.data.modules))
                .catch(err => console.error('Error fetching modules', err));
        } else {
            setModules([]);
        }
    }, [selectedCourseId]);

    const addField = (type) => {
        const field = {
            id: Date.now(),
            type,
            label: '',
            required: true,
            options: ['radio', 'checkbox', 'dropdown'].includes(type) ? ['Option 1'] : []
        };
        setNewForm(prev => ({ ...prev, fields: [...prev.fields, field] }));
    };

    const updateField = (id, updates) => {
        setNewForm(prev => ({
            ...prev,
            fields: prev.fields.map(f => f.id === id ? { ...f, ...updates } : f)
        }));
    };

    const removeField = (id) => {
        setNewForm(prev => ({
            ...prev,
            fields: prev.fields.filter(f => f.id !== id)
        }));
    };

    const handleSave = async () => {
        if (!newForm.title || !newForm.module_id) {
            alert('Please provide a title and select a module');
            return;
        }
        setSaving(true);
        try {
            await superAdminAPI.createFeedbackForm({
                module_id: newForm.module_id,
                title: newForm.title,
                form_json: { fields: newForm.fields }
            });
            setView('list');
            fetchData();
            setNewForm({ module_id: '', title: '', fields: [{ id: Date.now(), type: 'star', label: '', required: true }] });
        } catch (err) {
            alert('Error saving form');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex-center p-20"><div className="spinner" /></div>;

    return (
        <div className="p-8 max-w-1400 mx-auto animate-fade-in">
            {/* Header Section */}
            <div className="flex justify-between items-end mb-10 border-b border-gray-800 pb-8">
                <div>
                    <h2 className="text-4xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
                        Feedback Form Builder
                    </h2>
                    <p className="text-gray-500 font-medium">Design professional, interactive forms for your modules</p>
                </div>
                {view === 'list' ? (
                    <button className="btn-primary px-8 py-3 rounded-2xl flex items-center gap-2 transform hover:scale-105 transition-all shadow-lg shadow-blue-500/20" onClick={() => setView('create')}>
                        <Plus size={20} /> Create New Form
                    </button>
                ) : (
                    <button className="px-6 py-2.5 rounded-xl border border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800 transition-all font-bold flex items-center gap-2" onClick={() => setView('list')}>
                        <ChevronLeft size={20} /> Back to Dashboard
                    </button>
                )}
            </div>

            {view === 'list' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {forms.map(form => (
                        <div key={form.id} className="glass-card p-8 border border-gray-800 hover:border-blue-500 transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Layout size={80} />
                            </div>
                            <div className="relative z-10">
                                <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400 w-fit mb-6">
                                    <Layout size={28} />
                                </div>
                                <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors uppercase tracking-tight">{form.title}</h3>
                                <div className="flex items-center gap-2 text-sm text-gray-500 mb-8 font-medium">
                                    <Settings2 size={14} />
                                    <span>Module: {form.module_name || 'General'}</span>
                                </div>
                                <div className="flex items-center justify-between pt-6 border-t border-gray-800">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                        <span className="text-xs font-bold text-gray-400 uppercase">{(typeof form.form_json === 'string' ? JSON.parse(form.form_json) : form.form_json).fields.length} Questions</span>
                                    </div>
                                    <span className="text-xs text-gray-600 font-mono">{new Date(form.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {forms.length === 0 && (
                        <div className="col-span-full py-32 text-center glass-card border-dashed border-2 border-gray-800">
                            <AlertCircle size={64} className="mx-auto mb-6 text-gray-700" />
                            <h4 className="text-xl font-bold text-gray-400 mb-2">Build Your First Form</h4>
                            <p className="text-gray-600 max-w-sm mx-auto">Get started by clicking the "Create New Form" button above to design your dynamic module feedback.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12 items-start">
                    {/* Editor Side */}
                    <div className="space-y-8 animate-slide-up">
                        <div className="glass-card p-10 space-y-8 border-l-4 border-blue-500 shadow-2xl">
                            <div className="space-y-3">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Form Identity</label>
                                <input
                                    className="bg-transparent text-3xl font-black w-full border-none focus:ring-0 p-0 placeholder:text-gray-800"
                                    placeholder="Click to name your form..."
                                    value={newForm.title}
                                    onChange={e => setNewForm({ ...newForm, title: e.target.value })}
                                />
                            </div>
                            <div className="pt-8 border-t border-gray-800/50 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Target Course</label>
                                    <select
                                        className="form-input w-full bg-gray-900/50 border-gray-800 rounded-xl py-3"
                                        value={selectedCourseId}
                                        onChange={e => setSelectedCourseId(e.target.value)}
                                    >
                                        <option value="">Select a Course...</option>
                                        {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Target Module</label>
                                    <select
                                        className="form-input w-full bg-gray-900/50 border-gray-800 rounded-xl py-3"
                                        value={newForm.module_id}
                                        onChange={e => setNewForm({ ...newForm, module_id: e.target.value })}
                                        disabled={!selectedCourseId}
                                    >
                                        <option value="">Select a Module...</option>
                                        {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {newForm.fields.map((field, index) => (
                                <div key={field.id} className="glass-card p-8 group border border-gray-800 hover:border-gray-600 transition-all relative overflow-hidden animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-800 group-hover:bg-blue-500 transition-colors"></div>

                                    <div className="flex gap-6 items-start">
                                        <div className="p-3 bg-gray-900 rounded-xl text-gray-500 group-hover:text-blue-400 transition-colors shadow-inner">
                                            {field.type === 'star' && <Star size={20} />}
                                            {field.type === 'short' && <Type size={20} />}
                                            {field.type === 'paragraph' && <Layout size={20} />}
                                            {field.type === 'radio' && <ArrowDownCircle size={20} />}
                                            {field.type === 'checkbox' && <CheckSquare size={20} />}
                                            {field.type === 'dropdown' && <List size={20} />}
                                        </div>

                                        <div className="flex-1 space-y-6">
                                            <div className="flex gap-4">
                                                <input
                                                    className="bg-transparent text-lg font-bold w-full border-none focus:ring-0 p-0 placeholder:text-gray-700"
                                                    placeholder="Enter your question here..."
                                                    value={field.label}
                                                    onChange={e => updateField(field.id, { label: e.target.value })}
                                                />
                                                <button
                                                    onClick={() => removeField(field.id)}
                                                    className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>

                                            {['radio', 'checkbox', 'dropdown'].includes(field.type) && (
                                                <div className="space-y-3 pl-6 border-l-2 border-gray-800">
                                                    {field.options.map((opt, oIdx) => (
                                                        <div key={oIdx} className="flex gap-3 group/opt">
                                                            <div className="w-5 h-5 rounded-full border-2 border-gray-700 mt-2 flex-shrink-0"></div>
                                                            <input
                                                                className="bg-gray-900/40 border border-gray-800/50 rounded-lg py-2 px-4 text-sm w-full focus:border-blue-500 transition-all"
                                                                value={opt}
                                                                onChange={e => {
                                                                    const newOpts = [...field.options];
                                                                    newOpts[oIdx] = e.target.value;
                                                                    updateField(field.id, { options: newOpts });
                                                                }}
                                                            />
                                                            <button
                                                                className="opacity-0 group-hover/opt:opacity-100 p-2 text-gray-600 hover:text-red-500 transition-all"
                                                                onClick={() => {
                                                                    const newOpts = field.options.filter((_, i) => i !== oIdx);
                                                                    updateField(field.id, { options: newOpts });
                                                                }}
                                                            >
                                                                <Trash size={14} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button
                                                        className="flex items-center gap-2 text-blue-400 text-xs font-black uppercase tracking-widest py-2 px-4 hover:bg-blue-500/10 rounded-lg transition-all"
                                                        onClick={() => updateField(field.id, { options: [...field.options, `Option ${field.options.length + 1}`] })}
                                                    >
                                                        <Plus size={14} /> Add Option
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Toolbar Side */}
                    <div className="space-y-6 sticky top-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                        <div className="glass-card p-8 space-y-6 shadow-2xl border-t-4 border-gray-800">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4">Question Toolbox</p>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { type: 'star', icon: <Star size={18} />, label: 'Star Rating', color: 'text-amber-400' },
                                    { type: 'radio', icon: <ArrowDownCircle size={18} />, label: 'Radio', color: 'text-blue-400' },
                                    { type: 'checkbox', icon: <CheckSquare size={18} />, label: 'Checkbox', color: 'text-green-400' },
                                    { type: 'dropdown', icon: <List size={18} />, label: 'Dropdown', color: 'text-purple-400' },
                                    { type: 'short', icon: <Type size={18} />, label: 'Short Text', color: 'text-pink-400' },
                                    { type: 'paragraph', icon: <Layout size={18} />, label: 'Paragraph', color: 'text-indigo-400' }
                                ].map(btn => (
                                    <button
                                        key={btn.type}
                                        className="flex flex-col items-center justify-center gap-3 p-4 bg-gray-900 border border-gray-800 rounded-2xl hover:border-blue-500 hover:bg-blue-500/5 transition-all group"
                                        onClick={() => addField(btn.type)}
                                    >
                                        <div className={`${btn.color} group-hover:scale-110 transition-transform`}>{btn.icon}</div>
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-white transition-colors">{btn.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            className="w-full py-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-black text-lg shadow-2xl shadow-blue-500/30 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? <div className="spinner-small" /> : <Save size={24} />}
                            {saving ? 'Publishing...' : 'Publish Form'}
                        </button>

                        <div className="p-6 rounded-2xl border border-gray-800 bg-gray-900/30 flex items-start gap-4">
                            <AlertCircle size={20} className="text-gray-600 mt-1 flex-shrink-0" />
                            <p className="text-xs text-gray-500 leading-relaxed font-medium">
                                Forms are stored module-wise. Once published, trainers can release them via the calendar interface.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
