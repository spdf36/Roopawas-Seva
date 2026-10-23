import { Yojna } from '@shared/data';
import { cleanExpense, cleanFund, cleanInstalment, cleanYojna } from '@shared/validate';
import { Request, Router } from 'express';
import mongoose, { HydratedDocument, Types, isValidObjectId } from 'mongoose';
import { STAFF, authenticate } from '../auth';
import { body, fail, param, str } from '../http';
import { ExpenseDoc, FundDoc, YojnaDoc, YojnaModel } from '../models';
import { Photo, deletePhoto, parsePhoto, savePhoto } from '../photos';
import { toYojna } from '../serialize';

// Village Yojnas: anyone may read them, staff change them. Every change loads the yojna, edits it and saves it.
// Changes to one yojna run one after another inside this server, and each save is also checked against the
// version it read (retrying on a conflict), so concurrent edits never undo each other.

type YojnaHydrated = HydratedDocument<YojnaDoc>;

/** Retries after a conflicting save, which only another server process could cause. */
const MAX_ATTEMPTS = 3;

const yojnaId = (req: Request) => {
  const id = param(req, 'id');
  return isValidObjectId(id) ? id : fail(404, 'not_found');
};

/** The sub-item with this ID (a fund, an instalment, an expense), or 404. */
const findItem = <T extends { _id: Types.ObjectId }>(list: T[], id: string): T => list.find((x) => x._id.toString() === id) ?? fail(404, 'not_found');

const received = (f: FundDoc) => f.instalments.reduce((total, i) => total + i.amount, 0);

const toDates = <T extends { date: number }>(o: T) => ({ ...o, date: new Date(o.date) });

/** The latest pending change per yojna; the next change for it waits for this one. */
const queues = new Map<string, Promise<unknown>>();

function queued<T>(id: string, run: () => Promise<T>): Promise<T> {
  const next = (queues.get(id) ?? Promise.resolve()).catch(() => undefined).then(run);
  queues.set(id, next);
  const cleanUp = () => { if (queues.get(id) === next) queues.delete(id); };
  next.then(cleanUp, cleanUp);
  return next;
}

/**
 * Applies `edit` to the latest version of the yojna and saves it. `edit` may run more than once (after a
 * conflicting save), so it must only change the document.
 */
const change = (id: string, edit: (y: YojnaHydrated) => void): Promise<Yojna> => queued(id, async () => {
  for (let attempt = 1; ; attempt++) {
    const y = (await YojnaModel.findById(id)) ?? fail(404, 'not_found');
    edit(y);
    y.updatedAt = new Date();
    try {
      await y.save();
      return toYojna(y.toObject());
    } catch (err) {
      if (err instanceof mongoose.Error.DocumentNotFoundError) fail(404, 'not_found');
      if (!(err instanceof mongoose.Error.VersionError) || attempt === MAX_ATTEMPTS) throw err;
    }
  }
});

/** Reads an optional bill from the body: undefined = keep the current one, null = remove it, else a checked photo. */
function billFrom(b: Record<string, unknown>): Photo | null | undefined {
  if (b.bill === undefined) return undefined;
  if (b.bill === null) return null;
  return parsePhoto(str(b.bill));
}

const fundExists = (y: YojnaDoc, fundId?: string) => !fundId || y.funds.some((f) => f._id.toString() === fundId);

export const yojnasRouter = Router();

yojnasRouter.get('/', async (_req, res) => {
  const list = await YojnaModel.find().sort({ createdAt: 1 }).lean();
  res.json(list.map(toYojna));
});

yojnasRouter.get('/:id', async (req, res) => {
  const y = (await YojnaModel.findById(yojnaId(req)).lean()) ?? fail(404, 'not_found');
  res.json(toYojna(y));
});

yojnasRouter.post('/', async (req, res) => {
  await authenticate(req, STAFF);
  const { levels, ...fields } = cleanYojna(body(req));
  const now = new Date();
  const y = await YojnaModel.create({
    ...fields,
    levels: levels.map((lv) => ({ name: lv.name, approvedAt: lv.approvedAt ? new Date(lv.approvedAt) : undefined })),
    funds: [],
    expenses: [],
    createdAt: now,
    updatedAt: now,
  });
  res.status(201).json(toYojna(y.toObject()));
});

yojnasRouter.put('/:id', async (req, res) => {
  await authenticate(req, STAFF);
  const id = yojnaId(req);
  const { levels, ...fields } = cleanYojna(body(req));
  res.json(await change(id, (y) => {
    y.set(fields);
    y.set('levels', levels.map((lv) => ({ name: lv.name, approvedAt: lv.approvedAt ? new Date(lv.approvedAt) : undefined })));
  }));
});

yojnasRouter.delete('/:id', async (req, res) => {
  await authenticate(req, STAFF);
  const id = yojnaId(req);
  // Money records are what villagers check, so they are never removed along with the yojna by accident.
  const { deletedCount } = await YojnaModel.deleteOne({ _id: id, funds: { $size: 0 }, expenses: { $size: 0 } });
  if (!deletedCount) {
    if (await YojnaModel.exists({ _id: id })) fail(409, 'in_use');
    fail(404, 'not_found');
  }
  res.status(204).end();
});

// ---------- Funds and instalments ----------

yojnasRouter.post('/:id/funds', async (req, res) => {
  await authenticate(req, STAFF);
  const id = yojnaId(req);
  const fund = cleanFund(body(req));
  res.json(await change(id, (y) => {
    y.funds.push({ _id: new Types.ObjectId(), ...fund, instalments: [] });
  }));
});

yojnasRouter.put('/:id/funds/:fundId', async (req, res) => {
  await authenticate(req, STAFF);
  const id = yojnaId(req);
  const fields = cleanFund(body(req));
  res.json(await change(id, (y) => {
    const fund = findItem(y.funds, param(req, 'fundId'));
    if (fields.sanctioned < received(fund)) fail(400, 'invalid');
    Object.assign(fund, fields);
  }));
});

yojnasRouter.delete('/:id/funds/:fundId', async (req, res) => {
  await authenticate(req, STAFF);
  const id = yojnaId(req);
  const fundId = param(req, 'fundId');
  res.json(await change(id, (y) => {
    const fund = findItem(y.funds, fundId);
    if (fund.instalments.length || y.expenses.some((e) => e.fundId === fundId)) fail(409, 'in_use');
    y.funds = y.funds.filter((f) => f !== fund);
  }));
});

yojnasRouter.post('/:id/funds/:fundId/instalments', async (req, res) => {
  await authenticate(req, STAFF);
  const id = yojnaId(req);
  const instalment = cleanInstalment(body(req));
  res.json(await change(id, (y) => {
    const fund = findItem(y.funds, param(req, 'fundId'));
    // A fund never pays out more than was sanctioned; a revised sanction is entered on the fund first.
    if (received(fund) + instalment.amount > fund.sanctioned) fail(400, 'invalid');
    fund.instalments.push({ _id: new Types.ObjectId(), ...toDates(instalment) });
  }));
});

yojnasRouter.delete('/:id/funds/:fundId/instalments/:instalmentId', async (req, res) => {
  await authenticate(req, STAFF);
  const id = yojnaId(req);
  res.json(await change(id, (y) => {
    const fund = findItem(y.funds, param(req, 'fundId'));
    const instalment = findItem(fund.instalments, param(req, 'instalmentId'));
    fund.instalments = fund.instalments.filter((i) => i !== instalment);
  }));
});

// ---------- Expenses ----------

/** Saves a new bill (if any) before the yojna changes, and cleans up whichever file is no longer used afterwards. */
async function withBill(yojna: string, bill: Photo | null | undefined, save: (file: string | null | undefined) => Promise<{ yojna: Yojna; replaced?: string }>) {
  const file = bill ? await savePhoto(bill, `bill-${yojna}`) : bill;
  try {
    const { yojna: saved, replaced } = await save(file);
    if (replaced) await deletePhoto(replaced);
    return saved;
  } catch (err) {
    if (file) await deletePhoto(file);
    throw err;
  }
}

yojnasRouter.post('/:id/expenses', async (req, res) => {
  await authenticate(req, STAFF);
  const id = yojnaId(req);
  const b = body(req);
  const fields = cleanExpense(b);
  // Checked before anything is written, so a bad photo leaves no file behind.
  const bill = billFrom(b);
  const saved = await withBill(id, bill, async (file) => ({
    yojna: await change(id, (y) => {
      if (!fundExists(y, fields.fundId)) fail(400, 'invalid');
      const expense: ExpenseDoc = { _id: new Types.ObjectId(), ...toDates(fields), ...(file ? { bill: file } : {}) };
      y.expenses.push(expense);
    }),
  }));
  res.status(201).json(saved);
});

yojnasRouter.put('/:id/expenses/:expenseId', async (req, res) => {
  await authenticate(req, STAFF);
  const id = yojnaId(req);
  const b = body(req);
  const fields = cleanExpense(b);
  const bill = billFrom(b);
  const saved = await withBill(id, bill, async (file) => {
    let replaced: string | undefined;
    const yojna = await change(id, (y) => {
      if (!fundExists(y, fields.fundId)) fail(400, 'invalid');
      const expense = findItem(y.expenses, param(req, 'expenseId'));
      replaced = file !== undefined ? expense.bill : undefined;
      // Assigning undefined removes a field (no fund given, bill removed).
      Object.assign(expense, { ...toDates(fields), fundId: fields.fundId, ...(file !== undefined ? { bill: file ?? undefined } : {}) });
    });
    return { yojna, replaced };
  });
  res.json(saved);
});

yojnasRouter.delete('/:id/expenses/:expenseId', async (req, res) => {
  await authenticate(req, STAFF);
  const id = yojnaId(req);
  let bill: string | undefined;
  const saved = await change(id, (y) => {
    const expense = findItem(y.expenses, param(req, 'expenseId'));
    bill = expense.bill;
    y.expenses = y.expenses.filter((e) => e !== expense);
  });
  if (bill) await deletePhoto(bill);
  res.json(saved);
});
