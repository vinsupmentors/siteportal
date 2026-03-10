import React, { useState, useEffect } from 'react';
import { jobAPI } from '../../services/api';
import { Lock, CheckCircle, XCircle, Briefcase, Building, Clock, MapPin, Search, Upload, ExternalLink, IndianRupee } from 'lucide-react';

const StudentJobPortal = () => {
    const [eligibility, setEligibility] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        portfolio_link: '',
        google_review_img: null
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
            await jobAPI.submitRequest(fd);
            fetchStatus();
        } catch (err) {
            alert('Submission failed');
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className="p-6">Verifying Job Eligibility...</div>;

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
                                label="Portfolio Generation"
                                current={eligibility.criteria.portfolio.met ? 'Completed' : 'Pending'}
                                target="Approved"
                                met={eligibility.criteria.portfolio.met}
                            />
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
                            <form onSubmit={handleSubmitRequest} className={`space-y-4 ${!canRequest ? 'opacity-50 pointer-events-none' : ''}`}>
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
                                <button disabled={uploading} className="btn btn-primary w-full py-3">
                                    {uploading ? 'Submitting...' : 'Request Job Portal Access'}
                                </button>
                                {!canRequest && (
                                    <p className="text-xs text-center text-red-400 mt-2 italic">
                                        Please complete all performance metrics to enable the request form.
                                    </p>
                                )}
                            </form>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-main">Recommended Jobs</h1>
                    <p className="text-secondary">Exclusive career opportunities curated for your course</p>
                </div>
                <div className="badge badge-success px-4 py-2 flex items-center gap-2">
                    <CheckCircle size={14} /> Verified Student Profile
                </div>
            </div>

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
