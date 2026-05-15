import { ArrowRightCircleIcon } from '@heroicons/react/24/outline';

interface Props {
  onClick: () => void;
  label: string;
  className?: string;
}

export function NextButton({ onClick, label, className = '' }: Props) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 h-[44px] bg-[rgba(9,9,9,0.9)] text-white rounded-[20px] text-[20px] font-display border-none cursor-pointer ${className}`}
    >
      {label}
      <ArrowRightCircleIcon className="w-[18px] h-[18px]" />
    </button>
  );
}
