import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { StudentSidebar } from './StudentSidebar';
import { SuperAdminSidebar } from './SuperAdminSidebar';
import { TrainerSidebar } from './TrainerSidebar';
import { AdminSidebar } from './AdminSidebar';
import { RecruiterSidebar } from './RecruiterSidebar';
import { IOPTrainerSidebar } from './IOPTrainerSidebar';
import { AnnouncementPopup } from '../shared/AnnouncementPopup';
import { userAPI } from '../../services/api';

// Generic layout wrapper isolating routing logic
export const AppLayout = ({ role }) => {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [profileName, setProfileName] = useState('');

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const res = await userAPI.getProfile();
                setProfileName(`${res.data.user.first_name} ${res.data.user.last_name}`);
            } catch (err) {
                console.error("Layout couldn't fetch profile for header", err);
            }
        };
        loadProfile();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
    };

    return (
        <div className="app-container">
            <AnnouncementPopup />

            {/* Mobile Sidebar Overlay */}
            <div
                className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
                onClick={() => setIsSidebarOpen(false)}
            />

            {/* Dynamic sidebar switch based on exact role injection */}
            {role === 'student' && <StudentSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />}
            {role === 'superadmin' && <SuperAdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />}
            {role === 'admin' && <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />}
            {role === 'trainer' && <TrainerSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />}
            {role === 'recruiter' && <RecruiterSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />}
            {role === 'ioptrainer' && <IOPTrainerSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />}

            <main className="main-content">
                <header className="top-header">
                    <div className="flex align-items-center gap-3">
                        <button
                            className="mobile-menu-btn"
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <Menu size={24} />
                        </button>
                        <div className="search-bar">
                            {/* Contextual top controls */}
                        </div>
                    </div>
                    <div className="user-controls flex align-items-center gap-4">
                        {profileName && (
                            <div className="text-sm font-medium pr-2">
                                {profileName}
                            </div>
                        )}
                        <div className="text-secondary text-sm flex items-center gap-2">
                            <span>Role:</span>
                            <span className="font-medium text-main" style={{ textTransform: 'capitalize' }}>{role}</span>
                        </div>
                        <button
                            className="btn btn-secondary text-sm ml-2"
                            onClick={handleLogout}
                        >
                            Logout
                        </button>
                    </div>
                </header>
                <div className="page-container">
                    {/* Inherited Router Views */}
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
