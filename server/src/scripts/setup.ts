// npm run setup
// Prepares a real (non-demo) database: creates the indexes, the village figures document and – if there is
// no super admin yet – the first super admin from SUPERADMIN_* in server/.env. Safe to run again: it never
// deletes or overwrites anything.
import { isMobile, isPin, isStaffLoginId, normaliseLoginId } from '@shared/data';
import { config } from '../config';
import { connectDb, disconnectDb } from '../db';
import { AccountModel, BASELINE_ID, BaselineModel } from '../models';
import { hashPin } from '../pins';
import { ensureIndexes } from '../sampleData';

async function main() {
  const conn = await connectDb();
  await ensureIndexes();
  await BaselineModel.updateOne({ _id: BASELINE_ID }, { $setOnInsert: { _id: BASELINE_ID } }, { upsert: true, setDefaultsOnInsert: true });

  if (await AccountModel.exists({ role: 'superadmin' })) {
    console.log(`Database "${conn.name}" is ready; a super admin already exists, so none was created.`);
    return;
  }
  const s = config.superAdmin();
  const loginId = normaliseLoginId(s.loginId);
  if (!isStaffLoginId(loginId)) throw new Error('SUPERADMIN_LOGIN must be 3–20 characters, start with a letter, and use only a-z, 0-9, . _ -');
  if (!isPin(s.pin)) throw new Error('SUPERADMIN_PIN must be exactly 4 digits.');
  if (!isMobile(s.mobile)) throw new Error('SUPERADMIN_MOBILE must be a 10-digit mobile number starting with 6–9.');
  if (await AccountModel.exists({ loginId })) throw new Error(`An account with the login ID "${loginId}" already exists.`);

  await AccountModel.create({ role: 'superadmin', name: s.name, loginId, pinHash: await hashPin(s.pin), mobile: s.mobile, designation: 'district' });
  console.log(`Database "${conn.name}" is ready. Super admin "${loginId}" created – log in with it and the PIN from SUPERADMIN_PIN.`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(disconnectDb);
