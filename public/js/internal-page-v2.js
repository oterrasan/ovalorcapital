(function(){
  'use strict';

  var SLUG_TO_CAT = {
    tributos:'tributacao', tributacao:'tributacao',
    politica:'politica', economia:'economia', negocios:'negocios',
    financas:'financas', investimentos:'financas', seguros:'financas', mercados:'financas',
    educacao:'educacao', industria:'industria', tecnologia:'tecnologia',
    esportes:'esportes', saude:'saude', familia:'familia',
    internacional:'internacional', variedades:'variedades',
    parcerias:'parcerias', regulacao:'regulacao', vc:'vc', colunistas:'vc',
    investigativo:'investigativo', seguranca:'seguranca',
    cultura:'cultura', profissoes:'profissoes', vagas:'vagas',
    concursos:'concursos', imoveis:'imoveis', esg:'esg', defesa:'defesa', religiao:'religiao',
    radar:'radar',
    'brasil-on':'brasil-on', carreira:'carreira'
  };
  var CATEGORY_ALIASES = {
    'brasil-on': ['brasil-on','seguranca','investigativo','variedades','defesa','esg'],
    'carreira': ['carreira','vagas','concursos','profissoes','parcerias','educacao'],
    'financas': ['financas','investimentos','seguros','mercados']
  };
  var LABEL = {
    politica:'Política', economia:'Economia', negocios:'Negócios',
    financas:'Finanças', investimentos:'Investimentos', mercados:'Mercados', tributacao:'Tributação',
    regulacao:'Regulação', seguros:'Seguros', saude:'Saúde', familia:'Família',
    tecnologia:'Tecnologia', industria:'Indústria', educacao:'Educação',
    esportes:'Esportes', internacional:'Internacional', variedades:'Variedades',
    parcerias:'Parcerias', vc:'OVC', colunistas:'Colunistas',
    investigativo:'Investigativo', seguranca:'Segurança Pública',
    cultura:'Cultura', profissoes:'Profissões', vagas:'Vagas',
    concursos:'Concursos Públicos', imoveis:'Imóveis', esg:'ESG', defesa:'Defesa', religiao:'Fé & Espiritualidade',
    radar:'Radar OVC',
    'brasil-on':'Brasil On', carreira:'Carreira'
  };
  var CORES = {
    politica:'#dc2626', economia:'#2563eb', negocios:'#7c3aed',
    financas:'#059669', investimentos:'#059669', mercados:'#0891b2', tributacao:'#b45309',
    regulacao:'#9333ea', seguros:'#0284c7', saude:'#16a34a',
    familia:'#db2777', tecnologia:'#6366f1', industria:'#ea580c',
    educacao:'#8b5cf6', esportes:'#16a34a', internacional:'#dc2626',
    variedades:'#ec4899', parcerias:'#14b8a6', vc:'#ffc800', colunistas:'#ffc800',
    investigativo:'#1a1a2e', seguranca:'#7f1d1d',
    cultura:'#7e22ce', profissoes:'#0369a1', vagas:'#065f46',
    concursos:'#1e40af', imoveis:'#b45309', esg:'#166534', defesa:'#1e3a5f', religiao:'#6d28d9',
    radar:'#f97316',
    'brasil-on':'#b91c1c', carreira:'#0f766e'
  };
  var CAT_PATH = {
    politica:'politica', economia:'economia', negocios:'negocios',
    financas:'financas', investimentos:'financas', seguros:'financas', mercados:'financas',
    educacao:'educacao', industria:'industria', tecnologia:'tecnologia',
    esportes:'esportes', saude:'saude', familia:'familia',
    tributacao:'tributos', regulacao:'regulacao', parcerias:'parcerias',
    vc:'vc', colunistas:'vc', internacional:'internacional',
    variedades:'variedades', geral:'politica',
    investigativo:'investigativo', seguranca:'seguranca',
    cultura:'cultura', profissoes:'profissoes', vagas:'vagas',
    concursos:'concursos', imoveis:'imoveis', esg:'esg', defesa:'defesa', religiao:'religiao',
    radar:'radar',
    'brasil-on':'brasil-on', carreira:'carreira'
  };

  function lbl(c){ return LABEL[c]||c||'Geral'; }
  function cor(c){ return CORES[c]||CORES[SLUG_TO_CAT[c]]||'#dc2626'; }
  function esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function stripMd(s){ return (s||'').replace(/\*\*([^*\n]*)\*\*/g,'$1').replace(/^#+\s*/,'').trim(); }
  function dataCurta(dt){
    if(!dt) return '';
    try{ return new Date(dt).toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'}); }
    catch(_){ return ''; }
  }
  function dataLonga(dt){
    if(!dt) return '';
    try{ return new Date(dt).toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'}); }
    catch(_){ return ''; }
  }
  function slugify(s){
    return (s||'').toLowerCase().normalize('NFD')
      .replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9\s-]/g,'')
      .trim().replace(/\s+/g,'-').slice(0,55);
  }
  function buildUrl(p){
    var cat = p.categoria||'geral';
    var cp = CAT_PATH[cat]||CAT_PATH[SLUG_TO_CAT[cat]]||'politica';
    var sl = p.slug ? p.slug.slice(0,55) : slugify(p.titulo||'');
    var id8 = (p.id||'').slice(0,8);
    return '/'+cp+'/'+sl+'-'+id8+'/';
  }

  function quebrarParagrafos(html){
    if(!html) return html;
    var prev, r = html, passes = 0;
    do {
      prev = r;
      r = r.replace(/<p[^>]*>([\s\S]+?)<\/p>/gi, function(match, inner){
        if(inner.length < 300) return match;
        var partes = inner.split(/([.!?]["»]?\s+)/);
        var frases = [], buf = '';
        for(var i = 0; i < partes.length; i++){
          buf += partes[i];
          if(/[.!?]["»]?\s*$/.test(buf) && buf.trim().length > 60){ frases.push(buf.trim()); buf = ''; }
        }
        if(buf.trim()) frases.push(buf.trim());
        if(frases.length <= 1){
          var words = inner.split(/\s+/), wchunk = '', wchars = 0, wsplits = [];
          words.forEach(function(w){ wchunk += (wchunk?' ':'')+w; wchars += w.length+1; if(wchars>220&&/[,;]$/.test(w)){wsplits.push(wchunk.trim());wchunk='';wchars=0;} });
          if(wchunk.trim()) wsplits.push(wchunk.trim());
          if(wsplits.length <= 1) return match;
          frases = wsplits;
        }
        var maxG = passes === 0 ? 3 : 2;
        var out = '', chk = '', cnt = 0;
        frases.forEach(function(f){ chk += (chk?' ':'')+f; cnt++; if(cnt >= maxG){ out += '<p>'+chk+'</p>\n'; chk=''; cnt=0; } });
        if(chk) out += '<p>'+chk+'</p>';
        return out;
      });
      passes++;
    } while(r !== prev && passes < 5);
    return r;
  }
  function renderCorpo(texto){
    if(!texto) return '';
    if(/^\s*<[a-z]/i.test(texto.trim())){
      var html=quebrarParagrafos(texto);
      return '<style>.ovc-corpo p{margin:0 0 22px;font-size:17px;line-height:1.9;color:var(--text-main,#1e293b)}.ovc-corpo h2{font-size:20px;font-weight:800;margin:32px 0 12px;border-left:3px solid var(--ovc-accent,#dc2626);padding-left:12px;color:var(--text-main,#0f172a)}.ovc-corpo h3{font-size:18px;font-weight:700;margin:24px 0 10px;color:var(--text-main,#0f172a)}.ovc-corpo strong,.ovc-corpo b{font-weight:700}.ovc-corpo blockquote{border-left:3px solid var(--ovc-accent,#dc2626);padding:12px 16px;margin:20px 0;font-style:italic;color:#475569;background:rgba(0,0,0,.03);border-radius:0 6px 6px 0}.ovc-corpo ul,.ovc-corpo ol{margin:0 0 22px;padding-left:24px}.ovc-corpo li{margin-bottom:8px;font-size:17px;line-height:1.8;color:var(--text-main,#1e293b)}</style><div class="ovc-corpo" style="font-size:17px;line-height:1.9;color:var(--text-main,#1e293b);">'+html+'</div>';
    }
    var lines = texto.split('\n'), html = '', htags = [];
    for(var i=0;i<lines.length;i++){
      var t = lines[i].trim();
      if(!t) continue;
      if(/^##\s+/.test(t)){
        html += '<h2 style="font-size:21px;font-weight:800;line-height:1.25;margin:36px 0 14px;color:var(--text-main,#0f172a);border-left:3px solid var(--ovc-accent,#dc2626);padding-left:14px;">'+esc(t.replace(/^##\s+/,''))+'</h2>';
      } else if(/^(#[^\s#,]+[\s,]*)+$/.test(t) && t[0]==='#'){
        htags = htags.concat(t.match(/#[^\s#,]+/g)||[]);
      } else if(/^Redação OVC/i.test(t)){
        html += '<p style="font-size:13px;font-weight:600;color:#94a3b8;margin:0 0 24px;padding-bottom:16px;border-bottom:1px solid #e2e8f0;">'+esc(t)+'</p>';
      } else if(/^<\/?[a-z]/i.test(t)){
        // Linha já é uma tag HTML de verdade (ex: <figure>/<img>/</figure>
        // inseridos via "+ Inserir imagem no meio do texto" no admin, em
        // corpo que não começa com <p> e por isso cai neste modo legado
        // linha-a-linha). Nunca escapar — senão a tag aparece como texto
        // visível na página em vez de renderizar a imagem. Bug real
        // reportado por Roberto 12/08/2026.
        html += t;
      } else {
        html += '<p style="font-size:17px;line-height:1.9;color:var(--text-main,#1e293b);margin:0 0 22px;">'+esc(t)+'</p>';
      }
    }
    if(htags.length){
      html += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin:28px 0 0;">'
        +htags.map(function(t){ return '<span style="font-size:12px;font-weight:600;color:#475569;background:#f1f5f9;padding:4px 12px;border-radius:20px;">'+esc(t)+'</span>'; }).join('')
        +'</div>';
    }
    return html;
  }

  function injetarProgressBar(acento){
    var bar = document.createElement('div');
    bar.id = 'ovc-progress-bar';
    bar.style.cssText = 'position:fixed;top:0;left:0;height:3px;width:0%;background:'+acento+';z-index:9999;transition:width 0.1s linear;pointer-events:none;box-shadow:0 0 6px '+acento+'88;';
    document.body.appendChild(bar);
    function atualizar(){
      var scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if(scrollable <= 0){ bar.style.width='100%'; return; }
      var pct = Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100));
      bar.style.width = pct + '%';
    }
    window.addEventListener('scroll', atualizar, {passive:true});
    atualizar();
  }

  function estimarLeitura(texto){
    if(!texto) return '1 min';
    var palavras = texto.trim().split(/\s+/).length;
    var mins = Math.max(1, Math.round(palavras / 200));
    return mins + ' min de leitura';
  }

  function renderShare(titulo, urlRel){
    var full = 'https://ovalorcapital.com.br'+urlRel;
    var idMatch = urlRel.match(/[?&]id=([a-f0-9-]+)/i) || urlRel.match(/-([a-f0-9]{8})\/?$/i);
    var shareUrl = idMatch ? 'https://ovalorcapital.com.br/og?id='+idMatch[1] : full;
    var eu = encodeURIComponent(shareUrl);
    var et = encodeURIComponent((titulo||'O Valor Capital')+' — O Valor Capital');
    var copyFull = full.replace(/'/g,"\\'");
    return '<div style="margin:18px 0 26px;">'
      +'<div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.1em;margin-bottom:10px;">Compartilhar esta matéria</div>'
      +'<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">'
        +'<a href="https://api.whatsapp.com/send?text='+et+'%20'+eu+'" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:5px;background:#25D366;color:#fff;padding:8px 14px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:700;">WhatsApp</a>'
        +'<a href="https://www.facebook.com/sharer/sharer.php?u='+eu+'" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:5px;background:#1877F2;color:#fff;padding:8px 14px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:700;">Facebook</a>'
        +'<a href="https://www.linkedin.com/shareArticle?mini=true&url='+eu+'&title='+et+'" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:5px;background:#0A66C2;color:#fff;padding:8px 14px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:700;">LinkedIn</a>'
        +'<a href="https://t.me/share/url?url='+eu+'&text='+et+'" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:5px;background:#229ED9;color:#fff;padding:8px 14px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:700;">Telegram</a>'
        +'<a href="https://twitter.com/intent/tweet?text='+et+'&url='+eu+'" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:5px;background:#000;color:#fff;padding:8px 14px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:700;">X</a>'
        +'<a href="mailto:?subject='+et+'&body=Veja+esta+mat%C3%A9ria+do+O+Valor+Capital%3A+'+eu+'" style="display:inline-flex;align-items:center;gap:5px;background:#64748b;color:#fff;padding:8px 14px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:700;">E-mail</a>'
        +'<button onclick="(function(b){var u=\''+copyFull+'\';if(navigator.clipboard){navigator.clipboard.writeText(u).then(function(){b.textContent=\'Copiado!\';setTimeout(function(){b.textContent=\'Copiar link\';},2200);})}else{var t=document.createElement(\'textarea\');t.value=u;document.body.appendChild(t);t.select();document.execCommand(\'copy\');document.body.removeChild(t);b.textContent=\'Copiado!\';setTimeout(function(){b.textContent=\'Copiar link\';},2200);};})(this)" style="display:inline-flex;align-items:center;gap:5px;background:#f1f5f9;color:#0f172a;padding:8px 14px;border-radius:8px;font-size:13px;font-weight:700;border:1px solid #e2e8f0;cursor:pointer;">Copiar link</button>'
      +'</div>'
    +'</div>';
  }

  function renderCTA(){
    return '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:14px;padding:32px 28px;margin:48px 0 0;text-align:center;">'
      +'<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.14em;color:#ffc800;margin-bottom:10px;">Fale com a Redação OVC</div>'
      +'<h3 style="font-size:20px;font-weight:800;color:#f1f5f9;margin:0 0 10px;line-height:1.3;">Tem uma pauta, denúncia ou quer colaborar?</h3>'
      +'<p style="font-size:14px;color:#94a3b8;margin:0 0 22px;line-height:1.65;">Envie notícias, denúncias e artigos. Seja colaborador ou correspondente do OVC.</p>'
      +'<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">'
        +'<a href="/contato/" style="display:inline-flex;align-items:center;background:#ffc800;color:#0f172a;padding:11px 22px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:800;">Enviar pauta ou denúncia</a>'
        +'<a href="/contato/" style="display:inline-flex;align-items:center;background:transparent;color:#f1f5f9;padding:11px 22px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:700;border:1px solid rgba(255,255,255,0.18);">Ser colaborador</a>'
      +'</div>'
    +'</div>';
  }

  var _BANNER_WA = 'https://wa.me/5511988510361';
  var _BANNER_PRODS = [null,
    {t:'Sua empresa está pagando até 35% acima do mercado no plano de saúde atual?',a:'Reduza custos com a gestão de benefícios corporativos da Terrasan. Opções PME com hospitais de elite.',c:'Solicitar Estudo Gratuito',m:'Olá! Gostaria de um estudo gratuito sobre Plano de Saúde Corporativo.'},
    {t:'Acesso à medicina de elite com tabelas diferenciadas para o seu perfil.',a:'Compare as coberturas das operadoras mais renomadas do país com consultoria VIP Terrasan.',c:'Comparar Coberturas',m:'Olá! Gostaria de comparar coberturas de convênios médicos.'},
    {t:'Proteção integral para a saúde de quem cuida da saúde dos outros.',a:'Seguro médico desenhado sob medida para as necessidades específicas e rotina de médicos e especialistas.',c:'Conhecer Apólice',m:'Olá! Sou médico e gostaria de conhecer o seguro médico da Lions.'},
    {t:'Construa uma linha de defesa financeira inabalaçvel para quem você ama.',a:'Garanta estabilidade e proteção para sua família nos momentos mais críticos com o Seguro de Vida Lions.',c:'Proteger Família',m:'Olá! Gostaria de informações sobre Seguro de Vida.'},
    {t:'Proteção vitalícia com a inteligência financeira de formação de reserva.',a:'Um ativo estratégico que protege seu patrimônio e permite o resgate do capital capitalizado no futuro.',c:'Simular Reserva',m:'Olá! Gostaria de simular um Seguro Rescatável com formação de reserva.'},
    {t:'Planejamento de longo prazo com eficiência fiscal e independência financeira.',a:'Construa o seu amanhã sem depender do Estado. Soluções estruturadas de Previdência Privada.',c:'Planejar Futuro',m:'Olá! Gostaria de informações sobre Previdência Privada.'},
    {t:'Alocação estratégica global de capital para investidores exigentes.',a:'Acesse os principais mercados do mundo com assessoria especializada em preservação e ganho real.',c:'Falar com Assessor',m:'Olá! Gostaria de falar com um assessor de investimentos.'},
    {t:'Proteja o seu patrimônio contra a oscilação da moeda local.',a:'Diversifique geograficamente os seus ativos e construa patrimônio na moeda mais forte do planeta.',c:'Dolarizar Ativos',m:'Olá! Gostaria de informações sobre dolarização de patrimônio.'},
    {t:'Alavanche seu patrimônio imobiliário e veicular sem juros de financiamento.',a:'Planeje a aquisição de imóveis, frotas e ativos pesados com as cotas estratégicas do Grupo Terrasan.',c:'Analisar Tabelas',m:'Olá! Gostaria de analisar tabelas de consórcio.'},
    {t:'Se você precisar parar de trabalhar hoje, quem paga o seu faturamento?',a:'Garanta o recebimento de diárias por afastamento temporário profissional e blinde seu padrão de vida.',c:'Blindar Renda',m:'Olá! Gostaria de informações sobre Seguro de Renda Garantida.'},
    {t:'Liquidez imediata em momentos de diagnóstico crítico de saúde.',a:'Receba o capital segurado diretamente em conta para custear tratamentos de ponta sem tocar nas suas reservas.',c:'Solicitar Cotação',m:'Olá! Gostaria de uma cotação de Seguro de Acidentes e Doenças Graves.'},
    {t:'A segurança definitiva para a sua maior ferramenta de trabalho: a sua capacidade produtiva.',a:'Proteção financeira robusta contra imprevistos que possam comprometer permanentemente sua atividade profissional.',c:'Garantir Segurança',m:'Olá! Gostaria de informações sobre Seguro de Invalidez.'},
    {t:'Proteja a reputação da sua empresa e o seu patrimônio profissional.',a:'Seguro de Responsabilidade Civil Profissional contra erros, omissões ou falhas involuntárias na prestação de serviços.',c:'Blindar Carreira',m:'Olá! Gostaria de uma cotação de Seguro RC Profissional.'},
    {t:'Defesa jurídica cível, criminal e ética especializada para médicos.',a:'Proteja o seu CRM e o patrimônio da sua clínica com o suporte e blindagem especializada Anadem através da Lions.',c:'Solicitar Blindagem',m:'Olá! Sou médico e gostaria de informações sobre o seguro jurídico Anadem.'},
    {t:'Explore o mundo com a retaguarda global e atendimento VIP da Lions.',a:'Assistência médica internacional, extravio de bagagens e suporte jurídico 24h em qualquer continente.',c:'Emitir Seguro',m:'Olá! Gostaria de emitir um seguro viagem.'},
    {t:'Apoio e respeito absoluto nos momentos de transição familiar.',a:'Resolva os trâmites burocráticos e financeiros com total assistência, dignidade e discrição.',c:'Conhecer Planos',m:'Olá! Gostaria de informações sobre Assistência Funeral.'},
    {t:'Inteligência financeira em proteção, seguros e investimentos.',a:'Da proteção da sua empresa à sucessão da sua família, centralize todos os riscos do seu ecossistema na Lions Corretora.',c:'Conhecer Portfólio',m:'Olá! Gostaria de conhecer o portfólio completo da Lions Corretora.'}
  ];
  var _BANNER_MAP = {
    saude:[1,2,11,16],familia:[4,6,16],negocios:[1,9,13],investimentos:[5,6,7,8],
    economia:[6,7,8],mercados:[7,8,5],internacional:[8,15],profissoes:[10,12,13],
    seguros:[4,5,10,11],tributacao:[6,17],politica:[17],regulacao:[17],
    educacao:[17],industria:[9,17],tecnologia:[13,17],esportes:[15,17],
    variedades:[15,17],investigativo:[17],seguranca:[17],cultura:[15,17],
    vagas:[10,17],concursos:[17],imoveis:[9,17],esg:[17],defesa:[17],religiao:[17],parcerias:[17],
    radar:[15,17]
  };
  var _SUBCAT_MAP = {
    'medicina':[3,14],'advocacia':[13],'contabilidade':[13],'ti &':[13],
    'heran':[5],'sucess':[5],'inválid':[12],'renda':[10],'acident':[11],
    'viagem':[15],'funeral':[16],'previd':[6],'consórc':[9],'dolariz':[8]
  };
  function _getBannerIdx(cat, subcat) {
    if (subcat) {
      var sl = subcat.toLowerCase();
      for (var k in _SUBCAT_MAP) { if (sl.indexOf(k) !== -1) { var o = _SUBCAT_MAP[k]; return o[Math.floor(Math.random()*o.length)]; } }
    }
    var opts = _BANNER_MAP[cat] || [17];
    return opts[Math.floor(Math.random()*opts.length)];
  }
  function renderBanner(cat, subcat) {
    var idx = _getBannerIdx(cat, subcat);
    var p = _BANNER_PRODS[idx] || _BANNER_PRODS[17];
    var url = _BANNER_WA + '?text=' + encodeURIComponent(p.m);
    return '<div style="background:#0A192F;border-radius:8px;padding:24px 28px;margin:36px 0;border:1px solid rgba(100,255,218,0.12);">'
      +'<p style="color:#64FFDA;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;margin:0 0 12px;font-weight:600;">Lions Corretora · Grupo Terrasan</p>'
      +'<h3 style="color:#FFFFFF;font-size:17px;font-weight:700;margin:0 0 10px;line-height:1.4;">' + esc(p.t) + '</h3>'
      +'<p style="color:#8892B0;font-size:13px;margin:0 0 20px;line-height:1.65;">' + esc(p.a) + '</p>'
      +'<a href="' + url + '" target="_blank" rel="noopener" style="display:inline-block;border:1px solid #64FFDA;color:#64FFDA;padding:10px 24px;border-radius:4px;font-size:12px;text-decoration:none;letter-spacing:1px;font-weight:600;">[ ' + esc(p.c) + ' ]</a>'
      +'</div>';
  }

  function renderHeroCard(p){
    var url = buildUrl(p), c = cor(p.categoria);
    var bg = p.imagem ? 'background:url(\''+p.imagem+'\') center/cover no-repeat;' : 'background:'+c+';';
    return '<a href="'+url+'" style="display:block;text-decoration:none;border-radius:16px;overflow:hidden;position:relative;min-height:340px;'+bg+'">'
      +'<div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.88) 0%,rgba(0,0,0,0.35) 55%,rgba(0,0,0,0.05) 100%);"></div>'
      +'<div style="position:absolute;bottom:0;left:0;right:0;padding:24px 28px;">'
        +'<span style="display:inline-block;background:'+c+';color:#fff;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;padding:3px 10px;border-radius:4px;margin-bottom:10px;">'+lbl(p.categoria)+(p.subcategoria?'&nbsp;&middot;&nbsp;'+esc(p.subcategoria):'')+'</span>'
        +'<h2 style="font-size:24px;font-weight:900;line-height:1.2;color:#fff;margin:0 0 8px;text-shadow:0 2px 8px rgba(0,0,0,0.5);">'+esc(stripMd(p.titulo||''))+'</h2>'
        +'<p style="font-size:14px;color:rgba(255,255,255,0.8);margin:0 0 10px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">'+esc((p.resumo||'').slice(0,160))+'</p>'
        +'<span style="font-size:12px;color:rgba(255,255,255,0.6);">Redação OVC &middot; '+dataCurta(p.data)+'</span>'
      +'</div>'
    +'</a>';
  }

  function renderCardMedio(p){
    var url = buildUrl(p), c = cor(p.categoria);
    return '<a href="'+url+'" style="display:block;text-decoration:none;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;background:#fff;">'
      +(p.imagem ? '<div style="height:160px;overflow:hidden;"><img src="'+p.imagem+'" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.parentElement.style.display=\'none\'"></div>' : '<div style="height:100px;background:'+c+'18;display:flex;align-items:center;justify-content:center;"><span style="color:'+c+';font-weight:900;font-size:13px;">OVC</span></div>')
      +'<div style="padding:14px;">'
        +'<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:'+c+';margin-bottom:6px;">'+lbl(p.categoria)+(p.subcategoria?' &middot; '+esc(p.subcategoria):'')+'</div>'
        +'<h3 style="font-size:15px;font-weight:800;line-height:1.3;margin:0 0 8px;color:#0f172a;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">'+esc(stripMd(p.titulo||''))+'</h3>'
        +'<span style="font-size:11px;color:#94a3b8;">Redação OVC &middot; '+dataCurta(p.data)+'</span>'
      +'</div>'
    +'</a>';
  }

  function renderCardCompacto(p){
    var url = buildUrl(p), c = cor(p.categoria);
    var img = p.imagem
      ? '<div style="width:88px;min-width:88px;height:72px;border-radius:8px;overflow:hidden;flex-shrink:0;"><img src="'+p.imagem+'" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.parentElement.style.display=\'none\'"></div>'
      : '<div style="width:88px;min-width:88px;height:72px;border-radius:8px;background:'+c+'18;flex-shrink:0;display:flex;align-items:center;justify-content:center;"><span style="color:'+c+';font-size:10px;font-weight:900;">OVC</span></div>';
    return '<a href="'+url+'" style="display:flex;gap:14px;align-items:flex-start;text-decoration:none;color:inherit;padding:14px 0;border-top:1px solid #f1f5f9;">'
      +img
      +'<div style="flex:1;min-width:0;">'
        +'<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:'+c+';margin-bottom:5px;">'+lbl(p.categoria)+(p.subcategoria?' &middot; '+esc(p.subcategoria):'')+'</div>'
        +'<h4 style="font-size:14px;font-weight:700;line-height:1.35;margin:0 0 5px;color:#0f172a;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">'+esc(stripMd(p.titulo||''))+'</h4>'
        +'<span style="font-size:11px;color:#94a3b8;">Redação OVC &middot; '+dataCurta(p.data)+'</span>'
      +'</div>'
    +'</a>';
  }

  function renderCardRail(p){
    var url = buildUrl(p), c = cor(p.categoria);
    return '<a href="'+url+'" style="display:flex;gap:10px;align-items:flex-start;text-decoration:none;padding:12px 0;border-bottom:1px solid #f1f5f9;">'
      +(p.imagem ? '<div style="width:58px;min-width:58px;height:58px;border-radius:6px;overflow:hidden;flex-shrink:0;"><img src="'+p.imagem+'" alt="" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.style.display=\'none\'"></div>' : '<div style="width:58px;min-width:58px;height:58px;border-radius:6px;background:'+c+'18;flex-shrink:0;display:flex;align-items:center;justify-content:center;"><span style="color:'+c+';font-size:9px;font-weight:900;">OVC</span></div>')
      +'<div style="flex:1;min-width:0;">'
        +'<h4 style="font-size:13px;font-weight:600;line-height:1.35;margin:0 0 5px;color:#1e293b;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">'+esc(stripMd(p.titulo||''))+'</h4>'
        +'<span style="font-size:10px;font-weight:500;color:#64748b;">'+dataCurta(p.data)+'</span>'
      +'</div>'
    +'</a>';
  }

  function railTitulo(texto, acento){
    return '<h3 style="font-size:13px;font-weight:800;color:#0f172a;margin:0 0 2px;padding-bottom:10px;border-bottom:2px solid '+acento+';">'+texto+'</h3>';
  }

  var params = new URLSearchParams(window.location.search);
  var artId = params.get('id');
  if(!artId){
    var _ps = window.location.pathname.replace(/\/$/, '').split('/').pop() || '';
    var _pm = _ps.match(/-([a-f0-9]{8})$/i);
    if(_pm) artId = _pm[1];
  }

  if(artId){
    document.addEventListener('DOMContentLoaded', function(){
      if(!document.getElementById('ovc-art-float-style')){
        var sty = document.createElement('style');
        sty.id = 'ovc-art-float-style';
        sty.textContent = '.ovc-art-img{float:left;width:38%;max-width:360px;margin:0 24px 20px 0;border-radius:12px;display:block;object-fit:cover;aspect-ratio:4/5;}.ovc-art-body{overflow:hidden;}.ovc-corpo p{margin:0 0 22px!important;font-size:17px;line-height:1.9;color:var(--text-main,#1e293b)}.ovc-corpo h2{font-size:20px;font-weight:800;margin:32px 0 12px!important;border-left:3px solid var(--ovc-accent,#dc2626);padding-left:12px}.ovc-corpo h3{font-size:18px;font-weight:700;margin:24px 0 10px!important}.ovc-corpo strong,.ovc-corpo b{font-weight:700}.ovc-corpo ul,.ovc-corpo ol{margin:0 0 22px!important;padding-left:24px}.ovc-corpo li{margin-bottom:8px;font-size:17px;line-height:1.8}.leia-tambem{margin-top:52px!important;padding:22px 24px;background:var(--surface-2,#f8fafc);border-radius:10px;border-top:3px solid var(--ovc-accent,#dc2626);clear:both}.leia-tambem strong{display:block;font-size:15px;font-weight:800;margin-bottom:14px!important;color:var(--text-main,#0f172a);text-transform:uppercase;letter-spacing:.04em}.leia-tambem ul{margin:0!important;padding-left:18px}.leia-tambem li{margin-bottom:10px!important;font-size:15px}.leia-tambem a{color:var(--ovc-accent,#dc2626);text-decoration:none;font-weight:500}.leia-tambem a:hover{text-decoration:underline}@media(max-width:680px){.ovc-art-img{float:none;width:100%;max-width:100%;margin:0 0 20px 0;aspect-ratio:auto;}}';
        document.head.appendChild(sty);
      }

      var sectionHero = document.querySelector('.ovc-section-hero');
      if(sectionHero) sectionHero.style.display = 'none';

      var rail = document.querySelector('.ovc-right-rail');
      if(rail) rail.style.cssText = 'display:flex;flex-direction:column;gap:0;min-width:0;position:sticky;top:16px;';

      var _pre = window.__OVC_ARTICLE__;
      var _fp;
      if(_pre && _pre.id && (_pre.id === artId || _pre.id.startsWith(artId))){
        _fp = Promise.resolve(_pre);
      } else {
        _fp = fetch('/api/portal-posts?id=' + encodeURIComponent(artId) + '&full=true')
          .then(function(r){ return r.ok ? r.json() : null; });
      }
      _fp.then(function(p){
          if(!p || !p.titulo) return;

          var tituloLimpo = stripMd(p.titulo);
          document.title = tituloLimpo + ' | O Valor Capital';

          (function(){
            function m(attr, key, val){
              var el = document.querySelector('meta[' + attr + '="' + key + '"]');
              if(!el){ el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
              el.setAttribute('content', val);
            }
            var desc = (p.subtitulo || p.resumo || '').slice(0, 160);
            m('property','og:type','article'); m('property','og:title', tituloLimpo);
            m('property','og:description', desc); m('property','og:image', p.imagem || '');
            m('property','og:url', window.location.href); m('property','og:site_name','O Valor Capital');
            m('name','twitter:card','summary_large_image'); m('name','twitter:title', tituloLimpo);
            m('name','twitter:description', desc); m('name','twitter:image', p.imagem || '');
          })();

          (function(){
            var ld = document.createElement('script');
            ld.type = 'application/ld+json';
            ld.text = JSON.stringify({
              '@context':'https://schema.org','@type':'NewsArticle',
              'headline': tituloLimpo,
              'image': p.imagem ? [p.imagem] : [],
              'datePublished': p.data, 'dateModified': p.data,
              'author':[{'@type':'Organization','name':'Redação OVC'}],
              'publisher':{'@type':'Organization','name':'O Valor Capital','url':'https://ovalorcapital.com.br'},
              'url':'https://ovalorcapital.com.br'+buildUrl(p),
              'description':(p.subtitulo||p.resumo||'').slice(0,160),
              'articleSection': lbl(p.categoria)
            });
            document.head.appendChild(ld);
          })();
          var c = cor(p.categoria);
          var urlRel = buildUrl(p);
          var catSlug = CAT_PATH[p.categoria] || 'politica';

          injetarProgressBar(c);

          if(p.id && p.id.length >= 36){
            fetch('/api/manage', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({action: 'track_view', post_id: p.id})
            }).catch(function(){});
          }

          var heroEl = document.querySelector('[data-hero-card]');
          if(heroEl){
            heroEl.style.cssText = 'display:block;padding:24px 28px 32px;box-sizing:border-box;';
            heroEl.innerHTML =
              '<nav style="font-size:12px;color:#94a3b8;margin-bottom:20px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">'
                +'<a href="/" style="color:#94a3b8;text-decoration:none;">Início</a><span>&rsaquo;</span>'
                +'<a href="/'+catSlug+'/" style="color:#94a3b8;text-decoration:none;">'+lbl(p.categoria)+'</a>'
                +(p.subcategoria ? '<span>&rsaquo;</span><span style="color:#64748b;">'+esc(p.subcategoria)+'</span>' : '')
              +'</nav>'
              +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap;">'
                +'<span style="display:inline-block;background:'+c+';color:#fff;font-size:11px;font-weight:700;padding:4px 12px;border-radius:4px;text-transform:uppercase;letter-spacing:.08em;">'+lbl(p.categoria)+'</span>'
                +(p.subcategoria ? '<span style="font-size:11px;color:#64748b;font-weight:600;">'+esc(p.subcategoria)+'</span>' : '')
                +'<span style="font-size:13px;color:#64748b;">Redação OVC &middot; '+dataLonga(p.data)+'</span>'
                +'<span style="font-size:11px;color:#94a3b8;background:#f1f5f9;padding:3px 9px;border-radius:20px;">&#9201; '+estimarLeitura(p.corpo || '')+'</span>'
              +'</div>'
              +'<h1 style="font-size:30px;font-weight:900;line-height:1.18;margin:0 0 16px;color:var(--text-main,#0f172a);letter-spacing:-.02em;">'+esc(tituloLimpo)+'</h1>'
              +(p.subtitulo ? '<p style="font-size:18px;color:#475569;margin:0 0 4px;line-height:1.6;font-style:italic;border-left:4px solid '+c+';padding:6px 0 6px 16px;">'+esc(p.subtitulo)+'</p>' : '')
              +renderShare(tituloLimpo, urlRel)
              +'<div class="ovc-art-body">'
              +(p.imagem ? '<img src="'+p.imagem+'" class="ovc-art-img" alt="'+esc(tituloLimpo)+'" onerror="this.style.display=\'none\'">' : '')
              +'<div>'+renderCorpo(p.corpo||'')+'</div>'
              +'<div style="clear:both;"></div>'
              +'</div>'
              +renderBanner(p.categoria, p.subcategoria)
              +renderCTA()
              +'<div id="ovc-subcat-more"></div>'
              +'<div id="ovc-cat-more"></div>'
              +'<div id="ovc-voce-pode-gostar"></div>'
              +'<div id="ovc-outras-cats"></div>';
          }

          var banner = document.querySelector('.ovc-banner-slot');
          if(banner){ banner.innerHTML = renderBanner(p.categoria, p.subcategoria); banner.style.display = 'block'; }

          fetch('/api/portal-posts?categoria=' + encodeURIComponent(p.categoria) + '&limit=60')
            .then(function(r){ return r.json(); })
            .then(function(json){
              var rel = (json.posts || []).filter(function(r){
                return r.id !== p.id && r.categoria === p.categoria;
              }).slice(0, 24);

              var mainEl = document.querySelector('[data-main-list]');
              var mainWrap = mainEl ? mainEl.closest('.ovc-story-list') : null;
              if(mainEl && rel.length){
                if(mainWrap){
                  var h3a = mainWrap.querySelector('h3');
                  if(h3a) h3a.textContent = 'Leia também';
                  mainWrap.style.display = 'block';
                }
                mainEl.innerHTML = rel.slice(0, 5).map(renderCardCompacto).join('');
              }

              var localEl = document.querySelector('[data-local-list]');
              var localWrap = localEl ? localEl.closest('.ovc-story-list') : null;
              if(localEl && rel.length > 5){
                if(localWrap){
                  var h3b = localWrap.querySelector('h3');
                  if(h3b) h3b.textContent = 'Mais em ' + lbl(p.categoria);
                  localWrap.style.display = 'block';
                }
                localEl.innerHTML = rel.slice(5, 10).map(renderCardCompacto).join('');
              }

              var railSec = document.querySelector('[data-banner-sidebar]');
              if(railSec){
                railSec.innerHTML = railTitulo('Mais em ' + lbl(p.categoria), c)
                  + (rel.length ? rel.slice(0, 5).map(renderCardRail).join('') : '<p style="font-size:13px;color:#94a3b8;padding:12px 0;">Mais conteúdo em breve.</p>')
                  + '<div style="margin-top:20px;background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:10px;padding:18px;text-align:center;">'
                    + '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#ffc800;margin-bottom:6px;">Redação OVC</div>'
                    + '<p style="font-size:12px;color:#94a3b8;margin:0 0 12px;line-height:1.5;">Tem uma pauta ou denúncia?</p>'
                    + '<a href="/contato/" style="display:block;background:#ffc800;color:#0f172a;padding:8px 12px;border-radius:6px;text-decoration:none;font-size:12px;font-weight:800;text-align:center;">Enviar para a redação</a>'
                  + '</div>'
                  + '<div id="ovc-mais-lidas-rail" style="margin-top:24px;"></div>'
                  + '<div id="ovc-tv-rail" style="margin-top:24px;"></div>';

                fetch('/api/portal-posts?maisLidos=true&limit=6')
                  .then(function(r){ return r.json(); })
                  .then(function(d){
                    var lidas = (d.posts || []).filter(function(x){ return x.id !== p.id; }).slice(0, 5);
                    var mlEl = document.getElementById('ovc-mais-lidas-rail');
                    if(mlEl && lidas.length){
                      mlEl.innerHTML = railTitulo('Mais Lidas', '#e11d48') + lidas.map(renderCardRail).join('');
                    }
                  }).catch(function(){});

                fetch('/api/manage')
                  .then(function(r){ return r.json(); })
                  .then(function(cfg){
                    var ytUrl = cfg.youtube_live_url;
                    var tvEl = document.getElementById('ovc-tv-rail');
                    if(tvEl && ytUrl){
                      tvEl.innerHTML = '<div style="font-size:13px;font-weight:800;color:#0f172a;margin-bottom:8px;padding-bottom:8px;border-bottom:2px solid #e11d48;">OVC TV ao Vivo</div>'
                        + '<div style="border-radius:8px;overflow:hidden;"><iframe width="100%" height="180" src="' + ytUrl + '" frameborder="0" allow="accelerometer;clipboard-write;encrypted-media;picture-in-picture" allowfullscreen loading="lazy" style="display:block;border-radius:8px;"></iframe></div>';
                    }
                  }).catch(function(){});
              }

              var subcatPosts = p.subcategoria
                ? rel.filter(function(r){ return r.subcategoria === p.subcategoria; }).slice(0,8)
                : [];
              var subcatIdMap = {};
              subcatPosts.forEach(function(r){ subcatIdMap[r.id]=1; });
              var catMorePosts = rel.filter(function(r){ return !subcatIdMap[r.id]; }).slice(0,16);

              var subcatEl = document.getElementById('ovc-subcat-more');
              if(subcatEl && subcatPosts.length){
                subcatEl.innerHTML = '<div style="margin-top:48px;">'
                  +'<h2 style="font-size:17px;font-weight:800;color:#0f172a;margin:0 0 18px;padding-bottom:10px;border-bottom:3px solid '+c+';">Mais em '+esc(p.subcategoria)+'</h2>'
                  +'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;">'
                  +subcatPosts.map(renderCardMedio).join('')
                  +'</div></div>';
              }

              var catMoreEl = document.getElementById('ovc-cat-more');
              if(catMoreEl && catMorePosts.length){
                catMoreEl.innerHTML = '<div style="margin-top:48px;">'
                  +'<h2 style="font-size:17px;font-weight:800;color:#0f172a;margin:0 0 18px;padding-bottom:10px;border-bottom:3px solid '+c+';">Mais em '+lbl(p.categoria)+'</h2>'
                  +'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;">'
                  +catMorePosts.map(renderCardMedio).join('')
                  +'</div></div>';
              }

              fetch('/api/portal-posts?maisLidos=true&limit=20')
                .then(function(r){ return r.json(); })
                .then(function(d){
                  var outros = (d.posts||[]).filter(function(x){
                    return x.id !== p.id && x.categoria !== p.categoria;
                  }).slice(0,8);
                  var vpgEl = document.getElementById('ovc-voce-pode-gostar');
                  if(vpgEl && outros.length){
                    vpgEl.innerHTML = '<div style="margin-top:48px;">'
                      +'<h2 style="font-size:17px;font-weight:800;color:#0f172a;margin:0 0 18px;padding-bottom:10px;border-bottom:3px solid #f59e0b;">Você Pode Gostar</h2>'
                      +'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;">'
                      +outros.map(renderCardMedio).join('')
                      +'</div></div>';
                  }
                }).catch(function(){});

              var outrasEl = document.getElementById('ovc-outras-cats');
              if(outrasEl){
                var CATS_MAIN = ['politica','economia','negocios','financas','tributacao',
                  'saude','familia','tecnologia','industria','educacao','esportes','internacional',
                  'variedades','regulacao','cultura','profissoes','vagas','imoveis','esg','radar'];
                var catCards = CATS_MAIN.filter(function(k){ return k !== p.categoria && LABEL[k]; })
                  .map(function(k){
                    return '<a href="/'+CAT_PATH[k]+'/" style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:#fff;border-radius:10px;border:1px solid #e2e8f0;text-decoration:none;">'
                      +'<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:'+cor(k)+';flex-shrink:0;"></span>'
                      +'<span style="font-size:14px;font-weight:700;color:#0f172a;">'+lbl(k)+'</span>'
                      +'</a>';
                  }).join('');
                outrasEl.innerHTML = '<div style="margin-top:48px;margin-bottom:32px;">'
                  +'<h2 style="font-size:17px;font-weight:800;color:#0f172a;margin:0 0 18px;padding-bottom:10px;border-bottom:3px solid #64748b;">Explore Outras Categorias</h2>'
                  +'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;">'
                  +catCards
                  +'</div></div>';
              }
            })
            .catch(function(){});
        })
        .catch(function(e){ console.warn('OVC artigo:', e.message); });
    });
    return;
  }

  document.addEventListener('DOMContentLoaded', function(){
    // Aplica tema salvo imediatamente
    (function(){
      var _t = localStorage.getItem('ovc-theme');
      if(_t && ['classic','gold','graphite'].indexOf(_t) !== -1){
        document.body.setAttribute('data-theme', _t);
        document.documentElement.setAttribute('data-theme', _t);
      }
    })();
    // Substitui nav antiga pelo novo supermenu-link
    (function(){
      var nav = document.querySelector('nav.supermenu');
      if(!nav || !nav.querySelector('.supermenu-item')) return;
      var path = window.location.pathname;
      var items = [['Brasil On','/brasil-on/'],['Política','/politica/'],['Economia','/economia/'],
        ['Finanças','/financas/'],['Negócios','/negocios/'],['Tecnologia','/tecnologia/'],
        ['Internacional','/internacional/'],['Indústria','/industria/'],['Família','/familia/'],
        ['Esportes','/esportes/'],['Colunistas','/colunistas/'],['VC','/vc/']];
      nav.innerHTML = items.map(function(it){
        var active = path === it[1] || path.startsWith(it[1].slice(0,-1)+'/');
        return '<a class="supermenu-link'+(active?' ativo':'')+'" href="'+it[1]+'">'+it[0]+'</a>';
      }).join('');
    })();

    var slug = document.body.dataset.category;
    if(!slug) return;
    if(slug === 'vc') return;
    if(slug === 'colunistas') return;
    var _section = document.body.dataset.section;
    if(['radar-da-bola','brasileirao-serie-a','brasileirao-serie-b','libertadores','sul-americana','futebol-europeu','mercado-da-bola'].indexOf(_section) !== -1) return;

    var catFiltro = SLUG_TO_CAT[slug] || slug;
    var aliases = CATEGORY_ALIASES[catFiltro] || null;
    var acento = cor(catFiltro);

    injetarProgressBar(acento);

    var orcMain = document.querySelector('.ovc-main') || document.querySelector('main.ovc-main') || document.querySelector('main');
    if(!orcMain) return;

    var SUB_CATS = {
      politica:      [['Executivo','executivo'],['Legislativo','legislativo'],['Judiciário','judiciario'],['Eleições','eleicoes'],['Partidos','partidos'],['Defesa Nacional','defesa']],
      economia:      [['PIB & Crescimento','pib'],['Inflação & IPCA','inflacao'],['Câmbio','cambio'],['Selic & COPOM','selic'],['Política Fiscal','fiscal'],['Previdência','previdencia']],
      negocios:      [['Empreendedorismo','empreendedorismo'],['Gestão','gestao'],['Startups','startups'],['MEI & Pequenas','mei'],['Crédito & Captação','credito'],['Franquias','franquias']],
      financas:      [['Renda Fixa','renda-fixa'],['Bolsa & Ações','bolsa-e-acoes'],['Seguros & Proteção','seguros-e-protecao'],['Previdência','previdencia'],['Fundos & FIIs','fundos-e-fiis'],['Planejamento Patrimonial','planejamento-patrimonial'],['Criptomoedas','criptomoedas']],
      investimentos:  [['Renda Fixa','renda-fixa'],['Renda Variável','renda-variavel'],['Fundos','fundos'],['Previdência Privada','previdencia'],['Cripto','cripto'],['Internacional','internacional']],
      tecnologia:    [['Inteligência Artificial','ia'],['Fintechs','fintechs'],['Cibersegurança','ciberseguranca'],['5G & Telecom','5g'],['E-commerce','e-commerce'],['Inovação','inovacao']],
      saude:         [['Saúde Pública','saude-publica'],['Planos de Saúde','planos'],['SUS','sus'],['Saúde Mental','saude-mental'],['Medicamentos','medicamentos'],['Vigilância Sanitária','anvisa']],
      esportes:      [['Futebol','futebol'],['Basquete','basquete'],['Tênis','tenis'],['Automobilismo','automobilismo'],['MMA & Lutas','mma'],['E-sports','e-sports']],
      cultura:       [['Cinema & Streaming','cinema'],['Música','musica'],['Literatura','literatura'],['Artes','artes'],['Gastronomia','gastronomia'],['Turismo','turismo']],
      internacional: [['América Latina','america-latina'],['Estados Unidos','eua'],['Europa','europa'],['Ásia','asia'],['Oriente Médio','oriente-medio'],['Geopolítica','geopolitica']],
      'brasil-on':   [['Segurança Pública','seguranca'],['Investigativo','investigativo'],['Denúncias','denuncias'],['Defesa Civil','defesa'],['Brasil Real','brasil-real'],['Variedades','variedades']],
      carreira:      [['Vagas & Empregos','vagas'],['Concursos','concursos'],['Profissões','profissoes'],['Educação','educacao'],['Parcerias','parcerias'],['Mercado de Trabalho','mercado']],
      familia:       [['Orçamento Familiar','orcamento'],['Filhos & Educação','filhos'],['Habitação','habitacao'],['Sucessão','sucessao'],['Seguros da Família','seguros'],['Bem-estar','bem-estar']],
      seguros:       [['Seguro de Vida','vida'],['Saúde','saude'],['Auto','auto'],['Residencial','residencial'],['Empresarial','empresarial'],['Previdência','previdencia']],
      tributos:      [['IRPF','irpf'],['IRPJ & Empresas','irpj'],['Planejamento Tributário','planejamento'],['Obrigações Acessórias','obrigacoes'],['Reforma Tributária','reforma'],['Simples Nacional','simples']],
      mercados:      [['Bolsa de Valores','bolsa'],['Câmbio','cambio'],['Juros & Bonds','juros'],['Commodities','commodities'],['Cripto','cripto'],['Índices Globais','indices']],
      industria:     [['Agronegócio','agronegocio'],['Energia','energia'],['Construção Civil','construcao'],['Mineração','mineracao'],['Setor Automotivo','automotivo'],['Logística','logistica']],
      religiao:      [['Evangélicos','evangelicos'],['Católicos','catolicos'],['Outras Religiões','outras'],['Fé & Sociedade','fe-sociedade'],['Missões','missoes'],['Família & Valores','familia']],
      imoveis:       [['Compra & Venda','compra-venda'],['Aluguel','aluguel'],['Financiamento','financiamento'],['Minha Casa Minha Vida','mcmv'],['Fundos Imobiliários','fiis'],['Mercado Imobiliário','mercado']],
      profissoes:    [['Saúde & Medicina','saude'],['Jurídico & Finanças','juridico'],['Engenharia & TI','engenharia'],['Comunicação & Mídia','comunicacao'],['Gestão & Negócios','gestao'],['Empregos & Vagas','vagas']],
      colunistas:    [['Roberto Terrasan','roberto-terrasan'],['Beta Ferreira','beta-ferreira'],['Adriana Ferreira','adriana-ferreira'],['Michele Froiz','michele-froiz'],['Prof. Pizzolatto','prof-marcos-pizzolatto'],['Taísa da Fonseca','taisa-da-fonseca']]
    };
    var radarBolaHTML = '';
    if(catFiltro === 'esportes'){
      var rbLinks = [['Radar da Bola','/radar-da-bola/'],['Brasileirão Série A','/brasileirao-serie-a/'],['Brasileirão Série B','/brasileirao-serie-b/'],['Libertadores','/libertadores/'],['Sul-Americana','/sul-americana/'],['Futebol Europeu','/futebol-europeu/'],['Mercado da Bola','/mercado-da-bola/']];
      radarBolaHTML = '<div class="cat-bloco" style="margin-top:12px;overflow:visible;">'
        +'<div style="background:'+acento+';padding:12px 16px;display:flex;align-items:center;gap:8px;">'
          +'<span style="display:inline-block;width:3px;height:18px;background:#fff;border-radius:2px;flex-shrink:0;"></span>'
          +'<span style="font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#fff;">Radar da Bola</span>'
        +'</div>'
        +'<div style="padding:10px 8px;">'
          +rbLinks.map(function(l){
            return '<a href="'+l[1]+'" style="display:flex;align-items:center;gap:10px;padding:11px 14px;font-size:13px;font-weight:500;text-decoration:none;border-radius:8px;margin-bottom:3px;color:#334155;background:transparent;" onmouseover="this.style.background=\''+acento+'18\';this.style.color=\'#1e293b\'" onmouseout="this.style.background=\'transparent\';this.style.color=\'#334155\';">'
              +'<span style="width:6px;height:6px;border-radius:50%;background:'+acento+';flex-shrink:0;margin-left:2px;"></span>'
              +'<span style="flex:1;">'+l[0]+'</span>'
              +'<span style="font-size:12px;opacity:.35;">›</span>'
            +'</a>';
          }).join('')
        +'</div>'
      +'</div>';
    }
    var subList = SUB_CATS[catFiltro] || [];
    var subFilter = params.get('s') || '';
    var subLabel = '';
    if(subFilter){
      var _activeSub = subList.filter(function(c){ return c[1] === subFilter; });
      if(_activeSub.length) subLabel = _activeSub[0][0];
    }
    var navLinks = subList.map(function(c){
      var isActive = subFilter === c[1];
      return '<a href="/'+catFiltro+'/?s='+c[1]+'" style="display:flex;align-items:center;gap:10px;padding:11px 14px;font-size:13px;font-weight:'+(isActive?'700':'500')+';text-decoration:none;border-radius:8px;margin-bottom:3px;color:'+(isActive?'#fff':'#334155')+';background:'+(isActive?acento:'transparent')+';transition:background .15s,color .15s;" onmouseover="if(this.getAttribute(\'data-active\')!==\'1\')this.style.background=\''+acento+'18\';this.style.color=\''+(isActive?'#fff':'#1e293b')+'\'" onmouseout="if(this.getAttribute(\'data-active\')!==\'1\')this.style.background=\'transparent\';this.style.color=\''+(isActive?'#fff':'#334155')+'\';" data-active="'+(isActive?'1':'0')+'">'
        +'<span style="width:6px;height:6px;border-radius:50%;background:'+(isActive?'#fff':acento)+';flex-shrink:0;margin-left:2px;"></span>'
        +'<span style="flex:1;">'+c[0]+'</span>'
        +(isActive ? '<span style="font-size:10px;font-weight:800;opacity:.8;">✓</span>' : '<span style="font-size:12px;opacity:.35;">›</span>')
        +'</a>';
    }).join('') || '<p style="font-size:12px;color:#94a3b8;padding:8px 14px;margin:0;">Em breve.</p>';

    orcMain.innerHTML =
      '<div style="background:linear-gradient(to bottom,#f1f5f9,var(--bg-page,#f3f4f8));padding:16px 16px 0;border-bottom:2px solid '+acento+';">'
        +'<div style="max-width:100%;display:flex;align-items:center;justify-content:space-between;padding-bottom:14px;padding-left:8px;padding-right:8px;">'
          +'<div style="display:flex;align-items:center;gap:12px;">'
            +'<span style="background:'+acento+';color:#fff;font-size:11px;font-weight:800;padding:4px 14px;border-radius:4px;text-transform:uppercase;letter-spacing:.08em;">'+lbl(catFiltro)+'</span>'
            +'<nav style="font-size:12px;color:#94a3b8;"><a href="/" style="color:#94a3b8;text-decoration:none;">Início</a> <span>&rsaquo;</span> <a href="/'+catFiltro+'/" style="color:#64748b;font-weight:600;text-decoration:none;">'+lbl(catFiltro)+'</a>'+(subLabel ? ' <span>&rsaquo;</span> <span style="color:'+acento+';font-weight:700;">'+subLabel+'</span>' : '')+'</nav>'
          +'</div>'
          +'<a href="/busca/" style="font-size:12px;color:'+acento+';text-decoration:none;font-weight:700;">Ver todos &rsaquo;</a>'
        +'</div>'
      +'</div>'
      +'<div class="cat-corpo">'
        +'<aside class="cat-rail-esq">'
          +'<div class="cat-bloco" style="overflow:visible;">'
            +'<div style="background:'+acento+';padding:12px 16px;display:flex;align-items:center;gap:8px;">'
              +'<span style="display:inline-block;width:3px;height:18px;background:#fff;border-radius:2px;flex-shrink:0;"></span>'
              +'<span style="font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#fff;">Seções de '+lbl(catFiltro)+'</span>'
            +'</div>'
            +'<div id="cat-nav-links" style="padding:10px 8px;">'+navLinks+'</div>'
          +'</div>'
          +radarBolaHTML
          +'<div class="cat-bloco" id="cat-rail-esq-tags" style="margin-top:12px;">'
            +'<div style="background:linear-gradient(135deg,#1e293b,#0f172a);padding:10px 14px;"><span style="font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#94a3b8;">Temas em alta</span></div>'
            +'<div style="padding:10px;"><p style="font-size:12px;color:#94a3b8;margin:0;">Carregando...</p></div>'
          +'</div>'
          +'<div class="cat-bloco" style="margin-top:12px;background:'+acento+'0D;border:1px solid '+acento+'33;">'
            +'<div style="padding:14px 16px;">'
              +'<div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:'+acento+';margin-bottom:8px;">Redação OVC</div>'
              +'<p style="font-size:12px;color:#475569;margin:0 0 10px;line-height:1.5;">Envie pauta ou denúncia</p>'
              +'<a href="/contato/" style="display:block;background:'+acento+';color:#fff;padding:8px;border-radius:7px;text-decoration:none;font-size:12px;font-weight:700;text-align:center;">Falar com a redação</a>'
            +'</div>'
          +'</div>'
        +'</aside>'
        +'<div class="cat-centro" id="cat-centro-area">'
          +'<div id="cat-hero-slot" style="margin-bottom:20px;"></div>'
          +'<div id="cat-main-grid"></div>'
          +'<div id="cat-more-list" style="margin-top:20px;"></div>'
        +'</div>'
        +'<aside class="cat-rail-dir">'
          +'<div class="cat-bloco" id="cat-ultimas">'
            +'<div style="background:linear-gradient(135deg,#0f172a,#1e293b);padding:10px 14px;display:flex;align-items:center;justify-content:space-between;">'
              +'<span style="font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#fff;">Últimas em '+lbl(catFiltro)+'</span>'
              +(subLabel ? '<span style="font-size:9px;background:'+acento+';color:#fff;padding:2px 7px;border-radius:4px;font-weight:700;">'+subLabel+'</span>' : '')
            +'</div>'
            +'<div id="cat-ultimas-body" style="padding:0 12px;background:#fff;"><p style="font-size:12px;color:#94a3b8;padding:12px 0;">Carregando...</p></div>'
          +'</div>'
          +'<div class="cat-bloco" id="cat-mais-lidas" style="margin-top:12px;">'
            +'<div style="background:linear-gradient(135deg,#1e293b,#0f172a);padding:10px 14px;">'
              +'<span style="font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#fbbf24;">Mais Lidas</span>'
            +'</div>'
            +'<div id="cat-mais-lidas-body" style="padding:0 12px;background:#fff;"><p style="font-size:12px;color:#94a3b8;padding:12px 0;">Carregando...</p></div>'
          +'</div>'
          +'<div class="cat-bloco" id="cat-tv" style="margin-top:12px;">'
            +'<div style="background:linear-gradient(135deg,#0f172a,#1e293b);padding:10px 14px;">'
              +'<span style="font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#fff;">OVC TV ao Vivo</span>'
            +'</div>'
            +'<div id="cat-tv-body" style="padding:8px;background:#fff;"><p style="font-size:12px;color:#94a3b8;">Aguardando stream.</p></div>'
          +'</div>'
        +'</aside>'
      +'</div>';

    var _apiUrl = '/api/portal-posts?categoria=' + encodeURIComponent(catFiltro) + '&limit=60';
    if(subFilter && subLabel) _apiUrl += '&q=' + encodeURIComponent(subLabel);
    fetch(_apiUrl)
      .then(function(r){ return r.json(); })
      .then(function(json){
        var validCats = aliases ? new Set(aliases) : null;
        var posts = (json.posts || []).filter(function(p){
          if(!p.titulo) return false;
          if(validCats) return validCats.has(p.categoria);
          return p.categoria === catFiltro;
        });

        var ultEl = document.getElementById('cat-ultimas-body');
        if(ultEl){
          var railPosts = posts.slice(0, 7);
          ultEl.innerHTML = railPosts.length
            ? railPosts.map(renderCardRail).join('')
            : '<p style="font-size:12px;color:#94a3b8;padding:8px 0;">Aguardando conteúdo.</p>';
        }

        if(!posts.length){
          var centroEl = document.getElementById('cat-hero-slot');
          if(centroEl) centroEl.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:220px;padding:24px;border-radius:16px;border:2px dashed #e2e8f0;">'
            +'<p style="text-align:center;color:#64748b;font-size:15px;line-height:1.6;margin:0;">Aguardando conteúdo para <strong style="color:'+acento+';">'+lbl(catFiltro)+'</strong>.<br>A automação está gerando matérias. Volte em breve.</p></div>';
          return;
        }

        var usedIds = {}, usedTitulos = {}, deduped = [];
        posts.forEach(function(p){
          if(!p.id || !p.titulo) return;
          if(usedIds[p.id]) return;
          var tNorm = (p.titulo||'').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,30);
          if(usedTitulos[tNorm]) return;
          usedIds[p.id]=true; usedTitulos[tNorm]=true; deduped.push(p);
        });
        if(!deduped.length) return;

        var heroSlot = document.getElementById('cat-hero-slot');
        if(heroSlot) heroSlot.innerHTML = renderHeroCard(deduped[0]);

        var tagsEl = document.getElementById('cat-rail-esq-tags');
        if(tagsEl && deduped.length > 1){
          var tagSet = {}, topTags = [];
          deduped.forEach(function(p){ (p.tags||[]).forEach(function(t){ if(LABEL[t]) tagSet[t]=(tagSet[t]||0)+1; }); });
          topTags = Object.keys(tagSet).sort(function(a,b){ return tagSet[b]-tagSet[a]; }).slice(0,8);
          tagsEl.querySelector('div').innerHTML = topTags.length
            ? '<div style="padding:10px;display:flex;flex-wrap:wrap;gap:6px;">'
              + topTags.map(function(t){ return '<a href="/'+(CAT_PATH[t]||t)+'/" style="display:inline-block;font-size:11px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:4px;padding:3px 8px;color:#475569;text-decoration:none;">'+lbl(t)+'</a>'; }).join('')
              + '</div>'
            : '<div style="padding:10px;"><p style="font-size:12px;color:#94a3b8;margin:0;">Em breve.</p></div>';
        }

        var gridEl = document.getElementById('cat-main-grid');
        if(gridEl && deduped.length > 1){
          var g = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">'
            + deduped.slice(1, Math.min(3,deduped.length)).map(renderCardMedio).join('') + '</div>';
          if(deduped.length > 3) g += deduped.slice(3,11).map(renderCardCompacto).join('');
          gridEl.innerHTML = g;
        }

        var moreEl = document.getElementById('cat-more-list');
        if(moreEl && deduped.length > 11) moreEl.innerHTML = deduped.slice(11,22).map(renderCardCompacto).join('');

      }).catch(function(e){ console.warn('OVC categoria:', e.message); });

    fetch('/api/portal-posts?maisLidos=true&limit=6')
      .then(function(r){ return r.json(); })
      .then(function(d){
        var mlEl = document.getElementById('cat-mais-lidas-body');
        if(mlEl){
          var lidas = (d.posts||[]).slice(0,5);
          mlEl.innerHTML = lidas.length
            ? lidas.map(renderCardRail).join('')
            : '<p style="font-size:12px;color:#94a3b8;padding:8px 0;">Em breve.</p>';
        }
      }).catch(function(){});

    fetch('/api/manage')
      .then(function(r){ return r.json(); })
      .then(function(cfg){
        var tvEl = document.getElementById('cat-tv-body');
        if(tvEl && cfg.youtube_live_url){
          tvEl.innerHTML = '<div style="border-radius:6px;overflow:hidden;"><iframe width="100%" height="160" src="'+cfg.youtube_live_url+'" frameborder="0" allow="accelerometer;autoplay;clipboard-write;encrypted-media;picture-in-picture" allowfullscreen loading="lazy" style="display:block;"></iframe></div>';
        }
      }).catch(function(){});
  });

})();
