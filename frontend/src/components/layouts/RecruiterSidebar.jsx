import { Link, useLocation } from 'react-router-dom';
import { BrandLogo } from '../icons/BrandLogo';
import { LayoutDashboard, Briefcase, Settings, Users } from 'lucide-react';

export const RecruiterSidebar = ({ isOpen, setIsOpen }) => {
    const location = useLocation();

    const navGroups = [
        {
            label: 'Jobs Central',
            links: [
                { name: 'Dashboard', path: '/recruiter/dashboard', icon: LayoutDashboard },
                { name: 'IOP Students', path: '/recruiter/students', icon: Users },
                { name: 'Job Postings', path: '/recruiter/jobs', icon: Briefcase },
            ]
        },
        {
            label: 'Account',
            links: [
                { name: 'Settings', path: '/recruiter/change-password', icon: Settings },
            ]
        }
    ];

    return (
        <nav className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
                <BrandLogo />
                <span className="brand-text">Placement Hub</span>
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
