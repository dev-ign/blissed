import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { addDays, formatDate } from '../domain/dates';

type Props = { today: string; lastDate: string; selected: string | null; onSelect: (date: string) => void; isAvailable: (date: string) => boolean; disabled?: boolean };
function shiftMonth(month: string, amount: number) {
  const date = new Date(`${month}-01T12:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + amount);
  return date.toISOString().slice(0, 7);
}
export function CalendarPicker({ today, lastDate, selected, onSelect, isAvailable, disabled }: Props) {
  const [month, setMonth] = useState((selected ?? today).slice(0, 7));
  const [focused, setFocused] = useState(selected ?? today);
  const root = useRef<HTMLDivElement>(null);
  const lastDay = new Date(`${shiftMonth(month, 1)}-01T12:00:00Z`); lastDay.setUTCDate(0);
  const days = lastDay.getUTCDate();
  const offset = new Date(`${month}-01T12:00:00Z`).getUTCDay();
  const cells = [...Array<string | null>(offset).fill(null), ...Array.from({ length: days }, (_, index) => `${month}-${String(index + 1).padStart(2, '0')}`)];
  const firstAvailable = cells.find((date): date is string => date !== null && isAvailable(date));
  const tabDate = focused.startsWith(month) && isAvailable(focused) ? focused : selected?.startsWith(month) && isAvailable(selected) ? selected : firstAvailable;
  useEffect(() => {
    const button = root.current?.querySelector<HTMLElement>(`[data-booking-date="${tabDate}"]`);
    const strip = root.current?.querySelector<HTMLElement>('.booking-calendar-days');
    if (button && strip && strip.scrollWidth > strip.clientWidth) strip.scrollLeft += button.getBoundingClientRect().left - strip.getBoundingClientRect().left - 8;
  }, [month]);
  function moveFocus(event: KeyboardEvent<HTMLButtonElement>, date: string) {
    const changes: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7, Home: -new Date(`${date}T12:00:00Z`).getUTCDay(), End: 6 - new Date(`${date}T12:00:00Z`).getUTCDay() };
    let target: string;
    if (event.key === 'PageUp' || event.key === 'PageDown') {
      const value = new Date(`${date}T12:00:00Z`);
      const day = value.getUTCDate(); value.setUTCDate(1); value.setUTCMonth(value.getUTCMonth() + (event.key === 'PageUp' ? -1 : 1));
      const max = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 1, 0)).getUTCDate(); value.setUTCDate(Math.min(day, max));
      target = value.toISOString().slice(0, 10);
    } else if (event.key in changes) target = addDays(date, changes[event.key]);
    else return;
    event.preventDefault();
    const direction = event.key === 'Home' ? 1 : event.key === 'End' ? -1 : target < date ? -1 : 1;
    for (let tries = 0; tries < 7 && !isAvailable(target); tries++) target = addDays(target, direction);
    if (!isAvailable(target)) return;
    setFocused(target); setMonth(target.slice(0, 7));
    requestAnimationFrame(() => root.current?.querySelector<HTMLElement>(`[data-booking-date="${target}"]`)?.focus());
  }
  return <div className="booking-calendar" ref={root}>
    <div className="booking-calendar-nav">
      <h3 aria-live="polite">{formatDate(`${month}-01`, { weekday: undefined, day: undefined, month: 'long', year: 'numeric' })}</h3>
      <div><button type="button" className="booking-icon-button" aria-label="Previous month" disabled={disabled || month <= today.slice(0, 7)} onClick={() => setMonth(shiftMonth(month, -1))}>←</button><button type="button" className="booking-icon-button" aria-label="Next month" disabled={disabled || month >= lastDate.slice(0, 7)} onClick={() => setMonth(shiftMonth(month, 1))}>→</button></div>
    </div>
    <p className="booking-field-hint">Choose a day. Use arrow keys to explore, or Page Up / Down to change month.</p>
    <div role="grid" aria-label="Choose an appointment date" className="booking-calendar-days">
      <div role="row" className="booking-calendar-weekdays">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <span role="columnheader" key={day}>{day}</span>)}</div>
      {Array.from({ length: Math.ceil(cells.length / 7) }, (_, row) => <div role="row" className="booking-calendar-week" key={row}>{cells.slice(row * 7, row * 7 + 7).map((date, col) => date ? <div role="gridcell" aria-selected={selected === date} key={date} className="booking-calendar-cell"><button type="button" data-booking-date={date} disabled={disabled || !isAvailable(date)} tabIndex={tabDate === date ? 0 : -1} aria-current={date === today ? 'date' : undefined} aria-label={`${formatDate(date)}${date === today ? ', today' : ''}${!isAvailable(date) ? ', unavailable' : ''}`} aria-pressed={selected === date} onFocus={() => setFocused(date)} onKeyDown={event => moveFocus(event, date)} onClick={() => { setFocused(date); onSelect(date); }}><span className="booking-date-weekday">{formatDate(date, { weekday: 'short', month: undefined, day: undefined })}</span><span>{Number(date.slice(-2))}</span></button></div> : <div role="gridcell" className="booking-calendar-blank" key={`blank-${col}`} />)}</div>)}
    </div>
  </div>;
}
