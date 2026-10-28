import type { HTMLInputAutoCompleteAttribute } from 'react';
type Props = { name: string; label: string; value: string; onChange: (value: string) => void; error?: string; hint?: string; required?: boolean; multiline?: boolean; maxLength: number; autoComplete?: HTMLInputAutoCompleteAttribute; type?: 'text' | 'email' | 'tel'; inputMode?: 'text' | 'numeric' | 'email' | 'tel'; placeholder?: string; className?: string };
export function FormField({ name, label, value, onChange, error, hint, required, multiline, maxLength, autoComplete, type = 'text', inputMode, placeholder, className = '' }: Props) {
  const id = `booking-${name}`;
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined;
  return <div className={`booking-field ${className}`}>
    <label htmlFor={id}>{label}{!required && <span> Optional</span>}</label>
    {multiline ? <textarea id={id} name={name} value={value} onChange={event => onChange(event.target.value)} maxLength={maxLength} rows={3} aria-invalid={error ? true : undefined} aria-describedby={describedBy} placeholder={placeholder} /> : <input id={id} name={name} type={type} inputMode={inputMode} value={value} onChange={event => onChange(event.target.value)} required={required} maxLength={maxLength} autoComplete={autoComplete} aria-invalid={error ? true : undefined} aria-describedby={describedBy} placeholder={placeholder} />}
    {hint && <p id={`${id}-hint`} className="booking-field-hint">{hint}</p>}
    {error && <p id={`${id}-error`} className="booking-field-error"><span aria-hidden="true">!</span> {error}</p>}
  </div>;
}
