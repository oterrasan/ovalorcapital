"""Verify public editorial content before JavaScript is executed."""
import json
import re
import sys
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
from urllib.request import urlopen

SECTIONS = {"": "", "politica": "Política", "economia": "Economia", "negocios": "Negócios",
            "financas": "Finanças", "industria": "Indústria", "tecnologia": "Tecnologia",
            "esportes": "Esportes", "familia": "Família", "giro": "Giro",
            "internacional": "Internacional", "brasil-on": "Brasil On"}
BASE = "https://www.ovalorcapital.com.br"

# 19/11/2026 — correção real: esta lista era 61, extraída de uma tabela
# JS interna (SECTION_LABELS) que estava desatualizada — testar contra ela
# mascarava o erro real. Reconstruída extraindo diretamente os 122 hrefs
# reais do <header> da home em produção (mesma lista usada em
# api/category.js: SUBSECTIONS). Confirmado: 104 HTTP 400 + 18 HTTP 200
# nessas 122 URLs antes deste fix — bate exatamente com o relatado.
SUBSECTIONS = {
    "politica": {
        "bastidores-de-brasilia": "Bastidores de Brasília", "corrupcao-e-investigacao": "Corrupção e Investigação",
        "eleicoes-2026": "Eleições 2026", "geral": "Geral",
        "judiciario": "Judiciário", "legislativo": "Legislativo",
        "noticias-24hrs": "Notícias 24hrs", "poder-executivo": "Poder Executivo",
        "politica-internacional": "Política Internacional",
    },
    "economia": {
        "cambio-e-mercados": "Câmbio e Mercados", "commodities": "Commodities",
        "consumo-e-varejo": "Consumo e Varejo", "geral": "Geral",
        "inflacao": "Inflação", "infraestrutura": "Infraestrutura",
        "mercado-de-trabalho": "Mercado de Trabalho", "pib-e-indicadores": "PIB e Indicadores",
        "politica-economica": "Política Econômica", "politica-monetaria": "Política Monetária",
        "reforma-tributaria": "Reforma Tributária", "tributos": "Tributos",
    },
    "negocios": {
        "comercio-exterior": "Comércio Exterior", "credito-empresarial": "Crédito Empresarial",
        "economia-criativa": "Economia Criativa", "empreendedorismo": "Empreendedorismo",
        "franquias": "Franquias", "fusoes-e-aquisicoes": "Fusões e Aquisições",
        "geral": "Geral", "gestao": "Gestão",
        "lgpd-e-compliance": "LGPD e Compliance", "mercado-de-capitais": "Mercado de Capitais",
        "startups": "Startups", "sustentabilidade-empresarial": "Sustentabilidade Empresarial",
    },
    "financas": {
        "bolsa-e-acoes": "Bolsa e Ações", "criptomoedas": "Criptomoedas",
        "dividendos": "Dividendos", "educacao-financeira": "Educação Financeira",
        "fundos-e-fiis": "Fundos e FIIs", "geral": "Geral",
        "imoveis-como-investimento": "Imóveis como Investimento", "investimentos-internacionais": "Investimentos Internacionais",
        "planejamento-patrimonial": "Planejamento Patrimonial", "previdencia": "Previdência",
        "renda-fixa": "Renda Fixa", "seguros-e-protecao": "Seguros e Proteção",
    },
    "industria": {
        "agronegocio": "Agronegócio", "automotivo": "Setor Automotivo",
        "construcao-civil": "Construção Civil", "energia": "Energia",
        "geral": "Geral", "industria-40": "Indústria 4.0",
        "logistica": "Logística", "mineracao": "Mineração",
        "petroleo-e-gas": "Petróleo e Gás",
    },
    "tecnologia": {
        "ciberseguranca": "Cibersegurança", "dados-e-analytics": "Dados e Analytics",
        "fintechs": "Fintechs", "geral": "Geral",
        "govtech": "Govtech", "healthtech": "Healthtech",
        "inovacao": "Inovação", "inteligencia-artificial": "Inteligência Artificial",
        "startups-tech": "Startups de Tecnologia", "transformacao-digital": "Transformação Digital",
    },
    "esportes": {
        "atletismo": "Atletismo", "ciclismo": "Ciclismo",
        "esports": "eSports", "geral": "Geral",
        "golf": "Golfe", "hockey": "Hóquei",
        "luta-e-artes-marciais": "Luta e Artes Marciais", "mlb": "Beisebol (MLB)",
        "natacao": "Natação", "olimpiadas": "Olimpíadas",
        "rugby": "Rúgbi", "vela-e-nautico": "Vela e Náutico",
        "xadrez": "Xadrez",
    },
    "familia": {
        "criancas-e-adolescentes": "Crianças e Adolescentes", "direito-de-familia": "Direito de Família",
        "educacao-dos-filhos": "Educação dos Filhos", "geral": "Geral",
        "habitacao": "Habitação", "lazer-e-bem-estar": "Lazer e Bem-estar",
        "orcamento-familiar": "Orçamento Familiar", "relacionamentos": "Relacionamentos",
        "saude-familiar": "Saúde Familiar", "sucessao": "Sucessão",
        "terceira-idade": "Terceira Idade", "viagens-em-familia": "Viagens em Família",
    },
    "giro": {
        "bastidores": "Bastidores", "famosos": "Famosos",
        "geral": "Geral",
    },
    "internacional": {
        "africa": "África", "america-latina": "América Latina",
        "asia-pacifico": "Ásia-Pacífico", "china": "China",
        "comercio-global": "Comércio Global", "estados-unidos": "Estados Unidos",
        "europa": "Europa", "geopolitica": "Geopolítica",
        "geral": "Geral", "organismos-internacionais": "Organismos Internacionais",
        "oriente-medio": "Oriente Médio", "russia-e-conflitos": "Rússia e Conflitos",
    },
    "brasil-on": {
        "bem-estar": "Bem-estar", "carreira-e-trabalho": "Carreira e Trabalho",
        "ciencia-e-inovacao": "Ciência e Inovação", "concursos-e-educacao": "Concursos e Educação",
        "consumidor": "Consumidor", "cotidiano": "Cotidiano",
        "cultura-e-lazer": "Cultura e Lazer", "direitos-e-cidadania": "Direitos e Cidadania",
        "energia-e-sustentabilidade": "Energia e Sustentabilidade", "fe-e-espiritualidade": "Fé e Espiritualidade",
        "geral": "Geral", "habitacao-e-imoveis": "Habitação e Imóveis",
        "meio-ambiente": "Meio Ambiente", "previdencia-social": "Previdência Social",
        "saude-e-qualidade-de-vida": "Saúde e Qualidade de Vida", "seguranca-publica": "Segurança Pública",
        "tecnologia-e-sociedade": "Tecnologia e Sociedade", "transporte-e-mobilidade": "Transporte e Mobilidade",
    },
}


class EditorialPage(HTMLParser):
    def __init__(self):
        super().__init__()
        self.h1 = []
        self.reading_title = False
        self.canonicals = []
        self.links = set()
        self.empty_subsection = False
        self.schema = []
        self.reading_schema = False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "data-subsection-empty" in a:
            self.empty_subsection = True
        if tag == "h1":
            self.reading_title = True
            self.h1.append("")
        if tag == "a" and re.fullmatch(r"/[a-z0-9-]+/[a-z0-9-]+-[a-f0-9]{8}/", a.get("href") or ""):
            self.links.add(a["href"])
        if tag == "link" and a.get("rel") == "canonical":
            self.canonicals.append(a.get("href"))
        if tag == "script" and a.get("type") == "application/ld+json":
            self.reading_schema = True
            self.schema.append("")

    def handle_endtag(self, tag):
        if tag == "h1":
            self.reading_title = False
        if tag == "script":
            self.reading_schema = False

    def handle_data(self, data):
        if self.reading_title:
            self.h1[-1] += data
        if self.reading_schema:
            self.schema[-1] += data


def check(section):
    path = "/" + (section + "/" if section else "")
    with urlopen(sys.argv[1].rstrip("/") + path, timeout=25) as response:
        page = EditorialPage()
        page.feed(response.read().decode())
    if page.canonicals != [BASE + path] or len(page.h1) != 1:
        raise ValueError(f"{path}: canonical ou quantidade de H1 incorreta")
    title = page.h1[0].strip()
    if not title or "carregando" in title.lower() or (section and title != SECTIONS[section]):
        raise ValueError(f"{path}: H1 editorial inválido")
    if not any(link.startswith("/" + (section or "politica") + "/") for link in page.links):
        raise ValueError(f"{path}: nenhum link de matéria da editoria")
    if section and not any(json.loads(raw).get("@type") == "CollectionPage" for raw in page.schema):
        raise ValueError(f"{path}: CollectionPage ausente")
    print(f"{path} OK ({len(page.links)} links de matérias)")


def check_sub(args):
    section, sub, label = args
    path = f"/{section}/{sub}/"
    with urlopen(sys.argv[1].rstrip("/") + path, timeout=25) as response:
        robots = response.headers.get("X-Robots-Tag", "").lower()
        page = EditorialPage()
        page.feed(response.read().decode())
    if page.canonicals != [BASE + path] or len(page.h1) != 1:
        raise ValueError(f"{path}: canonical ou quantidade de H1 incorreta")
    title = page.h1[0].strip()
    if not title or "carregando" in title.lower() or title != label:
        raise ValueError(f"{path}: H1 de subseção inválido (esperado {label!r}, veio {title!r})")
    if page.empty_subsection:
        if "noindex" not in robots:
            raise ValueError(f"{path}: subseção vazia sem noindex")
    elif not page.links:
        raise ValueError(f"{path}: nenhum link de matéria na subseção")
    if not any(json.loads(raw).get("@type") == "CollectionPage" for raw in page.schema):
        raise ValueError(f"{path}: CollectionPage ausente")
    print(f"{path} OK ({len(page.links)} links de matérias)")


if __name__ == "__main__":
    sub_jobs = [(cat, sub, label) for cat, subs in SUBSECTIONS.items() for sub, label in subs.items()]
    with ThreadPoolExecutor(max_workers=3) as pool:
        list(pool.map(check, SECTIONS))
        list(pool.map(check_sub, sub_jobs))
    print(f"\n{len(SECTIONS)} editorias/home + {len(sub_jobs)} subseções — todas OK")
