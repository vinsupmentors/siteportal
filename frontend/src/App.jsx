import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppLayout } from './components/layouts/AppLayout';
import { LoginView } from './pages/LoginView';
import { PlaceholderDashboard } from './pages/PlaceholderDashboard';
import { Settings } from './pages/shared/Settings';
import { ChatWindow } from './pages/shared/ChatWindow';
import { ForumList } from './pages/shared/ForumList';
import { ForumTopicDetail } from './pages/shared/ForumTopicDetail';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentCalendar } from './pages/student/StudentCalendar';
import { StudentTests } from './pages/student/StudentTests';
import { StudentMaterials } from './pages/student/StudentMaterials';
import { StudentIOPContent } from './pages/student/StudentIOPContent';
import { StudentLeaves } from './pages/student/StudentLeaves';
import { StudentProgress } from './pages/student/StudentProgress';
import { StudentDoubts } from './pages/student/StudentDoubts';
import { StudentHelpdesk } from './pages/student/StudentHelpdesk';
import { StudentPortfolioForm } from './pages/student/StudentPortfolioForm';
import { StudentFeedback } from './pages/student/StudentFeedback';
import { StudentNotifications } from './pages/student/StudentNotifications';
import StudentJobPortal from './pages/student/StudentJobPortal';
import { StudentCertificates } from './pages/student/StudentCertificates';

// Super Admin Pages
import { SADashboard } from './pages/superadmin/SADashboard';
import { SACalendar } from './pages/superadmin/SACalendar';
import { SAManageCourses } from './pages/superadmin/SAManageCourses';
import { SAIOPCurriculum } from './pages/superadmin/SAIOPCurriculum';
import { SAStudentBatchCentral } from './pages/superadmin/SAStudentBatchCentral';
import { SACertificates } from './pages/superadmin/SACertificates';
import { SAManageTrainers } from './pages/superadmin/SAManageTrainers';
import { SATrainerTasks } from './pages/superadmin/SATrainerTasks';
import { SATrainerAttendance } from './pages/superadmin/SATrainerAttendance';
import { SATrainersKRA } from './pages/superadmin/SATrainersKRA';
import { SAPortfolios } from './pages/superadmin/SAPortfolios';
import { SAAnnouncements } from './pages/superadmin/SAAnnouncements';
import { SAMeetingLinks } from './pages/superadmin/SAMeetingLinks';
import { SAReports } from './pages/superadmin/SAReports';
import { SACertificateWorkReport } from './pages/superadmin/SACertificateWorkReport';
import { SAStudentDoubts } from './pages/superadmin/SAStudentDoubts';
import { SAStudentHelpdesk } from './pages/superadmin/SAStudentHelpdesk';
import { SAFeedbackBuilder } from './pages/superadmin/SAFeedbackBuilder';
import { SAFeedbackResponses } from './pages/superadmin/SAFeedbackResponses';
import { SATrainerLeaves } from './pages/superadmin/SATrainerLeaves';
import SAJobRequests from './pages/superadmin/SAJobRequests';

// Trainer Pages
import { TrainerDashboard } from './pages/trainer/TrainerDashboard';
import { TrainerCalendar } from './pages/trainer/TrainerCalendar';
import { TrainerStudentDoubts } from './pages/trainer/TrainerStudentDoubts';
import { TrainerAnnouncements } from './pages/trainer/TrainerAnnouncements';
import { TrainerBatches } from './pages/trainer/TrainerBatches';
import { TrainerAttendance } from './pages/trainer/TrainerAttendance';
import { TrainerTasks } from './pages/trainer/TrainerTasks';
import { TrainerContentManager } from './pages/trainer/TrainerContentManager';
import { TrainerSubmissions } from './pages/trainer/TrainerSubmissions';
import { TrainerStudentProfile } from './pages/trainer/TrainerStudentProfile';
import { TrainerLeaves } from './pages/trainer/TrainerLeaves';
import { TrainerReports } from './pages/trainer/TrainerReports';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminStudentHub } from './pages/admin/AdminStudentHub';
import { AdminBatchHub } from './pages/admin/AdminBatchHub';
import { AdminReports } from './pages/admin/AdminReports';
import { AdminTrainerLeaves } from './pages/admin/AdminTrainerLeaves';
import { AdminAuditLogs } from './pages/admin/AdminAuditLogs';

// Recruiter Pages
import RecruiterDashboard from './pages/recruiter/RecruiterDashboard';
import RecruiterJobs from './pages/recruiter/RecruiterJobs';
import RecruiterStudents from './pages/recruiter/RecruiterStudents';

// IOP Trainer Pages
import { IOPTrainerDashboard } from './pages/iop-trainer/IOPTrainerDashboard';
import { IOPTrainerGroups } from './pages/iop-trainer/IOPTrainerGroups';

// Super Admin — IOP Groups Manager
import SAIOPGroups from './pages/superadmin/SAIOPGroups';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/login" replace />;
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginView />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Super Admin - 11 Distinct Pages */}
      <Route path="/super-admin" element={
        <ProtectedRoute requiredRole="superadmin">
          <AppLayout role="superadmin" />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<SADashboard />} />
        <Route path="calendar" element={<SACalendar />} />
        <Route path="courses" element={<SAManageCourses />} />
        <Route path="iop-curriculum" element={<SAIOPCurriculum />} />
        <Route path="student-batch-hub" element={<SAStudentBatchCentral />} />
        <Route path="certificates" element={<SACertificates />} />
        <Route path="trainers" element={<SAManageTrainers />} />
        <Route path="trainer-tasks" element={<SATrainerTasks />} />
        <Route path="trainers-kra" element={<SATrainersKRA />} />
        <Route path="trainer-attendance" element={<SATrainerAttendance />} />
        <Route path="portfolios" element={<SAPortfolios />} />
        <Route path="announcements" element={<SAAnnouncements />} />
        <Route path="meeting-links" element={<SAMeetingLinks />} />
        <Route path="reports" element={<SAReports />} />
        <Route path="certificate-report" element={<SACertificateWorkReport />} />
        <Route path="student-doubts" element={<SAStudentDoubts />} />
        <Route path="student-issues" element={<SAStudentHelpdesk />} />
        <Route path="feedback-builder" element={<SAFeedbackBuilder />} />
        <Route path="feedback-responses" element={<SAFeedbackResponses />} />
        <Route path="trainer-leaves" element={<SATrainerLeaves />} />
        <Route path="job-requests" element={<SAJobRequests />} />
        <Route path="jobs" element={<RecruiterJobs />} />
        <Route path="iop-groups" element={<SAIOPGroups />} />
        <Route path="iop-dashboard" element={<RecruiterDashboard />} />
        <Route path="iop-students" element={<RecruiterStudents />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Admin - Operational Hub */}
      <Route path="/admin" element={
        <ProtectedRoute requiredRole="admin">
          <AppLayout role="admin" />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="student-hub" element={<AdminStudentHub />} />
        <Route path="batch-hub" element={<AdminBatchHub />} />
        <Route path="announcements" element={<SAAnnouncements />} />
        <Route path="meeting-links" element={<SAMeetingLinks />} />
        <Route path="student-issues" element={<SAStudentHelpdesk />} />
        <Route path="student-doubts" element={<SAStudentDoubts />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="certificate-report" element={<SACertificateWorkReport />} />
        <Route path="trainer-leaves" element={<AdminTrainerLeaves />} />
        <Route path="audit-logs" element={<AdminAuditLogs />} />
        <Route path="iop-dashboard" element={<RecruiterDashboard />} />
        <Route path="iop-students" element={<RecruiterStudents />} />
        <Route path="feedback-responses" element={<SAFeedbackResponses />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Student - 12 Distinct Pages */}
      <Route path="/student" element={
        <ProtectedRoute requiredRole="student">
          <AppLayout role="student" />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="calendar" element={<StudentCalendar />} />
        <Route path="tests" element={<StudentTests />} />
        <Route path="worksheets" element={<StudentIOPContent />} />
        <Route path="materials" element={<StudentMaterials />} />
        <Route path="leaves" element={<StudentLeaves />} />
        <Route path="doubts" element={<StudentDoubts />} />
        <Route path="feedback" element={<StudentFeedback />} />
        <Route path="issues" element={<StudentHelpdesk />} />
        <Route path="notifications" element={<StudentNotifications />} />
        <Route path="progress" element={<StudentProgress />} />
        <Route path="portfolio" element={<StudentPortfolioForm />} />
        <Route path="job-portal" element={<StudentJobPortal />} />
        <Route path="certificates" element={<StudentCertificates />} />
        <Route path="settings" element={<Settings />} />
        <Route path="chat" element={<ChatWindow />} />
        <Route path="courses/:courseId/forum" element={<ForumList />} />
        <Route path="forum/topic/:topicId" element={<ForumTopicDetail />} />
      </Route>

      {/* Trainer Portal */}
      <Route path="/trainer" element={
        <ProtectedRoute requiredRole="trainer">
          <AppLayout role="trainer" />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<TrainerDashboard />} />
        <Route path="calendar" element={<TrainerCalendar />} />
        <Route path="batches" element={<TrainerBatches />} />
        <Route path="attendance/:batchId" element={<TrainerAttendance />} />
        <Route path="tasks" element={<TrainerTasks />} />
        <Route path="doubts" element={<TrainerStudentDoubts />} />
        <Route path="announcements" element={<TrainerAnnouncements />} />
        <Route path="content-manager" element={<TrainerContentManager />} />
        <Route path="submissions" element={<TrainerSubmissions />} />
        <Route path="student-profile/:batchId/:studentId" element={<TrainerStudentProfile />} />
        <Route path="leaves" element={<TrainerLeaves />} />
        <Route path="reports" element={<TrainerReports />} />
        <Route path="settings" element={<Settings />} />
        <Route path="chat" element={<ChatWindow />} />
        <Route path="courses/:courseId/forum" element={<ForumList />} />
        <Route path="forum/topic/:topicId" element={<ForumTopicDetail />} />
      </Route>

      {/* IOP Trainer Portal */}
      <Route path="/iop-trainer" element={
        <ProtectedRoute requiredRole="ioptrainer">
          <AppLayout role="ioptrainer" />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<IOPTrainerDashboard />} />
        <Route path="groups" element={<IOPTrainerGroups />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Recruiter Portal */}
      <Route path="/recruiter" element={
        <ProtectedRoute requiredRole="recruiter">
          <AppLayout role="recruiter" />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<RecruiterDashboard />} />
        <Route path="jobs" element={<RecruiterJobs />} />
        <Route path="students" element={<RecruiterStudents />} />
        <Route path="iop-students" element={<RecruiterStudents />} />
        <Route path="settings" element={<Settings />} />
      </Route>

    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
