const { createClient } = supabase;
const db = createClient(
  "https://bfsegqdgscudtdgwdyci.supabase.co",
  "sb_publishable_Unww7VA8g1mlixn65Mq0EA_WhG0L-S_"
);

function fmt(dt){ return dt ? new Date(dt).toLocaleString("pt-BR") : "-"; }
function tag(status){
  const c = {pendente:"#f59e0b",publicado:"#22c55e",rejeitado:"#ef4444",error:"#ef4444",duplicate:"#6b7280",approved:"#22c55e"};
  return React.createElement("span",{style:{background:c[status]||"#6b7280",color:"#fff",borderRadius:4,padding:"2px 8px",fontSize:12,fontWeight:700}}, status);
}
function cleanMd(t){ return (t||'').replace(/\*\*/g,'').replace(/^#+\s*/g,'').trim(); }
function renderMdHtml(text){
  if(!text) return '';
  return text.split('\n').map(function(l){
    var t=l.trim();
    if(!t) return '';
    if(/^##\s+/.test(t)) return '<h3 style="font-size:16px;font-weight:700;margin:14px 0 8px;color:#e5e7eb;border-left:3px solid #ffc800;padding-left:10px;">'+t.replace(/^##\s+/,'').replace(/\*\*/g,'')+'</h3>';
    return '<p style="margin:0 0 8px;font-size:14px;line-height:1.8;">'+t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')+'</p>';
  }).filter(Boolean).join('');
}

function imageStatus(p) {
  if (!p.imagem || p.imagem.trim() === '') return 'sem';
  if (!p.imagem.startsWith('http') || p.imagem.length < 40) return 'suspeita';
  return 'ok';
}

function App(){
  const [tab,setTab] = React.useState("pendentes");
  const tabs = ["dashboard","pendentes","publicados","sem_foto","galeria","pipeline","fontes","contas","colunistas","logs","seo","config"];
  const tabLabel = t => {
    if(t==="sem_foto") return "📷 SEM FOTO";
    if(t==="galeria") return "🖼 GALERIA";
    if(t==="colunistas") return "✍ COLUNISTAS";
    return t.toUpperCase();
  };
  return React.createElement("div",{style:{fontFamily:"Inter,sans-serif",background:"#08080f",minHeight:"100vh",color:"#e5e7eb"}},
    React.createElement("div",{style:{background:"#0a0a14",borderBottom:"1px solid #1e293b",padding:"0 16px",display:"flex",gap:4,flexWrap:"wrap",position:"sticky",top:0,zIndex:200}},
      React.createElement("div",{style:{padding:"12px 8px",fontWeight:700,color:"#ffc800",marginRight:16}},"OVC ADMIN"),
      tabs.map(t=>React.createElement("button",{key:t,onClick:()=>setTab(t),style:{
        background:tab===t?"#1e293b":"transparent",
        color:tab===t?(t==="sem_foto"?"#ef4444":t==="galeria"?"#3b82f6":t==="colunistas"?"#22c55e":"#ffc800"):"#94a3b8",
        border:"none",padding:"12px 16px",cursor:"pointer",fontSize:13,fontWeight:600,
        borderBottom:tab===t?(t==="sem_foto"?"2px solid #ef4444":t==="galeria"?"2px solid #3b82f6":t==="colunistas"?"2px solid #22c55e":"2px solid #ffc800"):"2px solid transparent"
      }},tabLabel(t)))
    ),
    React.createElement("div",{style:{padding:24,maxWidth:1400,margin:"0 auto"}},
      tab==="dashboard" && React.createElement(Dashboard),
      tab==="pendentes" && React.createElement(Pendentes),
      tab==="publicados" && React.createElement(Publicados),
      tab==="sem_foto" && React.createElement(SemFoto),
      tab==="galeria" && React.createElement(Galeria),
      tab==="pipeline" && React.createElement(Pipeline),
      tab==="fontes" && React.createElement(Fontes),
      tab==="contas" && React.createElement(Contas),
      tab==="colunistas" && React.createElement(ColunistasAdmin),
      tab==="logs" && React.createElement(Logs),
      tab==="seo" && React.createElement(SeoBatch),
      tab==="config" && React.createElement(Config)
    )
  );
}

function Dashboard(){
  const [stats,setStats] = React.useState({});
  const [recentes,setRecentes] = React.useState([]);

  async function load(){
    const hoje = new Date().toISOString().slice(0,10);
    const [r1,r2,r3,r4,r5,r6] = await Promise.all([
      db.from("posts").select("id",{count:"exact",head:true}).eq("status","pendente"),
      db.from("posts").select("id",{count:"exact",head:true}).eq("status","publicado").gte("published_at",hoje),
      db.from("posts").select("id",{count:"exact",head:true}).eq("status","publicado"),
      db.from("posts").select("id",{count:"exact",head:true}).eq("status","rejeitado"),
      db.from("posts").select("id,titulo,status,created_at").order("created_at",{ascending:false}).limit(8),
      db.from("posts").select("id",{count:"exact",head:true}).eq("status","publicado").or("imagem.is.null,imagem.eq.")
    ]);
    setStats({ pendentes:r1.count||0, publicadosHoje:r2.count||0, total:r3.count||0, rejeitados:r4.count||0, semFoto:r6.count||0 });
    setRecentes(r5.data||[]);
  }

  React.useEffect(()=>{ load(); const id=setInterval(load,30000); return()=>clearInterval(id); },[]);

  const card = (label,val,cor,alerta) => React.createElement("div",{style:{background:"#0f0f1a",border:`1px solid ${cor}33`,borderRadius:8,padding:"20px 24px",flex:1,minWidth:160,cursor:alerta?"pointer":"default"},onClick:alerta||undefined},
    React.createElement("div",{style:{fontSize:28,fontWeight:700,color:cor}}, val),
    React.createElement("div",{style:{fontSize:13,color:"#94a3b8",marginTop:4}}, label)
  );

  return React.createElement("div",null,
    React.createElement("h2",{style:{color:"#ffc800",marginBottom:20}},"Dashboard"),
    React.createElement("div",{style:{display:"flex",gap:16,flexWrap:"wrap",marginBottom:24}},
      card("Pendentes de aprovação", stats.pendentes, "#f59e0b"),
      card("Publicados hoje", stats.publicadosHoje, "#22c55e"),
      card("Total publicados", stats.total, "#3b82f6"),
      card("Rejeitados", stats.rejeitados, "#ef4444"),
      stats.semFoto > 0 && card("⚠ Publicados sem foto", stats.semFoto, "#ef4444")
    ),
    React.createElement("div",{style:{background:"#0f0f1a",border:"1px solid #1e293b",borderRadius:8,padding:20}},
      React.createElement("h3",{style:{color:"#e5e7eb",margin:"0 0 12px"}},"Últimas matérias"),
      recentes.map(p=>React.createElement("div",{key:p.id,style:{display:"flex",gap:12,alignItems:"center",padding:"8px 0",borderBottom:"1px solid #1e293b"}},
        tag(p.status),
        React.createElement("span",{style:{flex:1,fontSize:14}}, cleanMd(p.titulo)||"—"),
        React.createElement("span",{style:{fontSize:12,color:"#6b7280"}}, fmt(p.created_at))
      ))
    )
  );
}

function SemFoto(){
  const [items,setItems] = React.useState([]);
  const [selected,setSelected] = React.useState([]);
  const [loading,setLoading] = React.useState(false);
  const [busca,setBusca] = React.useState("");

  async function load(){
    setLoading(true);
    const { data } = await db.from("posts")
      .select("id,titulo,user_tags,published_at,created_at")
      .eq("status","publicado")
      .or("imagem.is.null,imagem.eq.")
      .order("published_at",{ascending:false});
    setItems(data||[]);
    setSelected([]);
    setLoading(false);
  }

  async function despublicarIds(ids){
    if(!ids.length) return;
    setLoading(true);
    for(let i=0;i<ids.length;i+=50){
      const chunk=ids.slice(i,i+50);
      await db.from("posts").update({status:"pendente",approved:false}).in("id",chunk);
    }
    await load();
  }

  async function despublicarTodas(){
    if(!confirm(`Despublicar TODAS as ${items.length} matérias sem foto e mover para Pendente?`)) return;
    await despublicarIds(items.map(p=>p.id));
  }

  function toggleSel(id){ setSelected(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]); }
  function toggleAll(){ setSelected(s=>s.length===filtrados.length?[]:filtrados.map(p=>p.id)); }

  React.useEffect(()=>{ load(); },[]);

  const filtrados = items.filter(p=> !busca || (p.titulo||'').toLowerCase().includes(busca.toLowerCase()));
  const btn = (cor,label,fn,dis) => React.createElement("button",{onClick:fn,disabled:dis||loading,style:{background:cor,color:"#fff",border:"none",borderRadius:6,padding:"8px 16px",cursor:"pointer",fontWeight:700,fontSize:13,opacity:(dis||loading)?0.5:1}},label);

  return React.createElement("div",null,
    React.createElement("div",{style:{background:"rgba(239,68,68,0.08)",border:"1px solid #ef444488",borderRadius:10,padding:"16px 24px",marginBottom:20,display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}},
      React.createElement("span",{style:{fontSize:24}},"📷"),
      React.createElement("div",null,
        React.createElement("div",{style:{fontSize:20,fontWeight:800,color:"#ef4444"}},
          loading ? "Carregando..." : `${items.length} matérias publicadas sem foto`
        ),
        React.createElement("div",{style:{fontSize:13,color:"#94a3b8",marginTop:2}},
          "Estas matérias estão visíveis no portal sem imagem. Selecione e despublique para corrigir."
        )
      )
    ),

    React.createElement("div",{style:{display:"flex",gap:10,alignItems:"center",marginBottom:16,flexWrap:"wrap"}},
      React.createElement("input",{placeholder:"Buscar por título...",value:busca,onChange:e=>setBusca(e.target.value),style:{background:"#0f0f1a",color:"#e5e7eb",border:"1px solid #1e293b",borderRadius:6,padding:"7px 12px",fontSize:13,flex:1,maxWidth:360}}),
      selected.length>0 && React.createElement("span",{style:{fontSize:13,color:"#94a3b8"}},`${selected.length} selecionadas`),
      selected.length>0 && btn("#f59e0b",`Despublicar ${selected.length} selecionadas`,()=>despublicarIds(selected)),
      items.length>0 && btn("#ef4444",`⚠ Despublicar TODAS (${items.length})`,despublicarTodas),
      btn("#3b82f6","↺ Atualizar",load)
    ),

    React.createElement("div",{style:{background:"#0f0f1a",border:"1px solid #1e293b",borderRadius:8,overflow:"auto",maxHeight:"calc(100vh - 300px)"}},
      React.createElement("table",{style:{width:"100%",borderCollapse:"collapse"}},
        React.createElement("thead",null,
          React.createElement("tr",{style:{background:"#1e293b",position:"sticky",top:0,zIndex:1}},
            React.createElement("th",{style:{padding:"10px 12px",width:40}},
              React.createElement("input",{type:"checkbox",checked:selected.length===filtrados.length&&filtrados.length>0,onChange:toggleAll})
            ),
            React.createElement("th",{style:{padding:"10px 12px",textAlign:"left",fontSize:12,color:"#94a3b8"}},"TÍTULO"),
            React.createElement("th",{style:{padding:"10px 12px",textAlign:"left",fontSize:12,color:"#94a3b8",width:130}},"CATEGORIA"),
            React.createElement("th",{style:{padding:"10px 12px",textAlign:"left",fontSize:12,color:"#94a3b8",width:160}},"PUBLICADO"),
            React.createElement("th",{style:{padding:"10px 12px",textAlign:"right",fontSize:12,color:"#94a3b8",width:130}},"AÇÃO")
          )
        ),
        React.createElement("tbody",null,
          filtrados.length===0
          ? React.createElement("tr",null,
              React.createElement("td",{colSpan:5,style:{padding:48,textAlign:"center",color:loading?"#94a3b8":"#22c55e",fontWeight:700,fontSize:16}},
                loading ? "Carregando..." : "✅ Nenhuma matéria publicada sem foto!"
              )
            )
          : filtrados.map((p,i)=>{
              let cat="-"; try{const t=JSON.parse(p.user_tags||"[]");cat=t[0]||"-";}catch(_){}
              return React.createElement("tr",{key:p.id,style:{borderTop:"1px solid #1e293b",background:i%2===0?"#0f0f1a":"#0d0d18"}},
                React.createElement("td",{style:{padding:"10px 12px"}},
                  React.createElement("input",{type:"checkbox",checked:selected.includes(p.id),onChange:()=>toggleSel(p.id)})
                ),
                React.createElement("td",{style:{padding:"10px 12px",fontSize:14,color:"#e5e7eb"}}, cleanMd(p.titulo)||"(sem título)"),
                React.createElement("td",{style:{padding:"10px 12px",fontSize:13,color:"#94a3b8"}}, cat),
                React.createElement("td",{style:{padding:"10px 12px",fontSize:12,color:"#6b7280"}}, fmt(p.published_at)),
                React.createElement("td",{style:{padding:"10px 12px",textAlign:"right"}},
                  React.createElement("button",{
                    onClick:async()=>{ setLoading(true); await db.from("posts").update({status:"pendente",approved:false}).eq("id",p.id); await load(); },
                    style:{background:"#f59e0b",color:"#fff",border:"none",borderRadius:4,padding:"4px 12px",cursor:"pointer",fontSize:12,fontWeight:700},
                    disabled:loading
                  },"Despublicar")
                )
              );
            })
        )
      )
    )
  );
}

function Pendentes(){
  const [items,setItems] = React.useState([]);
  const [selected,setSelected] = React.useState([]);
  const [preview,setPreview] = React.useState(null);
  const [editMode,setEditMode] = React.useState(false);
  const [editData,setEditData] = React.useState({});
  const [loading,setLoading] = React.useState(false);
  const [busca,setBusca] = React.useState("");
  const [filtroImagem,setFiltroImagem] = React.useState("todos");

  async function load(){
    const { data } = await db.from("posts").select("*").eq("status","pendente").order("created_at",{ascending:false}).limit(200);
    setItems(data||[]);
    setSelected([]);
  }

  React.useEffect(()=>{ load(); },[]);

  const filtrados = items
    .filter(p => {
      if (filtroImagem === "com_imagem") return imageStatus(p) === "ok";
      if (filtroImagem === "sem_imagem") return imageStatus(p) === "sem";
      if (filtroImagem === "suspeita") return imageStatus(p) === "suspeita";
      return true;
    })
    .filter(p => {
      if (!busca) return true;
      const b = busca.toLowerCase();
      const titulo = (p.titulo||'').toLowerCase();
      let cat = "";
      try { cat = (JSON.parse(p.user_tags||"[]")[0]||"").toLowerCase(); } catch(_) {}
      return titulo.includes(b) || cat.includes(b);
    });

  async function salvarImagemGaleria(post, imagemUrl, tituloPost) {
    const url = imagemUrl || post?.imagem;
    if (!url || !url.startsWith("http")) return;
    try {
      await db.from("image_bank").upsert(
        { url, titulo: tituloPost || post?.titulo, post_id: post?.id },
        { onConflict: "url" }
      );
    } catch(_) {}
  }

  async function aprovar(id){
    setLoading(true);
    const post = items.find(p => p.id === id);
    await salvarImagemGaleria(post);
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
    const tituloLimpo = cleanMd(editData.titulo);
    await salvarImagemGaleria(preview, editData.imagem, tituloLimpo);
    await fetch("/api/approve_portal",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"editar_aprovar",id:preview.id,...editData,titulo:tituloLimpo})});
    await load(); setPreview(null); setEditMode(false); setLoading(false);
  }

  async function aprovarLote(){
    if(!selected.length) return;
    setLoading(true);
    const selectedPosts = items.filter(p => selected.includes(p.id));
    for (const post of selectedPosts) {
      await salvarImagemGaleria(post);
    }
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

  function abrirPreview(p){ setPreview(p); setEditMode(false); setEditData({titulo:cleanMd(p.titulo),conteudo:p.conteudo,imagem:p.imagem,comentario_fixado:p.comentario_fixado}); }

  const btnStyle = (cor) => ({background:cor,color:"#fff",border:"none",borderRadius:6,padding:"8px 16px",cursor:"pointer",fontWeight:700,fontSize:13});
  const inp = (val,key,multiline) => multiline
    ? React.createElement("textarea",{value:val||"",rows:10,onChange:e=>setEditData(d=>({...d,[key]:e.target.value})),style:{width:"100%",background:"#08080f",color:"#e5e7eb",border:"1px solid #1e293b",borderRadius:6,padding:8,fontSize:13,resize:"vertical"}})
    : React.createElement("input",{value:val||"",onChange:e=>setEditData(d=>({...d,[key]:e.target.value})),style:{width:"100%",background:"#08080f",color:"#e5e7eb",border:"1px solid #1e293b",borderRadius:6,padding:"8px",fontSize:13,marginBottom:8}});

  const filtroStyle = (key) => ({
    background: filtroImagem === key ? "#ffc800" : "#1e293b",
    color: filtroImagem === key ? "#08080f" : "#94a3b8",
    border: "none", borderRadius: 6, padding: "6px 14px",
    cursor: "pointer", fontWeight: 700, fontSize: 12, whiteSpace: "nowrap"
  });

  const contagens = React.useMemo(() => {
    let com=0, sem=0, sus=0;
    items.forEach(p => {
      const s = imageStatus(p);
      if(s==="ok") com++;
      else if(s==="sem") sem++;
      else sus++;
    });
    return { com, sem, sus };
  }, [items]);

  return React.createElement("div",null,
    React.createElement("div",{style:{position:"sticky",top:57,zIndex:100,background:"#08080f",padding:"12px 0",borderBottom:"1px solid #1e293b",marginBottom:16}},
      React.createElement("div",{style:{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:10}},
        React.createElement("h2",{style:{color:"#f59e0b",margin:0,marginRight:8}},`Pendentes (${filtrados.length}/${items.length})`),
        selected.length>0 && React.createElement("span",{style:{fontSize:13,color:"#94a3b8"}},`${selected.length} selecionadas`),
        selected.length>0 && React.createElement("button",{onClick:aprovarLote,style:btnStyle("#22c55e"),disabled:loading},`✓ Aprovar ${selected.length}`),
        selected.length>0 && React.createElement("button",{onClick:rejeitarLote,style:btnStyle("#ef4444"),disabled:loading},`✗ Rejeitar ${selected.length}`),
        React.createElement("button",{onClick:load,style:btnStyle("#3b82f6"),disabled:loading},"↺ Atualizar")
      ),
      React.createElement("div",{style:{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}},
        React.createElement("input",{
          placeholder:"🔍 Buscar por título ou categoria...",
          value:busca,
          onChange:e=>setBusca(e.target.value),
          style:{
            background:"#0f0f1a",color:"#e5e7eb",
            border: busca ? "1.5px solid #ffc800" : "1px solid #1e293b",
            borderRadius:6,padding:"7px 14px",fontSize:13,
            flex:1,maxWidth:340,outline:"none",
            boxShadow: busca ? "0 0 0 2px #ffc80022" : "none",
            transition:"border .2s,box-shadow .2s"
          }
        }),
        React.createElement("span",{style:{fontSize:12,color:"#6b7280",marginLeft:4}},"Filtrar:"),
        React.createElement("button",{onClick:()=>setFiltroImagem("todos"),style:filtroStyle("todos")},"Todos"),
        React.createElement("button",{onClick:()=>setFiltroImagem("com_imagem"),style:filtroStyle("com_imagem")},`Com imagem ✓ (${contagens.com})`),
        React.createElement("button",{onClick:()=>setFiltroImagem("suspeita"),style:{...filtroStyle("suspeita"),color:filtroImagem==="suspeita"?"#08080f":"#f59e0b"}},`Suspeita ⚠ (${contagens.sus})`),
        React.createElement("button",{onClick:()=>setFiltroImagem("sem_imagem"),style:{...filtroStyle("sem_imagem"),color:filtroImagem==="sem_imagem"?"#08080f":"#ef4444"}},`Sem imagem ✗ (${contagens.sem})`)
      )
    ),

    React.createElement("div",{style:{background:"#0f0f1a",border:"1px solid #1e293b",borderRadius:8,overflow:"hidden"}},
      React.createElement("table",{style:{width:"100%",borderCollapse:"collapse"}},
        React.createElement("thead",null,
          React.createElement("tr",{style:{background:"#1e293b"}},
            React.createElement("th",{style:{padding:"10px 12px",textAlign:"left",width:40}},
              React.createElement("input",{type:"checkbox",checked:selected.length===filtrados.length&&filtrados.length>0,onChange:toggleAll})
            ),
            React.createElement("th",{style:{padding:"10px 12px",textAlign:"left",fontSize:12,color:"#94a3b8"}},"TÍTULO"),
            React.createElement("th",{style:{padding:"10px 12px",textAlign:"center",fontSize:12,color:"#94a3b8",width:50}},"IMG"),
            React.createElement("th",{style:{padding:"10px 12px",textAlign:"left",fontSize:12,color:"#94a3b8",width:120}},"CATEGORIA"),
            React.createElement("th",{style:{padding:"10px 12px",textAlign:"left",fontSize:12,color:"#94a3b8",width:150}},"CRIADO"),
            React.createElement("th",{style:{padding:"10px 12px",textAlign:"right",fontSize:12,color:"#94a3b8",width:200}},"AÇÕES")
          )
        ),
        React.createElement("tbody",null,
          filtrados.length === 0 && React.createElement("tr",null,
            React.createElement("td",{colSpan:6,style:{padding:40,textAlign:"center",color:"#6b7280",fontSize:14}},
              "Nenhum post encontrado com os filtros selecionados."
            )
          ),
          filtrados.map((p,i)=>{
            let cat = "-"; try{ const t=JSON.parse(p.user_tags||"[]"); cat=t[0]||"-"; }catch(_){}
            const imgSt = imageStatus(p);
            const imgIcon = imgSt==="ok" ? "✓" : imgSt==="suspeita" ? "⚠" : "✗";
            const imgColor = imgSt==="ok" ? "#22c55e" : imgSt==="suspeita" ? "#f59e0b" : "#ef4444";
            return React.createElement("tr",{key:p.id,style:{borderTop:"1px solid #1e293b",background:i%2===0?"#0f0f1a":"#0d0d18"}},
              React.createElement("td",{style:{padding:"10px 12px"}},
                React.createElement("input",{type:"checkbox",checked:selected.includes(p.id),onChange:()=>toggleSel(p.id)})
              ),
              React.createElement("td",{style:{padding:"10px 12px"}},
                React.createElement("a",{href:"#",onClick:e=>{e.preventDefault();abrirPreview(p)},style:{color:"#e5e7eb",textDecoration:"none",fontSize:14,fontWeight:500}}, cleanMd(p.titulo)||"(sem título)")
              ),
              React.createElement("td",{style:{padding:"10px 12px",textAlign:"center",fontSize:16,fontWeight:700,color:imgColor},title:imgSt==="ok"?"Com imagem":imgSt==="suspeita"?"Imagem suspeita":"Sem imagem"}, imgIcon),
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

    preview && React.createElement("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.85)",zIndex:1000,overflow:"auto",padding:24}},
      React.createElement("div",{style:{background:"#0f0f1a",border:"1px solid #1e293b",borderRadius:12,maxWidth:800,margin:"0 auto",padding:32}},
        React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}},
          React.createElement("h3",{style:{color:"#ffc800",margin:0,flex:1}}, editMode ? "Editar matéria" : cleanMd(preview.titulo)),
          React.createElement("button",{onClick:()=>setPreview(null),style:{background:"transparent",color:"#94a3b8",border:"none",fontSize:20,cursor:"pointer"}},"✕")
        ),

        !editMode && React.createElement("div",null,
          preview.imagem && React.createElement("img",{src:preview.imagem,style:{width:"100%",maxHeight:300,objectFit:"cover",borderRadius:8,marginBottom:16},onError:e=>e.target.style.display="none"}),
          React.createElement("div",{style:{fontSize:12,color:"#94a3b8",marginBottom:8}}, "Subtítulo: "+(preview.comentario_fixado||"-")),
          React.createElement("div",{style:{background:"#08080f",borderRadius:8,padding:16,color:"#e5e7eb",maxHeight:400,overflow:"auto"},dangerouslySetInnerHTML:{__html:renderMdHtml(preview.conteudo)}})
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

  const filtrados = items.filter(p=> !busca || (p.titulo||'').toLowerCase().includes(busca.toLowerCase()));
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
              React.createElement("td",{style:{padding:"10px 12px",fontSize:14}}, cleanMd(p.titulo)||"--"),
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

function Pipeline(){
  const [msg,setMsg] = React.useState("");
  const [loading,setLoading] = React.useState(false);

  async function runPortal(){
    setLoading(true); setMsg("⏳ Gerando matéria... aguarde até 60 segundos.");
    try{
      const r = await fetch("/api/run_portal",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({force:true, count:1})
      });
      const j = await r.json();
      setMsg(JSON.stringify(j,null,2));
    } catch(e){ setMsg("Erro: "+e.message); }
    setLoading(false);
  }

  async function runIG(){
    setLoading(true); setMsg("Executando Instagram...");
    try{ const r=await fetch("/api/run",{method:"POST"}); const j=await r.json(); setMsg(JSON.stringify(j,null,2)); }
    catch(e){ setMsg("Erro: "+e.message); }
    setLoading(false);
  }

  async function runTipo(tipo, label){
    setLoading(true); setMsg("⏳ Gerando " + label + "... aguarde até 60 segundos.");
    try{
      const r = await fetch("/api/run_portal",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({force:true, count:1, tipo})
      });
      const j = await r.json();
      setMsg(JSON.stringify(j,null,2));
    } catch(e){ setMsg("Erro: "+e.message); }
    setLoading(false);
  }

  const btn = (label,fn,cor) => React.createElement("button",{onClick:fn,disabled:loading,style:{background:cor,color:"#fff",border:"none",borderRadius:6,padding:"10px 20px",cursor:"pointer",fontWeight:700,fontSize:14,opacity:loading?0.6:1}},label);

  return React.createElement("div",null,
    React.createElement("h2",{style:{color:"#ffc800",marginBottom:20}},"Pipeline"),
    React.createElement("div",{style:{display:"flex",gap:12,flexWrap:"wrap",marginBottom:8}},
      btn(loading ? "⏳ Gerando..." : "▶ Matéria", runPortal, "#3b82f6"),
      btn(loading ? "⏳..." : "✍ Coluna", ()=>runTipo('coluna','coluna'), "#7c3aed"),
      btn(loading ? "⏳..." : "💊 Pílula", ()=>runTipo('pilula','pílula'), "#0891b2"),
      btn(loading ? "⏳..." : "⚡ Micro-Pílula", ()=>runTipo('micro_pilula','micro-pílula'), "#059669"),
      btn("▶ Instagram", runIG, "#c81e1e")
    ),
    React.createElement("div",{style:{fontSize:11,color:"#475569",marginBottom:16,paddingLeft:2}},
      "Matéria: análise completa ≥5k chars · Coluna: ensaio opinativo ≥4.5k · Pílula: nota rápida 2-4.5k · Micro-Pílula: flash informativo 800-2.2k"
    ),
    React.createElement("div",{style:{fontSize:13,color:"#94a3b8",marginBottom:16}},
      "Automação: GitHub Actions dispara a cada 10min (09:00-12:00 BRT) e 20min (14:00-02:00 BRT)"
    ),
    msg && React.createElement("pre",{style:{background:"#0f0f1a",border:"1px solid #1e293b",borderRadius:8,padding:16,fontSize:12,color: msg.includes('"ok"') || msg.includes('status: ok') ? "#22c55e" : "#f59e0b",overflow:"auto",maxHeight:300}}, msg)
  );
}

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

  const filtrados = items.filter(p=> !busca || (p.name||'').toLowerCase().includes(busca.toLowerCase()));
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
            React.createElement("td",{style:{padding:"8px 12px",textAlign:"center"}},
              React.createElement("span",{style:{color:f.active?"#22c55e":"#6b7280",fontSize:12,fontWeight:700}},f.active?"ATIVA":"OFF")
            ),
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

function SeoBatch(){
  const [rodando,setRodando] = React.useState(false);
  const [progresso,setProgresso] = React.useState(null);
  const [log,setLog] = React.useState([]);
  const [concluido,setConcluido] = React.useState(false);

  async function iniciar(){
    setRodando(true); setConcluido(false); setLog([]); setProgresso(null);
    let offset = 0;
    let total = 0;
    let processadosTotal = 0;

    while(true){
      try {
        const r = await fetch(`/api/seo_batch?offset=${offset}&limit=5`);
        const d = await r.json();
        if(d.status === "error"){ setLog(l=>[...l,`❌ Erro: ${d.error}`]); break; }

        total = d.total || total;
        processadosTotal += d.processados || 0;
        setProgresso({ feitos: processadosTotal, total });

        (d.resultados||[]).forEach(p=>{
          setLog(l=>[...l, p.ok ? `✅ ${p.titulo}` : `⚠️ Falhou: ${p.titulo}`]);
        });

        if(d.status === "done" || !d.nextOffset){ break; }
        offset = d.nextOffset;
        await new Promise(r=>setTimeout(r,800));
      } catch(e){ setLog(l=>[...l,`❌ Erro de rede: ${e.message}`]); break; }
    }

    setRodando(false); setConcluido(true);
  }

  const pct = progresso ? Math.round((progresso.feitos/progresso.total)*100) : 0;

  return React.createElement("div",null,
    React.createElement("h2",{style:{color:"#ffc800",marginBottom:8}},"⚡ Otimização SEO em Lote"),
    React.createElement("p",{style:{color:"#94a3b8",fontSize:13,marginBottom:24}},
      "Reescreve os títulos e gera meta descrição, palavra-chave e slug SEO para todos os posts publicados. Usa a OpenAI. Custo estimado: menos de R$ 0,50 para 120 posts."
    ),

    !rodando && !concluido && React.createElement("button",{onClick:iniciar,style:{background:"#c81e1e",color:"#fff",border:"none",borderRadius:8,padding:"12px 28px",fontSize:15,fontWeight:700,cursor:"pointer"}},
      "🚀 Iniciar Otimização SEO"
    ),

    rodando && React.createElement("div",null,
      React.createElement("div",{style:{marginBottom:12,fontSize:13,color:"#94a3b8"}},
        progresso ? `Processando... ${progresso.feitos} de ${progresso.total} posts (${pct}%)` : "Iniciando..."
      ),
      React.createElement("div",{style:{background:"#1e293b",borderRadius:8,height:12,marginBottom:20,overflow:"hidden"}},
        React.createElement("div",{style:{background:"#c81e1e",height:"100%",width:`${pct}%`,transition:"width 0.4s",borderRadius:8}})
      )
    ),

    concluido && React.createElement("div",{style:{marginBottom:16}},
      React.createElement("div",{style:{background:"rgba(22,163,74,0.15)",border:"1px solid #16a34a",borderRadius:8,padding:"12px 20px",color:"#22c55e",fontWeight:700,marginBottom:12}},"✅ Otimização concluída!"),
      React.createElement("button",{onClick:iniciar,style:{background:"#1e293b",color:"#e5e7eb",border:"1px solid #334155",borderRadius:6,padding:"8px 20px",fontSize:13,cursor:"pointer",marginRight:8}},"↺ Rodar novamente")
    ),

    log.length > 0 && React.createElement("div",{style:{background:"#0f0f1a",border:"1px solid #1e293b",borderRadius:8,padding:16,fontFamily:"monospace",fontSize:12,maxHeight:400,overflow:"auto",marginTop:16}},
      log.map((l,i)=>React.createElement("div",{key:i,style:{padding:"3px 0",borderBottom:"1px solid #1e293b",color:l.startsWith("✅")?"#22c55e":l.startsWith("⚠️")?"#f59e0b":"#ef4444"}}, l))
    )
  );
}

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

function Galeria(){
  const [items,setItems] = React.useState([]);
  const [loading,setLoading] = React.useState(false);
  const [msg,setMsg] = React.useState("");
  const [busca,setBusca] = React.useState("");

  async function load(){
    setLoading(true);
    try {
      const { data, error } = await db.from("image_bank").select("*").order("created_at",{ascending:false}).limit(300);
      if (error) throw new Error(error.message);
      setItems(data||[]);
    } catch(e) {
      setMsg("⚠ Tabela image_bank não encontrada. Execute o SQL de migração no Supabase (veja abaixo).");
    }
    setLoading(false);
  }

  async function syncAll(){
    setLoading(true);
    setMsg("Sincronizando imagens dos posts publicados...");
    try {
      const { data: posts } = await db.from("posts")
        .select("id,titulo,imagem")
        .eq("status","publicado")
        .not("imagem","is",null)
        .neq("imagem","")
        .order("published_at",{ascending:false})
        .limit(500);
      let saved = 0;
      for (const post of (posts||[])) {
        if (!post.imagem || !post.imagem.startsWith("http")) continue;
        const { error } = await db.from("image_bank").upsert(
          { url: post.imagem, titulo: post.titulo, post_id: post.id },
          { onConflict: "url" }
        );
        if (!error) saved++;
      }
      setMsg(`✅ ${saved} imagens sincronizadas dos posts publicados.`);
      await load();
    } catch(e) {
      setMsg(`❌ Erro: ${e.message}`);
      setLoading(false);
    }
  }

  async function removerImagem(id){
    await db.from("image_bank").delete().eq("id",id);
    setItems(prev => prev.filter(x => x.id !== id));
  }

  React.useEffect(()=>{ load(); },[]);

  const filtrados = items.filter(p=> !busca || (p.titulo||'').toLowerCase().includes(busca.toLowerCase()) || (p.url||'').toLowerCase().includes(busca.toLowerCase()));

  return React.createElement("div",null,
    React.createElement("div",{style:{display:"flex",gap:12,alignItems:"center",marginBottom:16,flexWrap:"wrap"}},
      React.createElement("h2",{style:{color:"#3b82f6",margin:0}},`🖼 Galeria de Imagens (${items.length})`),
      React.createElement("input",{placeholder:"Buscar...",value:busca,onChange:e=>setBusca(e.target.value),style:{background:"#0f0f1a",color:"#e5e7eb",border:"1px solid #1e293b",borderRadius:6,padding:"6px 12px",fontSize:13,flex:1,maxWidth:280}}),
      React.createElement("button",{onClick:syncAll,disabled:loading,style:{background:"#3b82f6",color:"#fff",border:"none",borderRadius:6,padding:"8px 16px",cursor:"pointer",fontWeight:700,fontSize:13}},"↺ Sincronizar Posts Publicados"),
      React.createElement("button",{onClick:load,disabled:loading,style:{background:"#1e293b",color:"#e5e7eb",border:"none",borderRadius:6,padding:"8px 16px",cursor:"pointer",fontWeight:700,fontSize:13}},"↺ Atualizar")
    ),

    msg && React.createElement("div",{style:{background:"#0f0f1a",border:"1px solid #1e293b",borderRadius:8,padding:"10px 16px",marginBottom:12,fontSize:13,color:msg.startsWith("✅")?"#22c55e":msg.startsWith("❌")?"#ef4444":"#f59e0b"}}, msg),

    React.createElement("div",{style:{background:"rgba(59,130,246,0.06)",border:"1px solid #3b82f633",borderRadius:8,padding:"10px 16px",marginBottom:16,fontSize:12,color:"#6b7280"}},
      "SQL necessário no Supabase (apenas uma vez): ",
      React.createElement("code",{style:{color:"#ffc800",fontSize:11}},
        "CREATE TABLE IF NOT EXISTS image_bank (id uuid primary key default uuid_generate_v4(), url text unique, titulo text, post_id uuid, created_at timestamp default now());"
      )
    ),

    loading && React.createElement("div",{style:{padding:40,textAlign:"center",color:"#94a3b8"}},"Carregando..."),

    !loading && filtrados.length === 0 && React.createElement("div",{style:{padding:40,textAlign:"center",color:"#6b7280",fontSize:14}},
      "Nenhuma imagem na galeria. Aprove posts pendentes com imagem, ou clique em 'Sincronizar Posts Publicados'."
    ),

    !loading && React.createElement("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:16}},
      filtrados.map(img=>React.createElement("div",{key:img.id,style:{background:"#0f0f1a",border:"1px solid #1e293b",borderRadius:8,overflow:"hidden",position:"relative"}},
        React.createElement("img",{
          src:img.url, alt:img.titulo||"",
          style:{width:"100%",height:140,objectFit:"cover",display:"block"},
          onError:e=>{ e.target.style.background="#1e293b"; e.target.style.height="60px"; }
        }),
        React.createElement("div",{style:{padding:"8px 10px"}},
          React.createElement("div",{style:{fontSize:12,color:"#e5e7eb",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:4}}, cleanMd(img.titulo)||"—"),
          React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"}},
            React.createElement("div",{style:{fontSize:10,color:"#4b5563",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}},
              (img.url||'').replace(/^https?:\/\//,"").slice(0,40)+"..."
            ),
            React.createElement("button",{
              onClick:()=>removerImagem(img.id),
              style:{background:"transparent",color:"#6b7280",border:"none",cursor:"pointer",fontSize:14,padding:"0 4px",lineHeight:1},
              title:"Remover da galeria"
            },"✕")
          )
        )
      ))
    )
  );
}

function ColunistasAdmin(){
  const [items,setItems] = React.useState([]);
  const [form,setForm] = React.useState({nome:"",email:"",senha:""});
  const [loading,setLoading] = React.useState(false);
  const [msg,setMsg] = React.useState("");

  async function load(){
    try {
      const r = await fetch("/api/manage?action=list_colunistas");
      const d = await r.json();
      setItems(d.colunistas||[]);
    } catch(e) {
      setMsg("❌ Erro ao carregar colunistas: "+e.message);
    }
  }

  async function criar(){
    if(!form.nome||!form.email||!form.senha){ setMsg("Preencha todos os campos."); return; }
    setLoading(true);
    const r = await fetch("/api/manage",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"create_colunista",...form})});
    const d = await r.json();
    if(d.ok){ setForm({nome:"",email:"",senha:""}); setMsg("✅ Colunista criado com sucesso!"); load(); }
    else setMsg("❌ "+(d.error||"Erro desconhecido"));
    setLoading(false);
  }

  async function toggle(c){
    await fetch("/api/manage",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"toggle_colunista",id:c.id,ativo:c.ativo})});
    load();
  }

  async function excluir(id){
    if(!confirm("Excluir este colunista permanentemente?")) return;
    await fetch("/api/manage",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"delete_colunista",id})});
    load();
  }

  React.useEffect(()=>{ load(); },[]);

  const inp = (ph,key,type="text") => React.createElement("input",{
    type, placeholder:ph, value:form[key]||"",
    onChange:e=>setForm(f=>({...f,[key]:e.target.value})),
    style:{background:"#0f0f1a",color:"#e5e7eb",border:"1px solid #1e293b",borderRadius:6,padding:"8px 12px",fontSize:13,flex:1}
  });

  return React.createElement("div",null,
    React.createElement("h2",{style:{color:"#22c55e",marginBottom:16}},"✍ Sistema de Colunistas"),

    React.createElement("div",{style:{background:"rgba(34,197,94,0.06)",border:"1px solid #22c55e33",borderRadius:8,padding:"12px 18px",marginBottom:20,fontSize:13,color:"#94a3b8"}},
      "Colunistas acessam o portal em ",
      React.createElement("a",{href:"/admin/colunista/",target:"_blank",style:{color:"#ffc800",fontWeight:700}},"/admin/colunista/"),
      " com e-mail e senha. Posts submetidos chegam como 'pendente' na aba Postagens para aprovação do admin."
    ),

    React.createElement("div",{style:{background:"#0f0f1a",border:"1px solid #1e293b",borderRadius:8,padding:16,marginBottom:20}},
      React.createElement("h3",{style:{color:"#e5e7eb",margin:"0 0 12px",fontSize:15}},"Novo Colunista"),
      React.createElement("div",{style:{display:"flex",gap:8,flexWrap:"wrap"}},
        inp("Nome completo","nome"),
        inp("E-mail","email","email"),
        inp("Senha (mín. 6 chars)","senha","password"),
        React.createElement("button",{onClick:criar,disabled:loading,style:{background:"#22c55e",color:"#fff",border:"none",borderRadius:6,padding:"8px 16px",cursor:"pointer",fontWeight:700,opacity:loading?0.6:1}},
          loading ? "Criando..." : "+ Criar"
        )
      ),
      msg && React.createElement("div",{style:{marginTop:10,fontSize:13,color:msg.startsWith("✅")?"#22c55e":"#ef4444"}}, msg)
    ),

    React.createElement("div",{style:{background:"#0f0f1a",border:"1px solid #1e293b",borderRadius:8,overflow:"hidden"}},
      React.createElement("table",{style:{width:"100%",borderCollapse:"collapse"}},
        React.createElement("thead",null,
          React.createElement("tr",{style:{background:"#1e293b"}},
            React.createElement("th",{style:{padding:"10px 12px",textAlign:"left",fontSize:12,color:"#94a3b8"}},"NOME"),
            React.createElement("th",{style:{padding:"10px 12px",textAlign:"left",fontSize:12,color:"#94a3b8"}},"E-MAIL"),
            React.createElement("th",{style:{padding:"10px 12px",textAlign:"center",fontSize:12,color:"#94a3b8",width:80}},"STATUS"),
            React.createElement("th",{style:{padding:"10px 12px",textAlign:"left",fontSize:12,color:"#94a3b8",width:160}},"ÚLTIMO LOGIN"),
            React.createElement("th",{style:{padding:"10px 12px",textAlign:"right",fontSize:12,color:"#94a3b8",width:160}},"AÇÕES")
          )
        ),
        React.createElement("tbody",null,
          items.length===0 && React.createElement("tr",null,
            React.createElement("td",{colSpan:5,style:{padding:32,textAlign:"center",color:"#6b7280",fontSize:14}},
              "Nenhum colunista cadastrado ainda. Use o formulário acima para adicionar."
            )
          ),
          items.map((c,i)=>React.createElement("tr",{key:c.id,style:{borderTop:"1px solid #1e293b",background:i%2===0?"#0f0f1a":"#0d0d18"}},
            React.createElement("td",{style:{padding:"10px 12px",fontSize:14,fontWeight:600}}, c.nome),
            React.createElement("td",{style:{padding:"10px 12px",fontSize:13,color:"#94a3b8"}}, c.email),
            React.createElement("td",{style:{padding:"10px 12px",textAlign:"center"}},
              React.createElement("span",{style:{color:c.ativo?"#22c55e":"#6b7280",fontWeight:700,fontSize:12}}, c.ativo?"ATIVO":"OFF")
            ),
            React.createElement("td",{style:{padding:"10px 12px",fontSize:12,color:"#6b7280"}}, c.last_login ? fmt(c.last_login) : "Nunca"),
            React.createElement("td",{style:{padding:"10px 12px",textAlign:"right",display:"flex",gap:6,justifyContent:"flex-end"}},
              React.createElement("button",{onClick:()=>toggle(c),style:{background:c.ativo?"#f59e0b":"#22c55e",color:"#fff",border:"none",borderRadius:4,padding:"4px 10px",cursor:"pointer",fontSize:12,fontWeight:700}}, c.ativo?"Suspender":"Ativar"),
              React.createElement("button",{onClick:()=>excluir(c.id),style:{background:"#ef4444",color:"#fff",border:"none",borderRadius:4,padding:"4px 10px",cursor:"pointer",fontSize:12,fontWeight:700}},"✕")
            )
          ))
        )
      )
    )
  );
}

ReactDOM.createRoot(document.getElementById("app")).render(React.createElement(App));
