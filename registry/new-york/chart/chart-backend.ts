// The single swap point for the chart backend. Every chart component imports
// from this file only, so switching the whole library is a one-file change.
//
// Default: the dependency-free, hand-rolled engine in this folder.
//
// To use TanStack Charts instead (alpha — pin the exact version):
//   pnpm add @tanstack/charts@0.18.0 @tanstack/vue-charts@0.18.0
// then replace the exports below with:
//
//   export { Chart } from '@tanstack/vue-charts';
//   export { areaY, defineChart, lineY } from '@tanstack/charts';
//   export { pie, polar, radialArc } from '@tanstack/charts/polar';
//   export { scaleLinear } from '@tanstack/charts/scales/linear';
//   export { scalePoint } from '@tanstack/charts/scales/point';
//
// Chart definitions written against this file are valid TanStack Charts
// definitions, so no component code changes.
export { default as Chart } from './Chart.vue';
export {
  areaY,
  defineChart,
  lineY,
  pie,
  polar,
  radialArc,
} from './chart-marks';
export { scaleLinear, scalePoint } from './chart-scales';
