import jwt from 'jsonwebtoken';

const JWT_SECRET = 'your-secret-key';

const payload = {
  userId: '687a0ed116c2eca78d43496a',
  username: 'Kapsidd'
};

const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
console.log(token);