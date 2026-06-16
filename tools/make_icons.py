"""Genera los iconos PNG de Deco Dialect (estética Art Deco-Neón)."""
import os, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUT = os.path.join(os.path.dirname(__file__), '..', 'icons')
os.makedirs(OUT, exist_ok=True)

BG1 = (28, 16, 20)      # rojo muy oscuro
BG2 = (13, 10, 12)      # #0d0a0c casi negro
GOLD = (233, 194, 112)  # #e9c270
GOLD_L = (255, 230, 168)
NEON = (226, 48, 72)    # #e23048 rojo deco (mantengo el nombre por simplicidad)

def radial_bg(size, pad_ratio=0.0):
    """Fondo degradado radial."""
    img = Image.new('RGB', (size, size), BG2)
    px = img.load()
    cx = cy = size / 2
    maxr = size * 0.72
    for y in range(size):
        for x in range(size):
            d = math.hypot(x - cx, y - cy) / maxr
            d = min(1.0, d)
            r = int(BG1[0] + (BG2[0] - BG1[0]) * d)
            g = int(BG1[1] + (BG2[1] - BG1[1]) * d)
            b = int(BG1[2] + (BG2[2] - BG1[2]) * d)
            px[x, y] = (r, g, b)
    return img

def draw_rays(img):
    """Rayos Art Deco tenues desde el centro."""
    size = img.size[0]
    overlay = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    cx = cy = size / 2
    L = size
    n = 16
    for i in range(n):
        a = (i / n) * 2 * math.pi
        col = (NEON if i % 2 else GOLD) + (16,)
        d.polygon([
            (cx, cy),
            (cx + math.cos(a - 0.05) * L, cy + math.sin(a - 0.05) * L),
            (cx + math.cos(a + 0.05) * L, cy + math.sin(a + 0.05) * L),
        ], fill=col)
    img.paste(Image.alpha_composite(img.convert('RGBA'), overlay).convert('RGB'), (0, 0))

def deco_frame(img, inset_ratio, color, width_ratio=0.012):
    size = img.size[0]
    d = ImageDraw.Draw(img)
    m = int(size * inset_ratio)
    w = max(2, int(size * width_ratio))
    d.rectangle([m, m, size - m, size - m], outline=color, width=w)
    # esquinas internas tipo deco
    c = int(size * 0.10)
    for (x0, y0, x1, y1) in [
        (m + c, m, m + c, m + c), (m, m + c, m + c, m + c),
    ]:
        pass

def load_font(size_px):
    for name in ['georgiab.ttf', 'georgia.ttf', 'timesbd.ttf', 'arialbd.ttf', 'Arial.ttf']:
        try:
            return ImageFont.truetype(name, size_px)
        except Exception:
            continue
    return ImageFont.load_default()

def glow_text(img, text, font, fill, glow, center, glow_radius=8):
    size = img.size[0]
    layer = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.text(center, text, font=font, fill=glow + (255,), anchor='mm')
    layer = layer.filter(ImageFilter.GaussianBlur(glow_radius))
    img_rgba = img.convert('RGBA')
    img_rgba = Image.alpha_composite(img_rgba, layer)
    d2 = ImageDraw.Draw(img_rgba)
    d2.text(center, text, font=font, fill=fill + (255,), anchor='mm')
    return img_rgba.convert('RGB')

def make(size, maskable=False, fname='icon.png'):
    img = radial_bg(size)
    draw_rays(img)
    inset = 0.16 if maskable else 0.07   # maskable deja margen de seguridad
    deco_frame(img, inset, GOLD, 0.014)
    deco_frame(img, inset + 0.02, NEON, 0.006)

    # "DD" central
    font = load_font(int(size * (0.34 if maskable else 0.40)))
    cx = size / 2
    img = glow_text(img, 'DD', font, GOLD_L, GOLD, (cx, size * 0.46), glow_radius=int(size*0.02))

    # subtítulo
    sub = load_font(int(size * 0.075))
    img = glow_text(img, 'DECO DIALECT', sub, NEON, NEON, (cx, size * 0.78), glow_radius=int(size*0.012))

    img.save(os.path.join(OUT, fname))
    print('wrote', fname, size)

make(192, False, 'icon-192.png')
make(512, False, 'icon-512.png')
make(512, True,  'icon-maskable-512.png')
# favicon pequeño
Image.open(os.path.join(OUT, 'icon-512.png')).resize((32, 32)).save(os.path.join(OUT, 'favicon-32.png'))
# icono grande tienda (512 ya sirve; Play pide 512x512 hi-res)
print('done')
