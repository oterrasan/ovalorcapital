(function(){
  const API = "/api/portal-posts";

  const CAT = {politica:"Política",economia:"Economia",negocios:"Negócios",
    investimentos:"Investimentos",mercados:"Mercados",tributacao:"Tributação",
    regulacao:"Regulação",seguros:"Seguros",saude:"Saúde",familia:"Família",
    tecnologia:"Tecnologia",industria:"Indústria",educacao:"Educação",
    esportes:"Esportes",cultura:"Cultura",patrimonio:"Patrimônio",
    internacional:"Internacional",geral:"Geral"};

  const CAT_PATH_MAP = {
    politica:'politica', economia:'economia', negocios:'negocios',
    investimentos:'investimentos', seguros:'seguros', mercados:'mercados',
    educacao:'educacao', industria:'industria', tecnologia:'tecnologia',
    esportes:'esportes', saude:'saude', familia:'familia',
    tributacao:'tributos', regulacao:'regulacao', parcerias:'parcerias',
    vc:'vc', colunistas:'vc', internacional:'internacional', variedades:'variedades', geral:'politica',
    investigativo:'investigativo', seguranca:'seguranca', cultura:'cultura', profissoes:'profissoes', vagas:'vagas',
    concursos:'concursos', imoveis:'imoveis', esg:'esg', defesa:'defesa', religiao:'religiao'
  };

  function catLabel(c){ return CAT[c]||c||"Geral"; }

  function dataBr(dt){
    if(!dt) return "";
    try{ return new Date(dt).toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"}); }
    catch(_){ return ""; }
  }

  function set(id, val){
    const el = document.getElementById(id);
    if(el) el.textContent = val;
  }

  function buildUrl(p){
    const cp = CAT_PATH_MAP[p.categoria] || 'politica';
    const sl = (p.titulo||"").toLowerCase().normalize("NFD")
      .replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9\s-]/g,"")
      .trim().replace(/\s+/g,"-").slice(0,55);
    return "/" + cp + "/" + sl + "-" + (p.id||"").slice(0,8) + "/";
  }

  async function loadMateria(){
    const params = new URLSearchParams(window.location.search);
    let id = params.get("id");
    if(!id){
      const ps = window.location.pathname.replace(/\/$/,'').split('/').pop()||'';
      const pm = ps.match(/-([a-f0-9]{8})$/i);
      if(pm) id = pm[1];
    }
    const bodyEl = document.getElementById("ovc-art-body");
    if(!id){ if(bodyEl) bodyEl.innerHTML="<p>Matéria não encontrada.</p>"; return; }

    try{
      const res = await fetch(API + "?id=" + id);
      if(!res.ok) throw new Error("not_found");
      const p = await res.json();
      if(!p || !p.titulo) throw new Error("empty");

      document.body.setAttribute("data-category", p.categoria||"geral");

      set("ovc-art-cat", catLabel(p.categoria));
      set("ovc-art-titulo", p.titulo);
      set("ovc-art-subtitulo", p.subtitulo||"");
      set("ovc-art-data", "Redação OVC · " + dataBr(p.data));

      const img = document.getElementById("ovc-art-img");
      const imgWrap = document.getElementById("ovc-art-img-wrap");
      if(img && imgWrap && p.imagem){
        img.src = p.imagem;
        imgWrap.style.display = "block";
        img.onerror = () => imgWrap.style.display = "none";
      }

      const corpo = p.corpo || p.resumo || "";
      if(bodyEl){
        bodyEl.innerHTML = corpo.split(/\n\n+/).filter(l=>l.trim())
          .map(l => "<p>" + l.replace(/\n/g,"<br>") + "</p>").join("");
      }

      document.title = p.titulo + " | O Valor Capital";
      const meta = document.querySelector('meta[name="description"]');
      if(meta) meta.setAttribute("content", p.resumo || p.titulo);

      (function setOG(post){
        function upsertMeta(attr, key, val){
          let el = document.querySelector('meta[' + attr + '="' + key + '"]');
          if(!el){ el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
          el.setAttribute("content", val);
        }
        const titulo = post.titulo || "O Valor Capital";
        const descricao = (post.resumo || post.titulo || "").slice(0,160);
        const imagem = post.imagem || "https://www.ovalorcapital.com.br/assets/og-default.jpg";
        const url = window.location.href;
        upsertMeta("property","og:type","article");
        upsertMeta("property","og:site_name","O Valor Capital");
        upsertMeta("property","og:url", url);
        upsertMeta("property","og:title", titulo);
        upsertMeta("property","og:description", descricao);
        upsertMeta("property","og:image", imagem);
        upsertMeta("property","og:image:width","1200");
        upsertMeta("property","og:image:height","630");
        upsertMeta("property","og:locale","pt_BR");
        upsertMeta("name","twitter:card","summary_large_image");
        upsertMeta("name","twitter:site","@ovalorcapital");
        upsertMeta("name","twitter:title", titulo);
        upsertMeta("name","twitter:description", descricao);
        upsertMeta("name","twitter:image", imagem);
        let canonical = document.querySelector('link[rel="canonical"]');
        if(!canonical){ canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
        canonical.href = url;
      })(p);

      if(typeof OVC !== "undefined" && OVC.applyCategoryColor){
        OVC.applyCategoryColor(p.categoria||"geral");
      }

      loadMais(p.categoria, p.id);

    } catch(e){
      if(bodyEl) bodyEl.innerHTML = "<p>Matéria não encontrada.</p>";
    }
  }

  async function loadMais(categoria, idAtual){
    const maisEl = document.getElementById("ovc-art-mais");
    if(!maisEl) return;
    try{
      const res = await fetch(API + "?limit=6" + (categoria ? "&categoria="+categoria : ""));
      const json = await res.json();
      const posts = (json.posts||[]).filter(p => p.id !== idAtual && p.titulo).slice(0,5);
      maisEl.innerHTML = posts.map(p => `
        <article class="ovc-mini-item" onclick="location.href='${buildUrl(p)}'" style="cursor:pointer">
          <div>
            <div class="ovc-kicker">${catLabel(p.categoria)}</div>
            <h4><a href="${buildUrl(p)}" onclick="event.stopPropagation()">${p.titulo}</a></h4>
          </div>
          ${p.imagem ? `<a href="${buildUrl(p)}" onclick="event.stopPropagation()" class="ovc-thumb"><img src="${p.imagem}" alt="" onerror="this.parentElement.style.display='none'"></a>` : ""}
        </article>
      `).join("");
    } catch(_) {}
  }

  document.addEventListener("DOMContentLoaded", loadMateria);
})();
