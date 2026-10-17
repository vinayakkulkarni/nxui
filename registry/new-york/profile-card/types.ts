export type ProfileCardTheme = 'dark' | 'light';

export interface ProfileCardProps {
  /** Portrait shown on the card. */
  avatarUrl?: string;
  /** Tileable pattern image. The holo foil shows only through it. */
  iconUrl?: string;
  /** Small round image next to the handle. Hidden when not set. */
  miniAvatarUrl?: string;
  name?: string;
  title?: string;
  /** Handle shown in the footer, without the @. */
  handle?: string;
  status?: string;
  statusColor?: string;
  contactText?: string;
  showUserInfo?: boolean;
  theme?: ProfileCardTheme;
  /** Color behind the portrait. Uses the theme color when not set. */
  backdropColor?: string;
  /** Corner radius of the photo, in px. */
  radius?: number;
  /** Strength of the holographic foil, 0–1. */
  holo?: number;
  /** Strength of the light that follows the cursor, 0–1. */
  glare?: number;
  enableTilt?: boolean;
  /** Largest tilt angle, in degrees. */
  tiltStrength?: number;
  /** How far the portrait shifts as the card tilts, in px. */
  parallax?: number;
  enableMobileTilt?: boolean;
  mobileTiltSensitivity?: number;
  /** Catches the light once as the card appears, then settles. */
  intro?: boolean;
  class?: string;
}

export interface ProfileCardAxis {
  p: number;
  v: number;
  target: number;
}

export interface OrientationPermissionApi {
  requestPermission: () => Promise<string>;
}
