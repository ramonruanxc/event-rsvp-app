import { Minus, Plus } from 'lucide-react';
import { Icon } from './icon';

/** Props for {@link Stepper}. */
export interface StepperProps {
  id: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  decreaseLabel: string;
  increaseLabel: string;
  describedBy?: string;
  invalid?: boolean;
}

/** Numeric stepper with decrease/increase buttons disabled at its bounds (REQ-84, REQ-71). */
export function Stepper({
  id,
  value,
  min,
  max,
  onChange,
  decreaseLabel,
  increaseLabel,
  describedBy,
  invalid,
}: StepperProps): React.JSX.Element {
  return (
    <div className="stepper">
      <button
        type="button"
        aria-label={decreaseLabel}
        aria-controls={id}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <Icon icon={Minus} size={20} />
      </button>
      {/* 0 is an empty field: React would write "0" back into a cleared number input (REQ-138) */}
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value === 0 ? '' : value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-describedby={describedBy}
        aria-invalid={invalid ? 'true' : undefined}
      />
      <button
        type="button"
        aria-label={increaseLabel}
        aria-controls={id}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <Icon icon={Plus} size={20} />
      </button>
    </div>
  );
}
