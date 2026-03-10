import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Initial load: parse potential stored JWT token unboxing role
        const token = localStorage.getItem('token');
        const storedRole = localStorage.getItem('role'); // Cached for immediate layout rendering speed

        if (token) {
            setUser({ token, role: storedRole });
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            // Backend validates plaintext mapping per strict architectural requirement
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const response = await axios.post(`${API_URL}/auth/login`, {
                email,
                password
            });

            const { token, redirectUrl } = response.data;

            // Determine Role heuristically from the redirectUrl backend generated
            const mappedRole = redirectUrl.split('/')[1].replace('-', '');

            localStorage.setItem('token', token);
            localStorage.setItem('role', mappedRole);

            setUser({ token, role: mappedRole });

            // Enforce the explicit backend routing string mapping
            navigate(redirectUrl);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Login operational fault.'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        setUser(null);
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
