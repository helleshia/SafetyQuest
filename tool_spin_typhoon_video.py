"""Make typhoon sim videos where the clay whirlwind (ipo-ipo) actually spins."""

from __future__ import annotations

from pathlib import Path

import cv2
import imageio.v2 as imageio
import numpy as np
from PIL import Image

MOBILE = Path(r"c:\Users\reyca\Downloads\SAFETYQUEST\mobile")
SRC = MOBILE / "assets" / "modules" / "typhoon_safety_p1.png"
OUT_DIR = MOBILE / "assets" / "media"
FPS = 24
SECONDS = 3
SIZE = 720


def load_square(path: Path) -> np.ndarray:
    """RGBA float image padded onto warm wash, square SIZE."""
    im = Image.open(path).convert("RGBA")
    bg = Image.new("RGBA", (SIZE, SIZE), (250, 247, 242, 255))
    # Fit subject
    pad = int(SIZE * 0.04)
    box = SIZE - pad * 2
    fitted = im.copy()
    fitted.thumbnail((box, box), Image.Resampling.LANCZOS)
    ox = (SIZE - fitted.width) // 2
    oy = (SIZE - fitted.height) // 2
    layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    layer.paste(fitted, (ox, oy), fitted)
    composed = Image.alpha_composite(bg, layer)
    return np.array(composed)  # RGBA uint8


def soft_circle_mask(h: int, w: int, cx: float, cy: float, r: float) -> np.ndarray:
    y, x = np.ogrid[:h, :w]
    dist = np.sqrt((x - cx) ** 2 + (y - cy) ** 2)
    # Soft edge ~12% of radius
    soft = r * 0.12
    mask = np.clip((r + soft - dist) / max(soft, 1e-3), 0, 1)
    return mask.astype(np.float32)


def spin_whirlwind(base_rgba: np.ndarray, angle_deg: float) -> np.ndarray:
    """Rotate only the upper funnel; keep house/ground fixed."""
    h, w = base_rgba.shape[:2]
    # Funnel sits in the upper-center of the clay art.
    cx, cy = w * 0.50, h * 0.22
    r = min(w, h) * 0.34

    bgr = cv2.cvtColor(base_rgba, cv2.COLOR_RGBA2BGRA)
    M = cv2.getRotationMatrix2D((cx, cy), angle_deg, 1.0)
    rotated = cv2.warpAffine(
        bgr,
        M,
        (w, h),
        flags=cv2.INTER_LINEAR,
        borderMode=cv2.BORDER_CONSTANT,
        borderValue=(0, 0, 0, 0),
    )

    mask = soft_circle_mask(h, w, cx, cy, r)
    # Don't spin the lower house band — taper mask below mid-funnel.
    y = np.arange(h, dtype=np.float32)
    vertical = np.clip((h * 0.48 - y) / (h * 0.18), 0, 1)
    mask = mask * vertical[:, None]

    alpha = mask[..., None]
    out = base_rgba.astype(np.float32) * (1 - alpha) + cv2.cvtColor(
        rotated, cv2.COLOR_BGRA2RGBA
    ).astype(np.float32) * alpha
    return np.clip(out, 0, 255).astype(np.uint8)


def write_spin_video(src: Path, dest: Path) -> None:
    base = load_square(src)
    frames_n = FPS * SECONDS
    writer = imageio.get_writer(
        str(dest),
        fps=FPS,
        codec="libx264",
        quality=7,
        pixelformat="yuv420p",
        macro_block_size=1,
    )
    try:
        for i in range(frames_n):
            # Full continuous spin (one revolution per loop).
            angle = -(i / frames_n) * 360.0
            frame = spin_whirlwind(base, angle)
            # Drop alpha for video encode
            rgb = frame[:, :, :3]
            writer.append_data(rgb)
    finally:
        writer.close()


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    # Sim 1 is the strong-wind / whirlwind beat.
    out1 = OUT_DIR / "typhoon-safety_sim_1.mp4"
    write_spin_video(SRC, out1)
    print(f"OK {out1.name} ({out1.stat().st_size // 1024} KB) — spinning funnel")

    # Sim 2 (flood/evac) — mild rain sway using same source p2 if present.
    src2 = MOBILE / "assets" / "modules" / "typhoon_safety_p2.png"
    out2 = OUT_DIR / "typhoon-safety_sim_2.mp4"
    if src2.exists():
        # Reuse spin lightly on cloud mass for motion, or ken-burns fallback.
        write_spin_video(src2, out2)
        print(f"OK {out2.name} ({out2.stat().st_size // 1024} KB)")
    print("done")


if __name__ == "__main__":
    main()
