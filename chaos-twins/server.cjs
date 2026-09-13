'use strict';
const http = require('node:http');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const names = ['index.html','styles.css','game.js','manifest.webmanifest','sw.js','icon.svg','icon-192.png','icon-512.png'];
const files = new Map(names.map(name => [name,fs.readFileSync(path.join(__dirname,'public',name))]));
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png'};
const assets = new Map([...files].map(([name,body]) => [name,{body,gzip:zlib.gzipSync(body),etag:'"'+crypto.createHash('sha256').update(body).digest('hex')+'"',type:types[path.extname(name)]}]));
const server = http.createServer((req,res) => {
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  if (req.method!=='GET' && req.method!=='HEAD') {res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return;}
  let pathname;
  try {pathname=new URL(req.url,'http://localhost').pathname;} catch {res.writeHead(400);res.end();return;}
  if (pathname==='/health') {
    res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
    res.end(req.method==='HEAD'?undefined:JSON.stringify({status:'ok',app:'Chaos Twins',version:'2.0.0'}));return;
  }
  const name=pathname==='/'?'index.html':pathname==='/favicon.ico'?'icon.svg':pathname.slice(1);
  const asset=assets.get(name);
  if (!asset) {res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end(req.method==='HEAD'?undefined:'No encontrado');return;}
  res.setHeader('Content-Type',asset.type);
  res.setHeader('Cache-Control','public, max-age=0, must-revalidate');
  res.setHeader('ETag',asset.etag);
  res.setHeader('Vary','Accept-Encoding');
  if (name==='sw.js') res.setHeader('Service-Worker-Allowed','/');
  if (req.headers['if-none-match']===asset.etag) {res.writeHead(304);res.end();return;}
  const compressed=/\bgzip\b(?!\s*;\s*q=0(?:\D|$))/.test(req.headers['accept-encoding']||'');
  const body=compressed?asset.gzip:asset.body;
  if (compressed) res.setHeader('Content-Encoding','gzip');
  res.setHeader('Content-Length',body.length);
  res.writeHead(200);res.end(req.method==='HEAD'?undefined:body);
});
server.requestTimeout=20000;server.headersTimeout=10000;server.keepAliveTimeout=5000;
const port=Number(process.env.PORT||8080);
if (!Number.isInteger(port) || port<1 || port>65535) throw new Error('Invalid PORT');
server.listen(port,'0.0.0.0',()=>console.log('Chaos Twins 2.0.0 listening on 0.0.0.0:'+port+'; '+assets.size+' assets loaded'));
function stop(){server.close(()=>process.exit(0));setTimeout(()=>process.exit(0),5000).unref();}
process.on('SIGTERM',stop);process.on('SIGINT',stop);
