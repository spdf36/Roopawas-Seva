import { isPin } from '@shared/data';
import { createHash, randomInt } from 'node:crypto';
import { config } from './config';
import { OtpModel } from './models';

const OTP_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;

const hashCode = (code: string) => createHash('sha256').update(code).digest('hex');

/**
 * Delivers an OTP. There is no SMS provider yet, so the code is written to the server log, where Panchayat
 * staff can read it out to the citizen. Replace this with the provider's API before going live.
 */
let sendSms = async (mobile: string, code: string) => {
  console.warn(`[OTP] No SMS provider configured – registration code for ${mobile}: ${code}`);
};

/** For tests: capture codes instead of logging them. */
export const setSmsSender = (fn: typeof sendSms) => {
  sendSms = fn;
};

/** Creates a new code for the number (replacing any earlier one) and sends it. In demo mode no code is sent. */
export async function sendOtp(mobile: string) {
  if (config.demoMode) return;
  const code = String(randomInt(0, 10_000)).padStart(4, '0');
  await OtpModel.updateOne(
    { _id: mobile },
    { codeHash: hashCode(code), attempts: 0, expiresAt: new Date(Date.now() + OTP_MINUTES * 60_000) },
    { upsert: true },
  );
  await sendSms(mobile, code);
}

/**
 * True when `code` is the current code for the number; a code works once, for OTP_MINUTES, and stops
 * working after OTP_MAX_ATTEMPTS wrong guesses. In demo mode any 4 digits pass, as the website says.
 */
export async function verifyOtp(mobile: string, code: string): Promise<boolean> {
  if (!isPin(code)) return false;
  if (config.demoMode) return true;
  const otp = await OtpModel.findOne({ _id: mobile, expiresAt: { $gt: new Date() } }).lean();
  if (!otp || otp.attempts >= OTP_MAX_ATTEMPTS) return false;
  if (otp.codeHash !== hashCode(code)) {
    await OtpModel.updateOne({ _id: mobile }, { $inc: { attempts: 1 } });
    return false;
  }
  await OtpModel.deleteOne({ _id: mobile });
  return true;
}
