const axios = require('axios');

async function testStats() {
    try {
        console.log("=== 1. Login as Super Admin ===");
        const loginAdmin = await axios.post('http://localhost:5000/api/auth/login', { email: 'admin@test.com', password: 'password123' });
        const adminToken = loginAdmin.data.token;
        console.log("Admin logged in successfully.");

        console.log("\n=== 2. Fetch Dashboard Stats ===");
        const res = await axios.get('http://localhost:5000/api/super-admin/dashboard-stats', { headers: { Authorization: `Bearer ${adminToken}` } });

        console.log('\n--- KPI RESULTS ---');
        console.log('Core:', res.data.core);
        console.log('Health:', res.data.health);
        console.log('Action Center:', res.data.actionCenter);
        console.log('Deliverables:', res.data.deliverables);
        console.log('Pipeline:', res.data.pipeline);
        console.log('Attendance:', res.data.attendance);

        if (res.data.core.totalStudents !== undefined && res.data.health.doubts.open !== undefined) {
            console.log("\n✅ ALL METRIC KEYS SUCCESSFULLY RESOLVED.");
        } else {
            console.log("\n❌ MISSING METRIC KEYS IN RESPONSE.");
        }

    } catch (e) {
        console.error('Error:', e.response?.data || e.message);
    }
}
testStats();
