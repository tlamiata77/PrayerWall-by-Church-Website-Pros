import React from 'react';

interface PrayingHandsIconProps {
  className?: string;
  size?: number;
}

export const PrayingHandsIcon: React.FC<PrayingHandsIconProps> = ({
  className = 'w-4 h-4',
  size = 16,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Folded / Praying Hands Symbol */}
      <path d="M12 3.5c-.8 1.8-1.8 4.2-1.8 7.5v6.5c0 1.5-.7 2.5-2.2 3.5h8c-1.5-1-2.2-2-2.2-3.5V11c0-3.3-1-5.7-1.8-7.5z" />
      <path d="M12 3.5v17.5" />
      <path d="M7 13.5c-1 1-1.5 2.2-1.5 4 0 2 1 3.5 2 4.5" />
      <path d="M17 13.5c1 1 1.5 2.2 1.5 4 0 2-1 3.5-2 4.5" />
      <path d="M10 9.5c-.8 1.2-1.5 2.8-1.5 5" />
      <path d="M14 9.5c.8 1.2 1.5 2.8 1.5 5" />
    </svg>
  );
};
