import { CitizenDetails, ProfilePatch } from '@shared/api';
import { AGE_GROUPS, OCCUPATIONS, WARDS, isMobile, isPin, normaliseLoginId } from '@shared/data';
import { Router } from 'express';
import { authenticate, bearerToken, endSession, startSession } from '../auth';
import { body, fail, obj, str } from '../http';
import { AccountModel } from '../models';
import { sendOtp, verifyOtp } from '../otp';
import { checkPin, hashPin } from '../pins';
import { checkLimit, countAttempt, limit, resetLimit } from '../rateLimit';
import { toUser } from '../serialize';

export const authRouter = Router();

const MINUTE = 60_000;
const ids = (list: { id: string }[]) => new Set(list.map((x) => x.id));
const AGE_GROUP_IDS = ids(AGE_GROUPS);
const WARD_IDS = ids(WARDS);
const OCCUPATION_IDS = ids(OCCUPATIONS);
const MAX_NAME = 80;

/** Compared against when the login ID does not exist, so that case takes as long as a wrong PIN. */
const DUMMY_HASH = await hashPin('0000');

/** Citizen detail fields from a request body; `partial` allows leaving fields out (profile edits). */
function citizenFields(raw: Record<string, unknown>, partial: boolean): ProfilePatch {
  const out: ProfilePatch = {};
  const check = (key: keyof ProfilePatch, valid: (v: string) => boolean) => {
    if (partial && raw[key] === undefined) return;
    const v = str(raw[key]).trim();
    if (!valid(v)) fail(400, 'invalid');
    out[key] = v;
  };
  check('name', (v) => v.length > 0 && v.length <= MAX_NAME);
  check('ageGroup', (v) => AGE_GROUP_IDS.has(v));
  check('ward', (v) => WARD_IDS.has(v));
  check('occupation', (v) => OCCUPATION_IDS.has(v));
  check('family', (v) => /^\d{0,2}$/.test(v));
  return out;
}

const mobileTaken = async (mobile: string) => !!(await AccountModel.exists({ $or: [{ role: 'citizen', mobile }, { loginId: mobile }] }));

authRouter.post('/login', async (req, res) => {
  const loginId = normaliseLoginId(str(body(req).loginId));
  const pin = str(body(req).pin);
  // Failed logins count per login ID (stops guessing one account's PIN) and per address (stops trying many accounts).
  const idKey = `login:${loginId}`;
  const ipKey = `login-ip:${req.ip}`;
  checkLimit(idKey, 5);
  checkLimit(ipKey, 30);

  const account = loginId ? await AccountModel.findOne({ loginId }).lean() : null;
  const pinOk = await checkPin(pin, account?.pinHash ?? DUMMY_HASH);
  if (!account || !pinOk) {
    countAttempt(idKey, 15 * MINUTE);
    countAttempt(ipKey, 15 * MINUTE);
    fail(401, 'invalid_login');
  }
  if (!account!.active) fail(403, 'inactive');
  resetLimit(idKey);
  res.json(await startSession(account!));
});

authRouter.post('/logout', async (req, res) => {
  const token = bearerToken(req);
  if (token) await endSession(token);
  res.status(204).end();
});

authRouter.post('/otp', async (req, res) => {
  const mobile = str(body(req).mobile);
  if (!isMobile(mobile)) fail(400, 'invalid');
  limit(`otp:${mobile}`, 3, 10 * MINUTE);
  limit(`otp-ip:${req.ip}`, 10, 60 * MINUTE);
  if (await mobileTaken(mobile)) fail(409, 'exists');
  await sendOtp(mobile);
  res.status(204).end();
});

authRouter.post('/register', async (req, res) => {
  const b = body(req);
  const details = obj(b.details);
  const fields = citizenFields(details, false) as Required<Omit<CitizenDetails, 'mobile'>>;
  const mobile = str(details.mobile);
  const pin = str(b.pin);
  if (!isMobile(mobile) || !isPin(pin)) fail(400, 'invalid');
  if (await mobileTaken(mobile)) fail(409, 'exists');
  if (!(await verifyOtp(mobile, str(b.otp)))) fail(400, 'invalid');

  // Two registrations racing for one number: the unique index rejects the second (409 via the error handler).
  const account = await AccountModel.create({ ...fields, role: 'citizen', mobile, loginId: mobile, pinHash: await hashPin(pin) });
  res.status(201).json(await startSession(account.toObject()));
});

authRouter.get('/me', async (req, res) => {
  res.json(toUser(await authenticate(req)));
});

authRouter.patch('/me', async (req, res) => {
  const me = await authenticate(req, ['citizen']);
  const patch = citizenFields(body(req), true);
  const updated = await AccountModel.findByIdAndUpdate(me._id, patch, { returnDocument: 'after' }).lean();
  res.json(toUser(updated!));
});
