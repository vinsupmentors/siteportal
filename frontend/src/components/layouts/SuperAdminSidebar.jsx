import { Link, useLocation } from 'react-router-dom';
import { BrandLogo } from '../icons/BrandLogo';
import {
    LayoutDashboard, Calendar, BookOpen, Users,
    GraduationCap, UserCog, ClipboardList, Clock,
    Briefcase, Megaphone, Link as LinkIcon, Settings,
    BarChart3, FileText, HelpCircle, MessageSquare, Award, Rocket, Target
} from 'lucide-react';

export const SuperAdminSidebar = ({ isOpen, setIsOpen }) => {
    const location = useLocation();

    const navGroups = [
        {
            label: 'Overview',
            links: [
                { name: 'Dashboard', path: '/super-admin/dashboard', icon: LayoutDashboard },
                { name: 'Settings', path: '/super-admin/settings', icon: Settings },
            ]
        },
        {
            label: 'Curriculum',
            links: [
                { name: 'Manage Courses', path: '/super-admin/courses', icon: BookOpen },
                { name: 'Student & Batch Hub', path: '/super-admin/student-batch-hub', icon: Users },
                { name: 'Feedback Builder', path: '/super-admin/feedback-builder', icon: ClipboardList },
                { name: 'Certificates & Internships', path: '/super-admin/certificates', icon: Award },
            ]
        },
        {
            label: 'People',
            links: [
                { name: 'Manage Trainers', path: '/super-admin/trainers', icon: UserCog },
                { name: 'Trainer Leaves', path: '/super-admin/trainer-leaves', icon: Clock },
            ]
        },
        {
            label: 'Operations',
            links: [
                { name: 'Trainer Tasks', path: '/super-admin/trainer-tasks', icon: ClipboardList },
                { name: 'Trainers KRA', path: '/super-admin/trainers-kra', icon: FileText },
                { name: 'Trainer Attendance', path: '/super-admin/trainer-attendance', icon: Clock },
                { name: 'Portfolio Approvals', path: '/super-admin/portfolios', icon: Briefcase },
            ]
        },
        {
            label: 'Communications',
            links: [
                { name: 'Announcements', path: '/super-admin/announcements', icon: Megaphone },
                { name: 'Meeting Links', path: '/super-admin/meeting-links', icon: LinkIcon },
            ]
        },
        {
            label: 'Queries & Escalations',
            links: [
                { name: 'Student Helpdesk', path: '/super-admin/student-issues', icon: HelpCircle },
                { name: 'Doubts Monitor', path: '/super-admin/student-doubts', icon: MessageSquare },
            ]
        },
        {
            label: 'Placements',
            links: [
                { name: 'Job Requests', path: '/super-admin/job-requests', icon: Briefcase },
                { name: 'Job Openings', path: '/super-admin/jobs', icon: Briefcase },
                { name: 'IOP Dashboard', path: '/super-admin/iop-dashboard', icon: Target },
                { name: 'IOP Students', path: '/super-admin/iop-students', icon: Rocket },
            ]
        },
        {
            label: 'Analytics',
            links: [
                { name: 'Reports', path: '/super-admin/reports', icon: BarChart3 },
            ]
        }
    ];

    return (
        <nav className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
                <BrandLogo />
                <span className="brand-text">Edutech Pro</span>
            </div>
            <div className="nav-links">
                {navGroups.map((group) => (
                    <div key={group.label} style={{ marginBottom: '0.75rem' }}>
                        <div style={{
                            fontSize: '0.7rem',
                            textTransform: 'uppercase',
                            letterSpacing: '1.2px',
                            color: 'var(--text-muted)',
                            padding: '0.5rem 1rem 0.25rem',
                            fontWeight: 600
                        }}>
                            {group.label}
                        </div>
                        {group.links.map((link) => {
                            const Icon = link.icon;
                            const isActive = location.pathname === link.path;
                            return (
                                <Link
                                    to={link.path}
                                    key={link.name}
                                    className={`nav-item ${isActive ? 'active' : ''}`}
                                    onClick={() => setIsOpen(false)}
                                >
                                    <Icon size={18} />
                                    <span>{link.name}</span>
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </div>
        </nav>
    );
};
