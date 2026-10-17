export interface DepthTextProps {
  /** The word or short phrase rendered as extruded type. */
  text?: string;
  /** Number of stacked copies that form the extrusion (2–64). */
  layers?: number;
  /** Spacing in pixels between each layer of the extrusion. */
  depth?: number;
  /** Color of the front face. Follows the surrounding text color by default. */
  faceColor?: string;
  /** Tint the extrusion fades into toward the back. */
  depthColor?: string;
  /** Paint the extrusion in the depth color behind the face and fade it out toward the back. */
  gradientDepth?: boolean;
  /** Resting angle and maximum pointer-driven rotation, in degrees. */
  tilt?: number;
  /** Smoothed pointer parallax on fine pointer devices. */
  pointerTracking?: boolean;
  /** Damping used to ease rotation toward the pointer target. */
  smoothing?: number;
  /** Perspective distance in pixels for the 3D stack. */
  perspective?: number;
  /** Subtle orbit when pointer tracking is unavailable or idle. */
  autoOrbit?: boolean;
  /** Speed of the fallback orbit in cycles per second. */
  orbitSpeed?: number;
  /** How far hovering presses the text into the page, 0 to 1. 0 turns it off. */
  hoverPush?: number;
  /** Let the text bob and sway gently while it is not hovered. */
  float?: boolean;
  /** CSS font-size value for the display word. */
  fontSize?: string;
  /** Font weight used for every layer. */
  fontWeight?: number | string;
  /** Soft drop shadow behind the extrusion. */
  shadow?: boolean;
  /** Draw the extrusion as stacked outlines instead of solid layers. */
  outline?: boolean;
  /** Grow the extrusion out from the flat face on mount. */
  intro?: boolean;
  class?: string;
}

export interface DepthTextLayer {
  index: number;
  color: string;
  transform: string;
}

export interface DepthTextRotation {
  x: number;
  y: number;
}

export interface DepthTextMotion {
  push: number;
  velocity: number;
  float: number;
}
