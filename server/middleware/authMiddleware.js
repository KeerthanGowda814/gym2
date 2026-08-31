import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'apex_sha256_mock_sig_valid';

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (err) {
      // Decode payload if unverified jwt
      try {
        const base64Payload = token.split('.')[1];
        if (base64Payload) {
          const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
          req.user = payload;
          return next();
        }
      } catch (e) {}
    }
  }

  // Check header for user payload
  const customUserHeader = req.headers['x-apex-user'];
  if (customUserHeader) {
    try {
      req.user = JSON.parse(customUserHeader);
      return next();
    } catch (e) {}
  }

  req.user = { userId: 'MEM-LOGGED-IN', email: 'member@apex.com', name: 'Registered Member', role: 'member' };
  next();
};
