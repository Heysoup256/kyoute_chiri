"""昇格対象30カ国（詳細版 100 -> 130カ国）を既存rawデータへ冪等統合するスクリプト。"""

from __future__ import annotations

import json
import re
from pathlib import Path

from extra30_data_part1 import EXTRA_30_PART1_COUNTRIES
from extra30_data_part2 import EXTRA_30_PART2_COUNTRIES
from extra30_meta_part1 import EXTRA_30_META_PART1
from extra30_meta_part2 import EXTRA_30_META_PART2

RAW_DIR = Path(__file__).resolve().parent.parent / "raw"
BASE_DIR = RAW_DIR / "countries_base"
VALID_KOPPEN = {"Af", "Am", "Aw", "BW", "BS", "Cs", "Cw", "Cfa", "Cfb", "Df", "Dw", "ET", "EF"}
VALID_PLACEMENTS = {"overview", "industry", "population", "culture"}
SUBCODE_RE = re.compile(
    r"(?<![A-Za-z])(BWh|BWk|BSh|BSk|Csa|Csb|Csc|Cwa|Cwb|Cwc|Cfc|Dfa|Dfb|Dfc|Dfd|Dwa|Dwb|Dwc|Dwd|Dsa|Dsb|Dsc|Dsd)(?![A-Za-z])"
)


def load_json(path: Path) -> dict | list:
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, data: dict | list) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def validate_visual(iso: str, vis: dict) -> None:
    if vis.get("placement") not in VALID_PLACEMENTS:
        raise ValueError(f"{iso} {vis.get('id')}: invalid placement {vis.get('placement')}")
    kind = vis.get("kind")
    if kind == "donut" and not vis.get("slices"):
        raise ValueError(f"{iso} {vis.get('id')}: empty donut")
    elif kind == "bar" and not vis.get("bars"):
        raise ValueError(f"{iso} {vis.get('id')}: empty bar")
    elif kind == "line" and not vis.get("series"):
        raise ValueError(f"{iso} {vis.get('id')}: empty line")
    elif kind == "table" and (not vis.get("headers") or not vis.get("rows")):
        raise ValueError(f"{iso} {vis.get('id')}: empty table")
    elif kind not in {"donut", "bar", "line", "table"}:
        raise ValueError(f"{iso} {vis.get('id')}: unknown kind {kind}")


def main() -> None:
    countries_30 = {**EXTRA_30_PART1_COUNTRIES, **EXTRA_30_PART2_COUNTRIES}
    meta_30 = {**EXTRA_30_META_PART1, **EXTRA_30_META_PART2}
    assert len(countries_30) == 30, f"Expected 30 countries, got {len(countries_30)}"
    assert set(countries_30.keys()) == set(meta_30.keys()), "Country keys != Meta keys"

    existing_base_isos: set[str] = set()
    for p in sorted(BASE_DIR.glob("*_v1.json")):
        if p.name == "extra_30_v1.json":
            continue
        existing_base_isos.update(load_json(p).keys())

    overlap = set(countries_30) & existing_base_isos
    if overlap:
        raise ValueError(f"既存の countries_base と重複する ISO3 があります: {sorted(overlap)}")

    for iso, rec in countries_30.items():
        cl = rec["climate"]
        for k in cl["koppenCodes"]:
            if k not in VALID_KOPPEN:
                raise ValueError(f"{iso}: invalid koppenCodes {k}")
        assert cl["cities"], f"{iso}: no climate cities"
        for city in cl["cities"]:
            if city["koppenCode"] not in VALID_KOPPEN:
                raise ValueError(f"{iso} {city['cityId']}: invalid koppenCode {city['koppenCode']}")
            assert len(city["monthlyTempC"]) == 12 and len(city["monthlyPrecipMm"]) == 12

    basic_isos = set(load_json(RAW_DIR / "world_basic_countries_v1.json").keys())
    all_valid_isos = existing_base_isos | set(countries_30) | basic_isos

    # テキスト全体で禁止ケッペン細分コードチェック
    txt_check = json.dumps({"c": countries_30, "m": meta_30}, ensure_ascii=False)
    hits = SUBCODE_RE.findall(txt_check)
    if hits:
        raise ValueError(f"13区分以外の細分ケッペンコード検出: {sorted(set(hits))}")

    # 1. countries_base/extra_30_v1.json
    extra30_path = BASE_DIR / "extra_30_v1.json"
    save_json(extra30_path, countries_30)
    print(f"Wrote {extra30_path.name}: {len(countries_30)} countries")

    # 2. country_overviews_and_life_v1.json
    ov_path = RAW_DIR / "country_overviews_and_life_v1.json"
    ov_data = load_json(ov_path)
    for iso, meta in meta_30.items():
        block = meta["overviewLife"]
        assert len(block["quickOverview"].get("keyPoints", [])) >= 2, f"{iso}: keyPoints < 2"
        assert len(block["dailyLife"].get("wikiPhotoTargets", [])) >= 2, f"{iso}: wikiPhotoTargets < 2"
        ov_data[iso] = block
    save_json(ov_path, ov_data)
    print(f"Updated {ov_path.name}: total={len(ov_data)} countries")

    # 3. country_top_cities_v1.json
    tc_path = RAW_DIR / "country_top_cities_v1.json"
    tc_data = load_json(tc_path)
    for iso, meta in meta_30.items():
        tcr = meta["topCitiesRegions"]
        assert len(tcr.get("topCities", [])) >= 1 and len(tcr.get("specialRegions", [])) >= 1
        tc_data[iso] = tcr
    save_json(tc_path, tc_data)
    print(f"Updated {tc_path.name}: total={len(tc_data)} entries")

    # 4. country_highlight_visuals_v1.json
    hv_path = RAW_DIR / "country_highlight_visuals_v1.json"
    hv_data = load_json(hv_path)
    for iso, meta in meta_30.items():
        visuals = meta["visuals"]
        for v in visuals:
            validate_visual(iso, v)
        hv_data[iso] = visuals
    save_json(hv_path, hv_data)
    print(f"Updated {hv_path.name}: total={len(hv_data)} countries")

    # 5. country_relations_v1.json
    rel_path = RAW_DIR / "country_relations_v1.json"
    rel_data = load_json(rel_path)
    for iso, meta in meta_30.items():
        rels = meta["relations"]
        for r in rels:
            if r["partnerIso3"] not in all_valid_isos:
                raise ValueError(f"{iso}: unknown partnerIso3 {r['partnerIso3']}")
        rel_data[iso] = rels
    save_json(rel_path, rel_data)
    print(f"Updated {rel_path.name}: total={len(rel_data)} entries")


if __name__ == "__main__":
    main()
