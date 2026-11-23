"""Build capitals, volcanoes/hotspots, atmospheric/climate phenomena, and rich clickable places gazetteer."""

from __future__ import annotations

import json
import math
import re
import urllib.request
from pathlib import Path

KOPPEN_SUBCODE_MAP = {
    "BWh": "BW", "BWk": "BW", "BSh": "BS", "BSk": "BS",
    "Csa": "Cs", "Csb": "Cs", "Csc": "Cs",
    "Cwa": "Cw", "Cwb": "Cw", "Cwc": "Cw",
    "Cfc": "Cfb",
    "Dfa": "Df", "Dfb": "Df", "Dfc": "Df", "Dfd": "Df",
    "Dsa": "Df", "Dsb": "Df", "Dsc": "Df", "Dsd": "Df",
    "Dwa": "Dw", "Dwb": "Dw", "Dwc": "Dw", "Dwd": "Dw",
}
KOPPEN_SUB_RE = re.compile(
    r"(?<![A-Za-z])(BWh|BWk|BSh|BSk|Csa|Csb|Csc|Cwa|Cwb|Cwc|Cfc|Dfa|Dfb|Dfc|Dfd|Dwa|Dwb|Dwc|Dwd|Dsa|Dsb|Dsc|Dsd)(?![A-Za-z])"
)


def normalize_koppen_obj(obj):
    if isinstance(obj, str):
        return KOPPEN_SUB_RE.sub(lambda m: KOPPEN_SUBCODE_MAP[m.group(0)], obj)
    if isinstance(obj, list):
        return [normalize_koppen_obj(x) for x in obj]
    if isinstance(obj, dict):
        return {k: normalize_koppen_obj(v) for k, v in obj.items()}
    return obj

ROOT_DIR = Path(__file__).resolve().parents[2]
RAW_DIR = ROOT_DIR / "data_pipeline" / "raw"
DATA_DIR = ROOT_DIR / "app" / "public" / "data"

NE_PLACES_URL = (
    "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_populated_places_simple.geojson"
)

COUNTRIES_PATH = DATA_DIR / "countries_v1.json"
GEO_LAYERS_PATH = DATA_DIR / "geo_layers_v1.geojson"
TOP_CITIES_PATH = RAW_DIR / "country_top_cities_v1.json"

CAPITALS_OUT = DATA_DIR / "capitals_v1.geojson"
VOLCANOES_OUT = DATA_DIR / "volcanoes_v1.geojson"
PHENOMENA_OUT = DATA_DIR / "climate_phenomena_v1.geojson"
PLACES_OUT = DATA_DIR / "places_v1.json"
PLACE_PHOTOS_PATH = RAW_DIR / "place_photos_v1.json"


def arrow_chevron(p_prev: list[float], p_end: list[float], size: float = 2.6) -> list[list[list[float]]]:
    """Build two short barb segments at p_end pointing along (p_end - p_prev)."""
    dx = p_end[0] - p_prev[0]
    dy = p_end[1] - p_prev[1]
    length = math.hypot(dx, dy)
    if length < 1e-6:
        return []
    ux, uy = dx / length, dy / length
    # Wing angle ~28 degrees back
    ang = math.radians(152)
    c, s = math.cos(ang), math.sin(ang)
    w1 = [round(p_end[0] + size * (ux * c - uy * s), 2), round(p_end[1] + size * (ux * s + uy * c), 2)]
    c2, s2 = math.cos(-ang), math.sin(-ang)
    w2 = [round(p_end[0] + size * (ux * c2 - uy * s2), 2), round(p_end[1] + size * (ux * s2 + uy * c2), 2)]
    return [[w1, p_end], [p_end, w2]]


def build_arrow_geom(pts: list[list[float]], barb_size: float = 2.8) -> dict:
    segs = [pts]
    if len(pts) >= 2:
        segs.extend(arrow_chevron(pts[-2], pts[-1], barb_size))
    return {"type": "MultiLineString", "coordinates": segs}


def lat_band_poly(lat_s: float, lat_n: float, lon_w: float = -180.0, lon_e: float = 180.0) -> dict:
    return {
        "type": "Polygon",
        "coordinates": [[[lon_w, lat_s], [lon_e, lat_s], [lon_e, lat_n], [lon_w, lat_n], [lon_w, lat_s]]],
    }


def box_poly(w: float, s: float, e: float, n: float) -> dict:
    return {
        "type": "Polygon",
        "coordinates": [[[w, s], [e, s], [e, n], [w, n], [w, s]]],
    }


def build_capitals(countries_json: dict, top_cities: dict) -> list[dict]:
    req = urllib.request.Request(NE_PLACES_URL, headers={"User-Agent": "Mozilla/5.0"})
    ne = json.loads(urllib.request.urlopen(req, timeout=20).read().decode("utf-8"))

    features: list[dict] = []
    seen_coords: set[tuple[float, float]] = set()
    covered_isos: set[str] = set()

    # 1. Exact curated capitals from 60 detailed countries (including Pretoria/Cape Town/Bloemfontein for ZAF)
    for iso3, entry in sorted(top_cities.items()):
        c_info = countries_json.get(iso3, {})
        country_name = c_info.get("nameJa", iso3)
        for city in entry.get("topCities", []):
            if not city.get("isCapital"):
                continue
            covered_isos.add(iso3)
            lon, lat = round(float(city["lng"]), 2), round(float(city["lat"]), 2)
            seen_coords.add((round(lon, 1), round(lat, 1)))
            features.append(
                {
                    "type": "Feature",
                    "properties": {
                        "id": f"cap_{iso3}_{len(features)}",
                        "iso3": iso3,
                        "nameJa": city["nameJa"],
                        "countryNameJa": country_name,
                        "note": city.get("note", ""),
                        "isPrimary60": True,
                    },
                    "geometry": {"type": "Point", "coordinates": [lon, lat]},
                }
            )

    # 2. World capitals from Natural Earth (for all remaining countries)
    for feat in ne.get("features", []):
        props = feat.get("properties", {})
        if props.get("adm0cap") != 1:
            continue
        iso = props.get("adm0_a3") or props.get("sov_a3") or ""
        if iso in covered_isos:
            continue
        coords = feat.get("geometry", {}).get("coordinates", [])
        if len(coords) < 2:
            continue
        lon, lat = round(float(coords[0]), 2), round(float(coords[1]), 2)
        k = (round(lon, 1), round(lat, 1))
        if k in seen_coords:
            continue
        seen_coords.add(k)
        features.append(
            {
                "type": "Feature",
                "properties": {
                    "id": f"cap_ne_{iso}_{len(features)}",
                    "iso3": iso,
                    "nameJa": props.get("name") or "",
                    "countryNameJa": props.get("adm0name") or iso,
                    "note": f"{props.get('adm0name') or iso}の首都",
                    "isPrimary60": False,
                },
                "geometry": {"type": "Point", "coordinates": [lon, lat]},
            }
        )

    return features


VOLCANOES = [
    # Hotspot volcanoes (紫)
    ("vol_kilauea", "キラウエア火山（ハワイ）", "hotspot", "USA", -155.29, 19.42, "ハワイ・ホットスポット上の盾状火山。玄武岩質マグマのため粘性が低く穏やかに溶岩が流出する。"),
    ("vol_mauna_loa", "マウナ・ロア（ハワイ）", "hotspot", "USA", -155.60, 19.48, "ハワイ最大の盾状火山。太平洋プレートが北西へ移動することで火山島列（ハワイ諸島）が形成。"),
    ("vol_yellowstone", "イエローストーン（カルデラ）", "hotspot", "USA", -110.59, 44.43, "北アメリカ大陸内部のホットスポットにより形成された巨大カルデラと間欠泉群。"),
    ("vol_teide", "テイデ山（カナリア諸島）", "hotspot", "ESP", -16.64, 28.27, "アフリカ西岸沖・カナリア諸島のホットスポットによるスペイン最高峰の成層火山。"),
    ("vol_galapagos", "シエラネグラ（ガラパゴス諸島）", "hotspot", "ECU", -91.17, -0.83, "ナスカプレート上のホットスポットでできた火山島群。プレート移動により東の島ほど古い。"),
    ("vol_reunion", "ピトン・ドゥ・ラ・フルネーズ", "hotspot", "FRA", 55.71, -21.24, "インド洋・レユニオン島のホットスポット上にある極めて活発な盾状火山。"),
    # Divergent / Rift volcanoes (青)
    ("vol_eyja", "エイヤフィヤトラヨークトル", "divergent", "ISL", -19.62, 63.63, "大西洋中央海嶺（広がる境界）が陸上に現れたアイスランドの氷河を戴く火山。2010年欧州航空網を麻痺。"),
    ("vol_hekla", "ヘクラ火山", "divergent", "ISL", -19.67, 63.99, "大西洋中央海嶺（広がる境界）の裂け目噴火で知られるアイスランドの代表的火山。"),
    ("vol_kilimanjaro", "キリマンジャロ", "divergent", "TZA", 37.35, -3.07, "アフリカ大地溝帯（広がる境界）東縁にそびえるアフリカ最高峰（5,895m）。赤道直下だが山頂に氷河。"),
    ("vol_nyiragongo", "ニーラゴンゴ山", "divergent", "COD", 29.25, -1.52, "アフリカ大地溝帯西部（キヴ湖畔）にある活発な溶岩湖を持つ火山。"),
    ("vol_erta_ale", "エルタ・アレ", "divergent", "ETH", 40.67, 13.60, "アファール三重点（紅海・アデン湾・大地溝帯の広がる境界）に位置する盾状火山。"),
    # Subduction / Convergent volcanoes (赤)
    ("vol_fuji", "富士山", "subduction", "JPN", 138.73, 35.36, "伊豆小笠原弧の沈み込みとプレート境界付近に位置する日本最高峰（3,776m）の美しい成層火山。"),
    ("vol_sakurajima", "桜島", "subduction", "JPN", 130.66, 31.59, "フィリピン海プレート沈み込み帯（姶良カルデラ）の活動的火山。シラス台地の火山灰土壌をもたらす。"),
    ("vol_aso", "阿蘇山", "subduction", "JPN", 131.10, 32.88, "世界最大級のカルデラ地形を持つ九州の火山。カルデラ内の水田や草原牧畜が特徴。"),
    ("vol_pinatubo", "ピナツボ山", "subduction", "PHL", 120.35, 15.13, "環太平洋造山帯の沈み込み境界に位置。1991年の大噴火は地球気温の一時的低下をもたらした。"),
    ("vol_merapi", "メラピ山", "subduction", "IDN", 110.45, -7.54, "インド・オーストラリアプレートがスンダ海溝に沈み込むジャワ島中央部の活火山。火山灰土で人口稠密。"),
    ("vol_krakatau", "クラカタウ（スンダ海峡）", "subduction", "IDN", 105.42, -6.10, "1883年大爆発・津波で著名なスンダ海溝沿いの海底カルデラ・火山島。"),
    ("vol_etna", "エトナ山（シチリア島）", "subduction", "ITA", 15.00, 37.75, "アフリカ・ユーラシアプレート収束帯のヨーロッパ最大の活火山。肥沃な火山灰土で柑橘類を栽培。"),
    ("vol_vesuvius", "ヴェスヴィオ山", "subduction", "ITA", 14.43, 40.82, "ナポリ湾を望む成層火山（ポンペイ埋没で有名）。地中海の沈み込み帯火山。"),
    ("vol_st_helens", "セント・ヘレンズ山", "subduction", "USA", -122.19, 46.20, "ファンデフカプレートが北アメリカプレートに沈み込むカスケード山脈の火山。1980年に山体崩壊。"),
    ("vol_popocatepetl", "ポポカテペトル山", "subduction", "MEX", -98.63, 19.02, "ココスプレートの沈み込みによりできたメキシコ盆地南東の標高5,426m成層火山。"),
    ("vol_cotopaxi", "コトパクシ山", "subduction", "ECU", -78.44, -0.68, "ナスカプレート沈み込みのアンデス山脈北部に位置し、赤道直下ながら万年雪を戴く高峻火山。"),
    ("vol_chimborazo", "チンボラソ山", "subduction", "ECU", -78.82, -1.47, "地球の中心から最も遠い山頂を持つアンデス山脈の火山（6,263m）。"),
    ("vol_ruapehu", "ルアペフ山", "subduction", "NZL", 175.56, -39.28, "太平洋プレート沈み込みに伴うニュージーランド北島・トンガリロ国立公園の活火山（地熱発電も発達）。"),
    ("vol_klyuchevskaya", "クリュチェフスカヤ山", "subduction", "RUS", 160.64, 56.06, "千島・カムチャツカ海溝沿いのユーラシア最高活火山（環太平洋造山帯）。"),
    ("vol_baekdu", "白頭山（長白山）", "subduction", "CHN", 128.08, 42.00, "中朝国境の火山。頂上のカルデラ湖（天池）を囲む。"),
]


def build_volcanoes(photos_map: dict[str, dict]) -> list[dict]:
    type_ja = {
        "hotspot": "ホットスポット（プレート内部のマグマ上昇）",
        "divergent": "広がる境界（中央海嶺・大地溝帯）",
        "subduction": "狭まる境界（沈み込み帯・海溝・島弧）",
    }
    feats = []
    for vid, name, vtype, iso, lon, lat, desc in VOLCANOES:
        props: dict = {
            "id": vid,
            "nameJa": name,
            "volcanoType": vtype,
            "volcanoTypeJa": type_ja[vtype],
            "iso3": iso,
            "description": desc,
        }
        ph = photos_map.get(vid)
        if ph:
            props["photoUrl"] = ph["url"]
            props["photoCaption"] = ph["caption"]
            props["photoCredit"] = ph["credit"]
        feats.append(
            {
                "type": "Feature",
                "properties": props,
                "geometry": {"type": "Point", "coordinates": [lon, lat]},
            }
        )
    return feats


def build_climate_phenomena() -> list[dict]:
    feats: list[dict] = []

    def add(pid: str, group: str, season: str, kind: str, subtype: str, name: str, desc: str, geom: dict):
        feats.append(
            {
                "type": "Feature",
                "properties": {
                    "id": pid,
                    "phenomGroup": group,
                    "season": season,
                    "geomKind": kind,
                    "subtype": subtype,
                    "nameJa": name,
                    "description": desc,
                },
                "geometry": geom,
            }
        )

    # 1. Pressure belts & prevailing winds across jan / avg / jul
    season_shifts = {"jan": -9.0, "avg": 0.0, "jul": 10.0}
    season_label = {"jan": "1月（北半球の冬）", "avg": "春秋（年平均位置）", "jul": "7月（北半球の夏）"}

    for s_key, sh in season_shifts.items():
        sl = season_label[s_key]
        # Equatorial low (ITCZ)
        add(
            f"pb_itcz_{s_key}",
            "pressure_wind",
            s_key,
            "band",
            "low",
            f"赤道低圧帯（ITCZ）｜{sl}",
            "強い日射による上昇気流でスコール・対流性降雨が多発。季節で太陽直射帯に追随して南北移動するためサバナ気候（Aw）の雨期・乾季を生む。",
            lat_band_poly(-5 + sh, 6 + sh),
        )
        # Subtropical highs (N & S)
        add(
            f"pb_sth_n_{s_key}",
            "pressure_wind",
            s_key,
            "band",
            "high",
            f"亜熱帯高圧帯（北半球）｜{sl}",
            "ハドレー循環の下降気流帯。サハラ・アラビア等の中緯度砂漠（BW）の主因。7月に北上して地中海性気候（Cs）の夏に乾燥をもたらす。",
            lat_band_poly(20 + sh, 33 + sh),
        )
        add(
            f"pb_sth_s_{s_key}",
            "pressure_wind",
            s_key,
            "band",
            "high",
            f"亜熱帯高圧帯（南半球）｜{sl}",
            "オーストラリア内陸やカラハリ・ナミブ砂漠、アタカマ砂漠（乾燥帯）の形成に関わる下降気流帯。",
            lat_band_poly(-33 + sh, -20 + sh),
        )
        # Subpolar lows (N & S)
        sub_n_s = max(-74, min(72, 54 + sh * 0.5))
        add(
            f"pb_spl_n_{s_key}",
            "pressure_wind",
            s_key,
            "band",
            "low",
            f"亜寒帯低圧帯（北半球）｜{sl}",
            "偏西風と極東風が衝突する寒帯前線帯。低気圧が通過しやすく、高緯度の沿岸部で年間を通じた降水（Cfb・Df）をもたらす。",
            lat_band_poly(sub_n_s, sub_n_s + 11),
        )
        add(
            f"pb_spl_s_{s_key}",
            "pressure_wind",
            s_key,
            "band",
            "low",
            f"亜寒帯低圧帯（南半球）｜{sl}",
            "南大洋（吼える40度・狂う50度）を取り巻く強風・低気圧帯。",
            lat_band_poly(-65 + sh * 0.4, -54 + sh * 0.4),
        )

        # Westerlies arrows (N & S) in 3 longitudes
        wn_y = 43 + sh * 0.65
        ws_y = -43 + sh * 0.65
        for idx, base_lon in enumerate([-150, -35, 95]):
            add(
                f"wind_wn_{s_key}_{idx}",
                "pressure_wind",
                s_key,
                "wind",
                "westerlies",
                f"偏西風（北半球）｜{sl}",
                "亜熱帯高圧帯から亜寒帯低圧帯へ吹く西よりの恒常風。暖流とともに西岸海洋性気候（Cfb）に温暖湿潤な空気を運ぶ。冬（1月）には南下して地中海沿岸に冬の雨をもたらす。",
                build_arrow_geom([[base_lon - 18, wn_y - 2], [base_lon + 18, wn_y + 3]], 2.8),
            )
            add(
                f"wind_ws_{s_key}_{idx}",
                "pressure_wind",
                s_key,
                "wind",
                "westerlies",
                f"偏西風（南半球）｜{sl}",
                "南アメリカ南部（パタゴニア風上側多雨・風下側乾燥）やニュージーランドの年中湿潤（Cfb）をもたらす強風。",
                build_arrow_geom([[base_lon - 18, ws_y + 2], [base_lon + 18, ws_y - 3]], 2.8),
            )

        # NE & SE Trade Winds converging on ITCZ
        t_n_top = 24 + sh * 0.85
        t_n_bot = 8 + sh * 0.85
        t_s_top = -8 + sh * 0.85
        t_s_bot = -24 + sh * 0.85
        for idx, base_lon in enumerate([-130, -30, 80, 155]):
            add(
                f"wind_tn_{s_key}_{idx}",
                "pressure_wind",
                s_key,
                "wind",
                "trade",
                f"北東貿易風｜{sl}",
                "亜熱帯高圧帯から赤道低圧帯へ向かいコリオリ力で右偏向して吹く恒常風。大陸東岸に湿潤気候、西岸（寒流と重なる海域）に海岸砂漠をもたらす。",
                build_arrow_geom([[base_lon + 10, t_n_top], [base_lon - 10, t_n_bot]], 2.5),
            )
            add(
                f"wind_ts_{s_key}_{idx}",
                "pressure_wind",
                s_key,
                "wind",
                "trade",
                f"南東貿易風｜{sl}",
                "南半球亜熱帯高圧帯から赤道低圧帯へ吹く恒常風。太平洋赤道域の湧昇流・エルニーニョ現象とも密接に関連。",
                build_arrow_geom([[base_lon + 10, t_s_bot], [base_lon - 10, t_s_top]], 2.5),
            )

    # 2. Monsoons (jul & jan)
    summer_monsoons = [
        ("mon_jul_ind", "南西モンスーン（夏・インド洋→インド）", "夏にユーラシア大陸内陸が激しく加熱され熱的低気圧が発生し、インド洋から膨大な水蒸気を含んだ南西季節風が吹き込み、インド・東南アジアの雨期（モンスーン・稲作）をもたらす。", [[55, -2], [65, 8], [75, 16], [85, 23]]),
        ("mon_jul_sea", "南西・南モンスーン（夏・東南アジア）", "ベンガル湾・南シナ海から大陸部へ吹き込む湿潤風。山脈風上側に豪雨を降らせる。", [[94, 4], [100, 13], [105, 22]]),
        ("mon_jul_ea", "南東モンスーン（夏・太平洋→東アジア）", "小笠原高気圧（太平洋高気圧）から日本・中国東部へ吹き込む高温多湿な南東季節風（夏の高温多雨）。", [[136, 16], [130, 26], [122, 34]]),
    ]
    for mid, name, desc, pts in summer_monsoons:
        add(mid, "monsoon", "jul", "wind", "monsoon_summer", name, desc, build_arrow_geom(pts, 3.0))

    winter_monsoons = [
        ("mon_jan_ea", "北西モンスーン（冬・シベリア→東アジア）", "冬季に大陸内陸が冷却されて発達するシベリア高気圧から吹き出す寒冷で乾燥した北西季節風。日本海を通過すると水蒸気を吸収し日本の日本海側に世界有数の豪雪をもたらす。", [[112, 49], [126, 41], [137, 36]]),
        ("mon_jan_chn", "北〜北東モンスーン（冬・華南・東南アジア乾季）", "大陸から南シナ海・インド洋へ吹き出す乾燥した北東季節風。東南アジアや南アジアの乾季を形成（ただし山脈風上側＝ベトナム中部やマレー半島東岸・スリランカ北東部は冬に雨が多い）。", [[116, 31], [110, 20], [103, 9]]),
        ("mon_jan_ind", "北東モンスーン（冬・インド乾季）", "ヒマラヤ山脈によりシベリアからの厳寒気団は遮られるが、大陸から吹く乾燥した北東風によりインドの多くの地域は乾季となる。", [[85, 25], [75, 16], [65, 7]]),
    ]
    for mid, name, desc, pts in winter_monsoons:
        add(mid, "monsoon", "jan", "wind", "monsoon_winter", name, desc, build_arrow_geom(pts, 3.0))

    # 3. ENSO (normal / elnino / lanina)
    # Normal
    add("enso_norm_wind", "enso", "normal", "wind", "trade_normal", "平常時の東貿易風（太平洋赤道域）", "東から西へ吹く貿易風により、暖かい表層水が西太平洋（インドネシア付近）に吹き寄せられる。", build_arrow_geom([[-90, -2], [-135, -2], [-175, 0], [140, 2]], 3.2))
    add("enso_norm_warm", "enso", "normal", "band", "warm_water", "平常時の暖水プール（多雨域）", "インドネシア・ニューギニア周辺は海水温が高く積乱雲が発達して降水量が多い。", box_poly(112, -10, 155, 10))
    add("enso_norm_cold", "enso", "normal", "band", "cold_upwell", "平常時の冷水・湧昇流域（ペルー沖）", "深層から栄養塩に富む冷水が湧き上がり（湧昇流）、アンチョビの好漁場となり、沿岸は低温で乾燥（アタカマ砂漠等）する。", box_poly(-92, -20, -70, 2))

    # El Nino
    add("enso_el_wind", "enso", "elnino", "wind", "wind_el", "エルニーニョ時の貿易風弱化", "太平洋赤道域の東貿易風が弱まり（あるいは一部西風に転じ）、西に溜まっていた暖水が東へ流れ出す。", build_arrow_geom([[145, 0], [175, -1], [-140, -2], [-95, -2]], 3.2))
    add("enso_el_warm", "enso", "elnino", "band", "warm_anomaly", "エルニーニョ時の暖水舌・異常多雨（ペルー沖）", "ペルー沖・エクアドル沖の海水温が上昇し、湧昇流が弱まってアンチョビが不漁になる一方、普段乾燥した沿岸部に豪雨・洪水が発生。", box_poly(-140, -14, -75, 4))
    add("enso_el_dry", "enso", "elnino", "band", "dry_anomaly", "エルニーニョ時の乾燥・干ばつ域（インドネシア・豪州東部）", "暖水が東へ移動した西太平洋では上昇気流が抑えられ、インドネシアやオーストラリア東部で干ばつ・森林火災リスクが上昇。", box_poly(105, -25, 155, 8))

    # La Nina
    add("enso_la_wind", "enso", "lanina", "wind", "trade_strong", "ラニーニャ時の強い東貿易風", "平常時よりさらに東貿易風が強化され、暖かい表層水が西太平洋へ強く吹き寄せられる。", build_arrow_geom([[-82, -2], [-130, -2], [-175, 0], [130, 3]], 3.8))
    add("enso_la_warm", "enso", "lanina", "band", "warm_intense", "ラニーニャ時の強い暖水・豪雨域（東南アジア・豪北東）", "インドネシア〜フィリピン〜オーストラリア北部で積乱雲が異常発達し豪雨・洪水が起きやすくなる。日本も夏は猛暑・冬は厳冬傾向。", box_poly(105, -20, 155, 14))
    add("enso_la_cold", "enso", "lanina", "band", "cold_intense", "ラニーニャ時の低温湧昇強化域（東太平洋）", "ペルー沖〜赤道東部で冷水の湧昇がさらに強まり、水温低下とアメリカ南西部の乾燥・干ばつが強まる。", box_poly(-135, -20, -70, 3))

    # 4. Tropical Cyclones (all)
    cyclone_zones = [
        ("cyc_typhoon_zone", "band", "typhoon", "台風発生・影響域（北西太平洋・南シナ海）", "北西太平洋（赤道付近の北緯5〜20度付近、海面水温26.5〜27℃以上）で発生し、「台風（Typhoon）」と呼ばれる。偏東風・偏西風に乗って放物線を描きフィリピン・台湾・華南・日本を襲う。", box_poly(105, 5, 165, 38)),
        ("cyc_typhoon_path1", "wind", "typhoon", "台風の主要進路（太平洋高気圧縁辺）", "貿易風に乗って西進した後、太平洋高気圧の西縁に沿って北上し偏西風に流されて北東へ転向する。", build_arrow_geom([[142, 11], [128, 17], [125, 26], [138, 36]], 2.8)),
        ("cyc_typhoon_path2", "wind", "typhoon", "台風の南シナ海進路", "フィリピンを通過してベトナム・華南へ上陸する進路。", build_arrow_geom([[135, 10], [122, 14], [108, 18]], 2.5)),
        ("cyc_hurricane_atl", "band", "hurricane", "ハリケーン発生域（北大西洋・カリブ海・メキシコ湾）", "大西洋・カリブ海・北東太平洋では「ハリケーン（Hurricane）」と呼ばれ、メキシコ湾岸の油田や米国南東部（フロリダ・ニューオーリンズ等）へ高潮・暴風被害を与える。", box_poly(-105, 10, -55, 35)),
        ("cyc_hurricane_path", "wind", "hurricane", "ハリケーン主要進路（大西洋→米国南東部）", "北東貿易風に乗ってカリブ海・メキシコ湾へ西進し、北上して米国東岸へ抜ける。", build_arrow_geom([[-58, 13], [-75, 19], [-88, 26], [-80, 34]], 2.8)),
        ("cyc_cyclone_ind", "band", "cyclone", "サイクロン発生域（インド洋・ベンガル湾）", "インド洋および南太平洋では「サイクロン（Cyclone）」と呼ばれる。特にベンガル湾奥のバングラデシュ低平デルタでは高潮による甚大な水害が頻発。", box_poly(55, 5, 98, 25)),
        ("cyc_cyclone_path", "wind", "cyclone", "サイクロン主要進路（ベンガル湾→バングラデシュ）", "ベンガル湾の暖かい海上から北上し、低平なガンジス・ブラマプトラデルタへ高潮をもたらす。", build_arrow_geom([[88, 8], [89, 15], [90.5, 22.5]], 2.6)),
        ("cyc_cyclone_aus", "band", "cyclone", "サイクロン発生域（豪州北方・南太平洋）", "南半球のため時計回りの渦を巻き、オーストラリア北部・フィジー・バヌアツなどに接近する。", box_poly(110, -25, 180, -8)),
    ]
    for cid, kind, sub, name, desc, geom in cyclone_zones:
        add(cid, "cyclone", "all", kind, sub, name, desc, geom)

    return feats


SPECIAL_GAZETTEER_EXTRAS = [
    # Major soils, agricultural belts, regions, straits & exam terms with bounds or point highlights
    {
        "id": "pl_chernozem",
        "name": "チェルノーゼム",
        "aliases": ["黒土", "黒色土"],
        "category": "土壌・農業帯",
        "summary": "ウクライナからロシア南部・カザフスタン北部の半乾燥ステップに分布する腐植に富む極めて肥沃な黒色土。世界有数の小麦・ヒマワリ栽培地帯。",
        "lng": 36.0,
        "lat": 49.5,
        "zoom": 4.2,
        "bounds": [26.0, 46.0, 74.0, 55.2],
        "geometry": {"type": "Polygon", "coordinates": [[[26, 46.5], [33, 46.2], [40, 47.0], [49, 49.5], [58, 50.8], [73, 51.5], [75, 54.8], [62, 55.2], [48, 54.0], [36, 52.0], [27, 50.2], [26, 46.5]]]},
    },
    {
        "id": "pl_terra_roxa",
        "name": "テラローシャ",
        "aliases": ["赤紫色土"],
        "category": "土壌・農業帯",
        "summary": "ブラジル南部パラナ高原〜サンパウロ州にかけて玄武岩の風化で生じた肥沃な暗紫赤色土壌。コーヒー大農園や大豆栽培を支えた。",
        "lng": -50.5,
        "lat": -23.0,
        "zoom": 5.0,
        "bounds": [-55.0, -26.0, -46.0, -19.5],
        "geometry": {"type": "Polygon", "coordinates": [[[-55, -26], [-46, -25], [-46, -19.5], [-54, -20], [-55, -26]]]},
    },
    {
        "id": "pl_regur",
        "name": "レグール",
        "aliases": ["黒色綿花土", "デカン高原"],
        "category": "土壌・農業帯",
        "summary": "インドのデカン高原北西部に広がる玄武岩溶岩由来の黒色土。保水性に優れ綿花栽培の一大産地。",
        "lng": 76.5,
        "lat": 19.8,
        "zoom": 5.0,
        "bounds": [72.5, 15.0, 80.5, 24.0],
        "geometry": {"type": "Polygon", "coordinates": [[[72.5, 16], [80.5, 16], [80.5, 24], [73, 23], [72.5, 16]]]},
    },
    {
        "id": "pl_latosol",
        "name": "ラトソル",
        "aliases": [],
        "category": "成帯土壌（熱帯）",
        "summary": "熱帯雨林・サバナ地域の高温多雨で塩基や有機物が溶脱し、鉄・アルミニウム酸化物が残った強酸性の赤色土（アマゾン・コンゴ盆地等）。",
        "lng": -58.0,
        "lat": -5.0,
        "zoom": 3.8,
        "bounds": [-72.0, -14.0, -46.0, 4.0],
        "geometry": {"type": "Polygon", "coordinates": [[[-72, -13], [-46, -13], [-47, 3], [-71, 3], [-72, -13]]]},
    },
    {
        "id": "pl_podzol",
        "name": "ポドゾル",
        "aliases": [],
        "category": "成帯土壌（亜寒帯）",
        "summary": "冷涼湿潤なタイガ（針葉樹林）に分布する強酸性の灰白色土。農業生産力は低いため林業・酪農や飼料作物栽培が中心（北欧・シベリア・カナダ）。",
        "lng": 68.0,
        "lat": 61.5,
        "zoom": 3.6,
        "bounds": [28.0, 56.0, 115.0, 67.0],
        "geometry": {"type": "Polygon", "coordinates": [[[28, 57], [115, 57], [115, 67], [28, 67], [28, 57]]]},
    },
    {
        "id": "pl_terra_rossa",
        "name": "テラロッサ",
        "aliases": [],
        "category": "間帯土壌（地中海）",
        "summary": "地中海沿岸の石灰岩の溶食残留物からなる赤い間帯土壌。水はけがよくオリーブ・ブドウ・柑橘など地中海式農業に適する。",
        "lng": 15.0,
        "lat": 41.0,
        "zoom": 4.8,
        "bounds": [-4.0, 36.0, 26.0, 45.0],
        "geometry": {"type": "Polygon", "coordinates": [[[-4, 36], [26, 36], [26, 45], [-4, 44], [-4, 36]]]},
    },
    {
        "id": "pl_andosol",
        "name": "黒ボク土",
        "aliases": ["火山灰土"],
        "category": "間帯土壌（火山帯）",
        "summary": "火山灰を母材に多量の腐植が集積した黒色土壌（関東ローム層やジャワ島・NZ北島）。リン酸固定が強い酸性だが畑作に広く利用。",
        "lng": 139.0,
        "lat": 36.2,
        "zoom": 5.5,
        "bounds": [130.0, 31.0, 145.0, 44.0],
        "geometry": {"type": "Polygon", "coordinates": [[[130, 31], [145, 34], [145, 44], [136, 40], [130, 31]]]},
    },
    {
        "id": "pl_loess",
        "name": "黄土",
        "aliases": ["レス", "黄土高原"],
        "category": "風積土壌（中国）",
        "summary": "内陸砂漠から偏西風で運ばれ堆積した肥沃な黄土（レス）。中国・黄土高原の洞窟住居「窯洞（ヤオトン）」や黄河の土砂供給源として著名。",
        "lng": 109.0,
        "lat": 36.8,
        "zoom": 5.4,
        "bounds": [103.5, 34.0, 114.5, 40.5],
        "geometry": {"type": "Polygon", "coordinates": [[[103.5, 34], [114.5, 34], [114.5, 40.5], [103.5, 40], [103.5, 34]]]},
    },
    {
        "id": "pl_cerrado",
        "name": "セラード",
        "aliases": ["セラード開発"],
        "category": "南米草原・大豆開拓地",
        "summary": "ブラジル中央高原の熱帯サバナ（本来は強酸性・貧栄養）を石灰散布と品種改良により世界最大級の大豆・トウモロコシ生産地帯へ開拓。",
        "lng": -48.5,
        "lat": -14.5,
        "zoom": 4.5,
        "bounds": [-58.0, -22.0, -42.0, -6.0],
        "geometry": {"type": "Polygon", "coordinates": [[[-57, -21.5], [-43, -20.5], [-42, -6.5], [-55, -7.5], [-57, -21.5]]]},
    },
    {
        "id": "pl_llanos",
        "name": "リャノ",
        "aliases": ["オリノコ川"],
        "category": "南米熱帯草原（サバナ）",
        "summary": "ベネズエラ〜コロンビア東部のオリノコ川流域に広がる熱帯長草草原（サバナ気候 Aw）。雨季に一部浸水し、乾季を中心に粗放的な牛放牧が行われる。",
        "lng": -67.5,
        "lat": 7.5,
        "zoom": 5.2,
        "bounds": [-73.0, 4.0, -62.0, 10.5],
        "geometry": {"type": "Polygon", "coordinates": [[[-72.5, 4.5], [-62.5, 7.0], [-63.0, 10.2], [-70.5, 9.5], [-72.5, 4.5]]]},
    },
    {
        "id": "pl_selva",
        "name": "セルバ",
        "aliases": ["アマゾン熱帯雨林"],
        "category": "南米熱帯雨林（Af）",
        "summary": "アマゾン川流域に広がる世界最大の熱帯雨林（密林）。高温多雨の赤道低圧帯に位置しラトソルが分布。焼畑や道路沿いの伐採・牧草地化が環境問題。",
        "lng": -61.5,
        "lat": -4.0,
        "zoom": 4.0,
        "bounds": [-75.5, -12.5, -48.0, 3.5],
        "geometry": {"type": "Polygon", "coordinates": [[[-75, -11], [-49, -11], [-48.5, 2.5], [-72, 3.0], [-75, -11]]]},
    },
    {
        "id": "pl_campo",
        "name": "カンポ",
        "aliases": [],
        "category": "南米草原（ブラジル南部）",
        "summary": "ブラジル高原南部〜ウルグアイ北部にかけて広がる熱帯〜温帯草原。牛などの商業的牧畜や南部での穀物栽培が行われる。",
        "lng": -53.5,
        "lat": -28.5,
        "zoom": 5.0,
        "bounds": [-58.5, -33.5, -48.0, -23.0],
        "geometry": {"type": "Polygon", "coordinates": [[[-58, -33], [-49, -31], [-48.5, -24], [-55.5, -23.5], [-58, -33]]]},
    },
    {
        "id": "pl_caatinga",
        "name": "カーチンガ",
        "aliases": [],
        "category": "南米半乾燥低木林",
        "summary": "ブラジル北東部（ノルデステ内陸）に広がる有刺低木・サボテン等の半乾燥地帯（BS/Aw境界）。干ばつが頻発し南部大都市への国内移住の送り出し地域。",
        "lng": -40.5,
        "lat": -9.0,
        "zoom": 5.0,
        "bounds": [-45.5, -14.5, -36.0, -3.5],
        "geometry": {"type": "Polygon", "coordinates": [[[-45, -14], [-36.5, -12], [-36.5, -4], [-43.5, -4.5], [-45, -14]]]},
    },
    {
        "id": "pl_gran_chaco",
        "name": "グランチャコ",
        "aliases": [],
        "category": "南米半乾燥疎林・草原",
        "summary": "パラグアイ・アルゼンチン北部・ボリビア南東部にまたがる亜熱帯の疎林・乾燥サバナ低地。硬木ケブラチョ林や粗放的牧畜・近年は大豆拡大。",
        "lng": -61.5,
        "lat": -24.5,
        "zoom": 4.8,
        "bounds": [-65.0, -30.5, -57.5, -18.5],
        "geometry": {"type": "Polygon", "coordinates": [[[-64.5, -30], [-58.0, -29.5], [-58.0, -19], [-63.5, -19], [-64.5, -30]]]},
    },
    {
        "id": "pl_pampa",
        "name": "パンパ",
        "aliases": [],
        "category": "温帯草原（緑：湿潤 / 橙：乾燥）",
        "summary": "アルゼンチン東部の広大な温帯草原。中央を通る年降水量550mm線を境に、東側が【湿潤パンパ】（小麦・大豆・トウモロコシの混合/穀物地帯）、西側が【乾燥パンパ】（牛肉などの企業的牧畜）に分かれる。",
        "lng": -61.8,
        "lat": -35.2,
        "zoom": 4.9,
        "bounds": [-66.8, -39.8, -56.5, -30.5],
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[-66.5, -39.5], [-57.0, -38.5], [-56.8, -30.5], [-65.5, -31.0], [-66.5, -39.5]]],
        },
        "subFeatures": [
            {
                "label": "湿潤パンパ（東部：年550mm以上／小麦・大豆・トウモロコシ）",
                "fillColor": "#16a34a",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[[-62.2, -39.0], [-57.0, -38.5], [-56.8, -30.5], [-61.8, -30.8], [-62.2, -39.0]]],
                },
            },
            {
                "label": "乾燥パンパ（西部：年550mm未満／牛の企業的放牧）",
                "fillColor": "#d97706",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[[-66.5, -39.5], [-62.2, -39.0], [-61.8, -30.8], [-65.5, -31.0], [-66.5, -39.5]]],
                },
            },
        ],
    },
    {
        "id": "pl_pampa_humid",
        "name": "湿潤パンパ",
        "aliases": [],
        "category": "温帯農業帯（パンパ東部）",
        "summary": "年降水量550mm以上のパンパ東部（ブエノスアイレス側）。肥沃なパンパ土（プレーリー土）に恵まれ小麦・大豆・トウモロコシ栽培と集約牧畜が営まれる。",
        "lng": -59.6,
        "lat": -34.8,
        "zoom": 5.2,
        "bounds": [-63.0, -39.2, -56.8, -30.5],
        "geometry": {"type": "Polygon", "coordinates": [[[-62.2, -39.0], [-57.0, -38.5], [-56.8, -30.5], [-61.8, -30.8], [-62.2, -39.0]]]},
    },
    {
        "id": "pl_pampa_dry",
        "name": "乾燥パンパ",
        "aliases": [],
        "category": "温帯草原（パンパ西部）",
        "summary": "年降水量550mm未満のパンパ西部。半乾燥の短草草原で肉牛などの企業的・粗放的放牧が行われる。",
        "lng": -64.2,
        "lat": -35.2,
        "zoom": 5.2,
        "bounds": [-66.8, -39.5, -61.8, -30.8],
        "geometry": {"type": "Polygon", "coordinates": [[[-66.5, -39.5], [-62.2, -39.0], [-61.8, -30.8], [-65.5, -31.0], [-66.5, -39.5]]]},
    },
    {
        "id": "pl_patagonia",
        "name": "パタゴニア",
        "aliases": ["パタゴニア台地"],
        "category": "南米雨陰ステップ・砂漠",
        "summary": "南アメリカ南部の階段状台地。南緯40〜50度の偏西風がアンデス山脈を越えて乾いたおろし風となるため降水量が少なく（雨蔭砂漠）、広大な羊の粗放的放牧が中心。",
        "lng": -68.5,
        "lat": -45.5,
        "zoom": 4.6,
        "bounds": [-72.5, -52.5, -64.5, -39.5],
        "geometry": {"type": "Polygon", "coordinates": [[[-72.0, -52.0], [-66.0, -51.5], [-64.5, -40.0], [-71.0, -40.0], [-72.0, -52.0]]]},
    },
    {
        "id": "pl_prairie",
        "name": "プレーリー",
        "aliases": ["コーンベルト", "グレートプレーンズ"],
        "category": "北米農業帯",
        "summary": "西経100度付近の肥沃な長草草原プレーリー（小麦・コーンベルト）と西側の短草ステップのグレートプレーンズ（センターピボット灌漑・企業的牧畜）。",
        "lng": -98.0,
        "lat": 41.0,
        "zoom": 4.2,
        "bounds": [-106.0, 32.0, -86.0, 51.0],
        "geometry": {"type": "Polygon", "coordinates": [[[-106, 33], [-86, 35], [-86, 46], [-105, 51], [-106, 33]]]},
    },
    {
        "id": "pl_sunbelt",
        "name": "サンベルト",
        "aliases": ["シリコンバレー", "ヒューストン"],
        "category": "米国工業地域",
        "summary": "北緯37度以南の温暖な米国南西部〜南部地域。航空宇宙・石油化学（ヒューストン）、半導体・ICT（シリコンバレー、テキサス）で人口・産業が急成長。",
        "lng": -99.0,
        "lat": 32.5,
        "zoom": 4.0,
        "bounds": [-123.0, 26.0, -76.0, 37.5],
        "geometry": {"type": "Polygon", "coordinates": [[[-123, 26], [-76, 26], [-76, 37.5], [-123, 37.5], [-123, 26]]]},
    },
    {
        "id": "pl_rustbelt",
        "name": "ラストベルト",
        "aliases": ["五大湖", "ピッツバーグ", "デトロイト"],
        "category": "米国旧工業地域",
        "summary": "アパラチア炭田とメサビ鉄鉱石で重工業が栄えた北東部〜五大湖地域。脱工業化（空洞化）で衰退し「錆びた工業地帯」とも呼ばれる。",
        "lng": -83.0,
        "lat": 41.8,
        "zoom": 4.8,
        "bounds": [-91.0, 38.5, -73.0, 46.5],
        "geometry": {"type": "Polygon", "coordinates": [[[-91, 38.5], [-73, 39], [-73, 46], [-91, 46], [-91, 38.5]]]},
    },
    {
        "id": "pl_sahel",
        "name": "サヘル",
        "aliases": ["サヘル地帯"],
        "category": "環境問題・ステップ帯",
        "summary": "サハラ砂漠南縁に東西に伸びる半乾燥ステップ地帯。過放牧・過耕作・薪炭材の過剰伐採と干ばつが重なり砂漠化が進行。",
        "lng": 8.0,
        "lat": 14.5,
        "zoom": 4.0,
        "bounds": [-17.0, 11.5, 38.0, 18.0],
        "geometry": {"type": "Polygon", "coordinates": [[[-17, 11.5], [38, 11.5], [38, 18], [-17, 18], [-17, 11.5]]]},
    },
    {
        "id": "pl_qinling",
        "name": "秦嶺・淮河線",
        "aliases": ["秦嶺・淮河"],
        "category": "気候・農業境界",
        "summary": "中国の年降水量約800mm・1月平均気温0℃線に沿う重要境界。北は小麦・畑作、南は米・水田稲作に分かれる。",
        "lng": 113.5,
        "lat": 33.2,
        "zoom": 4.8,
        "geometry": {"type": "LineString", "coordinates": [[104.0, 34.0], [112.0, 33.5], [120.5, 33.0]]},
    },
    {
        "id": "pl_ruhr",
        "name": "ルール",
        "aliases": ["ルール工業地域", "ルール炭田"],
        "category": "欧州工業地域",
        "summary": "ドイツ西部のルール川・ライン川沿いに発達した欧州最大の重工業地帯。石炭閉山後は環境技術や先端研究・物流拠点へ構造転換。",
        "lng": 7.2,
        "lat": 51.48,
        "zoom": 7.2,
    },
    {
        "id": "pl_polder",
        "name": "ポルダー",
        "aliases": ["アイセル湖", "ロッテルダム", "ユーロポート"],
        "category": "低地干拓・物流",
        "summary": "オランダの堤防と排水によって海面下から陸地化された干拓地。園芸農業や酪農が極めて集約的に行われる。",
        "lng": 5.3,
        "lat": 52.45,
        "zoom": 7.0,
    },
    {
        "id": "pl_fergana",
        "name": "フェルガナ",
        "aliases": ["フェルガナ盆地", "サマルカンド", "アラル海"],
        "category": "オアシス・環境問題",
        "summary": "天山・パミール山麓の雪解け水による肥沃な盆地と、ソ連時代の綿花過大灌漑で縮小したアラル海（カザフスタン・ウズベキスタン国境）。",
        "lng": 60.0,
        "lat": 45.0,
        "zoom": 5.2,
    },
    {
        "id": "pl_maquiladora",
        "name": "マキラドーラ",
        "aliases": ["ティフアナ", "シウダードフアレス"],
        "category": "輸出加工区",
        "summary": "メキシコの米国国境地帯に展開した保税加工区。安価な労働力とUSMCA無関税を生かし自動車・電子機器を組立・対米輸出。",
        "lng": -106.45,
        "lat": 31.69,
        "zoom": 5.4,
    },
    {
        "id": "pl_pilbara",
        "name": "ピルバラ",
        "aliases": ["ピルバラ地域"],
        "category": "鉄鉱石産地",
        "summary": "オーストラリア北西部の先カンブリア時代安定陸塊（縞状鉄鉱層）の巨大鉄鉱石産地。自動運転ダンプ等で採掘し日中へ大量輸出。",
        "lng": 118.5,
        "lat": -22.3,
        "zoom": 5.2,
    },
    {
        "id": "pl_great_artesian",
        "name": "大鑽井盆地",
        "aliases": ["グレートアーテジアン盆地"],
        "category": "被圧地下水・牧畜",
        "summary": "オーストラリア内陸に広がる世界最大級の被圧地下水盆地。掘り抜き井戸から自噴する塩分を含む水を羊や肉牛の飲料水に利用。",
        "lng": 143.0,
        "lat": -25.0,
        "zoom": 4.6,
        "bounds": [134.0, -30.0, 149.0, -16.0],
        "geometry": {"type": "Polygon", "coordinates": [[[134, -29], [148, -29], [148, -16], [137, -18], [134, -29]]]},
    },
    {
        "id": "pl_hawaii",
        "name": "ハワイ",
        "aliases": ["ハワイ諸島"],
        "category": "ホットスポット・太平洋",
        "summary": "太平洋プレート内部のホットスポット（マントル上昇流）でできた火山島列。マウナ・ロアやキラウエアなどの盾状火山が特徴。",
        "lng": -155.5,
        "lat": 19.7,
        "zoom": 6.0,
    },
    {
        "id": "pl_tibet",
        "name": "チベット",
        "aliases": ["チベット高原", "ラサ"],
        "category": "高原・民族地域",
        "summary": "平均標高4,000m超の「世界の屋根」（高山気候ET/ETH）。ヤクの遊牧やチベット仏教文化が息づく。",
        "lng": 90.0,
        "lat": 30.5,
        "zoom": 4.8,
        "bounds": [78.0, 27.5, 102.0, 36.0],
        "geometry": {"type": "Polygon", "coordinates": [[[78, 28], [102, 28], [100, 36], [79, 35], [78, 28]]]},
    },
    {
        "id": "pl_niger_delta",
        "name": "ニジェール川デルタ",
        "aliases": ["ニジェールデルタ"],
        "category": "三角州・産油地",
        "summary": "ナイジェリア南部のギニア湾に張り出す大三角州。アフリカの主要産油地帯で環境汚染や資源分配対立も課題。",
        "lng": 6.3,
        "lat": 5.0,
        "zoom": 6.5,
    },
    {
        "id": "pl_katanga",
        "name": "カタンガ",
        "aliases": ["カタンガ地方", "ルブンバシ"],
        "category": "レアメタル鉱業地帯",
        "summary": "コンゴ民主共和国南部〜ザンビアにまたがる「カッパーベルト」。世界シェア過半数のコバルトや銅鉱石を産出。",
        "lng": 26.8,
        "lat": -11.0,
        "zoom": 5.8,
    },
    {
        "id": "pl_hokkaido",
        "name": "十勝",
        "aliases": ["石狩平野", "北海道", "道東"],
        "category": "日本の農業・気候",
        "summary": "寒冷な亜寒帯気候を生かした大規模畑作（ジャガイモ・テンサイ・小麦）と酪農が営まれる。",
        "lng": 143.2,
        "lat": 42.9,
        "zoom": 6.2,
    },
    {
        "id": "pl_shenzhen",
        "name": "深セン",
        "aliases": ["珠江デルタ", "香港"],
        "category": "経済特区・ICT",
        "summary": "1980年に最初の経済特区に指定され漁村から世界有数のハイテク・電子製品都市へ急成長。",
        "lng": 114.06,
        "lat": 22.54,
        "zoom": 7.2,
    },
    {
        "id": "pl_hsinchu",
        "name": "新竹",
        "aliases": [],
        "category": "先端工業団地",
        "summary": "台湾北西部の科学園区。世界最大のロジック半導体ファウンドリが集積。",
        "lng": 120.97,
        "lat": 24.81,
        "zoom": 7.5,
    },
    {
        "id": "pl_baku",
        "name": "バクー",
        "aliases": ["カスピ海", "バクー油田"],
        "category": "油田・内陸海",
        "summary": "世界最大の湖（塩湖）であるカスピ海西岸の古来油田地帯（アゼルバイジャン）。BTCパイプラインの起点。",
        "lng": 49.87,
        "lat": 40.41,
        "zoom": 5.8,
    },
    {
        "id": "pl_aswan",
        "name": "アスワン・ハイ・ダム",
        "aliases": ["ナイル川", "ナイルデルタ"],
        "category": "外来河川・ダム開発",
        "summary": "ナイル川上流に建設された巨大ダム。洪水制御・水力発電・通年灌漑を可能にした一方、下流デルタへの肥沃土供給停止や塩害を引き起こした。",
        "lng": 32.88,
        "lat": 23.97,
        "zoom": 6.0,
    },
]


def build_gazetteer(
    countries_json: dict,
    geo_layers: dict,
    capitals: list[dict],
    volcanoes: list[dict],
    top_cities: dict,
    photos_map: dict[str, dict],
) -> list[dict]:
    places: list[dict] = []
    seen_names: set[str] = set()

    def register(
        pid: str,
        name: str,
        category: str,
        summary: str,
        lng: float,
        lat: float,
        zoom: float = 6.0,
        iso3: str | None = None,
        bounds: list[float] | None = None,
        geometry: dict | None = None,
        aliases: list[str] | None = None,
        sub_features: list[dict] | None = None,
        photo_id: str | None = None,
    ):
        clean_name = name.strip()
        if not clean_name or clean_name in seen_names or len(clean_name) < 2:
            return
        seen_names.add(clean_name)
        entry: dict = {
            "id": pid,
            "name": clean_name,
            "aliases": [a for a in (aliases or []) if len(a) >= 2],
            "category": category,
            "summary": summary,
            "lng": round(float(lng), 3),
            "lat": round(float(lat), 3),
            "zoom": zoom,
        }
        if iso3:
            entry["iso3"] = iso3
        if bounds:
            entry["bounds"] = bounds
        if geometry:
            entry["geometry"] = geometry
        if sub_features:
            entry["subFeatures"] = sub_features
        ph = photos_map.get(photo_id or pid)
        if ph:
            entry["photoUrl"] = ph["url"]
            entry["photoCaption"] = ph["caption"]
            entry["photoCredit"] = ph["credit"]
        places.append(entry)

    # 1. Special soil / agricultural / regional gazetteer entries first (highest priority!)
    for ex in SPECIAL_GAZETTEER_EXTRAS:
        register(
            ex["id"],
            ex["name"],
            ex["category"],
            ex["summary"],
            ex["lng"],
            ex["lat"],
            ex.get("zoom", 5.5),
            bounds=ex.get("bounds"),
            geometry=ex.get("geometry"),
            aliases=ex.get("aliases"),
            sub_features=ex.get("subFeatures"),
            photo_id=ex["id"],
        )

    # 2. Volcanoes & hotspots
    for v in volcanoes:
        p = v["properties"]
        c = v["geometry"]["coordinates"]
        short = p["nameJa"].split("（")[0]
        register(
            p["id"],
            short,
            f"火山（{p['volcanoTypeJa'].split('（')[0]}）",
            p["description"],
            c[0],
            c[1],
            zoom=6.5,
            iso3=p.get("iso3"),
            aliases=[p["nameJa"]] if p["nameJa"] != short else [],
            photo_id=p["id"],
        )

    # 3. Special regions from countries
    for iso3, t_entry in top_cities.items():
        for idx, sr in enumerate(t_entry.get("specialRegions", [])):
            short = sr["name"].split("（")[0]
            register(
                f"pl_sr_{iso3}_{idx}",
                short,
                f"注目地域（{sr['tag']}）",
                sr["description"],
                sr["lng"],
                sr["lat"],
                zoom=sr.get("zoom", 6.0),
                iso3=iso3,
                aliases=[sr["name"]] if sr["name"] != short else [],
            )

    # 4. Climate 87 cities
    for iso3, cdata in countries_json.items():
        for ct in cdata.get("climate", {}).get("cities", []):
            register(
                f"pl_clim_{ct['cityId']}",
                ct["nameJa"],
                f"気候都市（{ct['koppenCode']}）",
                f"{cdata['nameJa']}の代表都市。気候区分 {ct['koppenCode']}（{ct.get('koppenNameJa', '')}）。成因: {' / '.join(ct.get('factors', [])[:2])}",
                ct["lng"],
                ct["lat"],
                zoom=6.5,
                iso3=iso3,
            )

    # 5. Top cities (including capitals)
    for iso3, t_entry in top_cities.items():
        c_name = countries_json.get(iso3, {}).get("nameJa", iso3)
        for idx, city in enumerate(t_entry.get("topCities", [])):
            short = city["nameJa"].split("（")[0].split("／")[0]
            register(
                f"pl_top_{iso3}_{idx}",
                short,
                "首都・主要都市" if city.get("isCapital") else "主要都市",
                f"{c_name}の都市（約{city['popMan']}万人）。{city.get('note', '')}",
                city["lng"],
                city["lat"],
                zoom=6.5,
                iso3=iso3,
            )

    # 6. Physical Geo Layers (rivers, mountains, straits, landforms)
    for feat in geo_layers.get("features", []):
        p = feat["properties"]
        geom = feat["geometry"]
        gtype = geom["type"]
        coords = geom["coordinates"]
        all_pts = []
        if gtype == "Point":
            all_pts = [coords]
        elif gtype == "LineString":
            all_pts = coords
        elif gtype == "MultiLineString":
            for ln in coords:
                all_pts.extend(ln)
        if not all_pts:
            continue
        lons = [pt[0] for pt in all_pts]
        lats = [pt[1] for pt in all_pts]
        mid_lon = sum(lons) / len(lons)
        mid_lat = sum(lats) / len(lats)
        bounds = (
            [round(min(lons), 2), round(min(lats), 2), round(max(lons), 2), round(max(lats), 2)]
            if gtype != "Point"
            else None
        )
        short = p["nameJa"].split("（")[0]
        register(
            f"pl_geo_{p['id']}",
            short,
            p.get("subTypeJa") or p["layerType"],
            p.get("summary", ""),
            mid_lon,
            mid_lat,
            zoom=5.0 if gtype != "Point" else 6.8,
            bounds=bounds,
            geometry=geom if gtype != "Point" else None,
            aliases=[p["nameJa"]] if p["nameJa"] != short else [],
            photo_id=p["id"],
        )

    # 7. Remaining capitals
    for cap in capitals:
        p = cap["properties"]
        c = cap["geometry"]["coordinates"]
        register(
            p["id"],
            p["nameJa"],
            "首都",
            p.get("note", ""),
            c[0],
            c[1],
            zoom=6.2,
            iso3=p.get("iso3"),
        )

    return places


def main() -> None:
    countries_json = json.loads(COUNTRIES_PATH.read_text(encoding="utf-8"))["countries"]
    geo_layers = json.loads(GEO_LAYERS_PATH.read_text(encoding="utf-8"))
    top_cities = json.loads(TOP_CITIES_PATH.read_text(encoding="utf-8"))
    photos_map: dict[str, dict] = {}
    if PLACE_PHOTOS_PATH.exists():
        photos_map = json.loads(PLACE_PHOTOS_PATH.read_text(encoding="utf-8"))

    capitals = build_capitals(countries_json, top_cities)
    CAPITALS_OUT.write_text(
        json.dumps({"type": "FeatureCollection", "features": capitals}, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"Wrote {len(capitals)} capitals to {CAPITALS_OUT.name}")

    volcanoes = build_volcanoes(photos_map)
    VOLCANOES_OUT.write_text(
        json.dumps({"type": "FeatureCollection", "features": volcanoes}, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"Wrote {len(volcanoes)} volcanoes to {VOLCANOES_OUT.name}")

    phenomena = build_climate_phenomena()
    PHENOMENA_OUT.write_text(
        json.dumps({"type": "FeatureCollection", "features": phenomena}, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"Wrote {len(phenomena)} climate phenomena features to {PHENOMENA_OUT.name}")

    places = normalize_koppen_obj(
        build_gazetteer(countries_json, geo_layers, capitals, volcanoes, top_cities, photos_map)
    )
    PLACES_OUT.write_text(
        json.dumps({"places": places}, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"Wrote {len(places)} clickable gazetteer places to {PLACES_OUT.name}")


if __name__ == "__main__":
    main()
