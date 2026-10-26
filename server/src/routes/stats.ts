import { VillageStats } from '@shared/api';
import { BASELINE_FIELDS, Baseline } from '@shared/data';
import { cleanBaseline } from '@shared/validate';
import { Router } from 'express';
import { STAFF, authenticate } from '../auth';
import { body } from '../http';
import { BASELINE_ID, BaselineModel, RequestModel } from '../models';
import { toBaseline } from '../serialize';

export const statsRouter = Router();

const CLOSED = ['resolved', 'rejected'];
const ZERO = Object.fromEntries(BASELINE_FIELDS.map(({ id }) => [id, 0])) as Baseline;

/** The recorded figures (all zero until staff enter them). */
const baseline = async () => toBaseline((await BaselineModel.findById(BASELINE_ID).lean()) ?? ZERO);

// Public: the recorded figures plus live counts of the requests made on the portal.
statsRouter.get('/village', async (_req, res) => {
  const count = (filter: object) => RequestModel.countDocuments(filter);
  const [b, total, resolved, inProgress, forwarded, roads, water, lightsFixed, applications] = await Promise.all([
    baseline(),
    count({}),
    count({ status: 'resolved' }),
    count({ status: { $nin: [...CLOSED, 'forwarded'] } }),
    count({ status: 'forwarded' }),
    count({ categoryId: 'road', status: { $nin: CLOSED } }),
    count({ categoryId: 'water', status: { $nin: CLOSED } }),
    count({ categoryId: 'light', status: 'resolved' }),
    count({ kind: 'application' }),
  ]);
  const stats: VillageStats = {
    total: b.total + total,
    resolved: b.resolved + resolved,
    inProgress: b.inProgress + inProgress,
    forwarded: b.forwarded + forwarded,
    roads: b.roads + roads,
    water: b.water + water,
    lightsFixed: b.lightsFixed + lightsFixed,
    schemeApplications: b.schemeApplications + applications,
    schoolWorks: b.schoolWorks,
    trees: b.trees,
  };
  res.json(stats);
});

statsRouter.get('/baseline', async (req, res) => {
  await authenticate(req, STAFF);
  res.json(await baseline());
});

statsRouter.put('/baseline', async (req, res) => {
  await authenticate(req, STAFF);
  const figures = cleanBaseline(body(req));
  const saved = await BaselineModel.findOneAndUpdate({ _id: BASELINE_ID }, figures, { upsert: true, returnDocument: 'after' }).lean();
  res.json(toBaseline(saved!));
});
