# 校园建筑参考照片与线稿工具

## 本目录内容

| 文件 | 说明 |
| --- | --- |
| `PT6A6031.jpg` | 参考照片：宁波市北仑中学 **体育馆 + 钟楼** 实景（1280×853） |
| `trace-skyline.svg` | 用 `dev/trace-lineart.py` 从照片直接抽出建筑线的结果（119 条轮廓） |
| `preview-1-traced-from-photo.png` | 上面这个原始抽线结果，按 Hero 尺寸预览 |
| `preview-2-drawn-hero-art.png` | 最终 Hero 线稿预览（即组件里实际使用的那版，只保留建筑） |

两张预览都是 `dev/preview-hero-art.py` 渲染的近似效果（模拟 Hero 真实尺寸的 `slice` 裁切
与文案 scrim，并画出文案占位块），用于核对构图；真实渲染以小程序 / H5 页面为准。

## 为什么不用自动抽线直接上线

原始抽线（`preview-1`）能准确还原屋面长弧、右端悬挑尖角、幕墙竖梃与钟楼体量，
但树丛和铺装会产生大量碎线（树叶的高频纹理无法与结构线区分）。因此流程是：

1. `trace-lineart.py` 抽出真实线条，作为**形准依据**；
2. 按这些比例与构件数量，用 `build-hero-art.py` 重画一版**干净的建筑线稿**（`preview-2`）——
   保留屋面弧度、桁架斜撑数量、竖梃数量、钟面位置等可核对的细节，去掉树叶与铺装噪声；
3. 版式上进一步只留建筑：去掉旗杆、行道树、台阶、花坛、广场铺装与配楼，
   建筑自画面下缘升起，使主体更大、内容更少。

## 工具

依赖（一次即可，不污染系统 Python）：

```bash
python3 -m venv .venv-lineart
.venv-lineart/bin/pip install pillow opencv-python-headless
```

三个脚本：

```bash
# 1) 照片 → 原始线稿（--band 截取建筑横带，--preview 在终端看字符预览）
.venv-lineart/bin/python dev/trace-lineart.py dev/reference/PT6A6031.jpg \
    -o dev/reference/trace-skyline.svg --band 0.34,0.86 --width 1400 --blur 5 --min-area 40

# 2) 按实测比例生成 Hero 线稿（改完把输出整段粘进 src/components/BrandHero.vue）
.venv-lineart/bin/python dev/build-hero-art.py > /tmp/hero.svg

# 3) 按 Hero 真实尺寸预览（模拟 slice 裁切 + 文案 scrim + 文案占位块）
.venv-lineart/bin/python dev/preview-hero-art.py /tmp/hero.svg /tmp/hero-view.png --viewport 694x400
```

本机没有 potrace / ImageMagick / Inkscape，且 Homebrew 前缀不可写（`brew install` 需要 sudo），
所以工具链用 Pillow + OpenCV 自建。若以后想用 potrace，可 `sudo chown -R $(whoami) /opt/homebrew`
后 `brew install potrace`，`mkbitmap + potrace` 是同类流程的经典组合。

本目录的照片与预览图仅供绘制参考，不会打进小程序包（构建产物只包含 `src/` 下的资源）。
