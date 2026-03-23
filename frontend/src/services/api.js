import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_BASE });

// Auto-attach JWT token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auto-handle 401 (expired/invalid token)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ==========================================
// SUPER ADMIN API FUNCTIONS
// ==========================================

export const superAdminAPI = {
    // Dashboard
    getDashboardStats: () => api.get('/super-admin/dashboard-stats'),
    getNotificationCounts: () => api.get('/super-admin/notification-counts'),
getCourseCapstones: (courseId) => api.get(`/super-admin/courses/${courseId}/capstones`),
createCapstone: (courseId, data) => api.post(`/super-admin/courses/${courseId}/capstones`, data),
updateCapstone: (id, data) => api.put(`/super-admin/capstones/${id}`, data),
deleteCapstone: (id) => api.delete(`/super-admin/capstones/${id}`),
uploadCapstoneFiles: (id, formData) => api.post(`/super-admin/capstones/${id}/files`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
}),
deleteCapstoneFile: (fileId) => api.delete(`/super-admin/capstone-files/${fileId}`),
    // Courses
    getCourses: () => api.get('/super-admin/courses'),
    createCourse: (data) => api.post('/super-admin/courses', data),
    getFullCourseTree: (id) => api.get(`/super-admin/courses/${id}/full`),
    updateCourse: (id, data) => api.put(`/super-admin/courses/${id}`, data),
    deleteCourse: (id) => api.delete(`/super-admin/courses/${id}`),

    // Modules
    getModules: (courseId) => api.get(`/super-admin/courses/${courseId}/modules`),
    createModule: (data) => api.post('/super-admin/modules', data),
    updateModule: (id, data) => api.put(`/super-admin/modules/${id}`, data),
    deleteModule: (id) => api.delete(`/super-admin/modules/${id}`),

    // Days
    getDays: (moduleId) => api.get(`/super-admin/modules/${moduleId}/days`),
    createDay: (data) => api.post('/super-admin/days', data),
    updateDay: (id, data) => api.put(`/super-admin/days/${id}`, data),
    deleteDay: (id) => api.delete(`/super-admin/days/${id}`),

    // Projects
    getProjects: (moduleId) => api.get(`/super-admin/modules/${moduleId}/projects`),
    createProject: (data) => api.post('/super-admin/projects', data),
    updateProject: (id, data) => api.put(`/super-admin/projects/${id}`, data),
    deleteProject: (id) => api.delete(`/super-admin/projects/${id}`),

    // Content Files
    uploadContentFiles: (formData) => api.post('/super-admin/content-files/upload', formData),
    getContentFiles: (entityType, entityId) => api.get(`/super-admin/content-files/${entityType}/${entityId}`),
    deleteContentFile: (id) => api.delete(`/super-admin/content-files/${id}`),

    // Batches
    getBatches: () => api.get('/super-admin/batches'),
    createBatch: (data) => api.post('/super-admin/batches', data),
    updateBatch: (id, data) => api.put(`/super-admin/batches/${id}`, data),
    deleteBatch: (id) => api.delete(`/super-admin/batches/${id}`),

    // Students
    getStudents: () => api.get('/super-admin/students'),
    createStudent: (data) => api.post('/super-admin/students', data),
    bulkCreateStudents: (data) => api.post('/super-admin/students/bulk', data),
    bulkAssignBatch: (data) => api.post('/super-admin/students/bulk-assign-batch', data),
    downloadStudentTemplate: () => api.get('/super-admin/students/template', { responseType: 'blob' }),
    updateStudent: (id, data) => api.put(`/super-admin/students/${id}`, data),
    deleteStudent: (id) => api.delete(`/super-admin/students/${id}`),
    transferStudentBatch: (id, data) => api.post(`/super-admin/students/${id}/transfer-batch`, data),
    updateStudentStatus: (id, data) => api.put(`/super-admin/students/${id}/status`, data),

    // Trainers
    getTrainers: () => api.get('/super-admin/trainers'),
    createTrainer: (data) => api.post('/super-admin/trainers', data),
    updateTrainer: (id, data) => api.put(`/super-admin/trainers/${id}`, data),
    deleteTrainer: (id) => api.delete(`/super-admin/trainers/${id}`),

    // Trainer Tasks
    getTrainerTasks: () => api.get('/super-admin/trainer-tasks'),
    createTrainerTask: (data) => api.post('/super-admin/trainer-tasks', data),
    updateTrainerTask: (id, data) => api.put(`/super-admin/trainer-tasks/${id}`, data),

    // Trainer Attendance
    getTrainerAttendance: (date) => api.get(`/super-admin/trainer-attendance?date=${date}`),
    markTrainerAttendance: (data) => api.post('/super-admin/trainer-attendance', data),
    getMonthlyAttendanceReport: (year, month, format) => api.get(`/super-admin/trainer-attendance/monthly-report?year=${year}&month=${month}${format ? '&format=' + format : ''}`, format === 'csv' ? { responseType: 'blob' } : {}),
    updateCasualLeaveCount: (id, data) => api.put(`/super-admin/trainer-attendance/casual-leave/${id}`, data),

    // Portfolios
    getPortfolios: () => api.get('/super-admin/portfolios'),
    updatePortfolio: (id, data) => api.put(`/super-admin/portfolios/${id}`, data),
    deletePortfolio: (id) => api.delete(`/super-admin/portfolios/${id}`),

    // Announcements
    getAnnouncements: () => api.get('/super-admin/announcements'),
    broadcastAnnouncement: (data) => api.post('/super-admin/announcements', data),

    // Meeting Links
    getMeetingLinks: () => api.get('/super-admin/meeting-links'),
    updateMeetingLink: (batchId, data) => api.put(`/super-admin/meeting-links/${batchId}`, data),

    // Reports
    getTrainerReport: () => api.get('/super-admin/reports/trainers'),
    getBatchReport: () => api.get('/super-admin/reports/batches'),
    getStudentReport: () => api.get('/super-admin/reports/students'),
    getCourseReport: () => api.get('/super-admin/reports/courses'),

    // Advanced Reports & Analytics
    getAttendanceAnalytics: (courseId, batchId) => api.get(`/super-admin/reports/attendance-analytics?course_id=${courseId || ''}&batch_id=${batchId || ''}`),
    getBatchHub: () => api.get('/super-admin/reports/batch-hub'),
    getBatchDetails: (id) => api.get(`/super-admin/reports/batch-details/${id}`),
    getStudentDetailedReport: (id) => api.get(`/super-admin/reports/student-detailed/${id}`),
    getTrainerDetailedReport: (id) => api.get(`/super-admin/reports/trainer-detailed/${id}`),
    downloadTrainerKRA: (id, month, year) => api.get(`/super-admin/reports/trainer/${id}/download-kra?month=${month}&year=${year}`, { responseType: 'blob' }),
    downloadTrainerFullReport: (id) => api.get(`/super-admin/reports/trainer/${id}/download-full-report`, { responseType: 'blob' }),

    // Attendance Drill-down V3
    getAttendanceGroups: () => api.get('/super-admin/reports/attendance/groups'),
    getAttendanceSubBatches: (group) => api.get(`/super-admin/reports/attendance/sub-batches?group=${group}`),
    getDetailedBatchAttendance: (id, date) => api.get(`/super-admin/reports/attendance/detailed/${id}?date=${date || ''}`),

    // Operations
    getDailyKRA: (date) => api.get(`/super-admin/daily-kra?date=${date}`),

    // Student Queries & Escalations
    getStudentIssues: () => api.get('/super-admin/student-issues'),
    updateStudentIssue: (id, data) => api.put(`/super-admin/student-issues/${id}`, data),
    getStudentDoubts: () => api.get('/super-admin/student-doubts'),

    // Certificates
    issueCertificate: (data) => api.post('/certificates/issue', data),
    getAllCertificates: () => api.get('/certificates/all'),
    getStudentCertificates: (studentId) => api.get(`/certificates/student/${studentId}`),
    deleteCertificate: (id) => api.delete(`/certificates/${id}`),
    // Dynamic Feedback System
    createFeedbackForm: (data) => api.post('/super-admin/feedback-forms', data),
    getFeedbackForms: () => api.get('/super-admin/feedback-forms'),
    getFeedbackReports: (params) => api.get('/super-admin/reports/feedback', { params }),
    // Trainer Leave Management (Super Admin)
    getAllTrainerLeaves: (status) => api.get(`/super-admin/trainer-leaves${status ? `?status=${status}` : ''}`),
    updateTrainerLeaveStatus: (id, data) => api.patch(`/super-admin/trainer-leaves/${id}`, data),

    // IOP Curriculum Management
    getIOPModules: () => api.get('/super-admin/iop-modules'),
    createIOPModule: (data) => api.post('/super-admin/iop-modules', data),
    updateIOPModule: (id, data) => api.put(`/super-admin/iop-modules/${id}`, data),
    deleteIOPModule: (id) => api.delete(`/super-admin/iop-modules/${id}`),
    getIOPTopics: (moduleId) => api.get(`/super-admin/iop-modules/${moduleId}/topics`),
    createIOPTopic: (data) => api.post('/super-admin/iop-topics', data),
    updateIOPTopic: (id, data) => api.put(`/super-admin/iop-topics/${id}`, data),
    deleteIOPTopic: (id) => api.delete(`/super-admin/iop-topics/${id}`),
    // IOP Module Files (BLOB stored in Aiven MySQL)
    uploadIOPModuleFile: (moduleId, formData) => api.post(`/super-admin/iop-modules/${moduleId}/files`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    deleteIOPModuleFile: (fileId) => api.delete(`/super-admin/iop-module-files/${fileId}`),

    // Progress Report Emails
    sendProgressEmails: (data) => api.post('/super-admin/reports/send-progress-emails', data),

    // IOP Groups Management
    getIOPTrainers: () => api.get('/super-admin/iop-trainers'),
    createIOPTrainer: (data) => api.post('/super-admin/iop-trainers', data),
    getIOPGroups: () => api.get('/super-admin/iop-groups'),
    createIOPGroup: (data) => api.post('/super-admin/iop-groups', data),
    updateIOPGroup: (id, data) => api.put(`/super-admin/iop-groups/${id}`, data),
    deleteIOPGroup: (id) => api.delete(`/super-admin/iop-groups/${id}`),
};

// Auth API (for password change, available to all logged-in users)
export const authAPI = {
    changePassword: (data) => api.post('/auth/change-password', data),
    getUnacknowledgedAnnouncement: () => api.get('/auth/announcements/unacknowledged'),
    acknowledgeAnnouncement: (id) => api.post(`/auth/announcements/${id}/acknowledge`),
};

// Trainer API (trainer portal)
export const trainerAPI = {
    getDashboardStats: () => api.get('/trainer/dashboard'),
    getNotificationCounts: () => api.get('/trainer/notification-counts'),
    getMyCalendar: (month, year) => {
        const params = new URLSearchParams();
        if (month) params.append('month', month);
        if (year) params.append('year', year);
        const query = params.toString();
        return api.get(`/trainer/calendar${query ? `?${query}` : ''}`);
    },
    getMyTasks: () => api.get('/trainer/tasks'),
    submitTaskForReview: (taskId, data) => api.post(`/trainer/tasks/${taskId}/review`, data),
    updateTaskStatus: (taskId, data) => api.patch(`/trainer/tasks/${taskId}`, data),
    submitKRA: (data) => api.post('/trainer/kra', data),
    getMyKRA: () => api.get('/trainer/kra'),
    submitOtherWork: (data) => api.post('/trainer/other-work', data),

    // Students & Batches
    getBatchStudents: (id) => api.get(`/trainer/batches/${id}/students`),
    markAttendance: (data) => api.post('/trainer/attendance', data),
    getBatchAttendance: (batchId, date) => api.get(`/trainer/attendance/${batchId}?date=${date}`),
getReleaseStatus: (batchId) => api.get(`/trainer/batches/${batchId}/release-status`),
releaseDay: (batchId, data) => api.post(`/trainer/batches/${batchId}/release/day`, data),
releaseItem: (batchId, data) => api.post(`/trainer/batches/${batchId}/release/item`, data),
unreleaseItem: (batchId, releaseId) => api.delete(`/trainer/batches/${batchId}/release/${releaseId}`),
getBatchReleaseSubmissions: (batchId) => api.get(`/trainer/batches/${batchId}/release-submissions`),
gradeReleaseSubmission: (submissionId, data) => api.put(`/trainer/release-submissions/${submissionId}/grade`, data),
downloadReleaseSubmissionFile: (submissionId) => api.get(`/trainer/release-submissions/${submissionId}/file`, { responseType: 'blob' }),
    // Student Doubts
    getStudentDoubts: (params) => api.get('/trainer/doubts', { params }),
    resolveDoubt: (doubtId, data) => api.patch(`/trainer/doubts/${doubtId}/resolve`, data),

    // Dynamic Feedback System
    getFeedbackForms: () => api.get('/super-admin/feedback-forms'),
    releaseFeedback: (data) => api.post('/trainer/release-feedback', data),

    // Content Unlock Management
    getBatchCurriculum: (batchId) => api.get(`/trainer/batches/${batchId}/curriculum`),
    unlockModule: (batchId, data) => api.post(`/trainer/batches/${batchId}/unlock`, data),
    lockModule: (batchId, moduleId) => api.delete(`/trainer/batches/${batchId}/unlock/${moduleId}`),

    // Submissions & Grading
    getBatchSubmissions: (batchId, type, page = 1) => api.get(`/trainer/batches/${batchId}/submissions?type=${type || ''}&page=${page}`),
    gradeSubmission: (id, data) => api.post(`/trainer/submissions/${id}/grade`, data),

    // Student Remarks & Performance
    getStudentPerformance: (batchId, studentId) => api.get(`/trainer/batches/${batchId}/students/${studentId}/performance`),
    getStudentRemarks: (batchId, studentId) => api.get(`/trainer/batches/${batchId}/students/${studentId}/remarks`),
    addStudentRemark: (batchId, studentId, data) => api.post(`/trainer/batches/${batchId}/students/${studentId}/remarks`, data),
    updateStudentStatus: (studentId, data) => api.put(`/trainer/students/${studentId}/status`, data),
    deleteStudentRemark: (remarkId) => api.delete(`/trainer/remarks/${remarkId}`),

    // Report Card (module-wise review)
    getStudentReportCard: (batchId, studentId) => api.get(`/trainer/batches/${batchId}/students/${studentId}/report-card`),
    upsertModuleReview: (batchId, studentId, data) => api.post(`/trainer/batches/${batchId}/students/${studentId}/report-card`, data),

    // Announcements
    getAnnouncements: () => api.get('/trainer/announcements'),
    broadcastAnnouncement: (data) => api.post('/trainer/announcements', data),

    // Leaves (trainer's own)
    requestLeave: (data) => api.post('/trainer/leaves', data),
    getMyLeaves: () => api.get('/trainer/leaves'),

    // Student Leave Requests (trainer manages)
    getStudentLeaves: () => api.get('/trainer/student-leaves'),
    updateStudentLeaveStatus: (leaveId, data) => api.patch(`/trainer/student-leaves/${leaveId}`, data),

    // IOP Curriculum (trainer as iop_trainer_id)
    getMyIOPBatches: () => api.get('/trainer/my-iop-batches'),
    getIOPCurriculum: (batchId) => api.get(`/trainer/batches/${batchId}/iop-curriculum`),
    unlockIOPModule: (batchId, data) => api.post(`/trainer/batches/${batchId}/iop-unlock`, data),
    downloadIOPModuleFile: (fileId) => api.get(`/trainer/iop-module-files/${fileId}/download`, { responseType: 'blob' }),
};

// Student API (student portal)
export const studentAPI = {
    getDashboardStats: () => api.get('/student/dashboard'),
    getNotificationCounts: () => api.get('/student/notification-counts'),
    getCalendar: () => api.get('/student/calendar'),
    getCurriculum: () => api.get('/student/curriculum'),
    getTests: () => api.get('/student/tests'),
    getProgress: () => api.get('/student/progress'),

    // Leaves
    getLeaves: () => api.get('/student/leaves'),
    applyForLeave: (data) => api.post('/student/leaves', data),
getReleases: () => api.get('/student/releases'),
submitReleaseWork: (releaseId, formData) => api.post(`/student/releases/${releaseId}/submit`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
}),
    // Doubts & Issues
    getDoubts: () => api.get('/student/doubts'),
    raiseDoubt: (data) => api.post('/student/doubts', data),
    getIssues: () => api.get('/student/issues'),
    raiseIssue: (data) => api.post('/student/issues', data),
    submitPortfolioRequest: (data) => api.post('/student/portfolio', data),
    getPortfolioRequest: () => api.get('/student/portfolio'),

    // Worksheet / Submission Upload
    submitWorksheet: (formData) => api.post('/student/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),

    // Dynamic Feedback System
    getReleasedFeedback: () => api.get('/student/released-feedback'),
    submitFeedback: (data) => api.post('/student/submit-feedback', data),

    // Career Readiness & Certificates
    getInternshipEligibility: () => api.get('/student/internship-eligibility'),
    markReadyForInterview: () => api.post('/student/ready-for-interview'),
    generateCertificate: (data) => api.post('/student/certificates/generate', data),
    getCertificates: () => api.get('/student/certificates'),
    downloadCertificate: (id) => api.get(`/student/certificates/${id}/download`, { responseType: 'blob' }),

    // IOP Curriculum (IOP students only)
    getIOPCurriculum: () => api.get('/student/iop-curriculum'),
    downloadIOPModuleFile: (fileId) => api.get(`/student/iop-module-files/${fileId}/download`, { responseType: 'blob' }),
};

// Admin API (administrative portal)
export const adminAPI = {
    getOverview: () => api.get('/admin/overview'),
    getNotificationCounts: () => api.get('/admin/notification-counts'),
    getAuditLogs: (limit) => api.get(`/admin/audit-logs${limit ? `?limit=${limit}` : ''}`),
    getTrainerPerformance: () => api.get('/admin/trainer-performance'),

    // Reports (Bridged from SuperAdmin endpoints but assigned to Admin role)
    getDashboardStats: () => api.get('/super-admin/dashboard-stats'),
    getTrainerReport: () => api.get('/super-admin/reports/trainers'),
    getBatchReport: () => api.get('/super-admin/reports/batches'),
    getStudentReport: () => api.get('/super-admin/reports/students'),
    getCourseReport: () => api.get('/super-admin/reports/courses'),
    getBatchHub: () => api.get('/super-admin/reports/batch-hub'),
    getAttendanceAnalytics: (courseId, batchId) => api.get(`/super-admin/reports/attendance-analytics?course_id=${courseId || ''}&batch_id=${batchId || ''}`),

    // Attendance Drill-down V3 (Using correct backend routes)
    getAttendanceGroups: () => api.get('/super-admin/reports/attendance/groups'),
    getAttendanceSubBatches: (group) => api.get(`/super-admin/reports/attendance/sub-batches?group=${group}`),
    getDetailedBatchAttendance: (batchId, date) => api.get(`/super-admin/reports/attendance/detailed/${batchId}?date=${date || ''}`),
    getDailyKRA: (date) => api.get(`/super-admin/daily-kra?date=${date}`),
    getFeedbackReports: (params) => api.get('/super-admin/reports/feedback', { params }),

    // Trainer Leaves
    getTrainerLeaves: () => api.get('/super-admin/trainer-leaves'),

    // Batch & Student Details
    getBatchDetails: (id) => api.get(`/super-admin/reports/batch-details/${id}`),
    getStudentDetailedReport: (id) => api.get(`/super-admin/reports/student-detailed/${id}`),
    getTrainerDetailedReport: (id) => api.get(`/super-admin/reports/trainer-detailed/${id}`),

    // Downloads
    downloadTrainerKRA: (id, month, year) => api.get(`/super-admin/reports/trainer/${id}/download-kra?month=${month}&year=${year}`, { responseType: 'blob' }),
    downloadTrainerFullReport: (id) => api.get(`/super-admin/reports/trainer/${id}/download-full-report`, { responseType: 'blob' }),

    // JRP/IOP Program Management
    updateProgramType: (studentId, data) => api.put(`/super-admin/students/${studentId}/program-type`, data),
    resetCertificate: (studentId, data) => api.post(`/super-admin/students/${studentId}/certificates/reset`, data),
    getProgramOverview: () => api.get('/super-admin/students/program-overview'),
};

// Job Portal API
export const jobAPI = {
    // Jobs
    getJobs: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return api.get(`/jobs${query ? '?' + query : ''}`);
    },
    getAnalytics: () => api.get('/jobs/analytics'),
    getStudentJobs: () => api.get('/jobs/student'),
    createJob: (data) => api.post('/jobs', data),
    updateJob: (id, data) => api.put(`/jobs/${id}`, data),
    getJobApplicants: (id) => api.get(`/jobs/${id}/applicants`),
    applyJob: (jobId) => api.post('/jobs/apply', { jobId }),

    // Requests & Eligibility
    getEligibility: () => api.get('/job-requests/eligibility'),
    submitRequest: (formData) => api.post('/job-requests/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getAllRequests: () => api.get('/job-requests/all'),
    getReviewImage: (id) => api.get(`/job-requests/${id}/review-image`, { responseType: 'blob' }),
    updateRequestStatus: (id, data) => api.put(`/job-requests/${id}/status`, data),
    bulkUpdateRequests: (data) => api.put('/job-requests/bulk', data),
    downloadCertificate: () => api.get('/job-requests/certificate', { responseType: 'blob' }),
};

export const userAPI = {
    getProfile: () => api.get('/user/profile'),
    updateProfile: (data) => api.put('/user/profile', data)
};

// IOP Trainer API (dedicated IOP trainer portal)
export const iopTrainerAPI = {
    getDashboard: () => api.get('/iop-trainer/dashboard'),
    getMyGroups: () => api.get('/iop-trainer/groups'),
    getGroupCurriculum: (groupId) => api.get(`/iop-trainer/groups/${groupId}/curriculum`),
    unlockGroupModule: (groupId, data) => api.post(`/iop-trainer/groups/${groupId}/unlock`, data),
    getGroupStudents: (groupId) => api.get(`/iop-trainer/groups/${groupId}/students`),
    getGroupAttendance: (groupId, date) => api.get(`/iop-trainer/groups/${groupId}/attendance`, { params: { date } }),
    markGroupAttendance: (groupId, data) => api.post(`/iop-trainer/groups/${groupId}/attendance`, data),
};

// Recruiter API (Placement Officer)
export const recruiterAPI = {
    getDashboard: () => api.get('/recruiter/dashboard'),
    getIopStudents: (params) => api.get('/recruiter/iop-students', { params }),
    getStudentFullReport: (studentId) => api.get(`/recruiter/students/${studentId}/full-report`),
    getStudentInterviews: (studentId) => api.get(`/recruiter/students/${studentId}/interviews`),
    scheduleInterview: (data) => api.post('/recruiter/interviews', data),
    updateInterview: (id, data) => api.put(`/recruiter/interviews/${id}`, data),
};

export const chatAPI = {
    getContacts: (userId, role) => api.get(`/chat/contacts/${userId}?role=${role}`),
    getHistory: (userId, otherUserId) => api.get(`/chat/history/${userId}/${otherUserId}`)
};

export const forumAPI = {
    getTopics: (courseId) => api.get(`/forum/courses/${courseId}`),
    getTopicDetails: (topicId) => api.get(`/forum/topics/${topicId}`),
    createTopic: (data) => api.post('/forum/topics', data),
    upvoteTopic: (topicId) => api.post(`/forum/topics/${topicId}/upvote`),
    createReply: (data) => api.post('/forum/replies', data),
    upvoteReply: (replyId) => api.post(`/forum/replies/${replyId}/upvote`),
    acceptReply: (replyId) => api.post(`/forum/replies/${replyId}/accept`)
};

// Reports API — SA + Admin
export const reportsAPI = {
    getBatches:            ()       => api.get('/reports/batches'),
    getCertificateReport:  (params) => api.get('/reports/certificates',  { params }),
    getStudentWorkReport:  (params) => api.get('/reports/student-work',  { params }),
};

// Reports API — Trainer (own batches only)
export const trainerReportsAPI = {
    getBatches:            ()       => api.get('/reports/batches'),
    getCertificateReport:  (params) => api.get('/reports/trainer/certificates', { params }),
    getStudentWorkReport:  (params) => api.get('/reports/trainer/student-work', { params }),
};

export default api;
