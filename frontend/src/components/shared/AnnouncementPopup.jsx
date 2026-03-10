import { useState, useEffect } from 'react';
import { authAPI } from '../../services/api';
import { Megaphone, CheckCircle } from 'lucide-react';

export const AnnouncementPopup = () => {
    const [announcement, setAnnouncement] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        // Fetch on mount
        const fetchUnread = async () => {
            try {
                const res = await authAPI.getUnacknowledgedAnnouncement();
                if (res.data.announcement) {
                    setAnnouncement(res.data.announcement);
                }
            } catch (err) {
                console.error("Failed to check announcements", err);
            }
        };

        fetchUnread();
    }, []);

    const handleAcknowledge = async () => {
        setSubmitting(true);
        try {
            await authAPI.acknowledgeAnnouncement(announcement.id);
            setAnnouncement(null);
        } catch (err) {
            console.error("Failed to acknowledge", err);
            alert("Failed to acknowledge announcement. Please try again.");
            setSubmitting(false);
        }
    };

    if (!announcement) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999 // Needs to be above everything else
        }}>
            <div className="glass-card fade-in" style={{
                maxWidth: '500px',
                width: '90%',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                border: '1px solid rgba(var(--primary-rgb), 0.3)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                    <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', color: '#ef4444' }}>
                        <Megaphone size={24} />
                    </div>
                    <div>
                        <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Important Announcement</span>
                        <h2 style={{ fontSize: '1.25rem', marginTop: '2px' }}>{announcement.title}</h2>
                    </div>
                </div>

                <div style={{
                    maxHeight: '40vh',
                    overflowY: 'auto',
                    color: 'var(--text-main)',
                    lineHeight: '1.6',
                    fontSize: '1rem',
                    whiteSpace: 'pre-wrap'
                }}>
                    {announcement.message}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                    <button
                        onClick={handleAcknowledge}
                        disabled={submitting}
                        style={{
                            padding: '12px 24px',
                            borderRadius: '8px',
                            background: 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            fontWeight: 600,
                            cursor: submitting ? 'not-allowed' : 'pointer',
                            opacity: submitting ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 15px rgba(var(--primary-rgb), 0.3)'
                        }}
                    >
                        <CheckCircle size={18} />
                        {submitting ? 'Acknowledging...' : 'I Acknowledge'}
                    </button>
                </div>
            </div>
        </div>
    );
};
