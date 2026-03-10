const fs = require('fs');
const path = require('path');

/**
 * Portfolio Engine
 * Transforms Student JSON data into the exact HTML template requested.
 */
exports.generatePremiumPortfolio = (data) => {
    const { personal, links, projects, skills, gallery } = data;
    const currentYear = new Date().getFullYear();

    const name = personal?.name || 'Gaurav Kumar';
    const title = personal?.role || 'Data Analyst';
    const email = personal?.email || 'gaurav.kumar@email.com';
    const phone = personal?.phone || '+91 98765 43210';
    const address = personal?.address || 'Coimbatore, Tamil Nadu';

    // Initials helper
    const getInitials = (n) => {
        if (!n) return '';
        const parts = n.trim().split(' ').filter(p => p);
        if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        if (parts.length === 1 && parts[0]) return parts[0].substring(0, 2).toUpperCase();
        return '';
    };

    const initials = getInitials(name);

    let profileImg = personal?.profile_img || '';
    if (!profileImg) profileImg = `https://placehold.co/300x300/1e3a8a/ffffff?text=${initials}`;

    let aboutImg = personal?.about_img || '';
    if (!aboutImg || !aboutImg.startsWith('data:image')) {
        aboutImg = `https://placehold.co/600x600/bfdbfe/1d4ed8?text=${name.split(' ')[0] || 'About'}`;
    }

    const footerLogo = personal?.footer_logo || 'https://clever-pithivier-419872.netlify.app/Untitled_design-removebg-preview.png';

    const aboutText = personal?.about_text || "I'm a passionate and driven data analysis student with a knack for uncovering insights from complex datasets. I thrive in collaborative environments and am always eager to learn new tools and take on challenging analytical problems.";

    const linkedinUrl = links?.linkedin || '#';
    const indeedUrl = links?.indeed || '#';
    const naukriUrl = links?.naukri || '#';

    // Build Projects HTML
    let projectsHtml = '';
    if (projects && projects.length > 0) {
        projectsHtml = projects.map((p, index) => {
            if (!p.title && !p.desc) return '';
            const delay = (index % 3) * 100;
            return `
            <div class="glass-card rounded-2xl p-8 flex flex-col h-full border border-white/20 shadow-xl overflow-hidden group hover:-translate-y-2 transition-all duration-500" data-aos="fade-up" data-aos-delay="${delay}">
                <div class="h-1.5 w-12 bg-blue-500 rounded-full mb-6 group-hover:w-24 transition-all duration-500"></div>
                <h3 class="text-2xl font-bold mb-4 text-gray-800">${p.title || 'Project'}</h3>
                <p class="text-gray-600 mb-6 flex-grow leading-relaxed">${p.desc || ''}</p>
                <div class="flex items-center justify-between mt-auto pt-6 border-t border-gray-100">
                    <a href="${p.link || '#'}" target="_blank" class="flex items-center gap-2 text-blue-600 font-bold hover:text-blue-700 transition-colors">
                        Explore Case Study 
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                    </a>
                </div>
            </div>`;
        }).join('');
    }

    // Build Skills HTML
    let skillsHtml = '';
    if (skills && skills.length > 0) {
        skillsHtml = skills.map((s, index) => {
            if (!s.category || !s.items) return '';
            const skillItems = s.items.split(',').map(item => `
                <span class="px-3 py-1.5 bg-white/40 text-blue-800 rounded-lg text-sm font-semibold border border-blue-100/50 backdrop-blur-sm">
                    ${item.trim()}
                </span>
            `).join('');
            const delay = index * 50;
            return `
            <div class="p-6 rounded-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/80 border border-blue-100/50" data-aos="zoom-in" data-aos-delay="${delay}">
                <h3 class="font-extrabold text-blue-900 border-b-2 border-blue-200/50 pb-3 mb-4 inline-block tracking-tight text-lg">${s.category}</h3>
                <div class="flex flex-wrap gap-2 justify-center">${skillItems}</div>
            </div>`;
        }).join('');
    }

    // Build Gallery HTML
    let galleryHtml = '';
    if (gallery && gallery.length > 0) {
        const gridItems = gallery.map((img, idx) => `
            <div class="relative overflow-hidden rounded-2xl shadow-lg aspect-square group cursor-pointer" data-aos="fade-up" data-aos-delay="${idx * 100}">
                <img src="${img}" class="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110" alt="Work Gallery Item">
                <div class="absolute inset-0 bg-gradient-to-t from-blue-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                    <span class="text-white font-bold tracking-wider uppercase text-sm">View Implementation</span>
                </div>
            </div>
        `).join('');

        galleryHtml = `
            <section id="gallery" class="py-24 bg-white overflow-hidden">
                <div class="container mx-auto px-6">
                    <div class="text-center mb-16" data-aos="fade-down">
                        <span class="text-blue-600 font-black tracking-widest uppercase text-sm mb-4 block">Visual Showcase</span>
                        <h2 class="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">Project Gallery</h2>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        ${gridItems}
                    </div>
                </div>
            </section>
        `;
    }

    const socialLinks = `
        <div class="flex gap-4">
            <a href="${linkedinUrl}" target="_blank" class="w-12 h-12 bg-white/10 hover:bg-white/20 flex items-center justify-center rounded-xl transition-all duration-300 backdrop-blur-md border border-white/20">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
            </a>
            <a href="${indeedUrl}" target="_blank" class="w-12 h-12 bg-white/10 hover:bg-white/20 flex items-center justify-center rounded-xl transition-all duration-300 backdrop-blur-md border border-white/20">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
            </a>
            <a href="${naukriUrl}" target="_blank" class="w-12 h-12 bg-white/10 hover:bg-white/20 flex items-center justify-center rounded-xl transition-all duration-300 backdrop-blur-md border border-white/20">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </a>
        </div>
    `;

    const previewHTML = `
        <div class="antialiased text-gray-900 bg-white selection:bg-blue-600 selection:text-white pb-24">
            <!-- Navigation -->
            <nav class="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-gray-100">
                <div class="container mx-auto px-6 h-20 flex justify-between items-center">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-200">
                            ${initials}
                        </div>
                        <span class="text-xl font-black tracking-tighter text-gray-900">${name}</span>
                    </div>
                    <div class="hidden md:flex items-center gap-8">
                        <a href="#about" class="text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors uppercase tracking-widest">About</a>
                        <a href="#projects" class="text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors uppercase tracking-widest">Projects</a>
                        <a href="#skills" class="text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors uppercase tracking-widest">Skills</a>
                        <a href="#contact" class="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition-all shadow-lg hover:shadow-blue-200">Contact</a>
                    </div>
                </div>
            </nav>

            <!-- Hero Section -->
            <section class="relative min-h-screen flex items-center pt-20 overflow-hidden bg-[#fafafa]">
                <div class="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[800px] h-[800px] bg-blue-100/50 rounded-full blur-[120px]"></div>
                <div class="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-red-50/50 rounded-full blur-[100px]"></div>
                
                <div class="container mx-auto px-6 relative z-10">
                    <div class="flex flex-col lg:flex-row items-center gap-16">
                        <div class="w-full lg:w-3/5 text-center lg:text-left" data-aos="fade-right">
                            <span class="inline-block px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-xs font-black uppercase tracking-widest mb-6 shadow-sm border border-blue-100/50">Available for Opportunities</span>
                            <h1 class="text-6xl md:text-8xl font-black text-gray-900 tracking-tighter leading-[1.1] mb-8">
                                I build <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800">insightful</span> data stories.
                            </h1>
                            <p class="text-xl text-gray-600 leading-relaxed max-w-2xl mb-12">
                                Student ${title} specializing in visual analytics and database design. I bridge the gap between complex datasets and actionable business intelligence.
                            </p>
                            <div class="flex flex-wrap justify-center lg:justify-start gap-4">
                                <a href="#projects" class="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200 transform hover:-translate-y-1">View My Portfolio</a>
                                <a href="#contact" class="px-10 py-5 bg-white text-gray-900 border-2 border-gray-100 rounded-2xl font-black text-lg hover:bg-gray-50 transition-all shadow-sm transform hover:-translate-y-1">Get in Touch</a>
                            </div>
                        </div>
                        <div class="w-full lg:w-2/5" data-aos="fade-left">
                            <div class="relative">
                                <div class="absolute inset-0 bg-blue-600 rounded-[4rem] rotate-6 scale-95 opacity-10"></div>
                                <img src="${profileImg}" alt="Portrait" class="relative w-full aspect-square rounded-[4rem] object-cover shadow-2xl z-10 border-8 border-white">
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- About Section -->
            <section id="about" class="py-32 bg-white">
                <div class="container mx-auto px-6">
                    <div class="flex flex-col lg:flex-row items-center gap-24">
                        <div class="w-full lg:w-1/2" data-aos="fade-up">
                            <div class="relative group">
                                <div class="absolute -inset-4 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-3xl blur-2xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
                                <img src="${aboutImg}" alt="About" class="relative rounded-3xl shadow-2xl w-full aspect-[4/3] object-cover">
                            </div>
                        </div>
                        <div class="w-full lg:w-1/2" data-aos="fade-up" data-aos-delay="200">
                            <h2 class="text-4xl font-black text-gray-900 tracking-tight mb-8">Passionate about turning raw data into strategy.</h2>
                            <p class="text-lg text-gray-600 leading-relaxed mb-10">${aboutText}</p>
                            <div class="grid grid-cols-2 gap-8 mb-12">
                                <div>
                                    <span class="block text-3xl font-black text-blue-600 mb-1 leading-none">10+</span>
                                    <span class="text-sm font-bold text-gray-500 uppercase tracking-widest">Projects Done</span>
                                </div>
                                <div>
                                    <span class="block text-3xl font-black text-blue-600 mb-1 leading-none">5+</span>
                                    <span class="text-sm font-bold text-gray-500 uppercase tracking-widest">Technologies</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Projects Section -->
            <section id="projects" class="py-32 bg-[#fafafa]">
                <div class="container mx-auto px-6">
                    <div class="flex flex-col md:flex-row justify-between items-end mb-20" data-aos="fade-up">
                        <div class="max-w-2xl">
                            <span class="text-blue-600 font-black tracking-widest uppercase text-sm mb-4 block underline decoration-4 decoration-blue-100 underline-offset-8">Featured Case Studies</span>
                            <h2 class="text-5xl font-black text-gray-900 tracking-tight">Technical Implementation Portfolio</h2>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        ${projectsHtml}
                    </div>
                </div>
            </section>

            <!-- Skills Section -->
            <section id="skills" class="py-32 bg-white text-center">
                <div class="container mx-auto px-6">
                    <div class="max-w-3xl mx-auto mb-20" data-aos="fade-up">
                        <h2 class="text-5xl font-black text-gray-900 tracking-tight mb-6">Mastered Stack & Tools</h2>
                        <p class="text-lg text-gray-600">Core technologies and methodologies I leverage to deliver professional-grade results.</p>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        ${skillsHtml}
                    </div>
                </div>
            </section>

            ${galleryHtml}

            <!-- Contact Section -->
            <section id="contact" class="py-32 bg-gray-900">
                <div class="container mx-auto px-6">
                    <div class="rounded-[4rem] bg-gradient-to-br from-blue-700 to-indigo-900 p-12 lg:p-24 text-center lg:text-left text-white relative overflow-hidden shadow-3xl shadow-blue-900/40">
                        <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                        <div class="flex flex-col lg:flex-row items-center gap-16 relative z-10">
                            <div class="w-full lg:w-1/2" data-aos="fade-right">
                                <h2 class="text-5xl lg:text-7xl font-black tracking-tighter mb-8 leading-tight">Ready to start a conversation?</h2>
                                <p class="text-xl text-blue-100 mb-12 max-w-xl">Currently optimizing for graduation. Open for contract roles and permanent placement starting ${currentYear}.</p>
                                ${socialLinks}
                            </div>
                            <div class="w-full lg:w-1/2" data-aos="fade-left">
                                <div class="bg-white/10 backdrop-blur-2xl rounded-3xl p-8 border border-white/20">
                                    <div class="space-y-6">
                                        <div class="flex items-center gap-4">
                                            <div class="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
                                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                                            </div>
                                            <div>
                                                <p class="text-sm font-bold text-blue-200 uppercase tracking-widest">Email Address</p>
                                                <p class="text-lg font-bold">${email}</p>
                                            </div>
                                        </div>
                                        <div class="flex items-center gap-4">
                                            <div class="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
                                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                                            </div>
                                            <div>
                                                <p class="text-sm font-bold text-blue-200 uppercase tracking-widest">Phone Number</p>
                                                <p class="text-lg font-bold">${phone}</p>
                                            </div>
                                        </div>
                                        <div class="flex items-center gap-4">
                                            <div class="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
                                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                            </div>
                                            <div>
                                                <p class="text-sm font-bold text-blue-200 uppercase tracking-widest">Postal Location</p>
                                                <p class="text-lg font-bold">${address}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="mt-24 flex flex-col md:flex-row justify-between items-center text-gray-400">
                        <div class="flex items-center gap-6 mb-8 md:mb-0">
                             <img id="footer-logo-premium" src="${footerLogo}" alt="Powered By" class="h-10 grayscale hover:grayscale-0 transition-all">
                        </div>
                        <p class="font-bold text-sm tracking-widest uppercase">&copy; ${currentYear} ${name}. Handcrafted with precision.</p>
                    </div>
                </div>
            </section>
        </div>
    `;

    return `
<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${name} | ${title} Portfolio</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .glass-card { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
        .shadow-3xl { box-shadow: 0 35px 60px -15px rgba(0, 0, 0, 0.3); }
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
        .animate-float { animation: float 6s ease-in-out infinite; }
    </style>
</head>
<body class="bg-white overflow-x-hidden">
    ${previewHTML}
    <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
    <script>
        AOS.init({ duration: 1000, once: true, offset: 100 });
    </script>
</body>
</html>`;
};
