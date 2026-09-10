# Automacao de Reels OVC - processamento e acabamento

Atualizado em: 09/09/2026

## Objetivo

Receber um video bruto anexado a uma materia, aplicar o layout oficial do O Valor Capital, remover encerramentos promocionais de terceiros quando detectados e gerar um MP4 pronto para o portal e para publicacao como Reel.

O processamento pesado roda no GitHub Actions. Ele nao depende do computador de Roberto aberto e nao instala FFmpeg na funcao da Vercel.

## Fluxo

1. O admin envia ou vincula o video bruto pela action `reels_set_source` de `api/manage.js`.
2. O post recebe `metrics.instagram_reel_template.status = pending`.
3. `.github/workflows/instagram-auto.yml` busca um trabalho com `reels_render_job`.
4. O workflow baixa o video e executa `scripts/render-instagram-reel.mjs`.
5. O renderizador analisa os 8 segundos finais, decide se existe tela promocional e calcula o corte.
6. O layout OVC e aplicado, o MP4 final e enviado ao bucket `post-videos` e `reels_render_complete` grava o resultado.
7. Somente videos com template `ready` podem ser publicados como Reel.

## Estado de publicacao

- O acabamento e a preparacao do arquivo ficam ativos.
- A publicacao automatica de Reels inicia pausada (`fail-closed`).
- O botao manual `Publicar como Reel agora` continua disponivel para um video `ready`.
- A automacao somente publica depois que Roberto salvar `REELS_AUTOMATION_ENABLED = on` pelo Admin.
- Esta pausa e exclusiva dos Reels e nao desliga a automacao de imagens do Instagram.

## Qualidade de imagem e texto

- Saida vertical: `1080x1920`, 30 fps, H.264 High, pixel format `yuv420p`.
- O texto e rasterizado inicialmente em `2160x3840` e reduzido com Lanczos 3 para melhorar o antialiasing.
- Encode final: CRF 16, limite de 8 Mbit/s e buffer de 16 Mbit/s.
- A fonte Inter oficial e instalada pelo workflow antes do processamento.
- Logotipos e rodape continuam vindo dos PNGs oficiais extraidos do Canva; nao sao redesenhados.
- O Instagram ainda pode aplicar sua propria recompressao. O arquivo entregue a ele passa a ter margem de qualidade maior para essa etapa.

## Corte automatico de propaganda no final

O renderizador:

- examina os ultimos 8 segundos em baixa resolucao, sem alterar o arquivo original;
- mede mudanca brusca, movimento e proporcao de pixels escuros;
- so considera um encerramento quando ha transicao brusca seguida de uma tela escura ou estavel;
- ao encontrar a tela final, recua 4,25 segundos para retirar tambem chamada, logotipo ou contagem regressiva que antecede o cartao promocional;
- nao corta nada quando nao encontra evidencia suficiente.

Controles opcionais aceitos no objeto do trabalho:

- `trim_end_seconds`: define manualmente quantos segundos retirar; `0` desliga o corte para aquele video.
- `auto_trim_end: false`: desliga apenas a analise automatica.
- `auto_trim_lead_seconds`: altera o recuo anterior a tela final, limitado a 5 segundos.

O resultado da analise e salvo em `metrics.instagram_reel_template.end_trim`, incluindo motivo, duracao original, instante detectado, ponto do corte e segundos removidos.

## Testes executados

### Video com propaganda da Veja

- Entrada: `Feed OVC 500-1000 (Video para Reels do Instagram).mp4`.
- Duracao original: `41,789 s`.
- Tela final detectada em: `39,289 s`.
- Ponto final aplicado: `35,039 s`.
- Duracao conferida do MP4 final: `35,033 s`.
- Resultado visual do ultimo quadro: conteudo editorial com layout OVC, sem `Veja`, `vejamais`, contagem regressiva ou cartao final.

Arquivo local de prova: `video-test-frames/OVC-REEL-TESTE-v7.mp4`.

### Video de controle sem propaganda final

- Entrada: `video-test-frames/sample-12s.mp4`.
- Duracao: `12,066667 s`.
- Resultado: `no_promotional_end_card` e `trimSeconds: 0`.
- Conclusao: o detector preservou o video normal integralmente.

Arquivo local de prova: `video-test-frames/OVC-REEL-CONTROLE-v2.mp4`.

## Arquivos alterados

- `scripts/render-instagram-reel.mjs`: supersampling do texto, analise do final, corte e relatorio.
- `api/manage.js`: versao `ovc-reels-2026-09-v2`, reprocessamento quando o template muda e persistencia de `end_trim`.
- `public/admin/index.html`: controle de Reels inicia visualmente pausado quando ainda nao existe configuracao explicita.
- `.github/workflows/instagram-auto.yml`: captura o relatorio do render e o envia na conclusao do trabalho.

## Regras de seguranca e manutencao

- O video bruto permanece registrado como `source_url`; somente a copia processada substitui `video_url`.
- Um erro no detector ou no FFmpeg marca o trabalho como `error` e permite nova tentativa; nao publica o bruto por engano.
- O detector e conservador e nao e reconhecimento semantico perfeito de qualquer propaganda mundial. Para casos incomuns, use `trim_end_seconds` e confira a previa antes da publicacao.
- Nunca colocar credenciais, tokens do Instagram, Supabase ou GitHub neste arquivo.
- O teste desta alteracao nao publicou nenhum Reel real.

## Validacao rapida para manutencao

```powershell
node --check scripts/render-instagram-reel.mjs
git diff --check
```

Para um teste completo, executar o renderizador com `FFMPEG_PATH` e `FFPROBE_PATH` configurados e conferir a duracao com `ffprobe`. O JSON final deve conter `end_trim.reason` igual a `promotional_end_card` ou `no_promotional_end_card`.
