
const { createClient } = supabase;

const db = createClient(
  "https://bfsegqdgscudtdgwdyci.supabase.co",
  "sb_publishable_Unww7VA8g1mlixn65Mq0EA_WhG0L-S_"
);

function App(){
  const [tab,setTab] = React.useState("dashboard");
  const tabs = ["dashboard","pipeline","posts","accounts","sources","logs","config"];

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
    case "pipeline": return React.createElement(Pipeline);
    case "posts": return React.createElement(Posts);
    case "accounts": return React.createElement(Accounts);
    case "sources": return React.createElement(Sources);
    case "logs": return React.createElement(Logs);
    case "config": return React.createElement(Config);
  }
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

// POSTS (list, filter, detail)
function Posts(){
  const [items,setItems] = React.useState([]);
  const [filter,setFilter] = React.useState("");
  const [selected,setSelected] = React.useState(null);

  async function load(){
    let q = db.from("posts").select("*").order("created_at",{ascending:false});
    if(filter) q = q.eq("status",filter);
    const { data } = await q;
    setItems(data||[]);
  }

  React.useEffect(()=>{load()},[filter]);

  return React.createElement("div",{className:"card"},
    React.createElement("select",{onChange:e=>setFilter(e.target.value)},
      React.createElement("option",{value:""},"Todos"),
      React.createElement("option",{value:"success"},"Success"),
      React.createElement("option",{value:"error"},"Error"),
      React.createElement("option",{value:"duplicate"},"Duplicate")
    ),
    items.map(p=>React.createElement("div",null,
      React.createElement("a",{href:"#", onClick:(e)=>{e.preventDefault(); setSelected(p)}}, p.titulo),
      " | ",p.status
    )),
    selected && React.createElement("div",{className:"card"},
      React.createElement("h3",null,"Detalhe"),
      React.createElement("div",null,"ID: "+selected.id),
      React.createElement("div",null,"Hash: "+selected.hash),
      React.createElement("div",null,"Status: "+selected.status),
      React.createElement("div",null,"Criado: "+selected.created_at)
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
