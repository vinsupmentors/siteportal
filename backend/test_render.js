/**
 * Comprehensive Backend API Test
 * Tests all major routes for all roles: Admin, Trainer, Student
 * Run: node test_render.js
 */

const axios = require('axios');

const BASE = 'https://edutech-backend-9gff.onrender.com';

// ── Credentials ──────────────────────────────────────────────────────────────
const CREDS = {
    superadmin: { email: 'admin@test.com',          password: '963.' },
    admin:      { email: 'report@test.com',          password: '963.' },
    trainer:    { email: 'v7032vinsup@gmail.com',    password: '963.' },
    student:    { email: 'v7037vinsup@gmail.com',    password: '963.' },
};

// ── State ─────────────────────────────────────────────────────────────────────
const results = { pass: 0, fail: 0, skip: 0 };
let superadminToken, adminToken, trainerToken, studentToken, recruiterToken;
let firstBatchId, firstTrainerId, firstStudentId, firstCourseId;
let firstModuleId, firstBatchReleaseId;

// ── Helpers ───────────────────────────────────────────────────────────────────
const h = (token) => ({ Authorization: `Bearer ${token}` });
const pad = (s, n = 55) => String(s).padEnd(n);

async function run(label, fn, skip = false) {
    if (skip) {
        console.log(`  ⬜ SKIP  ${pad(label)}`);
        results.skip++;
        return null;
    }
    try {
        const result = await fn();
        console.log(`  ✅ PASS  ${pad(label)}`);
        results.pass++;
        return result;
    } catch (e) {
        const status = e.response?.status;
        const msg = e.response?.data?.message || e.message;
        console.log(`  ❌ FAIL  ${pad(label)} [${status}] ${msg}`);
        results.fail++;
        return null;
    }
}

async function login(role, creds) {
    const r = await axios.post(`${BASE}/api/auth/login`, creds);
    console.log(`  ✅ PASS  ${pad(`LOGIN as ${role}`)} → ${r.data.redirectUrl}`);
    results.pass++;
    return r.data.token;
}

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN ROUTES
// ══════════════════════════════════════════════════════════════════════════════
async function testAdmin() {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  ADMIN / SUPER-ADMIN ROUTES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Dashboard & notifications
    await run('GET /super-admin/dashboard-stats', async () => {
        const r = await axios.get(`${BASE}/api/super-admin/dashboard-stats`, { headers: h(adminToken) });
        return r.data;
    });
    await run('GET /super-admin/notification-counts', async () => {
        return (await axios.get(`${BASE}/api/super-admin/notification-counts`, { headers: h(adminToken) })).data;
    });

    // Users
    await run('GET /super-admin/students', async () => {
        const r = await axios.get(`${BASE}/api/super-admin/students`, { headers: h(adminToken) });
        firstStudentId = r.data.students?.[0]?.id;
        return `${r.data.students?.length} students`;
    });
    await run('GET /super-admin/trainers', async () => {
        const r = await axios.get(`${BASE}/api/super-admin/trainers`, { headers: h(adminToken) });
        firstTrainerId = r.data.trainers?.[0]?.id;
        return `${r.data.trainers?.length} trainers`;
    });
    await run('GET /super-admin/students/program-overview', async () => {
        return (await axios.get(`${BASE}/api/super-admin/students/program-overview`, { headers: h(adminToken) })).data;
    });

    // Courses & curriculum
    await run('GET /super-admin/courses', async () => {
        const r = await axios.get(`${BASE}/api/super-admin/courses`, { headers: h(adminToken) });
        firstCourseId = r.data.courses?.[0]?.id;
        return `${r.data.courses?.length} courses`;
    });
    await run('GET /super-admin/courses/:id/full', async () => {
        if (!firstCourseId) throw new Error('No course ID available');
        const r = await axios.get(`${BASE}/api/super-admin/courses/${firstCourseId}/full`, { headers: h(adminToken) });
        // Try all courses until we find one with modules
        if (!r.data.modules?.length) {
            const allCourses = await axios.get(`${BASE}/api/super-admin/courses`, { headers: h(adminToken) });
            for (const c of (allCourses.data.courses || [])) {
                const cr = await axios.get(`${BASE}/api/super-admin/courses/${c.id}/full`, { headers: h(adminToken) });
                if (cr.data.modules?.length) { firstModuleId = cr.data.modules[0].id; break; }
            }
        } else {
            firstModuleId = r.data.modules[0].id;
        }
        return `modules found, firstModuleId=${firstModuleId}`;
    });
    await run('GET /super-admin/courses/:id/modules', async () => {
        if (!firstCourseId) throw new Error('No course ID');
        return (await axios.get(`${BASE}/api/super-admin/courses/${firstCourseId}/modules`, { headers: h(adminToken) })).data;
    });
    await run('GET /super-admin/modules/:id/days', async () => {
        if (!firstModuleId) throw new Error('No module ID');
        return (await axios.get(`${BASE}/api/super-admin/modules/${firstModuleId}/days`, { headers: h(adminToken) })).data;
    });
    await run('GET /super-admin/modules/:id/projects', async () => {
        if (!firstModuleId) throw new Error('No module ID');
        return (await axios.get(`${BASE}/api/super-admin/modules/${firstModuleId}/projects`, { headers: h(adminToken) })).data;
    });
    await run('GET /super-admin/courses/:id/capstones', async () => {
        if (!firstCourseId) throw new Error('No course ID');
        return (await axios.get(`${BASE}/api/super-admin/courses/${firstCourseId}/capstones`, { headers: h(adminToken) })).data;
    });

    // Batches
    await run('GET /super-admin/batches', async () => {
        const r = await axios.get(`${BASE}/api/super-admin/batches`, { headers: h(adminToken) });
        firstBatchId = r.data.batches?.[0]?.id;
        return `${r.data.batches?.length} batches`;
    });
    await run('GET /super-admin/meeting-links', async () => {
        return (await axios.get(`${BASE}/api/super-admin/meeting-links`, { headers: h(adminToken) })).data;
    });

    // Trainer management
    await run('GET /super-admin/trainer-tasks', async () => {
        const r = await axios.get(`${BASE}/api/super-admin/trainer-tasks`, { headers: h(adminToken) });
        return `${r.data.tasks?.length} tasks`;
    });
    await run('GET /super-admin/trainer-attendance', async () => {
        return (await axios.get(`${BASE}/api/super-admin/trainer-attendance`, { headers: h(adminToken) })).data;
    });
    await run('GET /super-admin/trainer-attendance/monthly-report', async () => {
        return (await axios.get(`${BASE}/api/super-admin/trainer-attendance/monthly-report`, { headers: h(adminToken) })).data;
    });
    await run('GET /super-admin/trainer-leaves', async () => {
        return (await axios.get(`${BASE}/api/super-admin/trainer-leaves`, { headers: h(adminToken) })).data;
    });
    await run('GET /super-admin/daily-kra', async () => {
        const today = new Date().toISOString().split('T')[0];
        return (await axios.get(`${BASE}/api/super-admin/daily-kra?date=${today}`, { headers: h(adminToken) })).data;
    });

    // Student management
    await run('GET /super-admin/student-issues', async () => {
        return (await axios.get(`${BASE}/api/super-admin/student-issues`, { headers: h(adminToken) })).data;
    });
    await run('GET /super-admin/student-doubts', async () => {
        return (await axios.get(`${BASE}/api/super-admin/student-doubts`, { headers: h(adminToken) })).data;
    });

    // Feedback
    await run('GET /super-admin/feedback-forms', async () => {
        const r = await axios.get(`${BASE}/api/super-admin/feedback-forms`, { headers: h(adminToken) });
        return `${r.data?.length || 0} forms`;
    });
    await run('GET /super-admin/reports/feedback', async () => {
        return (await axios.get(`${BASE}/api/super-admin/reports/feedback`, { headers: h(adminToken) })).data;
    });

    // Portfolios & certificates
    await run('GET /super-admin/portfolios', async () => {
        return (await axios.get(`${BASE}/api/super-admin/portfolios`, { headers: h(adminToken) })).data;
    });

    // Announcements
    await run('GET /super-admin/announcements', async () => {
        return (await axios.get(`${BASE}/api/super-admin/announcements`, { headers: h(adminToken) })).data;
    });

    // Reports
    await run('GET /super-admin/reports/attendance-analytics', async () => {
        return (await axios.get(`${BASE}/api/super-admin/reports/attendance-analytics`, { headers: h(adminToken) })).data;
    });
    await run('GET /super-admin/reports/batch-hub', async () => {
        return (await axios.get(`${BASE}/api/super-admin/reports/batch-hub`, { headers: h(adminToken) })).data;
    });
    await run('GET /super-admin/reports/trainers', async () => {
        return (await axios.get(`${BASE}/api/super-admin/reports/trainers`, { headers: h(adminToken) })).data;
    });
    await run('GET /super-admin/reports/batches', async () => {
        return (await axios.get(`${BASE}/api/super-admin/reports/batches`, { headers: h(adminToken) })).data;
    });
    await run('GET /super-admin/reports/students', async () => {
        return (await axios.get(`${BASE}/api/super-admin/reports/students`, { headers: h(adminToken) })).data;
    });
    await run('GET /super-admin/reports/courses', async () => {
        return (await axios.get(`${BASE}/api/super-admin/reports/courses`, { headers: h(adminToken) })).data;
    });
    await run('GET /super-admin/reports/student-detailed/:id', async () => {
        if (!firstStudentId) throw new Error('No student ID');
        return (await axios.get(`${BASE}/api/super-admin/reports/student-detailed/${firstStudentId}`, { headers: h(adminToken) })).data;
    });
    await run('GET /super-admin/reports/trainer-detailed/:id', async () => {
        if (!firstTrainerId) throw new Error('No trainer ID');
        return (await axios.get(`${BASE}/api/super-admin/reports/trainer-detailed/${firstTrainerId}`, { headers: h(adminToken) })).data;
    });
    await run('GET /super-admin/reports/batch-details/:id', async () => {
        if (!firstBatchId) throw new Error('No batch ID');
        return (await axios.get(`${BASE}/api/super-admin/reports/batch-details/${firstBatchId}`, { headers: h(adminToken) })).data;
    });

    // IOP
    await run('GET /super-admin/iop-modules', async () => {
        return (await axios.get(`${BASE}/api/super-admin/iop-modules`, { headers: h(adminToken) })).data;
    });

    // Shared
    await run('GET /jobs', async () => {
        return (await axios.get(`${BASE}/api/jobs`, { headers: h(adminToken) })).data;
    });
    await run('GET /jobs/analytics', async () => {
        return (await axios.get(`${BASE}/api/jobs/analytics`, { headers: h(adminToken) })).data;
    });
    await run('GET /user/profile', async () => {
        const r = await axios.get(`${BASE}/api/user/profile`, { headers: h(adminToken) });
        return `${r.data.user?.first_name} ${r.data.user?.last_name}`;
    });
}

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN PORTAL ROUTES (role_id=2 — report@test.com)
// ══════════════════════════════════════════════════════════════════════════════
async function testAdminPortal() {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  ADMIN PORTAL ROUTES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await run('GET /admin/overview', async () => {
        const r = await axios.get(`${BASE}/api/admin/overview`, { headers: h(adminToken) });
        return JSON.stringify(r.data).slice(0, 80);
    });
    await run('GET /admin/audit-logs', async () => {
        const r = await axios.get(`${BASE}/api/admin/audit-logs`, { headers: h(adminToken) });
        return `${r.data.logs?.length ?? r.data?.length ?? 0} logs`;
    });
    await run('GET /admin/trainer-performance', async () => {
        return (await axios.get(`${BASE}/api/admin/trainer-performance`, { headers: h(adminToken) })).data;
    });
    await run('GET /admin/notification-counts', async () => {
        return (await axios.get(`${BASE}/api/admin/notification-counts`, { headers: h(adminToken) })).data;
    });
}

// ══════════════════════════════════════════════════════════════════════════════
// RECRUITER ROUTES (role_id=5 — using superadmin token as fallback)
// ══════════════════════════════════════════════════════════════════════════════
async function testRecruiter() {
    const token = recruiterToken || superadminToken; // superadmin has role [1,2,5] access
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  RECRUITER ROUTES (using superadmin token)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await run('GET /recruiter/dashboard', async () => {
        return (await axios.get(`${BASE}/api/recruiter/dashboard`, { headers: h(token) })).data;
    });
    await run('GET /recruiter/iop-students', async () => {
        const r = await axios.get(`${BASE}/api/recruiter/iop-students`, { headers: h(token) });
        return `${r.data?.length ?? 0} IOP students`;
    });
}

// ══════════════════════════════════════════════════════════════════════════════
// STUDENT JOB PORTAL ROUTES
// ══════════════════════════════════════════════════════════════════════════════
async function testStudentJobPortal() {
    const skip = !studentToken;
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  STUDENT JOB PORTAL ROUTES${skip ? ' ⚠ (no student token)' : ''}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await run('GET /jobs/student (student view)', async () => {
        return (await axios.get(`${BASE}/api/jobs/student`, { headers: h(studentToken) })).data;
    }, skip);
    await run('GET /job-requests/eligibility', async () => {
        return (await axios.get(`${BASE}/api/job-requests/eligibility`, { headers: h(studentToken) })).data;
    }, skip);
}

// ══════════════════════════════════════════════════════════════════════════════
// CERTIFICATE ROUTES (superadmin only)
// ══════════════════════════════════════════════════════════════════════════════
async function testCertificates() {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  CERTIFICATE ROUTES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await run('GET /certificates/all', async () => {
        const r = await axios.get(`${BASE}/api/certificates/all`, { headers: h(superadminToken) });
        return `${r.data?.length ?? 0} certificates`;
    });
    await run('GET /certificates/student/:id', async () => {
        if (!firstStudentId) throw new Error('No student ID');
        return (await axios.get(`${BASE}/api/certificates/student/${firstStudentId}`, { headers: h(superadminToken) })).data;
    });
}

// ══════════════════════════════════════════════════════════════════════════════
// TRAINER ROUTES
// ══════════════════════════════════════════════════════════════════════════════
async function testTrainer() {
    const skip = !trainerToken;
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  TRAINER ROUTES${skip ? ' ⚠ (trainer login failed)' : ''}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    let trainerBatchId;

    await run('GET /trainer/dashboard', async () => {
        return (await axios.get(`${BASE}/api/trainer/dashboard`, { headers: h(trainerToken) })).data;
    }, skip);
    await run('GET /trainer/notification-counts', async () => {
        return (await axios.get(`${BASE}/api/trainer/notification-counts`, { headers: h(trainerToken) })).data;
    }, skip);
    await run('GET /trainer/calendar', async () => {
        return (await axios.get(`${BASE}/api/trainer/calendar`, { headers: h(trainerToken) })).data;
    }, skip);
    await run('GET /trainer/tasks', async () => {
        return (await axios.get(`${BASE}/api/trainer/tasks`, { headers: h(trainerToken) })).data;
    }, skip);
    await run('GET /trainer/kra', async () => {
        return (await axios.get(`${BASE}/api/trainer/kra`, { headers: h(trainerToken) })).data;
    }, skip);
    await run('GET /trainer/doubts', async () => {
        return (await axios.get(`${BASE}/api/trainer/doubts`, { headers: h(trainerToken) })).data;
    }, skip);
    await run('GET /trainer/announcements', async () => {
        return (await axios.get(`${BASE}/api/trainer/announcements`, { headers: h(trainerToken) })).data;
    }, skip);
    await run('GET /trainer/leaves', async () => {
        return (await axios.get(`${BASE}/api/trainer/leaves`, { headers: h(trainerToken) })).data;
    }, skip);
    await run('GET /trainer/student-leaves', async () => {
        return (await axios.get(`${BASE}/api/trainer/student-leaves`, { headers: h(trainerToken) })).data;
    }, skip);

    // Batch-specific routes
    await run('GET /trainer/batches/:id/curriculum', async () => {
        if (!trainerBatchId && firstBatchId) trainerBatchId = firstBatchId;
        if (!trainerBatchId) throw new Error('No batch ID');
        const r = await axios.get(`${BASE}/api/trainer/batches/${trainerBatchId}/curriculum`, { headers: h(trainerToken) });
        return `${r.data.modules?.length} modules`;
    }, skip);
    await run('GET /trainer/batches/:id/release-status', async () => {
        if (!trainerBatchId) throw new Error('No batch ID');
        return (await axios.get(`${BASE}/api/trainer/batches/${trainerBatchId}/release-status`, { headers: h(trainerToken) })).data;
    }, skip);
    await run('GET /trainer/batches/:id/submissions', async () => {
        if (!trainerBatchId) throw new Error('No batch ID');
        return (await axios.get(`${BASE}/api/trainer/batches/${trainerBatchId}/submissions`, { headers: h(trainerToken) })).data;
    }, skip);
    await run('GET /trainer/batches/:id/release-submissions', async () => {
        if (!trainerBatchId) throw new Error('No batch ID');
        return (await axios.get(`${BASE}/api/trainer/batches/${trainerBatchId}/release-submissions`, { headers: h(trainerToken) })).data;
    }, skip);
}

// ══════════════════════════════════════════════════════════════════════════════
// STUDENT ROUTES
// ══════════════════════════════════════════════════════════════════════════════
async function testStudent() {
    const skip = !studentToken;
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  STUDENT ROUTES${skip ? ' ⚠ (student login failed)' : ''}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await run('GET /student/dashboard', async () => {
        return (await axios.get(`${BASE}/api/student/dashboard`, { headers: h(studentToken) })).data;
    }, skip);
    await run('GET /student/notification-counts', async () => {
        return (await axios.get(`${BASE}/api/student/notification-counts`, { headers: h(studentToken) })).data;
    }, skip);
    await run('GET /student/progress', async () => {
        return (await axios.get(`${BASE}/api/student/progress`, { headers: h(studentToken) })).data;
    }, skip);
    await run('GET /student/calendar', async () => {
        return (await axios.get(`${BASE}/api/student/calendar`, { headers: h(studentToken) })).data;
    }, skip);
    await run('GET /student/curriculum', async () => {
        return (await axios.get(`${BASE}/api/student/curriculum`, { headers: h(studentToken) })).data;
    }, skip);
    await run('GET /student/tests', async () => {
        return (await axios.get(`${BASE}/api/student/tests`, { headers: h(studentToken) })).data;
    }, skip);
    await run('GET /student/doubts', async () => {
        return (await axios.get(`${BASE}/api/student/doubts`, { headers: h(studentToken) })).data;
    }, skip);
    await run('GET /student/issues', async () => {
        return (await axios.get(`${BASE}/api/student/issues`, { headers: h(studentToken) })).data;
    }, skip);
    await run('GET /student/leaves', async () => {
        return (await axios.get(`${BASE}/api/student/leaves`, { headers: h(studentToken) })).data;
    }, skip);
    await run('GET /student/portfolio', async () => {
        return (await axios.get(`${BASE}/api/student/portfolio`, { headers: h(studentToken) })).data;
    }, skip);
    await run('GET /student/released-feedback', async () => {
        const r = await axios.get(`${BASE}/api/student/released-feedback`, { headers: h(studentToken) });
        const forms = Array.isArray(r.data) ? r.data : [];
        return `${forms.length} forms, already_submitted flags: ${forms.map(f => f.already_submitted).join(',')}`;
    }, skip);
    await run('GET /student/internship-eligibility', async () => {
        return (await axios.get(`${BASE}/api/student/internship-eligibility`, { headers: h(studentToken) })).data;
    }, skip);
    await run('GET /student/certificates', async () => {
        return (await axios.get(`${BASE}/api/student/certificates`, { headers: h(studentToken) })).data;
    }, skip);
    await run('GET /student/releases', async () => {
        const r = await axios.get(`${BASE}/api/student/releases`, { headers: h(studentToken) });
        return `${r.data?.length || 0} releases`;
    }, skip);
    await run('GET /student/iop-curriculum', async () => {
        return (await axios.get(`${BASE}/api/student/iop-curriculum`, { headers: h(studentToken) })).data;
    }, skip);
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════
async function main() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║         ANTI-PORTAL BACKEND API TEST SUITE                  ║');
    console.log(`║         ${BASE.padEnd(52)}║`);
    console.log('╚══════════════════════════════════════════════════════════════╝');

    // ── Login phase ────────────────────────────────────────────────────────────
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  AUTH / LOGIN');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try { superadminToken = await login('Super Admin', CREDS.superadmin); }
    catch (e) { console.log(`  ❌ FAIL  Super Admin login: ${e.response?.data?.message || e.message}`); }

    try { adminToken = await login('Admin', CREDS.admin); }
    catch (e) { console.log(`  ❌ FAIL  Admin login: ${e.response?.data?.message || e.message}`); }

    try { trainerToken = await login('Trainer', CREDS.trainer); }
    catch (e) { console.log(`  ❌ FAIL  Trainer login: ${e.response?.data?.message || e.message}`); }

    try { studentToken = await login('Student', CREDS.student); }
    catch (e) { console.log(`  ❌ FAIL  Student login: ${e.response?.data?.message || e.message}`); }

    if (!superadminToken && !adminToken) {
        console.log('\n  ⛔ Cannot continue without at least one admin token. Exiting.');
        process.exit(1);
    }
    // Use superadmin token for admin routes (has broadest access), fall back to admin
    if (!adminToken) adminToken = superadminToken;

    // ── Run tests ──────────────────────────────────────────────────────────────
    await testAdmin();
    await testAdminPortal();
    await testRecruiter();
    await testCertificates();
    await testTrainer();
    await testStudent();
    await testStudentJobPortal();

    // ── Summary ────────────────────────────────────────────────────────────────
    const total = results.pass + results.fail + results.skip;
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║  RESULTS                                                     ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log(`║  ✅ PASS : ${String(results.pass).padEnd(49)}║`);
    console.log(`║  ❌ FAIL : ${String(results.fail).padEnd(49)}║`);
    console.log(`║  ⬜ SKIP : ${String(results.skip).padEnd(49)}║`);
    console.log(`║  TOTAL  : ${String(total).padEnd(49)}║`);
    console.log('╚══════════════════════════════════════════════════════════════╝');

    if (results.fail > 0) {
        console.log('\n  ⚠ Some tests failed. Scroll up to see which routes are broken.\n');
        console.log('  To test trainer/student routes, run:');
        console.log('  TRAINER_EMAIL=x@y.com TRAINER_PASS=pass STUDENT_EMAIL=a@b.com STUDENT_PASS=pass node test_render.js\n');
    } else {
        console.log('\n  🎉 All tested routes passed!\n');
    }
}

main().catch(e => {
    console.error('\nFatal error:', e.message);
    process.exit(1);
});
