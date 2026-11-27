"""
Publicação de emergência — coluna do Flávio Breghiroli, pedida por Roberto
em 27/11/2026 com urgência ("AJA RÁPIDO"). Script one-off: roda uma vez via
.github/workflows/diag-once.yml, nunca fica agendado.

Fluxo:
1. busca uma imagem real e otimizada (action=buscar_imagem, já reprocessa
   pro nosso Storage — mesmo mecanismo usado pelo campo de capa no admin).
2. publica a coluna direto no portal (action=admin_colunista_post) —
   status:publicado, approved:true, subcategoria_slug:flavio-breghiroli
   (mesmo colunista já cadastrado em 16/11/2026).
3. publica a mesma matéria no feed do Instagram (@ovalorcapital, conta
   default) via action=ig_publish — a legenda/hashtags/CTA são montados
   automaticamente pelo próprio backend (buildInstagramCaption), e o
   colunista recebe collab automática (+ @oterrasan e @obrasilon, aceite
   e curtida automáticos pros dois — regra de 24/11/2026).
"""
import json
import urllib.request
import urllib.parse
import sys

BASE = "https://www.ovalorcapital.com.br"
ADMIN_TOKEN = "ovc-admin-2026-secreto"


def http_get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "ovc-oneoff/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.getcode(), r.read().decode("utf-8", "replace")


def http_post_json(url, payload):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url, data=data, method="POST",
        headers={"Content-Type": "application/json", "User-Agent": "ovc-oneoff/1.0"},
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.getcode(), r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")


TITULO = "O Tubo de Ensaio: O Governo Descobre que a Ciência Existe e Exige um Pouco de Decência."

PARAGRAFOS = [
    "Se você passou a última semana achando que o único milagre do país era a sua paciência resistindo intacta a mais uma segunda-feira, enganou-se redondamente.",
    "A ciência e a tecnologia voltaram a dar as caras no noticiário — o que significa, essencialmente, que os cientistas salvaram a pátria mais uma vez - enquanto os políticos tentavam descobrir mais uma vez onde se liga o projetor na sala de reuniões.",
    "Aperte o jaleco, limpe os óculos e prepare o estômago. Aqui está o raio-X da semana, destilando o melhor da pesquisa de ponta e o pior da nossa eterna burocracia federal.",
]

SECOES = [
    (
        "1. A Esplanada Descobre que Pesquisador Não Vive de Luz e Palmas",
        [
            'Nesta semana, a 23ª Semana Nacional de Ciência e Tecnologia (SNCT) aportou em Brasília com o lema "Ciência Delas", jogando luz merecidamente colossal sobre o protagonismo feminino que sustenta laboratórios, universidades e o pouco de sanidade tecnológica que ainda nos resta.',
            "Aproveitando o embalo da festa, o governo federal resolveu abrir o cofre e anunciou R$ 120 milhões para pesquisas clínicas no SUS. É uma iniciativa excelente? Sem dúvida. Mas é impossível não rir da ironia dramática: o governo trata a ciência como aquela tia idosa que só é lembrada no Natal, mas na hora do aperto — ou quando a eleição se aproxima e o Ministério da Saúde precisa mostrar serviço — corre para o laboratório implorando por um milagre em forma de patente nacional.",
            "Menos carimbo na Esplanada e mais verba na bancada, por favor.",
        ],
    ),
    (
        "2. O Prêmio Mulheres Inovadoras: Onde a Inteligência Artificial Encontra a Competência Real",
        [
            "Enquanto a máquina pública federal patina em trâmites kafkianos, o ecossistema real de inovação seguiu rodando graças à garra de quem bota a mão na massa. Tivemos a entrega da 7ª edição do Prêmio Mulheres Inovadoras (da Finep), celebrando startups lideradas por mulheres que transformam biotecnologia, inteligência artificial e agricultura de precisão em soluções de verdade.",
            "Enquanto a turma engessada de Brasília gasta meses discutindo regulação de portaria, essas pesquisadoras estão resolvendo problemas complexos que o Estado sequer compreende no mapa.",
            "Fica a lição gratuita para o governo: quer inovar de verdade? Tire o pé de cima de quem produz e pare de achar que subsídio para palestra em hotel de luxo substitui investimento em infraestrutura de laboratório.",
        ],
    ),
    (
        "3. A Corrida Global: Onde Ficar Para Trás Dá Prejuízo e Vergonha",
        [
            "Fora do umbigo nacional, o mundo continuou apostando bilhões em semicondutores, computação quântica e soberania tecnológica.",
            "Enquanto nações sérias tratam tecnologia crítica como questão de segurança nacional, por aqui seguimos dependendo da boa vontade de cadeias de suprimento globais e da criatividade de cientistas que fazem milagre com orçamento de cantina escolar.",
            "A pergunta que fica é: até quando o Brasil vai continuar fingindo que é potência tecnológica enquanto gasta mais energia discutindo emendas parlamentares do que comprando espectrômetros?",
        ],
    ),
]

VEREDITO_TITULO = "O Veredito da Semana:"
VEREDITO = [
    "A ciência continua sendo a força mais irônica da humanidade, gastando décadas decifrando os segredos do universo subatômico para descobrirmos que a burocracia estatal ainda prefere discutir licitação de caneta bic a financiar o próximo salto civilizatório.",
    "Ainda bem que temos os cientistas. Porque, se dependêssemos da agilidade dos cérebros atômicos de Brasília, a gente ainda estaria tentando acender fogo com uma autorização prévia da Anvisa e coando nosso cafezinho em fraldas de pano.",
]


def esc(t):
    return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def build_html():
    parts = [f"<p>{esc(p)}</p>" for p in PARAGRAFOS]
    for h3, paras in SECOES:
        parts.append(f"<h3>{esc(h3)}</h3>")
        parts.extend(f"<p>{esc(p)}</p>" for p in paras)
    parts.append(f"<h3>{esc(VEREDITO_TITULO)}</h3>")
    parts.extend(f"<p>{esc(p)}</p>" for p in VEREDITO)
    return "\n".join(parts)


META_DESC = (
    "Coluna de Flávio Breghiroli: a 23ª Semana de C&T, os R$ 120 mi ao SUS e o "
    "Prêmio Mulheres Inovadoras mostram ciência avançando — enquanto o Estado "
    "ainda discute licitação de caneta."
)


def main():
    conteudo = build_html()
    print("== 1) buscando imagem real (tecnologia/ciência) ==")
    q = urllib.parse.quote("laboratorio cientista pesquisa microscopio tecnologia")
    code, body = http_get(f"{BASE}/api/run_portal?action=buscar_imagem&q={q}&categoria=tecnologia")
    print("HTTP", code, body[:500])
    img_url = None
    try:
        img_url = json.loads(body).get("url")
    except Exception as e:
        print("parse imagem falhou:", e)
    print("IMAGEM:", img_url)

    print()
    print("== 2) publicando coluna no portal (admin_colunista_post) ==")
    payload = {
        "action": "admin_colunista_post",
        "token": ADMIN_TOKEN,
        "nome_colunista": "Flávio Breghiroli",
        "titulo": TITULO,
        "conteudo": conteudo,
        "comentario_fixado": META_DESC,
    }
    if img_url:
        payload["imagem"] = img_url
    code, body = http_post_json(f"{BASE}/api/manage", payload)
    print("HTTP", code, body)
    try:
        resp = json.loads(body)
    except Exception as e:
        print("ERRO parse resposta publicacao:", e)
        sys.exit(1)
    if not resp.get("ok"):
        print("FALHOU publicar no portal:", resp)
        sys.exit(1)
    post_id = resp.get("id")
    print("POST_ID:", post_id)
    print(f"URL REAL: {BASE}/colunistas/<slug-gerado-pelo-article>-{str(post_id)[:8]}/")

    if not img_url:
        print()
        print("SEM imagem real -- pulando publicacao no Instagram (ig_publish exige imagem publica).")
        return

    print()
    print("== 3) publicando no Instagram (ig_publish, conta default @ovalorcapital) ==")
    code, body = http_post_json(f"{BASE}/api/manage", {"action": "ig_publish", "post_id": post_id})
    print("HTTP", code, body)


if __name__ == "__main__":
    main()
