import { isAutomationBrowser } from '~/utils/automation-browser';

// The @openpanel/nuxt module creates its client in its own plugin, with no
// hook to skip automation browsers. That client sends its first screen_view
// from a setTimeout(0), so turning on `disabled` here, in the same tick,
// keeps every event in the local queue: nothing reaches events.geoql.in.
// See utils/automation-browser.ts.
export default defineNuxtPlugin({
  name: 'openpanel-guard',
  dependsOn: ['openpanel'],
  setup() {
    if (!isAutomationBrowser()) return;
    useNuxtApp().$openpanel.options.disabled = true;
  },
});
