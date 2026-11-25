"""20カ国の国内地域区分（subnational_regions_v1.json）を統合・検証し生成するスクリプト。"""

from __future__ import annotations

import json
import re
from pathlib import Path

from subnational_data_part1 import SUBNATIONAL_PART1
from subnational_data_part2 import SUBNATIONAL_PART2
from subnational_data_part3 import SUBNATIONAL_PART3

RAW_DIR = Path(__file__).resolve().parent.parent / "raw"
OUT_PATH = RAW_DIR / "subnational_regions_v1.json"

TARGET_20 = [
    "USA", "CHN", "JPN", "IND", "AUS", "BRA", "RUS",
    "CAN", "DEU", "FRA", "ITA", "GBR", "ESP", "MEX",
    "ARG", "IDN", "VNM", "MYS", "NGA", "TUR",
]

SUBCODE_RE = re.compile(
    r"(?<![A-Za-z])(BWh|BWk|BSh|BSk|Csa|Csb|Csc|Cwa|Cwb|Cwc|Cfc|Dfa|Dfb|Dfc|Dfd|Dwa|Dwb|Dwc|Dwd|Dsa|Dsb|Dsc|Dsd)(?![A-Za-z])"
)


def close_polygon(poly: list[list[float]]) -> list[list[float]]:
    if not poly:
        return poly
    if poly[0] != poly[-1]:
        return [*poly, list(poly[0])]
    return poly


def main() -> None:
    merged: dict[str, dict] = {}
    for part in (SUBNATIONAL_PART1, SUBNATIONAL_PART2, SUBNATIONAL_PART3):
        for iso, val in part.items():
            if iso in merged:
                raise ValueError(f"Duplicate ISO3 {iso} across subnational parts")
            merged[iso] = val

    if set(merged.keys()) != set(TARGET_20):
        missing = set(TARGET_20) - set(merged.keys())
        extra = set(merged.keys()) - set(TARGET_20)
        raise ValueError(f"Target 20 mismatch: missing={missing}, extra={extra}")

    for iso in TARGET_20:
        rec = merged[iso]
        assert rec.get("headline") and rec.get("summary"), f"{iso}: missing headline/summary"
        blines = rec.get("boundaryLines", [])
        assert len(blines) >= 1, f"{iso}: boundaryLines empty"
        for bl in blines:
            coords = bl.get("coordinates", [])
            assert len(coords) >= 2, f"{iso}/{bl.get('id')}: invalid line coordinates"
        tbl = rec.get("comparisonTable", {})
        assert tbl.get("headers") and tbl.get("rows"), f"{iso}: missing comparisonTable"
        zones = rec.get("zones", [])
        assert len(zones) >= 2, f"{iso}: need at least 2 zones, got {len(zones)}"
        for z in zones:
            if z.get("polygon"):
                z["polygon"] = close_polygon(z["polygon"])
                assert len(z["polygon"]) >= 4, f"{iso}/{z['id']}: invalid polygon ring"

    raw_text = json.dumps(merged, ensure_ascii=False, indent=2)
    hits = SUBCODE_RE.findall(raw_text)
    if hits:
        raise ValueError(f"禁止されている13区分以外の細分ケッペンコードが含まれています: {sorted(set(hits))}")

    OUT_PATH.write_text(raw_text + "\n", encoding="utf-8")
    print(
        f"Generated {OUT_PATH.name}: countries={len(merged)}, "
        f"boundaryLines={sum(len(v['boundaryLines']) for v in merged.values())}, "
        f"zones={sum(len(v['zones']) for v in merged.values())}"
    )


if __name__ == "__main__":
    main()
