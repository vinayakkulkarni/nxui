/** One named preset from @paper-design/shaders-react, typed against the nxui wrapper props. */
export interface PaperShaderPreset<P extends object> {
  name: string;
  params: P;
}
