import { BRE_RULES } from './constants';

export interface BreInput {
  pan: string;
  dob: string;
  monthlySalary: number | string;
  employmentMode: string;
}

/** Exact completed years, matching the server's calculation. */
export const calculateAge = (dob: string): number | null => {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;

  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age;
};

/**
 * A copy of the server's rules, for instant feedback only.
 * The server runs these again and is the only decision that counts — a user can
 * disable JavaScript or call the API directly, so client-side checks can never be the gate.
 */
export const previewBre = (input: BreInput): string[] => {
  const failures: string[] = [];
  const age = calculateAge(input.dob);
  const salary = Number(input.monthlySalary);

  if (input.dob && age !== null && (age < BRE_RULES.MIN_AGE || age > BRE_RULES.MAX_AGE)) {
    failures.push(`Age must be between ${BRE_RULES.MIN_AGE} and ${BRE_RULES.MAX_AGE} years (yours is ${age}).`);
  }
  if (input.monthlySalary !== '' && Number.isFinite(salary) && salary < BRE_RULES.MIN_MONTHLY_SALARY) {
    failures.push(`Monthly salary must be at least Rs. ${BRE_RULES.MIN_MONTHLY_SALARY.toLocaleString('en-IN')}.`);
  }
  if (input.pan && !BRE_RULES.PAN_REGEX.test(input.pan.trim().toUpperCase())) {
    failures.push('PAN must be in the format ABCDE1234F.');
  }
  if (input.employmentMode === 'unemployed') {
    failures.push('Unemployed applicants are not eligible for a loan.');
  }
  return failures;
};
