/** Rupee amounts are stored with 2 decimals; comparisons happen in paise to dodge float error. */
export const round2 = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

export const toPaise = (value: number): number => Math.round(value * 100);

export const paiseEqual = (a: number, b: number): boolean => toPaise(a) === toPaise(b);
