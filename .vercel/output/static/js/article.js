
(async function(){
  function buildVoiceControls(article) {
    if (!article?.audioEnabled) return '';
    return `<div class="ovc-audio-box"><strong>Ouvir matéria</strong><div class="ovc-audio-actions"><button type="button" data-audio-play>▶ Ouvir</button><button type="button" data-audio-stop>■ Parar</button></div></div>`;
  }
  document.addEventListener('DOMContentLoaded', async () => {
    const slug = new URLSearchParams(location.search).get('slug');
    const payload = await OVC.fetchJSON(`/api/public/content?resources=articles,site-settings&slug=${encodeURIComponent(slug || '')}`);
    const article = payload.article;
    const wrap = document.querySelector('[data-article-wrap]');
    if (!article || !wrap) {
      wrap.innerHTML = '<div class="ovc-panel"><h1>Matéria não encontrada</h1><p>O conteúdo que você procurou ainda não está disponível.</p></div>';
      return;
    }
    OVC.applyCategoryColor(article.category);
    document.title = `${article.title} | O Valor Capital`;
    wrap.innerHTML = `<article class="ovc-article-page"><div class="ovc-kicker">${article.categoryLabel}</div><h1>${article.title}</h1><div class="ovc-meta"><span>${article.author || article.source || 'OVC'}</span><span>${article.relativeDate || ''}</span><span>${article.readingTime || ''}</span></div>${buildVoiceControls(article)}<div class="ovc-article-body">${article.body || `<p>${article.excerpt || ''}</p>`}</div><div class="ovc-article-tags">${(article.tags || []).map(tag => `<span>${tag}</span>`).join('')}</div></article>`;

    let utter;
    wrap.querySelector('[data-audio-play]')?.addEventListener('click', () => {
      if (!('speechSynthesis' in window)) return alert('Seu navegador não suporta leitura em voz alta.');
      window.speechSynthesis.cancel();
      utter = new SpeechSynthesisUtterance([article.title, article.excerpt, article.body.replace(/<[^>]+>/g, ' ')].join('. '));
      utter.lang = 'pt-BR';
      utter.rate = 1;
      window.speechSynthesis.speak(utter);
    });
    wrap.querySelector('[data-audio-stop]')?.addEventListener('click', () => window.speechSynthesis?.cancel());
  });
})();
