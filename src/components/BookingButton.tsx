import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'inverse';
  size?: 'small' | 'default' | 'large';
  disabled?: boolean;
  className?: string;
  arrow?: boolean;
};

export function BookingButton({ children, onClick, variant = 'primary', size = 'default', disabled = false, className = '', arrow = false }: Props) {
  return (
    <button
      className={`booking-button booking-button--${variant} booking-button--${size} ${className}`}
      type="button"
      onClick={onClick}
      disabled={disabled}
    >
      <span>{children}</span>
      {arrow && <img aria-hidden="true" src="/assets/figma/imgCilArrowRight.svg" width="16" height="16" />}
    </button>
  );
}
