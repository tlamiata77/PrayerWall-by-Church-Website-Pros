import React from 'react';

export interface PrayingHandsProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number | string;
}

export const PrayingHands: React.FC<PrayingHandsProps> = ({
  className = 'w-4 h-4',
  size,
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size || undefined}
      height={size || undefined}
      fill="none"
      stroke="currentColor"
      strokeWidth="6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Left Sleeve Cuff (Angled pill / rounded rectangle) */}
      <rect
        x="-14"
        y="-6.5"
        width="28"
        height="13"
        rx="5.5"
        transform="translate(26, 75) rotate(45)"
      />

      {/* Right Sleeve Cuff (Angled pill / rounded rectangle) */}
      <rect
        x="-14"
        y="-6.5"
        width="28"
        height="13"
        rx="5.5"
        transform="translate(74, 75) rotate(-45)"
      />

      {/* Left Hand: Outer contour from cuff to fingertip */}
      <path d="M19 65.5 C25 61 27 50 31.5 39 C35.5 28 41 13 45.5 7.5 C47 5.5 49 5.5 50 8" />

      {/* Right Hand: Outer contour from cuff to fingertip */}
      <path d="M81 65.5 C75 61 73 50 68.5 39 C64.5 28 59 13 54.5 7.5 C53 5.5 51 5.5 50 8" />

      {/* Center seam between fingers */}
      <path d="M50 8 L50 31" />

      {/* Left Thumb: Outline from palm up to rounded thumb tip and down to center seam */}
      <path d="M37 46 C37 38.5 40.5 31 44.5 30.5 C47.5 30 49.5 32.5 50 35.5" />

      {/* Right Thumb: Outline from palm up to rounded thumb tip and down to center seam */}
      <path d="M63 46 C63 38.5 59.5 31 55.5 30.5 C52.5 30 50.5 32.5 50 35.5" />

      {/* Center seam between thumbs & palm base */}
      <path d="M50 35.5 L50 55" />

      {/* Inner wrist lines from palm base down to inner cuffs */}
      <path d="M50 55 C46.5 62.5 41 69 35.5 76" />
      <path d="M50 55 C53.5 62.5 59 69 64.5 76" />
    </svg>
  );
};

export default PrayingHands;
