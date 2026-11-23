"""Build high-precision app/public/data/geo_countries_v1.geojson from Natural Earth 50m and fill missing world_thematic_v1 entries."""

from __future__ import annotations

import io
import json
import math
import urllib.request
import zipfile
from pathlib import Path

import numpy as np
from PIL import Image

ROOT_DIR = Path(__file__).resolve().parents[2]
RAW_DIR = ROOT_DIR / "data_pipeline" / "raw"
DATA_DIR = ROOT_DIR / "app" / "public" / "data"
CACHE_DIR = Path(
    r"C:\Users\souosu\.gemini\antigravity\brain\6ae25a4e-afe3-408a-9994-ff75540ec085\scratch\worldclim_cache"
)

NE50_URL = (
    "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson"
)
OLD_GEO_PATH = DATA_DIR / "geo_countries_v1.geojson"
WORLD_THEMATIC_PATH = RAW_DIR / "world_thematic_v1.json"
OUT_GEO_PATH = DATA_DIR / "geo_countries_v1.geojson"

KOPPEN_13_CODES = [
    "", "Af", "Am", "Aw", "BW", "BS", "Cs", "Cw", "Cfa", "Cfb", "Df", "Dw", "ET", "EF",
]

NAME_JA_EXTRA: dict[str, str] = {
    "ABW": "アルバ", "AIA": "アンギラ", "ALA": "オーランド諸島", "AND": "アンドラ",
    "ASM": "アメリカ領サモア", "ATG": "アンティグア・バーブーダ", "BHR": "バーレーン",
    "BLM": "サン・バルテルミー島", "BMU": "バミューダ諸島", "BRB": "バルバドス",
    "COK": "クック諸島", "COM": "コモロ", "CPV": "カーボベルデ", "CUW": "キュラソー",
    "CYM": "ケイマン諸島", "DMA": "ドミニカ国", "FLK": "フォークランド諸島",
    "FRO": "フェロー諸島", "FSM": "ミクロネシア連邦", "GGY": "ガーンジー",
    "GIB": "ジブラルタル", "GLP": "グアドループ", "GRD": "グレナダ", "GUM": "グアム",
    "HKG": "香港", "IMN": "マン島", "IOT": "英領インド洋地域", "JEY": "ジャージー",
    "KNA": "セントクリストファー・ネイビス", "KIR": "キリバス", "LCA": "セントルシア",
    "LIE": "リヒテンシュタイン", "MAC": "マカオ", "MAF": "サン・マルタン",
    "MCO": "モナコ", "MDV": "モルディブ", "MHL": "マーシャル諸島", "MLT": "マルタ",
    "MNP": "北マリアナ諸島", "MSR": "モントセラト", "MUS": "モーリシャス",
    "NFK": "ノーフォーク島", "NIU": "ニウエ", "NRU": "ナウル", "PCN": "ピトケアン諸島",
    "PLW": "パラオ", "PYF": "フランス領ポリネシア", "SGS": "サウスジョージア・サウスサンドウィッチ諸島",
    "SHN": "セントヘレナ", "SMR": "サンマリノ", "SPM": "サンピエール島・ミクロン島",
    "STP": "サントメ・プリンシペ", "SXM": "シント・マールテン", "SYC": "セーシェル",
    "TCA": "タークス・カイコス諸島", "TON": "トンガ", "TUV": "ツバル",
    "VAT": "バチカン市国", "VCT": "セントビンセント・グレナディーン",
    "VGB": "英領バージン諸島", "VIR": "米領バージン諸島", "WLF": "ウォリス・フツナ",
    "WSM": "サモア", "ASH": "アシュモア・カルティエ諸島", "CSI": "コーラル・シー諸島",
    "SGS": "サウスジョージア諸島",
}


def normalize_koppen_13(code: str) -> str:
    c = (code or "").strip()
    if c.startswith("BW"):
        return "BW"
    if c.startswith("BS"):
        return "BS"
    if c.startswith("Cs"):
        return "Cs"
    if c.startswith("Cw"):
        return "Cw"
    if c == "Cfc":
        return "Cfb"
    if c.startswith("Dw"):
        return "Dw"
    if c.startswith("D"):
        return "Df"
    if c.startswith("ETH"):
        return "ET"
    if c in KOPPEN_13_CODES[1:]:
        return c
    return "Cfa"


def download_cached_ne50() -> dict:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    target = CACHE_DIR / "ne_50m_admin_0_countries.geojson"
    if target.exists() and target.stat().st_size > 1_000_000:
        print(f"Using cached {target.name}")
    else:
        print(f"Downloading {NE50_URL} ...")
        req = urllib.request.Request(NE50_URL, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=60) as resp:
            target.write_bytes(resp.read())
        print(f"Saved {target.name} ({target.stat().st_size / 1e6:.2f} MB)")
    return json.loads(target.read_text(encoding="utf-8"))


def pick_iso3(props: dict) -> str:
    for key in ("ISO_A3_EH", "ADM0_A3", "ISO_A3", "SOV_A3"):
        val = (props.get(key) or "").strip()
        if val and val != "-99":
            return val
    return "UNK"


def dp_simplify(pts: list[list[float]], tol: float) -> list[list[float]]:
    if len(pts) <= 6 or tol <= 0:
        return pts
    # Keep closed ring invariant by checking open path
    closed = len(pts) >= 4 and pts[0] == pts[-1]
    work = pts[:-1] if closed else pts

    def _rec(arr: list[list[float]], eps: float) -> list[list[float]]:
        if len(arr) <= 2:
            return arr
        x1, y1 = arr[0][0], arr[0][1]
        x2, y2 = arr[-1][0], arr[-1][1]
        dx, dy = x2 - x1, y2 - y1
        denom = math.hypot(dx, dy)
        max_d = -1.0
        idx = 0
        for i in range(1, len(arr) - 1):
            px, py = arr[i][0], arr[i][1]
            if denom < 1e-12:
                d = math.hypot(px - x1, py - y1)
            else:
                d = abs(dy * px - dx * py + x2 * y1 - y2 * x1) / denom
            if d > max_d:
                max_d = d
                idx = i
        if max_d > eps:
            left = _rec(arr[: idx + 1], eps)
            right = _rec(arr[idx:], eps)
            return left[:-1] + right
        return [arr[0], arr[-1]]

    # Guard for tiny closed rings: avoid collapsing below 4 vertices
    res = _rec(work, tol)
    if closed:
        if len(res) < 3:
            res = work
        res = res + [res[0]]
    return [[round(p[0], 4), round(p[1], 4)] for p in res]


def ring_area_bbox(ring: list[list[float]]) -> tuple[float, float, float]:
    xs = [p[0] for p in ring]
    ys = [p[1] for p in ring]
    bbox_area = (max(xs) - min(xs)) * (max(ys) - min(ys))
    # Signed area for centroid heuristic
    area = 0.0
    for i in range(len(ring) - 1):
        area += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1]
    return bbox_area, abs(area) * 0.5, sum(xs) / len(xs), sum(ys) / len(ys)  # type: ignore


def simplify_geometry(geom: dict, tol: float) -> tuple[dict, float, float, float]:
    gtype = geom["type"]
    polys = [geom["coordinates"]] if gtype == "Polygon" else geom["coordinates"]
    new_polys = []
    total_area = 0.0
    best_poly_area = -1.0
    rep_lon, rep_lat = 0.0, 0.0

    for poly in polys:
        if not poly:
            continue
        outer = poly[0]
        xs = [p[0] for p in outer]
        ys = [p[1] for p in outer]
        bbox_a = (max(xs) - min(xs)) * (max(ys) - min(ys))
        total_area += bbox_a
        # Never over-simplify microstates / small islands!
        local_tol = 0.0 if (bbox_a < 1.2 or len(outer) <= 24) else tol
        out_rings = [dp_simplify(outer, local_tol)]
        for hole in poly[1:]:
            if len(hole) >= 4:
                h_xs = [p[0] for p in hole]
                h_ys = [p[1] for p in hole]
                h_bbox = (max(h_xs) - min(h_xs)) * (max(h_ys) - min(h_ys))
                if h_bbox >= 0.005:
                    out_rings.append(dp_simplify(hole, 0.0 if h_bbox < 1.0 else tol))
        new_polys.append(out_rings)
        if bbox_a > best_poly_area:
            best_poly_area = bbox_a
            rep_lon = sum(xs) / len(xs)
            rep_lat = sum(ys) / len(ys)

    if len(new_polys) == 1:
        return {"type": "Polygon", "coordinates": new_polys[0]}, total_area, rep_lon, rep_lat
    return {"type": "MultiPolygon", "coordinates": new_polys}, total_area, rep_lon, rep_lat


def load_worldclim_sampler():
    elev_zip = CACHE_DIR / "wc2.1_10m_elev.zip"
    prec_zip = CACHE_DIR / "wc2.1_10m_prec.zip"
    tavg_zip = CACHE_DIR / "wc2.1_10m_tavg.zip"
    if not (elev_zip.exists() and prec_zip.exists() and tavg_zip.exists()):
        return None
    with zipfile.ZipFile(elev_zip) as zf:
        tif = sorted(n for n in zf.namelist() if n.endswith(".tif"))[0]
        elev = np.array(Image.open(io.BytesIO(zf.read(tif))))
    with zipfile.ZipFile(prec_zip) as zf:
        tifs = sorted(n for n in zf.namelist() if n.endswith(".tif"))
        pann = np.sum([np.clip(np.array(Image.open(io.BytesIO(zf.read(n))), dtype=np.float32), 0, 20000) for n in tifs], axis=0)
    grid_path = DATA_DIR / "thematic_grid_v1.json"
    grid = json.loads(grid_path.read_text(encoding="utf-8")) if grid_path.exists() else None
    return elev, pann, grid


def infer_thematic_for_country(
    iso: str,
    cont: str,
    lon: float,
    lat: float,
    wc_sampler,
) -> dict:
    # Elevation, precip, koppen from cached WorldClim / thematic_grid
    kop_code = "Cfa"
    elev_m = 120
    precip_mm = 1000
    if wc_sampler is not None:
        elev_arr, pann_arr, grid = wc_sampler
        h, w = elev_arr.shape
        col = int((lon + 180.0) / 360.0 * w) % w
        row = max(0, min(h - 1, int((90.0 - lat) / 180.0 * h)))
        ev = int(elev_arr[row, col])
        if ev > -1000:
            elev_m = max(1, ev)
        pv = float(pann_arr[row, col])
        if pv >= 0:
            precip_mm = max(10, round(pv))
        if grid:
            gc = int((((lon + 180.0) % 360.0) + 360.0) % 360.0)
            gc = min(grid["width"] - 1, max(0, gc))
            gr = min(grid["height"] - 1, max(0, int(90.0 - lat)))
            k_hit = grid["koppen"][gr][gc]
            if not k_hit:
                # Try 3x3 neighborhood for tiny islands
                for dr in (-1, 0, 1):
                    for dc in (-1, 0, 1):
                        rr = min(grid["height"] - 1, max(0, gr + dr))
                        cc = (gc + dc) % grid["width"]
                        if grid["koppen"][rr][cc]:
                            k_hit = grid["koppen"][rr][cc]
                            break
                    if k_hit:
                        break
            if k_hit:
                kop_code = normalize_koppen_13(k_hit)

    if abs(lat) < 23.5 and kop_code == "Cfa" and elev_m < 800:
        kop_code = "Aw" if precip_mm < 1800 else "Af"

    kop_group = kop_code[0]

    # Plausible regional agriculture / religion / language defaults
    ag_default = {
        "Europe": "園芸農業" if iso in ("VAT", "MCO", "SMR", "LIE", "AND", "GIB") else "地中海式農業" if lat < 44.5 else "混合農業",
        "Oceania": "焼畑農業・自給的農業" if abs(lat) < 25 else "酪農",
        "North America": "園芸農業" if abs(lat) < 25 and lon > -90 else "混合農業",
        "Africa": "プランテーション農業" if iso in ("MUS", "SYC", "STP", "CPV") else "焼畑農業・自給的農業",
        "Asia": "園芸農業" if iso in ("SGP", "HKG", "MAC", "BHR") else "オアシス農業" if kop_group == "B" else "アジア式稲作農業",
        "South America": "企業的牧畜",
        "Antarctica": "林業・非農業（寒冷・都市）",
        "Seven seas (open ocean)": "林業・非農業（寒冷・都市）",
    }.get(cont, "園芸農業")

    rel_default = {
        "Europe": "キリスト教（カトリック）" if (lat < 48 or iso in ("VAT", "MCO", "SMR", "AND", "MLT", "LIE")) else "キリスト教（プロテスタント）",
        "South America": "キリスト教（カトリック）",
        "North America": "キリスト教（カトリック）" if lat < 30 else "キリスト教（プロテスタント）",
        "Oceania": "キリスト教（プロテスタント）",
        "Africa": "イスラム教（スンニ派）" if iso in ("COM",) or lat > 12 else "キリスト教（カトリック）",
        "Asia": "イスラム教（スンニ派）" if iso in ("MDV", "BHR") else "東アジア伝統信仰・無宗教" if iso in ("HKG", "MAC") else "イスラム教（スンニ派）",
    }.get(cont, "伝統信仰・無宗教（欧米等）")
    if iso in ("MDV", "BHR", "COM"):
        rel_default = "イスラム教（スンニ派）"
    if iso == "MUS":
        rel_default = "ヒンドゥー教"

    lang_default = {
        "Europe": "印欧語族（ロマンス語派）" if iso in ("VAT", "MCO", "SMR", "AND") else "印欧語族（ゲルマン語派）",
        "Oceania": "東南アジア・太平洋諸語族",
        "North America": "印欧語族（ゲルマン語派）",
        "South America": "印欧語族（ロマンス語派）",
        "Africa": "ニジェール・コンゴ語族",
        "Asia": "シナ・チベット語族" if iso in ("HKG", "MAC") else "アフロ・アジア語族" if iso == "BHR" else "東南アジア・太平洋諸語族",
    }.get(cont, "印欧語族（ゲルマン語派）")
    if iso in ("MLT",):
        lang_default = "アフロ・アジア語族"

    return {
        "koppenGroup": kop_group,
        "koppenMain": kop_code,
        "annualPrecipMm": precip_mm,
        "agricultureMain": ag_default,
        "meanElevationM": elev_m,
        "religionMain": rel_default,
        "languageFamilyMain": lang_default,
    }


def main() -> None:
    ne50 = download_cached_ne50()
    old_geo = json.loads(OLD_GEO_PATH.read_text(encoding="utf-8"))
    old_ja_by_iso = {
        f["properties"]["iso3"]: f["properties"].get("nameJaNe")
        for f in old_geo.get("features", [])
        if f.get("properties", {}).get("iso3")
    }
    world_thematic = json.loads(WORLD_THEMATIC_PATH.read_text(encoding="utf-8"))
    wc_sampler = load_worldclim_sampler()

    # Group NE50 features by ISO3 (some territories might share code or need MultiPolygon merge)
    grouped: dict[str, dict] = {}
    for feat in ne50.get("features", []):
        props = feat.get("properties", {})
        iso = pick_iso3(props)
        if iso == "UNK":
            continue
        geom = feat.get("geometry")
        if not geom:
            continue
        gtype = geom["type"]
        polys = [geom["coordinates"]] if gtype == "Polygon" else geom["coordinates"]
        if iso not in grouped:
            grouped[iso] = {
                "iso": iso,
                "nameEn": props.get("NAME") or props.get("ADMIN") or iso,
                "continent": props.get("CONTINENT") or "Asia",
                "polys": list(polys),
            }
        else:
            grouped[iso]["polys"].extend(polys)

    # Normalize existing world_thematic koppenMain to 13 classes too
    for k_iso, tval in world_thematic.items():
        km = normalize_koppen_13(tval.get("koppenMain", "Cfa"))
        tval["koppenMain"] = km
        tval["koppenGroup"] = km[0]

    out_records: list[tuple[float, dict]] = []
    added_thematic = 0
    for iso, rec in grouped.items():
        raw_geom = (
            {"type": "Polygon", "coordinates": rec["polys"][0]}
            if len(rec["polys"]) == 1
            else {"type": "MultiPolygon", "coordinates": rec["polys"]}
        )
        simp_geom, total_area, rep_lon, rep_lat = simplify_geometry(raw_geom, tol=0.016)
        if iso not in world_thematic:
            world_thematic[iso] = infer_thematic_for_country(
                iso, rec["continent"], rep_lon, rep_lat, wc_sampler
            )
            added_thematic += 1

        t_info = world_thematic[iso]
        name_ja_ne = NAME_JA_EXTRA.get(iso) or old_ja_by_iso.get(iso) or rec["nameEn"]
        feat_props = {
            "iso3": iso,
            "nameEn": rec["nameEn"],
            "nameJaNe": name_ja_ne,
            "continent": rec["continent"],
            **t_info,
        }
        out_records.append(
            (
                total_area,
                {
                    "type": "Feature",
                    "id": iso,
                    "properties": feat_props,
                    "geometry": simp_geom,
                },
            )
        )

    # Sort descending by area so microstates/enclaves (SGP, VAT, MCO, LSO, etc.) draw ON TOP of larger neighbors!
    out_records.sort(key=lambda item: -item[0])
    features = []
    for idx, (_, feat) in enumerate(out_records, start=1):
        feat["id"] = idx
        features.append(feat)

    WORLD_THEMATIC_PATH.write_text(
        json.dumps(world_thematic, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    OUT_GEO_PATH.write_text(
        json.dumps({"type": "FeatureCollection", "features": features}, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(
        f"Built high-precision 50m geo_countries_v1.geojson: {len(features)} countries/territories "
        f"(added {added_thematic} world_thematic entries, size={OUT_GEO_PATH.stat().st_size / 1024:.1f} KB)"
    )


if __name__ == "__main__":
    main()
