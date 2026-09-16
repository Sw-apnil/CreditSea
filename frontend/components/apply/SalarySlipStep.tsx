'use client';

import { useRef, useState } from 'react';
import { Alert, Button, Card } from '@/components/ui';
import { apiFetch, ApiRequestError } from '@/lib/api';
import { UPLOAD_RULES } from '@/lib/constants';
import type { Application } from '@/lib/types';

interface Props {
  application: Application | null;
  onDone: (application: Application) => void;
  onBack: () => void;
}

export const SalarySlipStep = ({ application, onDone, onBack }: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const existing = application?.salarySlip;

  const pick = (selected: File | undefined) => {
    setError('');
    if (!selected) return;
    // Check before uploading so the user is not made to wait for a rejection.
    if (!UPLOAD_RULES.ALLOWED_MIME_TYPES.includes(selected.type as never)) {
      setError('Only PDF, JPG or PNG files are accepted');
      return;
    }
    if (selected.size > UPLOAD_RULES.MAX_SIZE_BYTES) {
      setError('That file is larger than 5 MB');
      return;
    }
    setFile(selected);
  };

  const upload = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const body = new FormData();
      body.append('salarySlip', file);
      const data = await apiFetch<{ application: Application }>('/applications/me/salary-slip', {
        method: 'POST',
        body,
      });
      onDone(data.application);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <h2 className="text-lg font-semibold text-slate-900">Upload your salary slip</h2>
      <p className="mt-1 text-sm text-slate-500">PDF, JPG or PNG, up to 5 MB.</p>

      <div className="mt-5 space-y-4">
        {error && <Alert>{error}</Alert>}

        {existing && !file && (
          <Alert tone="success" title="Salary slip on file">
            {existing.originalName} ({Math.round(existing.size / 1024)} KB)
          </Alert>
        )}

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            pick(e.dataTransfer.files[0]);
          }}
          onClick={() => inputRef.current?.click()}
          className="cursor-pointer rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-brand-400 hover:bg-brand-50/40"
        >
          <p className="text-sm font-medium text-slate-700">
            {file ? file.name : 'Drop your salary slip here, or click to browse'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {file ? `${Math.round(file.size / 1024)} KB` : 'PDF, JPG or PNG — max 5 MB'}
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={UPLOAD_RULES.ACCEPT}
            className="hidden"
            onChange={(e) => pick(e.target.files?.[0])}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={onBack}>
            Back
          </Button>
          <Button onClick={upload} loading={loading} disabled={!file}>
            {existing ? 'Replace & continue' : 'Upload & continue'}
          </Button>
          {existing && !file && (
            <Button variant="ghost" onClick={() => onDone(application!)}>
              Keep current file & continue
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
