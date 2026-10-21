import { ApiError } from '@shared/api';
import { Request } from 'express';

// Small helpers for reading request bodies safely: anything of the wrong type reads as empty, and the
// route's own validation then rejects it with 400 invalid.

export const fail = (status: number, code: ApiError['code']): never => {
  throw new ApiError(status, code);
};

/** The JSON body as a plain object (or {} when it is missing or not an object). */
export const body = (req: Request): Record<string, unknown> =>
  req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};

export const str = (v: unknown): string => (typeof v === 'string' ? v : '');

export const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

/** A route parameter (Express 5 types them loosely). */
export const param = (req: Request, name: string): string => str(req.params[name]);
