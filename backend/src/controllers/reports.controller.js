const pool = require('../config/db');

const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);

// ══════════════════════════════════════════════════════════════════════════════
// BATCH LIST (for filter dropdown)
// ══════════════════════════════════════════════════════════════════════════════
exports.getBatchesForReport = async (req, res) => {
    try {
        const { role_id, id: userId } = req.user;
        const isTrainer = role_id === 3;
        let params = [];
        let extraWhere = '';
        if (isTrainer) { extraWhere = 'WHERE b.trainer_id = ?'; params = [userId]; }

        const [batches] = await pool.query(`
            SELECT b.id, b.batch_name, b.status, c.id AS course_id, c.name AS course_name
            FROM Batches b
            JOIN Courses c ON b.course_id = c.id
            ${extraWhere}
            ORDER BY c.name ASC, b.batch_name ASC
        `, params);

        // distinct courses for the course filter dropdown
        const courseMap = {};
        batches.forEach(b => { courseMap[b.course_id] = b.course_name; });
        const courses = Object.entries(courseMap).map(([id, name]) => ({ id: parseInt(id), name }));

        res.json({ batches, courses });
    } catch (error) {
        console.error('[getBatchesForReport]', error.message);
        res.status(500).json({ message: 'Error fetching batches', error: error.message });
    }
};

// ══════════════════════════════════════════════════════════════════════════════
// CERTIFICATE + ELIGIBILITY REPORT
// ══════════════════════════════════════════════════════════════════════════════
exports.getCertificateReport = async (req, res) => {
    try {
        const { role_id, id: userId } = req.user;
        const { batch_id, course_id, batch_status } = req.query;
        const isTrainer = role_id === 3;

        // 1. Get all students in relevant batches
        const conditions = [];
        const params = [];
        if (isTrainer)    { conditions.push('b.trainer_id = ?'); params.push(userId); }
        if (batch_id)     { conditions.push('b.id = ?');          params.push(batch_id); }
        if (course_id)    { conditions.push('c.id = ?');          params.push(course_id); }
        if (batch_status) { conditions.push('b.status = ?');      params.push(batch_status); }

        const [students] = await pool.query(`
            SELECT
                b.id AS batch_id, b.batch_name, b.status AS batch_status,
                c.id AS course_id, c.name AS course_name,
                u.id AS student_id,
                CONCAT(u.first_name, ' ', u.last_name) AS student_name,
                u.email, bs.roll_number AS roll_number, u.student_status
            FROM Batches b
            JOIN Courses c ON b.course_id = c.id
            JOIN BatchStudents bs ON b.id = bs.batch_id
            JOIN Users u ON bs.student_id = u.id
            WHERE u.status = 'active'
            ${conditions.length ? 'AND ' + conditions.join(' AND ') : ''}
            ORDER BY b.status DESC, b.id, u.first_name, u.last_name
        `, params);

        if (!students.length) {
            return res.json({ batches: [], stats: { total_students: 0, completion_eligible: 0, completion_obtained: 0, internship_eligible: 0, internship_obtained: 0 } });
        }

        const batchIds   = [...new Set(students.map(r => r.batch_id))];
        const studentIds = [...new Set(students.map(r => r.student_id))];
        const bph = batchIds.map(() => '?').join(',');
        const sph = studentIds.map(() => '?').join(',');

        // 2. Attendance per student per batch
        const [attRows] = await pool.query(`
            SELECT student_id, batch_id,
                   COUNT(*) AS total,
                   SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS present
            FROM StudentAttendance
            WHERE student_id IN (${sph}) AND batch_id IN (${bph})
            GROUP BY student_id, batch_id
        `, [...studentIds, ...batchIds]);
        const attMap = {};
        attRows.forEach(r => { attMap[`${r.batch_id}_${r.student_id}`] = r; });

        // 3. Project avg marks (graded module_projects)
        const [projRows] = await pool.query(`
            SELECT srs.student_id, srs.batch_id,
                   ROUND(AVG(srs.marks), 1) AS avg_marks,
                   COUNT(*) AS submitted
            FROM StudentReleaseSubmissions srs
            JOIN BatchReleases br ON srs.release_id = br.id
            WHERE srs.student_id IN (${sph}) AND srs.batch_id IN (${bph})
              AND br.release_type = 'module_project' AND srs.status = 'graded'
            GROUP BY srs.student_id, srs.batch_id
        `, [...studentIds, ...batchIds]);
        const projMap = {};
        projRows.forEach(r => { projMap[`${r.batch_id}_${r.student_id}`] = r; });

        // 4. Capstone graded count
        const [capRows] = await pool.query(`
            SELECT srs.student_id, srs.batch_id, COUNT(*) AS cnt
            FROM StudentReleaseSubmissions srs
            JOIN BatchReleases br ON srs.release_id = br.id
            WHERE srs.student_id IN (${sph}) AND srs.batch_id IN (${bph})
              AND br.release_type = 'capstone_project' AND srs.status = 'graded'
            GROUP BY srs.student_id, srs.batch_id
        `, [...studentIds, ...batchIds]);
        const capMap = {};
        capRows.forEach(r => { capMap[`${r.batch_id}_${r.student_id}`] = r; });

        // 5. Module projects submitted (total, not just graded)
        const [projSubRows] = await pool.query(`
            SELECT srs.student_id, srs.batch_id, COUNT(*) AS submitted
            FROM StudentReleaseSubmissions srs
            JOIN BatchReleases br ON srs.release_id = br.id
            WHERE srs.student_id IN (${sph}) AND srs.batch_id IN (${bph})
              AND br.release_type = 'module_project'
            GROUP BY srs.student_id, srs.batch_id
        `, [...studentIds, ...batchIds]);
        const projSubMap = {};
        projSubRows.forEach(r => { projSubMap[`${r.batch_id}_${r.student_id}`] = r; });

        // 6. Tests released per batch + submitted per student
        const [testsRelRows] = await pool.query(`
            SELECT batch_id, COUNT(*) AS total
            FROM BatchReleases
            WHERE batch_id IN (${bph}) AND release_type = 'module_test'
            GROUP BY batch_id
        `, batchIds);
        const testsRelMap = {};
        testsRelRows.forEach(r => { testsRelMap[r.batch_id] = r.total; });

        const [testsSubRows] = await pool.query(`
            SELECT srs.student_id, srs.batch_id, COUNT(*) AS submitted
            FROM StudentReleaseSubmissions srs
            JOIN BatchReleases br ON srs.release_id = br.id
            WHERE srs.student_id IN (${sph}) AND srs.batch_id IN (${bph})
              AND br.release_type = 'module_test'
            GROUP BY srs.student_id, srs.batch_id
        `, [...studentIds, ...batchIds]);
        const testsSubMap = {};
        testsSubRows.forEach(r => { testsSubMap[`${r.batch_id}_${r.student_id}`] = r; });

        // 7. Feedback released per batch + submitted per student
        const [fbRelRows] = await pool.query(`
            SELECT batch_id, COUNT(*) AS total
            FROM BatchReleases
            WHERE batch_id IN (${bph}) AND release_type = 'module_feedback'
            GROUP BY batch_id
        `, batchIds);
        const fbRelMap = {};
        fbRelRows.forEach(r => { fbRelMap[r.batch_id] = r.total; });

        const [fbSubRows] = await pool.query(`
            SELECT student_id, batch_id, COUNT(*) AS submitted
            FROM StudentFeedbackResponses
            WHERE student_id IN (${sph}) AND batch_id IN (${bph})
            GROUP BY student_id, batch_id
        `, [...studentIds, ...batchIds]);
        const fbSubMap = {};
        fbSubRows.forEach(r => { fbSubMap[`${r.batch_id}_${r.student_id}`] = r; });

        // 8. Projects released per batch
        const [projRelRows] = await pool.query(`
            SELECT batch_id, COUNT(*) AS total
            FROM BatchReleases
            WHERE batch_id IN (${bph}) AND release_type = 'module_project'
            GROUP BY batch_id
        `, batchIds);
        const projRelMap = {};
        projRelRows.forEach(r => { projRelMap[r.batch_id] = r.total; });

        // 9. Portfolio status per student (optional table — wrap in try/catch)
        const portfolioMap = {};
        try {
            const [portRows] = await pool.query(`
                SELECT student_id, status
                FROM PortfolioRequests
                WHERE student_id IN (${sph})
                ORDER BY id DESC
            `, studentIds);
            // keep only latest per student
            portRows.forEach(r => {
                if (!portfolioMap[r.student_id]) portfolioMap[r.student_id] = r.status;
            });
        } catch (portErr) {
            console.warn('[getCertificateReport] PortfolioRequests query failed (non-fatal):', portErr.message);
        }

        // 10. Certificates obtained
        const [certRows] = await pool.query(`
            SELECT student_id, cert_type,
                   DATE_FORMAT(generated_at, '%Y-%m-%d') AS cert_date
            FROM Certificates
            WHERE student_id IN (${sph}) AND reset_by_admin = 0
              AND cert_type IN ('completion','internship')
        `, studentIds);
        const certMap = {};
        certRows.forEach(r => {
            const key = `${r.cert_type}_${r.student_id}`;
            if (!certMap[key]) certMap[key] = r.cert_date;
        });

        // Build output
        const batchMap = {};
        for (const s of students) {
            if (!batchMap[s.batch_id]) {
                batchMap[s.batch_id] = {
                    batch_id: s.batch_id, batch_name: s.batch_name, batch_status: s.batch_status,
                    course_id: s.course_id, course_name: s.course_name, students: [],
                };
            }
            const key = `${s.batch_id}_${s.student_id}`;

            const att       = attMap[key]     || { total: 0, present: 0 };
            const attPct    = pct(att.present, att.total);
            const proj      = projMap[key]    || {};
            const projAvg   = proj.avg_marks != null ? parseFloat(proj.avg_marks) : null;
            const projSub   = (projSubMap[key] || {}).submitted || 0;
            const projRel   = projRelMap[s.batch_id] || 0;
            const capGraded = (capMap[key]    || {}).cnt        || 0;
            const testsRel  = testsRelMap[s.batch_id] || 0;
            const testsSub  = (testsSubMap[key] || {}).submitted || 0;
            const fbRel     = fbRelMap[s.batch_id]   || 0;
            const fbSub     = (fbSubMap[key]   || {}).submitted || 0;
            const testPct   = pct(testsSub, testsRel);
            const fbPct     = pct(fbSub, fbRel);
            const portStatus = portfolioMap[s.student_id] || null;
            const portApproved = portStatus === 'approved';

            const completionEligible = attPct >= 75;
            const internshipEligible =
                attPct >= 80 &&
                (projAvg == null || projAvg >= 75) &&
                capGraded >= 1 &&
                (testsRel === 0 || testPct === 100) &&
                (fbRel === 0    || fbPct  === 100) &&
                portApproved;

            batchMap[s.batch_id].students.push({
                student_id: s.student_id, student_name: s.student_name,
                email: s.email, roll_number: s.roll_number, student_status: s.student_status,
                att_total: att.total, att_present: att.present, att_pct: attPct,
                proj_avg: projAvg, proj_released: projRel, proj_submitted: projSub,
                capstone_graded: capGraded,
                tests_released: testsRel, tests_submitted: testsSub, test_pct: testPct,
                fb_released: fbRel, fb_submitted: fbSub, fb_pct: fbPct,
                portfolio_status: portStatus || 'not_submitted', portfolio_approved: portApproved,
                completion_eligible: completionEligible,
                internship_eligible: internshipEligible,
                completion_cert_at: certMap[`completion_${s.student_id}`] || null,
                internship_cert_at: certMap[`internship_${s.student_id}`] || null,
            });
        }

        const batches = Object.values(batchMap);
        const all     = batches.flatMap(b => b.students);
        const stats   = {
            total_students:      all.length,
            completion_eligible: all.filter(s => s.completion_eligible).length,
            completion_obtained: all.filter(s => !!s.completion_cert_at).length,
            internship_eligible: all.filter(s => s.internship_eligible).length,
            internship_obtained: all.filter(s => !!s.internship_cert_at).length,
        };
        res.json({ batches, stats });

    } catch (error) {
        console.error('[getCertificateReport] ERROR:', error.message);
        res.status(500).json({ message: 'Error fetching certificate report', error: error.message });
    }
};

// ══════════════════════════════════════════════════════════════════════════════
// STUDENT WORK / PROJECTS REPORT
// ══════════════════════════════════════════════════════════════════════════════
exports.getStudentWorkReport = async (req, res) => {
    try {
        const { role_id, id: userId } = req.user;
        const { batch_id, course_id, batch_status } = req.query;
        const isTrainer = role_id === 3;

        const conditions = [];
        const params = [];
        if (isTrainer)    { conditions.push('b.trainer_id = ?'); params.push(userId); }
        if (batch_id)     { conditions.push('b.id = ?');          params.push(batch_id); }
        if (course_id)    { conditions.push('c.id = ?');          params.push(course_id); }
        if (batch_status) { conditions.push('b.status = ?');      params.push(batch_status); }

        // 1. Students
        const [students] = await pool.query(`
            SELECT b.id AS batch_id, b.batch_name, b.status AS batch_status,
                   c.id AS course_id, c.name AS course_name,
                   u.id AS student_id,
                   CONCAT(u.first_name, ' ', u.last_name) AS student_name,
                   u.email, bs.roll_number AS roll_number
            FROM Batches b
            JOIN Courses c ON b.course_id = c.id
            JOIN BatchStudents bs ON b.id = bs.batch_id
            JOIN Users u ON bs.student_id = u.id
            WHERE u.status = 'active'
            ${conditions.length ? 'AND ' + conditions.join(' AND ') : ''}
            ORDER BY b.status DESC, b.id, u.first_name, u.last_name
        `, params);

        if (!students.length) {
            return res.json({ batches: [], stats: { total_projects: 0, submitted: 0, graded: 0, with_link: 0, avg_marks: 0 } });
        }

        const batchIds = [...new Set(students.map(r => r.batch_id))];
        const bph = batchIds.map(() => '?').join(',');

        // 2. Released projects per batch
        const [releases] = await pool.query(`
            SELECT br.id AS release_id, br.batch_id, br.release_type,
                   br.entity_id, br.module_id,
                   COALESCE(mp.name, cp.name, CONCAT('Project #', br.entity_id)) AS project_name,
                   COALESCE(mp.description, cp.description, '') AS project_desc,
                   m.name AS module_name
            FROM BatchReleases br
            LEFT JOIN ModuleProjects mp ON br.entity_id = mp.id AND br.release_type = 'module_project'
            LEFT JOIN CapstoneProjecs cp ON br.entity_id = cp.id AND br.release_type = 'capstone_project'
            LEFT JOIN Modules m ON br.module_id = m.id
            WHERE br.batch_id IN (${bph})
              AND br.release_type IN ('module_project','capstone_project')
            ORDER BY br.batch_id, br.release_type, br.id
        `, batchIds);

        // 3. Submissions for those releases
        const submissionMap = {};
        if (releases.length) {
            const releaseIds = releases.map(r => r.release_id);
            const rph = releaseIds.map(() => '?').join(',');
            const [subs] = await pool.query(`
                SELECT release_id, student_id, id AS sub_id, status, marks,
                       github_link, file_name, submitted_at, feedback, notes
                FROM StudentReleaseSubmissions
                WHERE release_id IN (${rph})
            `, releaseIds);
            subs.forEach(s => { submissionMap[`${s.release_id}_${s.student_id}`] = s; });
        }

        // Organise releases by batch
        const releasesByBatch = {};
        releases.forEach(r => {
            if (!releasesByBatch[r.batch_id]) releasesByBatch[r.batch_id] = [];
            releasesByBatch[r.batch_id].push(r);
        });

        // Build output
        const batchMap = {};
        students.forEach(sr => {
            if (!batchMap[sr.batch_id]) {
                batchMap[sr.batch_id] = {
                    batch_id: sr.batch_id, batch_name: sr.batch_name, batch_status: sr.batch_status,
                    course_id: sr.course_id, course_name: sr.course_name, students: [],
                };
            }
            const rels = releasesByBatch[sr.batch_id] || [];
            const projects = rels.map(rel => {
                const sub = submissionMap[`${rel.release_id}_${sr.student_id}`] || null;
                return {
                    release_id: rel.release_id, release_type: rel.release_type,
                    project_name: rel.project_name, project_desc: rel.project_desc,
                    module_name: rel.module_name,
                    submitted: !!sub, status: sub?.status || 'not_submitted',
                    marks: sub?.marks ?? null, github_link: sub?.github_link || null,
                    file_name: sub?.file_name || null, submitted_at: sub?.submitted_at || null,
                    feedback: sub?.feedback || null, notes: sub?.notes || null,
                };
            });
            batchMap[sr.batch_id].students.push({
                student_id: sr.student_id, student_name: sr.student_name,
                email: sr.email, roll_number: sr.roll_number,
                total_assigned: projects.length,
                submitted_count: projects.filter(p => p.submitted).length,
                graded_count:    projects.filter(p => p.status === 'graded').length,
                projects,
            });
        });

        const batches  = Object.values(batchMap);
        const allProj  = batches.flatMap(b => b.students.flatMap(s => s.projects));
        const graded   = allProj.filter(p => p.marks != null);
        const stats    = {
            total_projects: allProj.length,
            submitted:      allProj.filter(p => p.submitted).length,
            graded:         allProj.filter(p => p.status === 'graded').length,
            with_link:      allProj.filter(p => !!p.github_link).length,
            avg_marks:      graded.length ? Math.round(graded.reduce((a, p) => a + p.marks, 0) / graded.length) : 0,
        };
        res.json({ batches, stats });

    } catch (error) {
        console.error('[getStudentWorkReport] ERROR:', error.message);
        res.status(500).json({ message: 'Error fetching student work report', error: error.message });
    }
};
