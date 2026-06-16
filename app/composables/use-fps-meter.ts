// Persisted preference for the demo FPS overlay. Shared across the
// floating-toolbar toggle and the demo-viewport overlay via the localStorage
// key, so the choice survives navigation. Added in response to Hacker News
// launch feedback asking for performance visibility on the WebGL demos.
export function useFpsMeter() {
  const showFps = useLocalStorage('nxui-show-fps', false);

  function toggle() {
    showFps.value = !showFps.value;
  }

  return { showFps, toggle };
}
