// 生成 tabBar 图标预览页：把 icon/ 里的图标内联成 base64，产出一个可独立打开的 HTML
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const iconDir = path.join(root, 'icon');

const tabs = [
  { text: '首页', color: '首页.png', gray: '首页灰.png' },
  { text: '匹配', color: '匹配.png', gray: '匹配灰.png' },
  { text: '联系', color: '联系人.png', gray: '联系人灰.png' },
  { text: '反馈', color: '反馈历史.png', gray: '反馈历史灰.png' },
  { text: '我的', color: '我的.png', gray: '我的灰.png' }
];

function toDataUrl(file) {
  const buf = fs.readFileSync(path.join(iconDir, file));
  return 'data:image/png;base64,' + buf.toString('base64');
}

const items = tabs.map(function (t) {
  return {
    text: t.text,
    color: toDataUrl(t.color),
    gray: toDataUrl(t.gray)
  };
});

// 一行 tabBar（selected 指定哪个高亮）
function tabBarHtml(selectedIndex) {
  return items.map(function (item, i) {
    const active = i === selectedIndex;
    return (
      '<div class="tab-item">' +
      '<img src="' + (active ? item.color : item.gray) + '" alt="">' +
      '<span class="' + (active ? 'on' : 'off') + '">' + item.text + '</span>' +
      '</div>'
    );
  }).join('');
}

const cellRows = items.map(function (item) {
  return (
    '<tr>' +
    '<td class="name">' + item.text + '</td>' +
    '<td><img class="cell" src="' + item.color + '"></td>' +
    '<td><img class="cell" src="' + item.gray + '"></td>' +
    '<td class="code">#1296DB</td>' +
    '<td class="code">#CDCDCD</td>' +
    '</tr>'
  );
}).join('');

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>导航栏图标预览</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 32px 24px 48px;
    font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
    background: #F2F4F7; color: #1F2329;
  }
  h1 { font-size: 20px; margin: 0 0 6px; }
  .sub { font-size: 13px; color: #6B7280; margin: 0 0 28px; }
  h2 { font-size: 15px; margin: 0 0 14px; color: #1F2329; }
  .row { display: flex; flex-wrap: wrap; gap: 24px; align-items: flex-start; }

  .phone {
    width: 320px; background: #fff; border-radius: 16px; overflow: hidden;
    box-shadow: 0 6px 24px rgba(16, 24, 40, .1);
  }
  .phone-body {
    height: 96px; display: flex; align-items: center; justify-content: center;
    background: linear-gradient(180deg, #FBFCFE 0%, #EFF3F9 100%);
    color: #9AA1AC; font-size: 12px; letter-spacing: .5px;
  }
  .tabbar {
    display: flex; background: #FFFFFF; border-top: 1px solid #E5E7EB;
    padding: 6px 0 8px;
  }
  .tab-item {
    flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px;
  }
  .tab-item img { width: 26px; height: 26px; display: block; }
  .tab-item span { font-size: 10px; line-height: 1; }
  .tab-item .on { color: #1296DB; }
  .tab-item .off { color: #999999; }

  .panel {
    background: #fff; border-radius: 16px; padding: 20px 22px;
    box-shadow: 0 6px 24px rgba(16, 24, 40, .1); flex: 1; min-width: 340px;
  }
  table { border-collapse: collapse; width: 100%; font-size: 13px; }
  th, td { padding: 10px 8px; text-align: left; border-bottom: 1px solid #EEF0F3; }
  th { font-size: 12px; color: #6B7280; font-weight: 500; }
  tr:last-child td { border-bottom: none; }
  .name { font-weight: 500; }
  .cell { width: 40px; height: 40px; display: block; }
  .code { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 12px; color: #6B7280; }
  .dot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-right: 6px; vertical-align: middle; }
</style>
</head>
<body>
  <h1>导航栏图标预览</h1>
  <p class="sub">左：选中态（有色）；右：未选中态（灰色）。图标 200×200 带透明通道，统一单色。</p>

  <h2>底栏整体效果</h2>
  <div class="row" style="margin-bottom:32px">
    <div class="phone">
      <div class="phone-body">页面内容</div>
      <div class="tabbar">${tabBarHtml(0)}</div>
    </div>
    <div class="phone">
      <div class="phone-body">页面内容</div>
      <div class="tabbar">${tabBarHtml(2)}</div>
    </div>
    <div class="phone">
      <div class="phone-body">页面内容</div>
      <div class="tabbar">${tabBarHtml(4)}</div>
    </div>
  </div>

  <div class="panel">
    <h2>逐个对照</h2>
    <table>
      <thead>
        <tr><th>tab</th><th>选中（有色）</th><th>未选中（灰）</th><th>色值</th><th>色值</th></tr>
      </thead>
      <tbody>${cellRows}</tbody>
    </table>
    <p class="sub" style="margin:18px 0 0">
      <span class="dot" style="background:#1296DB"></span>selectedColor #1296DB
      &nbsp;&nbsp;
      <span class="dot" style="background:#999999"></span>color #999999
    </p>
  </div>
</body>
</html>
`;

const out = path.join(root, 'icon-preview.html');
fs.writeFileSync(out, html, 'utf8');
console.log('已生成:', out, '（' + Math.round(html.length / 1024) + ' KB）');
