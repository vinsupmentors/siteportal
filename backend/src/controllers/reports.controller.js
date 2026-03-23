const pool = require('../config/db');

const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);

// ══════════════════════════════════════════════════════════════════════════════
// CERTIFICATE + ELIGIBILITY REPORT
// Accessible: SA (1), Admin (2), Trainer (3 — own batches only)
// ══════════════════════════════════════════════════════════════════════════════
exports.getCertificateReport = async (req, res) => {
    try {
        const { role_id, id: userId } = req.user;
        const { batch_id } = req.query;
        const isTrainer = role_id === 3;

        let conditions = [];
        let params = [];
        if (isTrainer)  { conditions.push('b.trainer_id = ?'); params.push(userId); }
        if (batch_id)   { conditions.push('b.id = ?');          params.push(batch_id); }
        const WHERE = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

        const [rows] = await pool.query(`
            SELECT
                b.id AS batch_id, b.batch_name, b.status AS batch_status,
                c.id AS course_id, c.name AS course_name,
                u.id AS student_id,
                CONCAT(u.first_name, ' ', u.last_name) AS student_name,
                u.email, bs.roll_number, u.student_status,

                /* attendance */
                (SELECT COUNT(*) FROM StudentAttendance sa
                 WHERE sa.student_id = u.id AND sa.batch_id = b.id) AS att_total,
                (SELECT SUM(CASE WHEN sa.status = 'present' THEN 1 ELSE 0 END)
                 FROM StudentAttendance sa
                 WHERE sa.student_id = u.id AND sa.batch_id = b.id) AS att_present,

                /* module project avg (graded only) */
                (SELECT ROUND(AVG(srs.marks), 1)
                 FROM StudentReleaseSubmissions srs
                 JOIN BatchReleases br ON srs.release_id = br.id
                 WHERE srs.student_id = u.id AND srs.batch_id = b.id
                   AND br.release_type = 'module_project' AND srs.status = 'graded') AS proj_avg,

                /* module projects: released vs submitted */
                (SELECT COUNT(*) FROM BatchReleases WHERE batch_id = b.id AND release_type = 'module_project') AS proj_released,
                (SELECT COUNT(*) FROM StudentReleaseSubmissions srs2
                 JOIN BatchReleases br2 ON srs2.release_id = br2.id
                 WHERE srs2.student_id = u.id AND srs2.batch_id = b.id
                   AND br2.release_type = 'module_project') AS proj_submitted,

                /* capstone graded */
                (SELECT COUNT(*) FROM StudentReleaseSubmissions srs
                 JOIN BatchReleases br ON srs.release_id = br.id
                 WHERE srs.student_id = u.id AND srs.batch_id = b.id
                   AND br.release_type = 'capstone_project' AND srs.status = 'graded') AS capstone_graded,

                /* tests released vs submitted */
                (SELECT COUNT(*) FROM BatchReleases WHERE batch_id = b.id AND release_type = 'module_test') AS tests_released,
                (SELECT COUNT(*) FROM StudentReleaseSubmissions srs
                 JOIN BatchReleases br ON srs.release_id = br.id
                 WHERE srs.student_id = u.id AND srs.batch_id = b.id
                   AND br.release_type = 'module_test') AS tests_submitted,

                /* feedback released vs submitted */
                (SELECT COUNT(*) FROM BatchReleases WHERE batch_id = b.id AND release_type = 'module_feedback') AS fb_released,
                (SELECT COUNT(*) FROM StudentFeedbackResponses
                 WHERE student_id = u.id AND batch_id = b.id) AS fb_submitted,

                /* portfolio latest status */
                (SELECT status FROM PortfolioRequests
                 WHERE student_id = u.id ORDER BY id DESC LIMIT 1) AS portfolio_status,

                /* certificates */
                (SELECT DATE_FORMAT(generated_at, '%Y-%m-%d') FROM Certificates
                 WHERE student_id = u.id AND cert_type = 'completion' AND reset_by_admin = 0 LIMIT 1) AS completion_cert_at,
                (SELECT DATE_FORMAT(generated_at, '%Y-%m-%d') FROM Certificates
                 WHERE student_id = u.id AND cert_type = 'internship' AND reset_by_admin = 0 LIMIT 1) AS internship_cert_at

            FROM Batches b
            JOIN Courses c ON b.course_id = c.id
            JOIN BatchStudents bs ON b.id = bs.batch_id
            JOIN Users u ON bs.student_id = u.id AND u.status = 'active'
            ${WHERE}
            ORDER BY b.id, u.first_name, u.last_name
        `, params);

        // group into batch → students
        const batchMap = {};
        for (const r of rows) {
            if (!batchMap[r.batch_id]) {
                batchMap[r.batch_id] = {
                    batch_id: r.batch_id, batch_name: r.batch_name, batch_status: r.batch_status,
                    course_id: r.course_id, course_name: r.course_name,
                    students: [],
                };
            }
            const attTotal   = r.att_total    || 0;
            const attPresent = r.att_present  || 0;
            const attPct     = pct(attPresent, attTotal);
            const projAvg    = r.proj_avg != null ? parseFloat(r.proj_avg) : null;
            const capstoneGraded  = r.capstone_graded || 0;
            const testsReleased   = r.tests_released  || 0;
            const testsSubmitted  = r.tests_submitted || 0;
            const fbReleased      = r.fb_released     || 0;
            const fbSubmitted     = r.fb_submitted    || 0;
            const portfolioApproved = r.portfolio_status === 'approved';
            const testPct = pct(testsSubmitted, testsReleased);
            const fbPct   = pct(fbSubmitted, fbReleased);
            const projSubmitted = r.proj_submitted || 0;
            const projReleased  = r.proj_released  || 0;

            const completionEligible = attPct >= 75;
            const internshipEligible =
                attPct >= 80 &&
                (projAvg == null || projAvg >= 75) &&
                capstoneGraded >= 1 &&
                (testsReleased === 0 || testPct === 100) &&
                (fbReleased === 0   || fbPct === 100) &&
                portfolioApproved;

            batchMap[r.batch_id].students.push({
                student_id: r.student_id,
                student_name: r.student_name,
                email: r.email,
                roll_number: r.roll_number,
                student_status: r.student_status,
                att_total: attTotal, att_present: attPresent, att_pct: attPct,
                proj_avg: projAvg,
                proj_released: projReleased, proj_submitted: projSubmitted,
                capstone_graded: capstoneGraded,
                tests_released: testsReleased, tests_submitted: testsSubmitted, test_pct: testPct,
                fb_released: fbReleased, fb_submitted: fbSubmitted, fb_pct: fbPct,
                portfolio_status: r.portfolio_status || 'not_submitted',
                portfolio_approved: portfolioApproved,
                completion_eligible: completionEligible,
                internship_eligible: internshipEligible,
                completion_cert_at: r.completion_cert_at || null,
                internship_cert_at: r.internship_cert_at || null,
            });
        }

        const batches = Object.values(batchMap);
        const all     = batches.flatMap(b => b.students);
        const stats   = {
            total_students:       all.length,
            completion_eligible:  all.filter(s => s.completion_eligible).length,
            completion_obtained:  all.filter(s => !!s.completion_cert_at).length,
            internship_eligible:  all.filter(s => s.internship_eligible).length,
            internship_obtained:  all.filter(s => !!s.internship_cert_at).length,
        };

        res.json({ batches, stats });
    } catch (error) {
        console.error('[getCertificateReport]', error.message);
        res.status(500).json({ message: 'Error fetching certificate report', error: error.message });
    }
};

// ══════════════════════════════════════════════════════════════════════════════
// STUDENT WORK / PROJECTS REPORT
// ══════════════════════════════════════════════════════════════════════════════
exports.getStudentWorkReport = async (req, res) => {
    try {
        const { role_id, id: userId } = req.user;
        const { batch_id } = req.query;
        const isTrainer = role_id === 3;

        let conditions = [];
        let params = [];
        if (isTrainer) { conditions.push('b.trainer_id = ?'); params.push(userId); }
        if (batch_id)  { conditions.push('b.id = ?');          params.push(batch_id); }
        const WHERE = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

        // students per batch
        const [studentRows] = await pool.query(`
            SELECT
                b.id AS batch_id, b.batch_name, b.status AS batch_status,
                c.id AS course_id, c.name AS course_name,
                u.id AS student_id,
                CONCAT(u.first_name, ' ', u.last_name) AS student_name,
                u.email, bs.roll_number
            FROM Batches b
            JOIN Courses c ON b.course_id = c.id
            JOIN BatchStudents bs ON b.id = bs.batch_id
            JOIN Users u ON bs.student_id = u.id AND u.status = 'active'
            ${WHERE}
            ORDER BY b.id, u.first_name, u.last_name
        `, params);

        if (!studentRows.length) {
            return res.json({ batches: [], stats: { total_projects: 0, submitted: 0, graded: 0, with_link: 0, avg_marks: 0 } });
        }

        const batchIds = [...new Set(studentRows.map(r => r.batch_id))];
        const ph = batchIds.map(() => '?').join(',');

        // released projects per batch
        const [releaseRows] = await pool.query(`
            SELECT
                br.id AS release_id, br.batch_id, br.release_type, br.entity_id, br.module_id,
                COALESCE(mp.name, cp.name, CONCAT('Project #', br.entity_id)) AS project_name,
                COALESCE(mp.description, cp.description, '') AS project_desc,
                m.name AS module_name
            FROM BatchReleases br
            LEFT JOIN ModuleProjects mp ON br.entity_id = mp.id AND br.release_type = 'module_project'
            LEFT JOIN CapstoneProjecs cp ON br.entity_id = cp.id AND br.release_type = 'capstone_project'
            LEFT JOIN Modules m ON br.module_id = m.id
            WHERE br.batch_id IN (${ph})
              AND br.release_type IN ('module_project','capstone_project')
            ORDER BY br.batch_id, br.release_type, br.id
        `, batchIds);

        // all submissions for those releases
        let submissionMap = {};
        if (releaseRows.length) {
            const releaseIds = releaseRows.map(r => r.release_id);
            const rph = releaseIds.map(() => '?').join(',');
            const [subs] = await pool.query(`
                SELECT release_id, student_id, id AS sub_id, status, marks,
                       github_link, file_name, submitted_at, feedback, notes
                FROM StudentReleaseSubmissions
                WHERE release_id IN (${rph})
            `, releaseIds);
            for (const s of subs) {
                submissionMap[`${s.release_id}_${s.student_id}`] = s;
            }
        }

        const releasesByBatch = {};
        for (const r of releaseRows) {
            if (!releasesByBatch[r.batch_id]) releasesByBatch[r.batch_id] = [];
            releasesByBatch[r.batch_id].push(r);
        }

        const batchMap = {};
        for (const sr of studentRows) {
            if (!batchMap[sr.batch_id]) {
                batchMap[sr.batch_id] = {
                    batch_id: sr.batch_id, batch_name: sr.batch_name, batch_status: sr.batch_status,
                    course_id: sr.course_id, course_name: sr.course_name,
                    students: [],
                };
            }

            const releases = releasesByBatch[sr.batch_id] || [];
            const projects = releases.map(rel => {
                const sub = submissionMap[`${rel.release_id}_${sr.student_id}`] || null;
                return {
                    release_id:   rel.release_id,
                    release_type: rel.release_type,
                    project_name: rel.project_name,
                    project_desc: rel.project_desc,
                    module_name:  rel.module_name,
                    submitted:    !!sub,
                    status:       sub?.status || 'not_submitted',
                    marks:        sub?.marks  ?? null,
                    github_link:  sub?.github_link || null,
                    file_name:    sub?.file_name   || null,
                    submitted_at: sub?.submitted_at || null,
                    feedback:     sub?.feedback     || null,
                    notes:        sub?.notes        || null,
                };
            });

            const submittedCount = projects.filter(p => p.submitted).length;
            const gradedCount    = projects.filter(p => p.status === 'graded').length;

            batchMap[sr.batch_id].students.push({
                student_id:   sr.student_id,
                student_name: sr.student_name,
                email:        sr.email,
                roll_number:  sr.roll_number,
                total_assigned: projects.length,
                submitted_count: submittedCount,
                graded_count:    gradedCount,
                projects,
            });
        }

        const batches   = Object.values(batchMap);
        const allProj   = batches.flatMap(b => b.students.flatMap(s => s.projects));
        const gradedArr = allProj.filter(p => p.marks != null);
        const stats     = {
            total_projects: allProj.length,
            submitted:      allProj.filter(p => p.submitted).length,
            graded:         allProj.filter(p => p.status === 'graded').length,
            with_link:      allProj.filter(p => !!p.github_link).length,
            avg_marks:      gradedArr.length
                ? Math.round(gradedArr.reduce((a, p) => a + p.marks, 0) / gradedArr.length)
                : 0,
        };

        res.json({ batches, stats });
    } catch (error) {
        console.error('[getStudentWorkReport]', error.message);
        res.status(500).json({ message: 'Error fetching student work report', error: error.message });
    }
};

// ══════════════════════════════════════════════════════════════════════════════
// BATCH LIST (for filter dropdown in report pages)
// ══════════════════════════════════════════════════════════════════════════════
exports.getBatchesForReport = async (req, res) => {
    try {
        const { role_id, id: userId } = req.user;
        const isTrainer = role_id === 3;

        const [rows] = await pool.query(`
            SELECT b.id, b.batch_name, b.status, c.name AS course_name
            FROM Batches b
            JOIN Courses c ON b.course_id = c.id
            ${isTrainer ? 'WHERE b.trainer_id = ?' : ''}
            ORDER BY b.id DESC
        `, isTrainer ? [userId] : []);

        res.json({ batches: rows });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching batches', error: error.message });
    }
};
