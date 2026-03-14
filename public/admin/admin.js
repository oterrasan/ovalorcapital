const API_BASE = window.location.origin;
let token = null;

const CATEGORIES = {
  "Política": ["Executivo", "Legislativo", "Judiciário", "Projetos de lei", "Eleições", "Agenda regulatória", "Geral"],
  "Economia": ["Monetária", "Fiscal", "Conjuntura", "Internacional", "Minuto Fiscal", "Geral"],
  "Negócios": ["Empreender", "Tributação PJ", "Gestão Financeira", "Crédito", "Vendas & Preço", "Contratos & Societário", "LGPD & Compliance", "Startups", "Geral"],
  "Investimentos": ["Renda Fixa", "Renda Variável", "Fundos", "Previdência", "Alternativos", "Estratégias", "Calendário & Dividendos", "Educação do investidor", "Geral"],
  "Seguros": ["Saúde & Odonto", "Vida", "Auto", "Residencial", "Empresarial & RC", "Viagem", "KPIs", "Geral"],
  "Mercados": ["Bolsa", "Juros", "Câmbio", "Commodities", "Cripto", "IPOs", "Índices", "Cotações", "Geral"],
  "Educação": ["Trilha Zero", "Finanças Pessoais", "Carreira & Empregos", "Cursos", "Parcerias", "Glossário", "Workshops", "Geral"],
  "Indústria": ["Construção & Imobiliário", "Energia & Infra", "Agro", "Mineração", "Química", "Automotivo", "Logística", "Indústria 4.0", "Geral"],
  "Tecnologia": ["IA & Dados", "Fintechs", "Blockchain", "Cibersegurança", "Cloud", "Telecom", "Hardware", "Software", "Geral"],
  "Consumo": ["Varejo", "Alimentação", "Moda", "E-commerce", "Turismo", "Entretenimento", "Geral"],
  "Saúde": ["Medicina", "Farmacêutico", "Hospitalar", "Healthtech", "Regulação", "Geral"],
  "Jurídico": ["Tributário", "Trabalhista", "Cível", "Criminal", "Regulatório", "Compliance", "Geral"],
  "Internacional": ["EUA", "Europa", "China", "América Latina", "Geopolítica", "Comércio", "Geral"]
};

// Login
async function login() {
  token = document.getElementById('token').value;
  const response = await fetch(`${API_BASE}/api/auth/validate-token?token=${token}`);
  const data = await response.json();
  
  if (data.valid) {
    localStorage.setItem('adminToken', token);
    document.getElementById('login').classList.remove('active');
    document.getElementById('admin').classList.add('active');
    initAdmin();
  } else {
    document.getElementById('error').textContent = 'Token inválido';
  }
}

function logout() {
  localStorage.removeItem('adminToken');
  location.reload();
}

// Init
function initAdmin() {
  populateCategories();
  tinymce.init({
    selector: '#conteudo',
    height: 500,
    menubar: false,
    plugins: 'lists link image',
    toolbar: 'undo redo | formatselect | bold italic | alignleft aligncenter alignright | bullist numlist | link image'
  });
  loadArticles();
  loadInstagramInfo();
}

function populateCategories() {
  const select = document.getElementById('categoria');
  select.innerHTML = '<option value="">Selecione...</option>';
  Object.keys(CATEGORIES).forEach(cat => {
    select.innerHTML += `<option value="${cat}">${cat}</option>`;
  });
}

function updateSubcategorias() {
  const categoria = document.getElementById('categoria').value;
  const select = document.getElementById('subcategoria');
  select.innerHTML = '<option value="">Selecione...</option>';
  if (categoria && CATEGORIES[categoria]) {
    CATEGORIES[categoria].forEach(sub => {
      select.innerHTML += `<option value="${sub}">${sub}</option>`;
    });
  }
}

function showTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById(`tab-${tab}`).classList.add('active');
  if (tab !== 'criar') loadArticles();
}

function toggleInstagram() {
  document.getElementById('instagram-fields').style.display = 
    document.getElementById('publicar-instagram').checked ? 'block' : 'none';
}

function previewImage(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(event) {
      document.getElementById('image-preview').innerHTML = 
        `<img src="${event.target.result}" alt="Preview">`;
    };
    reader.readAsDataURL(file);
  }
}

// Create article
async function createArticle() {
  const titulo = document.getElementById('titulo').value;
  const categoria = document.getElementById('categoria').value;
  const subcategoria = document.getElementById('subcategoria').value;
  const resumo = document.getElementById('resumo').value;
  const conteudo = tinymce.get('conteudo').getContent();
  const autor = document.getElementById('autor').value;
  const publicar_instagram = document.getElementById('publicar-instagram').checked;
  const legenda_instagram = document.getElementById('legenda-instagram').value;
  
  const fileInput = document.getElementById('imagem');
  if (!fileInput.files[0]) {
    showStatus('Selecione uma imagem', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = async function(e) {
    const imagem = e.target.result;

    const response = await fetch(`${API_BASE}/api/articles/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ titulo, categoria, subcategoria, resumo, conteudo, autor, imagem, publicar_instagram, legenda_instagram })
    });

    const data = await response.json();
    if (data.success) {
      showStatus('Artigo criado com sucesso!', 'success');
      clearForm();
      loadArticles();
    } else {
      showStatus(data.error, 'error');
    }
  };
  reader.readAsDataURL(fileInput.files[0]);
}

function clearForm() {
  document.getElementById('titulo').value = '';
  document.getElementById('categoria').value = '';
  document.getElementById('subcategoria').value = '';
  document.getElementById('resumo').value = '';
  tinymce.get('conteudo').setContent('');
  document.getElementById('imagem').value = '';
  document.getElementById('image-preview').innerHTML = '';
  document.getElementById('publicar-instagram').checked = false;
  document.getElementById('legenda-instagram').value = '';
  toggleInstagram();
}

function showStatus(msg, type) {
  const status = document.getElementById('status');
  status.textContent = msg;
  status.className = `status ${type}`;
  setTimeout(() => status.className = 'status', 5000);
}

// Load articles
async function loadArticles() {
  const [pendentes, publicados] = await Promise.all([
    fetch(`${API_BASE}/api/articles/list?status=pendente`).then(r => r.json()),
    fetch(`${API_BASE}/api/articles/list?status=publicado`).then(r => r.json())
  ]);

  document.getElementById('count-pendentes').textContent = pendentes.articles?.length || 0;
  document.getElementById('count-publicados').textContent = publicados.articles?.length || 0;

  document.getElementById('list-pendentes').innerHTML = pendentes.articles?.map(a => `
    <div class="article-card">
      <h3>${a.titulo}</h3>
      <div class="meta">${a.categoria} • ${a.autor} • ${new Date(a.created_at).toLocaleDateString('pt-BR')}</div>
      <button class="btn-approve" onclick="approveArticle('${a.id}')">✅ Aprovar</button>
      <button class="btn-reject">❌ Rejeitar</button>
    </div>
  `).join('') || '<p>Nenhum artigo pendente</p>';

  document.getElementById('list-publicados').innerHTML = publicados.articles?.map(a => `
    <div class="article-card">
      <h3>${a.titulo}</h3>
      <div class="meta">${a.categoria} • ${new Date(a.published_at).toLocaleDateString('pt-BR')}</div>
      <a href="/artigos/${a.slug}" target="_blank">Ver artigo →</a>
    </div>
  `).join('') || '<p>Nenhum artigo publicado</p>';
}

async function approveArticle(id) {
  const response = await fetch(`${API_BASE}/api/articles/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ id })
  });

  if (response.ok) {
    alert('Artigo aprovado!');
    loadArticles();
  }
}

async function loadInstagramInfo() {
  const response = await fetch(`${API_BASE}/api/instagram/schedule`);
  const data = await response.json();
  
  document.getElementById('instagram-info').innerHTML = `
    <p><strong>Posts hoje:</strong> ${data.posts_today} / 10</p>
    <p><strong>Disponíveis hoje:</strong> ${data.remaining_today}</p>
    <p><strong>Total na fila:</strong> ${data.queue_total}</p>
  `;
}

async function generateWithAI() {
  const tema = prompt('Digite o tema do artigo:');
  if (!tema) return;

  const categoria = document.getElementById('categoria').value;
  showStatus('Gerando artigo com IA...', 'success');

  const response = await fetch(`${API_BASE}/api/articles/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ tema, categoria })
  });

  const data = await response.json();
  if (data.success) {
    document.getElementById('titulo').value = data.titulo;
    document.getElementById('resumo').value = data.resumo;
    tinymce.get('conteudo').setContent(data.conteudo);
    showStatus('Artigo gerado! Revise e adicione imagem.', 'success');
  }
}

// Auto-login
window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('adminToken');
  if (saved) {
    document.getElementById('token').value = saved;
    login();
  }
});
