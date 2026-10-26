// npm run seed [-- --reset]
// Loads the sample data (demo accounts, requests, notices…) for demos and development. Demo mode only.
import { config } from '../config';
import { connectDb, disconnectDb } from '../db';
import { ensureIndexes, hasData, loadSampleData } from '../sampleData';

async function main() {
  if (!config.demoMode) {
    throw new Error('npm run seed only runs with DEMO_MODE=true in server/.env. For a real deployment, use npm run setup.');
  }
  const conn = await connectDb();
  await ensureIndexes();
  if (!process.argv.includes('--reset') && (await hasData())) {
    throw new Error(`Database "${conn.name}" already has data. To delete it and load the sample data, run: npm run seed -- --reset`);
  }
  await loadSampleData();
  console.log(`Sample data loaded into "${conn.name}". Demo logins: citizen 9876543210 / 1111, admin sarpanch / 1234, super admin superadmin / 0000.`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(disconnectDb);
