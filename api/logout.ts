import { serialize } from 'cookie';
import type { VercelRequest, VercelResponse } from './types.js';

export function logout(_req: VercelRequest, res: VercelResponse): void {
  res.setHeader('Set-Cookie', serialize('sma_session', '', {
    expires: new Date(0),
    httpOnly: true,
    maxAge: 0,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  }));
  res.redirect('/login');
}

export default logout;
