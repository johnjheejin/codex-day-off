import json
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from pathlib import Path

font = TTFont('assets/fonts/newsreader-display-latin.woff2')
glyphs, cmap = font.getGlyphSet(), font.getBestCmap()
scale = 44 / font['head'].unitsPerEm
pen = SVGPathPen(glyphs, ntos=lambda n: ('%.2f' % n).rstrip('0').rstrip('.'))
x = 1
adjust = {'af': -.5, 'ft': -1.8, 'te': -.45, 'er': -.45, 'rg': -.9, 'gl': -.65, 'lo': -.6, 'ow': -.65}
word = 'afterglow'
for i, char in enumerate(word):
    glyph = glyphs[cmap[ord(char)]]
    glyph.draw(TransformPen(pen, (scale, 0, 0, -scale, x, 37)))
    x += glyph.width * scale
    if i < len(word) - 1: x += adjust.get(word[i:i+2], 0)

identity = {
    'name': 'Afterglow', 'wordmarkText': word,
    'wordmarkViewBox': [0, 0, round(x + 1, 2), 49],
    'wordmarkPath': pen.getCommands(),
    'markViewBox': [0, 0, 36, 36],
    'markPaths': [
        {'d': 'M7 28C2 19 5 8 13 3C20 10 18 21 7 28ZM7 28C8 15 19 7 29 11C28 21 19 28 7 28ZM7 28C16 20 27 20 33 26C27 33 15 33 7 28Z', 'strokeWidth': 1.5},
        {'d': 'M29 4.5a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0', 'fill': True}
    ],
    'typeface': 'Newsreader Display, optical size 72, weight 400; hand-spaced lowercase outlines.',
    'source': '../fonts/newsreader-display-latin.woff2',
    'license': '../fonts/NEWSREADER-OFL.txt'
}
Path('assets/brand').mkdir(exist_ok=True)
Path('assets/brand/identity.json').write_text(json.dumps(identity, indent=2) + '\n')
print(identity['wordmarkViewBox'])
