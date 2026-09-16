import { connectDatabase, disconnectDatabase } from '../config/db';
import { Application } from '../models/application.model';
import { User, hashPassword } from '../models/user.model';
import { APPLICATION_STEP, ROLES, type Role } from '../utils/constants';

interface SeedAccount {
  name: string;
  email: string;
  password: string;
  role: Role;
}

/** One account per role, with credentials published in the README for the evaluator. */
const ACCOUNTS: SeedAccount[] = [
  { name: 'Admin User', email: 'admin@lms.test', password: 'Admin@123', role: ROLES.ADMIN },
  { name: 'Sales Executive', email: 'sales@lms.test', password: 'Sales@123', role: ROLES.SALES },
  { name: 'Sanction Executive', email: 'sanction@lms.test', password: 'Sanction@123', role: ROLES.SANCTION },
  { name: 'Disbursement Executive', email: 'disbursement@lms.test', password: 'Disburse@123', role: ROLES.DISBURSEMENT },
  { name: 'Collection Executive', email: 'collection@lms.test', password: 'Collect@123', role: ROLES.COLLECTION },
  { name: 'Demo Borrower', email: 'borrower@lms.test', password: 'Borrower@123', role: ROLES.BORROWER },
];

/** Idempotent: safe to run repeatedly, it upserts rather than duplicating or wiping data. */
const seed = async (): Promise<void> => {
  await connectDatabase();

  for (const account of ACCOUNTS) {
    const passwordHash = await hashPassword(account.password);
    const user = await User.findOneAndUpdate(
      { email: account.email },
      { $set: { name: account.name, role: account.role, passwordHash } },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );

    if (account.role === ROLES.BORROWER) {
      await Application.findOneAndUpdate(
        { userId: user._id },
        { $setOnInsert: { userId: user._id, step: APPLICATION_STEP.REGISTERED } },
        { upsert: true, setDefaultsOnInsert: true },
      );
    }

    console.log(`  ${account.role.padEnd(13)} ${account.email.padEnd(24)} ${account.password}`);
  }

  console.log('\nSeed complete.');
  await disconnectDatabase();
};

seed().catch((error: unknown) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
