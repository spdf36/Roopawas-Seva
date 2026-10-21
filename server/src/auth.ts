import { Session } from '@shared/api';
import { Role } from '@shared/data';
import { Request } from 'express';
import { createHash, randomBytes } from 'node:crypto';
import { Types } from 'mongoose';
import { fail } from './http';
import { AccountDoc, AccountModel, SessionModel } from './models';
import { toUser } from './serialize';

/** Logins last this long; after that the user logs in again. */
const SESSION_DAYS = 30;

/** Sessions are stored by this hash, never by the token itself. */
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

/** The token from `Authorization: Bearer <token>`, if any. */
export const bearerToken = (req: Request) => /^Bearer\s+(\S+)$/i.exec(req.get('authorization') ?? '')?.[1];

/** Starts a session for the account and returns what the login/register endpoints answer with. */
export async function startSession(account: AccountDoc): Promise<Session> {
  const token = randomBytes(32).toString('base64url');
  await SessionModel.create({
    _id: hashToken(token),
    accountId: account._id,
    expiresAt: new Date(Date.now() + SESSION_DAYS * 86_400_000),
  });
  return { token, user: toUser(account) };
}

export const endSession = (token: string) => SessionModel.deleteOne({ _id: hashToken(token) });

/** Logs an account out everywhere, e.g. when it is deactivated or removed. */
export const endAllSessions = (accountId: Types.ObjectId) => SessionModel.deleteMany({ accountId });

/** The logged-in, active account, or undefined (for endpoints that guests may also call). */
export async function currentUser(req: Request): Promise<AccountDoc | undefined> {
  const token = bearerToken(req);
  if (!token) return undefined;
  // MongoDB removes expired sessions only about once a minute, so check the time as well.
  const session = await SessionModel.findOne({ _id: hashToken(token), expiresAt: { $gt: new Date() } }).lean();
  if (!session) return undefined;
  const account = await AccountModel.findById(session.accountId).lean();
  return account?.active ? account : undefined;
}

/** The logged-in account; rejects with 401 (no valid session) or 403 (a role not in `roles`). */
export async function authenticate(req: Request, roles?: Role[]): Promise<AccountDoc> {
  const account = await currentUser(req);
  if (!account) return fail(401, 'unauthorized');
  if (roles && !roles.includes(account.role)) return fail(403, 'forbidden');
  return account;
}

export const STAFF: Role[] = ['admin', 'superadmin'];
