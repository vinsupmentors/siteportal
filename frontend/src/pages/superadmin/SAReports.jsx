import { useState, useEffect } from 'react';
import { superAdminAPI } from '../../services/api';
import {
    LayoutDashboard, Users, Calendar, Hexagon, BarChart3,
    Download, Search, Filter, ChevronRight, AlertCircle,
    CheckCircle2, Clock, MapPin, UserCheck, MoreHorizontal,
    TrendingUp, Target, Award, Briefcase, GraduationCap, X
} from 'lucide-react';

// ==========================================
// SUB-COMPONENTS
// ==========================================

const KPICard = ({ title, value, icon: Icon, gradient, subtitle }) => (
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
        {/* Subtle background glow */}
        <div style={{
            position: 'absolute', right: '-20px', bottom: '-20px', width: '100px', height: '100px',
            background: gradient[0], filter: 'blur(30px)', opacity: 0.1, borderRadius: '50%', pointerEvents: 'none'
        }} />
    </div>
);

const SectionHeader = ({ title, description }) => (
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

export const SAReports = () => {
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

    // Reports V3: Trainer Download State
    const [trainerMonth, setTrainerMonth] = useState(new Date().getMonth() + 1);
    const [trainerYear, setTrainerYear] = useState(new Date().getFullYear());

    // Reports V3: Attendance Drill-down State
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
                    const res = await superAdminAPI.getDashboardStats();
                    setDashboardData(res.data);
                } else if (activeTab === 'attendance') {
                    const res = await superAdminAPI.getAttendanceAnalytics();
                    setAttendanceData(res.data);
                    // Also reset view when switching to tab
                    setAttendanceView('summary');
                } else if (activeTab === 'batches') {
                    const res = await superAdminAPI.getBatchHub();
                    setBatchHub(res.data.batches);
                } else if (activeTab === 'trainers') {
                    const res = await superAdminAPI.getTrainerReport();
                    setTrainerReport(res.data.report);
                } else if (activeTab === 'feedback') {
                    const res = await superAdminAPI.getFeedbackReports();
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
            const res = await superAdminAPI.getAttendanceGroups();
            setAttendanceBatchGroups(res.data.groups);
            setAttendanceView('groups');
        } catch (err) { console.error(err); }
        finally { setAttendanceLoading(false); }
    };

    const handleViewGroupBatches = async (groupName) => {
        setSelectedAttendanceGroup(groupName);
        setAttendanceLoading(true);
        try {
            const res = await superAdminAPI.getAttendanceSubBatches(groupName);
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
            const res = await superAdminAPI.getDetailedBatchAttendance(batchId, targetDate);
            setDetailedAttendanceData(res.data);
            setAttendanceView('detailed');
        } catch (err) { console.error(err); }
        finally { setAttendanceLoading(false); }
    };

    const handleDownloadKRA = async (trainerId) => {
        try {
            const res = await superAdminAPI.downloadTrainerKRA(trainerId, trainerMonth, trainerYear);
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
            const res = await superAdminAPI.downloadTrainerFullReport(trainerId);
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
            const res = await superAdminAPI.getBatchDetails(id);
            setBatchDetailData(res.data);
        } catch (err) { console.error(err); }
        finally { setModalLoading(false); }
    };

    const handleStudentClick = async (id) => {
        setSelectedStudentId(id);
        setStudentModalLoading(true);
        try {
            const res = await superAdminAPI.getStudentDetailedReport(id);
            setStudentDetailData(res.data);
        } catch (err) { console.error(err); }
        finally { setStudentModalLoading(false); }
    };

    const handleTrainerClick = async (id) => {
        setSelectedTrainerId(id);
        setTrainerModalLoading(true);
        try {
            const res = await superAdminAPI.getTrainerDetailedReport(id);
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
                            <AlertCircle size={24} style={{ transform: 'rotate(45deg)' }} />
                        </button>

                        {modalLoading ? (
                            <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>
                        ) : batchDetailData && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                {/* Modal Header */}
                                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{batchDetailData.batch.batch_name}</h2>
                                        <p style={{ color: 'var(--text-muted)' }}>{batchDetailData.batch.course_name} • Led by {batchDetailData.batch.trainer_name || 'Unassigned'}</p>
                                    </div>
                                </div>

                                {/* Batch General KPIs */}
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

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                                    {/* Section: Students List */}
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
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL OVERLAY: Student Detailed Report */}
            {selectedStudentId && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', backdropFilter: 'blur(4px)' }}>
                    <div className="glass-card fade-in" style={{ width: '100%', maxWidth: '800px', maxHeight: '85vh', overflowY: 'auto', background: 'var(--bg-card)', padding: '2rem', position: 'relative' }}>
                        <div style={{ display: 'none' }}></div>
                        {studentModalLoading ? (
                            <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>
                        ) : studentDetailData && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                {/* Header */}
                                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Detailed Report: {studentDetailData.profile.first_name} {studentDetailData.profile.last_name}</h2>
                                    <button onClick={() => { setSelectedStudentId(null); setStudentDetailData(null); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-main)', display: 'flex' }}>
                                        <X size={24} strokeWidth={3} />
                                    </button>
                                </div>

                                {/* Profile info grid */}
                                <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', color: '#212529', border: '1px solid #dee2e6' }}>
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

                                {/* Engagement & Tracking */}
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', color: '#343a40' }}>Engagement & Tracking</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                                        <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '1.5rem', border: '1px solid #dee2e6' }}>
                                            <p style={{ fontSize: '0.85rem', color: '#868e96', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>Doubts</p>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#495057' }}>{studentDetailData.engagement.doubts_raised}</span>
                                                <span style={{ fontSize: '0.85rem', color: '#2b8a3e', fontWeight: 600 }}>{studentDetailData.engagement.doubts_resolved} Cleared</span>
                                            </div>
                                        </div>
                                        <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '1.5rem', border: '1px solid #dee2e6' }}>
                                            <p style={{ fontSize: '0.85rem', color: '#868e96', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>Session Feedback</p>
                                            <p style={{ fontSize: '1.2rem', fontWeight: 800, color: studentDetailData.engagement.feedback_given ? '#2b8a3e' : '#fa5252' }}>
                                                {studentDetailData.engagement.feedback_given ? 'Submitted' : 'Pending'}
                                            </p>
                                        </div>
                                        <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '1.2rem 1.5rem', border: '1px solid #dee2e6' }}>
                                            <p style={{ fontSize: '0.85rem', color: '#868e96', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>Portfolio</p>
                                            <p style={{ fontSize: '1.2rem', fontWeight: 800, color: studentDetailData.engagement.portfolio_status === 'approved' ? '#2b8a3e' : '#f59f00', textTransform: 'capitalize' }}>
                                                {studentDetailData.engagement.portfolio_status}
                                            </p>
                                        </div>
                                        <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '1.2rem 1.5rem', border: '1px solid #dee2e6' }}>
                                            <p style={{ fontSize: '0.85rem', color: '#868e96', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>Capstone Project</p>
                                            <p style={{ fontSize: '1.2rem', fontWeight: 800, color: studentDetailData.engagement.capstone_status === 'Completed' ? '#2b8a3e' : '#4dabf7' }}>
                                                {studentDetailData.engagement.capstone_status}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Main KPIs */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                                    <div style={{ background: '#748ffc', borderRadius: '8px', padding: '1.5rem', textAlign: 'center', color: 'white' }}>
                                        <p style={{ fontSize: '2rem', fontWeight: 800 }}>{studentDetailData.kpis.avg_module_score}%</p>
                                        <p style={{ fontSize: '0.85rem' }}>Avg Module Score</p>
                                    </div>
                                    <div style={{ background: '#20c997', borderRadius: '8px', padding: '1.5rem', textAlign: 'center', color: 'white' }}>
                                        <p style={{ fontSize: '2rem', fontWeight: 800 }}>{studentDetailData.kpis.avg_test_score}%</p>
                                        <p style={{ fontSize: '0.85rem' }}>Avg Test Score</p>
                                    </div>
                                    <div style={{ background: '#fcc419', borderRadius: '8px', padding: '1.5rem', textAlign: 'center', color: 'white' }}>
                                        <p style={{ fontSize: '2rem', fontWeight: 800 }}>{studentDetailData.kpis.projects_completed}/{studentDetailData.kpis.projects_total}</p>
                                        <p style={{ fontSize: '0.85rem' }}>Projects Completed</p>
                                    </div>
                                    <div style={{ background: '#ff6b6b', borderRadius: '8px', padding: '1.5rem', textAlign: 'center', color: 'white' }}>
                                        <p style={{ fontSize: '2rem', fontWeight: 800 }}>{studentDetailData.kpis.attendance_pct}%</p>
                                        <p style={{ fontSize: '0.85rem' }}>Attendance</p>
                                    </div>
                                </div>

                                {/* Attendance Summary */}
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', color: '#343a40' }}>Attendance Summary</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                                        <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '1.25rem', textAlign: 'center', border: '1px solid #dee2e6' }}>
                                            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4dabf7' }}>{studentDetailData.attendance.total_days}</p>
                                            <p style={{ fontSize: '0.85rem', color: '#868e96' }}>Total Days</p>
                                        </div>
                                        <div style={{ background: '#e6fcf5', borderRadius: '8px', padding: '1.25rem', textAlign: 'center', border: '1px solid #c3fae8' }}>
                                            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2b8a3e' }}>{studentDetailData.attendance.present}</p>
                                            <p style={{ fontSize: '0.85rem', color: '#2b8a3e' }}>Present</p>
                                        </div>
                                        <div style={{ background: '#fff0f6', borderRadius: '8px', padding: '1.25rem', textAlign: 'center', border: '1px solid #ffdeeb' }}>
                                            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#c2255c' }}>{studentDetailData.attendance.absent}</p>
                                            <p style={{ fontSize: '0.85rem', color: '#c2255c' }}>Absent</p>
                                        </div>
                                        <div style={{ background: '#fff9db', borderRadius: '8px', padding: '1.25rem', textAlign: 'center', border: '1px solid #ffec99' }}>
                                            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#e67700' }}>{studentDetailData.attendance.leaves}</p>
                                            <p style={{ fontSize: '0.85rem', color: '#e67700' }}>Leave</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Tables */}
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', color: '#343a40' }}>Module-wise Performance</h3>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: 'white' }}>
                                        <thead>
                                            <tr style={{ background: '#748ffc', color: 'white' }}>
                                                <th style={{ padding: '12px', fontSize: '0.85rem' }}>MODULE</th>
                                                <th style={{ padding: '12px', fontSize: '0.85rem' }}>MARKS OBTAINED</th>
                                                <th style={{ padding: '12px', fontSize: '0.85rem' }}>MAX MARKS</th>
                                                <th style={{ padding: '12px', fontSize: '0.85rem' }}>PERCENTAGE</th>
                                                <th style={{ padding: '12px', fontSize: '0.85rem' }}>GRADE</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {studentDetailData.modules.length === 0 ? (
                                                <tr><td colSpan="5" style={{ padding: '1rem', textAlign: 'center', color: '#868e96' }}>No module marks available</td></tr>
                                            ) : studentDetailData.modules.map((m, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid #dee2e6' }}>
                                                    <td style={{ padding: '12px', color: '#495057' }}>{m.module_name}</td>
                                                    <td style={{ padding: '12px', color: '#495057' }}>{m.module_marks}</td>
                                                    <td style={{ padding: '12px', color: '#495057' }}>{m.max_marks}</td>
                                                    <td style={{ padding: '12px', color: '#495057' }}>{m.percent}%</td>
                                                    <td style={{ padding: '12px', fontWeight: 700, color: m.grade === 'F' ? '#fa5252' : '#2b8a3e' }}>{m.grade}</td>
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
            )
            }

            {/* MODAL OVERLAY: Trainer Detailed Report */}
            {
                selectedTrainerId && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', backdropFilter: 'blur(4px)' }}>
                        <div className="glass-card fade-in" style={{ width: '100%', maxWidth: '800px', maxHeight: '85vh', overflowY: 'auto', background: 'var(--bg-card)', padding: '2rem', position: 'relative' }}>
                            <div style={{ display: 'none' }}></div>
                            {trainerModalLoading ? (
                                <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>
                            ) : trainerDetailData && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {/* Header */}
                                    <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Detailed Report: {trainerDetailData.profile.name}</h2>
                                        <button onClick={() => { setSelectedTrainerId(null); setTrainerDetailData(null); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-main)', display: 'flex' }}>
                                            <X size={24} strokeWidth={3} />
                                        </button>
                                    </div>

                                    {/* Download Monthly Reports Section */}
                                    <div style={{ background: '#6c5ce7', borderRadius: '12px', padding: '1.5rem', color: 'white' }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Download size={18} /> Download Monthly Reports
                                        </h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) auto auto', gap: '1rem', alignItems: 'flex-end' }}>
                                            <div>
                                                <p style={{ fontSize: '0.85rem', marginBottom: '6px' }}>Month</p>
                                                <select
                                                    value={trainerMonth}
                                                    onChange={(e) => setTrainerMonth(e.target.value)}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', background: 'white', color: 'var(--bg-dark)' }}
                                                >
                                                    {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => (
                                                        <option key={m} value={i + 1}>{m}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <p style={{ fontSize: '0.85rem', marginBottom: '6px' }}>Year</p>
                                                <select
                                                    value={trainerYear}
                                                    onChange={(e) => setTrainerYear(e.target.value)}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', background: 'white', color: 'var(--bg-dark)' }}
                                                >
                                                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                                                </select>
                                            </div>
                                            <button
                                                onClick={() => handleDownloadKRA(selectedTrainerId)}
                                                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'white', color: '#6c5ce7', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                            >
                                                <Download size={16} /> Download KRA
                                            </button>
                                            <button
                                                onClick={() => handleDownloadFullReport(selectedTrainerId)}
                                                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'white', color: '#6c5ce7', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                            >
                                                <BarChart3 size={16} /> Download Full Report
                                            </button>
                                        </div>
                                    </div>

                                    {/* Profile info grid */}
                                    <div style={{ background: '#e6fcf5', borderRadius: '12px', padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', color: '#212529' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div><strong>Email:</strong> {trainerDetailData.profile.email}</div>
                                            <div><strong>Specialization:</strong> {trainerDetailData.profile.specialization || 'N/A'}</div>
                                            <div><strong>Comp Balance:</strong> {trainerDetailData.profile.comp_balance || 0} days</div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div><strong>Phone:</strong> {trainerDetailData.profile.phone || 'N/A'}</div>
                                            <div><strong>CL Balance:</strong> {trainerDetailData.profile.cl_balance || 0} days</div>
                                        </div>
                                    </div>

                                    {/* Top KPI Row */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                                        <div style={{ background: '#748ffc', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', color: 'white' }}>
                                            <p style={{ fontSize: '2rem', fontWeight: 800 }}>{trainerDetailData.profile.total_batches}</p>
                                            <p style={{ fontSize: '0.85rem' }}>Total Batches</p>
                                        </div>
                                        <div style={{ background: '#20c997', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', color: 'white' }}>
                                            <p style={{ fontSize: '2rem', fontWeight: 800 }}>{trainerDetailData.profile.active_batches}</p>
                                            <p style={{ fontSize: '0.85rem' }}>Active Batches</p>
                                        </div>
                                        <div style={{ background: '#fcc419', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', color: 'white' }}>
                                            <p style={{ fontSize: '2rem', fontWeight: 800 }}>{trainerDetailData.profile.students_taught}</p>
                                            <p style={{ fontSize: '0.85rem' }}>Students Taught</p>
                                        </div>
                                        <div style={{ background: '#ff6b6b', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', color: 'white' }}>
                                            <p style={{ fontSize: '2rem', fontWeight: 800 }}>{trainerDetailData.attendance.attendance_pct}%</p>
                                            <p style={{ fontSize: '0.85rem' }}>Attendance (90d)</p>
                                        </div>
                                    </div>

                                    {/* Task Performance Metrics */}
                                    <div>
                                        <SectionHeader title="Task Performance Metrics" />
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                            <div style={{ background: 'var(--bg-surface)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
                                                <p style={{ color: '#4dabf7', fontWeight: 700, marginBottom: '1.5rem' }}>Overall Performance</p>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Tasks</p>
                                                <p style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>{trainerDetailData.tasks.overall.assigned}</p>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Completed</p>
                                                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#20c997', marginBottom: '1rem' }}>{trainerDetailData.tasks.overall.completed}</p>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Completion Rate</p>
                                                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4dabf7' }}>{trainerDetailData.tasks.overall.rate}%</p>
                                            </div>
                                            <div style={{ background: 'var(--bg-surface)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
                                                <p style={{ color: '#20c997', fontWeight: 700, marginBottom: '1.5rem' }}>This Month</p>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Assigned</p>
                                                <p style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>{trainerDetailData.tasks.thisMonth.assigned}</p>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Completed</p>
                                                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#20c997', marginBottom: '1rem' }}>{trainerDetailData.tasks.thisMonth.completed}</p>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Completion Rate</p>
                                                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4dabf7' }}>{trainerDetailData.tasks.thisMonth.rate}%</p>
                                            </div>
                                            <div style={{ background: 'var(--bg-surface)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
                                                <p style={{ color: '#ff922b', fontWeight: 700, marginBottom: '1.5rem' }}>Last Month</p>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Assigned</p>
                                                <p style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>{trainerDetailData.tasks.lastMonth.assigned}</p>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Completed</p>
                                                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#20c997', marginBottom: '1rem' }}>{trainerDetailData.tasks.lastMonth.completed}</p>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Completion Rate</p>
                                                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4dabf7' }}>{trainerDetailData.tasks.lastMonth.rate}%</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Daily KRA */}
                                    <div>
                                        <SectionHeader title="Daily KRA (Key Result Areas) - Last 30 Days" />
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                                            <div style={{ background: 'var(--bg-surface)', borderRadius: '8px', padding: '1.25rem', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                                                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4dabf7' }}>{trainerDetailData.kra.total_entries}</p>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>KRA Entries</p>
                                            </div>
                                            <div style={{ background: 'var(--bg-surface)', borderRadius: '8px', padding: '1.25rem', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                                                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#20c997' }}>{trainerDetailData.kra.total_entries}</p>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Entries</p>
                                            </div>
                                            <div style={{ background: 'var(--bg-surface)', borderRadius: '8px', padding: '1.25rem', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                                                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ff922b' }}>{trainerDetailData.kra.days_with_classes}</p>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Days with Classes</p>
                                            </div>
                                            <div style={{ background: 'var(--bg-surface)', borderRadius: '8px', padding: '1.25rem', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                                                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#20c997' }}>
                                                    {trainerDetailData.kra.active_tracking ? <CheckCircle2 size={24} color="#20c997" style={{ margin: '0 auto' }} /> : <AlertCircle size={24} color="#ff6b6b" style={{ margin: '0 auto' }} />}
                                                </p>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Active Tracking</p>
                                            </div>
                                        </div>
                                        {trainerDetailData.kra.history.length === 0 ? (
                                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', margin: '2rem 0' }}>No KRA entries in the last 30 days</p>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {trainerDetailData.kra.history.map((k, i) => (
                                                    <div key={i} style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div>
                                                            <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{new Date(k.date).toLocaleDateString()}</p>
                                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Task: {k.task_name}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Attendance Record */}
                                    <div>
                                        <SectionHeader title="Attendance Record (Last 90 Days)" />
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                                            <div style={{ background: 'rgba(77, 171, 247, 0.1)', borderRadius: '8px', padding: '1.25rem', textAlign: 'center' }}>
                                                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4dabf7' }}>{trainerDetailData.attendance.days_marked}</p>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Days Marked</p>
                                            </div>
                                            <div style={{ background: 'rgba(32, 201, 151, 0.1)', borderRadius: '8px', padding: '1.25rem', textAlign: 'center' }}>
                                                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#20c997' }}>{trainerDetailData.attendance.forenoon_present}</p>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Forenoon Present</p>
                                            </div>
                                            <div style={{ background: 'rgba(81, 207, 102, 0.1)', borderRadius: '8px', padding: '1.25rem', textAlign: 'center' }}>
                                                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#51cf66' }}>{trainerDetailData.attendance.afternoon_present}</p>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Afternoon Present</p>
                                            </div>
                                            <div style={{ background: 'rgba(250, 176, 5, 0.1)', borderRadius: '8px', padding: '1.25rem', textAlign: 'center' }}>
                                                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fab005' }}>{trainerDetailData.attendance.attendance_pct}%</p>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Attendance %</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {/* Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Analytics & Intelligence</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Master control center for operations and performance tracking.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        className="glass-card"
                        onClick={handleExport}
                        style={{
                            padding: '8px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            borderColor: 'var(--primary)',
                            background: 'rgba(77, 171, 247, 0.1)',
                            color: 'var(--primary)',
                            fontWeight: 600,
                            transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(77, 171, 247, 0.2)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgba(77, 171, 247, 0.1)'}
                    >
                        <Download size={18} /> Export Performance
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '6px', background: 'var(--bg-surface)',
                borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '2.5rem'
            }}>
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
                                display: 'flex', alignItems: 'center', gap: '8px'
                            }}>
                            <Icon size={18} /> {tab.label}
                        </button>
                    );
                })}
            </div>

            {
                loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '1rem' }}>
                        <div className="spinner" style={{ width: '40px', height: '40px' }} />
                        <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Aggregating real-time data...</p>
                    </div>
                ) : (
                    <div className="fade-in">

                        {/* 1. COMMON DASHBOARD (24 KPIs) */}
                        {activeTab === 'common' && dashboardData && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                                {/* Core Entities */}
                                <section>
                                    <SectionHeader title="Core Entities & Growth" description="Global footprint and enrollment metrics." />
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
                                        <KPICard title="Active Students" value={dashboardData.coreEntities.activeStudents} icon={Users} gradient={['#4c6ef5', '#748ffc']} subtitle="Currently enrolled" />
                                        <KPICard title="Total Trainers" value={dashboardData.coreEntities.totalTrainers} icon={UserCheck} gradient={['#15aabf', '#3bc9db']} subtitle="Corporate faculty" />
                                        <KPICard title="Active Courses" value={dashboardData.coreEntities.activeCourses} icon={GraduationCap} gradient={['#fab005', '#ffe066']} subtitle="Curriculum depth" />
                                        <KPICard title="Active Batches" value={dashboardData.coreEntities.activeBatches} icon={Hexagon} gradient={['#ae3ec9', '#d0bfff']} subtitle="Parallel sessions" />
                                        <KPICard title="Total Enrollments" value={dashboardData.coreEntities.totalEnrollments} icon={TrendingUp} gradient={['#2f9e44', '#51cf66']} subtitle="Life-time reach" />
                                        <KPICard title="New Enrollments" value={dashboardData.coreEntities.newEnrollments} icon={Clock} gradient={['#1098ad', '#22b8cf']} subtitle="Last 30 days" />
                                        <KPICard title="Upcoming Batches" value={dashboardData.coreEntities.upcomingBatches} icon={Calendar} gradient={['#f76707', '#ffa94d']} subtitle="In pipeline" />
                                        <KPICard title="Completed Batches" value={dashboardData.coreEntities.completedBatches} icon={CheckCircle2} gradient={['#37b24d', '#69db7c']} subtitle="Successful runs" />
                                    </div>
                                </section>

                                {/* Daily Operations */}
                                <section>
                                    <SectionHeader title="Daily Operations (Live Tracking)" description="Today's engagement and session health." />
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
                                        <KPICard title="Students Present" value={dashboardData.dailyOperations.studentsPresentToday} icon={Users} gradient={['#4263eb', '#748ffc']} subtitle="Marked today" />
                                        <KPICard title="Students Absent" value={dashboardData.dailyOperations.studentsAbsentToday} icon={AlertCircle} gradient={['#f03e3e', '#ff8787']} subtitle="Action required" />
                                        <KPICard title="Trainers Present" value={dashboardData.dailyOperations.trainersPresentToday} icon={UserCheck} gradient={['#099268', '#38d9a9']} subtitle="Active faculty" />
                                        <KPICard title="Classes Today" value={dashboardData.dailyOperations.classesScheduledToday} icon={Calendar} gradient={['#1c7ed6', '#4dabf7']} subtitle="Scheduled tasks" />
                                        <KPICard title="Students on Leave" value={dashboardData.dailyOperations.studentsOnLeaveToday} icon={Clock} gradient={['#868e96', '#adb5bd']} subtitle="Formal approvals" />
                                    </div>
                                </section>

                                {/* Quality & Productivity */}
                                <section>
                                    <SectionHeader title="Quality & Productivity Health" description="Academic performance and task velocity." />
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
                                        <KPICard title="Avg Test Score" value={`${dashboardData.qualityEngagement.globalAvgTestScore}%`} icon={Target} gradient={['#f59f00', '#ffec99']} subtitle="Across all courses" />
                                        <KPICard title="30d Attendance" value={`${dashboardData.qualityEngagement.avgStudentAttendance30d}%`} icon={TrendingUp} gradient={['#15aabf', '#99e9f2']} subtitle="Consistency health" />
                                        <KPICard title="Trainer Rating" value={`${dashboardData.qualityEngagement.avgTrainerRating}/5`} icon={Award} gradient={['#7048e8', '#b197fc']} subtitle="Faculty satisfaction" />
                                        <KPICard title="Critical Alerts" value={dashboardData.qualityEngagement.criticalAlerts} icon={AlertCircle} gradient={['#e03131', '#ffc9c9']} subtitle="Unresolved issues" />

                                        <KPICard title="Completed Tasks" value={dashboardData.taskHealth.globalCompletedTasks} icon={CheckCircle2} gradient={['#2f9e44', '#b2f2bb']} subtitle="Global completion" />
                                        <KPICard title="Pending Tasks" value={dashboardData.taskHealth.globalPendingTasks} icon={Clock} gradient={['#d9480f', '#ffc078']} subtitle="Awaiting action" />
                                        <KPICard title="Overdue Tasks" value={dashboardData.taskHealth.globalOverdueTasks} icon={AlertCircle} gradient={['#c92a2a', '#ffa8a8']} subtitle="Immediate follow-up" />
                                        <KPICard title="Portfolios Generated" value={dashboardData.taskHealth.totalPortfoliosGenerated} icon={Briefcase} gradient={['#25262b', '#495057']} subtitle="Live portfolios" />
                                    </div>
                                </section>
                            </div>
                        )}

                        {/* 2. ATTENDANCE REPORT (3-Tier Drill-down) */}
                        {activeTab === 'attendance' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                                {/* Breadcrumbs / Back Navigation */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.5rem' }}>
                                    <button
                                        onClick={() => setAttendanceView('summary')}
                                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: attendanceView === 'summary' ? 'var(--primary)10' : 'var(--bg-card)', color: attendanceView === 'summary' ? 'var(--primary)' : 'inherit', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                                    >
                                        Global Summary
                                    </button>
                                    <ChevronRight size={14} color="var(--text-muted)" />
                                    <button
                                        onClick={handleViewGroups}
                                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: attendanceView === 'groups' ? 'var(--primary)10' : 'var(--bg-card)', color: attendanceView === 'groups' ? 'var(--primary)' : 'inherit', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                                    >
                                        Batch Hub
                                    </button>
                                    {['sub-batches', 'detailed'].includes(attendanceView) && (
                                        <>
                                            <ChevronRight size={14} color="var(--text-muted)" />
                                            <button
                                                onClick={() => handleViewGroupBatches(selectedAttendanceGroup)}
                                                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: attendanceView === 'sub-batches' ? 'var(--primary)10' : 'var(--bg-card)', color: attendanceView === 'sub-batches' ? 'var(--primary)' : 'inherit', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                                            >
                                                {selectedAttendanceGroup}
                                            </button>
                                        </>
                                    )}
                                    {attendanceView === 'detailed' && (
                                        <>
                                            <ChevronRight size={14} color="var(--text-muted)" />
                                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>Detailed Metrics</span>
                                        </>
                                    )}
                                </div>

                                {attendanceLoading ? (
                                    <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>
                                ) : (
                                    <>
                                        {/* Level 0: Summary (Default) */}
                                        {attendanceView === 'summary' && attendanceData && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--primary)05', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--primary)20' }}>
                                                    <div>
                                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>Attendance Performance Hub</h3>
                                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Drill down into specific batches for granular student attendance tracking.</p>
                                                    </div>
                                                    <button
                                                        onClick={handleViewGroups}
                                                        style={{ padding: '12px 24px', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 12px var(--primary)30' }}
                                                    >
                                                        <LayoutDashboard size={18} /> Enter Batch Wise Reports
                                                    </button>
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                                                    {/* Course-wise Map */}
                                                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                                                        <SectionHeader title="Course-wise Calendar Map" description="Attendance distribution for today's active sessions." />
                                                        <div style={{ display: 'grid', gap: '12px' }}>
                                                            {attendanceData.calendar.length === 0 ? (
                                                                <p style={{ color: 'var(--text-muted)' }}>No live sessions today.</p>
                                                            ) : attendanceData.calendar.map((c, i) => (
                                                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '12px', background: 'var(--bg-surface-hover)', borderRadius: '10px' }}>
                                                                    <div style={{ flex: 1 }}>
                                                                        <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>{c.course_name} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({c.batch_name})</span></h4>
                                                                    </div>
                                                                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                                                        <div style={{ textAlign: 'right' }}>
                                                                            <span style={{ display: 'block', fontSize: '1rem', fontWeight: 700, color: '#51cf66' }}>{c.present}</span>
                                                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Present</span>
                                                                        </div>
                                                                        <div style={{ textAlign: 'right' }}>
                                                                            <span style={{ display: 'block', fontSize: '1rem', fontWeight: 700, color: '#ff6b6b' }}>{c.absent}</span>
                                                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Absent</span>
                                                                        </div>
                                                                        <div style={{ width: '80px', height: '6px', background: '#f1f3f5', borderRadius: '3px' }}>
                                                                            <div style={{ width: `${(c.present / c.total) * 100}%`, height: '100%', background: '#51cf66', borderRadius: '3px' }} />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Absence Alerts */}
                                                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                                                        <SectionHeader title="Automated Absence Alerts" description="Critical follow-ups triggered." />
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                            <div style={{ padding: '12px', background: '#ff6b6b10', borderRadius: '10px', border: '1px solid #ff6b6b30' }}>
                                                                <h4 style={{ color: '#ff6b6b', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                    <AlertCircle size={14} /> 3+ Days Consecutive
                                                                </h4>
                                                                {attendanceData.alerts.consecutive3d.length === 0 ? <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>All clear.</p> :
                                                                    attendanceData.alerts.consecutive3d.map((a, i) => (
                                                                        <div key={i} style={{ fontSize: '0.8rem', borderTop: '1px solid #ff6b6b20', paddingTop: '8px', marginTop: '8px' }}>
                                                                            <strong>{a.first_name}</strong> ({a.batch_name})
                                                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Management notified.</p>
                                                                        </div>
                                                                    ))
                                                                }
                                                            </div>
                                                            <div style={{ padding: '12px', background: '#fab00510', borderRadius: '10px', border: '1px solid #fab00530' }}>
                                                                <h4 style={{ color: '#f59f00', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                    <Clock size={14} /> 2 Days Consecutive
                                                                </h4>
                                                                {attendanceData.alerts.consecutive2d.length === 0 ? <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>None today.</p> :
                                                                    attendanceData.alerts.consecutive2d.map((a, i) => (
                                                                        <div key={i} style={{ fontSize: '0.8rem', borderTop: '1px solid #fab00520', paddingTop: '8px', marginTop: '8px' }}>
                                                                            <strong>{a.first_name}</strong> - Student warned.
                                                                        </div>
                                                                    ))
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Level 1: Batch Groups */}
                                        {attendanceView === 'groups' && (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
                                                {attendanceBatchGroups.length === 0 ? <p>No active batch groups found.</p> : attendanceBatchGroups.map(group => (
                                                    <div
                                                        key={group}
                                                        className="glass-card"
                                                        onClick={() => handleViewGroupBatches(group)}
                                                        style={{ padding: '2rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid var(--border-color)' }}
                                                        onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                                                        onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                                                    >
                                                        <div style={{ width: '60px', height: '60px', background: 'var(--primary)10', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                                                            <Briefcase size={30} color="var(--primary)" />
                                                        </div>
                                                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '4px' }}>{group}</h3>
                                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>View Internal Schedules</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Level 2: Sub-Batches (Schedules) */}
                                        {attendanceView === 'sub-batches' && (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                                                {attendanceSubBatches.length === 0 ? <p>No internal schedules found for this group.</p> : attendanceSubBatches.map(b => (
                                                    <div
                                                        key={b.batch_id}
                                                        className="glass-card"
                                                        onClick={() => handleViewDetailedAttendance(b.batch_id)}
                                                        style={{ padding: '1.5rem', cursor: 'pointer', border: '1px solid var(--border-color)', transition: 'all 0.2s' }}
                                                        onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                                                        onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                                                    >
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{b.batch_name}</h3>
                                                            <div style={{ background: 'var(--primary)10', padding: '6px', borderRadius: '8px' }}>
                                                                <Clock size={16} color="var(--primary)" />
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <GraduationCap size={14} /> {b.course_name}
                                                            </p>
                                                            <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)', marginTop: '4px' }}>{b.timing}</p>
                                                        </div>
                                                        <button style={{ marginTop: '1.5rem', width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--primary)30', background: 'var(--primary)05', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                            View Performance Details <ChevronRight size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Level 3: Detailed KPI + Table */}
                                        {attendanceView === 'detailed' && detailedAttendanceData && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
                                                    <div>
                                                        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{detailedAttendanceData.batch_name}</h2>
                                                        <p style={{ color: 'var(--text-muted)' }}>Daily Attendance tracking & health metrics.</p>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-card)', padding: '8px 16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                                                        <Calendar size={18} color="var(--primary)" />
                                                        <input
                                                            type="date"
                                                            value={attendanceDate}
                                                            onChange={(e) => {
                                                                setAttendanceDate(e.target.value);
                                                                handleViewDetailedAttendance(selectedAttendanceBatchId, e.target.value);
                                                            }}
                                                            style={{ border: 'none', background: 'transparent', fontWeight: 600, color: 'var(--text-main)', outline: 'none' }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* 3 KPI Cards */}
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                                                    <div style={{ background: 'linear-gradient(135deg, #748ffc, #4c6ef5)', borderRadius: '16px', padding: '2rem', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div>
                                                            <p style={{ fontSize: '0.9rem', fontWeight: 600, opacity: 0.9, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Strength</p>
                                                            <p style={{ fontSize: '2.8rem', fontWeight: 800 }}>{detailedAttendanceData.kpis.total}</p>
                                                        </div>
                                                        <Users size={48} style={{ opacity: 0.3 }} />
                                                    </div>
                                                    <div style={{ background: 'linear-gradient(135deg, #63e6be, #20c997)', borderRadius: '16px', padding: '2rem', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div>
                                                            <p style={{ fontSize: '0.9rem', fontWeight: 600, opacity: 0.9, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Present Today</p>
                                                            <p style={{ fontSize: '2.8rem', fontWeight: 800 }}>{detailedAttendanceData.kpis.present}</p>
                                                        </div>
                                                        <UserCheck size={48} style={{ opacity: 0.3 }} />
                                                    </div>
                                                    <div style={{ background: 'linear-gradient(135deg, #ff8787, #fa5252)', borderRadius: '16px', padding: '2rem', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div>
                                                            <p style={{ fontSize: '0.9rem', fontWeight: 600, opacity: 0.9, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Absent Today</p>
                                                            <p style={{ fontSize: '2.8rem', fontWeight: 800 }}>{detailedAttendanceData.kpis.absent}</p>
                                                        </div>
                                                        <AlertCircle size={48} style={{ opacity: 0.3 }} />
                                                    </div>
                                                </div>

                                                {/* Detailed Table */}
                                                <div>
                                                    <SectionHeader title="Student-wise Attendance Status" description="Detailed breakdown of presence for the selected date." />
                                                    <div className="glass-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                            <thead>
                                                                <tr style={{ background: 'var(--bg-surface-hover)', borderBottom: '1px solid var(--border-color)' }}>
                                                                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Student Name</th>
                                                                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Email ID</th>
                                                                    <th style={{ padding: '16px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Status (Today)</th>
                                                                    <th style={{ padding: '16px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Present / Absent Overall</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {detailedAttendanceData.details.length === 0 ? (
                                                                    <tr><td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No student records found in this batch.</td></tr>
                                                                ) : detailedAttendanceData.details.map((s, i) => (
                                                                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                                                                        <td style={{ padding: '16px', fontWeight: 600 }}>{s.first_name} {s.last_name}</td>
                                                                        <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{s.email}</td>
                                                                        <td style={{ padding: '16px', textAlign: 'center' }}>
                                                                            <span style={{
                                                                                padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase',
                                                                                background: s.status === 'present' ? '#ebfbee' : s.status === 'absent' ? '#fff5f5' : '#f8f9fa',
                                                                                color: s.status === 'present' ? '#2b8a3e' : s.status === 'absent' ? '#c92a2a' : '#495057',
                                                                                border: `1px solid ${s.status === 'present' ? '#b2f2bb' : s.status === 'absent' ? '#ffa8a8' : '#dee2e6'}`
                                                                            }}>
                                                                                {s.status}
                                                                            </span>
                                                                        </td>
                                                                        <td style={{ padding: '16px', textAlign: 'center' }}>
                                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2b8a3e' }}>{s.total_present}P</span>
                                                                                <span style={{ color: 'var(--border-color)' }}>|</span>
                                                                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#c92a2a' }}>{s.total_absent}A</span>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* 3. BATCH REPORT (Cards + Drill-down) */}
                        {activeTab === 'batches' && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                                {batchHub.length === 0 ? <p>No batches found.</p> : batchHub.map((b, i) => (
                                    <div key={i} className="glass-card" style={{ padding: '1.5rem', cursor: 'pointer', transition: 'all 0.2s' }}
                                        onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                                        onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-color)'}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                            <span style={{
                                                padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                                                background: b.status === 'active' ? '#51cf6615' : 'var(--bg-surface-hover)',
                                                color: b.status === 'active' ? '#51cf66' : 'var(--text-muted)'
                                            }}>{b.status}</span>
                                            <MoreHorizontal size={18} style={{ color: 'var(--text-muted)' }} />
                                        </div>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>{b.batch_name}</h3>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>{b.course_name}</p>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                                            <div>
                                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Enrolled</p>
                                                <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{b.enrolled_count}</p>
                                            </div>
                                            <div>
                                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Trainer</p>
                                                <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>{b.trainer_name || 'Unassigned'}</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleBatchClick(b.batch_id)}
                                            style={{
                                                marginTop: '1.25rem', width: '100%', padding: '10px', borderRadius: '8px',
                                                border: '1px solid var(--primary)30', background: 'var(--primary)08', color: 'var(--primary)',
                                                fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            View Full Batch Report <ChevronRight size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 4. TRAINERS REPORT */}
                        {activeTab === 'trainers' && (
                            <div className="glass-card" style={{ overflow: 'hidden', padding: 0 }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface-hover)' }}>
                                            {['Trainer Name', 'Batch Count', 'Rating', 'Tasks Done', 'KRA Score', 'Actions'].map(h => (
                                                <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {trainerReport.map((t, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <td style={{ padding: '16px', fontWeight: 600 }}>{t.name}</td>
                                                <td style={{ padding: '16px' }}>{t.active_batches} Active</td>
                                                <td style={{ padding: '16px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fab005', fontWeight: 700 }}>
                                                        {Number(t.avg_rating).toFixed(1)} <Award size={14} />
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                                        <span style={{ fontWeight: 700, color: '#51cf66' }}>{t.tasks_completed}</span>
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ {t.tasks_completed + t.tasks_pending}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px' }}>
                                                    <div style={{ width: '100px', height: '6px', background: '#f1f3f5', borderRadius: '3px' }}>
                                                        <div style={{ width: `${Math.min((t.tasks_completed / (t.tasks_completed + t.tasks_pending)) * 100, 100)}%`, height: '100%', background: 'var(--primary)', borderRadius: '3px' }} />
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px' }}>
                                                    <button
                                                        onClick={() => handleTrainerClick(t.trainer_id)}
                                                        style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem', background: 'transparent', border: 'none', cursor: 'pointer' }}
                                                    >
                                                        View Detail
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'feedback' && (
                            <div className="glass-card" style={{ overflow: 'hidden', padding: 0 }}>
                                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <SectionHeader title="Student Feedback Responses" description="Hierarchical view of feedback submitted by students." />
                                </div>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface-hover)' }}>
                                            {['Student', 'Batch & Module', 'Form Title', 'Submitted At', 'Actions'].map(h => (
                                                <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {feedbackReports.map((r, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <td style={{ padding: '16px' }}>
                                                    <p style={{ fontWeight: 600 }}>{r.first_name} {r.last_name}</p>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.email}</p>
                                                </td>
                                                <td style={{ padding: '16px' }}>
                                                    <p style={{ fontWeight: 500 }}>{r.batch_name}</p>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-accent)' }}>{r.module_name || 'General'}</p>
                                                </td>
                                                <td style={{ padding: '16px', fontWeight: 500 }}>{r.form_title}</td>
                                                <td style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                    {new Date(r.submitted_at).toLocaleString()}
                                                </td>
                                                <td style={{ padding: '16px' }}>
                                                    <button
                                                        className="text-primary text-sm font-bold bg-transparent border-none cursor-pointer"
                                                        onClick={() => {
                                                            alert(JSON.stringify(typeof r.response_json === 'string' ? JSON.parse(r.response_json) : r.response_json, null, 2));
                                                        }}
                                                    >
                                                        View Responses
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {feedbackReports.length === 0 && (
                                            <tr>
                                                <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                    <AlertCircle size={32} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.5 }} />
                                                    No feedback submissions found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                    </div>
                )
            }
        </div >
    );
};
