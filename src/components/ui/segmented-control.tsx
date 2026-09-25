import type { LucideIcon } from 'lucide-react';
import { Icon } from './icon';

/** One option of a {@link SegmentedControl}. */
export interface SegmentOption<V extends string> {
  value: V;
  label: string;
  icon: LucideIcon;
  tone: 'success' | 'muted';
}

/** Props for {@link SegmentedControl}. */
export interface SegmentedControlProps<V extends string> {
  name: string;
  label: string;
  labelId: string;
  value: V;
  options: ReadonlyArray<SegmentOption<V>>;
  onChange: (value: V) => void;
}

/** Radio group styled as a segmented control, with an icon per option (REQ-84, REQ-70). */
export function SegmentedControl<V extends string>({
  name,
  label,
  labelId,
  value,
  options,
  onChange,
}: SegmentedControlProps<V>): React.JSX.Element {
  return (
    <div className="field">
      <p className="label" id={labelId}>
        {label}
      </p>
      <div className="seg" role="radiogroup" aria-labelledby={labelId}>
        {options.map((option) => (
          <label key={option.value} className={option.tone === 'success' ? 'going' : 'not'}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span>
              <Icon icon={option.icon} />
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
