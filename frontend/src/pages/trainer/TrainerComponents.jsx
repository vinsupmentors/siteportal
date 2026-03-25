// Trainer Portal — Shared Components Library
// Mirrors student portal design system with theme.js tokens

import theme from '../student/theme';
import { Loader } from 'lucide-react';

// ── Page Header ──
export const PageHeader = ({ title, subtitle, icon, accentColor = theme.accent.blue, actions }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {icon && (
                <div style={{
                    width: '48px', height: '48px', borderRadius: theme.radius.lg,
                    background: `${accentColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor,
                }}>{icon}</div>
            )}
            <div>
                <h1 style={{ fontSize: '28px', fontWeight: 800, color: theme.text.primary, margin: 0, letterSpacing: '-0.02em' }}>{title}</h1>
                {subtitle && <p style={{ fontSize: '13px', color: theme.text.muted, margin: '4px 0 0', fontWeight: 500 }}>{subtitle}</p>}
            </div>
        </div>
        {actions && <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>{actions}</div>}
    </div>
);

// ── Stat Card ──
export const StatCard = ({ label, value, icon, accentColor = theme.accent.blue, sub }) => (
    <div style={{
        background: theme.bg.card, border: `1px solid ${theme.border.subtle}`,
        borderRadius: theme.radius.lg, padding: '20px 24px',
        borderLeft: `3px solid ${accentColor}`, transition: 'all 0.2s',
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
                <p style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: theme.text.label, margin: '0 0 8px' }}>{label}</p>
                <h3 style={{ fontSize: '28px', fontWeight: 800, color: theme.text.primary, margin: 0 }}>{value}</h3>
                {sub && <p style={{ fontSize: '11px', color: theme.text.muted, margin: '4px 0 0', fontWeight: 600 }}>{sub}</p>}
            </div>
            {icon && (
                <div style={{
                    width: '40px', height: '40px', borderRadius: theme.radius.md,
                    background: `${accentColor}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor,
                }}>{icon}</div>
            )}
        </div>
    </div>
);

// ── Card ──
export const Card = ({ children, style, noPadding, accentTop }) => (
    <div style={{
        background: theme.bg.card, border: `1px solid ${theme.border.subtle}`,
        borderRadius: theme.radius.lg, padding: noPadding ? 0 : '24px',
        ...(accentTop ? { borderTop: `3px solid ${accentTop}` } : {}),
        ...style,
    }}>{children}</div>
);

// ── Filter Tabs ──
export const FilterTabs = ({ tabs, active, onChange }) => (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {tabs.map(t => (
            <button key={t.value ?? t} onClick={() => onChange(t.value ?? t)}
                style={{
                    padding: '7px 16px', borderRadius: theme.radius.full, border: 'none', cursor: 'pointer',
                    fontSize: '11px', fontWeight: 700, textTransform: 'capitalize', transition: 'all 0.2s',
                    background: (t.value ?? t) === active ? theme.accent.blue : 'rgba(255,255,255,0.04)',
                    color: (t.value ?? t) === active ? '#fff' : theme.text.muted,
                }}>
                {t.label ?? t}
            </button>
        ))}
    </div>
);

// ── Status Badge ──
export const StatusBadge = ({ status, color }) => {
    const colorMap = {
        active: theme.accent.green, completed: theme.accent.blue, pending: theme.accent.yellow,
        locked: theme.text.muted, open: theme.accent.yellow, resolved: theme.accent.green,
        assigned: theme.accent.blue, review: theme.accent.purple, complete: theme.accent.green,
        return: theme.accent.red, upcoming: theme.accent.cyan, present: theme.accent.green,
        absent: theme.accent.red, technical_class_completed: theme.accent.orange || '#f97316',
    };
    const c = color || colorMap[status?.toLowerCase()] || theme.text.muted;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '4px 12px', borderRadius: theme.radius.full, fontSize: '10px',
            fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
            background: `${c}15`, color: c, border: `1px solid ${c}25`,
        }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: c }} />
            {status}
        </span>
    );
};

// ── Action Button ──
export const ActionButton = ({ children, onClick, icon, variant = 'primary', disabled, style: sx }) => {
    const styles = {
        primary: { background: theme.accent.blue, color: '#fff', border: 'none' },
        secondary: { background: 'rgba(255,255,255,0.04)', color: theme.text.secondary, border: `1px solid ${theme.border.light}` },
        success: { background: theme.accent.green, color: '#fff', border: 'none' },
        danger: { background: `${theme.accent.red}15`, color: theme.accent.red, border: `1px solid ${theme.accent.red}30` },
    };
    return (
        <button onClick={onClick} disabled={disabled}
            style={{
                padding: '10px 20px', borderRadius: theme.radius.md, cursor: disabled ? 'not-allowed' : 'pointer',
                fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px',
                opacity: disabled ? 0.5 : 1, transition: 'all 0.2s',
                ...styles[variant], ...sx,
            }}>
            {icon}{children}
        </button>
    );
};

// ── Form Field ──
export const FormField = ({ label, children, style: sx }) => (
    <div style={{ marginBottom: '14px', ...sx }}>
        {label && <label style={{ display: 'block', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.text.label, marginBottom: '6px' }}>{label}</label>}
        {children}
    </div>
);

// ── Input Style ──
export const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: theme.radius.md,
    background: theme.bg.input, border: `1px solid ${theme.border.subtle}`,
    color: theme.text.primary, fontSize: '13px', fontWeight: 500, outline: 'none',
    transition: 'border-color 0.2s',
};

// ── Empty State ──
export const EmptyState = ({ icon, title, subtitle }) => (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
        {icon && <div style={{ width: '56px', height: '56px', borderRadius: theme.radius.lg, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: theme.text.muted }}>{icon}</div>}
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: theme.text.primary, margin: '0 0 6px' }}>{title}</h3>
        {subtitle && <p style={{ fontSize: '13px', color: theme.text.muted, margin: 0, maxWidth: '360px', marginLeft: 'auto', marginRight: 'auto' }}>{subtitle}</p>}
    </div>
);

// ── Loading Spinner ──
export const LoadingSpinner = ({ label = 'Loading...' }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '16px' }}>
        <Loader size={28} color={theme.accent.blue} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: '13px', color: theme.text.muted, fontWeight: 600 }}>{label}</p>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
);

// ── Section Title ──
export const SectionTitle = ({ children, count, actions }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: theme.text.primary, margin: 0 }}>{children}</h3>
            {count !== undefined && <span style={{ fontSize: '11px', fontWeight: 700, color: theme.accent.blue, background: `${theme.accent.blue}12`, padding: '3px 10px', borderRadius: theme.radius.full }}>{count}</span>}
        </div>
        {actions}
    </div>
);

export { default as theme } from '../student/theme';
