const jwt = require('jsonwebtoken');
const { User } = require('../models');

// ── JWT Token tekshiruvi ─────────────────────────────────────
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token taqdim etilmagan' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password_hash'] },
    });

    if (!user) return res.status(401).json({ error: 'Foydalanuvchi topilmadi' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token yaroqsiz yoki muddati tugagan' });
  }
};

// ── Rol tekshiruvi ───────────────────────────────────────────
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Bu amalni bajarish uchun ruxsat yo\'q' });
    }
    next();
  };
};

module.exports = { authenticate, requireRole };
