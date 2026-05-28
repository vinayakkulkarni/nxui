export type EyeTrackingVariant = 'realistic' | 'cartoon' | 'minimal' | 'cyber';

export interface EyeTrackingProps {
  eyeSize?: number;
  gap?: number;
  irisColor?: string;
  irisColorSecondary?: string;
  pupilColor?: string;
  scleraColor?: string;
  pupilRange?: number;
  showReflection?: boolean;
  showIrisDetail?: boolean;
  idleAnimation?: boolean;
  blinkInterval?: number;
  eyeCount?: number;
  variant?: EyeTrackingVariant;
  reactivePupil?: boolean;
  showEyelids?: boolean;
  class?: string;
}
