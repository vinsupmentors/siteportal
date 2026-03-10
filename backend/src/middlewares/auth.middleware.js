const jwt = require('jsonwebtoken');

// Token extraction & Verification Firewall
const verifyToken = (req, res, next) => {
    // Expected format: "Bearer <token>"
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(403).json({ message: 'Authentication required. No valid token found.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'lms_secret_key_safe');
        req.user = decoded; // Unboxed { id, role_id, email }
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }
};

// Strict Role Based Access Firewall
// Roles Mapping: 1=SuperAdmin, 2=Admin, 3=Trainer, 4=Student
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role_id)) {
            return res.status(403).json({
                message: 'Forbidden: You do not possess the clearance for this operational endpoint.'
            });
        }
        next();
    };
};

module.exports = {
    verifyToken,
    requireRole
};
