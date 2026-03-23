const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER || 'test@gmail.com',
        pass: process.env.EMAIL_PASS || 'test_password'
    },
    tls: { rejectUnauthorized: false }
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

exports.sendAbsenceEmail = async (to, studentName, consecutiveDays, isManagement = false, studentData = {}) => {
    try {
        const { batch_name = '', course_name = '', trainer_name = '', email = '', phone = '', attPct = 0 } = studentData;
        const attColor = attPct >= 85 ? '#10b981' : attPct >= 60 ? '#f59e0b' : '#ef4444';
        const attLabel = attPct >= 85 ? 'Good Standing' : attPct >= 60 ? 'At Risk' : 'Critical';
        const severity = consecutiveDays >= 3 ? '#ef4444' : '#f59e0b';
        const severityBg = consecutiveDays >= 3 ? '#fef2f2' : '#fffbeb';
        const severityBorder = consecutiveDays >= 3 ? '#fca5a5' : '#fde68a';

        let html;

        if (!isManagement) {
            // ── Email to student ─────────────────────────────────────────
            html = `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;border-radius:10px;overflow:hidden">
                <div style="background:#1a3a6b;padding:26px 30px">
                    <div style="color:#a8c4e8;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px">Vinsup Edutech Portal</div>
                    <div style="color:#fff;font-size:20px;font-weight:800">⚠️ Attendance Warning</div>
                    <div style="color:#c8d8f0;font-size:13px;margin-top:4px">${batch_name}${course_name ? ' · ' + course_name : ''}</div>
                </div>
                <div style="padding:26px 30px;background:#fff">
                    <p style="font-size:14px;color:#333;margin:0 0 18px">Hi <strong>${studentName}</strong>,</p>
                    <div style="padding:16px 20px;background:${severityBg};border:1px solid ${severityBorder};border-left:4px solid ${severity};border-radius:8px;margin-bottom:22px">
                        <p style="font-size:15px;font-weight:700;color:${severity};margin:0 0 6px">
                            ${consecutiveDays >= 3 ? '🔴' : '🟡'} ${consecutiveDays} Consecutive Day${consecutiveDays !== 1 ? 's' : ''} Absent
                        </p>
                        <p style="font-size:13px;color:#555;margin:0">
                            You have been marked absent for <strong>${consecutiveDays} consecutive session${consecutiveDays !== 1 ? 's' : ''}</strong>.
                            ${consecutiveDays >= 3 ? 'This is a critical attendance concern that requires immediate attention.' : 'Please ensure you attend your upcoming sessions.'}
                        </p>
                    </div>

                    <!-- Attendance bar -->
                    <p style="font-size:11px;font-weight:700;text-transform:uppercase;color:#888;letter-spacing:1px;margin:0 0 10px">Current Attendance</p>
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
                        <div style="flex:1;background:#e5e7eb;border-radius:999px;height:10px;overflow:hidden">
                            <div style="height:100%;width:${Math.min(attPct, 100)}%;background:${attColor};border-radius:999px"></div>
                        </div>
                        <span style="font-size:18px;font-weight:800;color:${attColor};min-width:48px;text-align:right">${attPct}%</span>
                        <span style="font-size:11px;padding:2px 9px;border-radius:20px;background:${attColor}20;color:${attColor};font-weight:700">${attLabel}</span>
                    </div>
                    <p style="font-size:12px;color:#aaa;margin:0 0 22px">Minimum required attendance: <strong>75%</strong></p>

                    <!-- Info -->
                    <div style="background:#f9fafb;border-radius:8px;padding:14px 16px;margin-bottom:20px">
                        ${batch_name ? `<p style="font-size:12px;color:#555;margin:0 0 4px">📚 <strong>Batch:</strong> ${batch_name}</p>` : ''}
                        ${course_name ? `<p style="font-size:12px;color:#555;margin:0 0 4px">🎓 <strong>Course:</strong> ${course_name}</p>` : ''}
                        ${trainer_name ? `<p style="font-size:12px;color:#555;margin:0">👨‍🏫 <strong>Trainer:</strong> ${trainer_name}</p>` : ''}
                    </div>

                    <!-- CTA -->
                    <div style="padding:14px 16px;background:#eff6ff;border-radius:8px;border:1px solid #bfdbfe">
                        <p style="font-size:13px;font-weight:700;color:#1e40af;margin:0 0 6px">What you should do:</p>
                        <ul style="font-size:12px;color:#1e3a8a;margin:0;padding-left:18px">
                            <li>Contact your trainer <strong>${trainer_name || ''}</strong> to explain your absence</li>
                            <li>Resume attending sessions from tomorrow onwards</li>
                            ${consecutiveDays >= 3 ? '<li style="color:#dc2626;font-weight:700">Visit the management office immediately — your enrollment may be at risk</li>' : ''}
                        </ul>
                    </div>
                </div>
                <div style="padding:14px 30px;background:#f0f0f0;font-size:11px;color:#888">
                    This is an automated attendance alert from <strong>Vinsup Edutech Portal</strong>. Do not reply to this email.
                </div>
            </div>`;
        } else {
            // ── Email to management ──────────────────────────────────────
            html = `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;border-radius:10px;overflow:hidden">
                <div style="background:#7f1d1d;padding:26px 30px">
                    <div style="color:#fca5a5;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px">Vinsup Edutech — Management Alert</div>
                    <div style="color:#fff;font-size:20px;font-weight:800">🔴 Critical Absence Alert</div>
                    <div style="color:#fecaca;font-size:13px;margin-top:4px">Immediate attention required</div>
                </div>
                <div style="padding:26px 30px;background:#fff">
                    <div style="padding:16px 20px;background:#fef2f2;border:1px solid #fca5a5;border-left:4px solid #ef4444;border-radius:8px;margin-bottom:22px">
                        <p style="font-size:15px;font-weight:700;color:#dc2626;margin:0 0 4px">
                            ${studentName} has been absent for ${consecutiveDays} consecutive day${consecutiveDays !== 1 ? 's' : ''}
                        </p>
                        <p style="font-size:13px;color:#7f1d1d;margin:0">Please follow up immediately and take appropriate action.</p>
                    </div>

                    <!-- Student card -->
                    <p style="font-size:11px;font-weight:700;text-transform:uppercase;color:#888;letter-spacing:1px;margin:0 0 10px">Student Details</p>
                    <div style="background:#f9fafb;border-radius:8px;padding:14px 16px;margin-bottom:22px">
                        <p style="font-size:13px;font-weight:700;color:#111;margin:0 0 10px">👤 ${studentName}</p>
                        ${email ? `<p style="font-size:12px;color:#555;margin:0 0 4px">📧 <strong>Email:</strong> <a href="mailto:${email}" style="color:#1a3a6b">${email}</a></p>` : ''}
                        ${phone ? `<p style="font-size:12px;color:#555;margin:0 0 4px">📱 <strong>Phone:</strong> ${phone}</p>` : ''}
                        ${batch_name ? `<p style="font-size:12px;color:#555;margin:0 0 4px">📚 <strong>Batch:</strong> ${batch_name}</p>` : ''}
                        ${course_name ? `<p style="font-size:12px;color:#555;margin:0 0 4px">🎓 <strong>Course:</strong> ${course_name}</p>` : ''}
                        ${trainer_name ? `<p style="font-size:12px;color:#555;margin:0">👨‍🏫 <strong>Trainer:</strong> ${trainer_name}</p>` : ''}
                    </div>

                    <!-- Attendance -->
                    <p style="font-size:11px;font-weight:700;text-transform:uppercase;color:#888;letter-spacing:1px;margin:0 0 10px">Student's Overall Attendance</p>
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
                        <div style="flex:1;background:#e5e7eb;border-radius:999px;height:10px;overflow:hidden">
                            <div style="height:100%;width:${Math.min(attPct, 100)}%;background:${attColor};border-radius:999px"></div>
                        </div>
                        <span style="font-size:18px;font-weight:800;color:${attColor};min-width:48px;text-align:right">${attPct}%</span>
                    </div>

                    <!-- Actions -->
                    <div style="padding:14px 16px;background:#fff7ed;border-radius:8px;border:1px solid #fed7aa">
                        <p style="font-size:13px;font-weight:700;color:#92400e;margin:0 0 6px">Suggested Actions:</p>
                        <ul style="font-size:12px;color:#78350f;margin:0;padding-left:18px">
                            <li>Contact the student directly via email or phone</li>
                            <li>Inform the assigned trainer (${trainer_name || 'N/A'}) to follow up</li>
                            <li>Record the absence reason in the student's profile</li>
                            <li style="font-weight:700">Consider issuing a formal warning if absences continue</li>
                        </ul>
                    </div>
                </div>
                <div style="padding:14px 30px;background:#f0f0f0;font-size:11px;color:#888">
                    Automated alert from <strong>Vinsup Edutech Portal</strong> — triggered daily at 6 PM. Do not reply.
                </div>
            </div>`;
        }

        const subject = isManagement
            ? `🔴 Critical Absence Alert: ${studentName} — ${consecutiveDays} Consecutive Days`
            : `⚠️ Attendance Warning: ${consecutiveDays} Consecutive Absence${consecutiveDays !== 1 ? 's' : ''} — Action Required`;

        await transporter.sendMail({
            from: `"Vinsup Edutech" <${process.env.EMAIL_USER || 'test@gmail.com'}>`,
            to,
            subject,
            html,
        });
        console.log(`[Email] ${consecutiveDays}-day absence alert sent to ${to} (management=${isManagement})`);
    } catch (error) {
        console.error('[Email] Error sending absence email:', error.message);
    }
};
