import { HttpError } from './errors.js';

export const invalid = message => { throw new HttpError(422, 'invalid_fields', message); };
export function object(value, allowed) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid('A JSON object is required');
  if (Object.keys(value).some(key => !allowed.includes(key))) invalid('Unexpected field');
  return value;
}
export function text(value, name, max = 200, min = 1) {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) invalid(`${name} must contain ${min}–${max} characters`);
  return value.trim();
}
export function integer(value, name, min = 0, max = 1000000) {
  if (!Number.isSafeInteger(value) || value < min || value > max) invalid(`${name} must be an integer from ${min} to ${max}`);
  return value;
}
export function id(value) {
  if (typeof value !== 'string' || !/^[1-9][0-9]*$/.test(value) || !Number.isSafeInteger(Number(value))) throw new HttpError(400, 'invalid_id', 'Invalid resource ID');
  return Number(value);
}
export function date(value, name) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value) || !Number.isFinite(Date.parse(value))) invalid(`${name} must be a UTC ISO date`);
  return Date.parse(value);
}
export function paging(query, allowed = []) {
  if (Object.keys(query).some(key => !['page', 'pageSize', ...allowed].includes(key)) || Object.values(query).some(value => typeof value !== 'string')) throw new HttpError(400, 'invalid_query', 'Unsupported query parameter');
  const number = (value, fallback, max) => {
    if (value === undefined) return fallback;
    if (!/^[1-9][0-9]*$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) > max) throw new HttpError(400, 'invalid_query', 'Invalid pagination');
    return Number(value);
  };
  const page = number(query.page, 1, 1000000), pageSize = number(query.pageSize, 20, 100);
  return { page, pageSize, offset: (page - 1) * pageSize };
}
export const paged = (data, total, { page, pageSize }) => ({ data, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
