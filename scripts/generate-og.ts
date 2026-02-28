import sharp from 'sharp';
import { readdirSync } from 'node:fs';

const componentCount = readdirSync('registry/new-york', {
  withFileTypes: true,
}).filter((d) => d.isDirectory()).length;

const f = "system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f0e17"/>
      <stop offset="50%" stop-color="#161229"/>
      <stop offset="100%" stop-color="#1a0f2e"/>
    </linearGradient>
    <radialGradient id="orb1" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#7c3aed" stop-opacity="0.2"/>
      <stop offset="70%" stop-color="#7c3aed" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="orb2" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#6366f1" stop-opacity="0.12"/>
      <stop offset="70%" stop-color="#6366f1" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#7c3aed"/>
      <stop offset="70%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#6366f1" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="shimmer" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#7c3aed" stop-opacity="0"/>
      <stop offset="40%" stop-color="#7c3aed" stop-opacity="0.4"/>
      <stop offset="60%" stop-color="#a78bfa" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#7c3aed" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="spotlight" x1="0.3" y1="0" x2="0.7" y2="1">
      <stop offset="0%" stop-color="#7c3aed" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="transparent"/>
    </linearGradient>
    <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
      <circle cx="30" cy="30" r="0.6" fill="#ffffff" opacity="0.025"/>
    </pattern>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <circle cx="1000" cy="80" r="300" fill="url(#orb1)"/>
  <circle cx="120" cy="580" r="250" fill="url(#orb2)"/>

  <!-- Left accent bar -->
  <rect x="0" y="120" width="4" height="180" rx="2" fill="url(#accent)"/>

  <!-- ═══ LEFT: Text content ═══ -->
  <text x="60" y="220" font-family="${f}" font-size="96" font-weight="800" fill="#fafafa" letter-spacing="-4">nxui</text>
  <text x="62" y="274" font-family="${f}" font-size="28" font-weight="400" fill="#b0adc0">Beautiful animated components for Vue</text>

  <!-- Tech pills -->
  <g transform="translate(62, 310)">
    <rect x="0" y="0" width="86" height="34" rx="17" fill="#1e1b4b" stroke="#4338ca" stroke-opacity="0.5" stroke-width="1"/>
    <text x="43" y="22" font-family="${f}" font-size="13" font-weight="600" fill="#a5b4fc" text-anchor="middle">Vue 3</text>
    <rect x="98" y="0" width="122" height="34" rx="17" fill="#1e1b4b" stroke="#4338ca" stroke-opacity="0.5" stroke-width="1"/>
    <text x="159" y="22" font-family="${f}" font-size="13" font-weight="600" fill="#a5b4fc" text-anchor="middle">Tailwind CSS</text>
    <rect x="232" y="0" width="104" height="34" rx="17" fill="#1e1b4b" stroke="#4338ca" stroke-opacity="0.5" stroke-width="1"/>
    <text x="284" y="22" font-family="${f}" font-size="13" font-weight="600" fill="#a5b4fc" text-anchor="middle">motion-v</text>
    <rect x="348" y="0" width="170" height="34" rx="17" fill="#1e1b4b" stroke="#4338ca" stroke-opacity="0.5" stroke-width="1"/>
    <text x="433" y="22" font-family="${f}" font-size="13" font-weight="600" fill="#a5b4fc" text-anchor="middle">${componentCount}+ Components</text>
  </g>

  <!-- CLI command -->
  <g transform="translate(62, 380)">
    <rect width="520" height="44" rx="10" fill="#151320" stroke="#2a2545" stroke-width="1"/>
    <text x="18" y="28" font-family="'JetBrains Mono', 'SF Mono', Consolas, monospace" font-size="14" fill="#6b6a7a">$</text>
    <text x="36" y="28" font-family="'JetBrains Mono', 'SF Mono', Consolas, monospace" font-size="14" fill="#a5b4fc">npx shadcn-vue@latest add</text>
    <text x="310" y="28" font-family="'JetBrains Mono', 'SF Mono', Consolas, monospace" font-size="14" fill="#6b6a7a">nxui.geoql.in/r/...</text>
  </g>

  <!-- ═══ RIGHT: Component previews ═══ -->

  <!-- Card 1: Shimmer Button -->
  <g transform="translate(660, 60)">
    <rect width="500" height="170" rx="16" fill="#17152a" stroke="#2d2850" stroke-width="1"/>
    <text x="24" y="32" font-family="${f}" font-size="11" font-weight="600" fill="#6366f1" letter-spacing="0.08em">SHIMMER BUTTON</text>
    <rect x="140" y="60" width="220" height="56" rx="12" fill="#1e1b4b" stroke="#4338ca" stroke-width="1.5"/>
    <rect x="140" y="60" width="220" height="56" rx="12" fill="url(#shimmer)" opacity="0.7"/>
    <text x="250" y="96" font-family="${f}" font-size="18" font-weight="600" fill="#e0e7ff" text-anchor="middle">Shimmer Effect</text>
    <circle cx="120" cy="90" r="3" fill="#7c3aed" opacity="0.4"/>
    <circle cx="390" cy="70" r="2" fill="#a78bfa" opacity="0.3"/>
    <circle cx="410" cy="110" r="4" fill="#6366f1" opacity="0.25"/>
  </g>

  <!-- Card 2: Spotlight Card -->
  <g transform="translate(680, 250)">
    <rect width="480" height="160" rx="16" fill="#17152a" stroke="#2d2850" stroke-width="1"/>
    <text x="24" y="32" font-family="${f}" font-size="11" font-weight="600" fill="#6366f1" letter-spacing="0.08em">SPOTLIGHT CARD</text>
    <rect x="28" y="50" width="200" height="90" rx="12" fill="#1c1938" stroke="#2d2850" stroke-width="1"/>
    <circle cx="128" cy="95" r="60" fill="url(#spotlight)"/>
    <rect x="44" y="66" width="100" height="12" rx="6" fill="#3d3860" opacity="0.9"/>
    <rect x="44" y="86" width="160" height="8" rx="4" fill="#2d2850" opacity="0.7"/>
    <rect x="44" y="102" width="120" height="8" rx="4" fill="#2d2850" opacity="0.5"/>
    <rect x="250" y="50" width="200" height="90" rx="12" fill="#1c1938" stroke="#2d2850" stroke-width="1"/>
    <rect x="266" y="66" width="80" height="12" rx="6" fill="#3d3860" opacity="0.9"/>
    <rect x="266" y="86" width="140" height="8" rx="4" fill="#2d2850" opacity="0.7"/>
    <rect x="266" y="102" width="100" height="8" rx="4" fill="#2d2850" opacity="0.5"/>
    <circle cx="350" cy="95" r="50" fill="url(#spotlight)" opacity="0.6"/>
  </g>

  <!-- Card 3: Node Diagram -->
  <g transform="translate(700, 430)">
    <rect width="460" height="140" rx="16" fill="#17152a" stroke="#2d2850" stroke-width="1"/>
    <text x="24" y="30" font-family="${f}" font-size="11" font-weight="600" fill="#6366f1" letter-spacing="0.08em">NODE DIAGRAM</text>
    <circle cx="80" cy="85" r="18" fill="#1e1b4b" stroke="#4338ca" stroke-width="1.5"/>
    <circle cx="80" cy="85" r="6" fill="#7c3aed" opacity="0.6"/>
    <circle cx="200" cy="65" r="14" fill="#1e1b4b" stroke="#4338ca" stroke-width="1.5"/>
    <circle cx="200" cy="65" r="5" fill="#6366f1" opacity="0.5"/>
    <circle cx="200" cy="105" r="14" fill="#1e1b4b" stroke="#4338ca" stroke-width="1.5"/>
    <circle cx="200" cy="105" r="5" fill="#6366f1" opacity="0.5"/>
    <circle cx="320" cy="85" r="16" fill="#1e1b4b" stroke="#4338ca" stroke-width="1.5"/>
    <circle cx="320" cy="85" r="5" fill="#a78bfa" opacity="0.5"/>
    <circle cx="420" cy="75" r="12" fill="#1e1b4b" stroke="#4338ca" stroke-width="1.5"/>
    <circle cx="420" cy="75" r="4" fill="#7c3aed" opacity="0.4"/>
    <line x1="98" y1="80" x2="186" y2="67" stroke="#4338ca" stroke-width="1.5" opacity="0.5"/>
    <line x1="98" y1="90" x2="186" y2="103" stroke="#4338ca" stroke-width="1.5" opacity="0.5"/>
    <line x1="214" y1="68" x2="304" y2="82" stroke="#4338ca" stroke-width="1.5" opacity="0.4"/>
    <line x1="214" y1="102" x2="304" y2="88" stroke="#4338ca" stroke-width="1.5" opacity="0.4"/>
    <line x1="336" y1="82" x2="408" y2="76" stroke="#4338ca" stroke-width="1.5" opacity="0.3"/>
    <circle cx="150" cy="73" r="2.5" fill="#a78bfa" opacity="0.7"/>
    <circle cx="260" cy="76" r="2" fill="#a78bfa" opacity="0.5"/>
  </g>

  <!-- ═══ BOTTOM BAR ═══ -->
  <line x1="60" y1="560" x2="1140" y2="560" stroke="#2a2545" stroke-width="1" opacity="0.4"/>
  <text x="60" y="598" font-family="${f}" font-size="26" font-weight="700" fill="#fafafa" letter-spacing="-0.5">nxui</text>
  <circle cx="106" cy="590" r="3" fill="#7c3aed"/>
  <text x="120" y="598" font-family="${f}" font-size="15" font-weight="500" fill="#6b6a7a">Open source · Copy, paste, ship</text>
  <text x="1140" y="598" font-family="${f}" font-size="17" font-weight="500" fill="#6b6a7a" text-anchor="end">nxui.geoql.in</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile('public/og.png');
console.log(`✅ og.png (1200×630) — ${componentCount}+ components`);
