// Dynamic import: @cf-wasm/og/workerd only works on CF Workers, not Node.js dev

// Satori element helper — plain JS objects, no React
// Satori requires display:flex on divs with 2+ children, and chokes on children:[]
function el(
  type: string,
  style: Record<string, unknown>,
  ...children: unknown[]
) {
  const flat = children.flat().filter((c) => c != null && c !== false);
  const props: Record<string, unknown> = { style };
  if (flat.length === 1 && typeof flat[0] === 'string') {
    props.children = flat[0];
  } else if (flat.length > 0) {
    props.children = flat;
  }
  return { type, props };
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  const title = (query.title as string) || 'nxui';
  const description =
    (query.description as string) || 'Beautiful animated components for Vue.';
  const category = (query.category as string) || '';

  const element = el(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      background:
        'linear-gradient(145deg, #0f0e17 0%, #161229 50%, #1a0f2e 100%)',
      fontFamily: 'sans-serif',
      position: 'relative',
      overflow: 'hidden',
    },
    // Top-right orb
    el('div', {
      position: 'absolute',
      top: '-80px',
      right: '-60px',
      width: '300px',
      height: '300px',
      borderRadius: '50%',
      background:
        'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)',
    }),
    // Bottom-left orb
    el('div', {
      position: 'absolute',
      bottom: '-100px',
      left: '-40px',
      width: '350px',
      height: '350px',
      borderRadius: '50%',
      background:
        'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
    }),
    // Left accent bar
    el('div', {
      position: 'absolute',
      top: '60px',
      left: '0',
      width: '4px',
      height: '120px',
      borderRadius: '0 4px 4px 0',
      background: 'linear-gradient(180deg, #7c3aed, #6366f1, transparent)',
    }),
    // Content layer
    el(
      'div',
      {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: '60px 64px',
        position: 'relative',
      },
      // Category badge
      el(
        'div',
        { display: 'flex', alignItems: 'center', gap: '12px' },
        ...(category
          ? [
              el(
                'div',
                {
                  display: 'flex',
                  alignItems: 'center',
                  padding: '6px 18px',
                  backgroundColor: 'rgba(30,27,75,0.8)',
                  border: '1px solid rgba(99,102,241,0.4)',
                  borderRadius: '9999px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#a5b4fc',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                },
                category,
              ),
            ]
          : []),
      ),
      // Title + Description
      el(
        'div',
        { display: 'flex', flexDirection: 'column', gap: '20px' },
        el(
          'div',
          {
            fontSize: '68px',
            fontWeight: 800,
            color: '#fafafa',
            lineHeight: 1.05,
            letterSpacing: '-0.035em',
          },
          title,
        ),
        ...(description
          ? [
              el(
                'div',
                {
                  fontSize: '26px',
                  color: '#a8a5b8',
                  lineHeight: 1.4,
                  maxWidth: '820px',
                },
                description,
              ),
            ]
          : []),
      ),
      // Branding
      el(
        'div',
        {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        el(
          'div',
          { display: 'flex', alignItems: 'center', gap: '16px' },
          el(
            'div',
            {
              fontSize: '30px',
              fontWeight: 700,
              color: '#fafafa',
              letterSpacing: '-0.02em',
            },
            'nxui',
          ),
          el('div', {
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            backgroundColor: '#7c3aed',
          }),
          el(
            'div',
            {
              fontSize: '15px',
              fontWeight: 500,
              color: '#6b6a7a',
              letterSpacing: '0.02em',
            },
            'Vue 3 + Tailwind CSS',
          ),
        ),
        el(
          'div',
          { fontSize: '18px', color: '#6b6a7a', fontWeight: 500 },
          'nxui.geoql.in',
        ),
      ),
    ),
  );

  try {
    const { ImageResponse } = await import('@cf-wasm/og/workerd');
    const response = await ImageResponse.async(element, {
      width: 1200,
      height: 630,
    });

    const buffer = await response.arrayBuffer();

    setResponseHeaders(event, {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
    });

    return Buffer.from(buffer);
  } catch (err) {
    throw createError({
      statusCode: 500,
      message: `OG generation failed: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
});
