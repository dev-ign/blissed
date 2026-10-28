import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { images } from '../../../data/assets';
import { bookingSteps, trackBooking, type BookingCatalog, type BookingEntryContext, type BookingGateway } from '../domain/types';
import { canVisitStep } from '../domain/validation';
import { createMockBookingGateway } from '../providers/MockBookingGateway';
import { useBookingFlow } from '../hooks/useBookingFlow';
import { useBookingViewport } from '../hooks/useBookingViewport';
import { BookingSummary } from './BookingSummary';
import { ConfirmationView, stepComponents } from '../steps/BookingSteps';
import '../booking.css';

type Props = { entry: BookingEntryContext; onClose: () => void; returnFocus: HTMLElement | null };
export default function BookingDialog({ entry, onClose, returnFocus }: Props) {
  const [gateway] = useState(() => createMockBookingGateway());
  const [catalog, setCatalog] = useState<BookingCatalog | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    if (!closing) return;
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 180;
    const timeout = window.setTimeout(onClose, delay);
    return () => window.clearTimeout(timeout);
  }, [closing, onClose]);
  useEffect(() => {
    const controller = new AbortController(); setLoadError(false);
    Promise.all([gateway.getServices(controller.signal), gateway.getCalendarPolicy(controller.signal)]).then(async ([services, calendar]) => {
      const enhancements = (await Promise.all(services.map(service => gateway.getEnhancements(service.id, controller.signal)))).flat();
      if (!controller.signal.aborted) setCatalog({ services, calendar, enhancements: [...new Map(enhancements.map(e => [e.id, e])).values()] });
    }).catch(() => { if (!controller.signal.aborted) setLoadError(true); });
    return () => controller.abort();
  }, [gateway, retry]);
  return <BookingShell entry={entry} catalog={catalog} gateway={gateway} onClose={() => setClosing(true)} closing={closing} returnFocus={returnFocus} loadError={loadError} retry={() => setRetry(value => value + 1)} />;
}

function BookingShell({ entry, catalog, gateway, onClose, closing, returnFocus, loadError, retry }: Props & { catalog: BookingCatalog | null; gateway: BookingGateway; closing: boolean; loadError: boolean; retry: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useBookingViewport(dialog);
  const closeRequest = useRef<() => void>(onClose);
  useEffect(() => {
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element?.showModal();
    trackBooking({ name: 'booking_opened', source: entry.source });
    return () => {
      element?.close(); document.body.style.overflow = previousOverflow;
      const target = returnFocus?.isConnected ? returnFocus : document.querySelector<HTMLElement>('.menu-toggle');
      target?.focus({ preventScroll: true });
    };
  }, [entry.source, returnFocus]);
  function trapFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Tab') return;
    const nodes = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'));
    const focusable = nodes.filter(node => {
      if (!node.getClientRects().length || getComputedStyle(node).visibility === 'hidden' || node.tabIndex < 0) return false;
      if (node instanceof HTMLInputElement && node.type === 'radio') {
        const group = nodes.filter((item): item is HTMLInputElement => item instanceof HTMLInputElement && item.type === 'radio' && item.name === node.name);
        return node === (group.find(item => item.checked) ?? group[0]);
      }
      return true;
    });
    const first = focusable[0], last = focusable.at(-1);
    if (!first || !last) { event.preventDefault(); event.currentTarget.focus(); return; }
    if (event.shiftKey && (document.activeElement === first || !event.currentTarget.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  return <dialog className={`booking-dialog${closing ? ' is-closing' : ''}`} ref={dialog} aria-modal="true" aria-labelledby="booking-dialog-title" aria-describedby="booking-dialog-description" onKeyDown={trapFocus} onCancel={event => { event.preventDefault(); if (!closing) closeRequest.current(); }}>
    <h1 id="booking-dialog-title" className="booking-sr-only">Create your Blissed massage booking preview</h1>
    <p id="booking-dialog-description" className="booking-sr-only">A six-step demo. No appointment is reserved, no payment is taken, and no messages are sent.</p>
    {catalog ? <BookingExperience entry={entry} catalog={catalog} gateway={gateway} onClose={onClose} dialog={dialog} closeRequest={closeRequest} /> : <>
      <div className="booking-topbar"><img src={images.logo} alt="Blissed by Mayi" width="104" height="62" /><button className="booking-icon-button" type="button" aria-label="Close booking preview" onClick={onClose}>×</button></div>
      <div className="booking-loading" role="status">{loadError ? <><h2>A small pause.</h2><p>Your preview could not be opened.</p><button type="button" className="booking-primary" onClick={retry}>Try again</button></> : <><span className="booking-spinner" aria-hidden="true" /><p>Making a little space for you…</p></>}</div>
    </>}
  </dialog>;
}

type ExperienceProps = { entry: BookingEntryContext; catalog: BookingCatalog; gateway: BookingGateway; onClose: () => void; dialog: React.RefObject<HTMLDialogElement | null>; closeRequest: React.RefObject<() => void> };
function BookingExperience({ entry, catalog, gateway, onClose, dialog, closeRequest }: ExperienceProps) {
  const flow = useBookingFlow(entry, catalog, gateway);
  const { draft, dispatch, navigate, index, errors, validationAttempt, busy, failure } = flow;
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [exitConfirm, setExitConfirm] = useState(false);
  const main = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const step = bookingSteps[index];
  const Step = stepComponents[draft.currentStep];
  const currentService = catalog.services.find(s => s.id === draft.serviceId);
  const duration = currentService?.durations.find(d => d.id === draft.durationId);
  const hasProgress = !!(draft.location.address || draft.customer.firstName || draft.customer.email || draft.enhancements.length || draft.slot);
  const requestClose = () => {
    if (exitConfirm) { setExitConfirm(false); return; }
    if (draft.completed || !hasProgress) { if (!draft.completed) trackBooking({ name: 'booking_abandoned', step: draft.currentStep }); onClose(); }
    else { setSummaryOpen(false); setExitConfirm(true); }
  };
  closeRequest.current = requestClose;
  useEffect(() => {
    dialog.current?.setAttribute('aria-labelledby', exitConfirm ? 'booking-exit-title' : 'booking-dialog-title');
    if (exitConfirm) dialog.current?.setAttribute('role', 'alertdialog');
    else dialog.current?.removeAttribute('role');
  }, [exitConfirm, dialog]);
  useEffect(() => {
    main.current?.scrollTo({ top: 0, behavior: 'instant' }); setSummaryOpen(false);
    const frame = requestAnimationFrame(() => {
      if (exitConfirm) dialog.current?.querySelector<HTMLElement>('[data-keep-planning]')?.focus();
      else if (draft.completed) dialog.current?.querySelector<HTMLElement>('#booking-complete-title')?.focus();
      else heading.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [draft.currentStep, draft.completed, exitConfirm, dialog]);
  useEffect(() => {
    if (validationAttempt === 0) return;
    const frame = requestAnimationFrame(() => {
      const invalid = main.current?.querySelector<HTMLElement>('[aria-invalid="true"], input[name="experience"], input[name="duration"]') ?? main.current?.querySelector<HTMLElement>('.booking-validation-summary');
      const target = invalid?.matches('fieldset') ? invalid.querySelector<HTMLElement>('input,select,textarea') ?? invalid : invalid;
      target?.focus(); target?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    });
    return () => cancelAnimationFrame(frame);
  }, [validationAttempt]);
  function goBack() { if (summaryOpen) setSummaryOpen(false); else if (index > 0) navigate(bookingSteps[index - 1].id); }
  function edit(stepId: Parameters<typeof navigate>[0]) { setSummaryOpen(false); navigate(stepId); }
  return <>
    <header className="booking-header">
      <div className="booking-topbar">
        {!draft.completed && !exitConfirm && <button className="booking-icon-button booking-mobile-back" aria-label="Previous booking step" type="button" disabled={index === 0 || busy} onClick={goBack}>←</button>}
        <img src={images.logo} alt="Blissed by Mayi" width="104" height="62" />
        <span className="booking-topbar-tagline">A little time. A little more you.</span>
        <button className="booking-icon-button booking-close" aria-label="Close booking preview" type="button" onClick={requestClose}>×</button>
      </div>
      <div className="booking-preview-banner"><span aria-hidden="true">✧</span> Booking preview <span>·</span> No appointment will be reserved</div>
      {!draft.completed && !exitConfirm && <>
        <nav aria-label="Booking progress" className="booking-stepper"><ol>{bookingSteps.map((item, i) => <li key={item.id} className={i === index ? 'is-active' : canVisitStep(item.id, draft, catalog) && i < index ? 'is-complete' : ''}><button type="button" disabled={busy || !canVisitStep(item.id, draft, catalog)} aria-current={i === index ? 'step' : undefined} onClick={() => navigate(item.id)}><span className="booking-step-number">{i < index && canVisitStep(item.id, draft, catalog) ? '✓' : String(i + 1).padStart(2, '0')}</span><span>{item.label}</span></button></li>)}</ol></nav>
        <div className="booking-mobile-progress"><span>Step {index + 1} of {bookingSteps.length}</span><strong>{step.label}</strong><div role="progressbar" aria-label="Booking progress" aria-valuemin={0} aria-valuemax={bookingSteps.length} aria-valuenow={index + 1} aria-valuetext={`Step ${index + 1} of ${bookingSteps.length}: ${step.label}`}><span style={{ width: `${((index + 1) / bookingSteps.length) * 100}%` }} /></div></div>
      </>}
    </header>
    <div className="booking-live booking-sr-only" role="status" aria-live="polite" aria-atomic="true">{exitConfirm ? 'Leave your booking preview?' : draft.completed ? 'Preview complete. Your appointment has not been reserved.' : `Step ${index + 1} of ${bookingSteps.length}: ${step.label}`}</div>
    <div className={`booking-body ${draft.completed || exitConfirm || draft.currentStep === 'review' ? 'booking-body--wide' : ''}`}>
      <main className="booking-main" ref={main}>
        {exitConfirm ? <section className="booking-exit"><span className="booking-eyebrow">A moment before you go</span><h2 id="booking-exit-title">Leave your preview?</h2><p>Your selections and any details you entered will be discarded. You can keep planning or start fresh next time.</p></section> : draft.completed ? <ConfirmationView draft={draft} catalog={catalog} /> : <form id="booking-step-form" noValidate onSubmit={event => { event.preventDefault(); void flow.next(); }}>
          <section className="booking-step" key={draft.currentStep} aria-labelledby="booking-step-title">
            <div className="booking-step-intro"><h2 id="booking-step-title" ref={heading} tabIndex={-1}>{step.title}</h2><p>{step.description}</p></div>
            {entry.source === 'events' && draft.currentStep === 'experience' && <div className="booking-demo-note"><p>This preview explores individual massage sessions. Group and event scheduling will be handled separately.</p></div>}
            {draft.notice && <div className="booking-change-notice" role="status">{draft.notice}</div>}
            {Object.keys(errors).length > 0 && <p className="booking-validation-summary" role="alert" tabIndex={-1}>A few details need your attention. {draft.currentStep === 'review' ? `${Object.values(errors).join(' ')} Use the edit actions below to review your selections.` : 'Please check the highlighted selections or fields.'}</p>}
            {failure && <div className="booking-field-error" role="alert">{failure}{!draft.slot && draft.currentStep === 'review' && <button className="booking-edit" type="button" onClick={() => navigate('datetime')}>Choose another time →</button>}</div>}
            <fieldset className="booking-step-fields" disabled={busy}><legend className="booking-sr-only">{step.label}</legend><Step draft={draft} catalog={catalog} dispatch={dispatch} errors={errors} busy={busy} navigate={edit} gateway={gateway} /></fieldset>
          </section>
        </form>}
      </main>
      {!draft.completed && !exitConfirm && draft.currentStep !== 'review' && <aside className="booking-sidebar" aria-label="Current booking summary"><BookingSummary draft={draft} catalog={catalog} /></aside>}
    </div>
    {!draft.completed && !exitConfirm && draft.currentStep !== 'review' && <div className={`booking-mobile-summary ${summaryOpen ? 'is-open' : ''}`}>
      <button type="button" className="booking-summary-toggle" aria-expanded={summaryOpen} aria-controls="booking-summary-panel" onClick={() => setSummaryOpen(value => !value)}><span><strong>{currentService?.title ?? 'Your ritual'}</strong>{duration ? ` · ${duration.minutes} min` : ''}<small>Price to be confirmed</small></span><span aria-hidden="true">{summaryOpen ? '−' : '+'}</span></button>
      <div className="booking-summary-panel" id="booking-summary-panel" hidden={!summaryOpen}><BookingSummary draft={draft} catalog={catalog} /></div>
    </div>}
    <footer className="booking-footer">
      {exitConfirm ? <><button className="booking-secondary" type="button" data-keep-planning onClick={() => setExitConfirm(false)}>Keep planning</button><button className="booking-primary" type="button" onClick={() => { flow.cancel(); trackBooking({ name: 'booking_abandoned', step: draft.currentStep }); onClose(); }}>Discard preview</button></> : draft.completed ? <><span className="booking-footer-note">Made with care. Always.</span><button className="booking-primary" type="button" onClick={onClose}>Back to Blissed <span aria-hidden="true">↗</span></button></> : <>
        <div className="booking-footer-leading">{index > 0 ? <button type="button" className="booking-back" disabled={busy} onClick={goBack}>← <span>Back</span></button> : <span className="booking-footer-note">Your moment starts here.</span>}</div>
        {draft.currentStep === 'enhancements' && <button className="booking-skip" type="button" disabled={busy} onClick={() => { for (const selection of draft.enhancements) if (!catalog.enhancements.find(e => e.id === selection.id)?.required) dispatch({ type: 'enhancement', id: selection.id, quantity: 0 }); navigate('location'); }}>Skip for now</button>}
        <button type="submit" form="booking-step-form" formNoValidate className="booking-primary" disabled={busy || (draft.currentStep === 'datetime' && !draft.slot)} aria-busy={busy}>{busy ? <><span className="booking-spinner" aria-hidden="true" />{draft.currentStep === 'review' ? 'Checking preview…' : 'Checking coverage…'}</> : <>{draft.currentStep === 'review' ? 'Preview Confirmation' : 'Continue'}<span aria-hidden="true">→</span></>}</button>
      </>}
    </footer>
  </>;
}
