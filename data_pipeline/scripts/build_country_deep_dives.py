"""130カ国分の進化的深掘り解説・国別要点カード (`country_deep_dive_v1.json`) 統合ビルド・検証スクリプト。"""

from __future__ import annotations

import glob
import json
import re
from pathlib import Path

from deep_dive_part1 import DEEP_DIVE_PART1
from deep_dive_part2 import DEEP_DIVE_PART2
from deep_dive_part3 import DEEP_DIVE_PART3

RAW_DIR = Path(__file__).resolve().parent.parent / "raw"
BASE_DIR = RAW_DIR / "countries_base"
BASIC_PATH = RAW_DIR / "world_basic_countries_v1.json"
OUT_PATH = RAW_DIR / "country_deep_dive_v1.json"

SUBCODE_RE = re.compile(
    r"(?<![A-Za-z])(BWh|BWk|BSh|BSk|Csa|Csb|Csc|Cwa|Cwb|Cwc|Cfc|Dfa|Dfb|Dfc|Dfd|Dwa|Dwb|Dwc|Dwd|Dsa|Dsb|Dsc|Dsd)(?![A-Za-z])"
)

ITEM_SECTIONS = [
    ("nature", "items"),
    ("industry", "agriculture"),
    ("industry", "resourcesAndEnergy"),
    ("industry", "industrialRegions"),
    ("cultureAndHistory", "historicalContext"),
]


def walk_strings(obj, path=""):
    if isinstance(obj, str):
        yield path, obj
    elif isinstance(obj, dict):
        for k, v in obj.items():
            yield from walk_strings(v, f"{path}.{k}" if path else k)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            yield from walk_strings(v, f"{path}[{i}]")


def main() -> None:
    detailed_countries: dict = {}
    for p in sorted(BASE_DIR.glob("*_v1.json")):
        detailed_countries.update(json.loads(p.read_text(encoding="utf-8")))
    basic_countries: dict = json.loads(BASIC_PATH.read_text(encoding="utf-8"))
    valid_240 = set(detailed_countries.keys()) | set(basic_countries.keys())

    merged: dict = {}
    for part_name, part in (
        ("part1", DEEP_DIVE_PART1),
        ("part2", DEEP_DIVE_PART2),
        ("part3", DEEP_DIVE_PART3),
    ):
        overlap = set(merged) & set(part)
        if overlap:
            raise ValueError(f"Duplicate ISO3 between parts ({part_name}): {overlap}")
        merged.update(part)

    missing_isos = set(detailed_countries) - set(merged)
    extra_isos = set(merged) - set(detailed_countries)
    if missing_isos:
        raise ValueError(f"Missing detailed countries in deep dive data ({len(missing_isos)}): {sorted(missing_isos)}")
    if extra_isos:
        raise ValueError(f"Extra non-detailed countries in deep dive data: {sorted(extra_isos)}")

    total_items = 0
    for iso, dd in sorted(merged.items()):
        cs = dd.get("examCheatSheet") or {}
        if not cs.get("oneLineKey"):
            raise ValueError(f"{iso}: missing examCheatSheet.oneLineKey")
        stats_list = cs.get("mustMemorizeStats") or []
        if len(stats_list) < 2:
            raise ValueError(f"{iso}: mustMemorizeStats needs >= 2 items")
        confs = cs.get("commonConfusions") or []
        if len(confs) < 1:
            raise ValueError(f"{iso}: commonConfusions needs >= 1 pair")
        for cpair in confs:
            p_iso = cpair.get("partnerIso3")
            if p_iso not in valid_240:
                raise ValueError(f"{iso}: invalid partnerIso3 {p_iso!r}")
            if p_iso == iso:
                raise ValueError(f"{iso}: partnerIso3 cannot equal self")
            if not cpair.get("partnerNameJa") or not cpair.get("title") or not cpair.get("diffPoint"):
                raise ValueError(f"{iso}: incomplete commonConfusion entry for {p_iso}")

        valid_item_ids: set[str] = set()
        for s1, s2 in ITEM_SECTIONS:
            for it in (detailed_countries[iso].get(s1) or {}).get(s2) or []:
                valid_item_ids.add(it["id"])

        items_dd = dd.get("items") or {}
        if len(items_dd) < 1:
            raise ValueError(f"{iso}: needs at least 1 item deepDive")
        for item_id, content in items_dd.items():
            if item_id not in valid_item_ids:
                raise ValueError(f"{iso}: unknown item_id {item_id!r} (valid={sorted(valid_item_ids)})")
            if not any(content.get(k) for k in ("mechanism", "historicalShift", "examTrap", "compareNote")):
                raise ValueError(f"{iso}.{item_id}: empty deepDive content")
            for r_iso in content.get("relatedIso3s") or []:
                if r_iso not in valid_240:
                    raise ValueError(f"{iso}.{item_id}: invalid relatedIso3 {r_iso!r}")
            total_items += 1

    for p, txt in walk_strings(merged):
        m = SUBCODE_RE.search(txt)
        if m:
            raise ValueError(f"Non-13 Koppen subcode {m.group(1)!r} at {p}: {txt}")

    OUT_PATH.write_text(json.dumps(merged, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUT_PATH.name}: countries={len(merged)}, itemDeepDives={total_items}")


if __name__ == "__main__":
    main()
