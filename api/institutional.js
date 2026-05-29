const BASE = "https://www.ovalorcapital.com.br";
const LOGO = `${BASE}/images/logo-ovc.png`;
const OG_DEFAULT = `${BASE}/images/og-default.jpg`;
const GOLD = "#d4af37";
const NAVY = "#0f172a";

const EMAIL_REAL    = "ovalorcapital@gmail.com";
const EMAIL_DISPLAY = "contato@ovalorcapital.com.br";

const NAV_LINKS = [
  ["Política","/politica/"],["Economia","/economia/"],["Investimentos","/investimentos/"],
  ["Negócios","/negocios/"],["Seguros","/seguros/"],["Família","/familia/"],
];

function esc(s){ return (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

function buildHeader(){
  const navHtml = NAV_LINKS.map(([label,href])=>
    `<a href="${href}" style="color:rgba(255,255,255,.85);text-decoration:none;font-size:14px;font-weight:600;padding:6px 10px;border-radius:6px;transition:color .15s" onmouseover="this.style.color='${GOLD}'" onmouseout="this.style.color='rgba(255,255,255,.85)'">${label}</a>`
  ).join("");
  return `<header style="background:${NAVY};border-bottom:1px solid rgba(255,255,255,.08);position:sticky;top:0;z-index:999">
<div style="max-width:1400px;margin:0 auto;padding:0 24px;height:58px;display:flex;align-items:center;justify-content:space-between;gap:24px">
  <a href="/" style="text-decoration:none;font-size:22px;font-weight:900;letter-spacing:-.5px;color:${GOLD};white-space:nowrap">O VALOR CAPITAL</a>
  <nav style="display:flex;align-items:center;gap:4px;flex-wrap:wrap">${navHtml}</nav>
</div>
</header>`;
}

function buildFooter(){
  return `<footer style="background:${NAVY};border-top:1px solid rgba(255,255,255,.08);padding:40px 24px 32px;text-align:center;margin-top:auto">
<div style="max-width:960px;margin:0 auto;color:rgba(255,255,255,.6);font-size:13px;line-height:1.9">
  <strong style="color:${GOLD};font-size:16px;font-weight:900;display:block;margin-bottom:8px">O VALOR CAPITAL</strong>
  © 2026 O Valor Capital — Redação OVC. Todos os direitos reservados.&nbsp;&nbsp;<span style="font-size:.82em;opacity:.7">🔒 Conexão segura HTTPS</span>
  <br>
  <span style="display:inline-flex;flex-wrap:wrap;gap:4px 16px;justify-content:center;margin-top:10px">
    <a href="/quem-somos/" style="color:rgba(255,255,255,.45);text-decoration:none">Quem Somos</a>
    <a href="/politica-editorial/" style="color:rgba(255,255,255,.45);text-decoration:none">Política Editorial</a>
    <a href="/termos/" style="color:rgba(255,255,255,.45);text-decoration:none">Termos de Uso</a>
    <a href="/privacidade/" style="color:rgba(255,255,255,.45);text-decoration:none">Privacidade</a>
    <a href="/cookies/" style="color:rgba(255,255,255,.45);text-decoration:none">Cookies</a>
  </span>
  <span style="display:block;font-size:.76em;opacity:.45;margin-top:12px;line-height:1.6">O conteúdo tem caráter informativo e jornalístico. Não constitui recomendação de investimento. Redação OVC utiliza Inteligência Artificial supervisionada. Responsável editorial: <strong style="opacity:.8">Roberto Cesar Terrasan</strong>.</span>
</div>
</footer>`;
}

function buildQuemsomosPage(){
  return `
<!-- HERO -->
<section style="background:linear-gradient(135deg,${NAVY} 0%,#0a0f1e 50%,#111827 100%);padding:96px 24px 80px;text-align:center;position:relative;overflow:hidden">
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,rgba(212,175,55,.12) 0%,transparent 65%);pointer-events:none"></div>
  <div style="position:relative;max-width:820px;margin:0 auto">
    <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(212,175,55,.15);border:1px solid rgba(212,175,55,.35);color:${GOLD};font-size:11px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;padding:5px 18px;border-radius:3px;margin-bottom:28px">
      ◆ INSTITUCIONAL
    </div>
    <h1 style="color:#fff;font-size:clamp(2.4rem,6vw,4rem);font-weight:900;line-height:1.05;margin:0 0 20px;letter-spacing:-1.5px">Quem Somos —<br><span style="color:${GOLD}">O Valor Capital</span></h1>
    <p style="color:rgba(255,255,255,.75);font-size:1.15rem;line-height:1.7;max-width:640px;margin:0 auto 32px">Portal independente de jornalismo econômico, político e financeiro fundado em 2026, com compromisso inabalável com a verdade e a democratização da informação.</p>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <a href="/politica-editorial/" style="background:${GOLD};color:#111;font-size:14px;font-weight:800;padding:12px 28px;border-radius:6px;text-decoration:none;letter-spacing:.3px">Princípios Editoriais →</a>
      <a href="/colunistas/" style="background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.25);color:#fff;font-size:14px;font-weight:700;padding:12px 28px;border-radius:6px;text-decoration:none">Nossos Colunistas</a>
    </div>
  </div>
</section>

<!-- MISSÃO -->
<section style="background:#fff;padding:72px 24px">
  <div style="max-width:900px;margin:0 auto">
    <div style="border-left:5px solid ${GOLD};padding-left:32px;margin-bottom:56px">
      <p style="font-size:1.6rem;font-weight:700;color:#111;line-height:1.45;margin:0 0 12px">"Informação de qualidade é direito, não privilégio."</p>
      <span style="color:#64748b;font-size:.9rem;font-weight:600">— Princípio fundador do O Valor Capital</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:48px">
      <div>
        <h2 style="font-size:1.1rem;font-weight:800;color:#111;margin:0 0 14px;text-transform:uppercase;letter-spacing:1px;display:flex;align-items:center;gap:10px"><span style="display:inline-block;width:4px;height:20px;background:${GOLD};border-radius:2px"></span>Nossa Missão</h2>
        <p style="color:#374151;line-height:1.8;font-size:.97rem;margin:0">O <strong>O Valor Capital</strong> nasceu com a missão de democratizar o acesso à informação econômica e política de qualidade no Brasil. Acreditamos que um cidadão bem informado faz escolhas melhores — para si, para sua família e para o país.</p>
      </div>
      <div>
        <h2 style="font-size:1.1rem;font-weight:800;color:#111;margin:0 0 14px;text-transform:uppercase;letter-spacing:1px;display:flex;align-items:center;gap:10px"><span style="display:inline-block;width:4px;height:20px;background:${GOLD};border-radius:2px"></span>Nossa Visão</h2>
        <p style="color:#374151;line-height:1.8;font-size:.97rem;margin:0">Ser o portal de referência em economia, política e mercado financeiro para o cidadão brasileiro, combinando o rigor do jornalismo tradicional com a agilidade e escala da inteligência artificial supervisionada.</p>
      </div>
    </div>
  </div>
</section>

<!-- DIRETOR EDITORIAL -->
<section style="background:#f8fafc;padding:72px 24px;border-top:1px solid #e2e8f0">
  <div style="max-width:900px;margin:0 auto">
    <div style="text-align:center;margin-bottom:48px">
      <span style="font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:${GOLD}">LIDERANÇA EDITORIAL</span>
      <h2 style="font-size:2rem;font-weight:900;color:#111;margin:8px 0 0;letter-spacing:-.5px">Corpo Diretivo</h2>
    </div>
    <div style="background:#fff;border-radius:16px;box-shadow:0 4px 40px rgba(0,0,0,.09);overflow:hidden;display:flex;flex-wrap:wrap">
      <div style="background:linear-gradient(135deg,${NAVY} 0%,#1e3a5f 100%);padding:48px 36px;display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:220px;flex:0 0 220px">
        <div style="width:100px;height:100px;border-radius:50%;background:linear-gradient(135deg,${GOLD} 0%,#b8860b 100%);display:flex;align-items:center;justify-content:center;font-size:2.2rem;font-weight:900;color:${NAVY};margin-bottom:16px;box-shadow:0 4px 20px rgba(212,175,55,.4)">RT</div>
        <div style="text-align:center">
          <div style="color:rgba(255,255,255,.5);font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px">Fundador</div>
          <div style="color:${GOLD};font-size:12px;font-weight:800;letter-spacing:.5px">Diretor Editorial</div>
        </div>
      </div>
      <div style="padding:40px 40px 40px 36px;flex:1;min-width:260px">
        <h3 style="font-size:1.8rem;font-weight:900;color:#111;margin:0 0 6px;letter-spacing:-.5px">Roberto Cesar Terrasan</h3>
        <p style="color:${GOLD};font-size:.95rem;font-weight:700;margin:0 0 20px">Fundador, Diretor Editorial e Editor-Chefe</p>
        <p style="color:#374151;line-height:1.8;font-size:.95rem;margin:0 0 20px">Fundou o <strong>O Valor Capital</strong> em 2026 com o propósito de oferecer ao público brasileiro informação econômica e política de alta qualidade, combinando jornalismo independente com tecnologia de ponta. Responsável pela curadoria editorial e governança de dados do portal.</p>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px">
          <span style="background:#f1f5f9;color:#374151;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px">#Economia</span>
          <span style="background:#f1f5f9;color:#374151;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px">#Política</span>
          <span style="background:#f1f5f9;color:#374151;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px">#Mercado Financeiro</span>
          <span style="background:#f1f5f9;color:#374151;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px">#Jornalismo Digital</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="${GOLD}" stroke-width="2"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
          <a href="mailto:${EMAIL_REAL}" style="color:#1a56db;font-size:.9rem;font-weight:600;text-decoration:none">${EMAIL_DISPLAY}</a>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- VALORES -->
<section style="background:#fff;padding:72px 24px;border-top:1px solid #e2e8f0">
  <div style="max-width:960px;margin:0 auto">
    <div style="text-align:center;margin-bottom:48px">
      <span style="font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:${GOLD}">NOSSOS PILARES</span>
      <h2 style="font-size:2rem;font-weight:900;color:#111;margin:8px 0 0;letter-spacing:-.5px">O que nos guia</h2>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:24px">
      ${[
        ["🎯","Precisão","Verificação rigorosa de fatos em fontes primárias, documentos públicos e agências de credibilidade reconhecida."],
        ["🔓","Independência","Sem afiliações partidárias ou corporativas. Liberdade editorial total para cobrir os fatos como eles são."],
        ["🤖","Inovação","IA supervisionada otimiza o fluxo de publicação mantendo total responsabilidade editorial humana."],
        ["⚖️","Equilíbrio","Cobertura plural que apresenta múltiplos ângulos, dando voz a diferentes perspectivas e setores da sociedade."],
      ].map(([icon,title,desc])=>`
      <div style="background:#f8fafc;border-radius:12px;padding:28px 24px;border:1px solid #e2e8f0;transition:transform .2s">
        <div style="font-size:2rem;margin-bottom:14px">${icon}</div>
        <h3 style="font-size:1rem;font-weight:800;color:#111;margin:0 0 10px">${title}</h3>
        <p style="color:#64748b;font-size:.87rem;line-height:1.65;margin:0">${desc}</p>
      </div>`).join("")}
    </div>
  </div>
</section>

<!-- CANAIS DE CONTATO -->
<section style="background:linear-gradient(135deg,${NAVY} 0%,#0a0f1e 100%);padding:72px 24px">
  <div style="max-width:900px;margin:0 auto">
    <div style="text-align:center;margin-bottom:48px">
      <span style="font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:${GOLD}">FALE CONOSCO</span>
      <h2 style="font-size:2rem;font-weight:900;color:#fff;margin:8px 0 12px;letter-spacing:-.5px">Canais de Atendimento</h2>
      <p style="color:rgba(255,255,255,.6);font-size:.97rem;margin:0">Nossa equipe editorial está disponível para atender imprensa, leitores e parceiros.</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px">
      ${[
        ["📧","E-mail de Contato Geral",EMAIL_DISPLAY,`mailto:${EMAIL_REAL}`],
        ["📝","Redação e Pauta",EMAIL_DISPLAY,`mailto:${EMAIL_REAL}`],
        ["🔔","Ouvidoria e Retificações",EMAIL_DISPLAY,`mailto:${EMAIL_REAL}`],
      ].map(([icon,label,val,href])=>`
      <div style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:24px">
        <div style="font-size:1.5rem;margin-bottom:10px">${icon}</div>
        <div style="color:rgba(255,255,255,.55);font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px">${label}</div>
        <a href="${href}" style="color:${GOLD};font-size:.93rem;font-weight:700;text-decoration:none">${val}</a>
      </div>`).join("")}
      <div style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:24px">
        <div style="font-size:1.5rem;margin-bottom:10px">📍</div>
        <div style="color:rgba(255,255,255,.55);font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px">Endereço</div>
        <span style="color:rgba(255,255,255,.85);font-size:.88rem;line-height:1.6">Rua Juiz de Fora, 367<br>Via Ema — São Paulo/SP<br>CEP 03286-000</span>
      </div>
    </div>
  </div>
</section>`;
}

function buildPoliticaPage(){
  const principles = [
    {
      n:"01", title:"Precisão e Verificação de Fatos",
      icon:"🎯",
      body:`Todo o conteúdo reproduzido ou produzido pelo portal O Valor Capital passa por processo rigoroso de triagem baseado em <strong>fontes oficiais</strong>, agências de notícias de credibilidade reconhecida (Reuters, AFP, AP, Agência Brasil) e documentos públicos verificáveis. Informações sem comprovação documental não são publicadas como fato.`
    },
    {
      n:"02", title:"Independência Editorial",
      icon:"🔓",
      body:`O Valor Capital não possui afiliações políticas, partidárias ou corporativas. A linha editorial é determinada exclusivamente pelo valor jornalístico dos fatos, sem influência de anunciantes, governos ou grupos de pressão. A autonomia editorial é condição inegociável para a credibilidade do portal.`
    },
    {
      n:"03", title:"Uso Ético de Inteligência Artificial",
      icon:"🤖",
      body:`O portal utiliza sistemas de <strong>Inteligência Artificial</strong> — modelos de linguagem — para otimizar o fluxo de publicação, auxiliar na redação e ampliar a cobertura de temas econômicos e políticos. Todo conteúdo gerado ou assistido por IA é revisado e aprovado pelo responsável editorial antes da publicação. O portal assume <strong>total responsabilidade editorial</strong> por todo o conteúdo final publicado, independentemente do método de produção.`
    },
    {
      n:"04", title:"Política de Correções e Retificações",
      icon:"✏️",
      body:`Erros factuais, imprecisões ou informações desatualizadas serão corrigidos de forma transparente, com nota de retificação visível ao leitor. Solicitações de correção são analisadas em até 48 horas úteis. Não há correção retroativa de opiniões ou análises, desde que claramente identificadas como tal.`
    },
    {
      n:"05", title:"Direitos Autorais e Reprodução",
      icon:"©️",
      body:`O conteúdo editorial do portal é protegido por direitos autorais. A reprodução parcial (até 50 palavras) é permitida com citação de fonte e link para o original. Reprodução integral requer autorização expressa da redação. Imagens de terceiros são utilizadas sob licenças Creative Commons, fair use jornalístico ou com autorização.`
    },
    {
      n:"06", title:"Responsável Editorial",
      icon:"👤",
      body:`Nos termos da legislação brasileira e das normas da <strong>Federação Nacional dos Jornalistas (FENAJ)</strong>, o responsável editorial pelo portal O Valor Capital é <strong>Roberto Cesar Terrasan</strong> — Fundador, Diretor Editorial e Editor-Chefe. Contato direto: <a href="mailto:${EMAIL_REAL}" style="color:#1a56db">${EMAIL_DISPLAY}</a>. Endereço: Rua Juiz de Fora, 367 — Via Ema — São Paulo/SP — CEP 03286-000.`
    },
  ];

  const principlesHtml = principles.map(p=>`
  <div style="background:#fff;border-radius:14px;box-shadow:0 2px 20px rgba(0,0,0,.06);overflow:hidden;display:flex;flex-wrap:wrap">
    <div style="background:linear-gradient(135deg,${NAVY} 0%,#1e293b 100%);padding:32px 28px;display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:100px;flex:0 0 100px;text-align:center">
      <div style="font-size:1.8rem;margin-bottom:10px">${p.icon}</div>
      <div style="color:${GOLD};font-size:1.4rem;font-weight:900;line-height:1">${p.n}</div>
    </div>
    <div style="padding:28px 32px;flex:1;min-width:240px">
      <h3 style="font-size:1.1rem;font-weight:800;color:#111;margin:0 0 12px">${p.title}</h3>
      <p style="color:#374151;line-height:1.8;font-size:.93rem;margin:0">${p.body}</p>
    </div>
  </div>`).join("\n");

  return `
<!-- HERO -->
<section style="background:linear-gradient(135deg,${NAVY} 0%,#0a0f1e 50%,#111827 100%);padding:96px 24px 80px;text-align:center;position:relative;overflow:hidden">
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,rgba(212,175,55,.12) 0%,transparent 65%);pointer-events:none"></div>
  <div style="position:relative;max-width:820px;margin:0 auto">
    <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(212,175,55,.15);border:1px solid rgba(212,175,55,.35);color:${GOLD};font-size:11px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;padding:5px 18px;border-radius:3px;margin-bottom:28px">
      ◆ INSTITUCIONAL
    </div>
    <h1 style="color:#fff;font-size:clamp(2.2rem,5vw,3.6rem);font-weight:900;line-height:1.07;margin:0 0 20px;letter-spacing:-1px">Princípios Editoriais —<br><span style="color:${GOLD}">O Valor Capital</span></h1>
    <p style="color:rgba(255,255,255,.75);font-size:1.1rem;line-height:1.7;max-width:600px;margin:0 auto 32px">A carta de valores que norteia cada publicação do portal: independência, rigor factual e responsabilidade editorial integral.</p>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <a href="/quem-somos/" style="background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.25);color:#fff;font-size:14px;font-weight:700;padding:12px 28px;border-radius:6px;text-decoration:none">Quem Somos →</a>
      <a href="mailto:${EMAIL_REAL}" style="background:${GOLD};color:#111;font-size:14px;font-weight:800;padding:12px 28px;border-radius:6px;text-decoration:none;letter-spacing:.3px">Enviar Retificação</a>
    </div>
  </div>
</section>

<!-- INTRO QUOTE -->
<section style="background:#fff;padding:56px 24px;text-align:center;border-bottom:1px solid #e2e8f0">
  <div style="max-width:700px;margin:0 auto">
    <p style="font-size:1.4rem;font-weight:300;color:#374151;line-height:1.6;margin:0;font-style:italic">"A imparcialidade não é silêncio — é a coragem de apresentar todos os lados com a mesma seriedade e o mesmo rigor."</p>
    <div style="display:inline-flex;align-items:center;gap:8px;margin-top:16px">
      <div style="width:32px;height:2px;background:${GOLD}"></div>
      <span style="color:#64748b;font-size:.85rem;font-weight:600">Política Editorial — O Valor Capital</span>
      <div style="width:32px;height:2px;background:${GOLD}"></div>
    </div>
  </div>
</section>

<!-- PRINCIPLES -->
<section style="background:#f8fafc;padding:64px 24px">
  <div style="max-width:900px;margin:0 auto">
    <div style="text-align:center;margin-bottom:48px">
      <span style="font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:${GOLD}">DIRETRIZES</span>
      <h2 style="font-size:2rem;font-weight:900;color:#111;margin:8px 0 0;letter-spacing:-.5px">Nossos 6 Princípios</h2>
    </div>
    <div style="display:flex;flex-direction:column;gap:20px">
      ${principlesHtml}
    </div>
  </div>
</section>

<!-- CORRECTION CTA -->
<section style="background:linear-gradient(135deg,${NAVY} 0%,#0a0f1e 100%);padding:64px 24px;text-align:center">
  <div style="max-width:600px;margin:0 auto">
    <div style="font-size:2.5rem;margin-bottom:16px">✉️</div>
    <h2 style="color:#fff;font-size:1.8rem;font-weight:900;margin:0 0 12px;letter-spacing:-.5px">Encontrou um erro?</h2>
    <p style="color:rgba(255,255,255,.7);font-size:1rem;line-height:1.7;margin:0 0 28px">Nossa equipe analisa pedidos de retificação em até <strong style="color:${GOLD}">48 horas úteis</strong>. Envie o link do artigo, o trecho incorreto e a correção sugerida.</p>
    <a href="mailto:${EMAIL_REAL}?subject=Retificação%20-%20O%20Valor%20Capital" style="display:inline-block;background:${GOLD};color:#111;font-size:15px;font-weight:800;padding:14px 36px;border-radius:8px;text-decoration:none;letter-spacing:.3px">Solicitar Retificação</a>
    <div style="margin-top:16px;color:rgba(255,255,255,.4);font-size:.85rem">${EMAIL_DISPLAY}</div>
  </div>
</section>`;
}

function buildPage(pageKey){
  const isQuemSomos = pageKey === "quem-somos";
  const title    = isQuemSomos ? "Quem Somos e Expediente | O Valor Capital"          : "Política Editorial e Uso de IA | O Valor Capital";
  const metaT    = isQuemSomos ? "Quem Somos | O Valor Capital"                        : "Política Editorial | O Valor Capital";
  const desc     = isQuemSomos
    ? "Conheça o portal O Valor Capital: jornalismo independente de economia, política e mercado financeiro fundado por Roberto Cesar Terrasan."
    : "Conheça os princípios editoriais do portal O Valor Capital: verificação de fatos, política de correções e uso ético de Inteligência Artificial.";
  const canonical = isQuemSomos ? `${BASE}/quem-somos/` : `${BASE}/politica-editorial/`;
  const bodyContent = isQuemSomos ? buildQuemsomosPage() : buildPoliticaPage();

  const jsonLd = JSON.stringify({
    "@context":"https://schema.org",
    "@type": isQuemSomos ? "AboutPage" : "WebPage",
    "name": title,
    "description": desc,
    "url": canonical,
    "publisher":{"@type":"Organization","name":"O Valor Capital","logo":{"@type":"ImageObject","url":LOGO}},
    "inLanguage":"pt-BR"
  });

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(metaT)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="O Valor Capital">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${OG_DEFAULT}">
<meta property="og:url" content="${canonical}">
<meta property="og:locale" content="pt_BR">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@ovalorcapital">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${OG_DEFAULT}">
<script type="application/ld+json">${jsonLd}</script>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3652391568977586" crossorigin="anonymous"></script>
<link rel="stylesheet" href="/css/home.css">
<style>
*,*::before,*::after{box-sizing:border-box}
html,body{margin:0;padding:0}
body{font-family:system-ui,-apple-system,sans-serif;background:#f5f5f5;color:#1a1a1a}
@media(max-width:768px){nav a{display:none}nav a:first-child,nav a:nth-child(2){display:inline}}
@media(max-width:640px){
  [data-col2]{grid-template-columns:1fr!important}
  [data-flex-row]{flex-direction:column!important}
}
</style>
</head>
<body>
${buildHeader()}
<div style="min-height:80vh">
${bodyContent}
</div>
${buildFooter()}
</body>
</html>`;
}

export default async function handler(req, res){
  const url = req.query.page || req.url || "";
  const pageKey = url.includes("politica-editorial") ? "politica-editorial" : "quem-somos";
  res.setHeader("Content-Type","text/html; charset=utf-8");
  res.setHeader("Cache-Control","public, s-maxage=86400, stale-while-revalidate=3600");
  return res.status(200).send(buildPage(pageKey));
}
