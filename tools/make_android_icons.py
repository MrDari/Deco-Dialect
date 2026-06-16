"""Genera los iconos de launcher de Android (todas las densidades) con la estética del juego.
   Reutiliza el render del icono web pero adaptado a los tamaños mipmap y al foreground
   de los adaptive icons (con margen de seguridad)."""
import os, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

RES = os.path.join(os.path.dirname(__file__), '..', 'android', 'app', 'src', 'main', 'res')

BG1 = (28, 16, 20)
BG2 = (13, 10, 12)
GOLD = (233, 194, 112)
GOLD_L = (255, 230, 168)
RED = (226, 48, 72)

# densidades: nombre carpeta -> tamaño del icono (px)
DENSITIES = {
    'mipmap-mdpi': 48, 'mipmap-hdpi': 72, 'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144, 'mipmap-xxxhdpi': 192,
}
FG_SIZE = 432  # foreground de adaptive icon (108dp @ xxxhdpi)

def radial_bg(size):
    img = Image.new('RGB', (size, size), BG2)
    px = img.load()
    c = size / 2; maxr = size * 0.72
    for y in range(size):
        for x in range(size):
            d = min(1.0, math.hypot(x - c, y - c) / maxr)
            px[x, y] = (
                int(BG1[0] + (BG2[0]-BG1[0])*d),
                int(BG1[1] + (BG2[1]-BG1[1])*d),
                int(BG1[2] + (BG2[2]-BG1[2])*d))
    return img

def font(px):
    for n in ['georgiab.ttf', 'timesbd.ttf', 'arialbd.ttf']:
        try: return ImageFont.truetype(n, px)
        except: pass
    return ImageFont.load_default()

def glow_text(img, text, fnt, fill, glow, center, blur):
    size = img.size[0]
    layer = Image.new('RGBA', (size, size), (0,0,0,0))
    ImageDraw.Draw(layer).text(center, text, font=fnt, fill=glow+(255,), anchor='mm')
    layer = layer.filter(ImageFilter.GaussianBlur(blur))
    out = Image.alpha_composite(img.convert('RGBA'), layer)
    ImageDraw.Draw(out).text(center, text, font=fnt, fill=fill+(255,), anchor='mm')
    return out.convert('RGB')

def draw_dd(img, scale=1.0):
    """Dibuja 'DD' dorado centrado con marco rojo deco."""
    size = img.size[0]
    d = ImageDraw.Draw(img)
    m = int(size * (0.18 if scale < 1 else 0.12))
    w = max(2, int(size*0.012))
    d.rectangle([m, m, size-m, size-m], outline=GOLD, width=w)
    d.rectangle([m+int(size*0.03)]*1 + [m+int(size*0.03), size-m-int(size*0.03), size-m-int(size*0.03)], outline=RED, width=max(1,w//2))
    img2 = glow_text(img, 'DD', font(int(size*0.34*scale)), GOLD_L, GOLD, (size/2, size*0.46), int(size*0.02))
    return img2

def make_square(size):
    img = radial_bg(size)
    img = draw_dd(img, scale=1.0)
    return img

def make_round(size):
    img = make_square(size)
    mask = Image.new('L', (size, size), 0)
    ImageDraw.Draw(mask).ellipse([0,0,size,size], fill=255)
    out = Image.new('RGBA', (size, size), (0,0,0,0))
    out.paste(img, (0,0), mask)
    return out

def make_foreground(size):
    # transparente con la 'DD' centrada y reducida (zona segura del adaptive icon)
    img = Image.new('RGBA', (size, size), (0,0,0,0))
    img = glow_text(img, 'DD', font(int(size*0.26)), GOLD_L, GOLD, (size/2, size*0.5), int(size*0.015))
    return img

for folder, sz in DENSITIES.items():
    base = os.path.join(RES, folder)
    os.makedirs(base, exist_ok=True)
    make_square(sz).save(os.path.join(base, 'ic_launcher.png'))
    make_round(sz).save(os.path.join(base, 'ic_launcher_round.png'))
    # foreground a tamaño proporcional (108/48 del icono)
    fg = int(sz * 108 / 48)
    make_foreground(fg).save(os.path.join(base, 'ic_launcher_foreground.png'))
    print('iconos', folder, sz)

print('Iconos de Android generados.')
