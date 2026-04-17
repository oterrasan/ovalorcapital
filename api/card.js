import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const tag = (searchParams.get('tag') || 'NOTÍCIA').toUpperCase().slice(0, 40);
    const tema = (searchParams.get('tema') || 'outros').toLowerCase();
    const resumo = (searchParams.get('resumo') || '').toUpperCase().slice(0, 120);
    const img = searchParams.get('img') || '';

    const tagColor =
      tema === 'politica' || tema === 'crime' || tema === 'justica' || tema === 'corrupcao'
        ? '#c81e1e'
        : tema === 'economia' || tema === 'financas' || tema === 'mercado'
        ? '#e85d00'
        : '#e85d00';

    const LOGO = 'https://bfsegqdgscudtdgwdyci.supabase.co/storage/v1/object/public/cards/vc-logo.png';

    let imageUrl = '';
    if (img) {
      try {
        const r = await fetch(img, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (r.ok) imageUrl = img;
      } catch (_) {}
    }

    return new ImageResponse(
      (
        <div
          style={{
            width: '1080px',
            height: '1350px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0d1f35',
            fontFamily: 'sans-serif',
          }}
        >
          {/* BACKGROUND — foto da notícia ocupa 100% */}
          {imageUrl ? (
            <img
              src={imageUrl}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '1080px',
                height: '1350px',
                objectFit: 'cover',
              }}
            />
          ) : null}

          {/* OVERLAY — gradiente preto de baixo para cima */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '1080px',
              height: '1350px',
              background: imageUrl
                ? 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 45%, rgba(0,0,0,0.15) 100%)'
                : 'linear-gradient(to top, rgba(0,0,0,0.98) 0%, rgba(0,15,40,0.95) 100%)',
            }}
          />

          {/* HEADER */}
          <div
            style={{
              position: 'absolute',
              top: 60,
              left: 0,
              right: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <img src={LOGO} style={{ width: 80, height: 80, objectFit: 'contain' }} />
            <div
              style={{
                color: '#ffffff',
                fontSize: 28,
                fontWeight: 'bold',
                letterSpacing: 6,
                marginTop: 12,
              }}
            >
              O VALOR CAPITAL
            </div>
          </div>

          {/* TAG */}
          <div
            style={{
              position: 'absolute',
              top: '52%',
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                backgroundColor: tagColor,
                padding: '18px 52px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  color: '#ffffff',
                  fontSize: 52,
                  fontWeight: '900',
                  letterSpacing: 3,
                  whiteSpace: 'nowrap',
                }}
              >
                {tag}
              </span>
            </div>
          </div>

          {/* RESUMO / HEADLINE */}
          <div
            style={{
              position: 'absolute',
              top: '64%',
              left: 80,
              right: 80,
              color: '#ffffff',
              fontSize: 46,
              fontWeight: '800',
              lineHeight: 1.25,
              textAlign: 'center',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            {resumo}
          </div>

          {/* FOOTER */}
          <div
            style={{
              position: 'absolute',
              bottom: 60,
              left: 0,
              right: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <img src={LOGO} style={{ width: 44, height: 44, objectFit: 'contain' }} />
            <div style={{ color: '#ffffff', fontSize: 20, fontWeight: 'bold', letterSpacing: 2 }}>
              O VALOR CAPITAL
            </div>
            <div style={{ color: '#cccccc', fontSize: 18 }}>Siga @ovalorcapital</div>
            <div style={{ color: '#aaaaaa', fontSize: 16 }}>
              Liberdade econômica, família &amp; patrimônio
            </div>
            <div style={{ color: '#aaaaaa', fontSize: 16 }}>www.ovalorcapital.com.br</div>
          </div>
        </div>
      ),
      {
        width: 1080,
        height: 1350,
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
