import { useEffect, useRef, useState } from 'react';
import { BookingButton } from './BookingButton';
import { images } from '../data/assets';
import type { BookingEntryContext } from '../features/booking/domain/types';

const links = [
  { href: '#experience', label: 'Experience' },
  { href: '#services', label: 'Services' },
  { href: '#about', label: 'About' },
];

type Props = { onBooking: (entry: BookingEntryContext) => void };

export function Header({ onBooking }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeHash, setActiveHash] = useState(() => typeof window === 'undefined' ? '' : window.location.hash);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateHash = () => setActiveHash(window.location.hash);
    window.addEventListener('hashchange', updateHash);
    return () => window.removeEventListener('hashchange', updateHash);
  }, []);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 32);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    menuRef.current?.querySelector<HTMLAnchorElement>('a')?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
      if (event.key !== 'Tab' || !menuRef.current) return;
      const items = Array.from(menuRef.current.querySelectorAll<HTMLElement>('a, button'));
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className={`site-header ${scrolled || menuOpen ? 'site-header--scrolled' : ''}`}>
      <div className="header-inner">
        <a aria-label="Blissed by Mayi, back to top" className="brand-link" href="#home" onClick={closeMenu}>
          <img alt="Blissed by Mayi" src={images.logo} width="159" height="94" />
        </a>
        <nav aria-label="Main navigation" className="desktop-nav">
          {links.map((link) => <a href={link.href} key={link.href} aria-current={activeHash === link.href ? 'location' : undefined}>{link.label}</a>)}
          <BookingButton size="small" onClick={() => onBooking({ source: 'navigation' })}>Book a Massage</BookingButton>
        </nav>
        <button
          aria-controls="mobile-menu"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
          className={`menu-toggle ${menuOpen ? 'menu-toggle--open' : ''}`}
          onClick={() => setMenuOpen((value) => !value)}
          ref={toggleRef}
          type="button"
        >
          <span /><span />
        </button>
      </div>
      {menuOpen && (
        <div className="mobile-menu" id="mobile-menu" ref={menuRef}>
          <nav aria-label="Mobile navigation">
            {links.map((link) => <a href={link.href} key={link.href} aria-current={activeHash === link.href ? 'location' : undefined} onClick={closeMenu}>{link.label}</a>)}
            <BookingButton onClick={() => { closeMenu(); onBooking({ source: 'navigation' }); }}>Book a Massage</BookingButton>
          </nav>
        </div>
      )}
    </header>
  );
}
