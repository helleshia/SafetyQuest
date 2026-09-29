"""Build looping Ken-Burns H.264 MP4s for every module simulation step."""

from __future__ import annotations

import re
from pathlib import Path

import imageio.v2 as imageio
import numpy as np
from PIL import Image

MOBILE = Path(r"c:\Users\reyca\Downloads\SAFETYQUEST\mobile")
MODULES_DART = MOBILE / "lib" / "features" / "lessons" / "modules"
MODULES_ASSETS = MOBILE / "assets" / "modules"
MEDIA_OUT = MOBILE / "assets" / "media"

FPS = 24
SECONDS = 4
SIZE = 720


def parse_modules() -> list[tuple[str, str, int, list[str]]]:
    rows = []
    for path in sorted(MODULES_DART.glob("*.dart")):
        text = path.read_text(encoding="utf-8")
        key_m = re.search(r"key:\s*'([^']+)'", text)
        if not key_m:
            continue
        key = key_m.group(1)
        sims = len(re.findall(r"SimStep\(", text))
        if sims == 0:
            continue
        imgs = re.findall(r"image:\s*'assets/modules/([^']+)'", text)
        story = []
        for name in imgs:
            if "_p" in name and name not in story:
                story.append(name)
        rows.append((path.stem, key, sims, story))
    return rows


def ken_burns_frames(img: Image.Image, frames: int) -> list[np.ndarray]:
    bg = Image.new("RGBA", (SIZE, SIZE), (250, 247, 242, 255))
    src = img.convert("RGBA")
    pad = int(SIZE * 0.08)
    box = SIZE - pad * 2
    src.thumbnail((box, box), Image.Resampling.LANCZOS)
    base = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    ox = (SIZE - src.width) // 2
    oy = (SIZE - src.height) // 2
    base.paste(src, (ox, oy), src)

    out = []
    for i in range(frames):
        t = i / max(frames - 1, 1)
        scale = 1.0 + 0.08 * t
        crop = int(SIZE / scale)
        dx = int(6 * t)
        dy = int(-4 * t)
        left = max(0, min((SIZE - crop) // 2 + dx, SIZE - crop))
        top = max(0, min((SIZE - crop) // 2 + dy, SIZE - crop))
        frame = base.crop((left, top, left + crop, top + crop)).resize(
            (SIZE, SIZE), Image.Resampling.LANCZOS
        )
        composed = Image.alpha_composite(bg, frame).convert("RGB")
        out.append(np.array(composed))
    return out


def write_mp4(path: Path, frames: list[np.ndarray]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    writer = imageio.get_writer(
        str(path),
        fps=FPS,
        codec="libx264",
        quality=7,
        pixelformat="yuv420p",
        macro_block_size=1,
    )
    try:
        for frame in frames:
            writer.append_data(frame)
    finally:
        writer.close()


def main() -> None:
    MEDIA_OUT.mkdir(parents=True, exist_ok=True)
    frames_n = FPS * SECONDS
    made = 0
    for stem, key, sims, story in parse_modules():
        if not story:
            print(f"SKIP {stem}: no story images")
            continue
        for i in range(sims):
            src_name = story[i % len(story)]
            src_path = MODULES_ASSETS / src_name
            if not src_path.exists():
                print(f"MISSING {src_path}")
                continue
            out_name = f"{key}_sim_{i + 1}.mp4"
            out_path = MEDIA_OUT / out_name
            frames = ken_burns_frames(Image.open(src_path), frames_n)
            write_mp4(out_path, frames)
            made += 1
            print(f"OK {out_name} ({out_path.stat().st_size // 1024} KB)")
    print(f"done made={made}")


if __name__ == "__main__":
    main()
