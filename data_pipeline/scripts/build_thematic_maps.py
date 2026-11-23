"""Generate 7 regional thematic RGBA PNG maps (Web Mercator), 1-deg lookup grid, and regional hover GeoJSON."""

from __future__ import annotations

import io
import json
import math
import urllib.request
import zipfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT_DIR = Path(__file__).resolve().parents[2]
RAW_DIR = ROOT_DIR / "data_pipeline" / "raw"
DATA_DIR = ROOT_DIR / "app" / "public" / "data"
CACHE_DIR = Path(
    r"C:\Users\souosu\.gemini\antigravity\brain\6ae25a4e-afe3-408a-9994-ff75540ec085\scratch\worldclim_cache"
)

GEO_COUNTRIES_PATH = DATA_DIR / "geo_countries_v1.geojson"
ZONES_PATH = RAW_DIR / "thematic_regional_zones_v1.json"

WC_URLS = {
    "elev": "https://geodata.ucdavis.edu/climate/worldclim/2_1/base/wc2.1_10m_elev.zip",
    "prec": "https://geodata.ucdavis.edu/climate/worldclim/2_1/base/wc2.1_10m_prec.zip",
    "tavg": "https://geodata.ucdavis.edu/climate/worldclim/2_1/base/wc2.1_10m_tavg.zip",
}

OUT_W, OUT_H = 2048, 1600
LON_MIN, LON_MAX = -180.0, 180.0
LAT_MIN, LAT_MAX = -75.0, 83.0

AGRICULTURE_RGB = {
    "アジア式稲作農業": (22, 163, 74),
    "アジア式畑作農業": (101, 163, 13),
    "プランテーション農業": (234, 88, 12),
    "焼畑農業・自給的農業": (217, 119, 6),
    "オアシス農業": (202, 138, 4),
    "遊牧": (161, 98, 7),
    "地中海式農業": (147, 51, 234),
    "混合農業": (37, 99, 235),
    "酪農": (8, 145, 178),
    "園芸農業": (219, 39, 119),
    "企業的穀物農業": (234, 179, 8),
    "企業的牧畜": (120, 53, 15),
    "林業・非農業（寒冷・都市）": (100, 116, 139),
}

RELIGION_RGB = {
    "キリスト教（カトリック）": (234, 179, 8),
    "キリスト教（プロテスタント）": (37, 99, 235),
    "キリスト教（正教）": (124, 58, 237),
    "イスラム教（スンニ派）": (22, 163, 74),
    "イスラム教（シーア派）": (13, 148, 136),
    "仏教": (249, 115, 22),
    "ヒンドゥー教": (220, 38, 38),
    "ユダヤ教": (6, 182, 212),
    "東アジア伝統信仰・無宗教": (219, 39, 119),
    "伝統信仰・無宗教（欧米等）": (100, 116, 139),
}

LANGUAGE_RGB = {
    "印欧語族（ゲルマン語派）": (59, 130, 246),
    "印欧語族（ロマンス語派）": (234, 179, 8),
    "印欧語族（スラブ語派）": (139, 92, 246),
    "印欧語族（インド・イラン・他）": (239, 68, 68),
    "アフロ・アジア語族": (22, 163, 74),
    "ニジェール・コンゴ語族": (161, 98, 7),
    "シナ・チベット語族": (249, 115, 22),
    "東南アジア・太平洋諸語族": (6, 182, 212),
    "テュルク・モンゴル・ウラル語族": (13, 148, 136),
    "日本語・朝鮮語・固有語族": (236, 72, 153),
}

# Exact 13 Koppen classes matching the user's reference textbook image
KOPPEN_13_CODES = [
    "",
    "Af",
    "Am",
    "Aw",
    "BW",
    "BS",
    "Cs",
    "Cw",
    "Cfa",
    "Cfb",
    "Df",
    "Dw",
    "ET",
    "EF",
]

KOPPEN_13_COLOR = {
    "Af": (255, 77, 72),      # #ff4d48
    "Am": (246, 142, 137),    # #f68e89
    "Aw": (255, 203, 204),    # #ffcbcc
    "BW": (211, 177, 115),    # #d3b173
    "BS": (253, 251, 124),    # #fdfb7c
    "Cs": (249, 168, 32),     # #f9a820
    "Cw": (217, 237, 72),     # #d9ed48
    "Cfa": (162, 250, 6),     # #a2fa06
    "Cfb": (24, 204, 85),     # #18cc55
    "Df": (225, 182, 216),    # #e1b6d8
    "Dw": (156, 97, 176),     # #9c61b0
    "ET": (137, 228, 224),    # #89e4e0
    "EF": (49, 192, 236),     # #31c0ec
}

SOIL_RGB = {
    "ラトソル": (220, 38, 38),
    "砂漠土": (250, 204, 21),
    "栗色土": (217, 119, 6),
    "チェルノーゼム": (24, 24, 27),
    "プレーリー土": (120, 53, 15),
    "褐色森林土": (101, 163, 13),
    "ポドゾル": (203, 213, 225),
    "ツンドラ土": (100, 116, 139),
    "テラローシャ": (157, 23, 77),
    "レグール": (51, 65, 85),
    "テラロッサ": (234, 88, 12),
    "黄土（レス）": (254, 240, 138),
    "黒ボク土（火山灰土）": (124, 58, 237),
    "沖積土": (6, 182, 212),
}

KOPPEN_TO_ZONAL_SOIL = {
    "Af": "ラトソル",
    "Am": "ラトソル",
    "Aw": "ラトソル",
    "BW": "砂漠土",
    "BS": "栗色土",
    "Cs": "褐色森林土",
    "Cw": "褐色森林土",
    "Cfa": "褐色森林土",
    "Cfb": "褐色森林土",
    "Df": "ポドゾル",
    "Dw": "ポドゾル",
    "ET": "ツンドラ土",
    "EF": "ツンドラ土",
}


def download_cached(key: str, url: str) -> Path:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    target = CACHE_DIR / Path(url).name
    if target.exists() and target.stat().st_size > 100_000:
        print(f"Using cached {target.name}")
        return target
    print(f"Downloading {url} ...")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=120) as resp:
        target.write_bytes(resp.read())
    print(f"Saved {target.name} ({target.stat().st_size / 1e6:.1f} MB)")
    return target


def load_wc_elev(zip_path: Path) -> np.ndarray:
    with zipfile.ZipFile(zip_path) as zf:
        tif_name = sorted(n for n in zf.namelist() if n.endswith(".tif"))[0]
        arr = np.array(Image.open(io.BytesIO(zf.read(tif_name))))
    return arr


def load_wc_monthly(zip_path: Path) -> np.ndarray:
    stacks = []
    with zipfile.ZipFile(zip_path) as zf:
        tifs = sorted(n for n in zf.namelist() if n.endswith(".tif"))
        assert len(tifs) == 12, f"Expected 12 tifs, got {len(tifs)}"
        for name in tifs:
            arr = np.array(Image.open(io.BytesIO(zf.read(name))), dtype=np.float32)
            stacks.append(arr)
    return np.stack(stacks, axis=0)


def compute_koppen_13_indices(tavg: np.ndarray, prec: np.ndarray, land: np.ndarray) -> np.ndarray:
    """Compute exact 13-class Koppen-Geiger index (0=ocean, 1..13=KOPPEN_13_CODES) using -3C threshold."""
    h, w = land.shape
    lats = np.linspace(90.0 - 180.0 / (2 * h), -90.0 + 180.0 / (2 * h), h, dtype=np.float32)
    is_north = (lats >= 0)[:, None]

    t = np.where(land, tavg, 0.0)
    p = np.where(land & (prec >= 0) & (prec < 30000), prec, 0.0)

    tmax = t.max(axis=0)
    tmin = t.min(axis=0)
    tann = t.mean(axis=0)
    pann = p.sum(axis=0)
    pmin = p.min(axis=0)
    n_ge10 = (t >= 10.0).sum(axis=0)

    # Local summer = AMJJAS (3..8) for N, ONDJFM (9,10,11,0,1,2) for S
    p_s_n = p[3:9]
    p_w_n = np.concatenate([p[9:12], p[0:3]], axis=0)

    psmax = np.where(is_north, p_s_n.max(axis=0), p_w_n.max(axis=0))
    psmin = np.where(is_north, p_s_n.min(axis=0), p_w_n.min(axis=0))
    pwmax = np.where(is_north, p_w_n.max(axis=0), p_s_n.max(axis=0))
    pwmin = np.where(is_north, p_w_n.min(axis=0), p_s_n.min(axis=0))
    psum = np.where(is_north, p_s_n.sum(axis=0), p_w_n.sum(axis=0))
    pwin = pann - psum

    pth = np.where(
        psum >= 0.7 * pann,
        20.0 * tann + 280.0,
        np.where(pwin >= 0.7 * pann, 20.0 * tann, 20.0 * tann + 140.0),
    )

    code_to_idx = {c: i for i, c in enumerate(KOPPEN_13_CODES)}
    res = np.zeros((h, w), dtype=np.uint8)

    # 1. Polar E
    is_e = land & (tmax < 10.0)
    res[is_e & (tmax >= 0.0)] = code_to_idx["ET"]
    res[is_e & (tmax < 0.0)] = code_to_idx["EF"]

    # 2. Arid B -> BW / BS
    rem = land & (~is_e)
    is_b = rem & (pann < pth)
    bw = pann < 0.5 * pth
    res[is_b & bw] = code_to_idx["BW"]
    res[is_b & (~bw)] = code_to_idx["BS"]

    # 3. Tropical A -> Af / Am / Aw
    rem = rem & (~is_b)
    is_a = rem & (tmin >= 18.0)
    is_af = is_a & (pmin >= 60.0)
    is_am = is_a & (~is_af) & (pmin >= (100.0 - pann / 25.0))
    is_aw = is_a & (~is_af) & (~is_am)
    res[is_af] = code_to_idx["Af"]
    res[is_am] = code_to_idx["Am"]
    res[is_aw] = code_to_idx["Aw"]

    # 4. C and D (-3 deg C threshold)
    rem = rem & (~is_a)
    is_c = rem & (tmin >= -3.0)
    is_d = rem & (tmin < -3.0)

    dry_w = (pwmin < psmax / 10.0) & (psum >= pwin)
    dry_s = (~dry_w) & (psmin < 40.0) & (psmin < pwmax / 3.0)
    is_a_hot = tmax >= 22.0
    is_b_warm = (~is_a_hot) & (n_ge10 >= 4)

    # Temperate C -> Cs, Cw, Cfa, Cfb
    res[is_c & dry_w] = code_to_idx["Cw"]
    res[is_c & dry_s] = code_to_idx["Cs"]
    c_f = is_c & (~dry_w) & (~dry_s)
    res[c_f & is_a_hot] = code_to_idx["Cfa"]
    res[c_f & (~is_a_hot) & is_b_warm] = code_to_idx["Cfb"]
    res[c_f & (~is_a_hot) & (~is_b_warm)] = code_to_idx["Cfb"]

    # Subarctic D -> Dw (dry winter), Df (humid & Ds merged into Df per standard 13-class textbook)
    res[is_d & dry_w] = code_to_idx["Dw"]
    res[is_d & (~dry_w)] = code_to_idx["Df"]

    return res


def merc_y(lat_deg: float) -> float:
    lat_c = max(-85.0, min(85.0, lat_deg))
    rad = math.radians(lat_c)
    return math.log(math.tan(math.pi / 4.0 + rad / 2.0))


def lonlat_to_merc_px(lon: float, lat: float) -> tuple[float, float]:
    my_n = merc_y(LAT_MAX)
    my_s = merc_y(LAT_MIN)
    x = (lon - LON_MIN) / (LON_MAX - LON_MIN) * OUT_W
    y = (my_n - merc_y(lat)) / (my_n - my_s) * OUT_H
    return (x, y)


def build_merc_grid_indices(src_h: int, src_w: int) -> tuple[np.ndarray, np.ndarray]:
    lons = np.linspace(LON_MIN, LON_MAX, OUT_W, endpoint=False, dtype=np.float64) + (
        (LON_MAX - LON_MIN) / (2.0 * OUT_W)
    )
    my_n = merc_y(LAT_MAX)
    my_s = merc_y(LAT_MIN)
    mys = np.linspace(my_n, my_s, OUT_H, endpoint=False, dtype=np.float64) - (
        (my_n - my_s) / (2.0 * OUT_H)
    )
    lats = np.degrees(2.0 * np.arctan(np.exp(mys)) - math.pi / 2.0)

    sx = (np.floor((lons + 180.0) / 360.0 * src_w).astype(np.int32)) % src_w
    sy = np.clip(np.floor((90.0 - lats) / 180.0 * src_h).astype(np.int32), 0, src_h - 1)
    return np.ix_(sy, sx)


def save_rgba_png(rgba: np.ndarray, out_path: Path) -> None:
    Image.fromarray(rgba, mode="RGBA").save(out_path, format="PNG", optimize=True)
    print(f"Wrote {out_path.name} ({out_path.stat().st_size / 1024:.1f} KB)")


def draw_geo_polygons(
    img: Image.Image,
    features: list[dict],
    prop_key: str,
    palette: dict[str, tuple[int, int, int]],
    outline_px: int = 0,
) -> None:
    draw = ImageDraw.Draw(img)
    for feat in features:
        props = feat.get("properties", {})
        cat = props.get(prop_key)
        color = palette.get(cat)
        if not color:
            continue
        geom = feat.get("geometry") or {}
        gtype = geom.get("type")
        polys = (
            [geom["coordinates"]]
            if gtype == "Polygon"
            else (geom.get("coordinates", []) if gtype == "MultiPolygon" else [])
        )
        for poly in polys:
            if not poly:
                continue
            outer = poly[0]
            px = [lonlat_to_merc_px(pt[0], pt[1]) for pt in outer]
            if len(px) >= 3:
                draw.polygon(px, fill=color, outline=color if outline_px > 0 else None)


def point_in_poly(lon: float, lat: float, coords: list[list[float]]) -> bool:
    inside = False
    n = len(coords)
    j = n - 1
    for i in range(n):
        xi, yi = coords[i][0], coords[i][1]
        xj, yj = coords[j][0], coords[j][1]
        if ((yi > lat) != (yj > lat)) and (
            lon < (xj - xi) * (lat - yi) / ((yj - yi) or 1e-12) + xi
        ):
            inside = not inside
        j = i
    return inside


def main() -> None:
    elev_zip = download_cached("elev", WC_URLS["elev"])
    prec_zip = download_cached("prec", WC_URLS["prec"])
    tavg_zip = download_cached("tavg", WC_URLS["tavg"])

    print("Reading WorldClim arrays ...")
    elev = load_wc_elev(elev_zip)
    land = elev > -32768
    prec = load_wc_monthly(prec_zip)
    tavg = load_wc_monthly(tavg_zip)
    pann = np.where(land & (prec[0] >= 0), np.clip(prec, 0, 20000).sum(axis=0), 0.0)

    print("Computing exact 13-class Koppen-Geiger classification grid ...")
    koppen_idx = compute_koppen_13_indices(tavg, prec, land)

    ty = int((90.0 - 35.69) / 180.0 * elev.shape[0])
    tx = int((139.69 + 180.0) / 360.0 * elev.shape[1])
    print(
        f"Sanity Tokyo: elev={elev[ty, tx]}m, precip={round(float(pann[ty, tx]))}mm, "
        f"koppen={KOPPEN_13_CODES[koppen_idx[ty, tx]]}"
    )

    iy, ix = build_merc_grid_indices(elev.shape[0], elev.shape[1])
    m_land = land[iy, ix]
    m_elev = elev[iy, ix]
    m_pann = pann[iy, ix]
    m_kop = koppen_idx[iy, ix]

    # 1. Elevation PNG
    elev_lut = np.zeros((OUT_H, OUT_W, 4), dtype=np.uint8)
    elev_bins = [
        (-9999, 200, (134, 239, 172)),
        (200, 500, (190, 242, 100)),
        (500, 1000, (253, 224, 71)),
        (1000, 1500, (253, 186, 116)),
        (1500, 2500, (217, 119, 6)),
        (2500, 4000, (154, 52, 18)),
        (4000, 99999, (124, 45, 18)),
    ]
    for lo, hi, rgb in elev_bins:
        mask = m_land & (m_elev >= lo) & (m_elev < hi)
        elev_lut[mask, 0] = rgb[0]
        elev_lut[mask, 1] = rgb[1]
        elev_lut[mask, 2] = rgb[2]
        elev_lut[mask, 3] = 220
    save_rgba_png(elev_lut, DATA_DIR / "thematic_elevation_v1.png")

    # 2. Precipitation PNG
    prec_lut = np.zeros((OUT_H, OUT_W, 4), dtype=np.uint8)
    prec_bins = [
        (0, 250, (254, 243, 199)),
        (250, 500, (217, 249, 157)),
        (500, 1000, (103, 232, 249)),
        (1000, 1500, (56, 189, 248)),
        (1500, 2000, (37, 99, 235)),
        (2000, 999999, (30, 58, 138)),
    ]
    for lo, hi, rgb in prec_bins:
        mask = m_land & (m_pann >= lo) & (m_pann < hi)
        prec_lut[mask, 0] = rgb[0]
        prec_lut[mask, 1] = rgb[1]
        prec_lut[mask, 2] = rgb[2]
        prec_lut[mask, 3] = 220
    save_rgba_png(prec_lut, DATA_DIR / "thematic_precipitation_v1.png")

    # 3. Exact 13-class Koppen PNG
    kop_palette = np.zeros((len(KOPPEN_13_CODES), 4), dtype=np.uint8)
    for idx, code in enumerate(KOPPEN_13_CODES):
        if code and code in KOPPEN_13_COLOR:
            r, g, b = KOPPEN_13_COLOR[code]
            kop_palette[idx] = [r, g, b, 235]
    kop_rgba = kop_palette[m_kop]
    kop_rgba[~m_land, 3] = 0
    save_rgba_png(kop_rgba, DATA_DIR / "thematic_koppen_v1.png")

    # 4. Global Soil PNG (zonal soils from Koppen 13 + intrazonal soil zones)
    zones = json.loads(ZONES_PATH.read_text(encoding="utf-8"))
    soil_zonal_lut = np.zeros((len(KOPPEN_13_CODES), 3), dtype=np.uint8)
    for idx, code in enumerate(KOPPEN_13_CODES):
        if code:
            s_name = KOPPEN_TO_ZONAL_SOIL.get(code, "褐色森林土")
            soil_zonal_lut[idx] = SOIL_RGB[s_name]
    soil_rgb_base = soil_zonal_lut[m_kop]
    soil_img = Image.fromarray(soil_rgb_base, mode="RGB")
    soil_draw = ImageDraw.Draw(soil_img)
    soil_zones = zones.get("soil", [])
    for z in soil_zones:
        rgb = SOIL_RGB.get(z["category"])
        if not rgb:
            continue
        px = [lonlat_to_merc_px(pt[0], pt[1]) for pt in z["coords"]]
        if len(px) >= 3:
            soil_draw.polygon(px, fill=rgb)
    soil_rgba = np.zeros((OUT_H, OUT_W, 4), dtype=np.uint8)
    soil_rgba[:, :, :3] = np.array(soil_img, dtype=np.uint8)
    soil_rgba[m_land, 3] = 222
    save_rgba_png(soil_rgba, DATA_DIR / "thematic_soil_v1.png")

    # 5. 1-degree lookup grid (360 lon x 180 lat) for hover tooltip
    lons_1d = np.arange(-179.5, 180.0, 1.0)
    lats_1d = np.arange(89.5, -90.0, -1.0)
    sx1 = (np.floor((lons_1d + 180.0) / 360.0 * elev.shape[1]).astype(np.int32)) % elev.shape[1]
    sy1 = np.clip(np.floor((90.0 - lats_1d) / 180.0 * elev.shape[0]).astype(np.int32), 0, elev.shape[0] - 1)
    g_ix = np.ix_(sy1, sx1)
    g_land = land[g_ix]
    g_kop = koppen_idx[g_ix]
    g_prec = np.rint(pann[g_ix]).astype(np.int32)
    g_elev = elev[g_ix].astype(np.int32)

    grid_kop = []
    grid_prec = []
    grid_elev = []
    grid_soil = []
    for r in range(180):
        lat_val = float(lats_1d[r])
        rk, rp, re, rs = [], [], [], []
        for c in range(360):
            if not g_land[r, c]:
                rk.append("")
                rp.append(-1)
                re.append(-9999)
                rs.append("")
            else:
                kcode = KOPPEN_13_CODES[int(g_kop[r, c])]
                rk.append(kcode)
                rp.append(int(g_prec[r, c]))
                re.append(int(g_elev[r, c]))
                lon_val = float(lons_1d[c])
                soil_name = KOPPEN_TO_ZONAL_SOIL.get(kcode, "褐色森林土")
                for z in soil_zones:
                    if point_in_poly(lon_val, lat_val, z["coords"]):
                        soil_name = z["category"]
                rs.append(soil_name)
        grid_kop.append(rk)
        grid_prec.append(rp)
        grid_elev.append(re)
        grid_soil.append(rs)

    grid_out = {
        "width": 360,
        "height": 180,
        "koppen": grid_kop,
        "precip": grid_prec,
        "elev": grid_elev,
        "soil": grid_soil,
    }
    (DATA_DIR / "thematic_grid_v1.json").write_text(
        json.dumps(grid_out, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print("Wrote thematic_grid_v1.json (with exact 13 Koppen & soil)")

    # 6. Agriculture / Religion / Language regional PNGs + thematic_regions_v1.geojson (including soil!)
    geo_countries = json.loads(GEO_COUNTRIES_PATH.read_text(encoding="utf-8"))

    region_features = []
    for z in soil_zones:
        region_features.append(
            {
                "type": "Feature",
                "properties": {
                    "id": z["id"],
                    "mode": "soil",
                    "nameJa": z["nameJa"],
                    "category": z["category"],
                    "note": z["note"],
                },
                "geometry": {"type": "Polygon", "coordinates": [z["coords"]]},
            }
        )

    specs = [
        ("agriculture", "agricultureMain", AGRICULTURE_RGB, DATA_DIR / "thematic_agriculture_v1.png"),
        ("religion", "religionMain", RELIGION_RGB, DATA_DIR / "thematic_religion_v1.png"),
        ("language", "languageFamilyMain", LANGUAGE_RGB, DATA_DIR / "thematic_language_v1.png"),
    ]
    for mode_key, country_prop, palette, out_png in specs:
        canvas = Image.new("RGB", (OUT_W, OUT_H), (148, 163, 184))
        draw_geo_polygons(canvas, geo_countries["features"], country_prop, palette, outline_px=2)
        draw = ImageDraw.Draw(canvas)
        for z in zones[mode_key]:
            rgb = palette.get(z["category"])
            if not rgb:
                continue
            px = [lonlat_to_merc_px(pt[0], pt[1]) for pt in z["coords"]]
            if len(px) >= 3:
                draw.polygon(px, fill=rgb)
            region_features.append(
                {
                    "type": "Feature",
                    "properties": {
                        "id": z["id"],
                        "mode": mode_key,
                        "nameJa": z["nameJa"],
                        "category": z["category"],
                        "note": z["note"],
                    },
                    "geometry": {"type": "Polygon", "coordinates": [z["coords"]]},
                }
            )
        arr_rgb = np.array(canvas, dtype=np.uint8)
        rgba = np.zeros((OUT_H, OUT_W, 4), dtype=np.uint8)
        rgba[:, :, :3] = arr_rgb
        rgba[m_land, 3] = 220
        save_rgba_png(rgba, out_png)

    (DATA_DIR / "thematic_regions_v1.geojson").write_text(
        json.dumps({"type": "FeatureCollection", "features": region_features}, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"Wrote thematic_regions_v1.geojson ({len(region_features)} regions)")


if __name__ == "__main__":
    main()
