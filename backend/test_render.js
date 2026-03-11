const axios = require('axios');

const BASE = 'https://edutech-backend-9gff.onrender.com';

async function test(label, fn) {
    try {
        await fn();
    } catch (e) {
        console.log(`FAIL [${label}]:`, e.response?.status, JSON.stringify(e.response?.data));
    }
}

async function testRender() {
    console.log('=== Logging in (super admin) ===');
    const loginRes = await axios.post(`${BASE}/api/auth/login`, {
        email: 'admin@test.com',
        password: 'password123'
    });
    const token = loginRes.data.token;
    const h = { Authorization: `Bearer ${token}` };
    console.log('Login OK, redirectUrl:', loginRes.data.redirectUrl);

    // Super Admin routes
    await test('GET /super-admin/dashboard-stats', async () => {
        await axios.get(`${BASE}/api/super-admin/dashboard-stats`, { headers: h });
        console.log('OK GET /super-admin/dashboard-stats');
    });
    await test('GET /super-admin/trainers', async () => {
        const r = await axios.get(`${BASE}/api/super-admin/trainers`, { headers: h });
        console.log(`OK GET /trainers: ${r.data.trainers?.length} trainers`);
    });
    await test('GET /super-admin/students', async () => {
        const r = await axios.get(`${BASE}/api/super-admin/students`, { headers: h });
        console.log(`OK GET /students: ${r.data.students?.length} students`);
    });
    await test('GET /super-admin/batches', async () => {
        const r = await axios.get(`${BASE}/api/super-admin/batches`, { headers: h });
        console.log(`OK GET /batches: ${r.data.batches?.length} batches`);
    });
    await test('GET /super-admin/courses', async () => {
        const r = await axios.get(`${BASE}/api/super-admin/courses`, { headers: h });
        console.log(`OK GET /courses: ${r.data.courses?.length} courses`);
    });
    await test('GET /super-admin/trainer-tasks', async () => {
        const r = await axios.get(`${BASE}/api/super-admin/trainer-tasks`, { headers: h });
        console.log(`OK GET /trainer-tasks: ${r.data.tasks?.length} tasks`);
    });
    await test('GET /super-admin/leaves', async () => {
        const r = await axios.get(`${BASE}/api/super-admin/leaves`, { headers: h });
        console.log(`OK GET /leaves`);
    });
    await test('GET /super-admin/doubts', async () => {
        const r = await axios.get(`${BASE}/api/super-admin/doubts`, { headers: h });
        console.log(`OK GET /doubts`);
    });
    await test('GET /super-admin/issues', async () => {
        const r = await axios.get(`${BASE}/api/super-admin/issues`, { headers: h });
        console.log(`OK GET /issues`);
    });
    await test('GET /super-admin/announcements', async () => {
        const r = await axios.get(`${BASE}/api/super-admin/announcements`, { headers: h });
        console.log(`OK GET /announcements`);
    });
    await test('GET /super-admin/feedback-forms', async () => {
        const r = await axios.get(`${BASE}/api/super-admin/feedback-forms`, { headers: h });
        console.log(`OK GET /feedback-forms`);
    });
    await test('GET /super-admin/attendance', async () => {
        const r = await axios.get(`${BASE}/api/super-admin/attendance`, { headers: h });
        console.log(`OK GET /attendance`);
    });
    await test('GET /super-admin/portfolios', async () => {
        const r = await axios.get(`${BASE}/api/super-admin/portfolios`, { headers: h });
        console.log(`OK GET /portfolios`);
    });
    await test('GET /super-admin/certificates', async () => {
        const r = await axios.get(`${BASE}/api/super-admin/certificates`, { headers: h });
        console.log(`OK GET /certificates`);
    });
    await test('GET /super-admin/reports', async () => {
        const r = await axios.get(`${BASE}/api/super-admin/reports`, { headers: h });
        console.log(`OK GET /reports`);
    });
    await test('GET /super-admin/trainer-leaves', async () => {
        const r = await axios.get(`${BASE}/api/super-admin/trainer-leaves`, { headers: h });
        console.log(`OK GET /trainer-leaves`);
    });
    await test('GET /super-admin/job-portal-requests', async () => {
        const r = await axios.get(`${BASE}/api/super-admin/job-portal-requests`, { headers: h });
        console.log(`OK GET /job-portal-requests`);
    });
    await test('GET /jobs', async () => {
        const r = await axios.get(`${BASE}/api/jobs`, { headers: h });
        console.log(`OK GET /jobs`);
    });
    await test('GET /user/profile', async () => {
        const r = await axios.get(`${BASE}/api/user/profile`, { headers: h });
        console.log(`OK GET /user/profile: ${r.data.user?.first_name} ${r.data.user?.last_name}`);
    });
}

testRender().catch(e => console.log('Fatal:', e.message));
