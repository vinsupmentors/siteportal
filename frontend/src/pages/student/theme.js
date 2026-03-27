// Vinsup Skill Academy — Student Portal Theme
// Extracted from Admin portal design system

const theme = {
  // Backgrounds
  bg: {
    main: '#0b1120',
    sidebar: '#0f1628',
    card: '#141d2f',
    cardHover: '#1a2540',
    input: '#0d1424',
    overlay: 'rgba(11, 17, 32, 0.85)',
  },

  // Borders
  border: {
    subtle: 'rgba(255, 255, 255, 0.06)',
    light: 'rgba(255, 255, 255, 0.1)',
    focus: 'rgba(59, 130, 246, 0.5)',
  },

  // Text
  text: {
    primary: '#ffffff',
    secondary: '#8892a4',
    muted: '#5a6478',
    label: '#6b7a90',
  },

  // Accent Colors
  accent: {
    blue: '#3b82f6',
    cyan: '#06b6d4',
    green: '#10b981',
    yellow: '#f59e0b',
    red: '#ef4444',
    purple: '#8b5cf6',
    pink: '#ec4899',
    orange: '#f97316',
  },

  // Gradients
  gradient: {
    blue: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    cyan: 'linear-gradient(135deg, #06b6d4, #0891b2)',
    green: 'linear-gradient(135deg, #10b981, #059669)',
    purple: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    red: 'linear-gradient(135deg, #ef4444, #dc2626)',
    sidebarActive: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    cardShine: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)',
  },

  // Shadows
  shadow: {
    card: '0 4px 24px rgba(0, 0, 0, 0.3)',
    cardHover: '0 8px 32px rgba(0, 0, 0, 0.4)',
    glow: (color) => `0 0 20px ${color}33`,
  },

  // Border Radius
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    full: '9999px',
  },

  // Spacing
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },

  // Typography
  font: {
    family: "'Segoe UI', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
    size: {
      xs: '11px',
      sm: '13px',
      base: '14px',
      md: '16px',
      lg: '20px',
      xl: '28px',
      xxl: '36px',
    },
    weight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
};

export default theme;
