# Empaqueta el juego web para itch.io con rutas POSIX (forward slash).
# Evita el bug de Compress-Archive de PowerShell 5.1 (que usa backslash y
# rompe las rutas en itch.io/Linux -> el juego sale sin CSS ni JS).
import os, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEST = os.path.join(ROOT, "deco-dialect-web.zip")
FILES = ["index.html", "sw.js", "manifest.webmanifest"]
DIRS  = ["css", "js", "icons", "fonts"]

if os.path.exists(DEST):
    os.remove(DEST)

with zipfile.ZipFile(DEST, "w", zipfile.ZIP_DEFLATED) as z:
    for f in FILES:
        p = os.path.join(ROOT, f)
        if os.path.isfile(p):
            z.write(p, f)  # arcname relativo, '/' garantizado
    for d in DIRS:
        base = os.path.join(ROOT, d)
        if not os.path.isdir(base):
            continue
        for dirpath, _, names in os.walk(base):
            for n in names:
                full = os.path.join(dirpath, n)
                arc = os.path.relpath(full, ROOT).replace(os.sep, "/")
                z.write(full, arc)

# Verificacion: todas las entradas deben usar '/'
with zipfile.ZipFile(DEST) as z:
    names = z.namelist()
bad = [n for n in names if "\\" in n]
print("Creado:", DEST, "(%d archivos)" % len(names))
print("Rutas con backslash:", len(bad), "(debe ser 0)")
