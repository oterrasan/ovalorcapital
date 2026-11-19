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

# 19/11/2026 — subseções reais do menu (mesma lista de api/editorial.js:
# SUBSECTIONS). Antes desta data, 61 dessas 61 URLs (todas, exceto
# colunistas, que tem rota própria) caíam no catch-all de artigo e
# devolviam HTTP 400 "invalid slug" — nenhuma tinha rota dedicada.
SUBSECTIONS = {
    "politica": {"bastidores-de-brasilia": "Bastidores de Brasília", "eleicoes-2026": "Eleições 2026",
                 "noticias-24hrs": "Notícias 24hrs", "corrupcao-e-investigacao": "Corrupção & Investigação",
                 "politica-internacional": "Política Internacional", "geral": "Geral"},
    "economia": {"politica-economica": "Política Econômica", "cambio-e-mercados": "Câmbio & Mercados",
                 "pib-e-indicadores": "PIB & Indicadores", "tributos": "Tributos", "geral": "Geral"},
    "negocios": {"empreendedorismo": "Empreendedorismo", "startups": "Startups", "gestao": "Gestão",
                 "credito-empresarial": "Crédito Empresarial", "geral": "Geral"},
    "financas": {"renda-fixa": "Renda Fixa", "bolsa-e-acoes": "Bolsa & Ações",
                 "seguros-e-protecao": "Seguros & Proteção", "previdencia": "Previdência",
                 "fundos-e-fiis": "Fundos & FIIs", "planejamento-patrimonial": "Planejamento Patrimonial",
                 "criptomoedas": "Criptomoedas", "geral": "Geral"},
    "industria": {"agronegocio": "Agronegócio", "energia": "Energia", "construcao": "Construção Civil",
                  "logistica": "Logística", "geral": "Geral"},
    "tecnologia": {"inteligencia-artificial": "Inteligência Artificial", "fintechs": "Fintechs",
                   "ciberseguranca": "Cibersegurança", "inovacao": "Inovação", "geral": "Geral"},
    "esportes": {"futebol": "Futebol", "basquete": "Basquete", "motor": "Motor", "tenis": "Tênis",
                 "mma": "MMA", "volei": "Vôlei", "nfl": "NFL", "geral": "Geral"},
    "familia": {"orcamento-familiar": "Orçamento Familiar", "educacao-dos-filhos": "Educação dos Filhos",
                "habitacao": "Habitação", "sucessao": "Sucessão", "geral": "Geral"},
    "giro": {"famosos": "Famosos", "bastidores": "Bastidores", "geral": "Geral"},
    "internacional": {"eua": "Estados Unidos", "europa": "Europa", "china": "China",
                      "geopolitica": "Geopolítica", "geral": "Geral"},
    "brasil-on": {"cotidiano": "Cotidiano", "consumidor": "Consumidor", "bem-estar": "Bem-estar",
                  "meio-ambiente": "Meio Ambiente", "ciencia-e-inovacao": "Ciência & Inovação", "geral": "Geral"},
}


class EditorialPage(HTMLParser):
    def __init__(self):
        super().__init__()
        self.h1 = []
        self.reading_title = False
        self.canonicals = []
        self.links = set()
        self.schema = []
        self.reading_schema = False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
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
        page = EditorialPage()
        page.feed(response.read().decode())
    if page.canonicals != [BASE + path] or len(page.h1) != 1:
        raise ValueError(f"{path}: canonical ou quantidade de H1 incorreta")
    title = page.h1[0].strip()
    if not title or "carregando" in title.lower() or title != label:
        raise ValueError(f"{path}: H1 de subseção inválido (esperado {label!r}, veio {title!r})")
    if not page.links:
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
