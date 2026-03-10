import React, { useState, useEffect } from 'react';
import { jobAPI, superAdminAPI } from '../../services/api';
import { Plus, Briefcase, Building, Clock, Users, ExternalLink, IndianRupee, Layers } from 'lucide-react';

const RecruiterJobs = () => {
    const [jobs, setJobs] = useState([]);
    const [courses, setCourses] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState('all');
    const [applicants, setApplicants] = useState([]);
    const [viewingApplicantsFor, setViewingApplicantsFor] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        company_name: '',
        description: '',
        course_id: '',
        ctc: '',
        experience_level: 'Both',
        apply_link: '',
        deadline_date: ''
    });

    const fetchData = async () => {
        try {
            const [jobsRes, coursesRes] = await Promise.all([
                jobAPI.getJobs({ course_id: selectedCourse }),
                superAdminAPI.getCourses()
            ]);
            setJobs(jobsRes.data);
            setCourses(coursesRes.data.courses);
        } catch (err) {
            console.error('Data fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedCourse]);

    const fetchApplicants = async (job) => {
        try {
            setViewingApplicantsFor(job);
            const res = await jobAPI.getJobApplicants(job.id);
            setApplicants(res.data);
        } catch (err) {
            console.error('Error fetching applicants:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await jobAPI.createJob(formData);
            setIsModalOpen(false);
            setFormData({ title: '', company_name: '', description: '', course_id: '', ctc: '', experience_level: 'Both', apply_link: '', deadline_date: '' });
            fetchData();
        } catch (err) {
            alert('Error posting job');
        }
    };

    const handleUpdateStatus = async (job, updates) => {
        try {
            await jobAPI.updateJob(job.id, {
                ...job,
                ...updates
            });
            fetchData();
        } catch (err) {
            alert('Error updating job status');
        }
    };

    if (loading) return <div className="p-6">Loading Jobs...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-main">Job Postings</h1>
                    <p className="text-secondary">Manage and track recruitment opportunities</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <Plus size={20} /> Post Detailed Job
                </button>
            </div>

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Layers size={20} className="text-main" /> Recent Postings
                </h2>
                <div className="flex items-center gap-2 bg-secondary/5 p-1 rounded-lg">
                    <span className="text-xs text-muted px-2">Filter:</span>
                    <select
                        className="text-xs bg-transparent border-none outline-none font-bold text-main cursor-pointer"
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                    >
                        <option value="all">All Courses</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.map(job => (
                    <div key={job.id} className={`card p-5 hover:border-main transition-colors group ${job.status !== 'Open' ? 'opacity-70 bg-secondary/5' : ''}`}>
                        <div className="flex justify-between items-start">
                            <div className="flex gap-4">
                                <div className={`w-12 h-12 rounded flex items-center justify-center font-bold ${job.status === 'Open' ? 'bg-main/10 text-main' : 'bg-muted/10 text-muted'}`}>
                                    {job.company_name.charAt(0)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-main truncate max-w-[150px]">{job.title}</h3>
                                        {job.status === 'Hired' && <span className="badge badge-success text-[10px]">HIRED {job.hired_count}</span>}
                                        {job.status === 'Closed' && <span className="badge badge-error text-[10px]">CLOSED</span>}
                                    </div>
                                    <p className="text-sm text-secondary truncate">{job.company_name} • {job.course_name}</p>
                                </div>
                            </div>
                            <div
                                className="text-right cursor-pointer hover:bg-main/5 p-2 rounded transition-colors"
                                onClick={() => fetchApplicants(job)}
                            >
                                <div className="text-lg font-bold text-main">{job.app_count}</div>
                                <div className="text-xs text-muted flex items-center gap-1">
                                    Apps <ExternalLink size={10} />
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-secondary border-t border-subtle pt-3">
                            <span className="flex items-center gap-1"><IndianRupee size={12} /> {job.ctc || 'N/A'}</span>
                            <span className="flex items-center gap-1"><Users size={12} /> {job.experience_level}</span>
                            <span className="flex items-center gap-1"><Clock size={12} /> {new Date(job.created_at).toLocaleDateString()}</span>
                            {job.deadline_date && (
                                <span className={`flex items-center gap-1 font-bold ${new Date(job.deadline_date) <= new Date() ? 'text-red-500' : 'text-orange-500'}`}>
                                    <Clock size={12} /> Deadline: {new Date(job.deadline_date).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                            {job.status === 'Open' ? (
                                <>
                                    <button
                                        onClick={() => {
                                            const count = prompt("How many students were hired?", "1");
                                            if (count !== null) handleUpdateStatus(job, { status: 'Hired', hired_count: parseInt(count) });
                                        }}
                                        className="btn btn-primary text-[10px] py-1 px-3"
                                    >
                                        Mark as Hired
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(job, { status: 'Closed' })}
                                        className="btn btn-secondary text-[10px] py-1 px-3"
                                    >
                                        Close Posting
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => handleUpdateStatus(job, { status: 'Open' })}
                                    className="btn btn-outline text-[10px] py-1 px-3"
                                >
                                    Re-open Posting
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modals copied from Dashboard */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content max-w-2xl w-full">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Post New Opportunity</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-main text-2xl">&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Job Title</label>
                                    <input type="text" className="input" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Frontend Engineer" />
                                </div>
                                <div>
                                    <label className="label">Company Name</label>
                                    <input type="text" className="input" required value={formData.company_name} onChange={e => setFormData({ ...formData, company_name: e.target.value })} placeholder="e.g. Acme Corp" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Target Course</label>
                                    <select className="select" required value={formData.course_id} onChange={e => setFormData({ ...formData, course_id: e.target.value })}>
                                        <option value="">Select a Course</option>
                                        {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">CTC / Package</label>
                                    <input type="text" className="input" value={formData.ctc} onChange={e => setFormData({ ...formData, ctc: e.target.value })} placeholder="e.g. 6-8 LPA" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Experience Level</label>
                                    <select className="select" value={formData.experience_level} onChange={e => setFormData({ ...formData, experience_level: e.target.value })}>
                                        <option value="Fresher">Fresher</option>
                                        <option value="Experienced">Experienced</option>
                                        <option value="Both">Both</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Internal/External Apply Link</label>
                                    <input type="url" className="input" required value={formData.apply_link} onChange={e => setFormData({ ...formData, apply_link: e.target.value })} placeholder="https://..." />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Application Deadline</label>
                                    <input type="date" className="input" value={formData.deadline_date} onChange={e => setFormData({ ...formData, deadline_date: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="label">Detailed Description</label>
                                <textarea className="textarea" rows="4" required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Key responsibilities, skills required, etc."></textarea>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-subtle">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary px-6">Discard</button>
                                <button type="submit" className="btn btn-primary px-8">Publish Recruitment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {viewingApplicantsFor && (
                <div className="modal-overlay">
                    <div className="modal-content max-w-3xl w-full">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold">Applicants for {viewingApplicantsFor.title}</h2>
                                <p className="text-secondary text-sm">{viewingApplicantsFor.company_name}</p>
                            </div>
                            <button onClick={() => setViewingApplicantsFor(null)} className="text-muted hover:text-main text-2xl">&times;</button>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto">
                            {applicants.length === 0 ? (
                                <div className="py-10 text-center text-muted">No applications recorded yet.</div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="bg-secondary/5 text-xs text-muted uppercase font-bold sticky top-0">
                                        <tr>
                                            <th className="p-3">Student Name</th>
                                            <th className="p-3">Batch</th>
                                            <th className="p-3">Contact</th>
                                            <th className="p-3">Applied At</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-subtle">
                                        {applicants.map(app => (
                                            <tr key={app.id} className="hover:bg-main/5 transition-colors">
                                                <td className="p-3">
                                                    <div className="font-bold text-main">{app.first_name} {app.last_name}</div>
                                                </td>
                                                <td className="p-3 text-sm text-secondary">{app.batch_name || 'N/A'}</td>
                                                <td className="p-3 text-sm">
                                                    <div>{app.email}</div>
                                                    <div className="text-muted">{app.phone}</div>
                                                </td>
                                                <td className="p-3 text-xs text-secondary">
                                                    {new Date(app.applied_at).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecruiterJobs;
