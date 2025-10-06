// utils/token.util.ts
import { randomInt } from 'crypto';

export function generateOtp(length = 6): number {
  const max = Math.pow(10, length) - 1; // contoh 999999
  const min = Math.pow(10, length - 1); // contoh 100000

  return randomInt(min, max + 1);
}
