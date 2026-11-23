"""Fetch real demographic, GDP, employment, and age-pyramid stats from World Bank API v2."""

from __future__ import annotations

import json
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]
RAW_DIR = ROOT_DIR / "data_pipeline" / "raw"
TOP_CITIES_PATH = RAW_DIR / "country_top_cities_v1.json"
GEO_COUNTRIES_PATH = ROOT_DIR / "app" / "public" / "data" / "geo_countries_v1.geojson"
OUT_PATH = RAW_DIR / "country_stats_v1.json"

WB_BASE = "https://api.worldbank.org/v2"

AGE_SUFFIXES = [
    ("0-9", ["0004", "0509"]),
    ("10-19", ["1014", "1519"]),
    ("20-29", ["2024", "2529"]),
    ("30-39", ["3034", "3539"]),
    ("40-49", ["4044", "4549"]),
    ("50-59", ["5054", "5559"]),
    ("60-69", ["6064", "6569"]),
    ("70-79", ["7074", "7579"]),
    ("80+", ["80UP"]),
]

INDICATORS = [
    "SP.POP.TOTL",
    "AG.SRF.TOTL.K2",
    "NY.GDP.MKTP.CD",
    "NY.GDP.PCAP.CD",
    "SP.URB.TOTL.IN.ZS",
    "SP.POP.TOTL.FE.ZS",
    "SL.AGR.EMPL.ZS",
    "SL.IND.EMPL.ZS",
    "SL.SRV.EMPL.ZS",
    "SP.DYN.TFRT.IN",
    "SL.TLF.CACT.FE.ZS",
    "BX.TRF.PWKR.DT.GD.ZS",
] + [
    f"SP.POP.{code}.{sex}.5Y"
    for _, codes in AGE_SUFFIXES
    for code in codes
    for sex in ("MA", "FE")
]

POP_HISTORY_ISOS = [
    "JPN", "KOR", "CHN", "IND", "IDN", "PHL", "BGD", "PAK",
    "NGA", "ETH", "KEN", "EGY", "USA", "CAN", "AUS", "BRA",
    "MEX", "RUS", "UKR", "DEU", "FRA", "ITA", "GBR", "ARE", "SAU",
]

# Fallbacks for non-WB territories (e.g. TWN) or missing recent series (e.g. VEN GDP)
FALLBACK_OVERRIDES: dict[str, dict] = {
    "TWN": {
        "population": 23400000,
        "areaKm2": 36197,
        "gdpBillionUsd": 790.0,
        "gdpPerCapitaUsd": 33760,
        "gdpWorldRank": 21,
        "urbanPopRatePct": 80.5,
        "femaleSharePct": 50.4,
        "sectorShare": {"primaryPct": 4.4, "secondaryPct": 35.1, "tertiaryPct": 60.5},
        "pyramidType": "つぼ型（少子高齢化）",
        "agePyramid": [
            {"ageGroup": "0-9", "malePct": 3.9, "femalePct": 3.6},
            {"ageGroup": "10-19", "malePct": 4.5, "femalePct": 4.2},
            {"ageGroup": "20-29", "malePct": 6.2, "femalePct": 5.8},
            {"ageGroup": "30-39", "malePct": 6.8, "femalePct": 6.7},
            {"ageGroup": "40-49", "malePct": 7.9, "femalePct": 8.1},
            {"ageGroup": "50-59", "malePct": 7.4, "femalePct": 7.7},
            {"ageGroup": "60-69", "malePct": 6.7, "femalePct": 7.3},
            {"ageGroup": "70-79", "malePct": 4.0, "femalePct": 4.7},
            {"ageGroup": "80+", "malePct": 2.2, "femalePct": 2.3},
        ],
        "dataYear": "2024",
    },
    "VEN": {
        "gdpBillionUsd": 106.0,
        "gdpPerCapitaUsd": 3740,
        "gdpWorldRank": 65,
    },
    "PRK": {
        "gdpBillionUsd": 28.0,
        "gdpPerCapitaUsd": 1050,
    },
    "KOS": {
        "population": 1760000,
        "areaKm2": 10887,
        "gdpBillionUsd": 11.2,
        "gdpPerCapitaUsd": 6360,
        "urbanPopRatePct": 62.0,
        "sectorShare": {"primaryPct": 4.5, "secondaryPct": 28.0, "tertiaryPct": 67.5},
        "pyramidType": "釣鐘型（人口安定期）",
    },
    "CYN": {
        "population": 382800,
        "areaKm2": 3355,
        "gdpBillionUsd": 4.2,
        "gdpPerCapitaUsd": 11000,
        "urbanPopRatePct": 66.0,
        "sectorShare": {"primaryPct": 4.0, "secondaryPct": 22.0, "tertiaryPct": 74.0},
        "pyramidType": "釣鐘型（人口安定期）",
    },
    "ESH": {
        "population": 590000,
        "areaKm2": 266000,
        "gdpBillionUsd": 0.9,
        "gdpPerCapitaUsd": 1525,
        "urbanPopRatePct": 86.0,
        "sectorShare": {"primaryPct": 35.0, "secondaryPct": 20.0, "tertiaryPct": 45.0},
        "pyramidType": "富士山型（若年比率高）",
    },
    "SOL": {
        "population": 4500000,
        "areaKm2": 176120,
        "gdpBillionUsd": 2.5,
        "gdpPerCapitaUsd": 555,
        "urbanPopRatePct": 52.0,
        "sectorShare": {"primaryPct": 60.0, "secondaryPct": 12.0, "tertiaryPct": 28.0},
        "pyramidType": "富士山型（多産・若年人口急増）",
    },
    "FLK": {
        "population": 3660,
        "areaKm2": 12173,
        "gdpBillionUsd": 0.3,
        "gdpPerCapitaUsd": 82000,
        "urbanPopRatePct": 78.0,
        "sectorShare": {"primaryPct": 38.0, "secondaryPct": 12.0, "tertiaryPct": 50.0},
        "pyramidType": "釣鐘型（人口安定期）",
    },
    "ATF": {
        "population": 200,
        "areaKm2": 7781,
        "gdpBillionUsd": 0.01,
        "gdpPerCapitaUsd": 0,
        "urbanPopRatePct": 0.0,
        "sectorShare": {"primaryPct": 10.0, "secondaryPct": 10.0, "tertiaryPct": 80.0},
        "pyramidType": "観測隊滞在のみ",
    },
    "ATA": {
        "population": 4000,
        "areaKm2": 14200000,
        "gdpBillionUsd": 0.01,
        "gdpPerCapitaUsd": 0,
        "urbanPopRatePct": 0.0,
        "sectorShare": {"primaryPct": 0.0, "secondaryPct": 0.0, "tertiaryPct": 100.0},
        "pyramidType": "越冬観測隊のみ（定住人口なし）",
    },
    "VAT": {
        "population": 825,
        "areaKm2": 1,
        "gdpBillionUsd": 0.02,
        "gdpPerCapitaUsd": 21000,
        "urbanPopRatePct": 100.0,
        "sectorShare": {"primaryPct": 0.0, "secondaryPct": 5.0, "tertiaryPct": 95.0},
        "pyramidType": "聖職者・職員中心（特殊な都市国家）",
    },
    "MCO": {
        "population": 39000,
        "areaKm2": 2,
        "gdpBillionUsd": 8.8,
        "gdpPerCapitaUsd": 225000,
        "urbanPopRatePct": 100.0,
        "sectorShare": {"primaryPct": 0.1, "secondaryPct": 10.9, "tertiaryPct": 89.0},
        "pyramidType": "つぼ型（超高齢化・富裕層流入）",
    },
    "SMR": {
        "population": 33600,
        "areaKm2": 61,
        "gdpBillionUsd": 1.9,
        "gdpPerCapitaUsd": 56500,
        "urbanPopRatePct": 97.7,
        "sectorShare": {"primaryPct": 0.5, "secondaryPct": 32.0, "tertiaryPct": 67.5},
        "pyramidType": "つぼ型（少子高齢化）",
    },
    "AND": {
        "population": 81000,
        "areaKm2": 468,
        "gdpBillionUsd": 3.7,
        "gdpPerCapitaUsd": 45600,
        "urbanPopRatePct": 87.8,
        "sectorShare": {"primaryPct": 0.5, "secondaryPct": 12.5, "tertiaryPct": 87.0},
        "pyramidType": "つぼ型（観光・商業立国）",
    },
    "LIE": {
        "population": 39600,
        "areaKm2": 160,
        "gdpBillionUsd": 7.4,
        "gdpPerCapitaUsd": 186000,
        "urbanPopRatePct": 14.7,
        "sectorShare": {"primaryPct": 0.8, "secondaryPct": 36.2, "tertiaryPct": 63.0},
        "pyramidType": "つぼ型（精密製造・金融）",
    },
    "COK": {"population": 17000, "areaKm2": 236, "gdpBillionUsd": 0.36, "gdpPerCapitaUsd": 21000, "urbanPopRatePct": 76.0},
    "NIU": {"population": 1900, "areaKm2": 260, "gdpBillionUsd": 0.03, "gdpPerCapitaUsd": 16000, "urbanPopRatePct": 47.0},
    "GGY": {"population": 64000, "areaKm2": 65, "gdpBillionUsd": 4.1, "gdpPerCapitaUsd": 64000, "urbanPopRatePct": 31.0},
    "JEY": {"population": 103000, "areaKm2": 116, "gdpBillionUsd": 6.8, "gdpPerCapitaUsd": 66000, "urbanPopRatePct": 31.0},
    "AIA": {"population": 15900, "areaKm2": 91, "gdpBillionUsd": 0.3, "gdpPerCapitaUsd": 18800, "urbanPopRatePct": 100.0},
    "MSR": {"population": 4400, "areaKm2": 102, "gdpBillionUsd": 0.08, "gdpPerCapitaUsd": 18000, "urbanPopRatePct": 9.0},
    "SHN": {"population": 4400, "areaKm2": 122, "gdpBillionUsd": 0.05, "gdpPerCapitaUsd": 11000, "urbanPopRatePct": 40.0},
    "SPM": {"population": 5800, "areaKm2": 242, "gdpBillionUsd": 0.26, "gdpPerCapitaUsd": 44800, "urbanPopRatePct": 90.0},
    "WLF": {"population": 11500, "areaKm2": 142, "gdpBillionUsd": 0.2, "gdpPerCapitaUsd": 17400, "urbanPopRatePct": 0.0},
    "PCN": {"population": 47, "areaKm2": 47, "gdpBillionUsd": 0.001, "gdpPerCapitaUsd": 4000, "urbanPopRatePct": 0.0},
    "IOT": {"population": 3000, "areaKm2": 60, "gdpBillionUsd": 0.01, "gdpPerCapitaUsd": 0, "urbanPopRatePct": 0.0},
    "ALA": {"population": 30500, "areaKm2": 1580, "gdpBillionUsd": 1.6, "gdpPerCapitaUsd": 52000, "urbanPopRatePct": 41.0},
    "NFK": {"population": 2200, "areaKm2": 35, "gdpBillionUsd": 0.08, "gdpPerCapitaUsd": 36000, "urbanPopRatePct": 0.0},
    "GLP": {"population": 383000, "areaKm2": 1628, "gdpBillionUsd": 10.5, "gdpPerCapitaUsd": 27400, "urbanPopRatePct": 98.0},
    "BLM": {"population": 10500, "areaKm2": 25, "gdpBillionUsd": 0.5, "gdpPerCapitaUsd": 47000, "urbanPopRatePct": 100.0},
    "SGS": {"population": 30, "areaKm2": 3903, "gdpBillionUsd": 0.001, "gdpPerCapitaUsd": 0, "urbanPopRatePct": 0.0},
    "ASH": {"population": 0, "areaKm2": 5, "gdpBillionUsd": 0.0, "gdpPerCapitaUsd": 0, "urbanPopRatePct": 0.0},
    "CSI": {"population": 4, "areaKm2": 3, "gdpBillionUsd": 0.0, "gdpPerCapitaUsd": 0, "urbanPopRatePct": 0.0},
}

DEFAULT_PYRAMID_BINS = [
    {"ageGroup": "0-9", "malePct": 7.5, "femalePct": 7.2},
    {"ageGroup": "10-19", "malePct": 7.4, "femalePct": 7.1},
    {"ageGroup": "20-29", "malePct": 7.6, "femalePct": 7.3},
    {"ageGroup": "30-39", "malePct": 7.2, "femalePct": 7.0},
    {"ageGroup": "40-49", "malePct": 6.5, "femalePct": 6.4},
    {"ageGroup": "50-59", "malePct": 5.5, "femalePct": 5.6},
    {"ageGroup": "60-69", "malePct": 4.2, "femalePct": 4.5},
    {"ageGroup": "70-79", "malePct": 2.4, "femalePct": 2.8},
    {"ageGroup": "80+", "malePct": 1.1, "femalePct": 1.5},
]


def fetch_json(url: str) -> list:
    req = urllib.request.Request(url, headers={"User-Agent": "kyoute-chiri-edu/1.0"})
    with urllib.request.urlopen(req, timeout=25) as r:
        return json.loads(r.read().decode("utf-8"))


def fetch_indicator(iso_list: list[str], ind: str) -> tuple[str, dict[str, tuple[float, str]]]:
    out: dict[str, tuple[float, str]] = {}

    def _query_batch(isos: list[str]) -> bool:
        url = f"{WB_BASE}/country/{';'.join(isos)}/indicator/{ind}?format=json&mrnev=1&per_page=250"
        try:
            payload = fetch_json(url)
        except Exception:
            return False
        if not isinstance(payload, list) or len(payload) < 2 or not isinstance(payload[1], list):
            return False
        for row in payload[1]:
            iso = row.get("countryiso3code")
            val = row.get("value")
            yr = str(row.get("date") or "")
            if iso and val is not None:
                out[iso] = (float(val), yr)
        return True

    for i in range(0, len(iso_list), 25):
        chunk = iso_list[i : i + 25]
        if not _query_batch(chunk):
            for single_iso in chunk:
                _query_batch([single_iso])
    return ind, out


def fetch_global_gdp_ranks() -> tuple[dict[str, int], set[str]]:
    """Compute nominal GDP world ranks across sovereign countries from World Bank."""
    c_meta = fetch_json(f"{WB_BASE}/country?format=json&per_page=500")
    records = c_meta[1] or []
    valid_wb_isos = {r["id"] for r in records if r.get("id")}
    sovereign_isos = {
        r["id"]
        for r in records
        if r.get("region", {}).get("id") not in (None, "NA", "")
    }
    gdp_payload = fetch_json(
        f"{WB_BASE}/country/all/indicator/NY.GDP.MKTP.CD?format=json&date=2022:2025&per_page=2000"
    )
    latest_by_iso: dict[str, tuple[str, float]] = {}
    for row in (gdp_payload[1] or []):
        iso = row.get("countryiso3code")
        val = row.get("value")
        yr = str(row.get("date") or "")
        if iso in sovereign_isos and val is not None and float(val) > 0:
            prev = latest_by_iso.get(iso)
            if not prev or yr > prev[0]:
                latest_by_iso[iso] = (yr, float(val))
    gdps = sorted(((iso, v[1]) for iso, v in latest_by_iso.items()), key=lambda kv: -kv[1])
    return {iso: idx + 1 for idx, (iso, _) in enumerate(gdps)}, valid_wb_isos


def fetch_pop_history(valid_wb_isos: set[str]) -> dict[str, list[dict]]:
    """Fetch 1960-2024 population history for key demographic transition countries."""
    target = [iso for iso in POP_HISTORY_ISOS if iso in valid_wb_isos]
    raw_by_iso: dict[str, dict[str, float]] = {}
    for i in range(0, len(target), 10):
        chunk = target[i : i + 10]
        url = (
            f"{WB_BASE}/country/{';'.join(chunk)}/indicator/SP.POP.TOTL"
            "?format=json&date=1960:2024&per_page=2000"
        )
        try:
            payload = fetch_json(url)
        except Exception:
            continue
        rows = payload[1] if isinstance(payload, list) and len(payload) > 1 and isinstance(payload[1], list) else []
        for row in rows:
            iso = row.get("countryiso3code")
            yr = str(row.get("date") or "")
            val = row.get("value")
            if iso and yr and val is not None:
                raw_by_iso.setdefault(iso, {})[yr] = float(val)

    milestones = ("1960", "1970", "1980", "1990", "2000", "2010", "2020", "2024")
    history_out: dict[str, list[dict]] = {}
    for iso, by_yr in raw_by_iso.items():
        pts: list[dict] = []
        for y in milestones:
            if y == "2024" and "2024" not in by_yr and "2023" in by_yr:
                pts.append({"year": "2023", "popMan": round(by_yr["2023"] / 10000)})
            elif y in by_yr:
                pts.append({"year": y, "popMan": round(by_yr[y] / 10000)})
        if len(pts) >= 5:
            history_out[iso] = pts
    return history_out


def classify_pyramid(iso3: str, bins: list[dict[str, float]]) -> str:
    young = sum(b["malePct"] + b["femalePct"] for b in bins[:2])  # 0-19
    adult = sum(b["malePct"] + b["femalePct"] for b in bins[2:6])  # 20-59
    elder = sum(b["malePct"] + b["femalePct"] for b in bins[6:])  # 60+
    m_work = sum(b["malePct"] for b in bins[2:5])
    f_work = sum(b["femalePct"] for b in bins[2:5])
    if iso3 in ("ARE", "SAU") or (f_work > 0 and m_work / f_work > 1.35):
        return "出稼ぎ男性突出型（湾岸産油国型）"
    if young >= 40.0 and elder < 9.0:
        return "富士山型（多産・若年人口急増）"
    if young < 20.0 and elder >= 24.0:
        return "つぼ型（少子高齢化・人口減少/停滞）"
    if elder >= 20.0:
        return "つぼ型・釣鐘型移行（少子高齢化進展）"
    if adult >= 54.0:
        return "星型・都市労働集中型（人口ボーナス期）" if young >= 25.0 else "釣鐘型〜つぼ型（少子化進行）"
    return "釣鐘型（人口安定期）"


def main() -> None:
    geo_feats = json.loads(GEO_COUNTRIES_PATH.read_text(encoding="utf-8")).get("features", [])
    geo_isos = {f["properties"]["iso3"] for f in geo_feats if f.get("properties", {}).get("iso3")}
    top_isos = set(json.loads(TOP_CITIES_PATH.read_text(encoding="utf-8")).keys())
    target_isos = sorted(geo_isos | top_isos)

    global_ranks, valid_wb_isos = fetch_global_gdp_ranks()
    wb_isos = [iso for iso in target_isos if iso in valid_wb_isos]
    print(f"Fetching global GDP ranks and {len(INDICATORS)} World Bank indicators for {len(wb_isos)} / {len(target_isos)} territories...")
    pop_history_map = fetch_pop_history(valid_wb_isos)

    ind_data: dict[str, dict[str, tuple[float, str]]] = {}
    with ThreadPoolExecutor(max_workers=8) as ex:
        futures = {ex.submit(fetch_indicator, wb_isos, ind): ind for ind in INDICATORS}
        for fut in as_completed(futures):
            ind, res = fut.result()
            ind_data[ind] = res

    stats_out: dict[str, dict] = {}
    for iso in target_isos:
        if iso == "TWN":
            fb = FALLBACK_OVERRIDES["TWN"]
            stats_out[iso] = {
                "population": fb["population"],
                "areaKm2": fb["areaKm2"],
                "populationDensity": round(fb["population"] / fb["areaKm2"], 1),
                "gdpBillionUsd": fb["gdpBillionUsd"],
                "gdpPerCapitaUsd": fb["gdpPerCapitaUsd"],
                "gdpWorldRank": fb["gdpWorldRank"],
                "urbanPopRatePct": fb["urbanPopRatePct"],
                "sectorShare": fb["sectorShare"],
                "agePyramid": fb["agePyramid"],
                "pyramidType": fb["pyramidType"],
                "dataYear": fb["dataYear"],
            }
            continue

        def get_val(ind: str) -> tuple[float | None, str]:
            pair = ind_data.get(ind, {}).get(iso)
            return pair if pair else (None, "")

        pop, pop_yr = get_val("SP.POP.TOTL")
        area, _ = get_val("AG.SRF.TOTL.K2")
        gdp_raw, gdp_yr = get_val("NY.GDP.MKTP.CD")
        gdp_pc, _ = get_val("NY.GDP.PCAP.CD")
        urb, _ = get_val("SP.URB.TOTL.IN.ZS")
        fe_share, _ = get_val("SP.POP.TOTL.FE.ZS")
        s1, _ = get_val("SL.AGR.EMPL.ZS")
        s2, _ = get_val("SL.IND.EMPL.ZS")
        s3, _ = get_val("SL.SRV.EMPL.ZS")
        tfr, _ = get_val("SP.DYN.TFRT.IN")
        flab, _ = get_val("SL.TLF.CACT.FE.ZS")
        remit, _ = get_val("BX.TRF.PWKR.DT.GD.ZS")

        fb = FALLBACK_OVERRIDES.get(iso, {})
        population = int(round(pop)) if pop is not None else int(fb.get("population", 50000))
        area_km2 = round(area, 1) if area is not None else float(fb.get("areaKm2", 50))
        density = round(population / area_km2, 1) if area_km2 > 0 else 0.0
        gdp_billion = (
            round(gdp_raw / 1e9, 2)
            if gdp_raw is not None
            else float(fb.get("gdpBillionUsd", 0.5))
        )
        gdp_per_capita = (
            int(round(gdp_pc))
            if gdp_pc is not None
            else int(fb.get("gdpPerCapitaUsd", 10000))
        )
        gdp_rank = global_ranks.get(iso) or fb.get("gdpWorldRank")

        # Normalize sector employment share to sum to 100.0
        p1 = s1 if s1 is not None else 0.0
        p2 = s2 if s2 is not None else 0.0
        p3 = s3 if s3 is not None else 0.0
        tot_s = p1 + p2 + p3
        if tot_s > 0:
            p1_n = round(p1 / tot_s * 100.0, 1)
            p2_n = round(p2 / tot_s * 100.0, 1)
            p3_n = round(100.0 - p1_n - p2_n, 1)
        elif "sectorShare" in fb:
            sh = fb["sectorShare"]
            p1_n, p2_n, p3_n = sh["primaryPct"], sh["secondaryPct"], sh["tertiaryPct"]
        else:
            p1_n, p2_n, p3_n = 15.0, 22.0, 63.0

        fe_ratio = (fe_share / 100.0) if fe_share is not None else 0.5
        ma_ratio = 1.0 - fe_ratio

        bins: list[dict] = []
        for label, codes in AGE_SUFFIXES:
            m_sum = 0.0
            f_sum = 0.0
            for code in codes:
                mv, _ = get_val(f"SP.POP.{code}.MA.5Y")
                fv, _ = get_val(f"SP.POP.{code}.FE.5Y")
                m_sum += (mv or 0.0) * ma_ratio
                f_sum += (fv or 0.0) * fe_ratio
            bins.append(
                {
                    "ageGroup": label,
                    "malePct": round(m_sum, 2),
                    "femalePct": round(f_sum, 2),
                }
            )
        if sum(b["malePct"] + b["femalePct"] for b in bins) < 50.0:
            bins = DEFAULT_PYRAMID_BINS

        urb_val = round(urb, 1) if urb is not None else float(fb.get("urbanPopRatePct", 50.0))

        entry = {
            "population": population,
            "areaKm2": round(area_km2),
            "populationDensity": density,
            "gdpBillionUsd": gdp_billion,
            "gdpPerCapitaUsd": gdp_per_capita,
            "gdpWorldRank": gdp_rank,
            "urbanPopRatePct": urb_val,
            "sectorShare": {
                "primaryPct": p1_n,
                "secondaryPct": p2_n,
                "tertiaryPct": p3_n,
            },
            "agePyramid": bins,
            "pyramidType": fb.get("pyramidType") or classify_pyramid(iso, bins),
            "fertilityRate": round(tfr, 2) if tfr is not None else None,
            "femaleLaborPct": round(flab, 1) if flab is not None else None,
            "remittanceGdpPct": round(remit, 1) if remit is not None else None,
            "dataYear": pop_yr or gdp_yr or "2024",
        }
        if iso in pop_history_map:
            entry["popHistory"] = pop_history_map[iso]
        stats_out[iso] = entry

    assert stats_out["JPN"]["population"] > 100_000_000, f"JPN pop invalid: {stats_out['JPN']['population']}"
    assert stats_out["IND"]["population"] > 1_000_000_000, f"IND pop invalid: {stats_out['IND']['population']}"
    assert stats_out["USA"]["population"] > 300_000_000, f"USA pop invalid: {stats_out['USA']['population']}"

    OUT_PATH.write_text(json.dumps(stats_out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Saved stats for {len(stats_out)} countries to {OUT_PATH}")
    # Quick diagnostic summary
    for sample_iso in ["JPN", "USA", "CHN", "IND", "ARE", "NGA", "TWN", "VEN"]:
        s = stats_out[sample_iso]
        print(
            f"  {sample_iso}: pop={s['population']:,}, area={s['areaKm2']:,}, "
            f"dens={s['populationDensity']}, gdp=${s['gdpBillionUsd']}B (#{s['gdpWorldRank']}), "
            f"pc=${s['gdpPerCapitaUsd']:,}, urb={s['urbanPopRatePct']}%, "
            f"sec={s['sectorShare']}, pyr={s['pyramidType']}"
        )


if __name__ == "__main__":
    main()
