const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'test@gmail.com',
        pass: process.env.EMAIL_PASS || 'test_password'
    }
});

exports.sendAnnouncementEmail = async (recipients, title, message, senderName) => {
    if (!recipients || !recipients.length) return;
    const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;border-radius:8px;overflow:hidden">
            <div style="background:#1a3a6b;padding:24px 28px">
                <div style="color:#fff;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px">Vinsup Edutech Portal</div>
                <div style="color:#fff;font-size:20px;font-weight:700">${title}</div>
            </div>
            <div style="padding:28px;background:#fff">
                <p style="color:#333;font-size:14px;line-height:1.8;white-space:pre-wrap">${message}</p>
            </div>
            <div style="padding:16px 28px;background:#f0f0f0;font-size:11px;color:#888">
                Sent by <strong>${senderName}</strong> via Vinsup Edutech Portal. Do not reply to this email.
            </div>
        </div>`;
    for (const { email, name } of recipients) {
        try {
            await transporter.sendMail({
                from: `"Vinsup Edutech" <${process.env.EMAIL_USER || 'test@gmail.com'}>`,
                to: email,
                subject: `📢 ${title}`,
                html: html.replace('${message}', message),
            });
            console.log(`[Email] Announcement sent to ${email}`);
        } catch (err) {
            console.error(`[Email] Failed to send to ${email}:`, err.message);
        }
    }
};

exports.sendStudentProgressReport = async (student, data) => {
    const { attPct, att, submissions, pendingCount, positiveRemarks, moduleReviews, customMessage } = data;
    const name = `${student.first_name} ${student.last_name}`;
    const attColor = attPct >= 85 ? '#10b981' : attPct >= 60 ? '#f59e0b' : '#ef4444';
    const attLabel = attPct >= 85 ? 'Good Standing' : attPct >= 60 ? 'At Risk' : 'Critical';

    // Marks rows (tests + projects + capstone)
    const gradedSubs = submissions.filter(s => s.marks != null);
    const marksRows = gradedSubs.map(s => {
        const typeLabel = s.release_type === 'module_test' ? 'Test' : s.release_type === 'module_project' ? 'Project' : 'Capstone';
        const mc = s.marks >= 80 ? '#10b981' : s.marks >= 60 ? '#f59e0b' : '#ef4444';
        return `<tr style="border-bottom:1px solid #f0f0f0">
            <td style="padding:8px 12px;font-size:13px;color:#333">${s.module_name || 'Module'}</td>
            <td style="padding:8px 12px;font-size:12px;color:#666">${typeLabel}</td>
            <td style="padding:8px 12px;font-size:14px;font-weight:700;color:${mc};text-align:right">${s.marks}/100</td>
        </tr>`;
    }).join('');

    // Trainer module reviews
    const reviewsHtml = moduleReviews.map(r => `
        <div style="margin-bottom:12px;padding:12px;background:#f9f9f9;border-left:3px solid #1a3a6b;border-radius:4px">
            <div style="font-size:13px;font-weight:700;color:#1a3a6b">${r.module_name}${r.grade ? ` <span style="background:#1a3a6b;color:#fff;padding:1px 7px;border-radius:10px;font-size:11px">${r.grade}</span>` : ''}${r.overall_marks != null ? ` <span style="font-size:12px;color:#555">(${r.overall_marks}/100)</span>` : ''}</div>
            ${r.strengths ? `<p style="font-size:12px;color:#333;margin:4px 0 0">✅ <strong>Strengths:</strong> ${r.strengths}</p>` : ''}
            ${r.improvements ? `<p style="font-size:12px;color:#333;margin:4px 0 0">🔧 <strong>Improvements:</strong> ${r.improvements}</p>` : ''}
        </div>`).join('');

    const remarksHtml = positiveRemarks.length
        ? positiveRemarks.map(r => `<li style="font-size:13px;color:#333;margin-bottom:4px">${r.remark_text}</li>`).join('')
        : '<li style="font-size:13px;color:#888">No remarks yet.</li>';

    const customSection = customMessage
        ? `<div style="margin-top:20px;padding:14px 16px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px">
               <p style="font-size:12px;font-weight:700;color:#92400e;margin:0 0 6px;text-transform:uppercase">Message from Admin</p>
               <p style="font-size:14px;color:#333;white-space:pre-wrap;margin:0">${customMessage}</p>
           </div>`
        : '';

    const html = `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;background:#f9f9f9;border-radius:10px;overflow:hidden">
        <div style="background:#1a3a6b;padding:28px 32px">
            <div style="color:#a8c4e8;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px">Vinsup Edutech Portal</div>
            <div style="color:#fff;font-size:22px;font-weight:800">Progress Report</div>
            <div style="color:#c8d8f0;font-size:13px;margin-top:4px">${name} — ${student.batch_name} · ${student.course_name}</div>
        </div>
        <div style="padding:28px 32px;background:#fff">
            <p style="font-size:14px;color:#333;margin:0 0 22px">Hi <strong>${student.first_name}</strong>, here is your latest academic progress summary from Vinsup Edutech.</p>

            <!-- Attendance -->
            <div style="margin-bottom:24px">
                <p style="font-size:11px;font-weight:700;text-transform:uppercase;color:#888;letter-spacing:1px;margin:0 0 10px">Attendance</p>
                <div style="display:flex;align-items:center;gap:14px">
                    <div style="flex:1;background:#e5e7eb;border-radius:999px;height:12px;overflow:hidden">
                        <div style="height:100%;width:${attPct}%;background:${attColor};border-radius:999px"></div>
                    </div>
                    <span style="font-size:20px;font-weight:800;color:${attColor};min-width:48px;text-align:right">${attPct}%</span>
                    <span style="font-size:11px;padding:3px 10px;border-radius:20px;background:${attColor}20;color:${attColor};font-weight:700">${attLabel}</span>
                </div>
                <p style="font-size:12px;color:#aaa;margin:6px 0 0">Present: ${att.present_days || 0} &nbsp;|&nbsp; Absent: ${att.absent_days || 0} &nbsp;|&nbsp; Leave: ${att.leave_days || 0} &nbsp;|&nbsp; Total: ${att.total || 0} sessions</p>
            </div>

            ${marksRows ? `
            <!-- Marks Summary -->
            <div style="margin-bottom:24px">
                <p style="font-size:11px;font-weight:700;text-transform:uppercase;color:#888;letter-spacing:1px;margin:0 0 10px">Marks Summary</p>
                <table style="width:100%;border-collapse:collapse;background:#fafafa;border-radius:8px;overflow:hidden">
                    <thead><tr style="background:#f0f0f0">
                        <th style="padding:9px 12px;font-size:11px;text-align:left;color:#555;text-transform:uppercase">Module</th>
                        <th style="padding:9px 12px;font-size:11px;text-align:left;color:#555;text-transform:uppercase">Type</th>
                        <th style="padding:9px 12px;font-size:11px;text-align:right;color:#555;text-transform:uppercase">Marks</th>
                    </tr></thead>
                    <tbody>${marksRows}</tbody>
                </table>
            </div>` : ''}

            ${pendingCount > 0 ? `
            <!-- Pending Alert -->
            <div style="margin-bottom:24px;padding:14px 16px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:6px">
                <p style="font-size:13px;font-weight:700;color:#92400e;margin:0 0 4px">⏳ ${pendingCount} Pending Submission${pendingCount !== 1 ? 's' : ''}</p>
                <p style="font-size:12px;color:#78350f;margin:0">Please complete and submit your pending assignments as soon as possible.</p>
            </div>` : ''}

            ${reviewsHtml ? `
            <!-- Module Reviews -->
            <div style="margin-bottom:24px">
                <p style="font-size:11px;font-weight:700;text-transform:uppercase;color:#888;letter-spacing:1px;margin:0 0 10px">Trainer Module Reviews</p>
                ${reviewsHtml}
            </div>` : ''}

            <!-- Positive Remarks -->
            <div style="margin-bottom:20px">
                <p style="font-size:11px;font-weight:700;text-transform:uppercase;color:#888;letter-spacing:1px;margin:0 0 10px">Trainer Remarks</p>
                <ul style="padding-left:20px;margin:0">${remarksHtml}</ul>
            </div>

            ${customSection}
        </div>
        <div style="padding:16px 32px;background:#f0f0f0;font-size:11px;color:#888">
            Sent by <strong>Vinsup Edutech Admin</strong> via the Student Portal. This is an automated report — do not reply.
        </div>
    </div>`;

    await transporter.sendMail({
        from: `"Vinsup Edutech" <${process.env.EMAIL_USER || 'test@gmail.com'}>`,
        to: student.email,
        subject: `📊 Your Progress Report — ${student.batch_name} (${student.course_name})`,
        html,
    });
    console.log(`[Email] Progress report sent to ${student.email}`);
};

exports.sendAbsenceEmail = async (to, studentName, consecutiveDays, isManagement = false) => {
    try {
        const subject = isManagement
            ? `Critical Absence Alert: ${studentName} - ${consecutiveDays} Consecutive Days`
            : `Attendance Warning: ${consecutiveDays} Consecutive Absences`;

        const text = isManagement
            ? `Student ${studentName} has been absent for ${consecutiveDays} consecutive days. Please take appropriate action.`
            : `Dear ${studentName},\n\nYou have been marked absent for ${consecutiveDays} consecutive days. Please contact your trainer or management immediately to avoid further disciplinary action.`;

        await transporter.sendMail({
            from: process.env.EMAIL_USER || 'test@gmail.com',
            to: to,
            subject: subject,
            text: text
        });
        console.log(`[Email Service]: Sent ${consecutiveDays}-day alert to ${to}`);
    } catch (error) {
        console.error('[Email Service]: Error sending email', error.message);
    }
};
