import { TAG_VISUAL, isStaff } from '@shared/data';
import { cleanNotice, cleanScheme, cleanWork } from '@shared/validate';
import { Router } from 'express';
import { isValidObjectId } from 'mongoose';
import { randomBytes } from 'node:crypto';
import { STAFF, authenticate, currentUser } from '../auth';
import { body, fail, param } from '../http';
import { NoticeModel, RequestModel, SchemeModel, WorkModel } from '../models';
import { toNotice, toScheme, toWork } from '../serialize';

// What citizens read (notices, schemes, development works): public to read, staff to change.

const objectId = (req: Parameters<typeof param>[0]) => {
  const id = param(req, 'id');
  return isValidObjectId(id) ? id : fail(404, 'not_found');
};

// ---------- Notices ----------
export const noticesRouter = Router();

noticesRouter.get('/', async (_req, res) => {
  const list = await NoticeModel.find().sort({ publishedAt: -1 }).lean();
  res.json(list.map(toNotice));
});

noticesRouter.post('/', async (req, res) => {
  await authenticate(req, STAFF);
  const fields = cleanNotice(body(req));
  const notice = await NoticeModel.create({
    ...fields,
    ...TAG_VISUAL[fields.tag],
    source: { hi: 'ग्राम पंचायत रूपावास', en: 'Gram Panchayat Roopawas' },
    publishedAt: new Date(),
  });
  res.status(201).json(toNotice(notice.toObject()));
});

noticesRouter.put('/:id', async (req, res) => {
  await authenticate(req, STAFF);
  const id = objectId(req);
  const fields = cleanNotice(body(req));
  const current = (await NoticeModel.findById(id).lean()) ?? fail(404, 'not_found');
  // A notice keeps its own icon unless its category changes.
  const updated = await NoticeModel.findByIdAndUpdate(
    id,
    { ...fields, ...(fields.tag !== current.tag ? TAG_VISUAL[fields.tag] : {}), updatedAt: new Date() },
    { returnDocument: 'after' },
  ).lean();
  res.json(toNotice(updated ?? fail(404, 'not_found')));
});

noticesRouter.delete('/:id', async (req, res) => {
  await authenticate(req, STAFF);
  const { deletedCount } = await NoticeModel.deleteOne({ _id: objectId(req) });
  if (!deletedCount) fail(404, 'not_found');
  res.status(204).end();
});

// ---------- Schemes ----------
export const schemesRouter = Router();

schemesRouter.get('/', async (req, res) => {
  // Visitors and citizens only see schemes open for applications; staff also see closed ones.
  const staff = isStaff(await currentUser(req));
  const list = await SchemeModel.find(staff ? {} : { open: true }).sort({ createdAt: 1 }).lean();
  res.json(list.map(toScheme));
});

schemesRouter.post('/', async (req, res) => {
  await authenticate(req, STAFF);
  const scheme = await SchemeModel.create({ ...cleanScheme(body(req)), _id: `s-${randomBytes(4).toString('hex')}` });
  res.status(201).json(toScheme(scheme.toObject()));
});

schemesRouter.put('/:id', async (req, res) => {
  await authenticate(req, STAFF);
  // Existing applications keep their own title, department and group, so editing a scheme is safe.
  const updated = await SchemeModel.findByIdAndUpdate(param(req, 'id'), cleanScheme(body(req)), { returnDocument: 'after' }).lean();
  res.json(toScheme(updated ?? fail(404, 'not_found')));
});

schemesRouter.delete('/:id', async (req, res) => {
  await authenticate(req, STAFF);
  const id = param(req, 'id');
  if (!(await SchemeModel.exists({ _id: id }))) fail(404, 'not_found');
  // Applications point at the scheme, so once citizens have applied it can only be closed.
  if (await RequestModel.exists({ schemeId: id })) fail(409, 'in_use');
  await SchemeModel.deleteOne({ _id: id });
  res.status(204).end();
});

// ---------- Development works ----------
export const worksRouter = Router();

worksRouter.get('/', async (_req, res) => {
  const list = await WorkModel.find().sort({ createdAt: 1 }).lean();
  res.json(list.map(toWork));
});

worksRouter.post('/', async (req, res) => {
  await authenticate(req, STAFF);
  const work = await WorkModel.create(cleanWork(body(req)));
  res.status(201).json(toWork(work.toObject()));
});

worksRouter.put('/:id', async (req, res) => {
  await authenticate(req, STAFF);
  const updated = await WorkModel.findByIdAndUpdate(objectId(req), cleanWork(body(req)), { returnDocument: 'after' }).lean();
  res.json(toWork(updated ?? fail(404, 'not_found')));
});

worksRouter.delete('/:id', async (req, res) => {
  await authenticate(req, STAFF);
  const { deletedCount } = await WorkModel.deleteOne({ _id: objectId(req) });
  if (!deletedCount) fail(404, 'not_found');
  res.status(204).end();
});
