import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BrandLogo } from '../icons/BrandLogo';
import {
    LayoutDashboard, BookOpen, Users,
    UserCog, Clock, Star,
    Briefcase, Megaphone, Link as LinkIcon, Settings,
    BarChart3, FileText, HelpCircle, MessageSquare, Award, Rocket, Target, Layers,
    CheckSquare, UserCheck, FileCheck, Send
} from 'lucide-react';
import { superAdminAPI } from '../../services/api';

const Badge = ({ count }) => (
    <span style={{
        marginLeft: 'auto',
        minWidth: '18px', height: '18px',
        borderRadius: '9px',
        background: 'rgba(239,68,68,0.18)',
        color: '#f87171',
        fontSize: '10px', fontWeight: 800,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 5px', lineHeight: 1, flexShrink: 0,
    }}>
        {count > 99 ? '99+' : count}
    </span>
);

export const SuperAdminSidebar = ({ isOpen, setIsOpen }) => {
    const location = useLocation();
    const [counts, setCounts] = useState({});

    useEffect(() => {
        const fetch = () => superAdminAPI.getNotificationCounts()
            .then(r => setCounts(r.data))
            .catch(() => {});
        fetch();
        const timer = setInterval(fetch, 60_000);
        return () => clearInterval(timer);
    }, []);

    const navGroups = [
        {
            label: 'Overview',
            links: [
                { name: 'Dashboard', path: '/super-admin/dashboard', icon: LayoutDashboard },
                { name: 'Settings',  path: '/super-admin/settings',  icon: Settings },
            ]
        },
        {
            label: 'Curriculum',
            links: [
                { name: 'Manage Courses',             path: '/super-admin/courses',           icon: BookOpen },
                { name: 'IOP Curriculum',             path: '/super-admin/iop-curriculum',    icon: Layers },
                { name: 'Student & Batch Hub',        path: '/super-admin/student-batch-hub', icon: Users },
                { name: 'Feedback Builder',           path: '/super-admin/feedback-builder',  icon: Star },
                { name: 'Certificates & Internships', path: '/super-admin/certificates',      icon: Award },
            ]
        },
        {
            label: 'People',
            links: [
                { name: 'Manage Trainers', path: '/super-admin/trainers',       icon: UserCog },
                { name: 'Trainer Leaves',  path: '/super-admin/trainer-leaves', icon: Clock, badgeKey: 'pendingTrainerLeaves' },
            ]
        },
        {
            label: 'Operations',
            links: [
                { name: 'Trainer Tasks',       path: '/super-admin/trainer-tasks',      icon: CheckSquare,   badgeKey: 'pendingTasks' },
                { name: 'Trainers KRA',        path: '/super-admin/trainers-kra',       icon: FileText },
                { name: 'Trainer Attendance',  path: '/super-admin/trainer-attendance', icon: UserCheck },
                { name: 'Portfolio Approvals', path: '/super-admin/portfolios',         icon: FileCheck,     badgeKey: 'pendingPortfolios' },
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
                { name: 'Student Helpdesk', path: '/super-admin/student-issues', icon: HelpCircle,    badgeKey: 'unresolvedIssues' },
                { name: 'Doubts Monitor',   path: '/super-admin/student-doubts', icon: MessageSquare, badgeKey: 'unresolvedDoubts' },
            ]
        },
        {
            label: 'IOP Program',
            links: [
                { name: 'IOP Groups',    path: '/super-admin/iop-groups',    icon: Layers },
                { name: 'IOP Dashboard', path: '/super-admin/iop-dashboard', icon: Target },
                { name: 'IOP Students',  path: '/super-admin/iop-students',  icon: Rocket },
            ]
        },
        {
            label: 'Placements',
            links: [
                { name: 'Job Requests',  path: '/super-admin/job-requests',  icon: Send,      badgeKey: 'pendingJobRequests' },
                { name: 'Job Openings',  path: '/super-admin/jobs',          icon: Briefcase },
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
                <span className="brand-text">Vinsup Skill Academy</span>
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
                            const badgeCount = link.badgeKey ? (counts[link.badgeKey] || 0) : 0;
                            return (
                                <Link
                                    to={link.path}
                                    key={link.name}
                                    className={`nav-item ${isActive ? 'active' : ''}`}
                                    onClick={() => setIsOpen(false)}
                                >
                                    <Icon size={18} />
                                    <span>{link.name}</span>
                                    {badgeCount > 0 && <Badge count={badgeCount} />}
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </div>
        </nav>
    );
};
