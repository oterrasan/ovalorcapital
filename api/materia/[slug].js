export default function handler(req, res) {
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Matéria | O Valor Capital</title>
<meta name="description" content="Leitura completa no O Valor Capital."/>
<link rel="icon" href="/assets/vc-logo.png"/>
<link rel="stylesheet" href="/css/home.css"/>
<link rel="stylesheet" href="/css/site.css"/>
<link rel="stylesheet" href="/css/noticias.css"/>
<style>
.m-header{background:#08080f;border-bottom:1px solid rgba(255,255,255,0.08);padding:14px 24px;display:flex;align-items:center;gap:16px;position:sticky;top:0;z-index:100;}
.m-logo{font-weight:800;font-size:17px;color:#ffc800;text-decoration:none;letter-spacing:-.5px;}
.m-nav{display:flex;gap:18px;margin-left:auto;flex-wrap:wrap;}
.m-nav a{color:#94a3b8;text-decoration:none;font-size:13px;font-weight:500;}
.m-nav a:hover{color:#ffc800;}
.m-wrap{max-width:860px;margin:40px auto;padding:0 24px;}
.m-back{display:inline-flex;align-items:center;gap:6px;color:#94a3b8;text-decoration:none;font-size:13px;margin-bottom:28px;transition:color .15s;}
.m-back:hover{color:#ffc800;}
#ovc-materia-cat{display:inline-block;background:#c81e1e;color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:3px;text-transform:uppercase;letter-spacing:.5px;margin-bottom:14px;}
#ovc-materia-titulo{font-size:28px;font-weight:800;line-height:1.25;color:#f1f1f1;margin:0 0 12px;}
#ovc-materia-subtitulo{font-size:17px;color:#94a3b8;line-height:1.55;margin-bottom:14px;}
#ovc-materia-data{font-size:13px;color:#6b7280;margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,0.08);}
#ovc-materia-img{width:100%;max-height:440px;object-fit:cover;border-radius:10px;margin-bottom:28px;display:none;}
#ovc-materia-body p{font-size:17px;line-height:1.85;color:#d1d5db;margin:0 0 20px;}
#ovc-materia-body p:first-child{font-weight:500;color:#f1f1f1;}
.m-footer{border-top:1px solid rgba(255,255,255,0.08);margin-top:48px;padding-top:28px;display:flex;align-items:center;gap:16px;}
.m-footer-name{font-weight:800;font-size:14px;color:#ffc800;}
.m-footer-sub{font-size:12px;color:#6b7280;margin-top:3px;}
</style>
</head>
<body style="background:#08080f;color:#f1f1f1;min-height:100vh;margin:0;">
<header class="m-header">
  <a class="m-logo" href="/">O VALOR CAPITAL</a>
  <nav class="m-nav">
    <a href="/politica/">Política</a>
    <a href="/economia/">Economia</a>
    <a href="/investimentos/">Investimentos</a>
    <a href="/negocios/">Negócios</a>
    <a href="/seguros/">Seguros</a>
    <a href="/familia/">Família</a>
  </nav>
</header>
<div class="m-wrap">
  <a class="m-back" href="/">← Início</a>
  <div id="ovc-materia-cat">Geral</div>
  <h1 id="ovc-materia-titulo">Carregando...</h1>
  <p id="ovc-materia-subtitulo"></p>
  <div id="ovc-materia-data"></div>
  <img id="ovc-materia-img" alt=""/>
  <article id="ovc-materia-body"><p style="color:#6b7280">Carregando...</p></article>
  <div class="m-footer">
    <div>
      <div class="m-footer-name">O VALOR CAPITAL</div>
      <div class="m-footer-sub">Liberdade Econômica, Família &amp; Patrimônio · ovalorcapital.com.br</div>
    </div>
  </div>
</div>
<script src="/js/noticias.js" defer></script>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300");
  res.status(200).send(html);
}
