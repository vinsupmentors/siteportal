import React, { useState, useEffect } from 'react';
import theme from './theme';

// Reusable Card wrapper
const Card = ({ children, style = {} }) => (
  <div
    style={{
      background: theme.bg.card,
      border: `1px solid ${theme.border.subtle}`,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      boxShadow: theme.shadow.card,
      ...style,
    }}
  >
    {children}
  </div>
);

// Stat card with colored left accent
const StatCard = ({ icon, label, value, sub, accentColor }) => (
  <div
    style={{
      background: theme.bg.card,
      border: `1px solid ${theme.border.subtle}`,
      borderLeft: `4px solid ${accentColor}`,
      borderRadius: theme.radius.md,
      padding: '20px 24px',
      flex: 1,
      minWidth: '180px',
      boxShadow: theme.shadow.card,
    }}
  >
    <div style={{ fontSize: theme.font.size.xs, color: theme.text.label, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: theme.font.weight.semibold }}>
      {label}
    </div>
    <div style={{ fontSize: theme.font.size.xl, fontWeight: theme.font.weight.bold, color: theme.text.primary }}>
      {value}
    </div>
    {sub && (
      <div style={{ fontSize: theme.font.size.sm, color: theme.text.muted, marginTop: '4px' }}>{sub}</div>
    )}
    <div
      style={{
        marginTop: '14px',
        height: '4px',
        borderRadius: '2px',
        background: `linear-gradient(90deg, ${accentColor}, ${accentColor}44)`,
        opacity: 0.6,
      }}
    />
  </div>
);

const StudentDashboard = () => {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/student/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setStudentData(data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Fallback data for render
  const student = studentData?.student || {};
  const stats = studentData?.stats || {};

  const styles = {
    greeting: {
      fontSize: theme.font.size.sm,
      color: theme.text.secondary,
      marginBottom: '4px',
    },
    name: {
      fontSize: '42px',
      fontWeight: theme.font.weight.bold,
      color: theme.text.primary,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    wave: {
      display: 'inline-block',
      fontSize: '36px',
      animation: 'wave 2s infinite',
    },
    batchTag: {
      fontSize: theme.font.size.base,
      color: theme.text.secondary,
      marginTop: '4px',
    },
    quickActions: {
      display: 'flex',
      gap: '12px',
    },
    actionBtn: (bg) => ({
      padding: '14px 28px',
      background: bg,
      color: '#ffffff',
      border: 'none',
      borderRadius: theme.radius.md,
      fontSize: theme.font.size.base,
      fontWeight: theme.font.weight.semibold,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }),
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '32px',
    },
    statsRow: {
      display: 'flex',
      gap: '16px',
      flexWrap: 'wrap',
      marginBottom: '28px',
    },
    infoGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px',
      marginBottom: '28px',
    },
    infoItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '14px 18px',
      background: 'rgba(255,255,255,0.02)',
      borderRadius: theme.radius.sm,
      border: `1px solid ${theme.border.subtle}`,
    },
    infoIcon: {
      color: theme.accent.blue,
      opacity: 0.7,
    },
    infoLabel: {
      fontSize: theme.font.size.xs,
      color: theme.text.label,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      fontWeight: theme.font.weight.semibold,
    },
    infoValue: {
      fontSize: theme.font.size.base,
      color: theme.text.primary,
      fontWeight: theme.font.weight.medium,
    },
    sectionTitle: {
      fontSize: theme.font.size.lg,
      fontWeight: theme.font.weight.bold,
      color: theme.text.primary,
      marginBottom: '16px',
    },
    riskBadge: (level) => ({
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 14px',
      borderRadius: theme.radius.full,
      fontSize: theme.font.size.xs,
      fontWeight: theme.font.weight.bold,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      background:
        level === 'AT RISK'
          ? 'rgba(239, 68, 68, 0.15)'
          : level === 'ON TRACK'
          ? 'rgba(16, 185, 129, 0.15)'
          : 'rgba(245, 158, 11, 0.15)',
      color:
        level === 'AT RISK'
          ? theme.accent.red
          : level === 'ON TRACK'
          ? theme.accent.green
          : theme.accent.yellow,
    }),
    metricsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '16px',
    },
    metricCard: {
      textAlign: 'center',
      padding: '20px',
      background: 'rgba(255,255,255,0.02)',
      borderRadius: theme.radius.md,
      border: `1px solid ${theme.border.subtle}`,
    },
    metricValue: {
      fontSize: theme.font.size.xl,
      fontWeight: theme.font.weight.bold,
      color: theme.text.primary,
    },
    metricLabel: {
      fontSize: theme.font.size.xs,
      color: theme.text.label,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginTop: '6px',
      fontWeight: theme.font.weight.semibold,
    },
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ color: theme.text.secondary, fontSize: theme.font.size.md }}>Loading dashboard...</div>
      </div>
    );
  }

  const riskLevel = (stats.attendance || 0) < 50 ? 'AT RISK' : (stats.attendance || 0) < 75 ? 'MODERATE' : 'ON TRACK';

  return (
    <div>
      {/* Header: Greeting + Quick Actions */}
      <div style={styles.header}>
        <div>
          <div style={styles.greeting}>{getGreeting()},</div>
          <div style={styles.name}>
            {student.name || 'Student'}!
            <span style={styles.wave}>👋</span>
          </div>
          <div style={styles.batchTag}>
            <strong>{student.batch_name || 'Batch'}</strong> · {student.course_name || 'Course'}
          </div>
        </div>
        <div style={styles.quickActions}>
          <button
            style={styles.actionBtn(theme.bg.card)}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /></svg>
            Schedule
          </button>
          <button
            style={styles.actionBtn(theme.gradient.blue)}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" /></svg>
            Start Learning
          </button>
        </div>
      </div>

      {/* Enrollment Info Grid */}
      <Card style={{ marginBottom: '28px' }}>
        <div style={styles.infoGrid}>
          <div style={styles.infoItem}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.accent.purple} strokeWidth="2" style={styles.infoIcon}>
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
            <div>
              <div style={styles.infoLabel}>Batch</div>
              <div style={styles.infoValue}>{student.batch_name || '—'}</div>
            </div>
          </div>
          <div style={styles.infoItem}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.accent.cyan} strokeWidth="2" style={styles.infoIcon}>
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
            <div>
              <div style={styles.infoLabel}>Course</div>
              <div style={styles.infoValue}>{student.course_name || '—'}</div>
            </div>
          </div>
          <div style={styles.infoItem}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.accent.yellow} strokeWidth="2" style={styles.infoIcon}>
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            <div>
              <div style={styles.infoLabel}>Schedule</div>
              <div style={styles.infoValue}>{student.schedule_type || 'weekday'} · {student.schedule_time || 'morning'}</div>
            </div>
          </div>
          <div style={styles.infoItem}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.accent.green} strokeWidth="2" style={styles.infoIcon}>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            <div>
              <div style={styles.infoLabel}>Mode</div>
              <div style={styles.infoValue}>{student.mode || 'Offline'}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Risk Status + Key Stats */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '28px' }}>
        <span style={styles.riskBadge(riskLevel)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {riskLevel}
        </span>
      </div>

      {/* Stat Cards Row */}
      <div style={styles.statsRow}>
        <StatCard
          label="Attendance"
          value={`${stats.attendance || 0}%`}
          accentColor={theme.accent.cyan}
        />
        <StatCard
          label="Loyalty Points"
          value={stats.loyalty_points || 0}
          sub="★★★★★"
          accentColor={theme.accent.yellow}
        />
        <StatCard
          label="Test Average"
          value={stats.test_avg || 'NO TESTS'}
          accentColor={theme.accent.purple}
        />
        <StatCard
          label="Projects Done"
          value={stats.projects_done ?? 'NOT STARTED'}
          accentColor={theme.accent.green}
        />
      </div>

      {/* Bottom Section: Upcoming + Recent */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Upcoming Classes */}
        <Card>
          <div style={styles.sectionTitle}>📅 Upcoming Classes</div>
          {(stats.upcoming_classes || []).length === 0 ? (
            <div style={{ color: theme.text.muted, fontSize: theme.font.size.sm, padding: '20px 0', textAlign: 'center' }}>
              No upcoming classes today
            </div>
          ) : (
            (stats.upcoming_classes || []).map((cls, i) => (
              <div
                key={i}
                style={{
                  padding: '12px 0',
                  borderBottom: i < (stats.upcoming_classes || []).length - 1 ? `1px solid ${theme.border.subtle}` : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: theme.font.size.base, color: theme.text.primary, fontWeight: theme.font.weight.medium }}>{cls.topic}</div>
                  <div style={{ fontSize: theme.font.size.sm, color: theme.text.muted }}>{cls.trainer}</div>
                </div>
                <div style={{ fontSize: theme.font.size.sm, color: theme.accent.blue }}>{cls.time}</div>
              </div>
            ))
          )}
        </Card>

        {/* Recent Announcements */}
        <Card>
          <div style={styles.sectionTitle}>📢 Recent Announcements</div>
          {(stats.announcements || []).length === 0 ? (
            <div style={{ color: theme.text.muted, fontSize: theme.font.size.sm, padding: '20px 0', textAlign: 'center' }}>
              No new announcements
            </div>
          ) : (
            (stats.announcements || []).map((ann, i) => (
              <div
                key={i}
                style={{
                  padding: '12px 0',
                  borderBottom: i < (stats.announcements || []).length - 1 ? `1px solid ${theme.border.subtle}` : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ fontSize: theme.font.size.base, color: theme.text.primary, fontWeight: theme.font.weight.semibold }}>{ann.title}</div>
                  <div style={{ fontSize: theme.font.size.xs, color: theme.text.muted }}>{ann.date}</div>
                </div>
                <div style={{ fontSize: theme.font.size.sm, color: theme.text.secondary }}>{ann.message}</div>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
};

export { StudentDashboard };
export default StudentDashboard;
