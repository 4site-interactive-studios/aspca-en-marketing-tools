"""QA instrument: side-by-side composites, source left and port right, at
both widths. Usage: python3 -I scripts/qa-compare.py <srcdir> <portdir> <outdir> <dsf>"""
import sys, os
from PIL import Image, ImageDraw
srcdir, portdir, outdir, dsf = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4])
os.makedirs(outdir, exist_ok=True)
pairs = [('monthly-ack', 'monthly-guardian-thank-you'),
         ('onetime-ack.resolved', 'one-time-thank-you'),
         ('annual-ack.resolved', 'annual-membership-thank-you')]
for src, port in pairs:
    for w in (600, 375):
        a = Image.open(f'{srcdir}/{src}_{w}.png').convert('RGB')
        b = Image.open(f'{portdir}/{port}_{w}.png').convert('RGB')
        gap = 24 * dsf
        head = 30 * dsf
        out = Image.new('RGB', (a.width + b.width + gap, max(a.height, b.height) + head), (255, 0, 255))
        d = ImageDraw.Draw(out)
        d.rectangle((0, 0, out.width, head), fill=(54, 54, 54))
        d.text((8 * dsf, 8 * dsf), f'SOURCE {w}px', fill=(255, 255, 255))
        d.text((a.width + gap + 8 * dsf, 8 * dsf), f'PORT (MJML) {w}px', fill=(255, 255, 255))
        out.paste(a, (0, head)); out.paste(b, (a.width + gap, head))
        out.save(f'{outdir}/{port}_{w}_compare.png')
        print(port, w, a.size, b.size)
