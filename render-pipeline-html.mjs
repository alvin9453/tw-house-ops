// Dependency-free HTML presentation of existing evaluation reports.
// Usage: node render-pipeline-html.mjs YYYY-MM-DD [overview-filename.html]
import fs from 'node:fs';
import path from 'node:path';

const [date, requestedOverview = `pipeline-${date}.html`] = process.argv.slice(2);
if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? '') || path.basename(requestedOverview) !== requestedOverview || !requestedOverview.endsWith('.html')) {
  throw new Error('Usage: node render-pipeline-html.mjs YYYY-MM-DD [overview-filename.html]');
}
const outputDir = path.resolve('output');
function availableName(filename) {
  let candidate = filename;
  for (let version = 2; fs.existsSync(path.join(outputDir, candidate)); version++) {
    candidate = filename.replace(/\.html$/, `-${version}.html`);
  }
  return candidate;
}
const overview = availableName(requestedOverview);
const escape = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const external = (url, label) => `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(label)}</a>`;
function inline(text) {
  // Escape report content before adding markup; raw HTML is never executed.
  return text.split(/(https?:\/\/[^\s]+|\*\*[^*]+\*\*)/g).map(token => {
    if (/^https?:\/\//.test(token)) return external(token, token);
    if (token.startsWith('**') && token.endsWith('**')) return `<strong>${escape(token.slice(2,-2))}</strong>`;
    return escape(token);
  }).join('');
}
function markdown(text) {
  const lines = text.trim().split('\n');
  const blocks = [];
  for (let i = 0; i < lines.length;) {
    if (!lines[i].trim()) { i++; continue; }
    if (lines[i].startsWith('|')) {
      const rows = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        const cells = lines[i++].trim().slice(1,-1).split('|').map(v => v.trim());
        if (!cells.every(cell => /^:?-+:?$/.test(cell))) rows.push(cells);
      }
      const row = (cells, tag) => `<tr>${cells.map(cell => `<${tag}${tag === 'th' ? ' scope="col"' : ''}>${inline(cell)}</${tag}>`).join('')}</tr>`;
      blocks.push(`<div class="table-wrap" tabindex="0" role="region" aria-label="可橫向捲動的資料表"><table><thead>${row(rows[0], 'th')}</thead><tbody>${rows.slice(1).map(cells => row(cells, 'td')).join('')}</tbody></table></div>`);
    } else {
      const paragraph = [];
      while (i < lines.length && lines[i].trim() && !lines[i].startsWith('|')) paragraph.push(inline(lines[i++].trim()));
      blocks.push(`<p>${paragraph.join('<br>')}</p>`);
    }
  }
  return blocks.join('\n');
}
const sourceFiles = fs.readdirSync('reports').filter(name => /^\d{3}-/.test(name) && name.endsWith(`-${date}.md`)).sort();
if (!sourceFiles.length) throw new Error(`No reports found for ${date}`);
const reports = sourceFiles.map(file => {
  const md = fs.readFileSync(path.join('reports', file), 'utf8');
  const meta = label => md.match(new RegExp(`^\\*\\*${label}:\\*\\* (.+)$`, 'm'))?.[1].trim() ?? '';
  const field = label => md.split('\n').find(line => line.startsWith(`| ${label} |`))?.split('|')[2].trim() ?? '';
  const info = field('總價／坪數／格局');
  const title = md.split('\n')[0].replace(/^# /,'');
  const body = md.slice(md.indexOf('\n') + 1).split(/^## (.+)$/m);
  const sections = [{title:'基本資料與刊登驗證', body:body[0]}];
  for (let i = 1; i < body.length; i += 2) sections.push({title:body[i], body:body[i+1]});
  const score = Number.parseFloat(meta('Score'));
  const price = Number((info.match(/[\d,]+(?=萬)/)?.[0] ?? '0').replaceAll(',',''));
  const commute = md.match(/\| (?:捷運＋步行|F304接駁＋捷運＋步行) \| ([^|]+) \|/)?.[1].trim() ?? '待確認';
  const risk = sections.find(section => section.title === '疑點清單')?.body.split('\n').find(line => /^\| 1 \|/.test(line))?.split('|')[2].trim() ?? '詳見疑點清單';
  return {file, html:availableName(file.replace(/\.md$/,'.html')), id:file.slice(0,3), title, name:title.replace(/^\d+ \| /,''), info, score, price, commute, risk, url:meta('URL'), sections};
});

const css = `
:root{--bg:#f3f5ef;--paper:#fff;--ink:#193a32;--muted:#5c6c63;--line:#dce3d9;--green:#176653;--amber:#9c621b;--soft:#e9f0e5}*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:20px}body{margin:0;background:var(--bg);font:15px/1.7 -apple-system,BlinkMacSystemFont,"PingFang TC","Noto Sans TC","Microsoft JhengHei",sans-serif;color:var(--ink)}a{color:var(--green);text-underline-offset:4px;overflow-wrap:anywhere}button,input,select{font:inherit}button,a,input,select,summary{touch-action:manipulation}:focus-visible{outline:3px solid #b88640;outline-offset:4px}header{background:#163e32;color:#fff;border-bottom:4px solid #cfaf77;padding:32px max(22px,calc((100vw - 1120px)/2))}.eyebrow{font-size:11px;letter-spacing:.2em;color:#cddcc8}h1{font-size:clamp(26px,3.4vw,38px);line-height:1.35;margin:12px 0}header p{font-size:14px;color:#dae4d4;margin:8px 0}.header-top{display:flex;justify-content:space-between;align-items:center;gap:16px}header a{color:#e0eacc;font-size:13px}.tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}.tag{font-size:12px;border:1px solid #66836e;border-radius:30px;padding:4px 11px}main{max-width:1164px;margin:26px auto;padding:0 22px}.stats{display:flex;gap:28px;flex-wrap:wrap;border-bottom:1px solid var(--line);padding-bottom:20px;margin-bottom:20px}.stat b{font-size:26px;margin-right:9px}.stat span{font-size:13px;color:var(--muted)}.hint{font-size:13px;color:var(--muted);margin:12px 0 22px}.toolbar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:20px 0 8px}input,select,button,.button{border:1px solid #b9c6b5;border-radius:8px;background:#fff;padding:9px 12px;color:var(--ink)}input{min-width:180px;flex:1}label{font-size:13px}select{max-width:200px}button{cursor:pointer;font-size:13px}button:hover,.button:hover{background:var(--soft)}.button{text-decoration:none;font-size:13px;display:inline-block}.button.primary{background:var(--green);color:#fff;border-color:var(--green)}.count{font-size:12px;color:var(--muted);margin:12px 0}.listing{background:var(--paper);border:1px solid var(--line);border-radius:12px;margin-bottom:12px;overflow:hidden}.listing[open]{border-color:#8cae91;box-shadow:0 4px 18px #203b2a0a}.listing>summary{list-style:none;padding:20px 22px;display:grid;grid-template-columns:minmax(0,1fr) auto 30px;gap:18px;align-items:center;cursor:pointer}.listing>summary::-webkit-details-marker,.section>summary::-webkit-details-marker{display:none}.number{font-size:11px;color:var(--muted);letter-spacing:.06em}.listing h2{font-size:18px;line-height:1.5;margin:3px 0 7px}.facts{font-size:13px;color:var(--muted)}.price{font-weight:700;color:var(--ink);font-size:15px}.rating{text-align:center;min-width:85px}.rating b{font-size:23px;display:block;line-height:1.2}.rating span{display:block;font-size:11px;color:var(--muted)}.chevron{font-size:19px;transition:transform .15s;text-align:center}.listing[open]>summary .chevron{transform:rotate(180deg)}.listing-body{border-top:1px solid var(--line);padding:20px 22px 24px}.actions{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:18px}.notice{border-left:3px solid #c29852;background:#fcf8ee;padding:12px 15px;font-size:13px;margin-bottom:18px;color:#604519}.section{border:1px solid var(--line);border-radius:8px;margin:10px 0;background:#fff}.section>summary{list-style:none;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:20px;padding:13px 16px;font-size:14px;font-weight:650}.section>summary::after{content:'＋';color:var(--green);font-size:18px}.section[open]>summary{border-bottom:1px solid var(--line);background:#f5f8f1}.section[open]>summary::after{content:'−'}.section h2,.section h3{font:inherit;margin:0}.section-content{padding:4px 16px 12px;overflow-wrap:anywhere}.section-content p{font-size:14px;margin:15px 0}.table-wrap{overflow:auto;max-width:100%;margin:16px 0}table{border-collapse:collapse;width:100%;font-size:13px}th{text-align:left;background:#edf2e9;font-weight:650}td,th{border-bottom:1px solid var(--line);padding:10px 12px;vertical-align:top}thead{display:table-header-group}td:first-child{font-weight:500}tr:last-child td{border-bottom:0}.table-wrap table:has(th:nth-child(5)){min-width:620px}.report-head{background:#fff;border:1px solid var(--line);border-radius:12px;padding:22px;margin-bottom:20px}.report-head h2{margin:0 0 10px;font-size:22px}.score-line{font-size:13px;color:var(--muted)}.report-controls{display:flex;gap:10px;flex-wrap:wrap;margin:18px 0}.empty{padding:26px;text-align:center;color:var(--muted);border:1px dashed var(--line);border-radius:12px}footer{font-size:12px;color:var(--muted);padding:20px 0 30px}.references{margin-top:26px}.references a{margin-right:16px}[hidden]{display:none!important}
@media(max-width:650px){header{padding:25px 18px}main{padding:0 14px;margin-top:18px}.stats{gap:18px}.stat b{font-size:23px}.stat span{font-size:12px}.listing>summary{padding:16px;gap:10px;grid-template-columns:minmax(0,1fr) 64px 16px}.listing h2{font-size:16px}.facts{font-size:12px}.rating{min-width:0}.rating b{font-size:21px}.listing-body{padding:16px 12px}.section-content{padding:2px 12px 8px}.section-content p{font-size:13px}.toolbar input{flex-basis:100%;width:100%}.toolbar select{flex:1}.section>summary{padding:13px 12px}.header-top{align-items:flex-start;flex-wrap:wrap}.report-head{padding:18px}th,td{padding:9px;font-size:12px}}
@media print{body{background:#fff;color:#000}header{background:#fff;color:#193a32;border-bottom:1px solid #aaa;padding:0 0 12px}header p,.eyebrow{color:#333}main{max-width:none;margin:12px 0;padding:0}.toolbar,.report-controls,.actions,.chevron,.hint,.header-top a,.references,.rating span{display:none!important}.listing,.section,.report-head{border:0;border-radius:0;box-shadow:none}.listing{break-before:page}.listing>summary{padding:0 0 12px}.listing-body,.section-content{padding:0;border:0}.section>summary{padding:10px 0;background:none!important}.section>summary::after{display:none}.table-wrap{overflow:visible}table,.table-wrap table:has(th:nth-child(5)){min-width:0;font-size:10pt}th,td{padding:7px}tr{break-inside:avoid}summary{break-after:avoid}button{display:none}.tags{display:none}@page{size:A4;margin:15mm}}
`;
const js = `
const cards = [...document.querySelectorAll('.listing')];
const sections = [...document.querySelectorAll('.section')];
document.querySelectorAll('[data-expand]').forEach(button => button.addEventListener('click', () => {
  const open = button.dataset.expand === 'all';
  document.querySelectorAll('details').forEach(item => { if (!item.hidden) item.open = open; });
}));
const search = document.querySelector('#search'), filter = document.querySelector('#filter'), sort = document.querySelector('#sort');
function update() {
  const query = search.value.trim().toLocaleLowerCase();
  cards.forEach(card => { card.hidden = !(card.textContent.toLocaleLowerCase().includes(query) && (filter.value !== 'review' || Number(card.dataset.score) >= 3.5)); });
  const ordered = [...cards].sort((a,b) => sort.value === 'price' ? Number(a.dataset.price)-Number(b.dataset.price) : sort.value === 'score' ? Number(b.dataset.score)-Number(a.dataset.score) || a.id.localeCompare(b.id) : a.id.localeCompare(b.id));
  ordered.forEach(card => document.querySelector('#listings').append(card));
  const count = cards.filter(card => !card.hidden).length;
  document.querySelector('#result-count').textContent = '顯示 ' + count + ' / ' + cards.length + ' 個物件';
  document.querySelector('#empty').hidden = count > 0;
}
if(search) { search.addEventListener('input',update); filter.addEventListener('change',update); sort.addEventListener('change',update); }
function revealHash() {
  const target = document.getElementById(location.hash.slice(1));
  if (target && target.matches('details.listing')) { target.open = true; target.scrollIntoView({block:'start'}); }
}
window.addEventListener('hashchange',revealHash);
revealHash();
const printState = new Map();
function preparePrint() { document.querySelectorAll('details').forEach(item => { if(!printState.has(item)) printState.set(item,item.open); item.open = true; }); }
function restorePrint() { printState.forEach((open,item) => item.open = open); printState.clear(); }
window.addEventListener('beforeprint',preparePrint); window.addEventListener('afterprint',restorePrint);
document.querySelectorAll('[data-print]').forEach(button => button.addEventListener('click', () => window.print()));
// Printing always includes the full report, even if details are collapsed on screen.
`;
const shell = (title, body) => `<!doctype html><html lang="zh-Hant-TW"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title><style>${css}</style></head><body>${body}<script>${js}</script></body></html>`;
function sectionMarkup(section, index) {
  return `<details class="section"><summary><h3>${escape(String(index+1).padStart(2,'0'))}　${escape(section.title)}</h3></summary><div class="section-content">${markdown(section.body)}</div></details>`;
}
const dateNote = `<p>評估資料截至 ${date}；本次調整閱讀格式，沿用原評估數據。</p>`;
const controls = `<button type="button" data-expand="all">全部展開</button><button type="button" data-expand="none">全部收合</button><button type="button" data-print>列印 / 另存 PDF</button>`;
const sources = `<details class="section references"><summary>原評估參考連結</summary><div class="section-content"><p>${external('https://web.metro.taipei/pages2026/WebStation/127/8','台北捷運站間時間 ↗')} ${external('https://www.mof.gov.tw/singlehtml/384fb3077bb349ea973e7fc6f13b6974?cntId=2bc35b71dbd04bfaba2d2c88640042c4','財政部青安3.0說明 ↗')} ${external('https://market.591.com.tw/5888615/price','都廳大院成交資料 ↗')}</p></div></details>`;
const footer = `<footer>可離線閱讀與展開細節；原始刊登及參考來源需連網開啟。完整保留原報告的評分、試算假設與待確認事項。</footer>`;
const sectionsFor = report => report.sections.map(sectionMarkup).join('\n');
const actionsFor = report => `<div class="actions"><a class="button primary" href="${escape(report.html)}">開啟獨立完整報告 ↗</a>${external(report.url, '查看原始刊登 ↗')}</div>`;
const cards = reports.map(report => `<details class="listing" id="listing-${report.id}" data-score="${report.score}" data-price="${report.price}"><summary><div><span class="number">物件 ${report.id}</span><h2>${escape(report.name)}</h2><div class="facts"><span class="price">${report.price.toLocaleString('en-US')}萬</span>　${escape(report.info.replace(/^[^／]+／/,''))}<br>通勤 ${escape(report.commute)}</div></div><div class="rating"><b>${report.score.toFixed(1)}</b><span>/ 5</span><span class="rating-status">${report.score >= 3.5 ? '待審閱' : '低於門檻'}</span></div><span class="chevron" aria-hidden="true">⌄</span></summary><div class="listing-body">${actionsFor(report)}<p class="notice">優先確認：${escape(report.risk)}</p>${sectionsFor(report)}</div></details>`).join('\n');
const overviewBody = `<header><div class="eyebrow">TW HOUSE OPS / PIPELINE</div><h1>購屋評估總覽</h1>${dateNote}<div class="tags"><span class="tag">點擊物件展開</span><span class="tag">每個物件都有獨立報告</span><span class="tag">細節按主題收合</span></div></header><main><div class="stats"><div class="stat"><b>${reports.length}</b><span>完整評估</span></div><div class="stat"><b>${reports.filter(report => report.score >= 3.5).length}</b><span>達 3.5 分</span></div><div class="stat"><b>${reports.filter(report => report.score >= 4).length}</b><span>達 4.0 分</span></div></div><p class="hint">先比較總價、坪數與通勤；點開物件後，再展開價格、貸款、疑點等細項。評分不代表所有必要條件均已查證。</p><div class="toolbar"><input id="search" type="search" placeholder="搜尋路名、社區或報告內容" aria-label="搜尋物件"><label for="filter">篩選</label><select id="filter"><option value="all">全部物件</option><option value="review">評分至少 3.5</option></select><label for="sort">排序</label><select id="sort"><option value="id">原評估順序</option><option value="score">評分由高至低</option><option value="price">總價由低至高</option></select>${controls}</div><p class="count" id="result-count" role="status" aria-live="polite">顯示 ${reports.length} / ${reports.length} 個物件</p><div id="listings">${cards}</div><p class="empty" id="empty" hidden>沒有符合條件的物件，請調整搜尋或篩選。</p>${sources}${footer}</main>`;
const outputs = new Map([[overview, shell(`Pipeline 互動總覽｜${date}`, overviewBody)]]);
for (const report of reports) {
  const body = `<header><div class="header-top"><span class="eyebrow">TW HOUSE OPS / PROPERTY ${report.id}</span><a href="${escape(overview)}">← 回到本批總覽</a></div><h1>${escape(report.name)}</h1>${dateNote}<div class="tags"><span class="tag">${report.price.toLocaleString('en-US')}萬</span><span class="tag">${report.score.toFixed(1)} / 5</span><span class="tag">通勤 ${escape(report.commute)}</span></div></header><main><div class="report-head"><h2>${escape(report.title)}</h2><p class="score-line">${escape(report.info)}</p><div class="actions">${external(report.url,'查看原始刊登 ↗')}<a href="${escape(overview)}#listing-${report.id}">返回總覽中的此物件</a></div><p class="notice">優先確認：${escape(report.risk)}</p></div><div class="report-controls">${controls}</div><p class="hint">點擊章節名稱展開內容，也可以選擇「全部展開」。列印時會自動包含完整報告。</p>${sectionsFor(report)}${sources}${footer}</main>`;
  outputs.set(report.html, shell(`${report.title}｜完整評估`, body));
}
fs.mkdirSync(outputDir, {recursive:true});
// Never overwrite an earlier report. Choose another overview filename or archive first.
for (const file of outputs.keys()) if (fs.existsSync(path.join(outputDir,file))) throw new Error(`Output already exists: ${file}`);
for (const [file, content] of outputs) fs.writeFileSync(path.join(outputDir,file), content, {flag:'wx'});
console.log(`Created ${reports.length} individual HTML reports and overview: output/${overview}`);
