import { normaliseLoginId } from '@shared/data';
import { FIRST_NEW_SEQ, SEED_ACCOUNTS, SEED_BASELINE, SEED_NOTICES, SEED_REQUESTS, SEED_SCHEMES, SEED_WORKS } from '@shared/seed';
import {
  AccountModel, BASELINE_ID, BaselineModel, CounterModel, NoticeModel, OtpModel, RequestModel, SchemeModel, SessionModel, WorkModel,
} from './models';
import { hashPin } from './pins';

export const ALL_MODELS = [AccountModel, SessionModel, OtpModel, RequestModel, CounterModel, NoticeModel, SchemeModel, WorkModel, BaselineModel];

/** The sequence that request numbers (RP-2026-00128…) are taken from. */
export const REQUEST_COUNTER = 'request';

/** Creates any missing indexes (unique login IDs, session expiry…). Never drops anything. */
export const ensureIndexes = () => Promise.all(ALL_MODELS.map((m) => m.createIndexes()));

/** True when any collection already holds documents. */
export async function hasData() {
  const counts = await Promise.all(ALL_MODELS.map((m) => m.estimatedDocumentCount()));
  return counts.some((n) => n > 0);
}

/**
 * Replaces everything in the database with the sample data from shared/seed.ts – the same data the
 * website's mock API uses. Deletes all existing data, sessions included, so only call it in demo mode.
 */
export async function loadSampleData() {
  await Promise.all(ALL_MODELS.map((m) => m.deleteMany()));

  await AccountModel.insertMany(await Promise.all(SEED_ACCOUNTS.map(async ({ id: _sampleId, pin, loginId, createdAt, ...a }) => ({
    ...a,
    loginId: normaliseLoginId(loginId),
    pinHash: await hashPin(pin),
    createdAt: new Date(createdAt),
  }))));

  await RequestModel.insertMany(SEED_REQUESTS.map(({ id, createdAt, history, photo: _noSamplePhotos, ...r }) => ({
    ...r,
    _id: id,
    createdAt: new Date(createdAt),
    updatedAt: new Date(history.at(-1)?.at ?? createdAt),
    history: history.map((h) => ({ ...h, at: new Date(h.at) })),
  })));
  // The counter holds the last number used; FIRST_NEW_SEQ is the next one to hand out.
  await CounterModel.create({ _id: REQUEST_COUNTER, seq: FIRST_NEW_SEQ - 1 });

  await NoticeModel.insertMany(SEED_NOTICES.map(({ id: _sampleId, publishedAt, updatedAt, ...n }) => ({
    ...n,
    publishedAt: new Date(publishedAt),
    updatedAt: updatedAt ? new Date(updatedAt) : undefined,
  })));
  // A millisecond apart, so lists sorted by creation keep the sample order.
  const now = Date.now();
  await SchemeModel.insertMany(SEED_SCHEMES.map(({ id, ...s }, i) => ({ ...s, _id: id, createdAt: new Date(now + i) })));
  await WorkModel.insertMany(SEED_WORKS.map(({ id: _sampleId, ...w }, i) => ({ ...w, createdAt: new Date(now + i) })));
  await BaselineModel.create({ _id: BASELINE_ID, ...SEED_BASELINE });
}
