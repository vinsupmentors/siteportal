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
