#!/usr/bin/env python3
from PIL import Image, ImageOps, ImageChops, ImageStat
from io import BytesIO
import requests, subprocess
from pathlib import Path
from urllib.parse import urlparse
original=subprocess.check_output(['git','show','e4c3fbbcc020d5a4b235a25864cb5129979e4895:assets/cashing-in-on-racial-color.webp'])
ref=Image.open(BytesIO(original)).convert('RGB')
urls=[]
for size in (1200,1024,900,800,720,640,540,480,360,270):
 urls.append(f'https://cover.hoopladigital.com/csp_9781970617962_{size}.jpeg')
 urls.append(f'https://cover.hoopladigital.com/csp_9781970617955_{size}.jpeg')
urls.extend([
 'https://images-us.bookshop.org/ingram/9781970617962.jpg?height=1400',
 'https://images-us.bookshop.org/ingram/9781970617979.jpg?height=1400',
 'https://books.google.com/books/content?vid=ISBN9781970617962&printsec=frontcover&img=1&zoom=4'
])
matches=[]
for url in urls:
 try:
  r=requests.get(url,timeout=9,headers={'User-Agent':'Mozilla/5.0','Accept':'image/jpeg,image/webp,*/*'})
  if r.status_code!=200 or len(r.content)<2000:continue
  im=Image.open(BytesIO(r.content)).convert('RGB')
  im.load()
  if im.width<200 or im.height<290:continue
  a=ImageOps.fit(ref,(90,130),method=Image.Resampling.LANCZOS)
  b=ImageOps.fit(im,(90,130),method=Image.Resampling.LANCZOS)
  score=sum(ImageStat.Stat(ImageChops.difference(a,b)).mean)/(3*255)
  print('CANDIDATE',im.size,round(score,4),url)
  if score<.16:matches.append((im.width*im.height,-score,im,url))
 except Exception as ex:
  print('FAILED',type(ex).__name__,url)
if not matches:
 print('NO MATCH: reverting to original uploaded cover (smaller but authentic)')
 im=ref; url='verified historical GitHub cover'
else:
 matches.sort(key=lambda x:(x[0],x[1]),reverse=True)
 _,_,im,url=matches[0]
print('SELECTED',im.size,url)
im.save('assets/cashing-in-on-racial-color.webp',format='WEBP',quality=87,method=6)
