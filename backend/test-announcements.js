const axios = require('axios');

async function test() {
    try {
        console.log("=== 1. Login as Super Admin ===");
        const loginAdmin = await axios.post('http://localhost:5000/api/auth/login', { email: 'admin@test.com', password: 'password123' });
        const adminToken = loginAdmin.data.token;
        console.log("Admin logged in successfully.");

        console.log("\n=== 2. Super Admin Broadcasts Targeted Announcement ===");
        const bcRes = await axios.post('http://localhost:5000/api/super-admin/announcements', {
            title: 'Test Script Broadcast',
            message: 'Testing if this popups correctly for Student 4',
            target: '4' // Students only
        }, { headers: { Authorization: `Bearer ${adminToken}` } });
        console.log('Result:', bcRes.data);

        console.log("\n=== 3. Login as Student ===");
        const loginStudent = await axios.post('http://localhost:5000/api/auth/login', { email: 'student@test.com', password: 'password123' });
        const studentToken = loginStudent.data.token;
        console.log("Student logged in successfully.");

        console.log("\n=== 4. Student check for unacknowledged announcements ===");
        let unreadRes = await axios.get('http://localhost:5000/api/auth/announcements/unacknowledged', { headers: { Authorization: `Bearer ${studentToken}` } });
        if (unreadRes.data.announcement) {
            console.log('UNREAD ANNOUNCEMENT FOUND:', unreadRes.data.announcement.title);

            console.log("\n=== 5. Student acknowledges announcement ===");
            const ackRes = await axios.post(`http://localhost:5000/api/auth/announcements/${unreadRes.data.announcement.id}/acknowledge`, {}, { headers: { Authorization: `Bearer ${studentToken}` } });
            console.log('Ack Result:', ackRes.data);
        } else {
            console.log('NO UNREAD ANNOUNCEMENTS FOUND (Expected 1).');
        }

        console.log("\n=== 6. Student checks unacknowledged again ===");
        unreadRes = await axios.get('http://localhost:5000/api/auth/announcements/unacknowledged', { headers: { Authorization: `Bearer ${studentToken}` } });
        if (unreadRes.data.announcement) {
            console.log('FAIL: UNREAD ANNOUNCEMENT STILL FOUND!');
        } else {
            console.log('SUCCESS: NO UNREAD ANNOUNCEMENTS FOUND (Popup cleared).');
        }

        console.log("\n=== 7. Super Admin checks receipt count ===");
        const checkRes = await axios.get('http://localhost:5000/api/super-admin/announcements', { headers: { Authorization: `Bearer ${adminToken}` } });
        const ann = checkRes.data.announcements.find(a => a.title === 'Test Script Broadcast');
        if (ann) {
            console.log(`Receipt Success! Acknowledged count is: ${ann.acknowledged_count} / ${ann.total_target_audience}`);
        } else {
            console.log('FAIL: Could not find the broadcast in history.');
        }

    } catch (e) {
        console.error('Error:', e.response?.data || e.message);
    }
}
test();
