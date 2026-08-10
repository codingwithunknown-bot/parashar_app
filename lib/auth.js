import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export function generateToken(userId) {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export function generateResetToken(userId) {
  return jwt.sign({ userId, purpose: 'password_reset' }, process.env.JWT_SECRET, {
    expiresIn: '10m',
  });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function verifyResetToken(token) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.purpose !== 'password_reset') {
    throw new Error('Invalid token purpose');
  }
  return decoded.userId;
}
