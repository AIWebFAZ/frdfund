import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Role middleware รองรับ multiple roles
export const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // ถ้า user มี roles เป็น array (multiple roles)
    if (Array.isArray(req.user.roles)) {
      const hasRole = req.user.roles.some(role => allowedRoles.includes(role));
      if (!hasRole) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    } 
    // ถ้า user มี role เดียว (backward compatibility)
    else if (req.user.role) {
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    } 
    else {
      return res.status(403).json({ success: false, message: 'No role assigned' });
    }

    next();
  };
};
