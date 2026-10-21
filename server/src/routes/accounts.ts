import { DESIGNATIONS, isMobile, isPin, isStaffLoginId, normaliseLoginId } from '@shared/data';
import { Router } from 'express';
import { isValidObjectId } from 'mongoose';
import { STAFF, authenticate, endAllSessions } from '../auth';
import { body, fail, param, str } from '../http';
import { AccountModel } from '../models';
import { hashPin } from '../pins';
import { toUser } from '../serialize';

export const accountsRouter = Router();

/** Designations an admin can be given (district administration is the super admin's own). */
const ADMIN_DESIGNATIONS = new Set(DESIGNATIONS.filter((d) => d.id !== 'district').map((d) => d.id));

const findAccount = async (id: string) => (isValidObjectId(id) && (await AccountModel.findById(id).lean())) || fail(404, 'not_found');

accountsRouter.get('/', async (req, res) => {
  const filter = str(req.query.role);
  if (filter !== 'citizen' && filter !== 'staff') fail(400, 'invalid');
  await authenticate(req, filter === 'citizen' ? STAFF : ['superadmin']);
  const list = await AccountModel.find(filter === 'citizen' ? { role: 'citizen' } : { role: { $in: STAFF } }).sort({ createdAt: 1 }).lean();
  res.json(list.map(toUser));
});

accountsRouter.post('/', async (req, res) => {
  await authenticate(req, ['superadmin']);
  const b = body(req);
  const name = str(b.name).trim();
  const loginId = normaliseLoginId(str(b.loginId));
  const mobile = str(b.mobile);
  const pin = str(b.pin);
  const designation = str(b.designation);
  if (!name || name.length > 80 || !isStaffLoginId(loginId) || !isMobile(mobile) || !isPin(pin) || !ADMIN_DESIGNATIONS.has(designation)) {
    fail(400, 'invalid');
  }
  // A taken login ID is rejected by the unique index (409 via the error handler).
  const account = await AccountModel.create({ role: 'admin', name, loginId, mobile, designation, pinHash: await hashPin(pin) });
  res.status(201).json(toUser(account.toObject()));
});

accountsRouter.patch('/:id', async (req, res) => {
  const me = await authenticate(req, STAFF);
  const active = body(req).active;
  if (typeof active !== 'boolean') fail(400, 'invalid');
  const account = await findAccount(param(req, 'id'));
  // Nobody can switch themselves off; admins manage citizens; only the super admin manages admins.
  if (account._id.equals(me._id) || account.role === 'superadmin' || (account.role === 'admin' && me.role !== 'superadmin')) {
    fail(403, 'forbidden');
  }
  const updated = await AccountModel.findByIdAndUpdate(account._id, { active }, { returnDocument: 'after' }).lean();
  // A deactivated account is logged out everywhere at once.
  if (!active) await endAllSessions(account._id);
  res.json(toUser(updated!));
});

accountsRouter.delete('/:id', async (req, res) => {
  await authenticate(req, ['superadmin']);
  const account = await findAccount(param(req, 'id'));
  if (account.role !== 'admin') fail(403, 'forbidden');
  await AccountModel.deleteOne({ _id: account._id });
  await endAllSessions(account._id);
  res.status(204).end();
});
