import { ImageResponse } from '@cf-wasm/og';

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path') ?? '';
  const query = getQuery(event);

  const title = (query.title as string) || 'nxui';
  const description =
    (query.description as string) ||
    'Beautiful animated components for Vue.';
  const category = (query.category as string) || '';

  const html = `
    <div style="display:flex;flex-direction:column;width:100%;height:100%;background:linear-gradient(145deg,#0f0e17 0%,#161229 50%,#1a0f2e 100%);font-family:Inter,sans-serif;position:relative;overflow:hidden;">
      <!-- Top-right orb -->
      <div style="position:absolute;top:-80px;right:-60px;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(124,58,237,0.25) 0%,transparent 70%);"></div>
      <!-- Bottom-left orb -->
      <div style="position:absolute;bottom:-100px;left:-40px;width:350px;height:350px;border-radius:50%;background:radial-gradient(circle,rgba(99,102,241,0.15) 0%,transparent 70%);"></div>
      <!-- Left accent bar -->
      <div style="position:absolute;top:60px;left:0;width:4px;height:120px;border-radius:0 4px 4px 0;background:linear-gradient(180deg,#7c3aed,#6366f1,transparent);"></div>
      <!-- Content -->
      <div style="display:flex;flex-direction:column;justify-content:space-between;width:100%;height:100%;padding:60px 64px;position:relative;">
        <!-- Category badge -->
        <div style="display:flex;align-items:center;gap:12px;">
          ${
            category
              ? `<div style="display:flex;align-items:center;padding:6px 18px;background-color:rgba(30,27,75,0.8);border:1px solid rgba(99,102,241,0.4);border-radius:9999px;font-size:14px;font-weight:600;color:#a5b4fc;letter-spacing:0.06em;text-transform:uppercase;">${category}</div>`
              : ''
          }
        </div>
        <!-- Title + Description -->
        <div style="display:flex;flex-direction:column;gap:20px;">
          <div style="font-size:68px;font-weight:800;color:#fafafa;line-height:1.05;letter-spacing:-0.035em;">${title}</div>
          ${
            description
              ? `<div style="font-size:26px;color:#a8a5b8;line-height:1.4;max-width:820px;">${description}</div>`
              : ''
          }
        </div>
        <!-- Branding -->
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:16px;">
            <div style="font-size:30px;font-weight:700;color:#fafafa;letter-spacing:-0.02em;">nxui</div>
            <div style="width:5px;height:5px;border-radius:50%;background-color:#7c3aed;"></div>
            <div style="font-size:15px;font-weight:500;color:#6b6a7a;letter-spacing:0.02em;">Vue 3 + Tailwind CSS</div>
          </div>
          <div style="font-size:18px;color:#6b6a7a;font-weight:500;">nxui.geoql.in</div>
        </div>
      </div>
    </div>
  `;

  const response = new ImageResponse(html, {
    width: 1200,
    height: 630,
  });

  // Copy Response body and set proper headers
  const buffer = await response.arrayBuffer();

  setResponseHeaders(event, {
    'Content-Type': 'image/png',
    'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
  });

  return Buffer.from(buffer);
});
