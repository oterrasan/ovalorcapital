#!/usr/bin/env python3
"""
OVC Card Generator
Gera card padrão OVC com imagem da notícia + template + título
"""
import sys, io, base64, urllib.request
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

TEMPLATE_PATH = Path(__file__).parent.parent / "public" / "images" / "card_template_ovc.png"

ACENTO_CATS = {
    "politica":     (220, 38,  38),
    "economia":     (37,  99, 235),
    "negocios":     (124, 58, 237),
    "investimentos":(5,  150, 105),
    "seguros":      (2,  132, 199),
    "mercados":     (8,  145, 178),
    "tecnologia":   (99, 102, 241),
    "esportes":     (22, 163,  74),
    "saude":        (22, 163,  74),
    "educacao":     (139, 92, 246),
    "tributacao":   (180, 83,   9),
    "regulacao":    (147, 51, 234),
    "industria":    (234, 88,  12),
    "familia":      (219, 39, 119),
    "internacional":(220, 38,  38),
    "variedades":   (236, 72, 153),
}

LABEL_CATS = {
    "politica":"POLÍTICA","economia":"ECONOMIA","negocios":"NEGÓCIOS",
    "investimentos":"INVESTIMENTOS","seguros":"SEGUROS","mercados":"MERCADOS",
    "tecnologia":"TECNOLOGIA","esportes":"ESPORTES","saude":"SAÚDE",
    "educacao":"EDUCAÇÃO","tributacao":"TRIBUTAÇÃO","regulacao":"REGULAÇÃO",
    "industria":"INDÚSTRIA","familia":"FAMÍLIA","internacional":"INTERNACIONAL",
    "variedades":"VARIEDADES",
}

def gerar_card(titulo: str, categoria: str, imagem_url: str = None) -> bytes:
    template = Image.open(TEMPLATE_PATH).convert("RGBA")
    W, H = template.size  # 1080x1350

    IMG_TOP = 240
    IMG_BOT = 1090
    IMG_H   = IMG_BOT - IMG_TOP

    card = Image.new("RGBA", (W, H), (0, 0, 0, 255))

    # Imagem da notícia
    if imagem_url:
        try:
            req = urllib.request.Request(imagem_url, headers={"User-Agent": "Mozilla/5.0"})
            data = urllib.request.urlopen(req, timeout=10).read()
            noticia_img = Image.open(io.BytesIO(data)).convert("RGBA")
            noticia_resized = noticia_img.resize((W, IMG_H), Image.LANCZOS)
            card.paste(noticia_resized, (0, IMG_TOP))
        except Exception:
            acento = ACENTO_CATS.get(categoria, (220, 38, 38))
            bg = Image.new("RGBA", (W, IMG_H), (*acento, 40))
            card.paste(bg, (0, IMG_TOP))
    else:
        acento = ACENTO_CATS.get(categoria, (220, 38, 38))
        bg = Image.new("RGBA", (W, IMG_H), (*acento, 40))
        card.paste(bg, (0, IMG_TOP))

    # Overlay escuro para legibilidade
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw_ov = ImageDraw.Draw(overlay)
    draw_ov.rectangle([0, IMG_TOP, W, IMG_BOT], fill=(0, 0, 0, 160))
    card = Image.alpha_composite(card, overlay)

    # Template original por cima (topo e rodapé intactos)
    card = Image.alpha_composite(card, template)

    draw = ImageDraw.Draw(card)
    acento = ACENTO_CATS.get(categoria, (220, 38, 38))
    label  = LABEL_CATS.get(categoria, categoria.upper())

    try:
        font_bold = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 56)
        font_cat  = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 30)
    except Exception:
        font_bold = font_cat = ImageFont.load_default()

    # Badge categoria
    cat_bbox = draw.textbbox((0, 0), label, font=font_cat)
    cw = cat_bbox[2] - cat_bbox[0]
    cx = (W - cw - 60) // 2
    cy = IMG_TOP + 60
    draw.rounded_rectangle([cx-10, cy-12, cx+cw+50, cy+50], radius=25, fill=(*acento, 255))
    draw.text((cx+20, cy), label, fill="#ffffff", font=font_cat)

    # Título
    words = titulo.split()
    lines, line = [], ""
    for w in words:
        test = (line + " " + w).strip()
        bb = draw.textbbox((0, 0), test, font=font_bold)
        if bb[2] - bb[0] > W - 120:
            if line: lines.append(line)
            line = w
        else:
            line = test
    if line:
        lines.append(line)

    y_start = cy + 90
    for i, l in enumerate(lines[:4]):
        bb = draw.textbbox((0, 0), l, font=font_bold)
        lw = bb[2] - bb[0]
        draw.text(((W-lw)//2+2, y_start+i*75+2), l, fill=(0,0,0,200), font=font_bold)
        draw.text(((W-lw)//2,   y_start+i*75),   l, fill="#ffffff",    font=font_bold)

    buf = io.BytesIO()
    card.convert("RGB").save(buf, format="JPEG", quality=92)
    return buf.getvalue()

if __name__ == "__main__":
    titulo    = sys.argv[1] if len(sys.argv) > 1 else "Título de Teste"
    categoria = sys.argv[2] if len(sys.argv) > 2 else "politica"
    img_url   = sys.argv[3] if len(sys.argv) > 3 else None
    jpeg = gerar_card(titulo, categoria, img_url)
    sys.stdout.buffer.write(jpeg)
