import jwt from 'jsonwebtoken';

type InvitePayload = { projectId: string; email: string };

export function createInviteToken(payload: InvitePayload): string {
  return jwt.sign(payload, process.env.INVITE_SECRET!, { expiresIn: '7d' });
}

export function readInviteToken(token: string): InvitePayload {
  return jwt.verify(token, process.env.INVITE_SECRET!) as InvitePayload;
}
