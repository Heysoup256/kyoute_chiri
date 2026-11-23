"""
共通テスト100点到達レベル化用 学習図鑑データビルダー
- data_pipeline/raw/world_rankings_v1.json      -> app/public/data/world_rankings_v1.json
- data_pipeline/raw/systematic_geography_v1.json -> app/public/data/systematic_geography_v1.json (存在時)
- data_pipeline/raw/japan_geography_v1.json     -> app/public/data/japan_geography_v1.json (存在時)
各国ISO3コード参照が countries_v1.json に実在することを厳密検証して出力する。
"""

import json
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]
RAW_DIR = ROOT_DIR / "data_pipeline" / "raw"
DATA_DIR = ROOT_DIR / "app" / "public" / "data"


def load_valid_iso3_set() -> set[str]:
    countries_path = DATA_DIR / "countries_v1.json"
    if not countries_path.exists():
        raise FileNotFoundError(f"countries_v1.json not found: {countries_path}")
    data = json.loads(countries_path.read_text(encoding="utf-8"))
    return set(data.get("countries", {}).keys())


def validate_guide_charts(ctx: str, charts: list[dict]) -> list[str]:
    errs: list[str] = []
    for ch in charts:
        cid = ch.get("id", "?")
        kind = ch.get("kind")
        cats = ch.get("categories") or []
        series = ch.get("series") or []
        if not series:
            errs.append(f"{ctx} chart {cid}: empty series")
            continue
        if cats:
            for s in series:
                vals = s.get("values") or []
                if len(vals) != len(cats):
                    errs.append(
                        f"{ctx} chart {cid} series '{s.get('name')}': values len {len(vals)} != categories len {len(cats)}"
                    )
        if kind == "stacked_bar" and cats:
            for i in range(len(cats)):
                total = sum(float((s.get("values") or [0])[i]) for s in series)
                if abs(total - 100.0) > 2.5:
                    errs.append(f"{ctx} chart {cid} cat '{cats[i]}': stacked_bar sum={total} != 100")
    return errs


def build_world_rankings(valid_iso3s: set[str]) -> list[str]:
    src = RAW_DIR / "world_rankings_v1.json"
    if not src.exists():
        return [f"Missing raw file: {src}"]
    data = json.loads(src.read_text(encoding="utf-8"))
    errors: list[str] = []

    items = data.get("items", [])
    if len(items) < 30:
        errors.append(f"world_rankings_v1: items count too low ({len(items)})")
    seen_ids = set()
    for item in items:
        iid = item.get("id")
        if not iid or iid in seen_ids:
            errors.append(f"world_rankings_v1: duplicate or missing id {iid}")
        seen_ids.add(iid)
        if item.get("category") not in ("agriculture", "resource", "industry", "society"):
            errors.append(f"world_rankings_v1 {iid}: invalid category {item.get('category')}")
        for bucket in ("primaryTop", "secondaryTop"):
            entries = item.get(bucket) or []
            for ent in entries:
                iso = ent.get("iso3")
                if iso and iso not in valid_iso3s:
                    errors.append(f"world_rankings_v1 {iid}/{bucket}: unknown iso3 {iso}")

    scatters = data.get("scatters", [])
    if len(scatters) < 2:
        errors.append("world_rankings_v1: expected at least 2 scatter charts")
    for sc in scatters:
        for pt in sc.get("points", []):
            iso = pt.get("iso3")
            if iso and iso not in valid_iso3s:
                errors.append(f"world_rankings_v1 scatter {sc.get('id')}: unknown iso3 {iso}")

    comp_charts = data.get("comparisonCharts", [])
    errors.extend(validate_guide_charts("world_rankings", comp_charts))
    flow_maps = data.get("flowMaps", [])
    for fm in flow_maps:
        for arc in fm.get("arcs", []):
            for key in ("fromIso3", "toIso3"):
                iso = arc.get(key)
                if iso and iso not in valid_iso3s:
                    errors.append(f"world_rankings_v1 flowMap {fm.get('id')} arc {arc.get('id')}: unknown {key}={iso}")

    if not errors:
        out = DATA_DIR / "world_rankings_v1.json"
        out.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        print(
            f"Built {out.name}: items={len(items)}, scatters={len(scatters)}, "
            f"comparisonCharts={len(comp_charts)}, flowMaps={len(flow_maps)}"
        )
    return errors


def build_systematic_guide(valid_iso3s: set[str]) -> list[str]:
    src = RAW_DIR / "systematic_geography_v1.json"
    if not src.exists():
        print("Skip systematic_geography_v1.json (not created yet)")
        return []
    data = json.loads(src.read_text(encoding="utf-8"))
    errors: list[str] = []
    topics = data.get("topics", [])
    if len(topics) < 20:
        errors.append(f"systematic_geography_v1: topics count too low ({len(topics)})")
    chart_count = 0
    for t in topics:
        for iso in t.get("relatedCountries", []):
            if iso not in valid_iso3s:
                errors.append(f"systematic {t.get('id')}: unknown iso3 {iso}")
        t_charts = t.get("charts") or []
        chart_count += len(t_charts)
        errors.extend(validate_guide_charts(f"systematic/{t.get('id')}", t_charts))
    if not errors:
        out = DATA_DIR / "systematic_geography_v1.json"
        out.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"Built {out.name}: categories={len(data.get('categories', []))}, topics={len(topics)}, embeddedCharts={chart_count}")
    return errors


def build_japan_guide(valid_iso3s: set[str]) -> list[str]:
    src = RAW_DIR / "japan_geography_v1.json"
    if not src.exists():
        print("Skip japan_geography_v1.json (not created yet)")
        return []
    data = json.loads(src.read_text(encoding="utf-8"))
    errors: list[str] = []
    regions = data.get("regions", [])
    map_skills = data.get("mapSkills", [])
    if len(regions) < 8:
        errors.append(f"japan_geography_v1: regions count < 8 ({len(regions)})")
    if len(map_skills) < 5:
        errors.append(f"japan_geography_v1: mapSkills count < 5 ({len(map_skills)})")
    if "JPN" not in valid_iso3s:
        errors.append("JPN missing in countries_v1.json")
    dom = data.get("domesticStats") or {}
    errors.extend(validate_guide_charts("japan_domestic", dom.get("charts") or []))
    if not errors:
        out = DATA_DIR / "japan_geography_v1.json"
        out.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        dom = data.get("domesticStats") or {}
        print(
            f"Built {out.name}: mapSkills={len(map_skills)}, regions={len(regions)}, "
            f"domesticCharts={len(dom.get('charts', []))}, prefRankings={len(dom.get('prefRankings', []))}"
        )
    return errors


def main() -> None:
    valid_iso3s = load_valid_iso3_set()
    errors: list[str] = []
    errors.extend(build_world_rankings(valid_iso3s))
    errors.extend(build_systematic_guide(valid_iso3s))
    errors.extend(build_japan_guide(valid_iso3s))
    if errors:
        print("BUILD STUDY GUIDES FAILED:")
        for e in errors:
            print("  -", e)
        sys.exit(1)
    print("Study guides built & verified cleanly!")


if __name__ == "__main__":
    main()
