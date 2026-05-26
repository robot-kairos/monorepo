import type { CSSProperties } from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface Props {
  distanceCm: number;
  className?: string;
  style?: CSSProperties;
}

export function DistanceStatusPill({ distanceCm, className = '', style }: Props) {
  const optimal = distanceCm <= 10;
  return (
    <div
      className={`flex items-center justify-center px-3 h-7 rounded-[9px] text-white text-[13px] font-medium ${className}`}
      style={{
        letterSpacing: '-0.5px',
        background: optimal ? 'rgba(28,208,11,0.3)' : 'rgba(255,62,62,0.3)',
        border: '1px solid rgba(255,255,255,0.8)',
        ...style,
      }}
    >
      <InformationCircleIcon className="w-4 h-4 shrink-0 mr-1.5" />
      {optimal ? `Optimal Distance (${distanceCm}cm)` : 'Approach survivor within 10cm'}
    </div>
  );
}
