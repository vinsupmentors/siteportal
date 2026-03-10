import React from 'react';
import theme from './theme';

/* ═══════════════════════════════════════════════════════════
   SHARED STUDENT PORTAL COMPONENTS
   Unified dark-theme component library for all student pages
   ═══════════════════════════════════════════════════════════ */

// ─── Loading Spinner ────────────────────────────────────────
export const LoadingSpinner = ({ label = 'Loading...' }) => (
    <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '60vh', gap: '16px',
    }}>
        <div style={{
            width: '44px', height: '44px',
            border: `3px solid ${theme.border.subtle}`,
            borderTop: `3px solid ${theme.accent.blue}`,
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
        }} />
        <span style={{ color: theme.text.muted, fontSize: theme.font.size.sm }}>{label}</span>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
);

// ─── Page Header ────────────────────────────────────────────
export const PageHeader = ({ title, subtitle, accentColor, icon, action }) => (
    <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: '28px', flexWrap: 'wrap', gap: '16px',
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {icon && (
                <div style={{
                    width: '48px', height: '48px',
                    background: `${accentColor || theme.accent.blue}15`,
                    border: `1px solid ${accentColor || theme.accent.blue}30`,
                    borderRadius: theme.radius.lg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: accentColor || theme.accent.blue, flexShrink: 0,
                }}>
                    {icon}
                </div>
            )}
            <div>
                <h2 style={{
                    fontSize: '26px', fontWeight: 800, color: theme.text.primary,
                    letterSpacing: '-0.02em', margin: 0,
                    background: 'none', WebkitBackgroundClip: 'unset',
                    WebkitTextFillColor: 'unset',
                }}>
                    {title}
                </h2>
                {subtitle && (
                    <p style={{
                        fontSize: theme.font.size.sm, color: theme.text.muted,
                        marginTop: '4px',
                    }}>
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
        {action && action}
    </div>
);

// ─── Stat Card ──────────────────────────────────────────────
export const StatCard = ({ icon, label, value, accentColor, sub }) => (
    <div style={{
        background: theme.bg.card,
        border: `1px solid ${theme.border.subtle}`,
        borderRadius: theme.radius.lg,
        padding: '22px 24px',
        flex: 1, minWidth: '160px',
        boxShadow: theme.shadow.card,
        display: 'flex', alignItems: 'center', gap: '16px',
        transition: 'transform 0.2s, box-shadow 0.2s',
    }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = theme.shadow.cardHover; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = theme.shadow.card; }}
    >
        {icon && (
            <div style={{
                width: '48px', height: '48px', borderRadius: theme.radius.md,
                background: `${accentColor}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: accentColor, flexShrink: 0,
            }}>
                {icon}
            </div>
        )}
        <div>
            <div style={{
                fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.1em', color: theme.text.label, marginBottom: '4px',
            }}>
                {label}
            </div>
            <div style={{
                fontSize: '28px', fontWeight: 800, color: theme.text.primary, lineHeight: 1,
            }}>
                {value}
            </div>
            {sub && (
                <div style={{ fontSize: '11px', color: theme.text.muted, marginTop: '4px' }}>{sub}</div>
            )}
        </div>
    </div>
);

// ─── Card ───────────────────────────────────────────────────
export const Card = ({ children, style = {}, hoverable = false, noPadding = false }) => {
    const [hovered, setHovered] = React.useState(false);
    return (
        <div
            style={{
                background: theme.bg.card,
                border: `1px solid ${hovered && hoverable ? theme.border.light : theme.border.subtle}`,
                borderRadius: theme.radius.lg,
                padding: noPadding ? 0 : theme.spacing.lg,
                boxShadow: hovered && hoverable ? theme.shadow.cardHover : theme.shadow.card,
                transition: 'all 0.25s ease',
                transform: hovered && hoverable ? 'translateY(-2px)' : 'none',
                ...style,
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {children}
        </div>
    );
};

// ─── Filter Tabs ────────────────────────────────────────────
export const FilterTabs = ({ filters, active, onChange, accentColor }) => {
    const accent = accentColor || theme.accent.blue;
    return (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {filters.map(f => {
                const key = typeof f === 'string' ? f.toLowerCase() : f.key;
                const label = typeof f === 'string' ? f : f.label;
                const isActive = active === key;
                return (
                    <button
                        key={key}
                        onClick={() => onChange(key)}
                        style={{
                            padding: '7px 18px',
                            borderRadius: theme.radius.full,
                            fontSize: '12px', fontWeight: 700,
                            letterSpacing: '0.03em',
                            background: isActive ? accent : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${isActive ? accent : 'rgba(255,255,255,0.08)'}`,
                            color: isActive ? '#fff' : theme.text.muted,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = theme.text.primary; } }}
                        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = theme.text.muted; } }}
                    >
                        {label}
                    </button>
                );
            })}
        </div>
    );
};

// ─── Status Badge ───────────────────────────────────────────
export const StatusBadge = ({ status, config }) => {
    const c = config || STATUS_PRESETS[status] || STATUS_PRESETS.default;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '5px 14px', borderRadius: theme.radius.full,
            fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.08em',
            background: `${c.color}18`,
            color: c.color,
        }}>
            <span style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: c.color, flexShrink: 0,
            }} />
            {c.label || status}
        </span>
    );
};

export const STATUS_PRESETS = {
    approved: { label: 'Approved', color: theme.accent.green },
    rejected: { label: 'Rejected', color: theme.accent.red },
    pending: { label: 'Pending', color: theme.accent.yellow },
    open: { label: 'Open', color: theme.accent.yellow },
    in_progress: { label: 'In Progress', color: theme.accent.blue },
    resolved: { label: 'Resolved', color: theme.accent.green },
    completed: { label: 'Completed', color: theme.accent.green },
    active: { label: 'Active', color: theme.accent.blue },
    locked: { label: 'Locked', color: theme.text.muted },
    passed: { label: 'Passed', color: theme.accent.green },
    failed: { label: 'Failed', color: theme.accent.red },
    default: { label: 'Unknown', color: theme.text.muted },
};

// ─── Empty State ────────────────────────────────────────────
export const EmptyState = ({ icon, title, message, action }) => (
    <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '64px 24px', textAlign: 'center',
        background: theme.bg.card, borderRadius: theme.radius.lg,
        border: `1px solid ${theme.border.subtle}`,
    }}>
        {icon && (
            <div style={{
                width: '72px', height: '72px', borderRadius: theme.radius.lg,
                background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '20px', color: theme.accent.blue,
            }}>
                {icon}
            </div>
        )}
        <h4 style={{
            fontSize: theme.font.size.md, fontWeight: 700, color: theme.text.primary,
            marginBottom: '8px',
        }}>
            {title}
        </h4>
        <p style={{
            fontSize: theme.font.size.sm, color: theme.text.muted,
            maxWidth: '320px', lineHeight: 1.6,
        }}>
            {message}
        </p>
        {action && <div style={{ marginTop: '20px' }}>{action}</div>}
    </div>
);

// ─── Action Button ──────────────────────────────────────────
export const ActionButton = ({
    children, onClick, variant = 'primary', icon, disabled = false, style = {},
}) => {
    const variants = {
        primary: {
            background: theme.gradient.blue, color: '#fff',
            border: 'none', boxShadow: `0 4px 14px rgba(59,130,246,0.25)`,
        },
        secondary: {
            background: 'rgba(255,255,255,0.06)', color: theme.text.primary,
            border: `1px solid ${theme.border.light}`, boxShadow: 'none',
        },
        success: {
            background: theme.gradient.green, color: '#fff',
            border: 'none', boxShadow: `0 4px 14px rgba(16,185,129,0.25)`,
        },
        danger: {
            background: theme.gradient.red, color: '#fff',
            border: 'none', boxShadow: `0 4px 14px rgba(239,68,68,0.25)`,
        },
    };
    const v = variants[variant] || variants.primary;
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                gap: '8px', padding: '10px 22px', borderRadius: theme.radius.md,
                fontSize: theme.font.size.sm, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s', opacity: disabled ? 0.5 : 1,
                whiteSpace: 'nowrap', ...v, ...style,
            }}
            onMouseEnter={e => { if (!disabled) e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
            {icon}{children}
        </button>
    );
};

// ─── Form Field ─────────────────────────────────────────────
export const FormField = ({ label, children, required }) => (
    <div style={{ marginBottom: '16px' }}>
        <label style={{
            display: 'block', fontSize: '10px', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            color: theme.text.label, marginBottom: '8px',
        }}>
            {label}{required && <span style={{ color: theme.accent.red, marginLeft: '4px' }}>*</span>}
        </label>
        {children}
    </div>
);

// ─── Input ──────────────────────────────────────────────────
export const inputStyle = {
    width: '100%', padding: '12px 16px',
    background: theme.bg.input,
    border: `1px solid ${theme.border.subtle}`,
    borderRadius: theme.radius.sm, color: theme.text.primary,
    fontSize: theme.font.size.sm, fontWeight: 500,
    outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
    fontFamily: theme.font.family, boxSizing: 'border-box',
};

// ─── Section Title ──────────────────────────────────────────
export const SectionTitle = ({ children, style = {} }) => (
    <h3 style={{
        fontSize: theme.font.size.md, fontWeight: 700,
        color: theme.text.primary, margin: '0 0 16px 0',
        ...style,
    }}>
        {children}
    </h3>
);

// ─── Stripe Top Bar ─────────────────────────────────────────
export const StripeBar = ({ color }) => (
    <div style={{
        height: '3px', width: '100%',
        background: `linear-gradient(90deg, ${color}, ${color}88)`,
    }} />
);

// ─── Info Row ───────────────────────────────────────────────
export const InfoRow = ({ icon, label, value, accentColor }) => (
    <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '14px 18px', background: 'rgba(255,255,255,0.02)',
        borderRadius: theme.radius.sm, border: `1px solid ${theme.border.subtle}`,
    }}>
        {icon && <span style={{ color: accentColor || theme.accent.blue, opacity: 0.8 }}>{icon}</span>}
        <div>
            <div style={{
                fontSize: theme.font.size.xs, color: theme.text.label,
                textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600,
            }}>
                {label}
            </div>
            <div style={{
                fontSize: theme.font.size.base, color: theme.text.primary,
                fontWeight: 500,
            }}>
                {value}
            </div>
        </div>
    </div>
);
