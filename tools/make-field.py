# Génère assets/me-field.png : le portrait vu comme un champ scalaire
# (luminance échantillonnée sur une grille 40x40, colormap "inferno").
# Lancé une fois à la main (Pillow requis) ; le PNG produit est versionné.
import sys, os
from PIL import Image, ImageOps
here = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(here, "..", "assets", "me.webp")
N = 40
im = Image.open(src).convert("RGB").resize((N, N), Image.LANCZOS)
g = ImageOps.autocontrast(ImageOps.grayscale(im), cutoff=1)
def inferno(t):
    c0=(0.0002189403691192265,0.001651004631001012,-0.01948089843709184)
    c1=(0.1065134194856116,0.5639564367884091,3.932712388889277)
    c2=(11.60249308247187,-3.972853965665698,-15.9423941062914)
    c3=(-41.70399613139459,17.43639888205313,44.35414519872813)
    c4=(77.162935699427,-33.40235894210092,-81.80730925738993)
    c5=(-71.31942824499214,32.62606426397723,73.20951985803202)
    c6=(25.13112622477341,-12.24266895238567,-23.07032500287172)
    out=[]
    for k in range(3):
        v=c0[k]+t*(c1[k]+t*(c2[k]+t*(c3[k]+t*(c4[k]+t*(c5[k]+t*c6[k])))))
        out.append(max(0,min(255,round(v*255))))
    return tuple(out)
lut=[inferno(i/255) for i in range(256)]
out = Image.new("RGB", (N, N))
out.putdata([lut[v] for v in g.getdata()])
out.save(os.path.join(here, "..", "assets", "me-field.png"), optimize=True)
print("ok", os.path.getsize(os.path.join(here, "..", "assets", "me-field.png")))
