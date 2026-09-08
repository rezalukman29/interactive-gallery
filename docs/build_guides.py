"""Build bilingual gallery PDFs from the checked-in Markdown sources.

Requires: reportlab. For optional visual QA: pymupdf and pillow.
Run from any directory: python3 docs/build_guides.py [--qa]
Mermaid relationships are drawn as vector source/action/target rows.
"""

import argparse
import html
import re
import textwrap
from pathlib import Path

from reportlab.graphics.shapes import Drawing, Line, Polygon, Rect, String
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageTemplate, PageBreak, Paragraph,
    Preformatted, Spacer, Table, TableStyle,
)
from reportlab.platypus.tableofcontents import TableOfContents

ROOT = Path(__file__).resolve().parent.parent
WIDTH = 170 * mm
INK = colors.HexColor('#26221d')
GOLD = colors.HexColor('#966c37')
LINE = colors.HexColor('#ddd5c8')
PALE = colors.HexColor('#f5f1e8')


def fonts():
    # Embedded fonts keep code and Unicode readable in exported PDFs.
    mac = Path('/System/Library/Fonts/Supplemental')
    linux = Path('/usr/share/fonts/truetype/dejavu')
    paths = (
        [mac / 'Arial.ttf', mac / 'Arial Bold.ttf', mac / 'Courier New.ttf']
        if (mac / 'Arial.ttf').exists()
        else [linux / 'DejaVuSans.ttf', linux / 'DejaVuSans-Bold.ttf', linux / 'DejaVuSansMono.ttf']
    )
    for name, path in zip(['Body', 'Bold', 'Mono'], paths):
        pdfmetrics.registerFont(TTFont(name, str(path)))
    pdfmetrics.registerFontFamily('Body', normal='Body', bold='Bold', italic='Body', boldItalic='Bold')


def styles():
    body = ParagraphStyle('Body', fontName='Body', fontSize=9.5, leading=14,
                          textColor=INK, spaceAfter=6, allowWidows=0, allowOrphans=0)
    return {
        'body': body,
        'h1': ParagraphStyle('Chapter', parent=body, fontName='Bold', fontSize=16,
                             leading=20, spaceBefore=14, spaceAfter=9, keepWithNext=True),
        'h2': ParagraphStyle('Section', parent=body, fontName='Bold', fontSize=11,
                             leading=15, spaceBefore=10, spaceAfter=6, keepWithNext=True),
        'bullet': ParagraphStyle('Bullet', parent=body, leftIndent=15, bulletIndent=0, spaceAfter=3),
        'small': ParagraphStyle('Small', parent=body, fontSize=8, leading=11),
        'quote': ParagraphStyle('Quote', parent=body, backColor=PALE, borderPadding=8,
                                leftIndent=8, rightIndent=8, spaceBefore=7, spaceAfter=12),
        'code': ParagraphStyle('Code', fontName='Mono', fontSize=7.3, leading=10.2, textColor=INK),
        'toc': ParagraphStyle('Contents', parent=body, fontName='Bold', fontSize=23, leading=29),
    }


def inline(value):
    value = html.escape(value.strip())
    value = re.sub(r'`([^`]+)`', r'<font name="Mono" color="#805e33">\1</font>', value)
    value = re.sub(r'\*\*([^*]+)\*\*', r'<b>\1</b>', value)
    return value


class GuideDoc(BaseDocTemplate):
    def __init__(self, filename, title, language, version):
        super().__init__(str(filename), pagesize=A4, leftMargin=20*mm, rightMargin=20*mm,
                         topMargin=23*mm, bottomMargin=20*mm, title=f'{title} | {version}',
                         author='Ruang Imaji', subject=f'Gallery documentation {version} - {language}')
        self.label = language
        self.version = version
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height,
                      leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
        self.addPageTemplates(PageTemplate(id='guide', frames=[frame], onPage=self.decorate))

    def decorate(self, canvas, doc):
        canvas.saveState()
        canvas.setStrokeColor(LINE)
        canvas.setFillColor(GOLD)
        canvas.setFont('Body', 8)
        if doc.page > 1:
            canvas.drawString(20*mm, A4[1]-14*mm, 'RUANG IMAJI / INTERACTIVE GALLERY')
            canvas.drawRightString(A4[0]-20*mm, A4[1]-14*mm, self.label)
            canvas.line(20*mm, A4[1]-17*mm, A4[0]-20*mm, A4[1]-17*mm)
        canvas.line(20*mm, 14*mm, A4[0]-20*mm, 14*mm)
        canvas.drawString(20*mm, 9*mm, f'Documentation {self.version} / 08.09.2026')
        canvas.drawRightString(A4[0]-20*mm, 9*mm, str(doc.page))
        canvas.restoreState()

    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph) and flowable.style.name == 'Chapter':
            title = flowable.getPlainText()
            key = f'chapter-{self.seq.nextf("chapter")}'
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(title, key, level=0)
            self.notify('TOCEntry', (0, title, self.page, key))


def block_table(data, widths=None, header=False):
    table = Table(data, colWidths=widths or [WIDTH], repeatRows=1 if header else 0, hAlign='LEFT')
    settings = [
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BACKGROUND', (0, 0), (-1, -1), PALE),
        ('BOX', (0, 0), (-1, -1), .5, LINE),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
    ]
    if header:
        settings.extend([('BACKGROUND', (0, 0), (-1, 0), LINE),
                         ('INNERGRID', (0, 0), (-1, -1), .4, LINE)])
    table.setStyle(TableStyle(settings))
    table.spaceAfter = 9
    return table


def diagram(code, sty, lang):
    labels, edges = {}, []
    for raw in code.splitlines()[1:]:
        line = raw.strip()
        participant = re.fullmatch(r'participant\s+(\w+)(?:\s+as\s+(.+))?', line)
        if participant:
            labels[participant[1]] = participant[2] or participant[1]
            continue
        seq = re.fullmatch(r'(\w+)->>(\w+):\s*(.*)', line)
        if seq:
            edges.append((seq[1], seq[2], seq[3]))
            continue
        flow = re.fullmatch(r'(\w+)(?:\[([^\]]+)\])?\s*-->\s*(?:\|([^|]+)\|\s*)?(\w+)(?:\[([^\]]+)\])?(?::\s*(.*))?', line)
        if flow:
            source, slabel, action, target, tlabel, suffix = flow.groups()
            if slabel:
                labels[source] = slabel
            if tlabel:
                labels[target] = tlabel
            edges.append((source, target, action or suffix or ''))
    if not edges:
        raise ValueError(f'Unparsed Mermaid diagram: {code}')
    caption = ('Diagram hubungan: setiap baris menunjukkan satu arah alur; nama yang sama merujuk node yang sama.'
               if lang == 'id' else
               'Relationship diagram: each row shows a directed connection; repeated names refer to the same node.')
    rows = [[Paragraph(caption, sty['small'])]]
    for source, target, action in edges:
        drawing = Drawing(WIDTH-16, 40)
        box_width = 137
        right = WIDTH - 16 - box_width
        for x, name in [(0, labels.get(source, source)), (right, labels.get(target, target))]:
            drawing.add(Rect(x, 2, box_width, 35, rx=5, ry=5, fillColor=colors.white,
                             strokeColor=GOLD, strokeWidth=.65))
            lines = textwrap.wrap(name, width=27)
            if len(lines) > 3:
                raise ValueError(f'Diagram label too long: {name}')
            for index, text in enumerate(lines):
                drawing.add(String(x+box_width/2, 20+(len(lines)-1)*4-index*8, text,
                                   fontName='Bold', fontSize=7, textAnchor='middle', fillColor=INK))
        drawing.add(Line(box_width, 10, right, 10, strokeColor=GOLD, strokeWidth=.8))
        drawing.add(Polygon([right,10,right-5,13,right-5,7], fillColor=GOLD, strokeColor=None))
        lines = textwrap.wrap(action, width=32)
        for index, text in enumerate(lines):
            drawing.add(String((box_width+right)/2, 30-index*8, text, fontName='Body',
                               fontSize=6.8, textAnchor='middle', fillColor=INK))
        rows.append([drawing])
    table = block_table(rows, header=True)
    table.setStyle(TableStyle([
        ('TOPPADDING', (0, 1), (-1, -1), 1),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 1),
    ]))
    return table


def parse(path, sty, lang):
    text = path.read_text(encoding='utf-8')
    lines = text.splitlines()
    title = lines[0][2:]
    version = re.search(r'(?:Versi dokumentasi|Documentation version): ([\d.]+)', text)[1]
    start = lines.index('---') + 1
    subtitle = lines[2]
    intro = ' '.join(line.strip() for line in lines[4:start-1] if line.strip())
    result, paragraph = [], []

    def flush():
        if paragraph:
            result.append(Paragraph(inline(' '.join(paragraph)), sty['body']))
            paragraph.clear()

    i = start
    while i < len(lines):
        line = lines[i].strip()
        if line.startswith('```'):
            flush()
            language, code = line[3:], []
            i += 1
            while i < len(lines) and not lines[i].startswith('```'):
                code.append(lines[i])
                i += 1
            code = '\n'.join(code)
            if language == 'mermaid':
                result.append(diagram(code, sty, lang))
            else:
                wrapped = []
                for row in code.splitlines():
                    wrapped.extend(textwrap.wrap(row, width=96, subsequent_indent='    ',
                                                  replace_whitespace=False, drop_whitespace=False) or [''])
                # Label and code share a single row, so labels cannot orphan.
                content = [Paragraph(language.upper() or 'CODE', sty['small']),
                           Preformatted('\n'.join(wrapped), sty['code'])]
                result.append(block_table([[content]]))
        elif line.startswith('## '):
            flush()
            if line.startswith('## 28.'):
                result.append(PageBreak())
            result.append(Paragraph(inline(line[3:]), sty['h1']))
        elif line.startswith('### '):
            flush()
            result.append(Paragraph(inline(line[4:]), sty['h2']))
        elif line.startswith('|'):
            flush()
            rows = []
            while i < len(lines) and lines[i].startswith('|'):
                cells = [cell.strip() for cell in lines[i].strip('|').split('|')]
                if not all(re.fullmatch(r':?-{3,}:?', cell) for cell in cells):
                    rows.append([Paragraph(inline(cell), sty['small']) for cell in cells])
                i += 1
            result.append(block_table(rows, [WIDTH/len(rows[0])]*len(rows[0]), header=True))
            continue
        elif line.startswith('> '):
            flush()
            result.append(Paragraph(inline(line[2:]), sty['quote']))
        elif line.startswith('- ') or re.match(r'^\d+\. ', line):
            flush()
            match = re.match(r'^(\d+\.) (.*)', line)
            label, body = (match[1], match[2]) if match else ('•', line[2:])
            result.append(Paragraph(inline(body), sty['bullet'], bulletText=label))
        elif not line:
            flush()
        else:
            paragraph.append(line)
        i += 1
    flush()
    return title, subtitle, version, intro, result


def build(lang):
    sty = styles()
    title, subtitle, version, intro, content = parse(ROOT/'docs'/f'GALLERY-GUIDE.{lang}.md', sty, lang)
    label = 'Bahasa Indonesia' if lang == 'id' else 'English'
    toc = TableOfContents()
    toc.levelStyles = [ParagraphStyle('TOCEntry', fontName='Body', fontSize=8.5, leading=11,
                                     spaceBefore=0, textColor=INK)]
    cover_title = ParagraphStyle('Cover', fontName='Bold', fontSize=29, leading=35,
                                textColor=INK, spaceAfter=24)
    story = [
        Spacer(1, 35*mm), Paragraph('RUANG IMAJI / LEARNING GUIDE', sty['h2']),
        Paragraph(inline(title), cover_title), Paragraph(inline(subtitle), sty['body']),
        Spacer(1, 14*mm), Paragraph(f'VERSION {version} / {label}', sty['h2']),
        Paragraph(inline(intro), sty['quote']), PageBreak(),
        Paragraph('Daftar Isi' if lang == 'id' else 'Table of Contents', sty['toc']),
        Spacer(1, 12), toc, PageBreak(), *content,
    ]
    path = ROOT/'output/pdf'/f'interactive-gallery-guide.{lang}.pdf'
    path.parent.mkdir(parents=True, exist_ok=True)
    GuideDoc(path, title, label, version).multiBuild(story)
    print(path)
    return path


def qa(paths):
    import pymupdf
    from PIL import Image, ImageDraw
    target = ROOT/'tmp/pdfs/v1.1-review'
    target.mkdir(parents=True, exist_ok=True)
    for path in paths:
        doc = pymupdf.open(path)
        thumbs = []
        for index, page in enumerate(doc):
            pix = page.get_pixmap(matrix=pymupdf.Matrix(1.35, 1.35), alpha=False)
            pix.save(target/f'{path.stem}-page-{index+1:02d}.png')
            thumb = Image.frombytes('RGB', [pix.width, pix.height], pix.samples)
            thumb.thumbnail((298, 422))
            thumbs.append(thumb)
        for start in range(0, len(thumbs), 6):
            sheet = Image.new('RGB', (960, 900), '#d8d2c7')
            draw = ImageDraw.Draw(sheet)
            for j, thumb in enumerate(thumbs[start:start+6]):
                x, y = (j%3)*320+10, (j//3)*450+24
                sheet.paste(thumb, (x,y))
                draw.text((x,y-18), f'{path.stem} / {start+j+1}', fill='black')
            sheet.save(target/f'{path.stem}-sheet-{start//6+1}.png')
        print(f'{path.name}: {len(doc)} pages; QA at {target}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--qa', action='store_true')
    args = parser.parse_args()
    fonts()
    paths = [build(lang) for lang in ['id', 'en']]
    if args.qa:
        qa(paths)
