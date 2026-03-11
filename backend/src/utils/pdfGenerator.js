const PDFDocument = require('pdfkit');

exports.generateInternshipCertificate = (studentName, courseName, stream) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                layout: 'landscape',
                margins: { top: 50, bottom: 50, left: 50, right: 50 }
            });

            doc.pipe(stream);

            doc.on('end', () => resolve());
            doc.on('error', (err) => reject(err));

            // Outer Border
            doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).strokeColor('#2e4053').lineWidth(3).stroke();
            // Inner Border
            doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60).strokeColor('#d4af37').lineWidth(1).stroke();

            // Header Section
            doc.font('Helvetica-Bold').fontSize(36).fillColor('#1a5276')
                .text('INTERNSHIP CERTIFICATE', { align: 'center', margin: 20 });
                
            doc.moveDown(1);
            
            doc.font('Helvetica').fontSize(16).fillColor('#333333')
                .text('This is to certify that', { align: 'center' });
                
            doc.moveDown(1);
            
            doc.font('Helvetica-Bold').fontSize(30).fillColor('#c0392b')
                .text(studentName.toUpperCase(), { align: 'center' });
                
            doc.moveDown(1);
            
            doc.font('Helvetica').fontSize(16).fillColor('#333333')
                .text('has successfully completed the internship program in', { align: 'center' });
                
            doc.moveDown(0.5);
            
            doc.font('Helvetica-Bold').fontSize(22).fillColor('#2980b9')
                .text(courseName, { align: 'center' });
            
            doc.moveDown(1.5);
            
            doc.font('Helvetica').fontSize(14).fillColor('#555555')
                .text('During this period, they demonstrated excellent skills, dedication,', { align: 'center' });
            doc.text('and a strong commitment to learning and professional growth.', { align: 'center' });
            
            doc.moveDown(3);
            
            // Signatures
            const y = doc.y;
            
            // Date
            doc.font('Helvetica-Bold').fontSize(14).fillColor('#333333').text(`Date: ${new Date().toLocaleDateString()}`, 50, y);
            
            // Signature Line
            doc.lineWidth(1).strokeColor('#333333');
            doc.moveTo(doc.page.width - 250, y + 20).lineTo(doc.page.width - 50, y + 20).stroke();
            doc.font('Helvetica').fontSize(12).text('Authorized Signature', doc.page.width - 200, y + 25);
            
            // Company Info (Bottom)
            doc.fontSize(10).fillColor('#888888')
                .text('Edutech Pro - Empowering Careers', 0, doc.page.height - 60, { align: 'center' });

            doc.end();
            
        } catch (err) {
            reject(err);
        }
    });
};
