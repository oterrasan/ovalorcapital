import re, base64, io, urllib.request
from PIL import Image

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

def fetch(url, timeout=10):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()

print("=== sitemap_index.xml ===")
try:
    xml = fetch("https://jovempan.com.br/sitemap_index.xml").decode("utf-8", errors="ignore")
    print("bytes:", len(xml))
    locs = re.findall(r"<loc>(.*?)</loc>", xml)
    for l in locs[:15]:
        print(l)
except Exception as e:
    print("ERROR:", e)

print()
print("=== /politica/ (secao pedida pelo Roberto) ===")
try:
    html = fetch("https://jovempan.com.br/politica/").decode("utf-8", errors="ignore")
    print("bytes:", len(html))
    links = sorted(set(re.findall(r'href="(https://jovempan\.com\.br/politica/[a-z0-9-]{15,}/?)"', html)))
    print("links de materia encontrados:", len(links))
    for l in links[:10]:
        print(" ", l)
except Exception as e:
    print("ERROR:", e)
    links = []

print()
print("=== testando og:image de ate 4 materias da secao politica ===")
tested = 0
for link in links[:6]:
    if tested >= 4:
        break
    try:
        art = fetch(link).decode("utf-8", errors="ignore")
    except Exception as e:
        print(link, "ARTICLE_FETCH_ERROR", e)
        continue
    m = re.search(r'<meta[^>]*property=["\']og:image["\'][^>]*content=["\']([^"\']+)["\']', art)
    if not m:
        print(link, "NO_OG_IMAGE")
        continue
    imgurl = m.group(1)
    tag = f"IMG{tested}"
    print(f"{tag}_ARTICLE: {link}")
    print(f"{tag}_URL: {imgurl}")
    try:
        imgbytes = fetch(imgurl, timeout=15)
        im = Image.open(io.BytesIO(imgbytes)).convert("RGB")
        w, h = im.size
        print(f"{tag}_DIMS: {w}x{h} bytes:{len(imgbytes)}")
        if w > 420:
            nh = int(h * 420 / w)
            im = im.resize((420, nh))
        buf = io.BytesIO()
        im.save(buf, format="JPEG", quality=60)
        small = buf.getvalue()
        b64 = base64.b64encode(small).decode("ascii")
        for i in range(0, len(b64), 1200):
            print(f"{tag}_C{i//1200:04d}:{b64[i:i+1200]}")
    except Exception as e:
        print(f"{tag}_IMG_ERROR:", e)
    tested += 1
    print()
