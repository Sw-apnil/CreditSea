'use client';

import { useCallback, useEffect, useState } from 'react';
import { LoanConfigStep } from '@/components/apply/LoanConfigStep';
import { LoanStatusView } from '@/components/apply/LoanStatusView';
import { PersonalDetailsStep } from '@/components/apply/PersonalDetailsStep';
import { SalarySlipStep } from '@/components/apply/SalarySlipStep';
import { Stepper, stepIndexFor } from '@/components/apply/Stepper';
import { Alert, Button, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { LOAN_STATUS } from '@/lib/constants';
import type { Application, Loan } from '@/lib/types';

export default function ApplyPage() {
  const [application, setApplication] = useState<Application | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [appData, loanData] = await Promise.all([
        api.get<{ application: Application; hasActiveLoan: boolean }>('/applications/me'),
        api.get<{ loans: Loan[] }>('/loans/me'),
      ]);
      setApplication(appData.application);
      setLoans(loanData.loans);
      // Resume wherever the server says this borrower actually got to.
      setStep(stepIndexFor(appData.application.step, appData.hasActiveLoan));
    } catch {
      setError('Could not load your application');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <Spinner label="Loading your application…" />;
  if (error) return <Alert>{error}</Alert>;

  const activeLoan = loans.find((loan) =>
    ([LOAN_STATUS.APPLIED, LOAN_STATUS.SANCTIONED, LOAN_STATUS.DISBURSED] as string[]).includes(loan.status),
  );
  const furthest = stepIndexFor(application?.step ?? 'registered', Boolean(activeLoan));

  return (
    <div>
      <Stepper current={step} furthest={furthest} onSelect={setStep} />

      {step === 0 && (
        <PersonalDetailsStep
          application={application}
          onDone={(updated) => {
            setApplication(updated);
            setStep(1);
          }}
        />
      )}

      {step === 1 && (
        <SalarySlipStep
          application={application}
          onDone={(updated) => {
            setApplication(updated);
            setStep(2);
          }}
          onBack={() => setStep(0)}
        />
      )}

      {step === 2 &&
        (activeLoan ? (
          <LoanStatusView loans={loans} />
        ) : (
          <LoanConfigStep
            onApplied={(loan) => {
              setLoans([loan, ...loans]);
              setStep(3);
            }}
            onBack={() => setStep(1)}
          />
        ))}

      {step === 3 && (
        <div className="space-y-4">
          <LoanStatusView loans={loans} />
          {!activeLoan && loans.length > 0 && (
            <Button onClick={() => setStep(2)}>Apply for a new loan</Button>
          )}
        </div>
      )}
    </div>
  );
}
