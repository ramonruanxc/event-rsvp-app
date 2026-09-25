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
export function Stepper(_props: StepperProps): React.JSX.Element {
  return null as unknown as React.JSX.Element;
}
