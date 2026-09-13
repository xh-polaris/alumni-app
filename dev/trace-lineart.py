#!/usr/bin/env python3
"""把校园照片转成品牌线稿 SVG（描边/剪影两种模式）。

为什么需要它：Hero 里的校园线稿要「贴合实际建筑细节」，靠手画很难保证形准；
先用照片抽出建筑线条，再据此整理成线稿，是可控且可复现的做法。

为什么不用 potrace / ImageMagick：本机 Homebrew 前缀不可写（`brew install potrace` 需要 sudo），
没有预装 potrace / mkbitmap / magick / inkscape。因此这里用纯 Python 方案：
Pillow 负责解码与缩放，OpenCV 负责去噪、CLAHE、Canny、形态学与轮廓提取。

依赖（一次性创建虚拟环境，不污染系统 Python）：
    python3 -m venv .venv-lineart
    .venv-lineart/bin/pip install pillow opencv-python-headless

用法示例：
    # ① 直接对整张照片抽线稿
    .venv-lineart/bin/python trace-lineart.py photo.jpg -o out.svg

    # ② 只取画面上部 20%~62% 的一条横带（做 Hero 天际线常用）
    .venv-lineart/bin/python trace-lineart.py photo.jpg -o skyline.svg --band 0.20,0.62

    # ③ 先看效果再决定参数（终端字符预览，不需要浏览器）
    .venv-lineart/bin/python trace-lineart.py photo.jpg --preview

    # ④ 重噪（树叶、砖墙）时加大去噪与最短轮廓过滤
    .venv-lineart/bin/python trace-lineart.py photo.jpg -o out.svg --blur 7 --min-area 90

HEIC 输入先用系统自带 sips 转一次：
    sips -s format png photo.heic --out photo.png
"""

from __future__ import annotations

import argparse
import sys

import cv2
import numpy as np
from PIL import Image, ImageOps


def load_gray(path: str, width: int, band: tuple[float, float] | None) -> np.ndarray:
    """读取照片并转成指定工作宽度的灰度图；band 为纵向裁剪比例。"""
    image = ImageOps.exif_transpose(Image.open(path)).convert("RGB")
    if band is not None:
        top, bottom = band
        height = image.height
        image = image.crop((0, int(height * top), image.width, int(height * bottom)))
    if image.width > width:
        ratio = width / image.width
        image = image.resize((width, max(1, int(image.height * ratio))), Image.LANCZOS)
    return cv2.cvtColor(np.asarray(image), cv2.COLOR_RGB2GRAY)


def normalize(gray: np.ndarray) -> np.ndarray:
    """CLAHE 局部对比度均衡：逆光或阴天照片也能拉出稳定的边缘。"""
    clahe = cv2.createCLAHE(clipLimit=2.4, tileGridSize=(8, 8))
    return clahe.apply(gray)


def extract_edges(gray: np.ndarray, blur: int, low: int | None, high: int | None) -> np.ndarray:
    """去噪后做 Canny 边缘检测，输出单通道 0/255 掩膜。"""
    denoised = cv2.bilateralFilter(gray, 9, 42, 42)
    if blur >= 3:
        kernel = blur if blur % 2 == 1 else blur + 1
        denoised = cv2.medianBlur(denoised, kernel)
        denoised = cv2.GaussianBlur(denoised, (kernel, kernel), 0)
    if low is None or high is None:
        # 用中位数自动定阈值，避免每张照片都要手调
        median = float(np.median(denoised))
        low = int(max(0, 0.62 * median))
        high = int(min(255, 1.55 * median))
    edges = cv2.Canny(denoised, low, high, L2gradient=True)
    # 闭运算把断掉的建筑轮廓接起来，避免线稿碎成一堆短线段
    edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    return edges


def extract_ink(gray: np.ndarray, blur: int, block: int, offset: int) -> np.ndarray:
    """自适应阈值提取「墨块」（深色结构），适合明亮天空下拍建筑的照片。"""
    denoised = cv2.bilateralFilter(gray, 9, 42, 42)
    if blur >= 3:
        kernel = blur if blur % 2 == 1 else blur + 1
        denoised = cv2.GaussianBlur(denoised, (kernel, kernel), 0)
    return cv2.adaptiveThreshold(
        denoised, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY_INV, block, offset
    )


def contours_to_path(mask: np.ndarray, epsilon: float, min_area: float) -> tuple[str, int]:
    """把掩膜转成 SVG path 的 d 属性；用 evenodd 让孔洞自然镂空。"""
    contours, _ = cv2.findContours(mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)
    pieces: list[str] = []
    kept = 0
    for contour in contours:
        if cv2.contourArea(contour) < min_area and len(contour) < 6:
            continue
        approx = cv2.approxPolyDP(contour, epsilon, True)
        if len(approx) < 3:
            continue
        points = approx.reshape(-1, 2)
        kept += 1
        # 保留一位小数，SVG 体积能小一半而肉眼看不出差别
        body = " ".join(
            ("M" if index == 0 else "L") + f"{point[0] / 1:.1f} {point[1] / 1:.1f}"
            for index, point in enumerate(points)
        )
        pieces.append(body + "Z")
    return " ".join(pieces), kept


def ascii_preview(mask: np.ndarray, columns: int = 108) -> str:
    """把结果渲染成字符画，便于在终端快速判断抽线是否抓到建筑。"""
    height, width = mask.shape
    rows = max(1, int(columns * height / width * 0.5))
    small = cv2.resize(mask, (columns, rows), interpolation=cv2.INTER_AREA)
    chars = " .:-=+*#%@"
    lines = []
    for row in small:
        lines.append(
            "".join(
                chars[min(len(chars) - 1, int(value) * len(chars) // 256)] for value in row
            )
        )
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="照片 → 品牌线稿 SVG")
    parser.add_argument("input", help="输入照片路径（HEIC 请先用 sips 转成 png）")
    parser.add_argument("-o", "--output", help="输出 SVG 路径；省略时只做预览")
    parser.add_argument("--mode", choices=["edge", "ink"], default="edge",
                        help="edge=Canny 线稿（默认）；ink=自适应阈值墨块")
    parser.add_argument("--width", type=int, default=1400, help="工作宽度，默认 1400")
    parser.add_argument("--band", help="纵向裁剪比例，如 0.20,0.62")
    parser.add_argument("--blur", type=int, default=5, help="去噪核大小，默认 5；噪点多可加到 7~9")
    parser.add_argument("--low", type=int, help="Canny 低阈值（默认自动）")
    parser.add_argument("--high", type=int, help="Canny 高阈值（默认自动）")
    parser.add_argument("--block", type=int, default=21, help="ink 模式自适应阈值窗口，默认 21")
    parser.add_argument("--offset", type=int, default=9, help="ink 模式阈值偏移，默认 9")
    parser.add_argument("--epsilon", type=float, default=1.1, help="轮廓简化强度，默认 1.1；越大越概括")
    parser.add_argument("--min-area", type=float, default=28.0, help="最小轮廓面积，过滤碎点")
    parser.add_argument("--color", default="#94c52f", help="线条颜色，默认品牌青柠 #94c52f")
    parser.add_argument("--opacity", type=float, default=0.85, help="线条不透明度，默认 0.85")
    parser.add_argument("--preview", action="store_true", help="在终端输出字符预览")
    args = parser.parse_args()

    band = None
    if args.band:
        top, bottom = (float(value) for value in args.band.split(","))
        band = (top, bottom)

    gray = load_gray(args.input, args.width, band)
    gray = normalize(gray)
    if args.mode == "edge":
        mask = extract_edges(gray, args.blur, args.low, args.high)
    else:
        mask = extract_ink(gray, args.blur, args.block, args.offset)

    if args.preview or not args.output:
        print(ascii_preview(mask), file=sys.stderr)

    if not args.output:
        return 0

    height, width = mask.shape
    path, kept = contours_to_path(mask, args.epsilon, args.min_area)
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" '
        f'width="{width}" height="{height}" fill="none">\n'
        f'  <path d="{path}" fill="{args.color}" fill-opacity="{args.opacity}" '
        f'fill-rule="evenodd" clip-rule="evenodd"/>\n'
        f"</svg>\n"
    )
    with open(args.output, "w", encoding="utf-8") as handle:
        handle.write(svg)
    print(f"已写入 {args.output}：{width}×{height}，{kept} 条轮廓，{len(svg) / 1024:.1f} KB", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
