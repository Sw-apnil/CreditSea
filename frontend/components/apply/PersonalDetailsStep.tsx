'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { Alert, Button, Card, Field, SelectField } from '@/components/ui';
import { api, ApiRequestError } from '@/lib/api';
import { previewBre, calculateAge } from '@/lib/bre';
import { BRE_RULES, EMPLOYMENT_MODES } from '@/lib/constants';
import type { Application } from '@/lib/types';

interface Props {
  application: Application | null;
  onDone: (application: Application) => void;
}

export const PersonalDetailsStep = ({ application, onDone }: Props) => {
  const [form, setForm] = useState({
    fullName: application?.fullName ?? '',
    pan: application?.pan ?? '',
    dob: application?.dob ? application.dob.slice(0, 10) : '',
    monthlySalary: application?.monthlySalary?.toString() ?? '',
    employmentMode: application?.employmentMode ?? 'salaried',
  });
  const [serverFailures, setServerFailures] = useState<string[]>(application?.breFailures ?? []);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Instant feedback only — the server runs these same rules and has the final say.
  const previewFailures = useMemo(() => previewBre(form), [form]);
  const age = calculateAge(form.dob);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});
    setServerFailures([]);
    try {
      const data = await api.put<{ application: Application }>('/applications/me/personal-details', {
        ...form,
        monthlySalary: Number(form.monthlySalary),
      });
      onDone(data.application);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.code === 'BRE_REJECTED') setServerFailures(err.breFailures);
        else {
          setError(err.message);
          setFieldErrors(err.fieldErrors);
        }
      } else {
        setError('Could not reach the server');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <h2 className="text-lg font-semibold text-slate-900">Personal details</h2>
      <p className="mt-1 text-sm text-slate-500">
        We check your eligibility as soon as you submit: age {BRE_RULES.MIN_AGE}–{BRE_RULES.MAX_AGE}, monthly salary of
        at least Rs. {BRE_RULES.MIN_MONTHLY_SALARY.toLocaleString('en-IN')}, a valid PAN, and employment.
      </p>

      <form onSubmit={submit} className="mt-5 space-y-4">
        {error && <Alert>{error}</Alert>}

        {serverFailures.length > 0 && (
          <Alert title="You are not eligible for a loan">
            <ul className="list-inside list-disc space-y-1">
              {serverFailures.map((failure) => (
                <li key={failure}>{failure}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs">Update your details above and submit again.</p>
          </Alert>
        )}

        <Field
          label="Full name"
          name="fullName"
          required
          value={form.fullName}
          error={fieldErrors.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="PAN"
            name="pan"
            required
            maxLength={10}
            placeholder="ABCDE1234F"
            hint="Format: 5 letters, 4 digits, 1 letter"
            value={form.pan}
            error={fieldErrors.pan}
            onChange={(e) => setForm({ ...form, pan: e.target.value.toUpperCase() })}
          />
          <Field
            label="Date of birth"
            name="dob"
            type="date"
            required
            hint={age !== null ? `Age: ${age}` : undefined}
            value={form.dob}
            error={fieldErrors.dob}
            onChange={(e) => setForm({ ...form, dob: e.target.value })}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Monthly salary (Rs.)"
            name="monthlySalary"
            type="number"
            min={0}
            required
            value={form.monthlySalary}
            error={fieldErrors.monthlySalary}
            onChange={(e) => setForm({ ...form, monthlySalary: e.target.value })}
          />
          <SelectField
            label="Employment mode"
            name="employmentMode"
            value={form.employmentMode}
            error={fieldErrors.employmentMode}
            options={EMPLOYMENT_MODES}
            onChange={(e) => setForm({ ...form, employmentMode: e.target.value })}
          />
        </div>

        {previewFailures.length > 0 && serverFailures.length === 0 && (
          <Alert tone="warning" title="These will fail the eligibility check">
            <ul className="list-inside list-disc space-y-1">
              {previewFailures.map((failure) => (
                <li key={failure}>{failure}</li>
              ))}
            </ul>
          </Alert>
        )}

        <Button type="submit" loading={loading}>
          Check eligibility & continue
        </Button>
      </form>
    </Card>
  );
};
