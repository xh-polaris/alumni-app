#!/usr/bin/env python3
"""把 BrandHero 的 SVG 渲染成 Hero 实际显示效果的 PNG，用于人工核对。

本机没有可用的 SVG 渲染器（无 rsvg / inkscape / magick，qlmanage 被沙箱拦住），
所以用 Pillow 的 ImageDraw 自己画：只支持本组件用到的 path(M/L/Q/Z) 与 circle。

预览会**完整模拟 Hero 的显示过程**：
  1. 按 Hero 真实尺寸（默认 694×360rpx，对应 750rpx 屏宽减去 28rpx 内边距）建立视口；
  2. 套用 SVG 的 preserveAspectRatio="xMidYMax slice"（按需裁切、底部对齐）；
  3. 叠上 .brand-hero__copy 的深绿渐隐 scrim；
  4. 画出文案占位块，用来判断文字是否压住关键线条。

用法：
    .venv-lineart/bin/python dev/preview-hero-art.py /tmp/hero.svg /tmp/hero.png
    .venv-lineart/bin/python dev/preview-hero-art.py hero.svg out.png --viewport 694x360 --zoom 3
"""

from __future__ import annotations

import argparse
import math
import re
import xml.etree.ElementTree as ET

from PIL import Image, ImageDraw

BG = (21, 63, 50)
DEFAULT_VIEWPORT = (694, 360)
SCRIM = [(0.0, 0.94), (0.26, 0.70), (0.46, 0.18), (0.60, 0.0)]   # 与 .brand-hero__copy 的竖向渐变一致


def parse_colour(value: str) -> tuple[int, int, int, int]:
    nums = [float(v) for v in re.findall(r"[\d.]+", value)]
    if value.startswith("rgba") and len(nums) == 4:
        return int(nums[0]) if nums[0] > 1 else 148, int(nums[1]) if nums[0] > 1 else 197, \
               int(nums[2]) if nums[0] > 1 else 47, int(nums[3] * 255)
    if value.startswith("rgb") and len(nums) >= 3:
        return int(nums[0]), int(nums[1]), int(nums[2]), 255
    return 148, 197, 47, 255


def sample_quad(p0, c, p1, steps=28):
    return [
        (
            (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * c[0] + t * t * p1[0],
            (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * c[1] + t * t * p1[1],
        )
        for t in (i / steps for i in range(steps + 1))
    ]


def collect(svg_path: str):
    """收集 (kind, points, colour, width) 绘制指令，坐标仍是 SVG 用户单位。"""
    root = ET.parse(svg_path).getroot()
    ns = "{http://www.w3.org/2000/svg}"
    vb = [float(v) for v in root.get("viewBox").split()]
    par = root.get("preserveAspectRatio", "xMidYMid meet")
    ops: list[tuple] = []

    def walk(node, stroke, width):
        for child in node:
            tag = child.tag.replace(ns, "")
            g_stroke = child.get("stroke", stroke)
            g_width = float(child.get("stroke-width", width or 1))
            if tag == "g":
                walk(child, g_stroke, g_width)
            elif tag == "path":
                colour = parse_colour(g_stroke)
                cur = None
                for cmd, args in re.findall(r"([MLQZ])\s*([-\d\.\s,]*?)(?=[MLQZ]|$)", child.get("d")):
                    nums = [float(v) for v in re.findall(r"-?\d+\.?\d*", args)]
                    if cmd == "M" and len(nums) >= 2:
                        cur = (nums[0], nums[1])
                    elif cmd == "L":
                        for i in range(0, len(nums), 2):
                            nxt = (nums[i], nums[i + 1])
                            if cur:
                                ops.append(("line", [cur, nxt], colour, g_width))
                            cur = nxt
                    elif cmd == "Q" and len(nums) >= 4:
                        nxt = (nums[2], nums[3])
                        pts = sample_quad(cur or nxt, (nums[0], nums[1]), nxt)
                        ops.append(("poly", pts, colour, g_width))
                        cur = nxt
            elif tag == "circle":
                ops.append((
                    "circle",
                    [(float(child.get("cx")), float(child.get("cy")), float(child.get("r")))],
                    parse_colour(g_stroke),
                    g_width,
                ))

    walk(root, "rgb(148,197,47)", 1.0)
    return vb, par, ops


def render(svg_path: str, png_path: str, viewport: tuple[int, int], zoom: float) -> None:
    vb, par, ops = collect(svg_path)
    vx, vy, vw, vh = vb
    out_w, out_h = int(viewport[0] * zoom), int(viewport[1] * zoom)

    tokens = par.split()
    match = re.match(r"(xMin|xMid|xMax)(YMin|YMid|YMax)", tokens[0])
    if not match:
        raise ValueError(f"无法解析 preserveAspectRatio: {par}")
    align, yalign = match.group(1), match.group(2)
    mode = tokens[1] if len(tokens) > 1 else "meet"
    sx, sy = out_w / vw, out_h / vh
    scale = max(sx, sy) if mode == "slice" else min(sx, sy)
    draw_w, draw_h = vw * scale, vh * scale
    ox = {"xMin": 0.0, "xMid": (out_w - draw_w) / 2, "xMax": out_w - draw_w}[align]
    oy = {"YMin": 0.0, "YMid": (out_h - draw_h) / 2, "YMax": out_h - draw_h}[yalign]

    canvas = Image.new("RGBA", (out_w, out_h), BG + (255,))
    layer = Image.new("RGBA", (out_w, out_h), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)

    def tx(p):
        return ((p[0] - vx) * scale + ox, (p[1] - vy) * scale + oy)

    for kind, pts, colour, width in ops:
        w = max(1, round(width * scale))
        if kind == "line":
            d.line([*tx(pts[0]), *tx(pts[1])], fill=colour, width=w, joint="curve")
        elif kind == "poly":
            d.line([tx(p) for p in pts], fill=colour, width=w, joint="curve")
        else:
            cx, cy, r = pts[0]
            x0, y0 = tx((cx - r, cy - r))
            x1, y1 = tx((cx + r, cy + r))
            d.ellipse([x0, y0, x1, y1], outline=colour, width=w)

    canvas = Image.alpha_composite(canvas, layer)

    # scrim：与 .brand-hero__copy 的渐变一致
    scrim = Image.new("RGBA", (out_w, out_h), (0, 0, 0, 0))
    sd = ImageDraw.Draw(scrim)
    stops = [(int(p * out_h), a) for p, a in SCRIM]
    for y in range(out_h):
        alpha = 0
        for i in range(len(stops) - 1):
            y0, a0 = stops[i]
            y1, a1 = stops[i + 1]
            if y0 <= y <= y1:
                t = (y - y0) / max(1, y1 - y0)
                alpha = int(255 * (a0 + (a1 - a0) * t))
                break
        sd.line([0, y, out_w, y], fill=BG + (alpha,))
    canvas = Image.alpha_composite(canvas, scrim)

    # 文案占位：eyebrow 40%、title 34%、description 30%
    marks = ImageDraw.Draw(canvas)
    top = int(out_h * 0.09)
    for width_ratio, height, colour in ((0.40, 0.045, (255, 255, 255, 150)),
                                        (0.34, 0.12, (255, 255, 255, 220)),
                                        (0.30, 0.055, (255, 255, 255, 150))):
        marks.rectangle([int(out_w * 0.05), top, int(out_w * (0.05 + width_ratio)), top + int(out_h * height)],
                        fill=colour)
        top += int(out_h * height) + int(out_h * 0.04)

    canvas.convert("RGB").save(png_path)
    print(f"已渲染 {png_path}：视口 {viewport[0]}×{viewport[1]} @{zoom}x，scale={scale:.3f}，裁切 offset=({ox:.0f},{oy:.0f})")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("svg")
    ap.add_argument("png")
    ap.add_argument("--viewport", default="694x360")
    ap.add_argument("--zoom", type=float, default=2.5)
    a = ap.parse_args()
    vp = tuple(int(v) for v in a.viewport.lower().split("x"))
    render(a.svg, a.png, vp, a.zoom)
