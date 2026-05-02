const { createClient } = supabase;
const db = createClient(
  "https://bfsegqdgscudtdgwdyci.supabase.co",
  "sb_publishable_Unww7VA8g1mlixn65Mq0EA_WhG0L-S_"
);

// ── Utilitários ──────────────────────────────────────────────
function fmt(dt){ return dt ? new Date(dt).toLocaleString("pt-BR") : "-"; }
function tag(status){
  const c = {pendente:"#f59e0b",publicado:"#22c55e",rejeitado:"#ef4444",error:"#ef4444",duplicate:"#6b7280",approved:"#22c55e"};
  return React.createElement("span",{style:{background:c[status]||"#6b7280",color:"#fff",borderRadius:4,padding:"2px 8px",fontSize:12,fontWeight:700}}, status);
}

// ── App ──────────────────────────────────────────────────────
function App(){
  const [tab,setTab] = React.useState("pendentes");
  const tabs = ["dashboard","pendentes","publicados","pipeline","fontes","contas","logs","config"];
  return React.createElement("div",{style:{fontFamily:"Inter,sans-serif",background:"#08080f",minHeight:"100vh",color:"#e5e7eb"}},
    React.createElement("div",{style:{background:"#0a0a14",borderBottom:"1px solid #1e293b",padding:"0 16px",display:"flex",gap:4,flexWrap:"wrap"}},
      React.createElement("div",{style:{padding:"12px 8px",fontWeight:700,color:"#ffc800",marginRight:16}},"OVC ADMIN"),
      tabs.map(t=>React.createElement("button",{key:t,onClick:()=>setTab(t),style:{
        background:tab===t?"#1e293b":"transparent",color:tab===t?"#ffc800":"#94a3b8",
        border:"none",padding:"12px 16px",cursor:"pointer",fontSize:13,fontWeight:600,
        borderBottom:tab===t?"2px solid #ffc800":"2px solid transparent"
      }},t.toUpperCase()))
    ),
    React.createElement("div",{style:{padding:24,maxWidth:1400,margin:"0 auto"}},
      tab==="dashboard" && React.createElement(Dashboard),
      tab==="pendentes" && React.createElement(Pendentes),
      tab==="publicados" && React.createElement(Publicados),
      tab==="pipeline" && React.createElement(Pipeline),
      tab==="fontes" && React.createElement(Fontes),
      tab==="contas" && React.createElement(Contas),
      tab==="logs" && React.createElement(Logs),
      tab==="config" && React.createElement(Config)
    )
  );
}

// ── Dashboard ────────────────────────────────────────────────
function Dashboard(){
  const [stats,setStats] = React.useState({});
  const [recentes,setRecentes] = React.useState([]);

  async function load(){
    const hoje = new Date().toISOString().slice(0,10);
    const [r1,r2,r3,r4,r5] = await Promise.all([
      db.from("posts").select("id",{count:"exact",head:true}).eq("status","pendente"),
      db.from("posts").select("id",{count:"exact",head:true}).eq("status","publicado").gte("published_at",hoje),
      db.from("posts").select("id",{count:"exact",head:true}).eq("status","publicado"),
      db.from("posts").select("id",{count:"exact",head:true}).eq("status","rejeitado"),
      db.from("posts").select("id,titulo,status,created_at").order("created_at",{ascending:false}).limit(8)
    ]);
    setStats({ pendentes:r1.count||0, publicadosHoje:r2.count||0, total:r3.count||0, rejeitados:r4.count||0 });
    setRecentes(r5.data||[]);
  }

  React.useEffect(()=>{ load(); const id=setInterval(load,30000); return()=>clearInterval(id); },[]);

  const card = (label,val,cor) => React.createElement("div",{style:{background:"#0f0f1a",border:`1px solid ${cor}33`,borderRadius:8,padding:"20px 24px",flex:1,minWidth:160}},
    React.createElement("div",{style:{fontSize:28,fontWeight:700,color:cor}}, val),
    React.createElement("div",{style:{fontSize:13,color:"#94a3b8",marginTop:4}}, label)
  );

  return React.createElement("div",null,
    React.createElement("h2",{style:{color:"#ffc800",marginBottom:20}},"Dashboard"),
    React.createElement("div",{style:{display:"flex",gap:16,flexWrap:"wrap",marginBottom:24}},
      card("Pendentes de aprovação", stats.pendentes, "#f59e0b"),
      card("Publicados hoje", stats.publicadosHoje, "#22c55e"),
      card("Total publicados", stats.total, "#3b82f6"),
      card("Rejeitados", stats.rejeitados, "#ef4444")
    ),
    React.createElement("div",{style:{background:"#0f0f1a",border:"1px solid #1e293b",borderRadius:8,padding:20}},
      React.createElement("h3",{style:{color:"#e5e7eb",margin:"0 0 12px"}},"Últimas matérias"),
      recentes.map(p=>React.createElement("div",{key:p.id,style:{display:"flex",gap:12,alignItems:"center",padding:"8px 0",borderBottom:"1px solid #1e293b"}},
        tag(p.status),
        React.createElement("span",{style:{flex:1,fontSize:14}}, p.titulo||"-"),
        React.createElement("span",{style:{fontSize:12,color:"#6b7280"}}, fmt(p.created_at))
      ))
    )
  );
}

// ── PENDENTES (aprovação individual + lote) ──────────────────
function Pendentes(){
  const [items,setItems] = React.useState([]);
  const [selected,setSelected] = React.useState([]);
  const [preview,setPreview] = React.useState(null);
  const [editMode,setEditMode] = React.useState(false);
  const [editData,setEditData] = React.useState({});
  const [loading,setLoading] = React.useState(false);
  const [busca,setBusca] = React.useState("");

  async function load(){
    const { data } = await db.from("posts").select("*").eq("status","pendente").order("created_at",{ascending:false}).limit(200);
    setItems(data||[]);
    setSelected([]);
  }

  React.useEffect(()=>{ load(); },[]);

  const filtrados = items.filter(p=> !busca || (p.titulo||"").toLowerCase().includes(busca.toLowerCase()));

  async function aprovar(id){
    setLoading(true);
    await fetch("/api/approve_portal",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"aprovar",id})});
    await load(); setPreview(null); setLoading(false);
  }

  async function rejeitar(id){
    setLoading(true);
    await fetch("/api/approve_portal",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"rejeitar",id})});
    await load(); setPreview(null); setLoading(false);
  }

  async function editarAprovar(){
    setLoading(true);
    await fetch("/api/approve_portal",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"editar_aprovar",id:preview.id,...editData})});
    await load(); setPreview(null); setEditMode(false); setLoading(false);
  }

  async function aprovarLote(){
    if(!selected.length) return;
    setLoading(true);
    await fetch("/api/approve_portal",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"aprovar_lote",ids:selected})});
    await load(); setLoading(false);
  }

  async function rejeitarLote(){
    if(!selected.length) return;
    setLoading(true);
    await fetch("/api/approve_portal",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"rejeitar_lote",ids:selected})});
    await load(); setLoading(false);
  }

  function toggleSel(id){ setSelected(s=> s.includes(id)?s.filter(x=>x!==id):[...s,id]); }
  function toggleAll(){ setSelected(s=> s.length===filtrados.length ? [] : filtrados.map(p=>p.id)); }

  function abrirPreview(p){ setPreview(p); setEditMode(false); setEditData({titulo:p.titulo,conteudo:p.conteudo,imagem:p.imagem,comentario_fixado:p.comentario_fixado}); }

  const btnStyle = (cor) => ({background:cor,color:"#fff",border:"none",borderRadius:6,padding:"8px 16px",cursor:"pointer",fontWeight:700,fontSize:13});
  const inp = (val,key,multiline) => multiline
    ? React.createElement("textarea",{value:val||"",rows:10,onChange:e=>setEditData(d=>({...d,[key]:e.target.value})),style:{width:"100%",background:"#08080f",color:"#e5e7eb",border:"1px solid #1e293b",borderRadius:6,padding:8,fontSize:13,resize:"vertical"}})
    : React.createElement("input",{value:val||"",onChange:e=>setEditData(d=>({...d,[key]:e.target.value})),style:{width:"100%",background:"#08080f",color:"#e5e7eb",border:"1px solid #1e293b",borderRadius:6,padding:"8px",fontSize:13,marginBottom:8}});

  return React.createElement("div",null,
    React.createElement("div",{style:{display:"flex",gap:12,alignItems:"center",marginBottom:16,flexWrap:"wrap"}},
      React.createElement("h2",{style:{color:"#f59e0b",margin:0}},`Pendentes (${items.length})`),
      React.createElement("input",{placeholder:"Buscar...",value:busca,onChange:e=>setBusca(e.target.value),style:{background:"#0f0f1a",color:"#e5e7eb",border:"1px solid #1e293b",borderRadius:6,padding:"6px 12px",fontSize:13,flex:1,maxWidth:300}}),
      selected.length>0 && React.createElement("span",{style:{fontSize:13,color:"#94a3b8"}},`${selected.length} selecionadas`),
      selected.length>0 && React.createElement("button",{onClick:aprovarLote,style:btnStyle("#22c55e"),disabled:loading},`✓ Aprovar ${selected.length}`),
      selected.length>0 && React.createElement("button",{onClick:rejeitarLote,style:btnStyle("#ef4444"),disabled:loading},`✗ Rejeitar ${selected.length}`),
      React.createElement("button",{onClick:load,style:btnStyle("#3b82f6"),disabled:loading},"↺ Atualizar")
    ),

    // Tabela
    React.createElement("div",{style:{background:"#0f0f1a",border:"1px solid #1e293b",borderRadius:8,overflow:"hidden"}},
      React.createElement("table",{style:{width:"100%",borderCollapse:"collapse"}},
        React.createElement("thead",null,
          React.createElement("tr",{style:{background:"#1e293b"}},
            React.createElement("th",{style:{padding:"10px 12px",textAlign:"left",width:40}},
              React.createElement("input",{type:"checkbox",checked:selected.length===filtrados.length&&filtrados.length>0,onChange:toggleAll})
            ),
            React.createElement("th",{style:{padding:"10px 12px",textAlign:"left",fontSize:12,color:"#94a3b8"}},"TÍTULO"),
            React.createElement("th",{style:{padding:"10px 12px",textAlign:"left",fontSize:12,color:"#94a3b8",width:120}},"CATEGORIA"),
            React.createElement("th",{style:{padding:"10px 12px",textAlign:"left",fontSize:12,color:"#94a3b8",width:150}},"CRIADO"),
            React.createElement("th",{style:{padding:"10px 12px",textAlign:"right",fontSize:12,color:"#94a3b8",width:200}},"AÇÕES")
          )
        ),
        React.createElement("tbody",null,
          filtrados.map((p,i)=>{
            let cat = "-"; try{ const t=JSON.parse(p.user_tags||"[]"); cat=t[0]||"-"; }catch(_){}
            return React.createElement("tr",{key:p.id,style:{borderTop:"1px solid #1e293b",background:i%2===0?"#0f0f1a":"#0d0d18"}},
              React.createElement("td",{style:{padding:"10px 12px"}},
                React.createElement("input",{type:"checkbox",checked:selected.includes(p.id),onChange:()=>toggleSel(p.id)})
              ),
              React.createElement("td",{style:{padding:"10px 12px"}},
                React.createElement("a",{href:"#",onClick:e=>{e.preventDefault();abrirPreview(p)},style:{color:"#e5e7eb",textDecoration:"none",fontSize:14,fontWeight:500}}, p.titulo||"(sem título)")
              ),
              React.createElement("td",{style:{padding:"10px 12px",fontSize:13,color:"#94a3b8"}}, cat),
              React.createElement("td",{style:{padding:"10px 12px",fontSize:12,color:"#6b7280"}}, fmt(p.created_at)),
              React.createElement("td",{style:{padding:"10px 12px",textAlign:"right",display:"flex",gap:6,justifyContent:"flex-end"}},
                React.createElement("button",{onClick:()=>abrirPreview(p),style:{...btnStyle("#1e293b"),padding:"4px 10px"}},"👁"),
                React.createElement("button",{onClick:()=>aprovar(p.id),style:{...btnStyle("#22c55e"),padding:"4px 10px"},disabled:loading},"✓"),
                React.createElement("button",{onClick:()=>rejeitar(p.id),style:{...btnStyle("#ef4444"),padding:"4px 10px"},disabled:loading},"✗")
              )
            );
          })
        )
      )
    ),

    // Modal preview
    preview && React.createElement("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.85)",zIndex:1000,overflow:"auto",padding:24}},
      React.createElement("div",{style:{background:"#0f0f1a",border:"1px solid #1e293b",borderRadius:12,maxWidth:800,margin:"0 auto",padding:32}},
        React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}},
          React.createElement("h3",{style:{color:"#ffc800",margin:0,flex:1}}, editMode ? "Editar matéria" : preview.titulo),
          React.createElement("button",{onClick:()=>setPreview(null),style:{background:"transparent",color:"#94a3b8",border:"none",fontSize:20,cursor:"pointer"}},"✕")
        ),

        !editMode && React.createElement("div",null,
          preview.imagem && React.createElement("img",{src:preview.imagem,style:{width:"100%",maxHeight:300,objectFit:"cover",borderRadius:8,marginBottom:16},onError:e=>e.target.style.display="none"}),
          React.createElement("div",{style:{fontSize:12,color:"#94a3b8",marginBottom:8}}, "Subtítulo: "+(preview.comentario_fixado||"-")),
          React.createElement("div",{style:{background:"#08080f",borderRadius:8,padding:16,fontSize:14,lineHeight:1.8,whiteSpace:"pre-wrap",color:"#e5e7eb",maxHeight:400,overflow:"auto"}}, preview.conteudo)
        ),

        editMode && React.createElement("div",null,
          React.createElement("label",{style:{fontSize:12,color:"#94a3b8"}},"Título"),
          inp(editData.titulo,"titulo",false),
          React.createElement("label",{style:{fontSize:12,color:"#94a3b8"}},"Subtítulo"),
          inp(editData.comentario_fixado,"comentario_fixado",false),
          React.createElement("label",{style:{fontSize:12,color:"#94a3b8"}},"Imagem URL"),
          inp(editData.imagem,"imagem",false),
          React.createElement("label",{style:{fontSize:12,color:"#94a3b8"}},"Corpo"),
          inp(editData.conteudo,"conteudo",true)
        ),

        React.createElement("div",{style:{display:"flex",gap:10,marginTop:20,flexWrap:"wrap"}},
          !editMode && React.createElement("button",{onClick:()=>setEditMode(true),style:btnStyle("#3b82f6")},"✏ Editar"),
          editMode && React.createElement("button",{onClick:editarAprovar,style:btnStyle("#22c55e"),disabled:loading},"✓ Salvar e Publicar"),
          editMode && React.createElement("button",{onClick:()=>setEditMode(false),style:btnStyle("#6b7280")},"← Voltar"),
          !editMode && React.createElement("button",{onClick:()=>aprovar(preview.id),style:btnStyle("#22c55e"),disabled:loading},"✓ Aprovar e Publicar"),
          React.createElement("button",{onClick:()=>rejeitar(preview.id),style:btnStyle("#ef4444"),disabled:loading},"✗ Rejeitar")
        )
      )
    )
  );
}

// ── PUBLICADOS ───────────────────────────────────────────────
function Publicados(){
  const [items,setItems] = React.useState([]);
  const [busca,setBusca] = React.useState("");

  async function load(){
    const { data } = await db.from("posts").select("id,titulo,comentario_fixado,imagem,user_tags,published_at,created_at").eq("status","publicado").order("published_at",{ascending:false}).limit(100);
    setItems(data||[]);
  }

  async function despublicar(id){
    await db.from("posts").update({status:"pendente",approved:false,published_at:null}).eq("id",id);
    load();
  }

  React.useEffect(()=>{ load(); },[]);

  const filtrados = items.filter(p=> !busca || (p.titulo||"").toLowerCase().includes(busca.toLowerCase()));
  const btnStyle = (cor) => ({background:cor,color:"#fff",border:"none",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontWeight:700,fontSize:12});

  return React.createElement("div",null,
    React.createElement("div",{style:{display:"flex",gap:12,alignItems:"center",marginBottom:16}},
      React.createElement("h2",{style:{color:"#22c55e",margin:0}},`Publicados (${items.length})`),
      React.createElement("input",{placeholder:"Buscar...",value:busca,onChange:e=>setBusca(e.target.value),style:{background:"#0f0f1a",color:"#e5e7eb",border:"1px solid #1e293b",borderRadius:6,padding:"6px 12px",fontSize:13,flex:1,maxWidth:300}})
    ),
    React.createElement("div",{style:{background:"#0f0f1a",border:"1px solid #1e293b",borderRadius:8,overflow:"hidden"}},
      React.createElement("table",{style:{width:"100%",borderCollapse:"collapse"}},
        React.createElement("thead",null,
          React.createElement("tr",{style:{background:"#1e293b"}},
            React.createElement("th",{style:{padding:"10px 12px",textAlign:"left",fontSize:12,color:"#94a3b8"}},"TÍTULO"),
            React.createElement("th",{style:{padding:"10px 12px",textAlign:"left",fontSize:12,color:"#94a3b8",width:120}},"CATEGORIA"),
            React.createElement("th",{style:{padding:"10px 12px",textAlign:"left",fontSize:12,color:"#94a3b8",width:150}},"PUBLICADO"),
            React.createElement("th",{style:{padding:"10px 12px",textAlign:"right",fontSize:12,color:"#94a3b8",width:120}},"AÇÕES")
          )
        ),
        React.createElement("tbody",null,
          filtrados.map((p,i)=>{
            let cat="-"; try{const t=JSON.parse(p.user_tags||"[]");cat=t[0]||"-";}catch(_){}
            return React.createElement("tr",{key:p.id,style:{borderTop:"1px solid #1e293b",background:i%2===0?"#0f0f1a":"#0d0d18"}},
              React.createElement("td",{style:{padding:"10px 12px",fontSize:14}}, p.titulo||"-"),
              React.createElement("td",{style:{padding:"10px 12px",fontSize:13,color:"#94a3b8"}}, cat),
              React.createElement("td",{style:{padding:"10px 12px",fontSize:12,color:"#6b7280"}}, fmt(p.published_at)),
              React.createElement("td",{style:{padding:"10px 12px",textAlign:"right"}},
                React.createElement("button",{onClick:()=>despublicar(p.id),style:btnStyle("#f59e0b")},"Despublicar")
              )
            );
          })
        )
      )
    )
  );
}

// ── PIPELINE ────────────────────────────────────────────────
function Pipeline(){
  const [cfg,setCfg] = React.useState({});
  const [msg,setMsg] = React.useState("");
  const [loading,setLoading] = React.useState(false);

  async function load(){
    const { data } = await db.from("config").select("*");
    const map={}; (data||[]).forEach(x=>map[x.key]=x.value); setCfg(map);
  }

  async function runPortal(){
    setLoading(true); setMsg("Executando...");
    try{ const r=await fetch("/api/run_portal",{method:"POST"}); const j=await r.json(); setMsg(JSON.stringify(j,null,2)); }
    catch(e){ setMsg("Erro: "+e.message); }
    setLoading(false); load();
  }

  async function runIG(){
    setLoading(true); setMsg("Executando Instagram...");
    try{ const r=await fetch("/api/run",{method:"POST"}); const j=await r.json(); setMsg(JSON.stringify(j,null,2)); }
    catch(e){ setMsg("Erro: "+e.message); }
    setLoading(false);
  }

  async function toggle(){
    const v = cfg.AUTOMATION==="on" ? "off" : "on";
    await db.from("config").upsert({key:"AUTOMATION",value:v},{onConflict:"key"});
    load();
  }

  React.useEffect(()=>{ load(); },[]);

  const btn = (label,fn,cor) => React.createElement("button",{onClick:fn,disabled:loading,style:{background:cor,color:"#fff",border:"none",borderRadius:6,padding:"10px 20px",cursor:"pointer",fontWeight:700,fontSize:14,opacity:loading?0.6:1}},label);

  return React.createElement("div",null,
    React.createElement("h2",{style:{color:"#ffc800",marginBottom:20}},"Pipeline"),
    React.createElement("div",{style:{display:"flex",gap:12,flexWrap:"wrap",marginBottom:20}},
      btn("▶ Executar Portal Agora", runPortal, "#3b82f6"),
      btn("▶ Executar Instagram Agora", runIG, "#c81e1e"),
      btn(cfg.AUTOMATION==="on" ? "⏸ Pausar Automação" : "▶ Ligar Automação", toggle, cfg.AUTOMATION==="on"?"#f59e0b":"#22c55e")
    ),
    React.createElement("div",{style:{fontSize:13,color:"#94a3b8",marginBottom:8}},
      "Automação: ",React.createElement("strong",{style:{color:cfg.AUTOMATION==="on"?"#22c55e":"#ef4444"}}, cfg.AUTOMATION==="on"?"LIGADA":"DESLIGADA"),
      " | Cron: a cada 12 min"
    ),
    msg && React.createElement("pre",{style:{background:"#0f0f1a",border:"1px solid #1e293b",borderRadius:8,padding:16,fontSize:12,color:"#22c55e",overflow:"auto",maxHeight:300}}, msg)
  );
}

// ── FONTES ──────────────────────────────────────────────────
function Fontes(){
  const [items,setItems] = React.useState([]);
  const [form,setForm] = React.useState({});
  const [busca,setBusca] = React.useState("");

  async function load(){
    const { data } = await db.from("rss_sources").select("*").order("name");
    setItems(data||[]);
  }

  async function add(){
    if(!form.name||!form.url) return;
    await db.from("rss_sources").insert({name:form.name,url:form.url,active:true});
    setForm({}); load();
  }

  async function toggle(id,active){
    await db.from("rss_sources").update({active:!active}).eq("id",id);
    load();
  }

  async function remover(id){
    if(!confirm("Remover fonte?")) return;
    await db.from("rss_sources").delete().eq("id",id);
    load();
  }

  React.useEffect(()=>{ load(); },[]);

  const filtrados = items.filter(p=> !busca || (p.name||"").toLowerCase().includes(busca.toLowerCase()));
  const ativas = items.filter(x=>x.active).length;

  return React.createElement("div",null,
    React.createElement("div",{style:{display:"flex",gap:12,alignItems:"center",marginBottom:16,flexWrap:"wrap"}},
      React.createElement("h2",{style:{color:"#ffc800",margin:0}},`Fontes RSS (${ativas} ativas / ${items.length} total)`),
      React.createElement("input",{placeholder:"Buscar...",value:busca,onChange:e=>setBusca(e.target.value),style:{background:"#0f0f1a",color:"#e5e7eb",border:"1px solid #1e293b",borderRadius:6,padding:"6px 12px",fontSize:13,flex:1,maxWidth:300}})
    ),
    React.createElement("div",{style:{display:"flex",gap:8,marginBottom:16}},
      React.createElement("input",{placeholder:"Nome da fonte",value:form.name||"",onChange:e=>setForm(f=>({...f,name:e.target.value})),style:{background:"#0f0f1a",color:"#e5e7eb",border:"1px solid #1e293b",borderRadius:6,padding:"8px 12px",fontSize:13,flex:1}}),
      React.createElement("input",{placeholder:"URL RSS",value:form.url||"",onChange:e=>setForm(f=>({...f,url:e.target.value})),style:{background:"#0f0f1a",color:"#e5e7eb",border:"1px solid #1e293b",borderRadius:6,padding:"8px 12px",fontSize:13,flex:2}}),
      React.createElement("button",{onClick:add,style:{background:"#22c55e",color:"#fff",border:"none",borderRadius:6,padding:"8px 16px",cursor:"pointer",fontWeight:700}},"+ Adicionar")
    ),
    React.createElement("div",{style:{background:"#0f0f1a",border:"1px solid #1e293b",borderRadius:8,overflow:"hidden",maxHeight:600,overflowY:"auto"}},
      React.createElement("table",{style:{width:"100%",borderCollapse:"collapse"}},
        React.createElement("thead",null,
          React.createElement("tr",{style:{background:"#1e293b",position:"sticky",top:0}},
            React.createElement("th",{style:{padding:"10px 12px",textAlign:"left",fontSize:12,color:"#94a3b8"}},"FONTE"),
            React.createElement("th",{style:{padding:"10px 12px",textAlign:"left",fontSize:12,color:"#94a3b8"}},"URL"),
            React.createElement("th",{style:{padding:"10px 12px",textAlign:"center",fontSize:12,color:"#94a3b8",width:80}},"STATUS"),
            React.createElement("th",{style:{padding:"10px 12px",textAlign:"right",fontSize:12,color:"#94a3b8",width:150}},"AÇÕES")
          )
        ),
        React.createElement("tbody",null,
          filtrados.map((f,i)=>React.createElement("tr",{key:f.id,style:{borderTop:"1px solid #1e293b",background:i%2===0?"#0f0f1a":"#0d0d18"}},
            React.createElement("td",{style:{padding:"8px 12px",fontSize:13,fontWeight:500}}, f.name),
            React.createElement("td",{style:{padding:"8px 12px",fontSize:11,color:"#6b7280",maxWidth:400,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}, f.url),
            React.createElement("td",{style:{padding:"8px 12px",textAlign:"center"}}, tag(f.active?"publicado":"rejeitado").props ? React.createElement("span",{style:{color:f.active?"#22c55e":"#6b7280",fontSize:12,fontWeight:700}},f.active?"ATIVA":"OFF") : null),
            React.createElement("td",{style:{padding:"8px 12px",textAlign:"right",display:"flex",gap:6,justifyContent:"flex-end"}},
              React.createElement("button",{onClick:()=>toggle(f.id,f.active),style:{background:f.active?"#f59e0b":"#22c55e",color:"#fff",border:"none",borderRadius:4,padding:"3px 10px",cursor:"pointer",fontSize:12,fontWeight:700}}, f.active?"Pausar":"Ativar"),
              React.createElement("button",{onClick:()=>remover(f.id),style:{background:"#ef4444",color:"#fff",border:"none",borderRadius:4,padding:"3px 10px",cursor:"pointer",fontSize:12,fontWeight:700}},"✕")
            )
          ))
        )
      )
    )
  );
}

// ── CONTAS IG ───────────────────────────────────────────────
function Contas(){
  const [items,setItems] = React.useState([]);
  const [form,setForm] = React.useState({});

  async function load(){ const { data } = await db.from("ig_accounts").select("*"); setItems(data||[]); }
  async function add(){ if(!form.username) return; await db.from("ig_accounts").insert({...form,active:true,posts_today:0}); setForm({}); load(); }
  async function toggle(id,active){ await db.from("ig_accounts").update({active:!active}).eq("id",id); load(); }

  React.useEffect(()=>{ load(); },[]);

  const inp = (ph,key) => React.createElement("input",{placeholder:ph,value:form[key]||"",onChange:e=>setForm(f=>({...f,[key]:e.target.value})),style:{background:"#0f0f1a",color:"#e5e7eb",border:"1px solid #1e293b",borderRadius:6,padding:"8px 12px",fontSize:13,flex:1}});

  return React.createElement("div",null,
    React.createElement("h2",{style:{color:"#ffc800",marginBottom:20}},"Contas Instagram"),
    React.createElement("div",{style:{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}},
      inp("Username","username"), inp("IG User ID","ig_user_id"), inp("Access Token","token"),
      React.createElement("button",{onClick:add,style:{background:"#22c55e",color:"#fff",border:"none",borderRadius:6,padding:"8px 16px",cursor:"pointer",fontWeight:700}},"+ Adicionar")
    ),
    items.map((c,i)=>React.createElement("div",{key:c.id,style:{background:"#0f0f1a",border:"1px solid #1e293b",borderRadius:8,padding:16,marginBottom:8,display:"flex",gap:12,alignItems:"center"}},
      React.createElement("span",{style:{fontWeight:700,flex:1}}, "@"+c.username),
      React.createElement("span",{style:{fontSize:12,color:"#6b7280"}}, "Posts hoje: "+(c.posts_today||0)),
      React.createElement("span",{style:{color:c.active?"#22c55e":"#6b7280",fontWeight:700,fontSize:12}}, c.active?"ATIVA":"OFF"),
      React.createElement("button",{onClick:()=>toggle(c.id,c.active),style:{background:c.active?"#f59e0b":"#22c55e",color:"#fff",border:"none",borderRadius:4,padding:"4px 12px",cursor:"pointer",fontSize:12,fontWeight:700}}, c.active?"Pausar":"Ativar")
    ))
  );
}

// ── LOGS ────────────────────────────────────────────────────
function Logs(){
  const [items,setItems] = React.useState([]);
  const [level,setLevel] = React.useState("");

  async function load(){
    let q = db.from("logs").select("*").order("created_at",{ascending:false}).limit(100);
    if(level) q = q.eq("level",level);
    const { data } = await q; setItems(data||[]);
  }

  React.useEffect(()=>{ load(); },[level]);

  return React.createElement("div",null,
    React.createElement("div",{style:{display:"flex",gap:12,alignItems:"center",marginBottom:16}},
      React.createElement("h2",{style:{color:"#ffc800",margin:0}},"Logs"),
      React.createElement("select",{value:level,onChange:e=>setLevel(e.target.value),style:{background:"#0f0f1a",color:"#e5e7eb",border:"1px solid #1e293b",borderRadius:6,padding:"6px 12px",fontSize:13}},
        React.createElement("option",{value:""},"Todos"),
        React.createElement("option",{value:"error"},"Erros"),
        React.createElement("option",{value:"info"},"Info")
      ),
      React.createElement("button",{onClick:load,style:{background:"#3b82f6",color:"#fff",border:"none",borderRadius:6,padding:"6px 16px",cursor:"pointer",fontSize:13,fontWeight:700}},"↺")
    ),
    React.createElement("div",{style:{background:"#0f0f1a",border:"1px solid #1e293b",borderRadius:8,padding:16,fontFamily:"monospace",fontSize:12,maxHeight:500,overflow:"auto"}},
      items.map(l=>React.createElement("div",{key:l.id,style:{padding:"4px 0",borderBottom:"1px solid #1e293b",color:l.level==="error"?"#ef4444":"#94a3b8"}},
        React.createElement("span",{style:{color:"#6b7280",marginRight:8}}, fmt(l.created_at)),
        React.createElement("span",{style:{fontWeight:700,marginRight:8,color:l.level==="error"?"#ef4444":"#22c55e"}}, l.level?.toUpperCase()),
        l.message
      ))
    )
  );
}

// ── CONFIG ──────────────────────────────────────────────────
function Config(){
  const [items,setItems] = React.useState([]);
  const [form,setForm] = React.useState({});

  async function load(){ const { data } = await db.from("config").select("*").order("key"); setItems(data||[]); }
  async function save(){
    if(!form.key||!form.value) return;
    await db.from("config").upsert({key:form.key,value:form.value,updated_at:new Date().toISOString()},{onConflict:"key"});
    setForm({}); load();
  }
  async function remover(id){ await db.from("config").delete().eq("id",id); load(); }

  React.useEffect(()=>{ load(); },[]);

  const inp = (ph,key) => React.createElement("input",{placeholder:ph,value:form[key]||"",onChange:e=>setForm(f=>({...f,[key]:e.target.value})),style:{background:"#0f0f1a",color:"#e5e7eb",border:"1px solid #1e293b",borderRadius:6,padding:"8px 12px",fontSize:13,flex:1}});

  return React.createElement("div",null,
    React.createElement("h2",{style:{color:"#ffc800",marginBottom:20}},"Configurações"),
    React.createElement("div",{style:{fontSize:13,color:"#94a3b8",marginBottom:16}},
      "Chaves: AUTOMATION (on/off) | GEMINI_API_KEY | GROQ_API_KEY | MAX_POSTS_DIA | INTERVALO_MIN"
    ),
    React.createElement("div",{style:{display:"flex",gap:8,marginBottom:20}},
      inp("Chave","key"), inp("Valor","value"),
      React.createElement("button",{onClick:save,style:{background:"#22c55e",color:"#fff",border:"none",borderRadius:6,padding:"8px 16px",cursor:"pointer",fontWeight:700}},"Salvar")
    ),
    items.map(c=>React.createElement("div",{key:c.id,style:{background:"#0f0f1a",border:"1px solid #1e293b",borderRadius:6,padding:"10px 16px",marginBottom:6,display:"flex",alignItems:"center",gap:12}},
      React.createElement("span",{style:{fontWeight:700,color:"#ffc800",minWidth:200}}, c.key),
      React.createElement("span",{style:{flex:1,fontSize:13,color:"#e5e7eb",wordBreak:"break-all"}}, c.key.includes("KEY")||c.key.includes("TOKEN") ? "••••••••" : c.value),
      React.createElement("span",{style:{fontSize:11,color:"#6b7280"}}, fmt(c.updated_at)),
      React.createElement("button",{onClick:()=>remover(c.id),style:{background:"#ef4444",color:"#fff",border:"none",borderRadius:4,padding:"3px 10px",cursor:"pointer",fontSize:12}},"✕")
    ))
  );
}

ReactDOM.createRoot(document.getElementById("app")).render(React.createElement(App));
