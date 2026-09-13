#!/usr/bin/env python3
"""按参考照片生成 BrandHero 的校园线稿 SVG（极简版）。

参考照片：`dev/reference/PT6A6031.jpg`（宁波市北仑中学 体育馆 + 钟楼 实景）。
比例来自照片测量；按版式要求**只保留建筑**：
去掉旗杆、行道树、台阶、花坛、绿篱、浮雕碑与广场铺装，建筑自画面下缘升起，
使主体更大、内容更少（参照用户提供的杭州学军中学首页：仅保留建筑轮廓线）。

  照片实测（占画面高）        本稿处理
  钟楼顶    0.41            y=150（最高体量，贯穿到画面下缘）
  左侧橙楼顶 0.52            y=300
  体育馆屋面 0.51~0.64       y=270~430（右高左低）
  右侧配楼  0.64            y=430
  建筑落地  0.82            不再画落地线，构件直接切到画布下缘 y=692

保留的可核对构件：
  圆柱钟楼：顶沿弧 + 7 道石板块材横缝 + 正面凹入方框钟面（双圈表盘 / 12 刻度 / 指针）
    + 右侧第二个钟面 + 竖向窄窗带；
  体育馆：细长浅弧屋面 + 檐下三角桁架斜撑 14 组 + 幕墙竖梃 11 根 + 1 道横梁
    + 右端悬挑与支撑柱；
  体量：左侧橙楼（两层方窗 + 一道腰线）、左侧低翼、橙色斜墙。
  已按要求删除：旗杆与旗面、行道树与街灯、台阶与坡式花坛与绿篱、浮雕碑、
  广场铺装与陶土轴线、右侧配楼（内容更少、主体更大）。

用法：
    .venv-lineart/bin/python dev/build-hero-art.py > /tmp/hero.svg
    .venv-lineart/bin/python dev/preview-hero-art.py /tmp/hero.svg /tmp/hero.png --viewport 694x400
然后把输出的 <svg> … </svg> 整段粘进 src/components/BrandHero.vue。
"""

from __future__ import annotations

import math

VIEWBOX_W, VIEWBOX_H = 1200, 692
BOTTOM = 692            # 画布下缘：建筑构件在此截断，不画落地线

L1 = 'stroke="rgba(148,197,47,0.62)" stroke-width="2.4"'
L2 = 'stroke="rgba(148,197,47,0.46)" stroke-width="1.5"'
L3 = 'stroke="rgba(255,255,255,0.34)" stroke-width="1.2"'
L4 = 'stroke="rgba(148,197,47,0.26)" stroke-width="1"'

TOWER_X0, TOWER_X1, TOWER_TOP = 495.0, 635.0, 150.0
BLOCK_X0, BLOCK_X1, BLOCK_TOP = 160.0, 495.0, 300.0
ROOF_X0, ROOF_X1 = 705.0, 1200.0
ROOF_Y0, ROOF_Y1 = 430.0, 270.0


def roof_y(x: float) -> float:
    """体育馆屋面上沿：自左向右抬升的浅弧。"""
    t = min(max((x - ROOF_X0) / (ROOF_X1 - ROOF_X0), 0.0), 1.0)
    return ROOF_Y0 + (ROOF_Y1 - ROOF_Y0) * t - 14.0 * math.sin(math.pi * t)


def truss_top(x: float) -> float:
    return roof_y(x) + 10.0


def truss_bottom(x: float) -> float:
    return roof_y(x) + 40.0


def p(d: str, *attrs: str) -> str:
    extra = (" " + " ".join(attrs)) if attrs else ""
    return f'          <path d="{d}"{extra} />'


def circle(cx: float, cy: float, r: float, *attrs: str) -> str:
    extra = (" " + " ".join(attrs)) if attrs else ""
    return f'          <circle cx="{cx:g}" cy="{cy:g}" r="{r:g}"{extra} />'


def build() -> str:
    g1: list[str] = []  # 体量主轮廓
    g2: list[str] = []  # 结构线
    g3: list[str] = []  # 细节高光
    g4: list[str] = []  # 极轻笔触

    # ---------------------------------------------------------------- 左侧橙色楼
    g1.append(p(f"M{BLOCK_X0:g} 312 L{BLOCK_X1:g} {BLOCK_TOP:g}"))
    g1.append(p(f"M{BLOCK_X0:g} 312 L{BLOCK_X0:g} {BOTTOM}"))
    g2.append(p(f"M{BLOCK_X0:g} 430 L{BLOCK_X1:g} 424"))
    for y in (348, 424):
        for x in (220, 310, 400):
            g2.append(p(f"M{x} {y} L{x + 52} {y} L{x + 52} {y + 38} L{x} {y + 38} Z"))
    # 左侧低翼，向画面外出血
    g1.append(p(f"M70 372 L{BLOCK_X0:g} 358"))
    g1.append(p(f"M70 372 L70 {BOTTOM}"))

    # ---------------------------------------------------------------- 圆柱形钟楼
    g1.append(p(f"M{TOWER_X0:g} {TOWER_TOP:g} L{TOWER_X0:g} {BOTTOM}"))
    g1.append(p(f"M{TOWER_X1:g} {TOWER_TOP:g} L{TOWER_X1:g} {BOTTOM}"))
    g1.append(p(f"M{TOWER_X0:g} {TOWER_TOP + 8:g} Q565 {TOWER_TOP - 12:g} {TOWER_X1:g} {TOWER_TOP + 8:g}"))
    for i in range(7):
        y = 212 + i * 48
        g2.append(p(f"M{TOWER_X0:g} {y} Q565 {y - 14} {TOWER_X1:g} {y}"))
    # 正面凹入方框钟面 + 右侧可见的第二个钟面（体现圆柱体量）
    g2.append(p("M510 186 L620 186 L620 286 L510 286 Z"))
    g2.append(p("M624 192 L635 198 L635 278 L624 284 Z"))
    g3.append(circle(565, 236, 32))
    g3.append(circle(565, 236, 24))
    for i in range(12):
        angle = math.radians(i * 30)
        g3.append(p(
            f"M{565 + 24 * math.sin(angle):.1f} {236 - 24 * math.cos(angle):.1f} "
            f"L{565 + 31 * math.sin(angle):.1f} {236 - 31 * math.cos(angle):.1f}"
        ))
    g3.append(p("M565 236 L552 225"))
    g3.append(p("M565 236 L580 216"))
    # 竖向窄窗带
    g2.append(p(f"M558 312 L572 312 L572 {BOTTOM} L558 {BOTTOM} Z"))
    for y in (352, 392, 432, 472, 512):
        g4.append(p(f"M558 {y} L572 {y}"))

    # ---------------------------------------------------------------- 橙色斜墙
    g1.append(p(f"M{TOWER_X1:g} 300 L715 382"))
    g1.append(p(f"M715 382 L715 {BOTTOM}"))
    g2.append(p(f"M674 342 L674 {BOTTOM}"))

    # ---------------------------------------------------------------- 体育馆
    g1.append(p(f"M{ROOF_X0:g} {roof_y(ROOF_X0):.1f} Q938 {roof_y(938) - 14:.1f} {ROOF_X1} {ROOF_Y1:g}"))
    g2.append(p(f"M{ROOF_X0:g} {truss_top(ROOF_X0):.1f} Q938 {truss_top(938) - 14:.1f} {ROOF_X1} {truss_top(ROOF_X1):.1f}"))
    g2.append(p(f"M{ROOF_X0:g} {truss_bottom(ROOF_X0):.1f} Q938 {truss_bottom(938) - 13:.1f} {ROOF_X1} {truss_bottom(ROOF_X1):.1f}"))
    step = (ROOF_X1 - ROOF_X0) / 13
    for i in range(13):
        x0 = ROOF_X0 + i * step
        x1 = x0 + step
        if i % 2 == 0:
            g2.append(p(f"M{x0:.1f} {truss_top(x0):.1f} L{x1:.1f} {truss_bottom(x1):.1f}"))
        else:
            g2.append(p(f"M{x0:.1f} {truss_bottom(x0):.1f} L{x1:.1f} {truss_top(x1):.1f}"))
    # 悬挑支撑柱与斜撑
    g1.append(p(f"M1150 {truss_bottom(1150):.1f} L1150 {BOTTOM}"))
    g3.append(p(f"M1150 {truss_bottom(1150):.1f} L1096 {truss_top(1096):.1f}"))
    # 玻璃幕墙竖梃与横梁
    for i in range(10):
        x = 800 + i * 42
        g2.append(p(f"M{x} {truss_bottom(x):.1f} L{x} {BOTTOM}"))
    g2.append(p(f"M796 560 L1196 560"))

    groups = (
        ("① 体量主轮廓", L1, g1),
        ("② 结构线", L2, g2),
        ("③ 细节高光", L3, g3),
        ("④ 极轻笔触", L4, g4),
    )
    out = [
        "<svg",
        '        class="brand-hero__svg"',
        f'        viewBox="0 0 {VIEWBOX_W} {VIEWBOX_H}"',
        '        preserveAspectRatio="xMidYMax slice"',
        '        fill="none"',
        '        xmlns="http://www.w3.org/2000/svg"',
        "      >",
    ]
    for label, stroke, items in groups:
        head, width = stroke.split(" stroke-width=")
        out.append(f"        <!-- {label} -->")
        out.append("        <g")
        out.append(f"          {head}")
        out.append(f"          stroke-width={width}")
        out.append('          stroke-linecap="round"')
        out.append('          stroke-linejoin="round"')
        out.append("        >")
        out.extend(items)
        out.append("        </g>")
    out.append("      </svg>")
    return "\n".join(out)


if __name__ == "__main__":
    print(build())
