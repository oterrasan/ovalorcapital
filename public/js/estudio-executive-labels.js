(function () {
  function text(el, value) {
    if (el) el.textContent = value;
  }

  function replaceButtonLabel(selector, value) {
    var el = document.querySelector(selector);
    if (el) el.textContent = value;
  }

  function renameTemplate(button, title, subtitle) {
    if (!button) return;
    button.innerHTML = title + '<small>' + subtitle + '</small>';
  }

  function applyLabels() {
    text(document.querySelector('.brand strong'), 'Studio Visual');
    text(document.querySelector('.brand span'), 'OVC Inteligencia');
    text(document.querySelector('.topbar .eyebrow'), 'OVC INTELIGENCIA / DESIGN');
    text(document.querySelector('.topbar h2'), 'Studio Visual');

    text(document.querySelector('.ai-card .card-title span'), 'Assistente de campanha');
    text(document.querySelector('.ai-card .card-title small'), 'copy e legenda');

    var brief = document.getElementById('briefInput');
    if (brief) brief.placeholder = 'Descreva produto, publico, objetivo e contexto da campanha.';

    replaceButtonLabel('#generateCopy', 'Gerar copy');
    replaceButtonLabel('#addText', 'Titulo');
    replaceButtonLabel('#addSubtitle', 'Apoio');
    replaceButtonLabel('#addBox', 'Faixa');
    replaceButtonLabel('#addBadge', 'Tag');
    replaceButtonLabel('#saveProject', 'Salvar');
    replaceButtonLabel('#loadProject', 'Carregar');
    replaceButtonLabel('#clearProject', 'Limpar');
    replaceButtonLabel('#bringFront', 'Frente');
    replaceButtonLabel('#deleteEl', 'Excluir');
    replaceButtonLabel('#exportPng', 'Exportar PNG');
    replaceButtonLabel('#exportJpg', 'Exportar JPG');

    text(document.querySelector('.back-link'), 'Voltar para o Command Center');

    var titles = Array.from(document.querySelectorAll('.tool-card .card-title span'));
    titles.forEach(function (el) {
      var value = (el.textContent || '').trim().toLowerCase();
      if (value === 'elementos') el.textContent = 'Componentes';
      if (value === 'paleta') el.textContent = 'Identidade visual';
      if (value === 'camadas') el.textContent = 'Estrutura';
    });

    var notes = Array.from(document.querySelectorAll('.tool-card.note strong'));
    notes.forEach(function (el) { if ((el.textContent || '').includes('Custo zero')) el.textContent = 'Processamento local'; });
    var noteText = document.querySelector('.tool-card.note p');
    if (noteText) noteText.textContent = 'Templates, edicao, upload, salvamento e exportacao rodam no navegador nesta versao.';

    var templates = Array.from(document.querySelectorAll('.template-item'));
    renameTemplate(templates[0], 'Campanha principal', 'Oferta, CTA e posicionamento');
    renameTemplate(templates[1], 'Comunicado executivo', 'Alerta, contexto e orientacao');
    renameTemplate(templates[2], 'Autoridade', 'Prova, metodo e reputacao');
    renameTemplate(templates[3], 'Conteudo educativo', 'Lista, explicacao e clareza');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyLabels);
  } else {
    applyLabels();
  }

  setTimeout(applyLabels, 200);
  setTimeout(applyLabels, 900);
})();
