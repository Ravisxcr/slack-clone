export type Availability = 'active' | 'away' | 'dnd';

const dotColors: Record<Availability, string> = {
  active: 'bg-green-500',
  away: 'bg-yellow-400',
  dnd: 'bg-red-500',
};

const dotLabels: Record<Availability, string> = {
  active: 'Active',
  away: 'Away',
  dnd: 'Do not disturb',
};

interface AvailabilityDotProps {
  availability?: Availability | null;
  size?: 'sm' | 'md';
  borderColor?: string;
}

export const AvailabilityDot = ({ availability, size = 'sm', borderColor = 'border-[var(--workspace-sidebar)]' }: AvailabilityDotProps) => {
  if (!availability) return null;
  const sizeClass = size === 'sm' ? 'size-2.5' : 'size-3';
  return (
    <span
      aria-label={dotLabels[availability]}
      className={`block rounded-full border-2 ${borderColor} ${sizeClass} ${dotColors[availability]}`}
    />
  );
};
