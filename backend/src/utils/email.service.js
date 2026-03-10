const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    // Using a placeholder configuration. In a real scenario, this would use process.env values.
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'test@gmail.com',
        pass: process.env.EMAIL_PASS || 'test_password'
    }
});

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
