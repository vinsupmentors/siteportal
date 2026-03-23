import { Link, useLocation } from 'react-router-dom';
import { BrandLogo } from '../icons/BrandLogo';
import {
    LayoutDashboard, Layers, Settings,
} from 'lucide-react';

export const IOPTrainerSidebar = ({ isOpen, setIsOpen }) => {
    const location = useLocation();

    const links = [
        { name: 'Dashboard', path: '/iop-trainer/dashboard', icon: LayoutDashboard },
        { name: 'My Groups',  path: '/iop-trainer/groups',   icon: Layers },
        { name: 'Settings',  path: '/iop-trainer/settings',  icon: Settings },
    ];

    return (
        <nav className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
                <BrandLogo />
                <span className="brand-text">Edutech Pro</span>
            </div>
            <div style={{
                fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1.4px',
                color: 'var(--text-muted)', padding: '0.75rem 1rem 0.25rem', fontWeight: 700,
            }}>
                IOP Trainer
            </div>
            <div className="nav-links">
                {links.map((link) => {
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
