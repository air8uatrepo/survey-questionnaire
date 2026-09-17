'use client';

import { FormEvent, useState } from 'react';
import {
  QUESTIONNAIRE_FIELDS,
  type QuestionnaireField,
  type QuestionnaireSubmission,
} from '@/src/lib/questionnaire';

const labels: Record<QuestionnaireField, string> = {
  nickname: 'Nickname',
  organization: 'Organization',
  profession: 'Profession',
  jobTitle: 'Job title',
};

const emptyValues: QuestionnaireSubmission = {
  nickname: '',
  organization: '',
  profession: '',
  jobTitle: '',
};

const emptyFieldErrors: Record<QuestionnaireField, string> = {
  nickname: '',
  organization: '',
  profession: '',
  jobTitle: '',
};

type SubmissionFailure = {
  ok: false;
  fieldErrors?: Record<QuestionnaireField, string>;
  error?: string;
};

export function QuestionnaireForm() {
  const [values, setValues] = useState<QuestionnaireSubmission>(emptyValues);
  const [fieldErrors, setFieldErrors] = useState(emptyFieldErrors);
  const [submissionError, setSubmissionError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(false);
    setSubmissionError('');
    setFieldErrors(emptyFieldErrors);
    setIsPending(true);

    try {
      const response = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(values),
      });
      const result = await response.json() as { ok: true } | SubmissionFailure;

      if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? emptyFieldErrors);
        setSubmissionError(result.error ?? 'Unable to submit response.');
        return;
      }

      if (!response.ok) {
        setSubmissionError('Unable to submit response.');
        return;
      }

      setSubmitted(true);
    } catch {
      setSubmissionError('Unable to submit response.');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <p role="note">
        Demonstration questionnaire: do not enter real personal or business information.
      </p>
      {QUESTIONNAIRE_FIELDS.map((field) => (
        <div key={field}>
          <label htmlFor={field}>{labels[field]}</label>
          <input
            id={field}
            name={field}
            value={values[field]}
            onChange={(event) => setValues((current) => ({ ...current, [field]: event.target.value }))}
            required
            aria-describedby={`${field}-error`}
            aria-invalid={fieldErrors[field] !== ''}
          />
          <span id={`${field}-error`} role="alert">{fieldErrors[field]}</span>
        </div>
      ))}
      {submissionError !== '' ? <p role="alert">{submissionError}</p> : null}
      {submitted ? <p role="status">Submission successful</p> : null}
      <button type="submit" disabled={isPending}>{isPending ? 'Submitting…' : 'Submit'}</button>
    </form>
  );
}
