"""
app/public/data/ 配下の完成版データセット全体（countries_v1.json, past_exams_v1.json,
geo_countries_v1.geojson, geo_layers_v1.geojson, clips/*.png）の厳密な整合性検証スクリプト。
"""

import json
import re
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT_DIR / "app" / "public" / "data"


def main() -> None:
    errors: list[str] = []

    countries_json = json.loads((DATA_DIR / "countries_v1.json").read_text(encoding="utf-8"))
    past_exams_json = json.loads((DATA_DIR / "past_exams_v1.json").read_text(encoding="utf-8"))
    geo_countries = json.loads((DATA_DIR / "geo_countries_v1.geojson").read_text(encoding="utf-8"))
    geo_layers = json.loads((DATA_DIR / "geo_layers_v1.geojson").read_text(encoding="utf-8"))
    plate_boundaries = json.loads(
        (DATA_DIR / "plate_boundaries_v1.geojson").read_text(encoding="utf-8")
    )

    geo_iso3_set = set()
    required_thematic = (
        "koppenGroup",
        "koppenMain",
        "annualPrecipMm",
        "agricultureMain",
        "meanElevationM",
        "religionMain",
        "languageFamilyMain",
    )
    for f in geo_countries.get("features", []):
        props = f.get("properties", {})
        g_iso = props.get("iso3")
        if not g_iso:
            errors.append("GeoJSONにiso3欠落フィーチャがあります")
            continue
        geo_iso3_set.add(g_iso)
        for tk in required_thematic:
            if tk not in props or props[tk] is None or props[tk] == "":
                errors.append(f"GeoJSON {g_iso}: 主題図属性 {tk} が未設定です")
        if props.get("koppenGroup") not in ("A", "B", "C", "D", "E"):
            errors.append(f"GeoJSON {g_iso}: 不正な koppenGroup={props.get('koppenGroup')}")

    countries = countries_json.get("countries", {})
    if len(countries) < len(geo_iso3_set):
        errors.append(
            f"全GeoJSON国数({len(geo_iso3_set)})に対して収録国数({len(countries)})が不足しています"
        )

    koppen_13 = {"Af", "Am", "Aw", "BW", "BS", "Cs", "Cw", "Cfa", "Cfb", "Df", "Dw", "ET", "EF"}
    for req_iso, min_pop in (("JPN", 100_000_000), ("IND", 1_000_000_000), ("USA", 300_000_000)):
        pop_v = (countries.get(req_iso, {}).get("stats") or {}).get("population", 0)
        if pop_v < min_pop:
            errors.append(f"{req_iso}: population={pop_v} が想定下限({min_pop})未満です")

    detailed_count = 0
    basic_count = 0
    total_cities = 0
    for iso3, c in countries.items():
        if iso3 != c.get("iso3"):
            errors.append(f"ISO3キー不一致: {iso3} != {c.get('iso3')}")
        if iso3 not in geo_iso3_set:
            errors.append(f"国境GeoJSONに {iso3} ({c.get('nameJa')}) が見つかりません")
        rank = c.get("examSummary", {}).get("rank")
        if rank not in ("S", "A", "B", "C"):
            errors.append(f"{iso3}: 不正なランク {rank}")

        is_basic = bool(c.get("isBasicEntry"))
        if is_basic:
            basic_count += 1
        else:
            detailed_count += 1

        cities = c.get("climate", {}).get("cities", [])
        if not is_basic and not cities:
            errors.append(f"{iso3}: 詳細収録国に気候都市がありません")
        for city in cities:
            total_cities += 1
            if len(city.get("monthlyTempC", [])) != 12:
                errors.append(f"{iso3}/{city.get('cityId')}: monthlyTempC が12要素ではありません")
            precips = city.get("monthlyPrecipMm", [])
            if len(precips) != 12 or any(p < 0 for p in precips):
                errors.append(f"{iso3}/{city.get('cityId')}: monthlyPrecipMm が不正です")
            if city.get("koppenCode") not in koppen_13:
                errors.append(f"{iso3}/{city.get('cityId')}: 非13区分 koppenCode={city.get('koppenCode')}")

        for kc in c.get("climate", {}).get("koppenCodes", []):
            if kc not in koppen_13:
                errors.append(f"{iso3}: climate.koppenCodes に非13区分 {kc}")

        qo = c.get("quickOverview") or {}
        if not qo.get("headline") or not qo.get("summary") or len(qo.get("keyPoints", [])) < 2:
            errors.append(f"{iso3}: quickOverview が不完全です")
        if not is_basic:
            dl = c.get("dailyLife") or {}
            if not dl.get("summary") or not dl.get("food") or not dl.get("housing"):
                errors.append(f"{iso3}: dailyLife テキストが不完全です")
            photos = dl.get("photos") or []
            if len(photos) < 1 or any(not str(ph.get("url", "")).startswith("https://") for ph in photos):
                errors.append(f"{iso3}: dailyLife.photos が不正または不足しています")
        th = c.get("thematic") or {}
        if th.get("koppenGroup") not in ("A", "B", "C", "D", "E"):
            errors.append(f"{iso3}: thematic.koppenGroup が不正です")
        if th.get("koppenMain") not in koppen_13:
            errors.append(f"{iso3}: thematic.koppenMain={th.get('koppenMain')} が13区分外です")

        for rel in c.get("relations", []):
            if not rel.get("partnerIso3") or not rel.get("summary") or rel.get("category") not in ("trade", "migration", "history", "tourism"):
                errors.append(f"{iso3}: 不正な relation {rel}")
        for hv in c.get("highlightVisuals", []):
            if hv.get("kind") not in ("donut", "line", "bar", "table") or not hv.get("title"):
                errors.append(f"{iso3}: 不正な highlightVisual {hv.get('id')}")

        st = c.get("stats") or {}
        if st.get("population") is None or st.get("areaKm2") is None or st.get("gdpBillionUsd") is None:
            errors.append(f"{iso3}: stats（人口・面積・GDP）が欠落しています")
        sec = st.get("sectorShare") or {}
        sec_sum = (sec.get("primaryPct", 0) + sec.get("secondaryPct", 0) + sec.get("tertiaryPct", 0))
        if abs(sec_sum - 100.0) > 1.0:
            errors.append(f"{iso3}: sectorShare 合計が100%ではありません ({sec_sum})")
        if len(st.get("agePyramid", [])) != 9:
            errors.append(f"{iso3}: agePyramid が9階級ではありません")
        if not is_basic:
            if len(c.get("topCities", [])) < 1:
                errors.append(f"{iso3}: topCities が未登録です")
            if not c.get("highlightVisuals"):
                errors.append(f"{iso3}: highlightVisuals が未登録です")
            if not c.get("specialRegions"):
                errors.append(f"{iso3}: specialRegions が未登録です")

    raw_past_exams_dir = ROOT_DIR / "data_pipeline" / "raw" / "past_exams"
    raw_exam_files = list(raw_past_exams_dir.glob("*_v1.json"))
    expected_q_count = sum(
        len(json.loads(ep.read_text(encoding="utf-8")).get("questions", []))
        for ep in raw_exam_files
    )

    questions = past_exams_json.get("questions", [])
    if len(questions) != expected_q_count or len(questions) < 700:
        errors.append(
            f"過去問設問数が期待値({expected_q_count})または最低700問と一致しません: {len(questions)}"
        )
    if len(countries_json.get("examCoverage", [])) < 22:
        errors.append(f"収録試験回数が22回未満です: {len(countries_json.get('examCoverage', []))}")

    seen_qids = set()
    for q in questions:
        qid = q.get("questionId")
        if qid in seen_qids:
            errors.append(f"重複 questionId: {qid}")
        seen_qids.add(qid)

        choices = q.get("choicesCount", 0)
        ans = q.get("correctAnswer", 0)
        if not (1 <= ans <= choices):
            errors.append(f"{qid}: 正解番号 {ans} が選択肢数 {choices} の範囲外です")

        clip_rel = q.get("clipImagePath")
        if not clip_rel:
            errors.append(f"{qid}: clipImagePath が未設定です")
        else:
            clip_abs = ROOT_DIR / "app" / "public" / clip_rel.lstrip("/")
            if not clip_abs.exists() or clip_abs.stat().st_size == 0:
                errors.append(f"{qid}: 画像ファイルが存在しません ({clip_abs})")

    layer_feats = geo_layers.get("features", [])
    if len(layer_feats) < 40:
        errors.append(f"地形レイヤー数が少なすぎます: {len(layer_feats)}")
    plate_feats = plate_boundaries.get("features", [])
    if len(plate_feats) < 150:
        errors.append(f"プレート境界フィーチャ数が不足しています: {len(plate_feats)}")
    for pf in plate_feats:
        if pf.get("properties", {}).get("boundaryType") not in ("convergent", "divergent", "transform"):
            errors.append(f"不正なプレート boundaryType: {pf.get('properties', {}).get('id')}")

    # 追加主題図PNG・グリッド・首都・火山・気象現象・地名ガゼッティア検証
    for png_name in (
        "thematic_elevation_v1.png",
        "thematic_precipitation_v1.png",
        "thematic_koppen_v1.png",
        "thematic_soil_v1.png",
        "thematic_agriculture_v1.png",
        "thematic_religion_v1.png",
        "thematic_language_v1.png",
    ):
        pp = DATA_DIR / png_name
        if not pp.exists() or pp.stat().st_size < 20_000:
            errors.append(f"主題図画像が不正または不足: {png_name}")

    grid_json = json.loads((DATA_DIR / "thematic_grid_v1.json").read_text(encoding="utf-8"))
    if grid_json.get("width") != 360 or grid_json.get("height") != 180 or not grid_json.get("soil"):
        errors.append("thematic_grid_v1.json のサイズまたは soil グリッドが不正です")

    capitals_json = json.loads((DATA_DIR / "capitals_v1.geojson").read_text(encoding="utf-8"))
    volcanoes_json = json.loads((DATA_DIR / "volcanoes_v1.geojson").read_text(encoding="utf-8"))
    phenom_json = json.loads((DATA_DIR / "climate_phenomena_v1.geojson").read_text(encoding="utf-8"))
    places_json = json.loads((DATA_DIR / "places_v1.json").read_text(encoding="utf-8"))

    if len(capitals_json.get("features", [])) < 100:
        errors.append("capitals_v1.geojson の首都数が不足しています")
    if len(volcanoes_json.get("features", [])) < 20:
        errors.append("volcanoes_v1.geojson の火山数が不足しています")
    if len(phenom_json.get("features", [])) < 50:
        errors.append("climate_phenomena_v1.geojson の現象数が不足しています")
    if len(places_json.get("places", [])) < 300:
        errors.append("places_v1.json の登録地名数が不足しています")

    bad_photo_re = re.compile(
        r"(?:^|[_\-/])(map|locator|chart|relief)(?:[_\-.]|$)|topographic|topo_map|watershed|gyres|\.png|\.svg|landsat|modis"
    )
    for feat in layer_feats:
        purl = str(feat.get("properties", {}).get("photoUrl") or "").lower().split("?")[0]
        if purl and bad_photo_re.search(purl):
            errors.append(f"geo_layers {feat['properties'].get('id')}: 地図・非写真URLが混入 ({purl})")
    for pl in places_json.get("places", []):
        purl = str(pl.get("photoUrl") or "").lower().split("?")[0]
        if purl and bad_photo_re.search(purl):
            errors.append(f"places {pl.get('id')}: 地図・非写真URLが混入 ({purl})")

    subcode_re = re.compile(
        r"(?<![A-Za-z])(BWh|BWk|BSh|BSk|Csa|Csb|Csc|Cwa|Cwb|Cwc|Cfc|Dfa|Dfb|Dfc|Dfd|Dwa|Dwb|Dwc|Dwd|Dsa|Dsb|Dsc|Dsd)(?![A-Za-z])"
    )
    for fname in ("countries_v1.json", "places_v1.json", "geo_countries_v1.geojson"):
        hits = subcode_re.findall((DATA_DIR / fname).read_text(encoding="utf-8"))
        if hits:
            errors.append(f"{fname}: 13区分以外のケッペンコードが残存しています: {sorted(set(hits))}")

    # 学習図鑑・統計データブックの検証
    for guide_name in ("world_rankings_v1.json", "systematic_geography_v1.json", "japan_geography_v1.json"):
        gp = DATA_DIR / guide_name
        if not gp.exists() or gp.stat().st_size < 5_000:
            errors.append(f"学習データファイルが不足または空です: {guide_name}")
    wr = json.loads((DATA_DIR / "world_rankings_v1.json").read_text(encoding="utf-8"))
    sg = json.loads((DATA_DIR / "systematic_geography_v1.json").read_text(encoding="utf-8"))
    jg = json.loads((DATA_DIR / "japan_geography_v1.json").read_text(encoding="utf-8"))
    subnational_count = sum(1 for c in countries.values() if c.get("subnational"))
    cheat_sheet_count = sum(
        1 for c in countries.values() if not c.get("isBasicEntry") and c.get("examCheatSheet")
    )
    if detailed_count < 130 or total_cities < 158:
        errors.append(f"詳細収録国数({detailed_count}<130)または気候都市数({total_cities}<158)が不足しています")
    if subnational_count < 20:
        errors.append(f"国内地域区分データ保有国数({subnational_count}<20)が不足しています")
    if cheat_sheet_count < 130:
        errors.append(f"国別要点カード保有国数({cheat_sheet_count}<130)が不足しています")
    for guard_iso, max_cnt in (("MAC", 5), ("MDV", 5)):
        cnt = countries.get(guard_iso, {}).get("examSummary", {}).get("appearanceCount", 0)
        if cnt > max_cnt:
            errors.append(f"過去問誤爆回帰エラー: {guard_iso} appearanceCount={cnt} > {max_cnt}")
    if len(wr.get("items", [])) < 130 or len(wr.get("scatters", [])) < 9 or len(wr.get("comparisonCharts", [])) < 24 or len(wr.get("flowMaps", [])) < 10:
        errors.append("world_rankings_v1.json の品目(130以上)・散布図(9以上)・比較グラフ(24以上)またはフロー地図数(10以上)が不足しています")
    if len(sg.get("categories", [])) < 7 or len(sg.get("topics", [])) < 45:
        errors.append("systematic_geography_v1.json のカテゴリ数(7以上)またはトピック数(45以上)が不足しています")
    for tp in sg.get("topics", []):
        for req_k in ("title", "summary", "keyPoints", "examTraps", "tags"):
            if not tp.get(req_k):
                errors.append(f"systematic {tp.get('id')}: 必須項目 {req_k} が空または欠落しています")
    dom = jg.get("domesticStats") or {}
    if len(jg.get("regions", [])) < 9 or len(jg.get("mapSkills", [])) < 7 or len(dom.get("charts", [])) < 10 or len(dom.get("prefRankings", [])) < 26:
        errors.append("japan_geography_v1.json の地方・地形図スキル・国内統計データ(グラフ10以上・県ランキング26以上)が不足しています")
    for sk in jg.get("mapSkills", []):
        if not sk.get("checkPoints"):
            errors.append(f"japan mapSkill {sk.get('id')}: checkPoints が空または欠落しています")

    if errors:
        print("VALIDATION FAILED:")
        for e in errors:
            print("  -", e)
        sys.exit(1)

    print(
        f"VALIDATION PASSED! countries={len(countries)} (detailed={detailed_count}, basic={basic_count}, "
        f"subnational={subnational_count}, cheatSheet={cheat_sheet_count}), "
        f"cities={total_cities}, questions={len(questions)}, geo_countries={len(geo_iso3_set)}, "
        f"geo_layers={len(layer_feats)}, plate_boundaries={len(plate_feats)}, "
        f"capitals={len(capitals_json['features'])}, volcanoes={len(volcanoes_json['features'])}, "
        f"places={len(places_json['places'])}"
    )


if __name__ == "__main__":
    main()
