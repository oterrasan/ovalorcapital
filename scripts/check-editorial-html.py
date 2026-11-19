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


if __name__ == "__main__":
    with ThreadPoolExecutor(max_workers=3) as pool:
        list(pool.map(check, SECTIONS))
