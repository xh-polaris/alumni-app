# alumni-app/dev

开发期辅助工具目录，**不会打进小程序包**（构建产物只包含 `src/` 下的资源）。

## cdp-check.py

用 headless Chrome + CDP 驱动 H5 页面做验证：注入会话、抓取 DOM/文本、截图、收集控制台报错。

```bash
# 触发页面上某个动作并回读状态
python3 dev/cdp-check.py http://localhost:5173/#/pages/mine/index --eval "document.body.innerText"
```

注意：Chrome 自身的 sandbox 在受限环境里起不来，启动参数需带
`--headless=new --no-sandbox --disable-gpu --disable-crash-reporter --crash-dumps-dir=/tmp --remote-allow-origins=*`；
窗口给宽一点（如 `--window-size=1680,1000`），否则管理端表格的操作列会落在视口外。

## 首页校舍线稿图的来历（脚本已删除，仅留记录）

首页 `src/components/BrandHero.vue` 用的是 `src/static/campus-gymnasium-outline.png`
（2172×724，透明底线条图，线色 `rgb(244,242,210)`）。生成过程：

1. 以宁波市北仑中学体育馆 + 钟楼实景照片为**形准依据**，抽线得到屋面长弧、
   右端悬挑尖角、幕墙竖梃与钟楼体量；
2. 但树叶和铺装会产生大量高频碎线，无法与结构线区分，因此按抽线量到的比例与
   构件数量**重画**一版干净的建筑线稿（保留屋面弧度、桁架斜撑数量、竖梃数量、钟面位置等可核对细节）；
3. 版式上只留建筑：去掉旗杆、行道树、操场、台阶、花坛、广场铺装与配楼，
   建筑自画面下缘升起，使主体更大、内容更少。

原照片、抽取的 SVG、过程预览图和三个生成脚本（`trace-lineart.py` /
`build-hero-art.py` / `preview-hero-art.py`）在定稿后已清理；若要重做，
工具链为 `python3 -m venv` + `pillow` + `opencv-python-headless` 自建
（本机没有 potrace / ImageMagick / Inkscape，且 Homebrew 前缀不可写）。
