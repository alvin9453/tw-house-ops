import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const script = path.resolve(import.meta.dirname, '../render-pipeline-html.mjs');
const date = '2026-01-02';
const reportName = `001-test-road-${date}.md`;
function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'house-html-'));
  fs.mkdirSync(path.join(dir, 'reports'));
  t.after(() => fs.rmSync(dir, {recursive:true, force:true}));
  return dir;
}
function run(dir, ...args) {
  return spawnSync(process.execPath, [script, ...args], {cwd:dir, encoding:'utf8'});
}
const report = `# 001 | 測試路 <script>unsafe()</script>

| 欄位 | 內容 |
|---|---|
| 總價／坪數／格局 | 1,200萬（含車位）／30坪／3房2廳2衛 |

**URL:** https://example.com/listing?id=1&source=test
**Score:** 3.7/5
**Type:** buy
**Status:** Evaluated
**Verification:** unconfirmed (fixture)

## 貸款試算

| 方案 | 月付 |
|---|---:|
| 方案一 | 30,000元 |

固定利率情境；不是核貸報價。

## 通勤試算

| 捷運＋步行 | 約25分鐘 | 測試估算 |

## 疑點清單

| # | 疑點 | 等級 |
|---|---|---|
| 1 | 車位權利待確認 | 高 |
`;

test('exports a standalone report and overview with escaped content and matching links', t => {
  const dir = fixture(t);
  fs.writeFileSync(path.join(dir,'reports',reportName),report);
  const result = run(dir,date);
  assert.equal(result.status,0,result.stderr);
  const htmlName = reportName.replace('.md','.html');
  const detail = fs.readFileSync(path.join(dir,'output',htmlName),'utf8');
  const overview = fs.readFileSync(path.join(dir,'output',`pipeline-${date}.html`),'utf8');
  for (const html of [detail,overview]) {
    assert.ok(html.includes('&lt;script&gt;unsafe()&lt;/script&gt;'));
    assert.ok(!html.includes('<script>unsafe()</script>'));
    assert.ok(html.includes('https://example.com/listing?id=1&amp;source=test'));
    assert.ok(html.includes('30,000元'));
    assert.ok(html.includes('固定利率情境；不是核貸報價。'));
    assert.ok(html.includes('unconfirmed (fixture)'));
    assert.ok(html.includes('車位權利待確認'));
    assert.ok(!/<details[^>]*\sopen(?:\s|>)/.test(html));
  }
  assert.ok(overview.includes(`href="${htmlName}"`));
  assert.ok(detail.includes(`href="pipeline-${date}.html#listing-001"`));
  assert.equal(fs.readFileSync(path.join(dir,'reports',reportName),'utf8'),report);
});

test('repeat exports preserve old files and link to newly numbered reports', t => {
  const dir = fixture(t);
  fs.writeFileSync(path.join(dir,'reports',reportName),report);
  assert.equal(run(dir,date).status,0);
  const old = fs.readFileSync(path.join(dir,'output',`pipeline-${date}.html`),'utf8');
  assert.equal(run(dir,date).status,0);
  const overview = fs.readFileSync(path.join(dir,'output',`pipeline-${date}-2.html`),'utf8');
  assert.ok(overview.includes(`href="001-test-road-${date}-2.html"`));
  const detail = fs.readFileSync(path.join(dir,'output',`001-test-road-${date}-2.html`),'utf8');
  assert.ok(detail.includes(`href="pipeline-${date}-2.html"`));
  assert.equal(fs.readFileSync(path.join(dir,'output',`pipeline-${date}.html`),'utf8'),old);
});

test('invalid output paths and missing reports fail without writing output', t => {
  const dir = fixture(t);
  assert.notEqual(run(dir,date,'../escape.html').status,0);
  assert.notEqual(run(dir,date).status,0);
  assert.notEqual(run(dir).status,0);
  assert.equal(fs.existsSync(path.join(dir,'output')),false);
});
