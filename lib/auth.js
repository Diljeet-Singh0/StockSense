import { SignJWT, jwtVerify } from 'jose';
import bcryptjs from 'bcryptjs';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me');

export async function hashPassword(password) {
  return bcryptjs.hash(password, 12);
}

export async function comparePassword(password, hash) {
  return bcryptjs.compare(password, hash);
}

export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET);
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch {
    return null;
  }
}

export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
