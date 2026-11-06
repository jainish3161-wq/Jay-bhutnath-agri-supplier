const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  let token = req.headers.authorization;
  
  if (token && token.startsWith('Bearer ')) {
    token = token.slice(7, token.length);
  } else if (req.cookies && req.cookies.admin_token) {
    token = req.cookies.admin_token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Failed to authenticate token' });
  }
};
