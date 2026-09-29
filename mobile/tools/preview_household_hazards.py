"""Composite hazard layers onto household_base using hotspot rects for a visual check."""
from PIL import Image
import os

base_dir = os.path.join(os.path.dirname(__file__), "..", "assets", "modules")
base = Image.open(os.path.join(base_dir, "household_base.png")).convert("RGBA")
W, H = base.size
print(f"base {W}x{H}")

# Bottoms of rects sit on real surfaces (counter ~0.40, floor near sink ~0.58).
# Matches household_electricity.dart _hazardHotspots.
spots = [
    # Knife lying near front edge of kitchen counter (right of sink).
    ("household_layer_knife.png", 0.70, 0.34, 0.16, 0.07),
    # Candle standing on countertop near pink pot / cutting board.
    ("household_layer_candle.png", 0.82, 0.24, 0.08, 0.16),
    # Damaged cord from rice cooker trailing left toward outlet.
    ("household_layer_cord.png", 0.40, 0.34, 0.18, 0.07),
    # Cleaning chemical on floor beside/under sink cabinet.
    ("household_layer_cleaner.png", 0.66, 0.42, 0.07, 0.14),
    # Water spill flat on floor in front of sink.
    ("household_layer_puddle.png", 0.56, 0.52, 0.18, 0.10),
    # Hot kettle with steam on countertop left of rice cooker.
    ("household_layer_kettle.png", 0.44, 0.22, 0.10, 0.18),
]

out = base.copy()
for name, x, y, w, h in spots:
    layer = Image.open(os.path.join(base_dir, name)).convert("RGBA")
    box_w, box_h = int(w * W), int(h * H)
    lw, lh = layer.size
    scale = min(box_w / lw, box_h / lh)
    nw, nh = max(1, int(lw * scale)), max(1, int(lh * scale))
    layer = layer.resize((nw, nh), Image.Resampling.LANCZOS)
    left = int(x * W) + (box_w - nw) // 2
    top = int(y * H) + (box_h - nh)
    out.alpha_composite(layer, (left, top))
    print(f"{name}: bottom_y={(top+nh)/H:.3f} at ({left},{top}) {nw}x{nh}")

preview = os.path.join(os.path.dirname(__file__), "household_hazard_preview.png")
out.convert("RGB").save(preview, quality=92)
print("wrote", preview)
