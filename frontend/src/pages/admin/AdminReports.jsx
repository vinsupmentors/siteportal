import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import {
    LayoutDashboard, Users, Calendar, Hexagon, BarChart3,
    Download, Search, Filter, ChevronRight, AlertCircle,
    CheckCircle2, Clock, MapPin, UserCheck, MoreHorizontal,
    TrendingUp, Target, Award, Briefcase, GraduationCap, X
} from 'lucide-react';

// ==========================================
// SUB-COMPONENTS
// ==========================================

export const KPICard = ({ title, value, icon: Icon, gradient, subtitle }) => (
    <div className="glass-card" style={{
        padding: '1.25rem',
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
        background: `linear-gradient(135deg, ${gradient[0]}08, ${gradient[1]}08)`,
        borderColor: `${gradient[0]}20`,
        position: 'relative',
        overflow: 'hidden'
    }}>
        <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
            boxShadow: `0 4px 12px ${gradient[0]}40`
        }}>
            <Icon size={24} />
        </div>
        <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '2px 0' }}>{value}</h3>
            {subtitle && <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{subtitle}</p>}
        </div>
        <div style={{
            position: 'absolute', right: '-20px', bottom: '-20px', width: '100px', height: '100px',
            background: gradient[0], filter: 'blur(30px)', opacity: 0.1, borderRadius: '50%', pointerEvents: 'none'
        }} />
    </div>
);

export const SectionHeader = ({ title, description }) => (
    <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            {title}
        </h3>
        {description && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{description}</p>}
    </div>
);

// ==========================================
// MAIN COMPONENT
// ==========================================

export const AdminReports = () => {
    const [activeTab, setActiveTab] = useState('common');
    const [loading, setLoading] = useState(true);

    // Data states
    const [dashboardData, setDashboardData] = useState(null);
    const [attendanceData, setAttendanceData] = useState(null);
    const [batchHub, setBatchHub] = useState([]);
    const [trainerReport, setTrainerReport] = useState([]);
    const [feedbackReports, setFeedbackReports] = useState([]);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');

    // State for Drill-down
    const [selectedBatchId, setSelectedBatchId] = useState(null);
    const [batchDetailData, setBatchDetailData] = useState(null);
    const [selectedStudentId, setSelectedStudentId] = useState(null);
    const [studentDetailData, setStudentDetailData] = useState(null);
    const [selectedTrainerId, setSelectedTrainerId] = useState(null);
    const [trainerDetailData, setTrainerDetailData] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [studentModalLoading, setStudentModalLoading] = useState(false);
    const [trainerModalLoading, setTrainerModalLoading] = useState(false);

    // Reports: Trainer Download State
    const [trainerMonth, setTrainerMonth] = useState(new Date().getMonth() + 1);
    const [trainerYear, setTrainerYear] = useState(new Date().getFullYear());

    // Reports: Attendance Drill-down State
    const [attendanceView, setAttendanceView] = useState('summary'); // summary, groups, sub-batches, detailed
    const [attendanceBatchGroups, setAttendanceBatchGroups] = useState([]);
    const [selectedAttendanceGroup, setSelectedAttendanceGroup] = useState(null);
    const [attendanceSubBatches, setAttendanceSubBatches] = useState([]);
    const [selectedAttendanceBatchId, setSelectedAttendanceBatchId] = useState(null);
    const [detailedAttendanceData, setDetailedAttendanceData] = useState(null);
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceLoading, setAttendanceLoading] = useState(false);

    useEffect(() => {
        const fetchTabContent = async () => {
            setLoading(true);
            try {
                if (activeTab === 'common') {
                    const res = await adminAPI.getDashboardStats();
                    setDashboardData(res.data);
                } else if (activeTab === 'attendance') {
                    const res = await adminAPI.getAttendanceAnalytics();
                    setAttendanceData(res.data);
                    setAttendanceView('summary');
                } else if (activeTab === 'batches') {
                    const res = await adminAPI.getBatchHub();
                    setBatchHub(res.data.batches);
                } else if (activeTab === 'trainers') {
                    const res = await adminAPI.getTrainerReport();
                    setTrainerReport(res.data.report);
                } else if (activeTab === 'feedback') {
                    const res = await adminAPI.getFeedbackReports();
                    setFeedbackReports(res.data.reports);
                }
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchTabContent();
    }, [activeTab]);

    // Attendance Drill-down Actions
    const handleViewGroups = async () => {
        setAttendanceLoading(true);
        try {
            const res = await adminAPI.getAttendanceGroups();
            setAttendanceBatchGroups(res.data.groups);
            setAttendanceView('groups');
        } catch (err) { console.error(err); }
        finally { setAttendanceLoading(false); }
    };

    const handleViewGroupBatches = async (groupName) => {
        setSelectedAttendanceGroup(groupName);
        setAttendanceLoading(true);
        try {
            const res = await adminAPI.getAttendanceSubBatches(groupName);
            setAttendanceSubBatches(res.data.batches);
            setAttendanceView('sub-batches');
        } catch (err) { console.error(err); }
        finally { setAttendanceLoading(false); }
    };

    const handleViewDetailedAttendance = async (batchId, date) => {
        setSelectedAttendanceBatchId(batchId);
        const targetDate = date || attendanceDate;
        setAttendanceLoading(true);
        try {
            const res = await adminAPI.getDetailedBatchAttendance(batchId, targetDate);
            setDetailedAttendanceData(res.data);
            setAttendanceView('detailed');
        } catch (err) { console.error(err); }
        finally { setAttendanceLoading(false); }
    };

    const handleDownloadKRA = async (trainerId) => {
        try {
            const res = await adminAPI.downloadTrainerKRA(trainerId, trainerMonth, trainerYear);
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Trainer_KRA_${trainerId}_${trainerMonth}_${trainerYear}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) { console.error("Download failed", err); alert("Download failed. Please try again."); }
    };

    const handleDownloadFullReport = async (trainerId) => {
        try {
            const res = await adminAPI.downloadTrainerFullReport(trainerId);
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Trainer_Full_Report_${trainerId}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) { console.error("Download failed", err); alert("Download failed. Please try again."); }
    };

    const handleBatchClick = async (id) => {
        setSelectedBatchId(id);
        setModalLoading(true);
        try {
            const res = await adminAPI.getBatchDetails(id);
            setBatchDetailData(res.data);
        } catch (err) { console.error(err); }
        finally { setModalLoading(false); }
    };

    const handleStudentClick = async (id) => {
        setSelectedStudentId(id);
        setStudentModalLoading(true);
        try {
            const res = await adminAPI.getStudentDetailedReport(id);
            setStudentDetailData(res.data);
        } catch (err) { console.error(err); }
        finally { setStudentModalLoading(false); }
    };

    const handleTrainerClick = async (id) => {
        setSelectedTrainerId(id);
        setTrainerModalLoading(true);
        try {
            const res = await adminAPI.getTrainerDetailedReport(id);
            setTrainerDetailData(res.data);
        } catch (err) { console.error(err); }
        finally { setTrainerModalLoading(false); }
    };

    const handleExport = () => {
        let csvContent = "data:text/csv;charset=utf-8,";
        let fileName = "report.csv";

        if (activeTab === 'common' && dashboardData) {
            fileName = "common_dashboard.csv";
            csvContent += "Category,Metric,Value\n";
            csvContent += `Core Entities,Active Students,${dashboardData.coreEntities.activeStudents}\n`;
            csvContent += `Core Entities,Total Trainers,${dashboardData.coreEntities.totalTrainers}\n`;
            csvContent += `Core Entities,Active Courses,${dashboardData.coreEntities.activeCourses}\n`;
            csvContent += `Core Entities,Active Batches,${dashboardData.coreEntities.activeBatches}\n`;
            csvContent += `Quality,Avg Test Score,${dashboardData.qualityEngagement.globalAvgTestScore}%\n`;
            csvContent += `Quality,Avg Trainer Rating,${dashboardData.qualityEngagement.avgTrainerRating}/5\n`;
        } else if (activeTab === 'attendance' && attendanceData) {
            fileName = "attendance_report.csv";
            csvContent += "Course,Batch,Total,Present,Absent,Attendance %\n";
            attendanceData.calendar.forEach(c => {
                csvContent += `${c.course_name},${c.batch_name},${c.total},${c.present},${c.absent},${((c.present / c.total) * 100).toFixed(1)}%\n`;
            });
        } else if (activeTab === 'batches') {
            fileName = "batch_hub.csv";
            csvContent += "Batch Name,Course,Enrolled,Trainer,Status\n";
            batchHub.forEach(b => {
                csvContent += `${b.batch_name},${b.course_name},${b.enrolled_count},${b.trainer_name || 'Unassigned'},${b.status}\n`;
            });
        } else if (activeTab === 'trainers') {
            fileName = "trainer_performance.csv";
            csvContent += "Trainer Name,Active Batches,Avg Rating,Tasks Done,Attendance %\n";
            trainerReport.forEach(t => {
                csvContent += `${t.name},${t.active_batches},${Number(t.avg_rating).toFixed(1)},${t.tasks_completed},${t.attendance_pct}%\n`;
            });
        }

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const tabs = [
        { key: 'common', label: 'Common Dashboard', icon: LayoutDashboard },
        { key: 'attendance', label: 'Attendance Report', icon: UserCheck },
        { key: 'batches', label: 'Batch Report', icon: Hexagon },
        { key: 'trainers', label: 'Trainers Report', icon: Users },
        { key: 'feedback', label: 'Feedback Responses', icon: BarChart3 },
    ];

    return (
        <div style={{ paddingBottom: '3rem' }}>

            {/* MODAL OVERLAY: Batch Details */}
            {selectedBatchId && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', backdropFilter: 'blur(4px)' }}>
                    <div className="glass-card fade-in" style={{ width: '100%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-card)', padding: '2rem', position: 'relative' }}>
                        <button onClick={() => { setSelectedBatchId(null); setBatchDetailData(null); }} style={{ position: 'absolute', right: '20px', top: '20px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                            <X size={24} />
                        </button>

                        {modalLoading ? (
                            <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>
                        ) : batchDetailData && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{batchDetailData.batch.batch_name}</h2>
                                        <p style={{ color: 'var(--text-muted)' }}>{batchDetailData.batch.course_name} • Led by {batchDetailData.batch.trainer_name || 'Unassigned'}</p>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                                    <div style={{ background: 'var(--bg-surface)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                                        <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#4dabf7' }}>{batchDetailData.kpis.total_students}</p>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Enrolled</p>
                                    </div>
                                    <div style={{ background: 'var(--bg-surface)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                                        <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fcc419' }}>{batchDetailData.kpis.classes_completed}</p>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Classes Completed</p>
                                    </div>
                                    <div style={{ background: 'var(--bg-surface)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                                        <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#20c997' }}>{batchDetailData.kpis.total_materials}</p>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Materials Released</p>
                                    </div>
                                    <div style={{ background: 'var(--bg-surface)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                                        <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ff922b' }}>{batchDetailData.kpis.total_worksheets}</p>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Worksheets Released</p>
                                    </div>
                                </div>

                                <div>
                                    <SectionHeader title="Students Enrolled" description="Track individual student history and performance." />
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
                                        {batchDetailData.students.map((s, idx) => (
                                            <div key={idx} style={{ padding: '12px', background: 'var(--bg-surface-hover)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-color)' }}>
                                                <div>
                                                    <p style={{ fontWeight: 600, color: 'var(--text-main)' }}>{s.first_name} {s.last_name}</p>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.email}</p>
                                                </div>
                                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: s.attendance_pct >= 80 ? '#51cf66' : '#ff6b6b' }}>{s.attendance_pct}%</span>
                                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Attendance</span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleStudentClick(s.student_id)}
                                                        style={{ padding: '6px 12px', borderRadius: '6px', background: 'var(--primary)', color: 'white', border: 'none', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                                                    >
                                                        View Report
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL OVERLAY: Student Detailed Report */}
            {selectedStudentId && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', backdropFilter: 'blur(4px)' }}>
                    <div className="glass-card fade-in" style={{ width: '100%', maxWidth: '800px', maxHeight: '85vh', overflowY: 'auto', background: 'var(--bg-card)', padding: '2rem', position: 'relative' }}>
                        {studentModalLoading ? (
                            <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>
                        ) : studentDetailData && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Detailed Report: {studentDetailData.profile.first_name} {studentDetailData.profile.last_name}</h2>
                                    <button onClick={() => { setSelectedStudentId(null); setStudentDetailData(null); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-main)', display: 'flex' }}>
                                        <X size={24} strokeWidth={3} />
                                    </button>
                                </div>

                                <div style={{ background: 'var(--bg-surface)', borderRadius: '8px', padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', border: '1px solid var(--border-color)' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div><strong>Roll Number:</strong> STU00{studentDetailData.profile.id}</div>
                                        <div><strong>Phone:</strong> {studentDetailData.profile.phone || 'N/A'}</div>
                                        <div><strong>Course:</strong> {studentDetailData.profile.course_name}</div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div><strong>Email:</strong> {studentDetailData.profile.email}</div>
                                        <div><strong>Batch:</strong> {studentDetailData.profile.batch_name}</div>
                                        <div><strong>Trainer:</strong> {studentDetailData.profile.trainer_name || 'Unassigned'}</div>
                                    </div>
                                </div>

                                <div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>Engagement & Tracking</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                                        <div className="glass-card" style={{ padding: '1.25rem' }}>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>Doubts</p>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                                <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{studentDetailData.engagement.doubts_raised}</span>
                                                <span style={{ fontSize: '0.8rem', color: '#20c997', fontWeight: 600 }}>{studentDetailData.engagement.doubts_resolved} Cleared</span>
                                            </div>
                                        </div>
                                        <div className="glass-card" style={{ padding: '1.25rem' }}>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>Feedback</p>
                                            <p style={{ fontSize: '1.1rem', fontWeight: 800, color: studentDetailData.engagement.feedback_given ? '#20c997' : '#ff6b6b' }}>
                                                {studentDetailData.engagement.feedback_given ? 'Submitted' : 'Pending'}
                                            </p>
                                        </div>
                                        <div className="glass-card" style={{ padding: '1.25rem' }}>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>Portfolio</p>
                                            <p style={{ fontSize: '1.1rem', fontWeight: 800, color: studentDetailData.engagement.portfolio_status === 'approved' ? '#20c997' : '#fcc419', textTransform: 'capitalize' }}>
                                                {studentDetailData.engagement.portfolio_status}
                                            </p>
                                        </div>
                                        <div className="glass-card" style={{ padding: '1.25rem' }}>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>Capstone</p>
                                            <p style={{ fontSize: '1.1rem', fontWeight: 800, color: studentDetailData.engagement.capstone_status === 'Completed' ? '#20c997' : '#4dabf7' }}>
                                                {studentDetailData.engagement.capstone_status}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                                    <div style={{ background: '#748ffc', borderRadius: '8px', padding: '1.5rem', textAlign: 'center', color: 'white' }}>
                                        <p style={{ fontSize: '1.8rem', fontWeight: 800 }}>{studentDetailData.kpis.avg_module_score}%</p>
                                        <p style={{ fontSize: '0.8rem', opacity: 0.9 }}>Avg Module</p>
                                    </div>
                                    <div style={{ background: '#20c997', borderRadius: '8px', padding: '1.5rem', textAlign: 'center', color: 'white' }}>
                                        <p style={{ fontSize: '1.8rem', fontWeight: 800 }}>{studentDetailData.kpis.avg_test_score}%</p>
                                        <p style={{ fontSize: '0.8rem', opacity: 0.9 }}>Avg Test</p>
                                    </div>
                                    <div style={{ background: '#fcc419', borderRadius: '8px', padding: '1.5rem', textAlign: 'center', color: 'white' }}>
                                        <p style={{ fontSize: '1.8rem', fontWeight: 800 }}>{studentDetailData.kpis.projects_completed}/{studentDetailData.kpis.projects_total}</p>
                                        <p style={{ fontSize: '0.8rem', opacity: 0.9 }}>Projects</p>
                                    </div>
                                    <div style={{ background: '#ff6b6b', borderRadius: '8px', padding: '1.5rem', textAlign: 'center', color: 'white' }}>
                                        <p style={{ fontSize: '1.8rem', fontWeight: 800 }}>{studentDetailData.kpis.attendance_pct}%</p>
                                        <p style={{ fontSize: '0.8rem', opacity: 0.9 }}>Attendance</p>
                                    </div>
                                </div>

                                <div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>Module Performance</h3>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                                <th style={{ padding: '12px' }}>MODULE</th>
                                                <th style={{ padding: '12px' }}>MARKS</th>
                                                <th style={{ padding: '12px' }}>MAX</th>
                                                <th style={{ padding: '12px' }}>%</th>
                                                <th style={{ padding: '12px' }}>GRADE</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {studentDetailData.modules.map((m, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                    <td style={{ padding: '12px' }}>{m.module_name}</td>
                                                    <td style={{ padding: '12px' }}>{m.module_marks}</td>
                                                    <td style={{ padding: '12px' }}>{m.max_marks}</td>
                                                    <td style={{ padding: '12px' }}>{m.percent}%</td>
                                                    <td style={{ padding: '12px', fontWeight: 700, color: m.grade === 'F' ? '#ff6b6b' : '#20c997' }}>{m.grade}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', color: '#343a40' }}>Test Performance</h3>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: 'white' }}>
                                        <thead>
                                            <tr style={{ background: '#748ffc', color: 'white' }}>
                                                <th style={{ padding: '12px', fontSize: '0.85rem', textTransform: 'uppercase' }}>Test Name</th>
                                                <th style={{ padding: '12px', fontSize: '0.85rem', textTransform: 'uppercase' }}>Type</th>
                                                <th style={{ padding: '12px', fontSize: '0.85rem', textTransform: 'uppercase' }}>Marks</th>
                                                <th style={{ padding: '12px', fontSize: '0.85rem', textTransform: 'uppercase' }}>Max Marks</th>
                                                <th style={{ padding: '12px', fontSize: '0.85rem', textTransform: 'uppercase' }}>Percentage</th>
                                                <th style={{ padding: '12px', fontSize: '0.85rem', textTransform: 'uppercase' }}>Status</th>
                                                <th style={{ padding: '12px', fontSize: '0.85rem', textTransform: 'uppercase' }}>Submitted</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {studentDetailData.tests.length === 0 ? (
                                                <tr><td colSpan="7" style={{ padding: '1rem', textAlign: 'center', color: '#868e96' }}>No test records available</td></tr>
                                            ) : studentDetailData.tests.map((t, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid #dee2e6' }}>
                                                    <td style={{ padding: '12px', color: '#495057' }}>{t.test_name}</td>
                                                    <td style={{ padding: '12px', color: '#495057', textTransform: 'capitalize' }}>{t.type.replace('_', ' ')}</td>
                                                    <td style={{ padding: '12px', color: '#495057' }}>{t.marks}</td>
                                                    <td style={{ padding: '12px', color: '#495057' }}>{t.max_marks}</td>
                                                    <td style={{ padding: '12px', color: '#495057' }}>{t.percentage}%</td>
                                                    <td style={{ padding: '12px', fontWeight: 700, color: t.status === 'Pass' ? '#2b8a3e' : '#fa5252' }}>{t.status}</td>
                                                    <td style={{ padding: '12px', color: '#495057' }}>{new Date(t.submitted).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', color: '#343a40' }}>Project Completion</h3>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: 'white' }}>
                                        <thead>
                                            <tr style={{ background: '#748ffc', color: 'white' }}>
                                                <th style={{ padding: '12px', fontSize: '0.85rem', textTransform: 'uppercase' }}>Project Name</th>
                                                <th style={{ padding: '12px', fontSize: '0.85rem', textTransform: 'uppercase' }}>Type</th>
                                                <th style={{ padding: '12px', fontSize: '0.85rem', textTransform: 'uppercase' }}>Status</th>
                                                <th style={{ padding: '12px', fontSize: '0.85rem', textTransform: 'uppercase' }}>Marks</th>
                                                <th style={{ padding: '12px', fontSize: '0.85rem', textTransform: 'uppercase' }}>Submission Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {studentDetailData.projects.length === 0 ? (
                                                <tr><td colSpan="5" style={{ padding: '1rem', textAlign: 'center', color: '#868e96' }}>No project records available</td></tr>
                                            ) : studentDetailData.projects.map((p, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid #dee2e6' }}>
                                                    <td style={{ padding: '12px', color: '#495057' }}>{p.project_name}</td>
                                                    <td style={{ padding: '12px', color: '#495057', textTransform: 'capitalize' }}>{p.type.replace('_', ' ')}</td>
                                                    <td style={{ padding: '12px', fontWeight: 700, color: '#4dabf7' }}>{p.status}</td>
                                                    <td style={{ padding: '12px', color: '#495057' }}>{p.marks || '-'}</td>
                                                    <td style={{ padding: '12px', color: '#495057' }}>{new Date(p.submission_date).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', color: '#343a40' }}>Worksheet Completion ({studentDetailData.kpis.total_worksheets})</h3>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: 'white' }}>
                                        <thead>
                                            <tr style={{ background: '#748ffc', color: 'white' }}>
                                                <th style={{ padding: '12px', fontSize: '0.85rem', textTransform: 'uppercase' }}>Module</th>
                                                <th style={{ padding: '12px', fontSize: '0.85rem', textTransform: 'uppercase' }}>Day</th>
                                                <th style={{ padding: '12px', fontSize: '0.85rem', textTransform: 'uppercase' }}>Material Name</th>
                                                <th style={{ padding: '12px', fontSize: '0.85rem', textTransform: 'uppercase' }}>Status</th>
                                                <th style={{ padding: '12px', fontSize: '0.85rem', textTransform: 'uppercase' }}>Completed At</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {studentDetailData.worksheets.length === 0 ? (
                                                <tr><td colSpan="5" style={{ padding: '1rem', textAlign: 'center', color: '#868e96' }}>No worksheet records available</td></tr>
                                            ) : studentDetailData.worksheets.map((w, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid #dee2e6' }}>
                                                    <td style={{ padding: '12px', color: '#495057' }}>{w.module}</td>
                                                    <td style={{ padding: '12px', color: '#495057' }}>Day {w.day}</td>
                                                    <td style={{ padding: '12px', color: '#495057' }}>{w.material_name}</td>
                                                    <td style={{ padding: '12px', fontWeight: 700, color: '#2b8a3e' }}>{w.status}</td>
                                                    <td style={{ padding: '12px', color: '#495057' }}>{new Date(w.completed_at).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL OVERLAY: Trainer Detailed Report */}
            {selectedTrainerId && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', backdropFilter: 'blur(4px)' }}>
                    <div className="glass-card fade-in" style={{ width: '100%', maxWidth: '800px', maxHeight: '85vh', overflowY: 'auto', background: 'var(--bg-card)', padding: '2rem', position: 'relative' }}>
                        {trainerModalLoading ? (
                            <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>
                        ) : trainerDetailData && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Trainer Performance: {trainerDetailData.profile.name}</h2>
                                    <button onClick={() => { setSelectedTrainerId(null); setTrainerDetailData(null); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-main)', display: 'flex' }}>
                                        <X size={24} strokeWidth={3} />
                                    </button>
                                </div>

                                <div style={{ background: 'var(--primary)', borderRadius: '12px', padding: '1.25rem', color: 'white' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Download size={18} /> Export Performance Data
                                    </h3>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: '0.75rem', marginBottom: '6px', opacity: 0.9 }}>Report Month</p>
                                            <select
                                                value={trainerMonth}
                                                onChange={(e) => setTrainerMonth(e.target.value)}
                                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white' }}
                                            >
                                                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => (
                                                    <option key={m} value={i + 1} style={{ color: 'black' }}>{m}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <button
                                            onClick={() => handleDownloadKRA(selectedTrainerId)}
                                            style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'white', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                        >
                                            <Download size={16} /> KRA Report
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                                    <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                                        <p style={{ fontSize: '1.8rem', fontWeight: 800 }}>{trainerDetailData.profile.active_batches}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active Batches</p>
                                    </div>
                                    <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                                        <p style={{ fontSize: '1.8rem', fontWeight: 800 }}>{trainerDetailData.profile.students_taught}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Students Taught</p>
                                    </div>
                                    <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                                        <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fcc419' }}>{Number(trainerDetailData.profile.avg_rating || 0).toFixed(1)}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Avg Rating</p>
                                    </div>
                                    <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                                        <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#20c997' }}>{trainerDetailData.attendance.attendance_pct}%</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Attendance</p>
                                    </div>
                                </div>

                                <div>
                                    <SectionHeader title="KRA Performance (Last 30 Days)" />
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                                        <div className="glass-card" style={{ padding: '1rem' }}>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tasks Assigned</p>
                                            <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>{trainerDetailData.tasks.overall.assigned}</p>
                                        </div>
                                        <div className="glass-card" style={{ padding: '1rem' }}>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tasks Completed</p>
                                            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#20c997' }}>{trainerDetailData.tasks.overall.completed}</p>
                                        </div>
                                        <div className="glass-card" style={{ padding: '1rem' }}>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Completion Rate</p>
                                            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{trainerDetailData.tasks.overall.rate}%</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Main Header */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Reporting & Intelligence</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Real-time operational insights and performance tracking.</p>
                </div>
                <button
                    className="glass-card"
                    onClick={handleExport}
                    style={{
                        padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px',
                        fontSize: '0.9rem', cursor: 'pointer', background: 'var(--primary)', color: 'white',
                        fontWeight: 700, border: 'none', borderRadius: '10px', boxShadow: '0 4px 12px var(--primary)30'
                    }}
                >
                    <Download size={18} /> Export Report
                </button>
            </div>

            {/* Tab Navigation */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '6px', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '2rem' }}>
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.key;
                    return (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            style={{
                                padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
                                background: isActive ? 'var(--primary)' : 'transparent',
                                color: isActive ? 'white' : 'var(--text-muted)',
                                border: 'none', transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                flex: '1 1 auto', whiteSpace: 'nowrap'
                            }}>
                            <Icon size={18} /> {tab.label}
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '1rem' }}>
                    <div className="spinner" />
                    <p style={{ color: 'var(--text-muted)' }}>Aggregating operational data...</p>
                </div>
            ) : (
                <div className="fade-in">
                    {/* Common Dashboard */}
                    {activeTab === 'common' && dashboardData && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <section>
                                <SectionHeader title="Core Ecosystem" description="Global footprint and enrollment metrics." />
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
                                    <KPICard title="Active Students" value={dashboardData.coreEntities.activeStudents} icon={Users} gradient={['#4263eb', '#748ffc']} subtitle="Currently enrolled" />
                                    <KPICard title="Total Trainers" value={dashboardData.coreEntities.totalTrainers} icon={UserCheck} gradient={['#099268', '#38d9a9']} subtitle="Active faculty" />
                                    <KPICard title="Active Batches" value={dashboardData.coreEntities.activeBatches} icon={Hexagon} gradient={['#ae3ec9', '#d0bfff']} subtitle="In progress" />
                                    <KPICard title="New Enrollments" value={dashboardData.coreEntities.newEnrollments} icon={TrendingUp} gradient={['#f76707', '#ffa94d']} subtitle="Past 30 days" />
                                </div>
                            </section>

                            <section>
                                <SectionHeader title="Quality & Performance" description="Academic health and faculty impact." />
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
                                    <KPICard title="Avg Test Score" value={`${dashboardData.qualityEngagement.globalAvgTestScore}%`} icon={Target} gradient={['#f59f00', '#ffec99']} subtitle="System average" />
                                    <KPICard title="Trainer Rating" value={`${dashboardData.qualityEngagement.avgTrainerRating}/5`} icon={Award} gradient={['#7048e8', '#b197fc']} subtitle="Satisfaction" />
                                    <KPICard title="Attendance" value={`${dashboardData.qualityEngagement.avgStudentAttendance30d}%`} icon={Calendar} gradient={['#20c997', '#96f2d7']} subtitle="30d rolling" />
                                    <KPICard title="Pending Tasks" value={dashboardData.taskHealth.globalPendingTasks} icon={Clock} gradient={['#ff6b6b', '#ffc9c9']} subtitle="Requires action" />
                                </div>
                            </section>
                        </div>
                    )}

                    {/* Attendance Report */}
                    {activeTab === 'attendance' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <button onClick={() => setAttendanceView('summary')} style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: attendanceView === 'summary' ? 'var(--primary)15' : 'transparent', color: attendanceView === 'summary' ? 'var(--primary)' : 'inherit', cursor: 'pointer', fontWeight: 600 }}>Summary</button>
                                <ChevronRight size={14} />
                                <button onClick={handleViewGroups} style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: attendanceView === 'groups' ? 'var(--primary)15' : 'transparent', color: attendanceView === 'groups' ? 'var(--primary)' : 'inherit', cursor: 'pointer', fontWeight: 600 }}>Batch Hub</button>
                            </div>

                            {attendanceLoading ? <div className="spinner" style={{ margin: '40px auto' }} /> : (
                                <>
                                    {attendanceView === 'summary' && attendanceData && (
                                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                                            <div className="glass-card" style={{ padding: '1.5rem' }}>
                                                <SectionHeader title="Today's Session Attendance" />
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    {attendanceData.calendar.map((c, i) => (
                                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '12px', background: 'var(--bg-surface)', borderRadius: '10px' }}>
                                                            <div style={{ flex: 1 }}>
                                                                <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.course_name}</p>
                                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.batch_name}</p>
                                                            </div>
                                                            <div style={{ textAlign: 'right' }}>
                                                                <span style={{ fontWeight: 700, color: '#20c997' }}>{c.present}</span>
                                                                <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>/</span>
                                                                <span>{c.total}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid #ff6b6b30', background: '#ff6b6b05' }}>
                                                <SectionHeader title="Absence Alerts" />
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                    {attendanceData.alerts.consecutive3d.map((a, i) => (
                                                        <div key={i} style={{ padding: '10px', background: 'white', borderRadius: '8px', fontSize: '0.8rem', border: '1px solid #ff6b6b20' }}>
                                                            <strong>{a.first_name}</strong>
                                                            <p style={{ color: '#ff6b6b' }}>3+ days absent</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {attendanceView === 'groups' && (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                            {attendanceBatchGroups.map(group => (
                                                <div key={group} className="glass-card" onClick={() => handleViewGroupBatches(group)} style={{ padding: '1.5rem', textAlign: 'center', cursor: 'pointer' }}>
                                                    <Briefcase size={24} style={{ marginBottom: '10px', color: 'var(--primary)' }} />
                                                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{group}</h3>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {attendanceView === 'sub-batches' && (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                                            {attendanceSubBatches.map(b => (
                                                <div key={b.batch_id} className="glass-card" onClick={() => handleViewDetailedAttendance(b.batch_id)} style={{ padding: '1.5rem', cursor: 'pointer' }}>
                                                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>{b.batch_name}</h3>
                                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{b.course_name}</p>
                                                    <p style={{ marginTop: '10px', fontWeight: 600, color: 'var(--primary)' }}>{b.timing}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {attendanceView === 'detailed' && detailedAttendanceData && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                                <div style={{ background: 'var(--primary)', color: 'white', padding: '1.5rem', borderRadius: '12px' }}>
                                                    <p style={{ fontSize: '2rem', fontWeight: 800 }}>{detailedAttendanceData.kpis.total}</p>
                                                    <p>Total Students</p>
                                                </div>
                                                <div style={{ background: '#20c997', color: 'white', padding: '1.5rem', borderRadius: '12px' }}>
                                                    <p style={{ fontSize: '2rem', fontWeight: 800 }}>{detailedAttendanceData.kpis.present}</p>
                                                    <p>Present Today</p>
                                                </div>
                                                <div style={{ background: '#ff6b6b', color: 'white', padding: '1.5rem', borderRadius: '12px' }}>
                                                    <p style={{ fontSize: '2rem', fontWeight: 800 }}>{detailedAttendanceData.kpis.absent}</p>
                                                    <p>Absent Today</p>
                                                </div>
                                            </div>
                                            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                    <thead>
                                                        <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)' }}>
                                                            <th style={{ padding: '12px', textAlign: 'left' }}>Student</th>
                                                            <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                                                            <th style={{ padding: '12px', textAlign: 'center' }}>Overall (P/A)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {detailedAttendanceData.details.map((s, i) => (
                                                            <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                                <td style={{ padding: '12px' }}>{s.first_name} {s.last_name}</td>
                                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                    <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', background: s.status === 'present' ? '#ebfbee' : '#fff5f5', color: s.status === 'present' ? '#2b8a3e' : '#c92a2a', fontWeight: 700 }}>{s.status}</span>
                                                                </td>
                                                                <td style={{ padding: '12px', textAlign: 'center' }}>{s.total_present}P / {s.total_absent}A</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* Batch Report */}
                    {activeTab === 'batches' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                            {batchHub.map((b, i) => (
                                <div key={i} className="glass-card" style={{ padding: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>{b.batch_name}</h3>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{b.course_name}</p>
                                    <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                                        <div>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ENROLLED</p>
                                            <p style={{ fontWeight: 700 }}>{b.enrolled_count}</p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TRAINER</p>
                                            <p style={{ fontWeight: 600 }}>{b.trainer_name || 'Unassigned'}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleBatchClick(b.batch_id)} style={{ marginTop: '1.5rem', width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--primary)30', background: 'var(--primary)05', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>View Details</button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Trainers Report */}
                    {activeTab === 'trainers' && (
                        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)' }}>
                                        <th style={{ padding: '14px', textAlign: 'left' }}>Trainer</th>
                                        <th style={{ padding: '14px', textAlign: 'center' }}>Batches</th>
                                        <th style={{ padding: '14px', textAlign: 'center' }}>Rating</th>
                                        <th style={{ padding: '14px', textAlign: 'center' }}>Performance</th>
                                        <th style={{ padding: '14px', textAlign: 'center' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {trainerReport.map((t, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '14px' }}>{t.name}</td>
                                            <td style={{ padding: '14px', textAlign: 'center' }}>{t.active_batches} Active</td>
                                            <td style={{ padding: '14px', textAlign: 'center', color: '#fab005', fontWeight: 700 }}>{Number(t.avg_rating).toFixed(1)} <Award size={14} style={{ verticalAlign: 'middle' }} /></td>
                                            <td style={{ padding: '14px', textAlign: 'center' }}>{t.tasks_completed} Tasks</td>
                                            <td style={{ padding: '14px', textAlign: 'center' }}>
                                                <button onClick={() => handleTrainerClick(t.trainer_id)} style={{ color: 'var(--primary)', fontWeight: 600, background: 'transparent', border: 'none', cursor: 'pointer' }}>Report</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Feedback Reports */}
                    {activeTab === 'feedback' && (
                        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)' }}>
                                        <th style={{ padding: '14px', textAlign: 'left' }}>Student</th>
                                        <th style={{ padding: '14px', textAlign: 'left' }}>Form Title</th>
                                        <th style={{ padding: '14px', textAlign: 'left' }}>Submitted</th>
                                        <th style={{ padding: '14px', textAlign: 'center' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {feedbackReports.map((r, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '14px' }}>
                                                <p style={{ fontWeight: 600 }}>{r.first_name} {r.last_name}</p>
                                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{r.batch_name}</p>
                                            </td>
                                            <td style={{ padding: '14px' }}>{r.form_title}</td>
                                            <td style={{ padding: '14px', fontSize: '0.8rem' }}>{new Date(r.submitted_at).toLocaleDateString()}</td>
                                            <td style={{ padding: '14px', textAlign: 'center' }}>
                                                <button onClick={() => alert(JSON.stringify(r.response_json, null, 2))} style={{ color: 'var(--primary)', fontWeight: 600, background: 'transparent', border: 'none', cursor: 'pointer' }}>View</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// End of file
