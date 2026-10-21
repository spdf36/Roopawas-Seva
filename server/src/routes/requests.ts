import { RequestSort } from '@shared/api';
import {
  CATEGORIES, DEPARTMENTS, REOPEN_STATUS, RequestFilter, Status, canReopen, isStaff, nextStatuses,
} from '@shared/data';
import { Router } from 'express';
import { QueryFilter, SortOrder } from 'mongoose';
import { STAFF, authenticate } from '../auth';
import { body, fail, obj, param, str } from '../http';
import { AccountDoc, CounterModel, RequestDoc, RequestModel, SchemeModel } from '../models';
import { deletePhoto, parsePhoto, savePhoto } from '../photos';
import { REQUEST_COUNTER } from '../sampleData';
import { toRequest } from '../serialize';

export const requestsRouter = Router();

const MAX_DESCRIPTION = 2000;
const MAX_LOCATION = 200;
const MAX_NOTE = 1000;
const STATUS_FILTERS: RequestFilter[] = ['all', 'active', 'done', 'rejected'];
const SORTS: RequestSort[] = ['newest', 'oldest', 'updated'];

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Takes the next request number, e.g. RP-2026-00128. Atomic, so two complaints never share a number. */
async function nextRequestId() {
  const counter = await CounterModel.findOneAndUpdate({ _id: REQUEST_COUNTER }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: 'after' }).lean();
  return `RP-${new Date().getFullYear()}-${String(counter!.seq).padStart(5, '0')}`;
}

/** A request the account may see: citizens only their own; anything else looks like it does not exist. */
async function findVisible(id: string, user: AccountDoc) {
  const request = await RequestModel.findById(id).lean();
  if (!request || (!isStaff(user) && request.citizen.mobile !== user.mobile)) return fail(404, 'not_found');
  return request;
}

/** Saves a change only if the request is still as it was read (`status`), so two staff acting at once cannot both win. */
async function saveIfUnchanged(request: RequestDoc, update: object) {
  const saved = await RequestModel.findOneAndUpdate({ _id: request._id, status: request.status }, update, { returnDocument: 'after' }).lean();
  return saved ?? fail(400, 'invalid');
}

const newRequest = (user: AccountDoc, fields: Partial<RequestDoc>) => {
  const now = new Date();
  return {
    ...fields,
    status: 'submitted' as Status,
    createdAt: now,
    updatedAt: now,
    history: [{ status: 'submitted' as Status, at: now }],
    citizen: { name: user.name, mobile: user.mobile, ward: user.ward },
  };
};

requestsRouter.get('/', async (req, res) => {
  const user = await authenticate(req);
  const q = str(req.query.q).trim().slice(0, 100);
  const status = (str(req.query.status) || 'all') as RequestFilter;
  const category = str(req.query.category);
  const department = str(req.query.department);
  const ward = str(req.query.ward);
  const sort = (str(req.query.sort) || 'newest') as RequestSort;
  if (!STATUS_FILTERS.includes(status) || !SORTS.includes(sort)) fail(400, 'invalid');

  const filter: QueryFilter<RequestDoc> = {};
  // Citizens only ever see their own requests, whatever they ask for.
  if (!isStaff(user)) filter['citizen.mobile'] = user.mobile;
  if (status === 'active') filter.status = { $nin: ['resolved', 'rejected'] };
  if (status === 'done') filter.status = 'resolved';
  if (status === 'rejected') filter.status = 'rejected';
  if (category === 'application') filter.kind = 'application';
  else if (category) filter.categoryId = category;
  if (department) filter.department = department;
  if (ward) filter['citizen.ward'] = ward;
  if (q) {
    const text = { $regex: escapeRegex(q), $options: 'i' };
    const digits = q.replace(/\D/g, '');
    filter.$or = [{ _id: text }, { 'citizen.name': text }, ...(digits.length >= 3 ? [{ 'citizen.mobile': { $regex: escapeRegex(digits) } }] : [])];
  }
  const order: Record<string, SortOrder> = sort === 'oldest' ? { createdAt: 1 } : sort === 'updated' ? { updatedAt: -1 } : { createdAt: -1 };
  const list = await RequestModel.find(filter).sort(order).lean();
  res.json(list.map(toRequest));
});

requestsRouter.get('/:id', async (req, res) => {
  const user = await authenticate(req);
  res.json(toRequest(await findVisible(param(req, 'id'), user)));
});

requestsRouter.post('/complaints', async (req, res) => {
  const user = await authenticate(req, ['citizen']);
  const b = body(req);
  const category = CATEGORIES.find((c) => c.id === str(b.categoryId));
  const description = str(b.description).trim();
  const location = str(b.location).trim();
  if (!category || description.length < 5 || description.length > MAX_DESCRIPTION || !location || location.length > MAX_LOCATION) fail(400, 'invalid');

  let coords: RequestDoc['coords'];
  if (b.coords !== undefined) {
    const { lat, lng, accuracy } = obj(b.coords);
    if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      fail(400, 'invalid');
    }
    coords = { lat: lat as number, lng: lng as number, accuracy: typeof accuracy === 'number' && Number.isFinite(accuracy) ? Math.round(accuracy) : undefined };
  }

  // Check everything before taking a request number, so rejected complaints leave no gaps in the numbering.
  const parsedPhoto = b.photo === undefined ? undefined : parsePhoto(str(b.photo));
  const id = await nextRequestId();
  const photo = parsedPhoto && (await savePhoto(parsedPhoto, id));
  try {
    const created = await RequestModel.create({
      ...newRequest(user, {
        kind: 'complaint', categoryId: category!.id, department: category!.dept, description, location, coords, photo,
        title: { hi: `${category!.name.hi} की समस्या`, en: `${category!.name.en} Problem` },
      }),
      _id: id,
    });
    res.status(201).json(toRequest(created.toObject()));
  } catch (e) {
    // Do not leave a photo behind for a complaint that was never saved.
    if (photo) await deletePhoto(photo);
    throw e;
  }
});

requestsRouter.post('/applications', async (req, res) => {
  const user = await authenticate(req, ['citizen']);
  const scheme = await SchemeModel.findById(str(body(req).schemeId)).lean();
  if (!scheme?.open) fail(400, 'invalid');
  if (await RequestModel.exists({ schemeId: scheme!._id, 'citizen.mobile': user.mobile })) fail(409, 'exists');
  const created = await RequestModel.create({
    ...newRequest(user, {
      kind: 'application', schemeId: scheme!._id, groupId: scheme!.groupId, department: scheme!.dept, location: 'रूपावास',
      title: { hi: scheme!.name.hi, en: scheme!.name.en }, description: `${scheme!.name.hi} के लिए आवेदन।`,
    }),
    _id: await nextRequestId(),
  });
  res.status(201).json(toRequest(created.toObject()));
});

requestsRouter.patch('/:id/status', async (req, res) => {
  const user = await authenticate(req, STAFF);
  const b = body(req);
  const status = str(b.status) as Status;
  const note = str(b.note).trim().slice(0, MAX_NOTE) || undefined;
  const department = b.department === undefined ? undefined : str(b.department);
  if (department !== undefined && !DEPARTMENTS[department]) fail(400, 'invalid');
  const request = await findVisible(param(req, 'id'), user);
  // Only forward along the flow, or to rejected; resolved and rejected requests are closed.
  if (!nextStatuses(request.status).includes(status)) fail(400, 'invalid');
  const now = new Date();
  const saved = await saveIfUnchanged(request, {
    status,
    updatedAt: now,
    ...(department ? { department } : {}),
    ...(status === 'resolved' ? {} : { confirmed: false }),
    $push: { history: { status, at: now, note, by: user.name, byId: user._id.toString() } },
  });
  res.json(toRequest(saved));
});

requestsRouter.post('/:id/confirm', async (req, res) => {
  const user = await authenticate(req, ['citizen']);
  const request = await findVisible(param(req, 'id'), user);
  if (request.status !== 'resolved') fail(400, 'invalid');
  res.json(toRequest(await saveIfUnchanged(request, { confirmed: true })));
});

requestsRouter.post('/:id/reopen', async (req, res) => {
  const user = await authenticate(req, ['citizen']);
  const reason = str(body(req).reason).trim();
  const request = await findVisible(param(req, 'id'), user);
  // Complaints only, within REOPEN_DAYS of being resolved, and not after the citizen confirmed it.
  if (!canReopen(toRequest(request)) || reason.length < 5 || reason.length > MAX_NOTE) fail(400, 'invalid');
  const now = new Date();
  const saved = await saveIfUnchanged(request, {
    status: REOPEN_STATUS,
    updatedAt: now,
    $inc: { reopened: 1 },
    $push: { history: { status: REOPEN_STATUS, at: now, note: reason, by: user.name, byId: user._id.toString() } },
  });
  res.json(toRequest(saved));
});
