/**
 * Minimal, professional line-icon set (Feather/Lucide style).
 * Stroke-based, inherits currentColor. No emojis anywhere in the UI.
 */
function Svg({ size = 22, stroke = 1.75, children, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconArrowRight = (p) => <Svg {...p}><path d="M5 12h14M12 5l7 7-7 7" /></Svg>;
export const IconArrowLeft = (p) => <Svg {...p}><path d="M19 12H5M12 19l-7-7 7-7" /></Svg>;

export const IconNewspaper = (p) => (
  <Svg {...p}>
    <rect x="3" y="4" width="14" height="16" rx="1.5" />
    <path d="M17 8h2.5a1.5 1.5 0 0 1 1.5 1.5V18a2 2 0 0 1-2 2" />
    <path d="M6.5 8.5h7M6.5 12h7M6.5 15.5h4.5" />
  </Svg>
);

export const IconUsers = (p) => (
  <Svg {...p}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </Svg>
);

export const IconCalendar = (p) => (
  <Svg {...p}>
    <rect x="3" y="4.5" width="18" height="17" rx="2.5" />
    <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
  </Svg>
);

export const IconShield = (p) => (
  <Svg {...p}><path d="M12 2.5 5 5.2v5.6c0 4.6 3.1 7.4 7 8.7 3.9-1.3 7-4.1 7-8.7V5.2L12 2.5Z" /></Svg>
);

export const IconMapPin = (p) => (
  <Svg {...p}>
    <path d="M20 10.5c0 5.5-8 11-8 11s-8-5.5-8-11a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10.5" r="2.8" />
  </Svg>
);

export const IconMail = (p) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m4 7 8 6 8-6" />
  </Svg>
);

export const IconPhone = (p) => (
  <Svg {...p}>
    <path d="M22 16.9v2.6a2 2 0 0 1-2.2 2 19.5 19.5 0 0 1-8.5-3 19.2 19.2 0 0 1-6-6 19.5 19.5 0 0 1-3-8.6A2 2 0 0 1 4.3 2H7a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.7a16 16 0 0 0 6 6l1.2-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z" />
  </Svg>
);

export const IconExternal = (p) => (
  <Svg {...p}>
    <path d="M15 3h6v6M21 3l-9 9" />
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  </Svg>
);

export const IconDashboard = (p) => (
  <Svg {...p}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </Svg>
);

export const IconLogout = (p) => (
  <Svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></Svg>
);

export const IconMenu = (p) => <Svg {...p}><path d="M3 6h18M3 12h18M3 18h18" /></Svg>;

export const IconUser = (p) => (
  <Svg {...p}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </Svg>
);

export const IconGlobe = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.4 2.5 15.6 0 18M12 3c-2.5 2.4-2.5 15.6 0 18" />
  </Svg>
);

export const IconRuler = (p) => (
  <Svg {...p}>
    <path d="M21.3 8.7 8.7 21.3a1 1 0 0 1-1.4 0l-4.6-4.6a1 1 0 0 1 0-1.4L15.3 2.7a1 1 0 0 1 1.4 0l4.6 4.6a1 1 0 0 1 0 1.4Z" />
    <path d="m7.8 10.7 2 2M10.8 7.7l2 2M13.8 4.7l2 2M4.8 13.7l2 2" />
  </Svg>
);

export const IconBall = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.4 15.3 9.8 14 13.7 10 13.7 8.7 9.8 Z" />
    <path d="M12 3v4.4M4.4 9.3l4.3 0.5M19.6 9.3l-4.3 0.5M7.7 19.4l2.3-3.7M16.3 19.4l-2.3-3.7" />
  </Svg>
);

export const IconTable = (p) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 9h18M3 14.5h18M9 4v16" />
  </Svg>
);

export const IconChevronDown = (p) => <Svg {...p}><path d="m6 9 6 6 6-6" /></Svg>;

export const IconLayers = (p) => (
  <Svg {...p}>
    <path d="m12 2 9 5-9 5-9-5 9-5Z" />
    <path d="m3 12 9 5 9-5M3 17l9 5 9-5" />
  </Svg>
);

export const IconInbox = (p) => (
  <Svg {...p}>
    <path d="M22 12h-5l-2 3h-6l-2-3H2" />
    <path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1Z" />
  </Svg>
);
