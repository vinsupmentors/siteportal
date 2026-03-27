import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BrandLogo } from '../icons/BrandLogo';
import {
    LayoutDashboard, Calendar, Users, MessageSquare, Megaphone, Clock, Settings,
    FolderOpen, ClipboardCheck, CheckSquare, BarChart3
} from 'lucide-react';
import { trainerAPI } from '../../services/api';

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

export const TrainerSidebar = ({ isOpen, setIsOpen }) => {
    const location = useLocation();
    const [counts, setCounts] = useState({});

    useEffect(() => {
        const fetch = () => trainerAPI.getNotificationCounts()
            .then(r => setCounts(r.data))
            .catch(() => {});
        fetch();
        const timer = setInterval(fetch, 60_000);
        return () => clearInterval(timer);
    }, []);

    const trainerLinks = [
        { name: 'Dashboard',       path: '/trainer/dashboard',     icon: LayoutDashboard },
        { name: 'Settings',        path: '/trainer/settings',      icon: Settings },
        { name: 'My Batches',      path: '/trainer/batches',       icon: Users },
        { name: 'Content Manager', path: '/trainer/content-manager', icon: FolderOpen },
        { name: 'Student Work',    path: '/trainer/submissions',   icon: ClipboardCheck, badgeKey: 'ungradedSubmissions' },
        { name: 'My Calendar',     path: '/trainer/calendar',      icon: Calendar },
        { name: 'My Tasks',        path: '/trainer/tasks',         icon: CheckSquare,   badgeKey: 'pendingTasks' },
        { name: 'Announcements',   path: '/trainer/announcements', icon: Megaphone },
        { name: 'Student Doubts',  path: '/trainer/doubts',        icon: MessageSquare, badgeKey: 'pendingDoubts' },
        { name: 'Leave Requests',  path: '/trainer/leaves',        icon: Clock,         badgeKey: 'pendingStudentLeaves' },
        { name: 'My Reports',      path: '/trainer/reports',       icon: BarChart3 },
    ];

    return (
        <nav className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
                <BrandLogo />
                <span className="brand-text">Vinsup Skill Academy</span>
            </div>
            <div className="nav-links">
                {trainerLinks.map((link) => {
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
