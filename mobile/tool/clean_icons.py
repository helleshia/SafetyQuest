"""Prepares generated 3D module art for the app.

Drop images into mobile/art/incoming/ named after the module (fire_3d.jpg,
flood_3d.png, ...), then run from mobile/:

    python tool/clean_icons.py

Each one is saved to assets/modules/<name>.png with a real transparent
background. Image generators often paint a checkerboard or a flat white
backdrop instead of true transparency; both are removed here. Only the
backdrop connected to the image border is cleared, so light areas inside the
artwork stay.

Needs: pip install pillow numpy scipy
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
INCOMING = ROOT / 'art' / 'incoming'
OUT = ROOT / 'assets' / 'modules'
SIZE = 640


def backdrop_mask(rgb: np.ndarray) -> np.ndarray:
    spread = rgb.max(axis=2) - rgb.min(axis=2)
    value = rgb.mean(axis=2)
    border = np.concatenate([value[0], value[-1], value[:, 0], value[:, -1]])
    # Light backdrops (white or light checkerboard) vs dark checkerboards.
    lo, hi = (185, 256) if np.median(border) > 150 else (25, 140)
    candidate = (spread < 18) & (value > lo) & (value < hi)
    labels, _ = ndimage.label(candidate)
    edge = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    mask = np.isin(labels, edge[edge != 0])
    return ndimage.binary_opening(mask, iterations=1)


def clean(src: Path) -> Path:
    rgb = np.asarray(Image.open(src).convert('RGB')).astype(int)
    mask = backdrop_mask(rgb)
    alpha = ndimage.gaussian_filter(np.where(mask, 0.0, 255.0), 0.8)
    alpha[ndimage.binary_erosion(mask, iterations=2)] = 0
    img = Image.fromarray(np.dstack([rgb.astype(np.uint8), alpha.clip(0, 255).astype(np.uint8)]), 'RGBA')
    box = img.getbbox()
    if box:
        pad = 16
        img = img.crop((max(0, box[0] - pad), max(0, box[1] - pad), min(img.width, box[2] + pad), min(img.height, box[3] + pad)))
    # Square canvas so every module icon sits the same way in its tile.
    side = max(img.size)
    square = Image.new('RGBA', (side, side))
    square.paste(img, ((side - img.width) // 2, (side - img.height) // 2))
    square.thumbnail((SIZE, SIZE), Image.LANCZOS)
    dst = OUT / (src.stem + '.png')
    square.save(dst, optimize=True)
    print(f'{src.name} -> {dst.relative_to(ROOT)} ({100 * mask.mean():.0f}% background removed)')
    return dst


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    files = [p for p in sorted(INCOMING.glob('*')) if p.suffix.lower() in {'.jpg', '.jpeg', '.png', '.webp'}]
    if not files:
        sys.exit(f'No images in {INCOMING}. Name them like fire_3d.jpg.')
    for path in files:
        clean(path)


if __name__ == '__main__':
    main()
