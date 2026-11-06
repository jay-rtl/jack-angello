#!/usr/bin/env python3
"""Restore book-cover resolution only if a candidate matches the present cover."""
from PIL import Image, ImageOps, ImageStat
from io import BytesIO
from pathlib import Path
from urllib.request import Request, urlopen
import json, os, sys

ROOT = Path(__file__).resolve().parents[2]
CATALOG = {
  'black-power-white-cower-inc': '9781961227071',
  'minorities-inc': '9781961227354',
  'cashing-in-on-racial-color': '9781970617955'
}
USER_AGENT = 'Mozilla/5.0 (compatible; IslandAsylumCoverQuality/1.0)'
def fetch(url):
    try:
        req = Request(url, headers={'User-Agent': USER_AGENT, 'Accept': 'image/avif,image/webp,image/jpeg,image/png,*/*'})
        with urlopen(req, timeout=16) as response:
            data=response.read(7_000_000)
            if len(data)>6_000_000: return None
        im=Image.open(BytesIO(data))
        im.load()
        return im.convert('RGB')
    except Exception as ex:
        print('Candidate unavailable:', type(ex).__name__,url)
        return None

def match_score(original, candidate):
    """Normalized color difference + edge-layout similarity, on images after matching aspect."""
    from PIL import ImageChops, ImageFilter
    o=ImageOps.fit(original,(64,96),method=Image.Resampling.LANCZOS)
    c=ImageOps.fit(candidate,(64,96),method=Image.Resampling.LANCZOS)
    color=ImageStat.Stat(ImageChops.difference(o,c)).mean
    gray_o=o.convert('L').filter(ImageFilter.FIND_EDGES)
    gray_c=c.convert('L').filter(ImageFilter.FIND_EDGES)
    edges=ImageStat.Stat(ImageChops.difference(gray_o,gray_c)).mean[0]/255
    return sum(color)/(3*255)*0.7+edges*0.3

def candidates(isbn):
    i10={'9781961227071':'196122707X', '9781961227354':'1961227355', '9781970617955':'1970617950'}.get(isbn)
    urls=[
      f'https://prodimage.images-bn.com/pimages/{isbn}_p0_v1_s1500x1500.jpg',
      f'https://prodimage.images-bn.com/pimages/{isbn}_p0_v1_s1200x1200.jpg',
      f'https://images-us.bookshop.org/ingram/{isbn}.jpg?height=1400',
      f'https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg?default=false',
    ]
    if i10: urls.append(f'https://covers4.booksamillion.com/covers/bam/{i10[0]}/{i10[1:3]}/{i10[3:6]}/{i10}_b.jpg')
    return urls

def main():
    for slug,isbn in CATALOG.items():
        target=ROOT/'assets'/f'{slug}.webp'
        if not target.exists():
            print('Missing source:',target)
            continue
        src=Image.open(target).convert('RGB')
        possible=[]
        for url in candidates(isbn):
            candidate=fetch(url)
            if candidate is None:continue
            print(slug,'candidate',candidate.size,url)
            if candidate.width<500 or candidate.height<700:continue
            if abs(candidate.width/candidate.height-src.width/src.height)>0.11:continue
            score=match_score(src,candidate)
            print('  similarity distance:',round(score,4))
            if score<0.21: possible.append((candidate.width*candidate.height,-score,candidate,url))
        if not possible:
            print('NO VERIFIED HIGH RES MATCH:',slug)
            continue
        possible.sort(key=lambda row:(row[0],row[1]),reverse=True)
        _,_,image,url=possible[0]
        if image.width>1100:
            image.thumbnail((1100,1700),Image.Resampling.LANCZOS)
        tmp=target.with_name(target.stem+'.tmp.webp')
        image.save(tmp,'WEBP',quality=88,method=6)
        tmp.replace(target)
        print('RESTORED:',slug,image.size,target.stat().st_size,url)
if __name__=='__main__':main()
