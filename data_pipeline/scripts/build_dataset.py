"""
地域別基礎データ (data_pipeline/raw/countries_base/*.json) と
過去問抽出結果 (data_pipeline/raw/past_exams/*_v1.json) を統合し、
1) app/public/data/countries_v1.json
2) app/public/data/past_exams_v1.json
を自動生成するスクリプト。
"""

import json
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]
RAW_DIR = ROOT_DIR / "data_pipeline" / "raw"
COUNTRIES_BASE_DIR = RAW_DIR / "countries_base"
PAST_EXAMS_DIR = RAW_DIR / "past_exams"
OVERVIEWS_LIFE_PATH = RAW_DIR / "country_overviews_and_life_v1.json"
LIFE_PHOTOS_PATH = RAW_DIR / "life_photos_v1.json"
WORLD_THEMATIC_PATH = RAW_DIR / "world_thematic_v1.json"
COUNTRY_STATS_PATH = RAW_DIR / "country_stats_v1.json"
TOP_CITIES_PATH = RAW_DIR / "country_top_cities_v1.json"
BASIC_COUNTRIES_PATH = RAW_DIR / "world_basic_countries_v1.json"
RELATIONS_PATH = RAW_DIR / "country_relations_v1.json"
HIGHLIGHT_VISUALS_PATH = RAW_DIR / "country_highlight_visuals_v1.json"
SUBNATIONAL_PATH = RAW_DIR / "subnational_regions_v1.json"
GEO_COUNTRIES_PATH = ROOT_DIR / "app" / "public" / "data" / "geo_countries_v1.geojson"
OUT_COUNTRIES = ROOT_DIR / "app" / "public" / "data" / "countries_v1.json"
OUT_PAST_EXAMS = ROOT_DIR / "app" / "public" / "data" / "past_exams_v1.json"

KOPPEN_13_SET = {
    "Af", "Am", "Aw", "BW", "BS", "Cs", "Cw", "Cfa", "Cfb", "Df", "Dw", "ET", "EF",
}

KOPPEN_SUBCODE_RE = re.compile(
    r"(?<![A-Za-z])(BWh|BWk|BSh|BSk|Csa|Csb|Csc|Cwa|Cwb|Cwc|Cfc|Dfa|Dfb|Dfc|Dfd|Dwa|Dwb|Dwc|Dwd|Dsa|Dsb|Dsc|Dsd)(?![A-Za-z])"
)
DUP_SLASH_RE = re.compile(r"\b(BW|BS|Cs|Cw|Cfa|Cfb|Df|Dw)(?:/\1)+\b")


def normalize_koppen_13_code(code: str) -> str:
    c = (code or "").strip()
    if c in KOPPEN_13_SET:
        return c
    if c.startswith("BW"):
        return "BW"
    if c.startswith("BS"):
        return "BS"
    if c.startswith("Cs"):
        return "Cs"
    if c.startswith("Cw"):
        return "Cw"
    if c.startswith("Cfc"):
        return "Cfb"
    if c.startswith("Df") or c.startswith("Ds"):
        return "Df"
    if c.startswith("Dw"):
        return "Dw"
    if c.startswith("ET"):
        return "ET"
    if c.startswith("EF"):
        return "EF"
    return c[:2] if len(c) >= 2 else c


def normalize_koppen_in_text(obj):
    if isinstance(obj, str):
        s = KOPPEN_SUBCODE_RE.sub(lambda m: normalize_koppen_13_code(m.group(0)), obj)
        s = DUP_SLASH_RE.sub(lambda m: m.group(1), s)
        return s
    if isinstance(obj, list):
        return [normalize_koppen_in_text(x) for x in obj]
    if isinstance(obj, dict):
        return {k: normalize_koppen_in_text(v) for k, v in obj.items()}
    return obj

def exam_sort_key(exam_id: str) -> tuple[int, int, str]:
    parts = exam_id.split("_", 1)
    yr = int(parts[0]) if parts[0].isdigit() else 9999
    sess_rank = 0 if len(parts) > 1 and parts[1] == "main" else 1
    return (yr, sess_rank, exam_id)


# 手動で地域代表Sランクを維持する最重要資源・地域大国（出題文中で総称表現が多く単独国名出現数が少なめに出る国）
CORE_REGIONAL_S_COUNTRIES = {"SAU", "NGA"}

GENERIC_TAG_STOPWORDS = {
    "農業", "工業", "気候", "人口", "都市", "貿易", "資源", "エネルギー",
    "宗教", "言語", "観光", "環境", "地形", "河川", "山脈", "地震", "火山",
    "発電", "輸出", "輸入", "経済", "歴史", "民族", "文化", "生活", "地理B",
    "交通", "港湾", "産業", "気候区分", "地図", "統計", "世界遺産", "自然災害",
}


def compute_rank(appearance_count: int, override: str | None, iso3: str = "") -> str:
    # 出題実績による最低ランク保証（誤爆除去後の純出題数に基づく）
    if appearance_count >= 13 or iso3 in CORE_REGIONAL_S_COUNTRIES:
        return "S"
    if appearance_count >= 8:
        return "S" if override == "S" else "A"
    if appearance_count >= 5:
        return "A"
    if appearance_count >= 2:
        if override in ("S", "A"):
            return "A"
        return "B"
    if override in ("A", "B", "C"):
        return override
    if override == "S":
        return "A"
    return "C"


def match_item_exam_refs(item: dict, country_questions: list[dict]) -> list[dict]:
    """個別項目の固有用語（clozeTerms等）と同一国の過去問が一致する設問を精密リンクする。"""
    cloze_tokens = [
        t for t in item.get("clozeTerms", [])
        if len(t) >= 2 and t not in GENERIC_TAG_STOPWORDS
    ]
    tag_tokens = [
        t for t in item.get("tags", [])
        if len(t) >= 2 and t not in GENERIC_TAG_STOPWORDS
    ]
    tokens = list(dict.fromkeys(cloze_tokens + tag_tokens))
    if not tokens:
        return []

    scored_refs: list[tuple[int, dict]] = []
    for q in country_questions:
        q_blob = " ".join(
            [
                q.get("title", ""),
                q.get("promptSummary", ""),
                " ".join(q.get("topicTags", [])),
            ]
        )
        matched_cloze = [t for t in cloze_tokens if t in q_blob]
        matched_tags = [t for t in tag_tokens if t in q_blob and t not in matched_cloze]
        matched = matched_cloze + matched_tags
        if matched:
            score = len(matched_cloze) * 3 + len(matched_tags)
            scored_refs.append(
                (
                    score,
                    {
                        "examId": q["examId"],
                        "questionId": q["questionId"],
                        "questionLabel": f"第{q['daimon']}問 問{q['toi']}",
                        "note": f"関連語句: {', '.join(matched[:2])}",
                    },
                )
            )
    scored_refs.sort(key=lambda pair: -pair[0])
    seen = set()
    unique_refs = []
    for _, r in scored_refs:
        key = r["questionId"]
        if key not in seen:
            seen.add(key)
            unique_refs.append(r)
        if len(unique_refs) >= 3:
            break
    return unique_refs


def main() -> None:
    # 1. 地域別基礎データ読込
    countries: dict[str, dict] = {}
    for p in sorted(COUNTRIES_BASE_DIR.glob("*_v1.json")):
        with p.open("r", encoding="utf-8") as f:
            chunk = json.load(f)
        for iso3, cdata in chunk.items():
            if iso3 in countries:
                raise ValueError(f"Duplicate ISO3 {iso3} in {p.name}")
            countries[iso3] = cdata

    # 2. 過去問抽出データ読込（全収録試験回を年度・本試/追試順に動的統合）
    all_questions: list[dict] = []
    exam_files = sorted(PAST_EXAMS_DIR.glob("*_v1.json"), key=lambda p: exam_sort_key(p.stem.removesuffix("_v1")))
    exam_coverage: list[str] = []
    for ep in exam_files:
        with ep.open("r", encoding="utf-8") as f:
            edata = json.load(f)
        eid = edata.get("examId") or ep.stem.removesuffix("_v1")
        exam_coverage.append(eid)
        all_questions.extend(edata.get("questions", []))

    # 2.5. 概要文・暮らし・写真・世界主題図・関係性・特徴カードデータの読込
    overviews_life = json.loads(OVERVIEWS_LIFE_PATH.read_text(encoding="utf-8"))
    life_photos = json.loads(LIFE_PHOTOS_PATH.read_text(encoding="utf-8"))
    world_thematic = json.loads(WORLD_THEMATIC_PATH.read_text(encoding="utf-8"))
    country_stats = json.loads(COUNTRY_STATS_PATH.read_text(encoding="utf-8"))
    top_cities_data = json.loads(TOP_CITIES_PATH.read_text(encoding="utf-8"))
    relations_data = (
        json.loads(RELATIONS_PATH.read_text(encoding="utf-8"))
        if RELATIONS_PATH.exists()
        else {}
    )
    visuals_data = (
        json.loads(HIGHLIGHT_VISUALS_PATH.read_text(encoding="utf-8"))
        if HIGHLIGHT_VISUALS_PATH.exists()
        else {}
    )
    subnational_data = (
        json.loads(SUBNATIONAL_PATH.read_text(encoding="utf-8"))
        if SUBNATIONAL_PATH.exists()
        else {}
    )

    # 3. 国別出題統計＆個別項目リンク集計
    by_country: dict[str, list[dict]] = {}
    for q in all_questions:
        for iso3 in q.get("relatedCountries", []):
            by_country.setdefault(iso3, []).append(q)

    for iso3, cdata in countries.items():
        c_questions = by_country.get(iso3, [])
        appearance_count = len(c_questions)
        years = sorted(
            list({q["examId"] for q in c_questions}),
            key=exam_sort_key,
        )

        # 既存の手動トピックをベースに、過去問から抽出された頻出トピックも上位補完
        base_summary = cdata.get("examSummary", {})
        override = base_summary.get("manualRankOverride")
        rank = compute_rank(appearance_count, override, iso3)

        freq_topics = list(base_summary.get("frequentTopics", []))
        topic_counts: dict[str, int] = {}
        for q in c_questions:
            for tag in q.get("topicTags", []):
                topic_counts[tag] = topic_counts.get(tag, 0) + 1
        for tag, _ in sorted(topic_counts.items(), key=lambda kv: -kv[1]):
            if len(freq_topics) >= 6:
                break
            if not any(tag in ft for ft in freq_topics):
                freq_topics.append(tag)

        cdata["examSummary"] = {
            "rank": rank,
            "manualRankOverride": override,
            "appearanceCount": appearance_count,
            "years": years,
            "frequentTopics": freq_topics[:6],
        }

        # 各カテゴリの KnowledgeItem に過去問リンクを自動付与
        item_lists = [
            cdata["nature"].get("items", []),
            cdata["industry"].get("agriculture", []),
            cdata["industry"].get("resourcesAndEnergy", []),
            cdata["industry"].get("industrialRegions", []),
            cdata["cultureAndHistory"].get("historicalContext", []),
        ]
        for items in item_lists:
            for item in items:
                refs = match_item_exam_refs(item, c_questions)
                meta = item.setdefault(
                    "examMeta",
                    {"isFrequent": False, "importance": "B", "pastExamRefs": []},
                )
                meta["pastExamRefs"] = refs
                if len(refs) >= 1 and not meta.get("isFrequent"):
                    meta["isFrequent"] = True

        # 概要文・リアルな暮らし・現地写真・主題図データをマージ
        ov_entry = overviews_life.get(iso3)
        if not ov_entry:
            raise ValueError(f"Missing overview/dailyLife entry for {iso3}")
        cdata["quickOverview"] = ov_entry["quickOverview"]
        dl_raw = ov_entry["dailyLife"]
        cdata["dailyLife"] = {
            "summary": dl_raw["summary"],
            "food": dl_raw["food"],
            "housing": dl_raw["housing"],
            "streetNote": dl_raw["streetNote"],
            "photos": life_photos.get(iso3, []),
        }
        thematic_entry = world_thematic.get(iso3)
        if not thematic_entry:
            raise ValueError(f"Missing world_thematic entry for {iso3}")
        cdata["thematic"] = thematic_entry

        stats_entry = country_stats.get(iso3)
        if not stats_entry:
            raise ValueError(f"Missing country_stats entry for {iso3}")
        cdata["stats"] = stats_entry

        tc_entry = top_cities_data.get(iso3)
        if not tc_entry:
            raise ValueError(f"Missing country_top_cities entry for {iso3}")
        cdata["topCities"] = tc_entry.get("topCities", [])
        if tc_entry.get("specialRegions"):
            cdata["specialRegions"] = tc_entry["specialRegions"]

    # 4. 基礎収録国・地域をマージ（詳細60カ国を優先し、未収録国に過去問参照があれば自動リンク）
    if BASIC_COUNTRIES_PATH.exists():
        basic_countries = json.loads(BASIC_COUNTRIES_PATH.read_text(encoding="utf-8"))
        for iso3, bdata in basic_countries.items():
            if iso3 in countries:
                continue
            c_questions = by_country.get(iso3, [])
            appearance_count = len(c_questions)
            years = sorted(
                list({q["examId"] for q in c_questions}),
                key=exam_sort_key,
            )
            bdata["examSummary"]["appearanceCount"] = appearance_count
            bdata["examSummary"]["years"] = years
            bdata["examSummary"]["rank"] = compute_rank(
                appearance_count, bdata["examSummary"].get("manualRankOverride"), iso3
            )
            countries[iso3] = bdata

    # 4.5. 他国との関係・特徴適応ビジュアル・国内地域区分統合 + ケッペン13区分完全統一
    for iso3, cdata in countries.items():
        if iso3 in relations_data:
            cdata["relations"] = relations_data[iso3]
        if iso3 in visuals_data:
            cdata["highlightVisuals"] = visuals_data[iso3]
        if iso3 in subnational_data:
            cdata["subnational"] = subnational_data[iso3]

        countries[iso3] = normalize_koppen_in_text(cdata)
        c_mod = countries[iso3]
        th = c_mod.get("thematic")
        if th and th.get("koppenMain"):
            th["koppenMain"] = normalize_koppen_13_code(th["koppenMain"])
        cl = c_mod.get("climate", {})
        if cl.get("koppenCodes"):
            cl["koppenCodes"] = list(
                dict.fromkeys(normalize_koppen_13_code(k) for k in cl["koppenCodes"])
            )
        for city in cl.get("cities", []):
            if city.get("koppenCode"):
                city["koppenCode"] = normalize_koppen_13_code(city["koppenCode"])

    # 5. geo_countries_v1.geojson へ主題図属性を注入
    geo_countries = json.loads(GEO_COUNTRIES_PATH.read_text(encoding="utf-8"))
    for feat in geo_countries.get("features", []):
        props = feat.setdefault("properties", {})
        g_iso = props.get("iso3")
        t_data = world_thematic.get(g_iso)
        if not t_data:
            raise ValueError(f"Missing world_thematic entry for GeoJSON country {g_iso}")
        for k, v in t_data.items():
            props[k] = v
    GEO_COUNTRIES_PATH.write_text(
        json.dumps(geo_countries, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )

    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    OUT_COUNTRIES.parent.mkdir(parents=True, exist_ok=True)
    with OUT_COUNTRIES.open("w", encoding="utf-8") as f:
        json.dump(
            {
                "schemaVersion": "1.0.0",
                "generatedAt": now_iso,
                "examCoverage": exam_coverage,
                "countries": countries,
            },
            f,
            ensure_ascii=False,
            indent=2,
        )

    with OUT_PAST_EXAMS.open("w", encoding="utf-8") as f:
        json.dump(
            {
                "schemaVersion": "1.0.0",
                "generatedAt": now_iso,
                "questions": all_questions,
            },
            f,
            ensure_ascii=False,
            indent=2,
        )

    total_cities = sum(len(c["climate"]["cities"]) for c in countries.values())
    print(
        f"Built dataset successfully: countries={len(countries)}, "
        f"cities={total_cities}, past_exam_questions={len(all_questions)}"
    )


if __name__ == "__main__":
    main()
