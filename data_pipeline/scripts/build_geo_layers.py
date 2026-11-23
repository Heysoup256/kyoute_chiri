"""Build enriched app/public/data/geo_layers_v1.geojson with directional ocean currents, submerged/karst/coral landforms, and real photos."""

from __future__ import annotations

import json
import math
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]
RAW_DIR = ROOT_DIR / "data_pipeline" / "raw"
DATA_DIR = ROOT_DIR / "app" / "public" / "data"

BASE_PHYS_PATH = RAW_DIR / "base_physical_features_v1.json"
PLACE_PHOTOS_PATH = RAW_DIR / "place_photos_v1.json"
OUT_PATH = DATA_DIR / "geo_layers_v1.geojson"

LANDFORM_SUBTYPE_JA = {
    "fjord": "沈水地形（フィヨルド・氷食谷）",
    "rias": "沈水地形（リアス海岸・V字谷沈水）",
    "estuary": "沈水地形（エスチュアリー／三角江）",
    "dalmatian": "沈水地形（ダルマチア海岸）",
    "karst": "カルスト地形（石灰岩溶食）",
    "coral_reef": "サンゴ礁（裾礁・堡礁・環礁）",
    "delta": "堆積地形（三角州／デルタ）",
    "polder": "干拓低地（ポルダー）",
    "cuesta": "構造平野・差別侵食（ケスタ）",
    "desert": "海岸砂漠（寒流・湧昇流）",
    "glacial_lake": "氷河湖（氷食盆地）",
    "environmental": "内陸塩湖・環境問題",
}

# Comprehensive 24 textbook ocean currents with explicit directional arrows
OCEAN_CURRENTS = [
    # Pacific Warm Currents
    (
        "oc_kuroshio",
        "warm",
        "黒潮（日本海流・暖流）",
        "南西 → 北東",
        ["TWN", "JPN", "PHL"],
        "台湾東岸から日本列島太平洋岸を北東へ流れる世界最大級の強暖流。親潮とぶつかる三陸沖は潮目の世界三大漁場。冬の気候温暖化をもたらす。",
        "S",
        [[122.0, 21.0], [126.0, 26.5], [132.5, 31.5], [139.5, 34.5], [148.0, 37.5]],
    ),
    (
        "oc_tsushima",
        "warm",
        "対馬海流（暖流）",
        "南西 → 北東",
        ["JPN", "KOR"],
        "黒潮から分岐して対馬海峡を通り日本海を北東へ流れる暖流。冬季の北西季節風に大量の水蒸気を供給し、日本海側・北陸〜東北に世界有数の豪雪をもたらす。",
        "S",
        [[127.0, 31.5], [130.5, 35.5], [135.5, 38.5], [139.0, 42.5]],
    ),
    (
        "oc_north_pacific",
        "warm",
        "北太平洋海流（暖流）",
        "西 → 東",
        ["JPN", "USA", "CAN"],
        "黒潮と親潮が合流し偏西風に乗って北太平洋を西から東へ横断する海流。北米西岸に到達し北上するアラスカ海流と南下するカリフォルニア海流に分かれる。",
        "A",
        [[152.0, 39.0], [175.0, 42.0], [-160.0, 44.0], [-135.0, 45.0]],
    ),
    (
        "oc_alaska",
        "warm",
        "アラスカ海流（暖流）",
        "南 → 北西（反時計回り）",
        ["CAN", "USA"],
        "北太平洋海流の北分岐。カナダ・バンクーバーやアラスカ南岸を温暖・多雨（西岸海洋性気候 Cfb〜Dfc）にし、不凍港アンカレッジ等をもたらす。",
        "A",
        [[-131.0, 48.0], [-135.0, 54.5], [-144.0, 59.0], [-155.0, 57.5]],
    ),
    (
        "oc_n_eq_pac",
        "warm",
        "北赤道海流（太平洋・暖流）",
        "東 → 西",
        ["MEX", "PHL"],
        "北東貿易風によってメキシコ沖からフィリピン沖へ西流する暖流。西太平洋（東南アジア）に暖水と高い降水をもたらし、一部は北上して黒潮となる。",
        "B",
        [[-115.0, 14.0], [-145.0, 14.0], [170.0, 14.0], [135.0, 15.0]],
    ),
    (
        "oc_s_eq_pac",
        "warm",
        "南赤道海流（太平洋・暖流）",
        "東 → 西",
        ["PER", "IDN", "AUS"],
        "南東貿易風に押され南米沖からインドネシア・オーストラリア方面へ西流する暖流。エルニーニョ現象時には弱まる。",
        "B",
        [[-100.0, -5.0], [-140.0, -6.0], [175.0, -7.0], [150.0, -10.0]],
    ),
    (
        "oc_east_australia",
        "warm",
        "東オーストラリア海流（暖流）",
        "北 → 南",
        ["AUS", "NZL"],
        "南赤道海流がオーストラリア東岸沿いに南下する暖流。グレートバリアリーフのサンゴ礁育成やシドニーの温暖湿潤気候（Cfa）に寄与。",
        "A",
        [[152.0, -14.0], [154.0, -23.0], [153.0, -31.0], [150.5, -38.0]],
    ),
    # Pacific Cold Currents
    (
        "oc_oyashio",
        "cold",
        "親潮（千島海流・寒流）",
        "北東 → 南西",
        ["RUS", "JPN"],
        "ベーリング海・千島列島沿いに南下する栄養塩（プランクトン）豊富な寒流。黒潮との潮目で好漁場をつくるほか、夏に濃霧（釧路）や冷害風（やませ）を起こす。",
        "S",
        [[160.0, 52.0], [152.0, 46.5], [146.5, 43.0], [142.5, 38.5]],
    ),
    (
        "oc_california",
        "cold",
        "カリフォルニア海流（寒流）",
        "北西 → 南東",
        ["USA", "MEX"],
        "北米西岸沖を南下する寒流。サンフランシスコの夏を17℃前後に冷やし海霧を発生させ（Csb）、南部のメキシコ・バハカリフォルニア砂漠を形成する。",
        "S",
        [[-127.0, 45.0], [-125.0, 38.5], [-121.0, 33.0], [-115.0, 25.0]],
    ),
    (
        "oc_peru",
        "cold",
        "ペルー海流（フンボルト海流・寒流）",
        "南 → 北",
        ["CHL", "PER", "ECU"],
        "チリ・ペルー沖を北上する強い湧昇寒流。アンチョビの世界有数漁場を生む一方、空気を冷やして上昇気流を抑え、アタカマ砂漠などの海岸砂漠を形成。",
        "S",
        [[-76.0, -42.0], [-73.5, -31.0], [-72.0, -20.0], [-77.8, -12.0], [-82.0, -4.0]],
    ),
    # Atlantic Warm Currents
    (
        "oc_gulf_stream",
        "warm",
        "メキシコ湾流（暖流）",
        "南西 → 北東",
        ["USA", "MEX"],
        "メキシコ湾・フロリダ海峡からアメリカ東岸を沿うように北東へ流れる極めて速い大暖流。のちに北大西洋海流へと連続する。",
        "S",
        [[-84.0, 24.5], [-79.5, 28.0], [-74.0, 35.5], [-60.0, 40.5]],
    ),
    (
        "oc_north_atlantic",
        "warm",
        "北大西洋海流（暖流）",
        "南西 → 北東",
        ["GBR", "FRA", "DEU", "NOR", "ISL", "RUS"],
        "メキシコ湾流の延長として偏西風により欧州へ向かう大暖流。高緯度のイギリス（Cfb）やノルウェー（トロムソ）〜ロシア・ムルマンスクまで不凍港をもたらす。",
        "S",
        [[-58.0, 41.0], [-36.0, 48.0], [-16.0, 54.0], [-2.0, 60.0], [14.0, 68.5], [32.0, 71.0]],
    ),
    (
        "oc_n_eq_atl",
        "warm",
        "北赤道海流（大西洋・暖流）",
        "東 → 西",
        ["ESP", "MEX", "USA"],
        "アフリカ西岸沖からカリブ海・メキシコ湾へ向けて西流する大西洋の暖流。",
        "B",
        [[-22.0, 15.0], [-42.0, 15.0], [-60.0, 16.0]],
    ),
    (
        "oc_s_eq_atl",
        "warm",
        "南赤道海流（大西洋・暖流）",
        "東 → 西",
        ["BRA", "AGO"],
        "アフリカ中南部沖からブラジル北東部へ向かって西流する暖流。",
        "B",
        [[5.0, -5.0], [-15.0, -5.0], [-33.0, -6.0]],
    ),
    (
        "oc_brazil",
        "warm",
        "ブラジル海流（暖流）",
        "北 → 南",
        ["BRA", "URY", "ARG"],
        "南赤道海流がブラジル東方沖で南向きに分岐して南米大西洋岸を南下する暖流。ラプラタ沖で寒流のフォークランド海流と出会う。",
        "A",
        [[-34.0, -9.0], [-38.0, -18.0], [-45.0, -26.0], [-52.0, -35.0]],
    ),
    # Atlantic Cold Currents
    (
        "oc_east_greenland",
        "cold",
        "東グリーンランド海流（寒流）",
        "北東 → 南西",
        ["GRL", "ISL"],
        "北極海から流氷を運んでグリーンランド東岸沿いを南下する寒流。冷涼な氷室を形成。",
        "B",
        [[-10.0, 75.0], [-20.0, 69.0], [-35.0, 63.0], [-44.0, 59.5]],
    ),
    (
        "oc_labrador",
        "cold",
        "ラブラドル海流（寒流）",
        "北西 → 南東・南",
        ["CAN"],
        "バフィン湾・ラブラドル半島沖を南下する寒流。ニューファンドランド島沖（グランドバンク）で暖流のメキシコ湾流と衝突し世界三大漁場と濃霧を生む。",
        "S",
        [[-60.0, 62.0], [-56.0, 54.0], [-50.0, 46.5], [-55.0, 42.0]],
    ),
    (
        "oc_canary",
        "cold",
        "カナリア海流（寒流）",
        "北 → 南",
        ["ESP", "MAR"],
        "イベリア半島沖・アフリカ北西岸を南下する寒流。サハラ砂漠の海岸延伸やモロッコ沖の好漁場（タコ等）をもたらす。",
        "A",
        [[-11.0, 40.0], [-12.0, 32.0], [-16.5, 24.0], [-18.5, 15.5]],
    ),
    (
        "oc_falkland",
        "cold",
        "フォークランド海流（マルビナス海流・寒流）",
        "南 → 北",
        ["ARG", "FLK"],
        "南極環流から分岐しアルゼンチン・パタゴニア沖を北上する寒流。沖合でブラジル海流と出会いスルメイカ・タラの好漁場を形成。",
        "B",
        [[-65.0, -54.0], [-61.0, -47.0], [-57.0, -40.0], [-53.0, -36.5]],
    ),
    (
        "oc_benguela",
        "cold",
        "ベンゲラ海流（寒流）",
        "南 → 北",
        ["ZAF"],
        "アフリカ南西岸を北上する寒流。ナミビア沖に強固なナミブ砂漠（海岸砂漠）を形成し、ケープタウンの夏を冷涼にする。",
        "S",
        [[16.0, -35.0], [14.0, -27.0], [12.5, -19.0], [11.5, -10.0]],
    ),
    # Indian & Southern Ocean Currents
    (
        "oc_agulhas",
        "warm",
        "アガラス海流（暖流）",
        "北東 → 南西",
        ["ZAF", "MOZ"],
        "マダガスカル周辺からアフリカ南東岸（ダーバン沖）を南下する暖流。同緯度のアフリカ西岸（寒流ベンゲラ海流）より東岸が温暖・多雨になる主因。",
        "A",
        [[40.0, -14.0], [36.0, -22.0], [31.5, -29.5], [24.0, -35.0]],
    ),
    (
        "oc_west_australia",
        "cold",
        "西オーストラリア海流（寒流）",
        "南 → 北",
        ["AUS"],
        "オーストラリア西岸を北上する寒流。インド洋西岸砂漠（グレートサンディ砂漠・西豪州乾燥地）の沿岸乾燥化に関与。",
        "A",
        [[112.0, -35.0], [112.5, -28.0], [114.0, -21.0], [115.0, -14.0]],
    ),
    (
        "oc_antarctic_circumpolar_w",
        "cold",
        "南極環流／西風皮流（寒流・西半）",
        "西 → 東",
        ["CHL", "ARG"],
        "南緯40〜60度の南大洋を障害物なく西から東へ一周する地球最大の海流。南米・アフリカ・豪州の各寒流の源。",
        "B",
        [[-170.0, -56.0], [-120.0, -56.0], [-75.0, -57.0], [-20.0, -56.0]],
    ),
    (
        "oc_antarctic_circumpolar_e",
        "cold",
        "南極環流／西風皮流（寒流・東半）",
        "西 → 東",
        ["ZAF", "AUS", "NZL"],
        "西風皮流（南極環流）の東半球側。アフリカ南岸〜オーストラリア南方・ニュージーランド南方を東流。",
        "B",
        [[0.0, -55.0], [60.0, -55.0], [120.0, -55.0], [175.0, -54.0]],
    ),
]

# Additional landform points to ensure complete coverage of Submerged, Karst, and Coral Reef landforms
EXTRA_LANDFORMS = [
    # Additional Submerged Coastlines (沈水地形: フィヨルド・リアス海岸・エスチュアリー・ダルマチア海岸)
    (
        "lf_glacier_bay_fjord",
        "fjord",
        [-136.5, 58.6],
        "グレイシャーベイ（アラスカのフィヨルド）",
        ["USA"],
        "氷食U字谷に海水が進入したアラスカ南東岸のフィヨルド海岸。氷河後退と温帯多雨林（Cfb）が特徴。",
        "B",
    ),
    (
        "lf_shima_rias",
        "rias",
        [136.8, 34.3],
        "志摩半島（リアス海岸・英虞湾）",
        ["JPN"],
        "沈水した複雑な湾入が波静かな入り江をつくり、真珠養殖などが発展した日本の代表的リアス海岸。",
        "A",
    ),
    (
        "lf_galicia_rias",
        "rias",
        [-8.8, 42.6],
        "ガリシア海岸（リアス海岸の語源）",
        ["ESP"],
        "「リアス（Rías）」の語源となったスペイン北西部の沈水海岸。山地谷の沈水により奥行きある入り江（リア・デ・ビゴ等）が発達。",
        "A",
    ),
    (
        "lf_seine_estuary",
        "estuary",
        [0.15, 49.45],
        "セーヌ川エスチュアリー（ル・アーヴル）",
        ["FRA"],
        "イギリス海峡へ注ぐラッパ状河口（三角江）。河口外港ル・アーヴルがパリ外港・大型船拠点として発達。",
        "A",
    ),
    (
        "lf_la_plata_estuary",
        "estuary",
        [-57.5, -35.0],
        "ラプラタ川エスチュアリー（三角江）",
        ["ARG", "URY"],
        "パラナ川・ウルグアイ川が合流して大西洋へ開く世界最大級の三角江。ブエノスアイレス・モンテビデオの港湾立地を支える。",
        "A",
    ),
    (
        "lf_st_lawrence_estuary",
        "estuary",
        [-69.0, 48.3],
        "セントローレンス川のエスチュアリー",
        ["CAN"],
        "五大湖の水を大西洋へ流す巨大エスチュアリー。五大湖・セントローレンス水路として大型船が内陸（モントリオール等）まで遡上。",
        "A",
    ),
    (
        "lf_dalmatian_coast",
        "dalmatian",
        [16.2, 43.4],
        "ダルマチア海岸（クロアチア・沈水地形）",
        ["HRV"],
        "ディナル・アルプス山脈の褶曲走向（海岸線と平行な尾根・谷）が沈水して生じた、細長い島々と海峡が平行に連なる典型的沈水海岸。カルスト石灰岩海岸でもある。",
        "S",
    ),
    # Additional Karst Landforms (カルスト地形)
    (
        "lf_ha_long_bay",
        "karst",
        [107.1, 20.9],
        "ハロン湾（沈水タワーカルスト）",
        ["VNM"],
        "桂林と並ぶ石灰岩のタワーカルスト地帯が海進により沈水し、約2000の奇岩島が海に浮かぶ絶景地形。",
        "S",
    ),
    (
        "lf_kras_karst",
        "karst",
        [13.9, 45.7],
        "クラス地方（カルスト地形の語源）",
        ["SVN", "ITA"],
        "スロベニア南西部の石灰岩台地。「カルスト（Karst）」の語源であり、ドリーネ・ウバーレ・ポリエやポストイナ鍾乳洞、地下水河川の典型的地形。",
        "S",
    ),
    (
        "lf_plitvice_karst",
        "karst",
        [15.6, 44.88],
        "プリトヴィツェ湖群（石灰華段丘カルスト）",
        ["HRV"],
        "クロアチア内陸のカルスト地帯で、水に溶けた炭酸カルシウムが再沈殿したトラバーチン（石灰華）堰が16の階段状湖をつくる。",
        "A",
    ),
    (
        "lf_akiyoshidai",
        "karst",
        [131.3, 34.23],
        "秋吉台・秋芳洞（日本の代表的カルスト台地）",
        ["JPN"],
        "山口県の古生代石灰岩台地。雨水溶食による無数のドリーネ・カレンフェルト（石灰岩柱）と大規模鍾乳洞が発達。",
        "S",
    ),
    (
        "lf_yucatan_cenote",
        "karst",
        [-88.5, 20.6],
        "ユカタン半島のセノーテ（石灰岩陥没穴）",
        ["MEX"],
        "平坦な石灰岩台地で地下水が溶食し天井が陥没してできた天然井戸（セノーテ）。表流水が乏しくマヤ文明の水源となった。",
        "A",
    ),
    # Additional Coral Reefs (サンゴ礁: 裾礁・堡礁・環礁)
    (
        "lf_new_caledonia_reef",
        "coral_reef",
        [165.5, -21.5],
        "ニューカレドニアのサンゴ礁（堡礁）",
        ["NCL"],
        "世界最長級のラグーンを持つ二重堡礁。周囲がニッケル鉱床の豊かな島でもある。",
        "A",
    ),
    (
        "lf_belize_barrier_reef",
        "coral_reef",
        [-87.8, 17.3],
        "ベリーズ・バリア・リーフ（カリブ海堡礁・ブルーホール）",
        ["BLZ"],
        "北半球最大級のサンゴ堡礁。氷期に形成された石灰岩鍾乳洞が沈水した巨大海中陥没穴「グレート・ブルーホール」でも著名。",
        "A",
    ),
    (
        "lf_maldives_atoll",
        "coral_reef",
        [73.5, 3.5],
        "モルディブ諸島（インド洋の典型的環礁国家）",
        ["MDV"],
        "約1,200の低平なサンゴ礁（環礁）から成り、平均標高が極めて低く地球温暖化による海面上昇（水没危機）が最重要論点。",
        "S",
    ),
    (
        "lf_tuvalu_atoll",
        "coral_reef",
        [179.2, -8.5],
        "ツバル（南太平洋の環礁と海面上昇）",
        ["TUV"],
        "ポリネシアの環礁国家。最高標高約4〜5mの環礁からなり高潮・塩害・海面上昇による国土水没危機の象徴として頻出。",
        "S",
    ),
    (
        "lf_marshall_atoll",
        "coral_reef",
        [167.7, 9.0],
        "マーシャル諸島・クェゼリン／ビキニ環礁（環礁群）",
        ["MHL"],
        "ダーウィンの沈降説（裾礁→堡礁→環礁）を示す典型的環礁列。日本の旧南洋諸島や核実験の歴史（第五福竜丸）とも関連。",
        "B",
    ),
    (
        "lf_okinawa_fringing_reef",
        "coral_reef",
        [124.1, 24.3],
        "沖縄・石西礁湖／八重山諸島（裾礁・サンゴ礁）",
        ["JPN"],
        "黒潮の暖水により北緯24〜26度付近まで発達した日本最大のサンゴ礁（主に裾礁）。オニヒトデ食害や白化現象の保全が課題。",
        "A",
    ),
]


def _arrow_chevrons(p_prev: list[float], p_end: list[float], size: float = 2.4) -> list[list[list[float]]]:
    dx = p_end[0] - p_prev[0]
    dy = p_end[1] - p_prev[1]
    length = math.hypot(dx, dy)
    if length < 1e-6 or length > 60:  # skip antimeridian wrap segments
        return []
    ux, uy = dx / length, dy / length
    ang = math.radians(150)
    c1, s1 = math.cos(ang), math.sin(ang)
    c2, s2 = math.cos(-ang), math.sin(-ang)
    w1 = [round(p_end[0] + size * (ux * c1 - uy * s1), 2), round(p_end[1] + size * (ux * s1 + uy * c1), 2)]
    w2 = [round(p_end[0] + size * (ux * c2 - uy * s2), 2), round(p_end[1] + size * (ux * s2 + uy * c2), 2)]
    return [[w1, p_end], [p_end, w2]]


def build_current_geometry(pts: list[list[float]]) -> dict:
    """Create MultiLineString splitting across antimeridian if needed + directional chevrons."""
    segments: list[list[list[float]]] = []
    cur_seg: list[list[float]] = [pts[0]]
    for pt in pts[1:]:
        if abs(pt[0] - cur_seg[-1][0]) > 180:
            if len(cur_seg) >= 2:
                segments.append(cur_seg)
            cur_seg = [pt]
        else:
            cur_seg.append(pt)
    if len(cur_seg) >= 2:
        segments.append(cur_seg)

    out_lines: list[list[list[float]]] = []
    for seg in segments:
        out_lines.append(seg)
        # Terminal arrow chevron
        out_lines.extend(_arrow_chevrons(seg[-2], seg[-1], size=2.4))
        # Midpoint arrow chevron for long currents
        if len(seg) >= 3:
            mid = len(seg) // 2
            out_lines.extend(_arrow_chevrons(seg[mid - 1], seg[mid], size=2.1))
    return {"type": "MultiLineString", "coordinates": out_lines}


def main() -> None:
    base_feats = json.loads(BASE_PHYS_PATH.read_text(encoding="utf-8"))
    photos_map: dict[str, dict] = {}
    if PLACE_PHOTOS_PATH.exists():
        photos_map = json.loads(PLACE_PHOTOS_PATH.read_text(encoding="utf-8"))

    features: list[dict] = []

    # 1. Existing mountains, rivers, landforms, straits (enriched with subTypeJa + photo)
    seen_ids: set[str] = set()
    for feat in base_feats:
        p = dict(feat["properties"])
        fid = p["id"]
        seen_ids.add(fid)
        if p.get("layerType") == "landform_point":
            st = p.get("subType", "")
            p["subTypeJa"] = LANDFORM_SUBTYPE_JA.get(st, "特徴的地形")
        ph = photos_map.get(fid)
        if ph:
            p["photoUrl"] = ph["url"]
            p["photoCaption"] = ph["caption"]
            p["photoCredit"] = ph["credit"]
        features.append({"type": "Feature", "id": fid, "geometry": feat["geometry"], "properties": p})

    # 2. Extra landforms (Submerged Coastlines, Karst, Coral Reefs)
    for fid, subtype, coords, name_ja, countries, summary, imp in EXTRA_LANDFORMS:
        if fid in seen_ids:
            continue
        seen_ids.add(fid)
        props: dict = {
            "id": fid,
            "layerType": "landform_point",
            "subType": subtype,
            "subTypeJa": LANDFORM_SUBTYPE_JA.get(subtype, "特徴的地形"),
            "nameJa": name_ja,
            "relatedCountries": countries,
            "summary": summary,
            "importance": imp,
        }
        ph = photos_map.get(fid)
        if ph:
            props["photoUrl"] = ph["url"]
            props["photoCaption"] = ph["caption"]
            props["photoCredit"] = ph["credit"]
        features.append(
            {
                "type": "Feature",
                "id": fid,
                "geometry": {"type": "Point", "coordinates": coords},
                "properties": props,
            }
        )

    # 3. Comprehensive 24 Ocean Currents with directional arrows
    for cid, subtype, name_ja, flow_dir, countries, summary, imp, pts in OCEAN_CURRENTS:
        props = {
            "id": cid,
            "layerType": "ocean_current",
            "subType": subtype,
            "subTypeJa": f"{'暖流' if subtype == 'warm' else '寒流'}（流れ：{flow_dir}）",
            "flowDirection": flow_dir,
            "nameJa": name_ja,
            "relatedCountries": countries,
            "summary": f"流向：{flow_dir}。{summary}",
            "importance": imp,
        }
        ph = photos_map.get(cid)
        if ph:
            props["photoUrl"] = ph["url"]
            props["photoCaption"] = ph["caption"]
            props["photoCredit"] = ph["credit"]
        features.append(
            {
                "type": "Feature",
                "id": cid,
                "geometry": build_current_geometry(pts),
                "properties": props,
            }
        )

    OUT_PATH.write_text(
        json.dumps({"type": "FeatureCollection", "features": features}, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"Wrote {len(features)} features to {OUT_PATH.name}")


if __name__ == "__main__":
    main()
