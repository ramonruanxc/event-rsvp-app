/** The app's logo mark: indigo calendar with a turquoise check (REQ-75, BR-114). Decorative next to the wordmark. */
export function LogoMark(): React.JSX.Element {
  return (
    <svg
      className="mark"
      width={24}
      height={24}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      data-logo-mark=""
    >
      <rect x="3.5" y="4.5" width="17" height="17" rx="4.5" fill="#3630B0" />
      <rect
        x="7.4"
        y="2.2"
        width="2.2"
        height="5.4"
        rx="1.1"
        fill="#3630B0"
        stroke="var(--surface-2)"
        strokeWidth="1"
      />
      <rect
        x="14.4"
        y="2.2"
        width="2.2"
        height="5.4"
        rx="1.1"
        fill="#3630B0"
        stroke="var(--surface-2)"
        strokeWidth="1"
      />
      <path
        d="M8.2 14.2l2.7 2.6 5.1-5.9"
        fill="none"
        stroke="#3BDBD1"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
