// DuDuClaw Dashboard skin proxy（fork 前端供應版）
// - 供應「我們自己 build 的 fork 前端」(futureboss-fork .../dist)：index.html + /assets/*
//   → 內含原生新增的「Boss 設定」頁面/路由/選單項
// - 其餘請求（/ws 升級、/health、API…）轉發本機 gateway（沿用安裝的 v1.20.0）
// - 仍套用 skin.css 注入 + text-replace.json 文字替換 + 貓圖路由
//
// 用法：node proxy.js   然後瀏覽器開 http://localhost:18790
// 注意：改 skin.css / text-replace.json 即時生效；改 proxy.js 或重新 build 前端後請重啟本程式。

const http = require('http');
const net = require('net');
const fs = require('fs');
const path = require('path');

const UPSTREAM_HOST = process.env.DUDU_UPSTREAM_HOST || '127.0.0.1';
const UPSTREAM_PORT = Number(process.env.DUDU_UPSTREAM_PORT || 18789);
const LISTEN_PORT = Number(process.env.DUDU_SKIN_PORT || 18790);
const SKIN_PATH = path.join(__dirname, 'skin.css');
const REPLACE_PATH = path.join(__dirname, 'text-replace.json');
const DIST = path.join(__dirname, '..', 'futureboss-fork', 'crates', 'duduclaw-dashboard', 'dist');

function loadSkin() {
  try { return fs.readFileSync(SKIN_PATH, 'utf8'); }
  catch { return '/* skin.css 尚未建立 */'; }
}
function loadReplacements() {
  try { return JSON.parse(fs.readFileSync(REPLACE_PATH, 'utf8')); }
  catch { return []; }
}
function applyReplacements(text) {
  for (const { from, to } of loadReplacements()) {
    if (from) text = text.split(from).join(to);
  }
  return text;
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};
const mime = (p) => MIME[path.extname(p).toLowerCase()] || 'application/octet-stream';

function proxyToGateway(creq, cres) {
  const headers = Object.assign({}, creq.headers, {
    host: `${UPSTREAM_HOST}:${UPSTREAM_PORT}`,
  });
  const preq = http.request(
    { host: UPSTREAM_HOST, port: UPSTREAM_PORT, method: creq.method, path: creq.url, headers },
    (pres) => {
      cres.writeHead(pres.statusCode, pres.headers);
      pres.pipe(cres);
    }
  );
  preq.on('error', (e) => {
    cres.writeHead(502, { 'content-type': 'text/plain; charset=utf-8' });
    cres.end('skin proxy upstream error: ' + e.message);
  });
  creq.pipe(preq);
}

function serveIndexHtml(cres) {
  fs.readFile(path.join(DIST, 'index.html'), 'utf8', (err, html) => {
    if (err) {
      cres.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
      cres.end('fork dist/index.html 不存在 — 請先 build fork 前端');
      return;
    }
    html = applyReplacements(html);
    // 強制 light 為預設：bundle 為 type=module（deferred），會晚於 classic inline script，
    // 故先寫入 theme-store 的 localStorage key，使啟動時 storedTheme() 回傳 'light'。
    // proxy 自供的 HTML 不帶 CSP，inline script 可執行。
    const forceLight =
      `<script>try{localStorage.setItem('duduclaw-theme','light');` +
      `document.documentElement.classList.remove('dark');}catch(e){}</script>`;
    html = html.includes('</head>')
      ? html.replace('</head>', `${forceLight}\n</head>`)
      : forceLight + html;
    const style = `<style id="dudu-skin">\n${loadSkin()}\n</style>`;
    html = html.includes('</head>') ? html.replace('</head>', `${style}\n</head>`) : style + html;
    cres.writeHead(200, {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-cache',
      'content-length': Buffer.byteLength(html),
    });
    cres.end(html);
  });
}

const server = http.createServer((creq, cres) => {
  const pathname = creq.url.split('?')[0];

  // 貓圖（同源供應）
  const catMatch = pathname.match(/^\/dudu-(cat[a-z0-9-]*\.png)$/i);
  if (catMatch) {
    const file = path.join(__dirname, catMatch[1]);
    fs.readFile(file, (err, buf) => {
      if (err) { cres.writeHead(404); cres.end('cat not found'); return; }
      cres.writeHead(200, { 'content-type': 'image/png', 'cache-control': 'no-cache', 'content-length': buf.length });
      cres.end(buf);
    });
    return;
  }

  const accept = String(creq.headers['accept'] || '');
  // 後端 HTTP 路徑（轉發 gateway，不可當成前端路由）
  const isBackend = /^\/(api|health|healthz|metrics|mcp|ws)(\/|$)/.test(pathname);
  const hasExt = /\.[a-z0-9]+$/i.test(pathname);
  // 前端文件導覽：GET、非後端、(瀏覽器導覽帶 text/html 或 無副檔名的 SPA 路由如 /、/boss)
  const wantsHtml = creq.method === 'GET' && !isBackend && (accept.includes('text/html') || !hasExt);

  // SPA 文件導覽 → 供應 fork index.html（注入 skin + 文字替換）
  if (wantsHtml) {
    serveIndexHtml(cres);
    return;
  }

  // 前端打包資源 → 供應 fork dist（JS 套文字替換）；缺檔再退回 gateway
  if (pathname.startsWith('/assets/')) {
    const file = path.normalize(path.join(DIST, pathname));
    if (!file.startsWith(DIST)) { cres.writeHead(403); cres.end('forbidden'); return; }
    fs.readFile(file, (err, buf) => {
      if (err) { proxyToGateway(creq, cres); return; }
      let out = buf;
      if (file.endsWith('.js')) out = Buffer.from(applyReplacements(buf.toString('utf8')), 'utf8');
      cres.writeHead(200, { 'content-type': mime(file), 'cache-control': 'no-cache', 'content-length': out.length });
      cres.end(out);
    });
    return;
  }

  // 其餘（/health、API、其他）→ 轉發 gateway
  proxyToGateway(creq, cres);
});

// WebSocket / Upgrade → 轉發 gateway
server.on('upgrade', (req, socket, head) => {
  const upstream = net.connect(UPSTREAM_PORT, UPSTREAM_HOST, () => {
    let raw = `${req.method} ${req.url} HTTP/1.1\r\n`;
    const h = Object.assign({}, req.headers, { host: `${UPSTREAM_HOST}:${UPSTREAM_PORT}` });
    for (const [k, v] of Object.entries(h)) {
      raw += `${k}: ${Array.isArray(v) ? v.join(', ') : v}\r\n`;
    }
    raw += '\r\n';
    upstream.write(raw);
    if (head && head.length) upstream.write(head);
    socket.pipe(upstream);
    upstream.pipe(socket);
  });
  upstream.on('error', () => socket.destroy());
  socket.on('error', () => upstream.destroy());
});

server.listen(LISTEN_PORT, '127.0.0.1', () => {
  console.log(`[dudu-skin] proxy 已啟動（fork 前端供應版）`);
  console.log(`[dudu-skin]   套用版： http://localhost:${LISTEN_PORT}`);
  console.log(`[dudu-skin]   gateway： http://localhost:${UPSTREAM_PORT}`);
  console.log(`[dudu-skin]   dist：   ${DIST}`);
});
