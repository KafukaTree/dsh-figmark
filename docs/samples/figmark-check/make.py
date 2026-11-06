"""Draw one representative scientific figure in four formats.

Run: python3 -I docs/samples/figmark-check/make.py
Writes beside this script: the PNG, two SVGs, and a three-page PDF. The HTML
fixture is hand-written and lives here too, so all five samples share a theme.
"""
from __future__ import annotations

from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.backends.backend_pdf import PdfPages
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch

OUT = Path(__file__).resolve().parent
OUT.mkdir(parents=True, exist_ok=True)
plt.rcParams.update({
    "font.family": "DejaVu Sans",
    "font.size": 10,
    "axes.spines.top": False,
    "axes.spines.right": False,
    "svg.fonttype": "none",
})

t = np.linspace(0, 8, 400)


def decay(tau: float) -> np.ndarray:
    return 100 * np.exp(-t / tau)


def panel_figure() -> plt.Figure:
    fig, (ax, bx) = plt.subplots(1, 2, figsize=(13, 5.2), gridspec_kw={"width_ratios": [1.45, 1]})

    for tau, colour, label in [(1.0, "#1971c2", "tau = 1.0"), (2.0, "#e8590c", "tau = 2.0"), (3.5, "#2f9e44", "tau = 3.5")]:
        ax.plot(t, decay(tau), color=colour, lw=2.2, label=label)
        ax.plot([tau], [100 * np.exp(-1)], "o", color=colour, ms=5, mec="white", mew=1.2)

    ax.axhline(20, color="#868e96", lw=1.0, ls=(0, (5, 4)))
    ax.text(7.9, 22, "detection floor", ha="right", va="bottom", fontsize=8.5, color="#868e96")
    ax.set_xlabel("Time (s)")
    ax.set_ylabel("Normalized intensity (%)")
    ax.set_xlim(0, 8.2)
    ax.set_ylim(0, 108)
    ax.set_title("(a) Decay of the sleeve signal", loc="left", fontsize=11)
    ax.annotate("tau = 2.0", xy=(2.0, 100 * np.exp(-1)), xytext=(3.1, 68),
                fontsize=9, color="#e8590c",
                arrowprops={"arrowstyle": "->", "color": "#e8590c", "lw": 1.1})
    ax.legend(frameon=False, loc="upper right", fontsize=9)

    labels = ["A", "B", "C", "D", "E"]
    values = [42, 57, 61, 48, 53]
    errors = [3.2, 4.1, 3.6, 2.8, 4.4]
    bars = bx.bar(labels, values, yerr=errors, capsize=4,
                  color=["#1971c2", "#e8590c", "#2f9e44", "#f08c00", "#7048e8"],
                  edgecolor="white", linewidth=1.2, error_kw={"elinewidth": 1.0, "ecolor": "#495057"})
    bx.set_ylabel("Response (a.u.)")
    bx.set_ylim(0, 72)
    bx.set_title("(b) Five sleeves, same load", loc="left", fontsize=11)
    bx.bar_label(bars, padding=2, fontsize=8.5)

    fig.suptitle("Thermal drift of sleeve 34", fontsize=14, x=0.07, ha="left")
    fig.tight_layout(rect=(0, 0, 1, 0.94))
    return fig


def schematic_figure() -> plt.Figure:
    fig, ax = plt.subplots(figsize=(13, 5.2))
    ax.set_xlim(0, 13)
    ax.set_ylim(0, 5.2)
    ax.axis("off")

    boxes = [
        (0.8, 2.0, 3.0, 1.2, "sensor array", "#e7f5ff", "#1971c2"),
        (5.0, 2.0, 3.0, 1.2, "sleeve 34", "#fff4e6", "#e8590c"),
        (9.2, 2.0, 3.0, 1.2, "controller", "#ebfbee", "#2f9e44"),
    ]
    for x, y, w, h, label, face, edge in boxes:
        ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.02,rounding_size=0.18",
                                    facecolor=face, edgecolor=edge, linewidth=1.6))
        ax.text(x + w / 2, y + h / 2, label, ha="center", va="center", fontsize=11, color=edge)

    for x0, x1 in [(3.95, 4.9), (8.1, 9.1)]:
        ax.add_patch(FancyArrowPatch((x0, 2.6), (x1, 2.6), arrowstyle="->", mutation_scale=16,
                                     linewidth=1.4, color="#495057"))
    ax.text(4.45, 2.9, "I(t)", ha="center", fontsize=9, color="#495057")
    ax.text(8.6, 2.9, "u(t)", ha="center", fontsize=9, color="#495057")

    ax.plot([0.9, 3.7], [0.9, 0.9], color="#1971c2", lw=2)
    for x in np.linspace(0.9, 3.7, 8):
        ax.plot([x, x], [0.85, 0.95], color="#1971c2", lw=1)
    ax.text(2.3, 0.55, "sampling window", ha="center", fontsize=9, color="#1971c2")

    ax.annotate("watch this joint", xy=(6.5, 3.2), xytext=(6.3, 4.45),
                fontsize=9, color="#c92a2a",
                arrowprops={"arrowstyle": "->", "color": "#c92a2a", "lw": 1.2})
    ax.text(0.8, 4.7, "(a) Signal path through the test rig", fontsize=11, ha="left")
    fig.tight_layout()
    return fig


def text_page() -> plt.Figure:
    fig = plt.figure(figsize=(8.27, 11.69))
    fig.text(0.1, 0.94, "Notes on the sleeve-34 run", fontsize=17, weight="bold", ha="left")
    paragraphs = [
        "Three decay rates were fitted to the recorded signal. The 2.0 s",
        "trace sits closest to the manufacturer's curve; the 3.5 s trace",
        "flattens after 6 s and is treated as an outlier.",
        "",
        "The detection floor was fixed at 20 % of the initial amplitude,",
        "which is where the dashed rule crosses the two slower traces.",
        "",
        "Rows marked with a dagger were re-measured after the joint was",
        "re-seated; their error bars come from five repeats.",
    ]
    y = 0.88
    for line in paragraphs:
        fig.text(0.1, y, line, fontsize=11, ha="left")
        y -= 0.035
    fig.text(0.1, 0.60, "Run log", fontsize=13, weight="bold", ha="left")
    rows = [
        ("run", "tau (s)", "floor (%)", "note"),
        ("A-01", "1.02", "19.8", "baseline"),
        ("A-02", "1.97", "20.3", "seated joint"),
        ("A-03", "2.05", "20.1", "repeat"),
        ("B-01", "3.48", "21.0", "outlier †"),
    ]
    y = 0.555
    for i, row in enumerate(rows):
        weight = "bold" if i == 0 else "normal"
        for x, cell in zip((0.1, 0.24, 0.40, 0.58), row):
            fig.text(x, y, cell, fontsize=10, weight=weight, ha="left")
        y -= 0.03
    fig.text(0.1, 0.30, "Figure 2 is the signal path; Figure 1 is the response.", fontsize=10, ha="left")
    return fig


fig = panel_figure()
fig.savefig(OUT / "figmark-thermal.png", dpi=200, facecolor="white")
fig.savefig(OUT / "figmark-thermal.svg", facecolor="white")
with PdfPages(OUT / "figmark-thermal.pdf") as pdf:
    pdf.savefig(fig)
    plt.close(fig)
    pdf.savefig(schematic_figure())
    plt.close()
    pdf.savefig(text_page())
    plt.close()

schematic_figure().savefig(OUT / "figmark-schematic.svg", facecolor="white")
plt.close("all")
print("wrote:", ", ".join(sorted(p.name for p in OUT.iterdir())))
