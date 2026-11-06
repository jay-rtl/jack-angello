#!/usr/bin/env python3
from pathlib import Path
from io import BytesIO
import subprocess
import requests
from PIL import Image, ImageOps, ImageChops, ImageStat

ORIGINAL_COMMIT='e4c3fbbcc020d5a4b235a25864cb5129979e4895'
original=subprocess.check_output(['git','show',ORIGINAL_COMMIT+':assets/cashing-in-on-racial-color.webp'])
ref=Image.open(BytesIO(original)).convert('RGB')
base='https://cdn.kobo.com/book-images/5904af30-5f2f-4cb9-ba03-6060c13bfe09/{}/{}/90/False/cashing-in-on-racial-color.jpg'
best=None
for w,h in [(1600,2400),(1400,2200),(1100,1700),(900,1400),(600,900)]:
 url=base.format(w,h)
 try:
  response=requests.get(url,timeout=30,headers={'User-Agent':'Mozilla/5.0'})
  response.raise_for_status()
  image=Image.open(BytesIO(response.content)).convert('RGB')
  print('CANDIDATE',image.size,url)
  # Kobo supplies a full wrap (back + spine + front); only use its front.
  crop_w=round(image.height*588/868)
  if crop_w>=image.width: continue
  cover=image.crop((image.width-crop_w,0,image.width,image.height))
  a=ImageOps.fit(ref,(80,120),method=Image.Resampling.LANCZOS)
  b=ImageOps.fit(cover,(80,120),method=Image.Resampling.LANCZOS)
  dist=sum(ImageStat.Stat(ImageChops.difference(a,b)).mean)/(3*255)
  print('MATCH_DISTANCE',round(dist,4),'front',cover.size)
  if dist>.32 or cover.width<430:continue
  if not best or cover.width*cover.height>best.width*best.height:best=cover
 except Exception as exc:print('UNAVAILABLE',str(exc)[:140])
if best is None:
 print('No sufficiently matching high-resolution cover found; preserving existing asset')
else:
 best.thumbnail((950,1400),Image.Resampling.LANCZOS)
 dest=Path('assets/cashing-in-on-racial-color.webp')
 best.save(dest,'WEBP',quality=88,method=6)
 print('RESTORED',best.size,'bytes',dest.stat().st_size)
