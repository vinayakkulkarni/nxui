export const particleVertexShader = `
uniform float uTime;
uniform float uSize;
uniform float uPulsate;
uniform float uPulsateSpeed;
attribute float scale;
varying vec3 vColor;
void main() {
  vColor = color;
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);
  if (uPulsate > 0.5) {
    float pulsateValue = sin(uTime * uPulsateSpeed + position.x * 10.0) * 0.5 + 0.5;
    modelPosition.y += pulsateValue * 0.02;
  }
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;
  gl_Position = projectedPosition;
  gl_PointSize = uSize * scale * (1.0 / -viewPosition.z);
}`;

export const particleFragmentShader = `
varying vec3 vColor;
uniform float uGlow;
uniform float uDensity;
void main() {
  float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
  float strength = uGlow / distanceToCenter - (uGlow * 2.0);
  strength = max(0.0, strength);
  gl_FragColor = vec4(vColor, strength * uDensity);
}`;
