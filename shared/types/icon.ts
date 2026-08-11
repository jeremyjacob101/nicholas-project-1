import type { SVGProps } from "react";

export type IconName =
  | "alert"
  | "check"
  | "clock"
  | "crosshair"
  | "download"
  | "file"
  | "spinner"
  | "upload"
  | "user";

export type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
  size?: number;
};
