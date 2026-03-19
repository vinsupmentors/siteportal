import React, { useState, useEffect } from 'react';
import { jobAPI, studentAPI, recruiterAPI } from '../../services/api';
import { Lock, CheckCircle, XCircle, Briefcase, Building, Clock, MapPin, Search, Upload, ExternalLink, IndianRupee, Rocket, Calendar, AlertCircle } from 'lucide-react';

const IOP_STATUS_META = {
    scheduled:   { label: 'Scheduled',   bg: 'rgba(59,130,246,0.12)',  color: '#3b82f6' },
    in_progress: { label: 'In Progress', bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
    placed:      { label: 'Placed ✓',    bg: 'rgba(16,185,129,0.12)', color: '#10b981' },
    rejected:    { label: 'Rejected ✗',  bg: 'rgba(239,68,68,0.12)',  color: '#ef4444' },
};

const StudentJobPortal = () => {
    const [eligibility, setEligibility] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [careerData, setCareerData] = useState(null);
    const [interviews, setInterviews] = useState([null, null, null]);
    const [formData, setFormData] = useState({
        portfolio_link: '',
        google_review_img: null,
        bypass_reason: ''
    });

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const res = await jobAPI.getEligibility();
            setEligibility(res.data);
            if (res.data.status === 'unlocked' || res.data.status === 'Approved') {
                const jobsRes = await jobAPI.getStudentJobs();
                setJobs(jobsRes.data);
            }
            // Fetch career data for IOP pipeline (works for all students, shows IOP section if applicable)
            const careerRes = await studentAPI.getInternshipEligibility().catch(() => ({ data: null }));
            if (careerRes.data) {
                setCareerData(careerRes.data);
                if (careerRes.data.program_type === 'IOP') {
                    // Get student ID from token
                    const token = localStorage.getItem('token');
                    if (token) {
                        const payload = JSON.parse(atob(token.split('.')[1]));
                        const intRes = await recruiterAPI.getStudentInterviews(payload.id).catch(() => ({ data: { interviews: [null, null, null] } }));
                        setInterviews(intRes.data?.interviews || [null, null, null]);
                    }
                }
            }
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async (job) => {
        try {
            // Track application first
            await jobAPI.applyJob(job.id);
            // Open apply link in new tab
            window.open(job.apply_link, '_blank');
            // Refresh counts locally or fetch again
            fetchStatus();
        } catch (err) {
            console.error('Apply tracking error:', err);
        }
    };

    const handleFileChange = (e) => {
        setFormData({ ...formData, google_review_img: e.target.files[0] });
    };

    const handleSubmitRequest = async (e) => {
        e.preventDefault();
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('portfolio_link', formData.portfolio_link);
            fd.append('google_review_img', formData.google_review_img);
            if (formData.bypass_reason) {
                fd.append('bypass_reason', formData.bypass_reason);
            }
            await jobAPI.submitRequest(fd);
            fetchStatus();
        } catch (err) {
            alert('Submission failed');
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className="p-6">Verifying Job Eligibility...</div>;

    if (!eligibility) {
        return <div className="p-6">Unable to verify eligibility at this time. Please contact support.</div>;
    }

    const isUnlocked = eligibility.status === 'unlocked' || eligibility.status === 'Approved';
    const isPending = eligibility.status === 'Pending';
    const canRequest = eligibility.canRequest;

    if (!isUnlocked) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-main/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock size={40} className="text-main" />
                    </div>
                    <h1 className="text-3xl font-bold text-main">Placement Assistance Portal</h1>
                    <p className="text-secondary mt-2">Unlock your career opportunities by completing the following criteria.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <div className="card p-6">
                        <h3 className="text-lg font-bold mb-4">Core Performance Metrics</h3>
                        <div className="space-y-4">
                            <Criterion
                                label="Attendance"
                                current={`${eligibility.criteria.attendance.value}%`}
                                target="80%"
                                met={eligibility.criteria.attendance.met}
                            />
                            <Criterion
                                label="Module Projects"
                                current={`${eligibility.criteria.projects.value}%`}
                                target="75%"
                                met={eligibility.criteria.projects.met}
                            />
                            <Criterion
                                label="Capstone Projects"
                                current={eligibility.criteria.capstone.value}
                                target="Min 1"
                                met={eligibility.criteria.capstone.met}
                            />
                            <Criterion
                                label="Test Attendance"
                                current={`${eligibility.criteria.tests?.value || 0}%`}
                                target="100%"
                                met={eligibility.criteria.tests?.met}
                            />
                            <Criterion
                                label="Module Feedback Forms"
                                current={`${eligibility.criteria.feedback?.value || 0}%`}
                                target="100%"
                                met={eligibility.criteria.feedback?.met}
                            />
                            <Criterion
                                label="Portfolio Generation"
                                current={eligibility.criteria.portfolio.met ? 'Completed' : 'Pending'}
                                target="Approved"
                                met={eligibility.criteria.portfolio.met}
                            />
                            
                            {!canRequest && (
                                <div className="mt-4 p-4 bg-red-400/10 border border-red-400/20 rounded-lg text-sm text-red-400">
                                    <p className="font-bold flex items-center gap-2 mb-2"><XCircle size={16}/> Criteria Not Met</p>
                                    <p className="text-xs">You have not met all the criteria required for automatic Job Portal unlocking. However, you may submit a <strong>Bypass Request</strong> below and explain your reason to the SuperAdmin.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card p-6 bg-gradient-to-br from-main/5 to-transparent">
                        <h3 className="text-lg font-bold mb-4">Verification & Unlocking</h3>
                        {isPending ? (
                            <div className="text-center py-8">
                                <Clock size={48} className="text-yellow-500 mx-auto mb-4 animate-pulse" />
                                <h4 className="font-bold text-yellow-500">Awaiting SuperAdmin Approval</h4>
                                <p className="text-sm text-secondary mt-2">Your request is being verified. Check back soon!</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmitRequest} className="space-y-4">
                                <div>
                                    <label className="label">Public Portfolio Link / QR URL</label>
                                    <input
                                        type="url"
                                        className="input"
                                        placeholder="https://yourportfolio.com"
                                        required
                                        value={formData.portfolio_link}
                                        onChange={e => setFormData({ ...formData, portfolio_link: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="label">Google Review Screenshot</label>
                                    <div className="relative border-2 border-dashed border-subtle rounded-lg p-4 text-center cursor-pointer hover:bg-main/5 transition-colors">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            required
                                            onChange={handleFileChange}
                                        />
                                        <Upload size={24} className="mx-auto text-secondary mb-2" />
                                        <p className="text-xs text-secondary">{formData.google_review_img ? formData.google_review_img.name : 'Upload Screenshot of your Google Review'}</p>
                                    </div>
                                </div>
                                {!canRequest && (
                                    <div>
                                        <label className="label text-red-400">Reason for Bypass Request *</label>
                                        <textarea
                                            className="input text-sm border-red-400/50 focus:border-red-400 bg-red-400/5"
                                            rows="3"
                                            required
                                            placeholder="Explain why you have not met the criteria and why you should be granted access."
                                            value={formData.bypass_reason}
                                            onChange={e => setFormData({ ...formData, bypass_reason: e.target.value })}
                                        />
                                    </div>
                                )}
                                <button disabled={uploading} className={`btn w-full py-3 ${!canRequest ? 'bg-red-500 hover:bg-red-600 border-none' : 'btn-primary'}`}>
                                    {uploading ? 'Submitting...' : !canRequest ? 'Submit Bypass Request' : 'Request Job Portal Access'}
                                </button>
                                {!canRequest && (
                                    <p className="text-xs text-center text-red-400 mt-2 italic">
                                        This request will be marked as a special bypass request and will require additional review.
                                    </p>
                                )}
                            </form>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    const handleDownloadCertificate = async () => {
        try {
            const res = await jobAPI.downloadCertificate();
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Internship_Certificate.pdf');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            alert('Failed to download internship certificate. You must be approved for the job portal.');
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-main">Recommended Jobs</h1>
                    <p className="text-secondary">Exclusive career opportunities curated for your course</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={handleDownloadCertificate} className="btn btn-secondary flex items-center gap-2">
                        <Briefcase size={14} /> Download Internship Certificate
                    </button>
                    <div className="badge badge-success px-4 py-2 flex items-center gap-2 h-full">
                        <CheckCircle size={14} /> Verified Student Profile
                    </div>
                </div>
            </div>

            {/* IOP Interview Pipeline — only for IOP students */}
            {careerData?.program_type === 'IOP' && (
                <div className="card p-6 mb-8">
                    <div className="flex items-center gap-3 mb-5">
                        <Rocket size={20} className="text-green-400" />
                        <div>
                            <h3 className="font-bold text-main">IOP Interview Pipeline</h3>
                            <p className="text-xs text-muted">Your 3-interview journey — tracked by your placement officer</p>
                        </div>
                        {careerData.ready_for_interview && careerData.course_completion_date && (() => {
                            const deadline = new Date(careerData.course_completion_date);
                            deadline.setDate(deadline.getDate() + 90);
                            const daysLeft = Math.max(0, Math.round((deadline - new Date()) / (1000 * 60 * 60 * 24)));
                            return (
                                <div style={{ marginLeft: 'auto', padding: '6px 12px', borderRadius: '999px', background: daysLeft < 30 ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)', color: daysLeft < 30 ? '#ef4444' : '#f59e0b', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Clock size={13} /> {daysLeft} days remaining
                                </div>
                            );
                        })()}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[0, 1, 2].map(i => {
                            const interview = interviews[i];
                            const num = i + 1;
                            const meta = interview ? (IOP_STATUS_META[interview.status] || IOP_STATUS_META.scheduled) : null;
                            return (
                                <div key={i} style={{
                                    padding: '16px', borderRadius: '12px',
                                    background: interview ? meta.bg : 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${interview ? meta.color + '40' : 'rgba(255,255,255,0.06)'}`,
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: interview ? meta.color : '#5a6478' }}>
                                            Interview {num}
                                        </span>
                                        {interview && (
                                            <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '999px', background: meta.bg, color: meta.color, border: `1px solid ${meta.color}30` }}>
                                                {meta.label}
                                            </span>
                                        )}
                                    </div>
                                    {interview ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            {interview.company_name && (
                                                <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{interview.company_name}</div>
                                            )}
                                            {interview.scheduled_date && (
                                                <div style={{ fontSize: '12px', color: '#8892a4', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    <Calendar size={12} /> {new Date(interview.scheduled_date).toLocaleDateString('en-IN')}
                                                </div>
                                            )}
                                            {interview.notes && (
                                                <div style={{ fontSize: '11px', color: '#5a6478', fontStyle: 'italic', marginTop: '4px' }}>{interview.notes}</div>
                                            )}
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: '12px', color: '#5a6478', fontStyle: 'italic' }}>
                                            {!careerData.ready_for_interview ? 'Mark yourself ready first' : 'Not yet scheduled by recruiter'}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {!careerData.ready_for_interview && (
                        <div className="mt-4 p-3 rounded-lg text-sm" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AlertCircle size={16} /> Complete all criteria in Progress → Career Readiness to activate your interview pipeline.
                        </div>
                    )}
                </div>
            )}

            {jobs.length === 0 ? (
                <div className="card text-center p-20">
                    <Search size={48} className="mx-auto text-muted mb-4" />
                    <h3 className="text-xl font-bold text-secondary">No matching jobs yet</h3>
                    <p className="text-muted">Stay tuned, new opportunities matching your course are added daily.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {jobs.map(job => (
                        <div key={job.id} className="card p-5 group hover:border-main transition-all relative overflow-hidden">
                            {job.student_app_status && (
                                <div className="absolute top-0 right-0 bg-main text-white text-[10px] px-3 py-1 font-bold uppercase tracking-tight">
                                    Applied
                                </div>
                            )}
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-main/10 p-3 rounded-lg group-hover:bg-main group-hover:text-white transition-colors">
                                    <Briefcase size={24} />
                                </div>
                                <span className="text-xs text-muted flex items-center gap-1">
                                    <Clock size={12} /> {new Date(job.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-main mb-1">{job.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-secondary mb-4">
                                <Building size={14} /> {job.company_name}
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-4">
                                <div className="bg-secondary/5 rounded p-2 text-center">
                                    <div className="text-[10px] text-muted uppercase font-bold">Package</div>
                                    <div className="text-xs font-bold text-main flex items-center justify-center gap-1"><IndianRupee size={10} />{job.ctc || 'Not Disclosed'}</div>
                                </div>
                                <div className="bg-secondary/5 rounded p-2 text-center">
                                    <div className="text-[10px] text-muted uppercase font-bold">Eligibility</div>
                                    <div className="text-xs font-bold text-main">{job.experience_level}</div>
                                </div>
                            </div>

                            <p className="text-sm text-secondary line-clamp-3 mb-6 bg-secondary/5 p-3 rounded italic">
                                {job.description}
                            </p>
                            <button
                                onClick={() => handleApply(job)}
                                className={`btn w-full flex items-center justify-center gap-2 transition-all ${job.student_app_status ? 'btn-secondary opacity-70' : 'btn-primary'}`}
                            >
                                {job.student_app_status ? 'Apply Again' : 'Apply Now'} <ExternalLink size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const Criterion = ({ label, current, target, met }) => (
    <div className="flex items-center justify-between p-3 bg-secondary/5 rounded-lg">
        <div>
            <div className="text-xs text-muted uppercase font-bold">{label}</div>
            <div className="text-main font-semibold">{current} <span className="text-muted font-normal">/ {target}</span></div>
        </div>
        {met ? <CheckCircle className="text-green-500" size={20} /> : <XCircle className="text-red-400" size={20} />}
    </div>
);

export default StudentJobPortal;
