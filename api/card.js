export default async function handler(req, res) {
  const tag = String(req.query.tag || '').toUpperCase().slice(0, 40);
  const tema = String(req.query.tema || 'outros').toLowerCase();
  const resumo = String(req.query.resumo || '').toUpperCase().slice(0, 120);
  const img = String(req.query.img || '');
  const q = String(req.query.q || tag);

  const COLORS = {
    politica: '#c81e1e', crime: '#c81e1e', justica: '#c81e1e', corrupcao: '#c81e1e',
    economia: '#e85d00', financas: '#e85d00', mercado: '#e85d00',
  };
  const color = COLORS[tema] || '#e85d00';

  const LOGO = 'https://bfsegqdgscudtdgwdyci.supabase.co/storage/v1/object/public/cards/vc-logo.png';
  const TEMPLATE = 'https://bfsegqdgscudtdgwdyci.supabase.co/storage/v1/object/public/cards/template-ovc.jpg';

  // Proxy URL absoluta — resolve CORS
  const host = req.headers.host || 'www.ovalorcapital.com.br';
  const proto = host.includes('localhost') ? 'http' : 'https';
  const proxyBase = proto + '://' + host;
  const photoUrl = img
    ? proxyBase + '/api/imgproxy?url=' + encodeURIComponent(img) + '&q=' + encodeURIComponent(q)
    : '';

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { width:1080px; height:1350px; overflow:hidden; background:#0d1f35; font-family:'Arial Black',Arial,sans-serif; }
.wrap { position:relative; width:1080px; height:1350px; }

/* FOTO — fundo total */
.photo {
  position:absolute; top:0; left:0; width:1080px; height:1350px;
  object-fit:cover; z-index:1;
}

/* OVERLAY gradiente preto de baixo para cima */
.overlay {
  position:absolute; top:0; left:0; width:1080px; height:1350px;
  background: linear-gradient(to top,
    rgba(0,0,0,0.97) 0%,
    rgba(0,0,0,0.80) 35%,
    rgba(0,0,0,0.30) 65%,
    rgba(0,0,0,0.05) 100%
  );
  z-index:2;
}

/* HEADER — logo + nome no topo */
.header {
  position:absolute; top:55px; left:0; right:0;
  display:flex; flex-direction:column; align-items:center;
  z-index:10;
}
.header img { width:80px; height:80px; object-fit:contain; }
.header-name {
  color:#fff; font-size:26px; font-weight:900;
  letter-spacing:6px; margin-top:10px;
}

/* TAG */
.tag {
  position:absolute; top:52%; left:0; right:0;
  display:flex; justify-content:center; z-index:10;
}
.tag-box {
  background:${color}; padding:18px 52px;
}
.tag-text {
  color:#fff; font-size:52px; font-weight:900;
  letter-spacing:3px; white-space:nowrap;
}

/* RESUMO */
.resumo {
  position:absolute; top:62%; left:80px; right:80px;
  color:#fff; font-size:44px; font-weight:800;
  line-height:1.25; text-align:center;
  text-transform:uppercase; letter-spacing:1px; z-index:10;
}

/* FOOTER */
.footer {
  position:absolute; bottom:55px; left:0; right:0;
  display:flex; flex-direction:column; align-items:center;
  gap:5px; z-index:10;
}
.footer img { width:44px; height:44px; object-fit:contain; }
.footer-name { color:#fff; font-size:20px; font-weight:bold; letter-spacing:2px; }
.footer-sub { color:#cccccc; font-size:17px; }
.footer-tag { color:#aaaaaa; font-size:15px; }
</style>
</head>
<body>
<div class="wrap">

  ${photoUrl ? `<img class="photo" src="${photoUrl}" crossorigin="anonymous" onerror="this.style.display='none'"/>` : ''}
  <div class="overlay"></div>

  <div class="header">
    <img src="${LOGO}" crossorigin="anonymous"/>
    <div class="header-name">O VALOR CAPITAL</div>
  </div>

  <div class="tag">
    <div class="tag-box">
      <span class="tag-text">${tag}</span>
    </div>
  </div>

  <div class="resumo">${resumo}</div>

  <div class="footer">
    <img src="${LOGO}" crossorigin="anonymous"/>
    <div class="footer-name">O VALOR CAPITAL</div>
    <div class="footer-sub">Siga @ovalorcapital</div>
    <div class="footer-tag">Liberdade econômica, família &amp; patrimônio</div>
    <div class="footer-tag">www.ovalorcapital.com.br</div>
  </div>

</div>
</body></html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.status(200).send(html);
}
