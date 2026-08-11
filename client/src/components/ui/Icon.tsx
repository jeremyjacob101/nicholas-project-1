import type { IconProps } from "../../../../shared/types/icon";

export function Icon({ name, size = 18, className, ...props }: IconProps) {
  const classes = ["icon", `icon-${name}`, className].filter(Boolean).join(" ");

  const sharedProps = {
    ...props,
    "aria-hidden": true,
    className: classes,
    fill: "none",
    height: size,
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.7,
    viewBox: "0 0 24 24",
    width: size,
  };

  switch (name) {
    case "alert":
      return (
        <svg {...sharedProps}>
          <path d="m12 3 9 16H3L12 3Z" />
          <path d="M12 9v4M12 16h.01" />
        </svg>
      );
    case "check":
      return (
        <svg {...sharedProps}>
          <circle cx="12" cy="12" r="8.75" />
          <path d="m8.5 12.2 2.25 2.25 4.75-5" />
        </svg>
      );
    case "clock":
      return (
        <svg {...sharedProps}>
          <circle cx="12" cy="12" r="8.75" />
          <path d="M12 7.5v4.9l3.25 1.8" />
        </svg>
      );
    case "crosshair":
      return (
        <svg {...sharedProps}>
          <circle cx="12" cy="12" r="7" />
          <circle cx="12" cy="12" r="2" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </svg>
      );
    case "download":
      return (
        <svg {...sharedProps}>
          <path d="M12 3v11" />
          <path d="m7.5 9.5 4.5 4.5 4.5-4.5M5 20h14" />
        </svg>
      );
    case "file":
      return (
        <svg {...sharedProps}>
          <path d="M7 3.5h6l4 4V20.5H7z" />
          <path d="M13 3.5v4h4" />
        </svg>
      );
    case "spinner":
      return (
        <svg {...sharedProps}>
          <circle cx="12" cy="12" r="8.5" strokeDasharray="4 4" />
        </svg>
      );
    case "upload":
      return (
        <svg {...sharedProps}>
          <path d="M12 15V4" />
          <path d="m7.5 8.5 4.5-4.5 4.5 4.5M5 14.5v5h14v-5" />
        </svg>
      );
    case "user":
      return (
        <svg {...sharedProps}>
          <circle cx="12" cy="8" r="3" />
          <path d="M5 20c.45-3.4 2.75-5.25 7-5.25S18.55 16.6 19 20" />
        </svg>
      );
  }
}
