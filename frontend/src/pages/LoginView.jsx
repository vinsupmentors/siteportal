import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BrandLogo } from '../components/icons/BrandLogo';

export const LoginView = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();

    const handleSubmission = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await login(email, password);
        if (!result.success) {
            setError(result.message);
        }
        setIsLoading(false);
    };

    return (
        <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', background: 'var(--bg-dark)' }}>
            <div className="glass-card" style={{ width: '400px', padding: '2.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
                    <BrandLogo />
                    <h2 style={{ marginTop: '1rem', className: 'brand-text', color: 'var(--text-main)' }}>Sign In to Vinsup Skill Academy</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Enter your organizational credentials</p>
                </div>

                {error && (
                    <div style={{ background: 'rgba(255, 107, 107, 0.1)', color: '#ff6b6b', padding: '10px', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem', border: '1px solid rgba(255,107,107,0.2)' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmission} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>Corporate Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{
                                width: '100%', padding: '12px', borderRadius: '8px',
                                background: 'rgba(15, 17, 26, 0.8)', border: '1px solid var(--border-color)',
                                color: 'white', outline: 'none'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{
                                width: '100%', padding: '12px', borderRadius: '8px',
                                background: 'rgba(15, 17, 26, 0.8)', border: '1px solid var(--border-color)',
                                color: 'white', outline: 'none'
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            padding: '12px', marginTop: '0.5rem', borderRadius: '8px',
                            background: 'var(--primary)', color: 'white', fontWeight: 600,
                            border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s', opacity: isLoading ? 0.7 : 1
                        }}
                    >
                        {isLoading ? 'Authenticating...' : 'Secure Login'}
                    </button>
                </form>
            </div>
        </div>
    );
};
