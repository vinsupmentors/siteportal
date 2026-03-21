import { Link, useLocation } from 'react-router-dom';
import { BrandLogo } from '../icons/BrandLogo';
import {
    LayoutDashboard, Calendar, FileText, Layers,
    BookOpen, CalendarOff, MessageSquare, Star,
    HelpCircle, Bell, TrendingUp, Briefcase, Settings, GraduationCap
} from 'lucide-react';

export const StudentSidebar = ({ isOpen, setIsOpen }) => {
    const location = useLocation();

    // Exactly maps to the mandatory 11 Student endpoints in the spec
    const studentLinks = [
        { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
        { name: 'Settings', path: '/student/settings', icon: Settings },
        { name: 'My Calendar', path: '/student/calendar', icon: Calendar },
        { name: 'Tests', path: '/student/tests', icon: FileText },
        { name: 'Soft Skills & Aptitude', path: '/student/worksheets', icon: Layers },
        { name: 'Course Materials', path: '/student/materials', icon: BookOpen },
        { name: 'Leave Requests', path: '/student/leaves', icon: CalendarOff },
        { name: 'Doubts/Queries', path: '/student/doubts', icon: MessageSquare },
        { name: 'Help & Support', path: '/student/issues', icon: HelpCircle },
        { name: 'Feedback', path: '/student/feedback', icon: Star },
        { name: 'Notifications', path: '/student/notifications', icon: Bell },
        { name: 'My Progress', path: '/student/progress', icon: TrendingUp },
        { name: 'Certificates', path: '/student/certificates', icon: GraduationCap },
        { name: 'Portfolio Gen', path: '/student/portfolio', icon: Briefcase },
        { name: 'Job Portal', path: '/student/job-portal', icon: Briefcase }
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
