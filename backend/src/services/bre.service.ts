import { BRE_RULES, EMPLOYMENT_MODE, type EmploymentMode } from '../utils/constants';

export interface BreInput {
  pan: string;
  dob: Date;
  monthlySalary: number;
  employmentMode: EmploymentMode;
}

export interface BreFailure {
  rule: 'age' | 'salary' | 'pan' | 'employment';
  message: string;
}

export interface BreResult {
  passed: boolean;
  failures: BreFailure[];
  age: number;
}

/**
 * Exact age in completed years: subtracts one when this year's birthday has not happened yet.
 */
export const calculateAge = (dob: Date, asOf: Date = new Date()): number => {
  let age = asOf.getFullYear() - dob.getFullYear();
  const monthDiff = asOf.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && asOf.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
};

export const isValidPan = (pan: string): boolean => BRE_RULES.PAN_REGEX.test(pan.trim().toUpperCase());

/**
 * The Business Rule Engine. Pure and side-effect free so it is trivially unit testable.
 * Every rule runs — the borrower sees all their problems at once instead of one per round trip.
 */
export const runBre = (input: BreInput, asOf: Date = new Date()): BreResult => {
  const failures: BreFailure[] = [];
  const age = calculateAge(input.dob, asOf);

  if (age < BRE_RULES.MIN_AGE || age > BRE_RULES.MAX_AGE) {
    failures.push({
      rule: 'age',
      message: `Age must be between ${BRE_RULES.MIN_AGE} and ${BRE_RULES.MAX_AGE} years (yours is ${age}).`,
    });
  }

  if (input.monthlySalary < BRE_RULES.MIN_MONTHLY_SALARY) {
    failures.push({
      rule: 'salary',
      message: `Monthly salary must be at least Rs. ${BRE_RULES.MIN_MONTHLY_SALARY.toLocaleString('en-IN')}.`,
    });
  }

  if (!isValidPan(input.pan)) {
    failures.push({ rule: 'pan', message: 'PAN must be in the format ABCDE1234F.' });
  }

  if (input.employmentMode === EMPLOYMENT_MODE.UNEMPLOYED) {
    failures.push({ rule: 'employment', message: 'Unemployed applicants are not eligible for a loan.' });
  }

  return { passed: failures.length === 0, failures, age };
};
