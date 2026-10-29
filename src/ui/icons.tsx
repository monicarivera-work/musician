import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 22, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

/** The app mark: a ladder column with a pointer at one rung. */
export function Mark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect x="9" y="2" width="14" height="28" fill="#2b4bd8" />
      <g stroke="#fff" strokeWidth="2">
        <path d="M9 7h14M9 12h14M9 19h14M9 25h14" />
      </g>
      <path d="M1 16.2 9 19l-8 2.8z" fill="#ffc53d" />
      <path d="M9 19h14" stroke="#ffc53d" strokeWidth="2.6" />
    </svg>
  );
}

export const IconSong = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9 18V5l11-2v13" />
    <circle cx="6.5" cy="18" r="2.5" />
    <circle cx="17.5" cy="16" r="2.5" />
  </Icon>
);

export const IconLadder = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7 2v20M17 2v20M7 6h10M7 11h10M7 15h10M7 19h10" />
  </Icon>
);

export const IconVoice = (p: IconProps) => (
  <Icon {...p}>
    <rect x="9" y="2.5" width="6" height="11" rx="3" />
    <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21.5M8.5 21.5h7" />
  </Icon>
);

export const IconWatch = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="13.5" r="7.5" />
    <path d="M12 9.5v4.5l2.5 2M10 2.5h4M12 2.5v3.5M18.5 6.5l1.5-1.5" />
  </Icon>
);

export const IconSearch = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m15.5 15.5 5.5 5.5" />
  </Icon>
);

export const IconChords = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 3h16v18H4zM9 3v18M14 3v18M4 8h16M4 12.5h16" />
    <circle cx="11.5" cy="10.2" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="16.5" cy="14.8" r="1.3" fill="currentColor" stroke="none" />
  </Icon>
);

export const IconEar = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6.5 9a5.5 5.5 0 1 1 11 0c0 3-2.5 4-3.5 5.5S13 18 13 19a3 3 0 0 1-5.5 1.6" />
    <path d="M10 9.2a2 2 0 1 1 4 0c0 1.2-1.2 1.6-1.6 2.4" />
  </Icon>
);

export const IconFile = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 2.5h8l4.5 4.5v14.5H6z" />
    <path d="M14 2.5V7h4.5" />
    <path d="M10.5 18.5v-6.5l4-.8v5.3" />
    <circle cx="9.3" cy="18.5" r="1.3" />
    <circle cx="13.3" cy="16.5" r="1.3" />
  </Icon>
);

export const IconPlay = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7 4.5v15L19 12z" fill="currentColor" />
  </Icon>
);

export const IconStop = (p: IconProps) => (
  <Icon {...p}>
    <rect x="6" y="6" width="12" height="12" fill="currentColor" />
  </Icon>
);

export const IconReplay = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 12a8 8 0 1 0 2.4-5.7" />
    <path d="M4 3.5V8h4.5" />
  </Icon>
);

export const IconUp = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 20V5M5.5 11.5 12 5l6.5 6.5" />
  </Icon>
);

export const IconDown = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 4v15M5.5 12.5 12 19l6.5-6.5" />
  </Icon>
);

export const IconCheck = (p: IconProps) => (
  <Icon {...p}>
    <path d="m4.5 12.5 5 5 10-11" />
  </Icon>
);

export const IconClose = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
);

export const IconEdit = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 20h4L19.5 8.5l-4-4L4 16z" />
  </Icon>
);
