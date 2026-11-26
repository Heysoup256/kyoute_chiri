"""大地形・造山帯区分（新期造山帯・古期造山帯・安定陸塊楯状地・卓状地）ラスタPNG・GeoJSON・グリッド生成スクリプト。"""

from __future__ import annotations

import json
import math
from pathlib import Path

from PIL import Image, ImageDraw

ROOT_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT_DIR / "app" / "public" / "data"

ELEV_PNG_PATH = DATA_DIR / "thematic_elevation_v1.png"
OROGENIC_PNG_PATH = DATA_DIR / "thematic_orogenic_v1.png"
THEMATIC_REGIONS_PATH = DATA_DIR / "thematic_regions_v1.geojson"
THEMATIC_GRID_PATH = DATA_DIR / "thematic_grid_v1.json"

OUT_W, OUT_H = 2048, 1600
LON_MIN, LON_MAX = -180.0, 180.0
LAT_MIN, LAT_MAX = -75.0, 83.0

CATEGORY_SHIELD = "安定陸塊（楯状地）"
CATEGORY_PLATFORM = "安定陸塊（卓状地・構造平野）"
CATEGORY_OLD = "古期造山帯"
CATEGORY_NEW = "新期造山帯（環太平洋・アルプス＝ヒマラヤ）"

OROGENIC_RGB = {
    CATEGORY_NEW: (220, 38, 38),
    CATEGORY_OLD: (124, 58, 237),
    CATEGORY_SHIELD: (217, 119, 6),
    CATEGORY_PLATFORM: (22, 163, 74),
}


def merc_y(lat_deg: float) -> float:
    lat_c = max(-85.0, min(85.0, lat_deg))
    rad = math.radians(lat_c)
    return math.log(math.tan(math.pi / 4.0 + rad / 2.0))


Y_MAX = merc_y(LAT_MAX)
Y_MIN = merc_y(LAT_MIN)


def lonlat_to_merc_px(lon: float, lat: float) -> tuple[float, float]:
    x = (lon - LON_MIN) / (LON_MAX - LON_MIN) * (OUT_W - 1)
    y = (Y_MAX - merc_y(lat)) / (Y_MAX - Y_MIN) * (OUT_H - 1)
    return (x, y)


def point_in_poly(lon: float, lat: float, coords: list[list[float]]) -> bool:
    n = len(coords)
    if n < 3:
        return False
    inside = False
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


# 描画順：卓状地ベースの上に「卓状地ポリゴン → 楯状地 → 古期造山帯 → 新期造山帯」の順で重ねる
OROGENIC_ZONES = [
    # --- 1. 安定陸塊（卓状地・構造平野） ---
    {
        "id": "oro_plat_north_america",
        "nameJa": "北米中央平原・グレートプレーンズ（卓状地）",
        "category": CATEGORY_PLATFORM,
        "note": "古生代以降の水平な堆積岩層が覆う安定陸塊卓状地。肥沃草原プレーリー・ステップや油田・天然ガス（シェール含む）が分布。",
        "coords": [[-110, 58], [-94, 54], [-86, 44], [-84, 30], [-100, 26], [-106, 33], [-112, 48], [-110, 58]],
    },
    {
        "id": "oro_plat_paris_london",
        "nameJa": "パリ盆地・ロンドン盆地（構造平野・ケスタ）",
        "category": CATEGORY_PLATFORM,
        "note": "緩く傾いた硬岩と軟岩の互層が差別侵食されたケスタ地形（卓状地周辺）。肥沃な小麦・混合農業やワイン産地を形成。",
        "coords": [[-4, 54], [6, 53], [7, 46], [-2, 45], [-4, 54]],
    },
    {
        "id": "oro_plat_east_europe",
        "nameJa": "東ヨーロッパ平原・ロシア卓状地",
        "category": CATEGORY_PLATFORM,
        "note": "先カンブリア紀基盤上に堆積岩層が重なる広大な卓状地。南部の肥沃黒土チェルノーゼム地帯は世界有数の小麦穀倉。",
        "coords": [[20, 60], [56, 65], [58, 45], [26, 46], [20, 60]],
    },
    {
        "id": "oro_plat_west_siberia",
        "nameJa": "西シベリア低地（堆積盆地・卓状地）",
        "category": CATEGORY_PLATFORM,
        "note": "ウラル山脈東側に広がる世界最大の低平湿地帯。地下にチュメニなど巨大石油・天然ガス田を抱える。",
        "coords": [[60, 72], [88, 72], [86, 52], [62, 54], [60, 72]],
    },
    {
        "id": "oro_plat_amazon_laplata",
        "nameJa": "アマゾン低地・ラプラタ平原（パンパ卓状地）",
        "category": CATEGORY_PLATFORM,
        "note": "ブラジル・ギアナ両楯状地の間および南部に広がる広大な低地と構造平野。肥沃なパンパ草原は小麦・大豆・牛肉大産地。",
        "coords": [[-72, 2], [-50, 0], [-53, -38], [-66, -42], [-66, -18], [-74, -8], [-72, 2]],
    },
    {
        "id": "oro_plat_sahara",
        "nameJa": "サハラ卓状地（アフリカ安定陸塊北半）",
        "category": CATEGORY_PLATFORM,
        "note": "平坦な堆積岩台地と砂丘（エルグ）・礫砂漠が主体。ハシメサウド等の石油・天然ガス、西サハラ〜モロッコのリン鉱石を産出。",
        "coords": [[-17, 31], [32, 31], [35, 13], [-16, 14], [-17, 31]],
    },
    {
        "id": "oro_plat_great_artesian",
        "nameJa": "オーストラリア中央低地（大鑽井盆地）",
        "category": CATEGORY_PLATFORM,
        "note": "中生代砂岩層の被圧地下水（鑽井）が広がる構造平野。塩分をやや含む地下水は内陸乾燥地の羊・肉牛飲用水として活用。",
        "coords": [[134, -18], [148, -20], [146, -35], [134, -34], [134, -18]],
    },
    # --- 2. 安定陸塊（楯状地） ---
    {
        "id": "oro_shd_canada",
        "nameJa": "カナダ楯状地",
        "category": CATEGORY_SHIELD,
        "note": "先カンブリア代の硬い変成岩・花崗岩が氷河に削られた波状平坦地。メサビ・スペリオル湖鉄鉱石、サドベリーニッケル、ウラン、水力が豊富。",
        "coords": [[-122, 69], [-60, 62], [-63, 46], [-96, 46], [-115, 58], [-122, 69]],
    },
    {
        "id": "oro_shd_greenland",
        "nameJa": "グリーンランド楯状地",
        "category": CATEGORY_SHIELD,
        "note": "厚い大陸氷床に覆われる先カンブリア時代岩盤。氷縁部にレアアースやウラン鉱床が分布。",
        "coords": [[-66, 78], [-18, 82], [-34, 62], [-56, 62], [-66, 78]],
    },
    {
        "id": "oro_shd_baltic",
        "nameJa": "バルト楯状地（フェノスカンジア）",
        "category": CATEGORY_SHIELD,
        "note": "スウェーデン・フィンランド中心の楯状地。キルナの高品位磁鉄鉱床と氷河湖沼・針葉樹林帯が特徴。",
        "coords": [[12, 68], [32, 70], [32, 58], [12, 57], [12, 68]],
    },
    {
        "id": "oro_shd_angara",
        "nameJa": "アンガラ（中央シベリア）楯状地",
        "category": CATEGORY_SHIELD,
        "note": "バイカル湖周辺から北方へ広がる古大陸核。金・ダイヤモンド・ノリリスクのニッケル/パラジウムを産出。",
        "coords": [[88, 72], [126, 70], [122, 54], [90, 54], [88, 72]],
    },
    {
        "id": "oro_shd_guiana",
        "nameJa": "ギアナ高地（楯状地・テーブルマウンテン）",
        "category": CATEGORY_SHIELD,
        "note": "先カンブリア代砂岩層の残丘（テプイ）とエンジェルフォールを擁す。高品位鉄鉱石・ボーキサイト・金を産出。",
        "coords": [[-68, 8], [-51, 5], [-54, 1], [-69, 2], [-68, 8]],
    },
    {
        "id": "oro_shd_brazil",
        "nameJa": "ブラジル楯状地",
        "category": CATEGORY_SHIELD,
        "note": "カラジャス・ミナスジェライス（イタビラ）の世界屈指の鉄鉱石鉱床に加え、セラード草原やテラローシャ分布域を含む。",
        "coords": [[-56, -4], [-35, -6], [-44, -25], [-56, -24], [-56, -4]],
    },
    {
        "id": "oro_shd_africa_west",
        "nameJa": "西アフリカ楯状地（ギニア〜ガーナ）",
        "category": CATEGORY_SHIELD,
        "note": "熱帯強風化で生じたギニアの世界最大級ボーキサイト・シマンドゥ鉄鉱石やガーナ・マリの金鉱床が分布。",
        "coords": [[-16, 15], [4, 15], [5, 5], [-15, 7], [-16, 15]],
    },
    {
        "id": "oro_shd_africa_south",
        "nameJa": "中部〜南部アフリカ楯状地",
        "category": CATEGORY_SHIELD,
        "note": "コンゴ〜ザンビアのカッパーベルト（銅・コバルト）、ボツワナのダイヤモンド、南アの金・白金・クロムが集中する世界最大の希少金属庫。",
        "coords": [[14, -4], [34, -4], [31, -29], [16, -29], [14, -4]],
    },
    {
        "id": "oro_shd_arabia",
        "nameJa": "アラビア楯状地（紅海西側〜内陸高原）",
        "category": CATEGORY_SHIELD,
        "note": "紅海拡大でアフリカ大陸から引き裂かれた安定陸塊縁辺と堆積斜面の石油地帯（東半部は世界最大の油田・ガス田群）。",
        "coords": [[35, 29], [52, 26], [54, 13], [42, 13], [35, 29]],
    },
    {
        "id": "oro_shd_india",
        "nameJa": "インド楯状地・デカン高原",
        "category": CATEGORY_SHIELD,
        "note": "先カンブリア陸塊の北東端チョタ・ナグプールに鉄鉱石・石炭が共存し、西半の溶岩台地ではレグール（黒色綿花土）が発達。",
        "coords": [[70, 24], [87, 24], [81, 8], [74, 8], [70, 24]],
    },
    {
        "id": "oro_shd_australia",
        "nameJa": "オーストラリア西部楯状地（ピルバラ・イルガーン）",
        "category": CATEGORY_SHIELD,
        "note": "世界最古級の先カンブリア岩盤にピルバラの大規模縞状鉄鉱石、金、リチウム、ウランが濃集。",
        "coords": [[113, -19], [132, -16], [132, -33], [114, -34], [113, -19]],
    },
    # --- 3. 古期造山帯 ---
    {
        "id": "oro_old_appalachian",
        "nameJa": "アパラチア山脈（古期造山帯）",
        "category": CATEGORY_OLD,
        "note": "古生代末の造山運動で形成されたなだらかな山地。ピッツバーグ周辺の豊富な石炭層が米国初期重工業の礎となった。",
        "coords": [[-87, 33], [-82, 42], [-66, 48], [-62, 45], [-77, 35], [-84, 31], [-87, 33]],
    },
    {
        "id": "oro_old_caledonia",
        "nameJa": "スカンジナビア山脈・ペニン・スコットランド山地（古期造山帯）",
        "category": CATEGORY_OLD,
        "note": "古生代カレドニア造山運動の山地が後氷期の氷食（フィヨルド・谷氷河）で削られた。英国中部炭田や北欧水力発電の源泉。",
        "coords": [[-7, 58], [2, 54], [2, 52], [-4, 52], [-7, 58]],
    },
    {
        "id": "oro_old_scandinavia",
        "nameJa": "スカンジナビア山脈（古期造山帯）",
        "category": CATEGORY_OLD,
        "note": "ノルウェーとスウェーデンの背骨を成す古期山脈。偏西風と地形性多雨によりノルウェーに世界屈指の水力ポテンシャルをもたらす。",
        "coords": [[4, 60], [22, 71], [24, 68], [13, 59], [4, 60]],
    },
    {
        "id": "oro_old_central_europe",
        "nameJa": "中央ヨーロッパ古期山地（ルール・シレジア・ボヘミア）",
        "category": CATEGORY_OLD,
        "note": "古生代バリスカン（ヘルシニア）造山帯。ライン＝ルール炭田、ザール、シロンスク（ポーランド）など欧州近代工業を支えた石炭が集中。",
        "coords": [[6, 52], [20, 51], [20, 48], [7, 48], [6, 52]],
    },
    {
        "id": "oro_old_ural",
        "nameJa": "ウラル山脈（古期造山帯）",
        "category": CATEGORY_OLD,
        "note": "欧州とアジアを分ける古生代の南北山脈（標高低く穏やか）。マグニトゴルスクの鉄鉱石など鉱物資源豊富。",
        "coords": [[57, 68], [62, 68], [61, 50], [56, 51], [57, 68]],
    },
    {
        "id": "oro_old_central_asia",
        "nameJa": "天山・アルタイ・クンルン山脈（古期造山帯ブロック）",
        "category": CATEGORY_OLD,
        "note": "古期造山帯がインド大陸衝突の再活発化（地塁山地）で高峻化した山脈群。雪解け水が中央アジア外来河川の水源となる。",
        "coords": [[68, 45], [100, 50], [100, 35], [70, 38], [68, 45]],
    },
    {
        "id": "oro_old_great_khingan",
        "nameJa": "大興安嶺・華南古期山地（古期造山帯）",
        "category": CATEGORY_OLD,
        "note": "中国北東部〜華北炭田を含む中・古生代以前の安定・古期山地。大興安嶺は年降水量400mm線の基準とも重なる。",
        "coords": [[118, 53], [126, 52], [124, 38], [114, 36], [118, 53]],
    },
    {
        "id": "oro_old_great_dividing",
        "nameJa": "グレートディバイディング山脈（古期造山帯）",
        "category": CATEGORY_OLD,
        "note": "オーストラリア東岸の古期造山帯。シドニー・クィーンズランド周辺に世界最大の輸出力を誇る石炭層を擁し、内陸を乾燥させる。",
        "coords": [[144, -16], [153, -24], [151, -38], [142, -38], [147, -26], [144, -16]],
    },
    {
        "id": "oro_old_drakensberg",
        "nameJa": "ドラケンスバーグ・ケープ山地（古期造山帯・高原縁）",
        "category": CATEGORY_OLD,
        "note": "南アフリカ東南部〜南端に位置し、同国発電の約8割を支える豊富な石炭層やケープタウン周辺の山脈を形成。",
        "coords": [[18, -34], [32, -26], [30, -33], [18, -35], [18, -34]],
    },
    # --- 4. 新期造山帯（環太平洋・アルプス＝ヒマラヤ・広がる境界火山） ---
    {
        "id": "oro_new_cordillera_na",
        "nameJa": "ロッキー山脈・シエラネバダ・メキシココルディレラ（新期造山帯）",
        "category": CATEGORY_NEW,
        "note": "環太平洋造山帯の北米西部。サンアンドレアス断層等の地震・火山、米西海岸・カナダ・アラスカの銅や石油・水力基盤。",
        "coords": [[-166, 63], [-125, 62], [-104, 48], [-100, 18], [-83, 8], [-93, 14], [-115, 29], [-126, 48], [-152, 57], [-166, 63]],
    },
    {
        "id": "oro_new_caribbean",
        "nameJa": "カリブ海・アンティル弧（新期造山帯）",
        "category": CATEGORY_NEW,
        "note": "カリブプレート周辺の火山・地震帯。中米・大アンティルの山地形成と熱帯カルスト（ボーキサイト）を含む。",
        "coords": [[-85, 22], [-60, 18], [-61, 10], [-78, 12], [-85, 22]],
    },
    {
        "id": "oro_new_andes",
        "nameJa": "アンデス山脈（新期造山帯）",
        "category": CATEGORY_NEW,
        "note": "ナスカプレート沈み込みで形成された世界最長の高峻火山山脈。チリ・ペルーの巨大な斑岩銅鉱床や銀・亜鉛・リチウム塩湖を生む。",
        "coords": [[-78, 11], [-66, 10], [-65, -26], [-69, -54], [-75, -54], [-72, -18], [-81, -5], [-78, 11]],
    },
    {
        "id": "oro_new_alps_med",
        "nameJa": "アルプス・ピレネー・アペニン・カルパチア（新期造山帯）",
        "category": CATEGORY_NEW,
        "note": "アルプス＝ヒマラヤ造山帯の欧州部分。氷河地形（U字谷・カール・アルプ）、イタリア火山・地震、ダルマチア式海岸・カルスト地形が集中。",
        "coords": [[-6, 43], [16, 48], [27, 46], [26, 36], [12, 37], [3, 42], [-6, 43]],
    },
    {
        "id": "oro_new_atlas",
        "nameJa": "アトラス山脈（新期造山帯）",
        "category": CATEGORY_NEW,
        "note": "北アフリカ北西端におけるアルプス造山帯の延長。地中海性気候帯(Cs)とサハラ乾燥帯(BW)を分ける壁となる。",
        "coords": [[-10, 35], [10, 37], [10, 33], [-9, 30], [-10, 35]],
    },
    {
        "id": "oro_new_anatolia_zagros",
        "nameJa": "アナトリア・コーカサス・ザグロス・イラン高原（新期造山帯）",
        "category": CATEGORY_NEW,
        "note": "アラビアプレート北進による大地震多発帯（北アナトリア断層等）。ザグロス山脈西麓の背斜構造にイラン・イラクの大油田が溜まる。",
        "coords": [[26, 41], [59, 38], [58, 25], [34, 31], [26, 37], [26, 41]],
    },
    {
        "id": "oro_new_himalaya_seasia",
        "nameJa": "ヒマラヤ山脈・チベット高原・インドシナ西部（新期造山帯）",
        "category": CATEGORY_NEW,
        "note": "インド大陸衝突による世界最高峰帯と巨大チベット高原。アジア大河川群の源流であり強いモンスーンを引き起こす。",
        "coords": [[68, 36], [102, 34], [101, 16], [92, 20], [74, 31], [68, 36]],
    },
    {
        "id": "oro_new_east_asia_arc",
        "nameJa": "日本列島・台湾・千島・カムチャツカ弧（新期造山帯）",
        "category": CATEGORY_NEW,
        "note": "環太平洋造山帯の典型的な島弧＝海溝系。地震・火山・温泉・急峻山地と複雑な沈水リアス海岸が密集し天然ガス/石炭は乏しい。",
        "coords": [[119, 22], [134, 36], [162, 58], [166, 53], [144, 34], [123, 21], [119, 22]],
    },
    {
        "id": "oro_new_maritime_seasia",
        "nameJa": "スンダ弧・フィリピン・ニューギニア（新期造山帯）",
        "category": CATEGORY_NEW,
        "note": "多プレート収束帯の島弧。火山灰肥沃土（ジャワ等）、超塩基性岩ラテライト化のニッケル鉱床、銅・LNGや津波リスクが共存。",
        "coords": [[94, 5], [125, 19], [151, -5], [148, -11], [114, -9], [94, 1], [94, 5]],
    },
    {
        "id": "oro_new_nz",
        "nameJa": "ニュージーランド（サザンアルプス・北島火山帯）",
        "category": CATEGORY_NEW,
        "note": "プレート境界の新期造山帯島国。南島の氷河フィヨルド・水力、北島の火山・地熱発電が再エネ8割超を支える。",
        "coords": [[166, -47], [179, -35], [178, -42], [167, -47], [166, -47]],
    },
    {
        "id": "oro_new_iceland",
        "nameJa": "アイスランド（大西洋中央海嶺露出）",
        "category": CATEGORY_NEW,
        "note": "広がるプレート境界（海嶺）が海上に現れた新期火山島。豊富な地熱と氷河水力で電力100%再エネを達成。",
        "coords": [[-25, 66], [-13, 66], [-13, 63], [-25, 63], [-25, 66]],
    },
    {
        "id": "oro_new_rift_valley",
        "nameJa": "東アフリカ大地溝帯（広がる境界・新期火山地帯）",
        "category": CATEGORY_NEW,
        "note": "アフリカプレートが東西に裂ける拡大境界。地溝湖（タンガニーカ等）、キリマンジャロ火山、ケニアの豊かな地熱発電を生む。",
        "coords": [[33, 12], [43, 12], [38, -15], [29, -12], [33, 12]],
    },
]


def main() -> None:
    if not ELEV_PNG_PATH.exists():
        raise FileNotFoundError(f"Missing land alpha reference PNG: {ELEV_PNG_PATH}")
    if not THEMATIC_GRID_PATH.exists():
        raise FileNotFoundError(f"Missing grid JSON: {THEMATIC_GRID_PATH}")

    with Image.open(ELEV_PNG_PATH) as elev_img:
        land_alpha = elev_img.getchannel("A").point(lambda a: 220 if a > 0 else 0)

    # ベースは卓状地・安定陸塊（緑系）で塗り、その上に順にポリゴンを描画
    base_rgb = OROGENIC_RGB[CATEGORY_PLATFORM]
    canvas = Image.new("RGB", (OUT_W, OUT_H), base_rgb)
    draw = ImageDraw.Draw(canvas)

    for z in OROGENIC_ZONES:
        rgb = OROGENIC_RGB[z["category"]]
        px = [lonlat_to_merc_px(pt[0], pt[1]) for pt in z["coords"]]
        if len(px) >= 3:
            draw.polygon(px, fill=rgb)

    canvas.putalpha(land_alpha)
    canvas.save(OROGENIC_PNG_PATH, format="PNG", optimize=True)
    print(f"Wrote {OROGENIC_PNG_PATH.name} ({OROGENIC_PNG_PATH.stat().st_size // 1024} KB)")

    # 1度グリッドへ追加（既存gridを読み込み、orogenic配列を更新）
    grid_obj = json.loads(THEMATIC_GRID_PATH.read_text(encoding="utf-8"))
    koppen_grid = grid_obj["koppen"]
    lons_1d = [-179.5 + c for c in range(360)]
    lats_1d = [89.5 - r for r in range(180)]
    grid_orogenic: list[list[str]] = []
    for r in range(180):
        lat_val = lats_1d[r]
        row: list[str] = []
        for c in range(360):
            if not koppen_grid[r][c]:
                row.append("")
                continue
            lon_val = lons_1d[c]
            val = CATEGORY_PLATFORM
            for z in OROGENIC_ZONES:
                if point_in_poly(lon_val, lat_val, z["coords"]):
                    val = z["category"]
            row.append(val)
        grid_orogenic.append(row)

    grid_obj["orogenic"] = grid_orogenic
    THEMATIC_GRID_PATH.write_text(
        json.dumps(grid_obj, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print("Updated thematic_grid_v1.json with 'orogenic' 360x180 layer")

    # thematic_regions_v1.geojson へ統合（冪等）
    existing_reg = (
        json.loads(THEMATIC_REGIONS_PATH.read_text(encoding="utf-8"))
        if THEMATIC_REGIONS_PATH.exists()
        else {"type": "FeatureCollection", "features": []}
    )
    non_oro = [
        f
        for f in existing_reg.get("features", [])
        if (f.get("properties") or {}).get("mode") != "orogenic"
    ]
    oro_feats = [
        {
            "type": "Feature",
            "properties": {
                "id": z["id"],
                "mode": "orogenic",
                "nameJa": z["nameJa"],
                "category": z["category"],
                "note": z["note"],
            },
            "geometry": {"type": "Polygon", "coordinates": [z["coords"]]},
        }
        for z in OROGENIC_ZONES
    ]
    merged_feats = non_oro + oro_feats
    THEMATIC_REGIONS_PATH.write_text(
        json.dumps({"type": "FeatureCollection", "features": merged_feats}, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"Updated {THEMATIC_REGIONS_PATH.name}: total={len(merged_feats)} (orogenic={len(oro_feats)})")


if __name__ == "__main__":
    main()
