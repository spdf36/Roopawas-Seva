import { MAX_PHOTO_BYTES } from '@shared/api';
import { Router } from 'express';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from './config';
import { fail, param, str } from './http';
import { RequestModel } from './models';

// Complaint photos are files in UPLOADS_DIR; a request stores only the file name. Photos are shown with
// <img> tags, which cannot send the login token, so the API hands out signed links instead: only someone
// who may see the request receives a link, and each link stops working after an hour or two.

const HOUR = 3_600_000;

/** Accepted image types, recognised by their first bytes rather than by what the upload claims to be. */
const TYPES = {
  jpeg: { ext: 'jpg', matches: (b: Buffer) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  png: { ext: 'png', matches: (b: Buffer) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  webp: { ext: 'webp', matches: (b: Buffer) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP' },
};

export type Photo = { bytes: Buffer; ext: string };

/** Checks a photo sent as a data: URL. Rejects anything that is not a real image, before anything is saved. */
export function parsePhoto(dataUrl: string): Photo {
  if (dataUrl.length > MAX_PHOTO_BYTES) fail(413, 'too_large');
  const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl);
  if (!match) return fail(400, 'invalid');
  const type = TYPES[match[1] as keyof typeof TYPES];
  const bytes = Buffer.from(match[2], 'base64');
  if (!type.matches(bytes)) fail(400, 'invalid');
  return { bytes, ext: type.ext };
}

/** Writes a checked photo for a request and returns its file name. */
export async function savePhoto(photo: Photo, requestId: string): Promise<string> {
  // The name is ours, never the user's, so it cannot point outside the uploads folder.
  const name = `${requestId}-${randomBytes(6).toString('hex')}.${photo.ext}`;
  await fs.mkdir(config.uploadsDir, { recursive: true });
  await fs.writeFile(path.join(config.uploadsDir, name), photo.bytes, { flag: 'wx' });
  return name;
}

export const deletePhoto = (name: string) => fs.rm(path.join(config.uploadsDir, name), { force: true });

const sign = (requestId: string, expires: number) => createHmac('sha256', config.photoSecret).update(`${requestId}.${expires}`).digest('base64url');

/**
 * A link to a request's photo, relative to the API's address. The expiry is rounded up to a whole hour
 * (so it is valid for 1–2 hours) and the link stays the same within that hour, which lets browsers cache it.
 */
export function photoUrl(requestId: string, now = Date.now()) {
  const expires = Math.ceil((now + HOUR) / HOUR) * HOUR;
  return `/photos/${encodeURIComponent(requestId)}?expires=${expires}&sig=${sign(requestId, expires)}`;
}

function validLink(requestId: string, expiresParam: string, sig: string) {
  const expires = Number(expiresParam);
  if (!Number.isInteger(expires) || expires < Date.now()) return false;
  const expected = Buffer.from(sign(requestId, expires));
  const given = Buffer.from(sig);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export const photosRouter = Router();

photosRouter.get('/:id', async (req, res) => {
  const id = param(req, 'id');
  if (!validLink(id, str(req.query.expires), str(req.query.sig))) fail(403, 'forbidden');
  const request = await RequestModel.findById(id, { photo: 1 }).lean();
  if (!request?.photo) fail(404, 'not_found');
  res.set({ 'Cache-Control': 'private, max-age=3600', 'X-Content-Type-Options': 'nosniff' });
  res.sendFile(request!.photo!, { root: config.uploadsDir, dotfiles: 'deny' }, (err) => {
    // The file is missing on disk (e.g. the uploads folder was not kept across a deploy).
    if (err && !res.headersSent) res.status(404).json({ code: 'not_found' });
  });
});
