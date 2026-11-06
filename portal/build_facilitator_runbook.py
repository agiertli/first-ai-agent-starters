"""Render the shared runbook text. Requires reportlab, pypdf and a Unicode TTF font."""
from pathlib import Path
import argparse
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from pypdf import PdfReader
ROOT=Path(__file__).resolve().parent
parser=argparse.ArgumentParser(description='Build the Czech and English one-page facilitator guides.')
parser.add_argument('--font', type=Path, required=True, help='Unicode TrueType font, e.g. DejaVuSans.ttf')
args=parser.parse_args()
font=str(args.font)
pdfmetrics.registerFont(TTFont('Guide',font))
W,H=A4
import json
DATA=json.loads((ROOT/'workshop-content/runbook.json').read_text())
for lang,d in DATA.items():
 out=ROOT/'frontend/public/runbook'/f'facilitator-{lang}.pdf';out.parent.mkdir(parents=True,exist_ok=True)
 c=canvas.Canvas(str(out),pagesize=A4,invariant=1); c.setTitle(d['title']+' - Facilitator guide'); c.setAuthor('Anton Giertli')
 def para(text,x,y,width,size=8.3,color='#263248',leading=None):
  p=Paragraph(text,ParagraphStyle('p',fontName='Guide',fontSize=size,leading=leading or size*1.35,textColor=HexColor(color)))
  _,h=p.wrap(width,800); p.drawOn(c,x,y-h); return y-h
 c.setFillColor(HexColor('#182337')); c.rect(0,H-98,W,98,fill=1,stroke=0)
 para(d['sub'],28,H-23,W-56,8,'#c9c9ff');para(d['title'],28,H-43,W-56,24,'#ffffff')
 y=para(d['roles'],28,H-112,W-56,9.2)-9
 y=para(d['pre'],28,y,W-56,8.5)-13
 for i,(time,title,body) in enumerate(d['rows']):
  h=27
  if i in (6,7): c.setFillColor(HexColor('#e9e9ff'));c.roundRect(24,y-h+3,W-48,h,4,fill=1,stroke=0)
  para(time.replace('–','-'),29,y,57,8.5);para(title,90,y,140,8.3);para(body,234,y,W-262,8.2)
  y-=h
 y-=9
 for title,body in d['blocks']:
  y=para(title,28,y,W-56,9,'#4c3ba0')-4
  y=para(body,28,y,W-56,9.2)-10
 assert y>45,(lang,y)
 c.setStrokeColor(HexColor('#d9deea'));c.line(28,46,W-28,46)
 para('agiertli.github.io/first-ai-agent-starters  |  localhost:5173/workshop',28,38,W-56,7)
 para('Prezentace / Presentation  ·  Cvičení / Exercises  ·  Lektor / Facilitator',28,25,W-56,7)
 c.linkURL('https://github.com/agiertli/first-ai-agent-starters',(28,12,W-28,26),relative=0)
 c.save();assert len(PdfReader(out).pages)==1
 print(out,'one A4 page; content ends at',round(y))
