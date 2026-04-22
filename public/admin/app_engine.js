
const { createClient } = supabase;

const db = createClient(
  "https://bfsegqdgscudtdgwdyci.supabase.co",
  "sb_publishable_Unww7VA8g1mlixn65Mq0EA_WhG0L-S_"
);

function App(){
  const [tab,setTab] = React.useState("dashboard");
  const tabs = ["dashboard","novopost","pipeline","posts","accounts","sources","logs","config"];

  return React.createElement("div",null,
    React.createElement("div",{className:"nav"},
      tabs.map(t=>React.createElement("button",{onClick:()=>setTab(t)},t))
    ),
    React.createElement(Content,{tab})
  );
}

function Content({tab}){
  switch(tab){
    case "dashboard": return React.createElement(Dashboard);
    case "novopost": return React.createElement(NovoPost);
    case "pipeline": return React.createElement(Pipeline);
    case "posts": return React.createElement(Posts);
    case "accounts": return React.createElement(Accounts);
    case "sources": return React.createElement(Sources);
    case "logs": return React.createElement(Logs);
    case "config": return React.createElement(Config);
  }
}


// NOVO POST — inserção manual por URL ou texto (portal web only)
function NovoPost(){
  const [url,setUrl]=React.useState("");
  const [texto,setTexto]=React.useState("");
  const [modo,setModo]=React.useState("url");
  const [loading,setLoading]=React.useState(false);
  const [resultado,setResultado]=React.useState(null);
  const [erro,setErro]=React.useState("");

  async function gerar(publicarDireto){
    if(modo==="url"&&!url.trim()){setErro("Informe uma URL");return;}
    if(modo==="texto"&&!texto.trim()){setErro("Informe o texto");return;}
    setLoading(true);setErro("");setResultado(null);
    try{
      const body=modo==="url"?{url:url.trim(),publicar:publicarDireto}:{texto:texto.trim(),publicar:publicarDireto};
      const r=await fetch("/api/manual_post",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      const d=await r.json();
      if(!r.ok)throw new Error(d.error||"Erro ao gerar");
      setResultado(d);setUrl("");setTexto("");
    }catch(e){setErro(e.message);}
    setLoading(false);
  }

  const card={background:"var(--ovc-surface)",border:"1px solid rgba(15,23,42,.12)",borderRadius:18,padding:28,marginBottom:20};
  const inp={width:"100%",padding:"12px 14px",borderRadius:12,border:"1px solid rgba(15,23,42,.16)",background:"var(--ovc-surface)",color:"var(--ovc-text)",fontSize:15,boxSizing:"border-box",marginTop:6};
  const btn=(active)=>({background:active?"#2563eb":"rgba(15,23,42,.08)",color:active?"#fff":"var(--ovc-text)",border:"none",padding:"10px 22px",borderRadius:999,cursor:"pointer",fontWeight:700,fontSize:14});

  return React.createElement("div",null,
    React.createElement("h2",{style:{margin:"0 0 6px"}},"Novo Post Manual"),
    React.createElement("p",{style:{color:"var(--ovc-muted)",marginBottom:24}},"Cole um link ou texto. O sistema reescreve no padrão OVC e salva para aprovação."),
    React.createElement("div",{style:card},
      React.createElement("div",{style:{display:"flex",gap:10,marginBottom:20}},
        React.createElement("button",{style:btn(modo==="url"),onClick:()=>setModo("url")},"🔗 Por URL"),
        React.createElement("button",{style:btn(modo==="texto"),onClick:()=>setModo("texto")},"📝 Por Texto")
      ),
      modo==="url"
        ?React.createElement("label",{style:{display:"block",fontWeight:700,fontSize:14}},"URL da notícia",
            React.createElement("input",{style:inp,placeholder:"https://...",value:url,onChange:e=>setUrl(e.target.value),disabled:loading}))
        :React.createElement("label",{style:{display:"block",fontWeight:700,fontSize:14}},"Texto da notícia",
            React.createElement("textarea",{style:{...inp,minHeight:150,resize:"vertical"},placeholder:"Cole o texto completo aqui...",value:texto,onChange:e=>setTexto(e.target.value),disabled:loading})),
      React.createElement("div",{style:{marginTop:20,display:"flex",gap:12,flexWrap:"wrap"}},
        React.createElement("button",{style:{...btn(true),opacity:loading?.6:1},onClick:()=>gerar(false),disabled:loading},loading?"⏳ Gerando...":"✍️ Gerar — salvar como pendente"),
        React.createElement("button",{style:{...btn(false),opacity:loading?.6:1},onClick:()=>gerar(true),disabled:loading},"🚀 Gerar e publicar direto")
      ),
      erro&&React.createElement("div",{style:{background:"rgba(220,38,38,.1)",border:"1px solid rgba(220,38,38,.3)",borderRadius:12,padding:14,color:"#dc2626",marginTop:14}},"⚠️ "+erro),
      resultado&&React.createElement("div",{style:{background:"rgba(22,163,74,.1)",border:"1px solid rgba(22,163,74,.3)",borderRadius:12,padding:18,marginTop:16}},
        React.createElement("div",{style:{fontWeight:700,color:"#16a34a",marginBottom:10}},resultado.status==="publicado"?"✅ Publicado!":"✅ Salvo como pendente — vá em Posts para aprovar"),
        React.createElement("div",{style:{fontWeight:700,fontSize:15,marginBottom:4}},resultado.titulo),
        React.createElement("div",{style:{fontSize:13,color:"var(--ovc-muted)"}},"Categoria: "+resultado.categoria)
      )
    )
  );
}


// DASHBOARD (today/week, last 10 posts, last 10 errors, realtime polling)
function Dashboard(){
  const [data,setData] = React.useState({});
  const [posts,setPosts] = React.useState([]);
  const [errors,setErrors] = React.useState([]);

  async function load(){
    const res = await fetch("/api/status");
    const json = await res.json();
    setData(json);

    const { data:p } = await db.from("posts").select("*").order("created_at",{ascending:false}).limit(10);
    setPosts(p||[]);

    const { data:e } = await db.from("logs").select("*").eq("level","error").order("created_at",{ascending:false}).limit(10);
    setErrors(e||[]);
  }

  React.useEffect(()=>{
    load();
    const id = setInterval(load,30000);
    return ()=>clearInterval(id);
  },[]);

  return React.createElement("div",{className:"card"},
    React.createElement("h2",null,"Dashboard"),
    React.createElement("p",null,"Posts Hoje: ",data.posts_hoje),
    React.createElement("p",null,"Posts Semana: ",data.posts_semana),
    React.createElement("p",null,"Status: ",data.running?"Rodando":"Pausada"),
    React.createElement("div",{className:"row"},
      React.createElement("div",{className:"col"},
        React.createElement("h3",null,"Últimos 10 posts"),
        posts.map(p=>React.createElement("div",{className:"small"},p.titulo+" | "+p.status))
      ),
      React.createElement("div",{className:"col"},
        React.createElement("h3",null,"Últimos 10 erros"),
        errors.map(e=>React.createElement("div",{className:"small"},e.message))
      )
    )
  );
}

// PIPELINE (queue status, manual run, toggle automation, max/day, recent runs)
function Pipeline(){
  const [cfg,setCfg] = React.useState({});
  const [runs,setRuns] = React.useState([]);
  const [queue,setQueue] = React.useState([]);

  async function load(){
    const { data:c } = await db.from("config").select("*");
    const map = {};
    (c||[]).forEach(x=>map[x.key]=x.value);
    setCfg(map);

    // executions recent (from logs tagged as run)
    const { data:r } = await db.from("logs").select("*").ilike("message","%run%").order("created_at",{ascending:false}).limit(10);
    setRuns(r||[]);

    // queue approximation: recent posts not success
    const { data:q } = await db.from("posts").select("*").neq("status","success").order("created_at",{ascending:false}).limit(20);
    setQueue(q||[]);
  }

  async function runNow(){
    await fetch("/api/run",{method:"POST"});
    load();
  }

  async function toggle(){
    const v = cfg.AUTOMATION === "on" ? "off" : "on";
    await db.from("config").insert({key:"AUTOMATION", value:v});
    load();
  }

  async function save(){
    const entries = [
      ["MAX_POSTS_DIA", document.getElementById("max").value],
      ["INTERVALO_MIN", document.getElementById("intervalo").value]
    ];
    for (const [k,v] of entries){
      if(v) await db.from("config").insert({key:k,value:v});
    }
    load();
  }

  React.useEffect(()=>{load()},[]);

  return React.createElement("div",{className:"card"},
    React.createElement("h2",null,"Pipeline"),
    React.createElement("button",{onClick:runNow},"Executar agora"),
    React.createElement("button",{onClick:toggle}, (cfg.AUTOMATION==="on"?"Desligar":"Ligar")+" automação"),
    React.createElement("div",null,
      React.createElement("input",{id:"max",placeholder:"MAX_POSTS_DIA"}),
      React.createElement("input",{id:"intervalo",placeholder:"INTERVALO_MIN"}),
      React.createElement("button",{onClick:save},"Salvar")
    ),
    React.createElement("h3",null,"Fila (aprox.)"),
    queue.map(i=>React.createElement("div",{className:"small"},i.titulo+" | "+i.status)),
    React.createElement("h3",null,"Execuções recentes"),
    runs.map(r=>React.createElement("div",{className:"small"},r.message))
  );
}

// POSTS — aprovação com destino: Portal Web ou Instagram
function Posts(){
  const [items,setItems] = React.useState([]);
  const [filter,setFilter] = React.useState("pendente");
  const [selected,setSelected] = React.useState(null);
  const [loading,setLoading] = React.useState(false);
  const [selIds,setSelIds] = React.useState([]);

  async function load(){
    let q = db.from("posts").select("*").order("created_at",{ascending:false}).limit(150);
    if(filter) q = q.eq("status",filter);
    const { data } = await q;
    setItems(data||[]);
    setSelIds([]);
  }

  React.useEffect(()=>{load()},[filter]);

  // Publicar no PORTAL
  async function pubPortal(id){
    setLoading(true);
    const now = new Date().toISOString();
    await db.from("posts").update({
      status:"publicado", approved:true,
      publish_method:"portal", published_at:now, updated_at:now
    }).eq("id",id);
    await load(); setSelected(null); setLoading(false);
  }

  // Publicar no INSTAGRAM
  async function pubIG(id){
    setLoading(true);
    const now = new Date().toISOString();
    await db.from("posts").update({
      status:"approved", approved:true,
      publish_method:"api", updated_at:now
    }).eq("id",id);
    // Disparar worker IG
    await fetch("/api/approve",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});
    await load(); setSelected(null); setLoading(false);
  }

  // Rejeitar
  async function rejeitar(id){
    await db.from("posts").update({status:"rejeitado",approved:false}).eq("id",id);
    await load(); setSelected(null);
  }

  // Lote portal
  async function lotePortal(){
    if(!selIds.length) return;
    setLoading(true);
    const now = new Date().toISOString();
    for(const id of selIds){
      await db.from("posts").update({status:"publicado",approved:true,publish_method:"portal",published_at:now,updated_at:now}).eq("id",id);
    }
    await load(); setLoading(false);
  }

  // Lote IG
  async function loteIG(){
    if(!selIds.length) return;
    setLoading(true);
    await fetch("/api/approve",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ids:selIds})});
    await load(); setLoading(false);
  }

  function toggleSel(id){ setSelIds(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]); }
  function toggleAll(){ setSelIds(s=>s.length===items.length?[]:items.map(p=>p.id)); }

  const bts = (label,fn,cor,dis) => React.createElement("button",{
    onClick:fn, disabled:dis||loading,
    style:{background:cor,color:"#fff",border:"none",borderRadius:5,padding:"4px 10px",cursor:"pointer",fontWeight:700,fontSize:12,opacity:(dis||loading)?0.5:1}
  },label);

  return React.createElement("div",{className:"card"},
    // Filtros e ações em lote
    React.createElement("div",{style:{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}},
      React.createElement("select",{value:filter,onChange:e=>setFilter(e.target.value),style:{background:"#111120",color:"#f1f1f1",border:"1px solid rgba(255,255,255,0.1)",borderRadius:5,padding:"6px 10px"}},
        React.createElement("option",{value:"pendente"},"Pendentes"),
        React.createElement("option",{value:"publicado"},"Publicados Portal"),
        React.createElement("option",{value:"success"},"Publicados IG"),
        React.createElement("option",{value:"rejeitado"},"Rejeitados"),
        React.createElement("option",{value:"error"},"Erros"),
        React.createElement("option",{value:""},"Todos")
      ),
      selIds.length>0 && React.createElement("span",{style:{fontSize:12,color:"#888"}},selIds.length+" selecionados"),
      selIds.length>0 && bts("▶ Portal (lote)",lotePortal,"#16a34a"),
      selIds.length>0 && bts("📱 Instagram (lote)",loteIG,"#c81e1e"),
      React.createElement("button",{onClick:load,style:{background:"#1e293b",color:"#f1f1f1",border:"none",borderRadius:5,padding:"5px 12px",cursor:"pointer",fontSize:12}},"↺")
    ),

    // Tabela
    React.createElement("table",{style:{width:"100%",borderCollapse:"collapse"}},
      React.createElement("thead",null,
        React.createElement("tr",{style:{background:"#111120",fontSize:11,color:"#888"}},
          React.createElement("th",{style:{padding:"8px",width:32}},
            React.createElement("input",{type:"checkbox",checked:selIds.length===items.length&&items.length>0,onChange:toggleAll})
          ),
          React.createElement("th",{style:{padding:"8px",textAlign:"left"}},"TÍTULO"),
          React.createElement("th",{style:{padding:"8px",width:100}},"STATUS"),
          React.createElement("th",{style:{padding:"8px",width:130}},"DESTINO"),
          React.createElement("th",{style:{padding:"8px",width:140}},"DATA"),
          React.createElement("th",{style:{padding:"8px",width:180}},"AÇÕES")
        )
      ),
      React.createElement("tbody",null,
        items.map((p,i)=>{
          const destino = p.publish_method==="portal"?"🌐 Portal":"📱 Instagram";
          const corDest = p.publish_method==="portal"?"#16a34a":"#c81e1e";
          const corStatus = {pendente:"#ffc800",publicado:"#16a34a",success:"#16a34a",rejeitado:"#c81e1e",error:"#c81e1e",approved:"#3b82f6"}[p.status]||"#888";
          return React.createElement("tr",{key:p.id,style:{borderBottom:"1px solid rgba(255,255,255,0.04)",background:i%2===0?"transparent":"rgba(255,255,255,0.01)"}},
            React.createElement("td",{style:{padding:"8px",textAlign:"center"}},
              React.createElement("input",{type:"checkbox",checked:selIds.includes(p.id),onChange:()=>toggleSel(p.id)})
            ),
            React.createElement("td",{style:{padding:"8px"}},
              React.createElement("a",{href:"#",onClick:e=>{e.preventDefault();setSelected(p)},style:{color:"#f1f1f1",textDecoration:"none",fontSize:13,fontWeight:500}},
                p.titulo||"(sem título)")
            ),
            React.createElement("td",{style:{padding:"8px",textAlign:"center"}},
              React.createElement("span",{style:{background:corStatus+"22",color:corStatus,borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:700}},p.status)
            ),
            React.createElement("td",{style:{padding:"8px",textAlign:"center",fontSize:11,color:corDest,fontWeight:600}},destino),
            React.createElement("td",{style:{padding:"8px",fontSize:11,color:"#888"}},
              new Date(p.created_at).toLocaleString("pt-BR")
            ),
            React.createElement("td",{style:{padding:"8px"}},
              p.status==="pendente" && React.createElement("div",{style:{display:"flex",gap:4}},
                bts("👁",""),
                React.createElement("button",{onClick:()=>setSelected(p),style:{background:"#1e293b",color:"#f1f1f1",border:"none",borderRadius:5,padding:"4px 8px",cursor:"pointer",fontSize:12}},"👁"),
                bts("🌐 Portal",()=>pubPortal(p.id),"#16a34a"),
                bts("📱 IG",()=>pubIG(p.id),"#c81e1e"),
                bts("✗",()=>rejeitar(p.id),"#333")
              )
            )
          );
        })
      )
    ),

    // Preview modal
    selected && React.createElement("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.85)",zIndex:1000,overflow:"auto",padding:24}},
      React.createElement("div",{style:{background:"#0f0f1a",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,maxWidth:760,margin:"0 auto",padding:28}},
        React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}},
          React.createElement("h3",{style:{color:"#ffc800",margin:0,flex:1,fontSize:18}},selected.titulo||"(sem título)"),
          React.createElement("button",{onClick:()=>setSelected(null),style:{background:"transparent",color:"#888",border:"none",fontSize:20,cursor:"pointer",padding:"0 4px"}},"✕")
        ),
        selected.imagem && React.createElement("img",{src:selected.imagem,style:{width:"100%",maxHeight:260,objectFit:"cover",borderRadius:8,marginBottom:14},onError:e=>e.target.style.display="none"}),
        React.createElement("div",{style:{background:"#08080f",borderRadius:8,padding:14,fontSize:13,lineHeight:1.8,whiteSpace:"pre-wrap",color:"#e5e7eb",maxHeight:360,overflow:"auto",marginBottom:16}},
          selected.conteudo||""
        ),
        selected.status==="pendente" && React.createElement("div",{style:{display:"flex",gap:10,flexWrap:"wrap"}},
          bts("🌐 Publicar no Portal",()=>pubPortal(selected.id),"#16a34a",loading),
          bts("📱 Publicar no Instagram",()=>pubIG(selected.id),"#c81e1e",loading),
          bts("✗ Rejeitar",()=>rejeitar(selected.id),"#444",loading)
        )
      )
    )
  );
}

// ACCOUNTS (CRUD, activate/deactivate, posts per account)
function Accounts(){
  const [items,setItems] = React.useState([]);
  const [form,setForm] = React.useState({});
  const [selected,setSelected] = React.useState(null);
  const [posts,setPosts] = React.useState([]);

  async function load(){
    const { data } = await db.from("ig_accounts").select("*");
    setItems(data||[]);
  }

  async function add(){
    await db.from("ig_accounts").insert(form);
    load();
  }

  async function toggle(id,active){
    await db.from("ig_accounts").update({active:!active}).eq("id",id);
    load();
  }

  async function loadPosts(acc){
    setSelected(acc);
    // approximation: posts today count
    const { data } = await db.from("posts").select("*").order("created_at",{ascending:false}).limit(20);
    setPosts(data||[]);
  }

  React.useEffect(()=>{load()},[]);

  return React.createElement("div",{className:"card"},
    React.createElement("div",null,
      React.createElement("input",{placeholder:"username",onChange:e=>setForm({...form,username:e.target.value})}),
      React.createElement("input",{placeholder:"IG ID",onChange:e=>setForm({...form,ig_user_id:e.target.value})}),
      React.createElement("input",{placeholder:"token",onChange:e=>setForm({...form,token:e.target.value})}),
      React.createElement("button",{onClick:add},"Adicionar")
    ),
    items.map(i=>React.createElement("div",null,
      i.username,
      React.createElement("button",{onClick:()=>toggle(i.id,i.active)}, i.active?"Desativar":"Ativar"),
      React.createElement("button",{onClick:()=>loadPosts(i)},"Ver posts")
    )),
    selected && React.createElement("div",{className:"card"},
      React.createElement("h3",null,"Posts (amostra) - "+selected.username),
      posts.map(p=>React.createElement("div",{className:"small"},p.titulo))
    )
  );
}

// SOURCES (CRUD, activate/deactivate, last_fetched, volume)
function Sources(){
  const [items,setItems] = React.useState([]);
  const [form,setForm] = React.useState({});

  async function load(){
    const { data } = await db.from("rss_sources").select("*");
    setItems(data||[]);
  }

  async function add(){
    await db.from("rss_sources").insert(form);
    load();
  }

  async function toggle(id,active){
    await db.from("rss_sources").update({active:!active}).eq("id",id);
    load();
  }

  React.useEffect(()=>{load()},[]);

  return React.createElement("div",{className:"card"},
    React.createElement("div",null,
      React.createElement("input",{placeholder:"Nome",onChange:e=>setForm({...form,name:e.target.value})}),
      React.createElement("input",{placeholder:"URL",onChange:e=>setForm({...form,url:e.target.value})}),
      React.createElement("button",{onClick:add},"Adicionar")
    ),
    items.map(i=>React.createElement("div",null,
      i.name,
      " | ", i.active?"Ativo":"Off",
      " | last: ", (i.last_fetched||"-"),
      React.createElement("button",{onClick:()=>toggle(i.id,i.active)}, i.active?"Desativar":"Ativar")
    ))
  );
}

// LOGS (type/date filter)
function Logs(){
  const [items,setItems] = React.useState([]);
  const [level,setLevel] = React.useState("");
  const [date,setDate] = React.useState("");

  async function load(){
    let q = db.from("logs").select("*").order("created_at",{ascending:false});
    if(level) q = q.eq("level",level);
    if(date) q = q.gte("created_at", date);
    const { data } = await q;
    setItems(data||[]);
  }

  React.useEffect(()=>{load()},[level,date]);

  return React.createElement("div",{className:"card"},
    React.createElement("div",null,
      React.createElement("select",{onChange:e=>setLevel(e.target.value)},
        React.createElement("option",{value:""},"Todos"),
        React.createElement("option",{value:"error"},"Error"),
        React.createElement("option",{value:"info"},"Info")
      ),
      React.createElement("input",{type:"date", onChange:e=>setDate(e.target.value)})
    ),
    items.map(i=>React.createElement("div",{className:"small"},i.level+" - "+i.message+" ("+i.created_at+")"))
  );
}

// CONFIG (daily limit, interval, model, fallback)
function Config(){
  const [items,setItems] = React.useState([]);
  const [form,setForm] = React.useState({});

  async function load(){
    const { data } = await db.from("config").select("*");
    setItems(data||[]);
  }

  async function save(){
    await db.from("config").insert(form);
    load();
  }

  React.useEffect(()=>{load()},[]);

  return React.createElement("div",{className:"card"},
    React.createElement("div",null,
      React.createElement("input",{placeholder:"key (MAX_POSTS_DIA | INTERVALO_MIN | MODEL | FALLBACK)", onChange:e=>setForm({...form,key:e.target.value})}),
      React.createElement("input",{placeholder:"value", onChange:e=>setForm({...form,value:e.target.value})}),
      React.createElement("button",{onClick:save},"Salvar")
    ),
    items.map(i=>React.createElement("div",{className:"small"},i.key+"="+i.value))
  );
}

ReactDOM.createRoot(document.getElementById("app")).render(React.createElement(App));
