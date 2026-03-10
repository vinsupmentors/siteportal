import { Link, useLocation } from 'react-router-dom';
import { BrandLogo } from '../icons/BrandLogo';
import {
    LayoutDashboard, Calendar, Users, MessageSquare, Megaphone, BookOpen, BookOpenCheck, Clock, Settings
} from 'lucide-react';

export const TrainerSidebar = ({ isOpen, setIsOpen }) => {
    const location = useLocation();

    const trainerLinks = [
        { name: 'Dashboard', path: '/trainer/dashboard', icon: LayoutDashboard },
        { name: 'Settings', path: '/trainer/settings', icon: Settings },
        { name: 'My Batches', path: '/trainer/batches', icon: Users },
        { name: 'Content Manager', path: '/trainer/content-manager', icon: BookOpenCheck },
        { name: 'Student Work', path: '/trainer/submissions', icon: BookOpenCheck },
        { name: 'My Calendar', path: '/trainer/calendar', icon: Calendar },
        { name: 'My Tasks', path: '/trainer/tasks', icon: BookOpen },
        { name: 'Announcements', path: '/trainer/announcements', icon: Megaphone },
        { name: 'Student Doubts', path: '/trainer/doubts', icon: MessageSquare },
        { name: 'Leave Requests', path: '/trainer/leaves', icon: Clock },
    ];

    return (
        <nav className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
                <BrandLogo />
                <span className="brand-text">Edutech Pro</span>
            </div>
            <div className="nav-links">
                {trainerLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = location.pathname.startsWith(link.path);
                    return (
                        <Link
                            to={link.path}
                            key={link.name}
                            className={`nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => setIsOpen(false)}
                        >
                            <Icon size={20} />
                            <span>{link.name}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};
