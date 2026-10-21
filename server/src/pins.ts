import bcrypt from 'bcryptjs';

// PINs are only 4 digits, so the hash mainly keeps them out of plain sight in the database and backups;
// the real protection against guessing is the login rate limit.
const COST = 10;

export const hashPin = (pin: string) => bcrypt.hash(pin, COST);

export const checkPin = (pin: string, hash: string) => bcrypt.compare(pin, hash);
