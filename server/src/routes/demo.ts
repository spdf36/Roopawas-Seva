import { Router } from 'express';
import fs from 'node:fs/promises';
import { config } from '../config';
import { fail } from '../http';
import { BILL_FILE, deletePhoto } from '../photos';
import { limit } from '../rateLimit';
import { loadSampleData } from '../sampleData';

export const demoRouter = Router();

/** Photo files this server wrote (see savePhoto); nothing else in the folder is touched. */
const OUR_PHOTO = /^RP-\d{4}-\d+-[0-9a-f]{12}\.(jpg|png|webp)$/;

// "Reset demo" on the website: back to the sample data. Only exists in demo mode – anywhere else this is a 404.
demoRouter.post('/reset', async (req, res) => {
  if (!config.demoMode) fail(404, 'not_found');
  limit(`demo-reset:${req.ip}`, 10, 60 * 60_000);
  await loadSampleData();
  // The requests and yojnas are gone, so their photos and bills go too.
  const files = await fs.readdir(config.uploadsDir).catch(() => [] as string[]);
  await Promise.all(files.filter((f) => OUR_PHOTO.test(f) || BILL_FILE.test(f)).map(deletePhoto));
  res.status(204).end();
});
