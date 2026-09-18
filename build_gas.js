#!/usr/bin/env node
/**
 * build_gas.js
 * ランダム風景アプリを Google Apps Script (GAS) 用に単一の HTML + Code.js にバンドルし、
 * src_gas/ ディレクトリに出力するビルドスクリプト
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const SRC_GAS_DIR = path.join(ROOT_DIR, 'src_gas');

console.log('🚀 GAS用バンドルビルドを開始します...');

// 1. 各ファイルの読み込み
const htmlPath = path.join(ROOT_DIR, 'index.html');
const cssPath = path.join(ROOT_DIR, 'style.css');
const locPath = path.join(ROOT_DIR, 'locations.js');
const appPath = path.join(ROOT_DIR, 'app.js');
const gsPath = path.join(ROOT_DIR, 'NotificationHub.gs');
const manifestPath = path.join(ROOT_DIR, 'appsscript.json');

if (!fs.existsSync(htmlPath) || !fs.existsSync(cssPath) || !fs.existsSync(locPath) || !fs.existsSync(appPath)) {
  console.error('❌ 必要なソースファイルが見つかりません。');
  process.exit(1);
}

let htmlContent = fs.readFileSync(htmlPath, 'utf8');
const cssContent = fs.readFileSync(cssPath, 'utf8');
const locContent = fs.readFileSync(locPath, 'utf8');
const appContent = fs.readFileSync(appPath, 'utf8');
const gsContent = fs.readFileSync(gsPath, 'utf8');
const manifestContent = fs.readFileSync(manifestPath, 'utf8');

// 2. 出力ディレクトリ作成
if (!fs.existsSync(SRC_GAS_DIR)) {
  fs.mkdirSync(SRC_GAS_DIR, { recursive: true });
}

// 3. HTML内の CSS / JS 参照をインライン展開
// CSSの置換
const cssTagRegex = /<link\s+rel=["']stylesheet["']\s+href=["']style\.css[^"']*["']\s*\/?>/i;
if (cssTagRegex.test(htmlContent)) {
  htmlContent = htmlContent.replace(cssTagRegex, `<style>\n${cssContent}\n</style>`);
  console.log('  ✅ style.css をインライン埋め込みしました');
} else {
  console.warn('  ⚠️ style.css の link タグが見つかりませんでした');
}

// locations.js の置換
const locTagRegex = /<script\s+src=["']locations\.js[^"']*["']><\/script>/i;
if (locTagRegex.test(htmlContent)) {
  htmlContent = htmlContent.replace(locTagRegex, `<script>\n${locContent}\n</script>`);
  console.log('  ✅ locations.js をインライン埋め込みしました');
} else {
  console.warn('  ⚠️ locations.js の script タグが見つかりませんでした');
}

// app.js の置換
const appTagRegex = /<script\s+src=["']app\.js[^"']*["']><\/script>/i;
if (appTagRegex.test(htmlContent)) {
  htmlContent = htmlContent.replace(appTagRegex, `<script>\n${appContent}\n</script>`);
  console.log('  ✅ app.js をインライン埋め込みしました');
} else {
  console.warn('  ⚠️ app.js の script タグが見つかりませんでした');
}

// 4. 出力ファイル保存
const targetHtml = path.join(SRC_GAS_DIR, 'index.html');
const targetCode = path.join(SRC_GAS_DIR, 'Code.js');
const targetManifest = path.join(SRC_GAS_DIR, 'appsscript.json');

fs.writeFileSync(targetHtml, htmlContent, 'utf8');
fs.writeFileSync(targetCode, gsContent, 'utf8');
fs.writeFileSync(targetManifest, manifestContent, 'utf8');

const htmlSizeKb = (fs.statSync(targetHtml).size / 1024).toFixed(1);
const codeSizeKb = (fs.statSync(targetCode).size / 1024).toFixed(1);

console.log(`✨ ビルド完了！`);
console.log(`  📁 出力先: ${SRC_GAS_DIR}`);
console.log(`     └─ index.html (${htmlSizeKb} KB) - 全画面UI + CSS + JS統合版`);
console.log(`     └─ Code.js (${codeSizeKb} KB) - サーバーサイド配信 & 通知ロジック`);
console.log(`     └─ appsscript.json`);
console.log(`👉 次は 'clasp push' を実行してデプロイできます！`);
