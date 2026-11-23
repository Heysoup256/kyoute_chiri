"""昇格14カ国の詳細化（86 -> 100カ国）および既存詳細国のビジュアル/地域ピン100%補完を実行するスクリプト。

処理内容:
1. data_pipeline/raw/countries_base/extra_14_v1.json の生成（14カ国の詳細プロファイル＋15気候都市）
2. data_pipeline/raw/country_overviews_and_life_v1.json への14カ国概観・生活文化＋写真ターゲット登録
3. data_pipeline/raw/country_top_cities_v1.json への14カ国主要都市＋全64未設定国の specialRegions 登録（100%カバー）
4. data_pipeline/raw/country_highlight_visuals_v1.json への14カ国＋39未設定国のビジュアル登録（100%カバー・冪等マージ）
5. data_pipeline/raw/country_relations_v1.json への14カ国関連国リンク登録（重複キー排除）
"""

from __future__ import annotations

import json
from pathlib import Path

from enrich_countries_data_extra14 import (
    EXTRA_14_COUNTRIES,
    EXTRA_14_OVERVIEWS_AND_LIFE,
    EXTRA_14_RELATIONS,
    EXTRA_14_TOP_CITIES_AND_REGIONS,
    EXTRA_14_VISUALS,
)
from enrich_countries_data_visuals_regions import (
    EXTRA_39_VISUALS,
    EXTRA_64_SPECIAL_REGIONS,
)

RAW_DIR = Path(__file__).resolve().parent.parent / "raw"
BASE_DIR = RAW_DIR / "countries_base"
VALID_KOPPEN = {"Af", "Am", "Aw", "BW", "BS", "Cs", "Cw", "Cfa", "Cfb", "Df", "Dw", "ET", "EF"}
VALID_PLACEMENTS = {"overview", "industry", "population", "culture"}


def load_json(path: Path) -> dict | list:
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, data: dict | list) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def validate_extra_14() -> None:
    existing_base_isos: set[str] = set()
    for p in sorted(BASE_DIR.glob("*_v1.json")):
        if p.name == "extra_14_v1.json":
            continue
        existing_base_isos.update(load_json(p).keys())

    overlap = set(EXTRA_14_COUNTRIES) & existing_base_isos
    if overlap:
        raise ValueError(f"既存の countries_base と重複する ISO3 があります: {sorted(overlap)}")

    for iso, rec in EXTRA_14_COUNTRIES.items():
        cl = rec["climate"]
        for k in cl["koppenCodes"]:
            if k not in VALID_KOPPEN:
                raise ValueError(f"{iso}: 不正な koppenCodes {k}")
        if not cl["cities"]:
            raise ValueError(f"{iso}: climate.cities が空です")
        for city in cl["cities"]:
            if city["koppenCode"] not in VALID_KOPPEN:
                raise ValueError(f"{iso} {city['cityId']}: 不正な koppenCode {city['koppenCode']}")
            if len(city["monthlyTempC"]) != 12 or len(city["monthlyPrecipMm"]) != 12:
                raise ValueError(f"{iso} {city['cityId']}: 月別データ長が12ではありません")


def validate_visual(iso: str, vis: dict) -> None:
    if vis.get("placement") not in VALID_PLACEMENTS:
        raise ValueError(f"{iso} {vis.get('id')}: 不正な placement {vis.get('placement')}")
    kind = vis.get("kind")
    if kind == "donut" and not vis.get("slices"):
        raise ValueError(f"{iso} {vis.get('id')}: donut slices 空")
    elif kind == "bar" and not vis.get("bars"):
        raise ValueError(f"{iso} {vis.get('id')}: bar bars 空")
    elif kind == "line" and not vis.get("series"):
        raise ValueError(f"{iso} {vis.get('id')}: line series 空")
    elif kind == "table" and (not vis.get("headers") or not vis.get("rows")):
        raise ValueError(f"{iso} {vis.get('id')}: table headers/rows 空")
    elif kind not in {"donut", "bar", "line", "table"}:
        raise ValueError(f"{iso} {vis.get('id')}: 未知の kind {kind}")


def main() -> None:
    validate_extra_14()

    # 1. countries_base/extra_14_v1.json
    extra_14_path = BASE_DIR / "extra_14_v1.json"
    save_json(extra_14_path, EXTRA_14_COUNTRIES)
    print(f"Wrote {extra_14_path.name}: {len(EXTRA_14_COUNTRIES)} countries")

    # 2. country_overviews_and_life_v1.json
    ov_path = RAW_DIR / "country_overviews_and_life_v1.json"
    ov_data = load_json(ov_path)
    for iso, block in EXTRA_14_OVERVIEWS_AND_LIFE.items():
        if len(block["quickOverview"].get("keyPoints", [])) < 2:
            raise ValueError(f"{iso}: keyPoints が2件未満です")
        if len(block["dailyLife"].get("wikiPhotoTargets", [])) < 2:
            raise ValueError(f"{iso}: wikiPhotoTargets が2件未満です")
        ov_data[iso] = block
    save_json(ov_path, ov_data)
    print(f"Updated {ov_path.name}: total={len(ov_data)} countries")

    # 3. country_top_cities_v1.json (+14 topCities/specialRegions + 64 specialRegions)
    tc_path = RAW_DIR / "country_top_cities_v1.json"
    tc_data = load_json(tc_path)
    for iso, block in EXTRA_14_TOP_CITIES_AND_REGIONS.items():
        tc_data[iso] = block
    for iso, regions in EXTRA_64_SPECIAL_REGIONS.items():
        entry = tc_data.setdefault(iso, {"topCities": [], "specialRegions": []})
        existing_names = {r["name"] for r in entry.get("specialRegions", [])}
        merged_sr = list(entry.get("specialRegions", []))
        for reg in regions:
            if reg["name"] not in existing_names:
                merged_sr.append(reg)
                existing_names.add(reg["name"])
        entry["specialRegions"] = merged_sr
    save_json(tc_path, tc_data)
    print(f"Updated {tc_path.name}: total={len(tc_data)} entries")

    # 4. country_highlight_visuals_v1.json (14 + 39)
    hv_path = RAW_DIR / "country_highlight_visuals_v1.json"
    hv_data = load_json(hv_path)
    merged_visuals_source = {**EXTRA_14_VISUALS, **EXTRA_39_VISUALS}
    for iso, visuals in merged_visuals_source.items():
        current = list(hv_data.get(iso, []))
        existing_ids = {v["id"] for v in current}
        for v in visuals:
            validate_visual(iso, v)
            if v["id"] in existing_ids:
                current = [v if item["id"] == v["id"] else item for item in current]
            else:
                current.append(v)
                existing_ids.add(v["id"])
        hv_data[iso] = current
    save_json(hv_path, hv_data)
    print(f"Updated {hv_path.name}: total={len(hv_data)} countries")

    # 5. country_relations_v1.json (14カ国の関連国を重複キーなくマージ)
    rel_path = RAW_DIR / "country_relations_v1.json"
    rel_data = load_json(rel_path)
    for iso, rels in EXTRA_14_RELATIONS.items():
        current = list(rel_data.get(iso, []))
        seen_keys = {(r["partnerIso3"], r["category"], r["direction"]) for r in current}
        for r in rels:
            key = (r["partnerIso3"], r["category"], r["direction"])
            if key not in seen_keys:
                current.append(r)
                seen_keys.add(key)
        rel_data[iso] = current
    save_json(rel_path, rel_data)
    print(f"Updated {rel_path.name}: total={len(rel_data)} countries")


if __name__ == "__main__":
    main()
