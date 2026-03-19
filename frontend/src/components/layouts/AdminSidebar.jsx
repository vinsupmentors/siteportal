import { Link, useLocation } from 'react-router-dom';
import { BrandLogo } from '../icons/BrandLogo';
import {
    LayoutDashboard, Users,
    ClipboardList, Megaphone, Link as LinkIcon,
    BarChart3, HelpCircle, MessageSquare, Hexagon, Calendar, Briefcase, Settings, Target, Rocket
} from 'lucide-react';

export const AdminSidebar = ({ isOpen, setIsOpen }) => {
    const location = useLocation();

    const navGroups = [
        {
            label: 'Overview',
            links: [
                { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
            ]
        },
        {
            label: 'Management',
            links: [
                { name: 'Student Hub', path: '/admin/student-hub', icon: Users },
                { name: 'Settings', path: '/admin/settings', icon: Settings },
                { name: 'Trainer Leaves', path: '/admin/trainer-leaves', icon: Calendar },
            ]
        },
        {
            label: 'Communications',
            links: [
                { name: 'Announcements', path: '/admin/announcements', icon: Megaphone },
                { name: 'Meeting Links', path: '/admin/meeting-links', icon: LinkIcon },
            ]
        },
        {
            label: 'Support Desk',
            links: [
                { name: 'Student Helpdesk', path: '/admin/student-issues', icon: HelpCircle },
                { name: 'Doubts Monitor', path: '/admin/student-doubts', icon: MessageSquare },
            ]
        },
        {
            label: 'Placements',
            links: [
                { name: 'Job Openings', path: '/admin/jobs', icon: Briefcase },
                { name: 'IOP Dashboard', path: '/admin/iop-dashboard', icon: Target },
                { name: 'IOP Students', path: '/admin/iop-students', icon: Rocket },
            ]
        },
        {
            label: 'Analytics',
            links: [
                { name: 'Reports Hub', path: '/admin/reports', icon: BarChart3 },
                { name: 'Audit Logs', path: '/admin/audit-logs', icon: ClipboardList },
            ]
        }
    ];

    return (
        <nav className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
                <BrandLogo />
                <span className="brand-text">Edutech Admin</span>
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
