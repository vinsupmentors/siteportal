import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BrandLogo } from '../icons/BrandLogo';
import {
    LayoutDashboard, Calendar, FileText, Layers,
    BookOpen, CalendarOff, MessageSquare, Star,
    HelpCircle, Bell, TrendingUp, Briefcase, Settings, GraduationCap
} from 'lucide-react';
import { studentAPI } from '../../services/api';

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

export const StudentSidebar = ({ isOpen, setIsOpen }) => {
    const location = useLocation();
    const [counts, setCounts] = useState({});

    useEffect(() => {
        const fetch = () => studentAPI.getNotificationCounts()
            .then(r => setCounts(r.data))
            .catch(() => {});
        fetch();
        const timer = setInterval(fetch, 60_000);
        return () => clearInterval(timer);
    }, []);

    const studentLinks = [
        { name: 'Dashboard',             path: '/student/dashboard',    icon: LayoutDashboard },
        { name: 'Settings',              path: '/student/settings',     icon: Settings },
        { name: 'My Calendar',           path: '/student/calendar',     icon: Calendar },
        { name: 'Tests',                 path: '/student/tests',        icon: FileText },
        { name: 'Soft Skills & Aptitude', path: '/student/worksheets',  icon: Layers },
        { name: 'Course Materials',      path: '/student/materials',    icon: BookOpen },
        { name: 'Leave Requests',        path: '/student/leaves',       icon: CalendarOff,   badgeKey: 'pendingLeaves' },
        { name: 'Doubts/Queries',        path: '/student/doubts',       icon: MessageSquare, badgeKey: 'unresolvedDoubts' },
        { name: 'Help & Support',        path: '/student/issues',       icon: HelpCircle,    badgeKey: 'openIssues' },
        { name: 'Feedback',              path: '/student/feedback',     icon: Star },
        { name: 'Notifications',         path: '/student/notifications', icon: Bell },
        { name: 'My Progress',           path: '/student/progress',     icon: TrendingUp },
        { name: 'Certificates',          path: '/student/certificates', icon: GraduationCap },
        { name: 'Portfolio Gen',         path: '/student/portfolio',    icon: Briefcase },
        { name: 'Job Portal',            path: '/student/job-portal',   icon: Briefcase },
    ];

    return (
        <nav className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
                <BrandLogo />
                <span className="brand-text">Edutech Pro</span>
            </div>
            <div className="nav-links">
                {studentLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = location.pathname.startsWith(link.path);
                    const badgeCount = link.badgeKey ? (counts[link.badgeKey] || 0) : 0;
                    return (
                        <Link
                            to={link.path}
                            key={link.name}
                            className={`nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => setIsOpen(false)}
                        >
                            <Icon size={20} />
                            <span>{link.name}</span>
                            {badgeCount > 0 && <Badge count={badgeCount} />}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};
