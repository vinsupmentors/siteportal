import React, { useState, useEffect } from 'react';
import { jobAPI, superAdminAPI } from '../../services/api';
import { Briefcase, Users, BarChart3, TrendingUp } from 'lucide-react';

const RecruiterDashboard = () => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const analyticsRes = await jobAPI.getAnalytics();
            setAnalytics(analyticsRes.data);
        } catch (err) {
            console.error('Data fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-6">Loading Analytics...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-main">Placement Dashboard</h1>
                    <p className="text-secondary">Track job performance and student engagement</p>
                </div>
            </div>

            {/* Analytics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    label="Total Jobs"
                    value={analytics?.overview?.total_jobs || 0}
                    icon={<Briefcase size={20} />}
                    color="text-blue-500"
                />
                <StatCard
                    label="Total Clicks/Applies"
                    value={analytics?.overview?.total_applications || 0}
                    icon={<TrendingUp size={20} />}
                    color="text-green-500"
                />
                <StatCard
                    label="Unique Students"
                    value={analytics?.overview?.unique_students || 0}
                    icon={<Users size={20} />}
                    color="text-purple-500"
                />
                <StatCard
                    label="Active Courses"
                    value={analytics?.courseJobs?.length || 0}
                    icon={<BarChart3 size={20} />}
                    color="text-orange-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="card p-6">
                    <h3 className="font-bold mb-4 text-sm uppercase tracking-wider text-muted flex items-center gap-2">
                        <BarChart3 size={18} /> Course Engagement
                    </h3>
                    <div className="space-y-4">
                        {analytics?.courseJobs.map(c => (
                            <div key={c.course_name} className="flex justify-between items-center bg-secondary/5 p-3 rounded-lg">
                                <span className="text-main font-medium">{c.course_name}</span>
                                <span className="badge badge-secondary">{c.count} Jobs</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card p-6">
                    <h3 className="font-bold mb-4 text-sm uppercase tracking-wider text-muted flex items-center gap-2">
                        <Users size={18} /> Top Student Activity
                    </h3>
                    <div className="space-y-4">
                        {analytics?.studentStats.map((s, idx) => (
                            <div key={s.email} className="flex items-center justify-between gap-3 border-b border-subtle last:border-0 pb-3 last:pb-0">
                                <div className="flex items-center gap-2">
                                    <div className="text-xs font-bold text-muted w-4">{idx + 1}</div>
                                    <div className="text-sm">
                                        <div className="font-medium text-main">{s.first_name} {s.last_name}</div>
                                        <div className="text-xs text-muted truncate max-w-[150px]">{s.email}</div>
                                    </div>
                                </div>
                                <div className="text-xs font-bold text-main bg-main/5 px-2 py-1 rounded">
                                    {s.app_count} Applies
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ label, value, icon, color }) => (
    <div className="card p-5 flex items-center gap-4">
        <div className={`p-3 rounded-lg bg-main/5 ${color}`}>
            {icon}
        </div>
        <div>
            <div className="text-xs text-muted uppercase tracking-wider font-bold">{label}</div>
            <div className="text-xl font-bold text-main">{value}</div>
        </div>
    </div>
);

export default RecruiterDashboard;
