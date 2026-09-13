'use strict';
// Build the 512px installation icon from the original indexed 192px PNG.
// Uses only Node standard libraries; the game does not need this at runtime.
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const input = fs.readFileSync(path.join(__dirname,'public','icon-192.png'));
let width, height, palette, alpha = Buffer.alloc(256,255);
const idat = [];
for (let p=8; p<input.length;) {
  const n=input.readUInt32BE(p), type=input.toString('ascii',p+4,p+8), data=input.subarray(p+8,p+8+n);
  if(type==='IHDR') {
    width=data.readUInt32BE(0);height=data.readUInt32BE(4);
    if(data[8]!==4||data[9]!==3||data[12]!==0) throw new Error('Expected a non-interlaced 4-bit indexed PNG');
  } else if(type==='PLTE') palette=data;
  else if(type==='tRNS') data.copy(alpha);
  else if(type==='IDAT') idat.push(data);
  p+=n+12;
}
if(width!==192||height!==192||!palette) throw new Error('Unexpected source icon');
const packed=zlib.inflateSync(Buffer.concat(idat)), stride=Math.ceil(width/2), rows=Buffer.alloc(stride*height);
const paeth=(a,b,c)=>{const p=a+b-c,da=Math.abs(p-a),db=Math.abs(p-b),dc=Math.abs(p-c);return da<=db&&da<=dc?a:db<=dc?b:c;};
for(let y=0;y<height;y++) {
  const filter=packed[y*(stride+1)];
  if(filter>4) throw new Error('Unsupported PNG filter');
  for(let x=0;x<stride;x++) {
    const a=x?rows[y*stride+x-1]:0,b=y?rows[(y-1)*stride+x]:0,c=x&&y?rows[(y-1)*stride+x-1]:0;
    const prediction=[0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter];
    rows[y*stride+x]=(packed[y*(stride+1)+x+1]+prediction)&255;
  }
}
const rgba=Buffer.alloc(width*height*4);
for(let y=0;y<height;y++) for(let x=0;x<width;x++) {
  const v=rows[y*stride+(x>>1)],index=(x&1)?v&15:v>>4,p=(y*width+x)*4;
  for(let c=0;c<3;c++) rgba[p+c]=palette[index*3+c];
  rgba[p+3]=alpha[index];
}
const size=512,out=Buffer.alloc((size*4+1)*size);
for(let y=0;y<size;y++) for(let x=0;x<size;x++) {
  const fx=Math.max(0,Math.min(width-1,(x+.5)*width/size-.5)),fy=Math.max(0,Math.min(height-1,(y+.5)*height/size-.5));
  const x0=Math.floor(fx),y0=Math.floor(fy),x1=Math.min(width-1,x0+1),y1=Math.min(height-1,y0+1),tx=fx-x0,ty=fy-y0;
  for(let c=0;c<4;c++) {
    const a=rgba[(y0*width+x0)*4+c]*(1-tx)+rgba[(y0*width+x1)*4+c]*tx;
    const b=rgba[(y1*width+x0)*4+c]*(1-tx)+rgba[(y1*width+x1)*4+c]*tx;
    out[y*(size*4+1)+1+x*4+c]=Math.round(a*(1-ty)+b*ty);
  }
}
function crc32(buffer){let crc=0xffffffff;for(const b of buffer){crc^=b;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
function chunk(type,data){const tag=Buffer.from(type),out=Buffer.alloc(data.length+12);out.writeUInt32BE(data.length,0);tag.copy(out,4);data.copy(out,8);out.writeUInt32BE(crc32(Buffer.concat([tag,data])),data.length+8);return out;}
const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(size,0);ihdr.writeUInt32BE(size,4);ihdr[8]=8;ihdr[9]=6;
fs.writeFileSync(path.join(__dirname,'public','icon-512.png'),Buffer.concat([input.subarray(0,8),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(out,{level:9})),chunk('IEND',Buffer.alloc(0))]));
