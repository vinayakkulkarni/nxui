/**
 * Automation-browser detection for tracker gating.
 *
 * Playwright, Puppeteer and Selenium browsers set `navigator.webdriver`.
 * Headless agent checkers (isitagentready's WebMCP probe has an 8s
 * networkidle budget) time out when third-party beacons keep the network
 * busy, and bot traffic pollutes the analytics data. Real users are never
 * gated.
 *
 * Callers that feed useHead() must skip the useHead() call itself: useHead
 * also runs during SSR, where this helper is always false.
 */
export function isAutomationBrowser(): boolean {
  if (!import.meta.client) return false;
  return navigator.webdriver === true;
}
