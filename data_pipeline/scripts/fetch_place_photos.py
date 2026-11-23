"""Fetch real Wikimedia/Wikipedia photos for mountains, rivers, landforms, soils, biomes, straits, and volcanoes."""

from __future__ import annotations

import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]
RAW_DIR = ROOT_DIR / "data_pipeline" / "raw"
DATA_DIR = ROOT_DIR / "app" / "public" / "data"
OUT_PATH = RAW_DIR / "place_photos_v1.json"

WIKI_API = "https://en.wikipedia.org/w/api.php"
REJECT_SUBSTRS = (
    ".svg",
    ".png",
    "flag_of_",
    "locator_map",
    "location_map",
    "_map.",
    "_map_",
    "map_of_",
    "topo_map",
    "watershed",
    "highlighted",
    "gyres",
    "landsat",
    "modis",
    "srtm",
    "from_space",
    "diagram",
    "chart",
    "schema",
    "blank",
    "ortho",
    "distribution",
    "vertisolworld",
    "subprefecture",
    "deltastates",
    "artesian_basin",
    "currentus",
    "coat_of_arms",
    "emblem_of",
)

# id -> (captionJa, [preferred_enwiki_titles...])
PHOTO_TARGETS: dict[str, tuple[str, list[str]]] = {
    # Mountains
    "mr_andes": ("アンデス山脈の高峰と雪線", ["Andes", "Aconcagua"]),
    "mr_rocky": ("ロッキー山脈の氷食地形と針葉樹林", ["Rocky Mountains", "Banff National Park"]),
    "mr_sierra_madre": ("メキシコのシエラマドレ山脈", ["Sierra Madre Occidental", "Copper Canyon"]),
    "mr_alps": ("アルプス山脈（マッターホルン等氷食地形）", ["Matterhorn", "Alps"]),
    "mr_pyrenees": ("フランス・スペイン国境ピレネー山脈", ["Pyrenees", "Pic du Midi de Bigorre"]),
    "mr_atlas": ("北アフリカ・アトラス山脈", ["Atlas Mountains", "Toubkal"]),
    "mr_zagros": ("イランのザグロス山脈", ["Zagros Mountains", "Dena", "Lorestan Province"]),
    "mr_himalaya": ("ヒマラヤ山脈（世界最高峰群の現地風景）", ["Annapurna", "Ama Dablam", "Kangchenjunga", "Mount Everest"]),
    "mr_southern_alps_nz": ("ニュージーランド南アルプス山脈", ["Aoraki / Mount Cook", "Southern Alps"]),
    "mr_scandinavia": ("スカンディナビア山脈（古期造山帯）", ["Jotunheimen", "Scandinavian Mountains"]),
    "mr_pennine": ("イギリス・ペニン山脈（古期）", ["Peak District", "Yorkshire Dales", "Malham Cove"]),
    "mr_ural": ("ウラル山脈（欧亜境界・古期）", ["Ural Mountains", "Mount Narodnaya"]),
    "mr_appalachian": ("アパラチア山脈（古期・炭田背景）", ["Blue Ridge Mountains", "Appalachian Mountains"]),
    "mr_great_dividing": ("オーストラリア・グレートディバイディング山脈", ["Blue Mountains (New South Wales)", "Great Dividing Range"]),
    "mr_drakensberg": ("南アフリカ・ドラケンスバーグ山脈大崖", ["Drakensberg"]),
    # Rivers
    "rv_rhine": ("国際河川ライン川の舟運と峡谷", ["Rhine Gorge", "Rhine"]),
    "rv_danube": ("ドナウ川（国際河川）と沿岸都市", ["Danube Bend", "Danube"]),
    "rv_nile": ("ナイル川（砂漠を貫く外来河川）", ["Nile", "Aswan"]),
    "rv_congo": ("コンゴ川の熱帯大流域と急流", ["Livingstone Falls", "Congo River"]),
    "rv_niger": ("西アフリカを大湾曲するニジェール川", ["Niger River", "Mopti"]),
    "rv_tigris_euphrates": ("ティグリス・ユーフラテス川とメソポタミア", ["Euphrates", "Tigris"]),
    "rv_indus": ("ヒマラヤ発・パキスタンを潤すインダス川", ["Indus River", "Skardu"]),
    "rv_ganges": ("ガンジス川とヒンドゥスタン平野", ["Ganges", "Varanasi"]),
    "rv_mekong": ("メコン川の水上交通とデルタ", ["Mekong", "Luang Prabang"]),
    "rv_changjiang": ("長江（三峡〜長江デルタ）", ["Three Gorges", "Yangtze"]),
    "rv_huanghe": ("黄河と黄土高原の堆積土砂", ["Hukou Waterfall", "Yellow River"]),
    "rv_mississippi": ("ミシシッピ川の穀物水運バージ", ["Mississippi River", "Natchez, Mississippi"]),
    "rv_amazon": ("アマゾン川の蛇行と広大な熱帯雨林", ["Amazon River", "Meeting of Waters"]),
    "rv_murray_darling": ("マレー・ダーリング川と乾燥灌漑", ["Murray River", "Mildura"]),
    # Landforms: Submerged, Karst, Coral, Delta, Others
    "lf_sognefjord": ("ソグネフィヨルド（氷食U字谷の溺れ谷）", ["Sognefjord", "Geirangerfjord"]),
    "lf_milford_sound": ("ミルフォードサウンド（NZフィヨルド）", ["Milford Sound / Piopiotahi"]),
    "lf_patagonia_fjord": ("チリ南部パタゴニアのフィヨルドとサケ養殖", ["Torres del Paine National Park", "Aysén Region"]),
    "lf_glacier_bay_fjord": ("アラスカ・グレイシャーベイの氷河フィヨルド", ["Glacier Bay National Park and Preserve"]),
    "lf_sanriku_rias": ("三陸海岸のリアス海岸（複雑に入り組む湾）", ["Sanriku Coast", "Jodogahama"]),
    "lf_shima_rias": ("志摩半島（英虞湾）のリアス海岸と真珠養殖", ["Ago Bay", "Shima Peninsula"]),
    "lf_galicia_rias": ("スペイン・ガリシア海岸（リアス海岸の語源）", ["Rias Baixas", "Ria de Vigo"]),
    "lf_elbe_estuary": ("エルベ川エスチュアリーとハンブルク港", ["Port of Hamburg", "Elbe"]),
    "lf_thames_estuary": ("テムズ川エスチュアリー（ロンドン・防潮水門）", ["Thames Barrier", "Southend Pier", "River Thames"]),
    "lf_seine_estuary": ("セーヌ川エスチュアリーとル・アーヴル港", ["Port of Le Havre", "Honfleur"]),
    "lf_la_plata_estuary": ("ラプラタ川エスチュアリー（広大な三角江）", ["Port of Buenos Aires", "Colonia del Sacramento"]),
    "lf_st_lawrence_estuary": ("セントローレンス川のエスチュアリー", ["Saint Lawrence River", "Tadoussac"]),
    "lf_dalmatian_coast": ("クロアチア・ダルマチア海岸（沈水地形と島列）", ["Kornati", "Dubrovnik"]),
    "lf_nile_delta": ("ナイル川デルタ（扇状の緑地帯と水路網）", ["Rosetta, Egypt", "Damietta", "Nile"]),
    "lf_mississippi_delta": ("ミシシッピ川鳥趾状三角州・湾岸湿地", ["Bayou", "Port of New Orleans", "Atchafalaya Basin"]),
    "lf_bengal_delta": ("ガンジス川・ベンガルデルタの低平湿地", ["Sundarbans", "Ganges Delta"]),
    "lf_mekong_delta": ("メコン川デルタの水田と水路網", ["Mekong Delta", "Cái Răng floating market"]),
    "lf_guilin_karst": ("中国・桂林のタワーカルスト景観", ["Lijiang River", "Guilin"]),
    "lf_ha_long_bay": ("ベトナム・ハロン湾の沈水タワーカルスト", ["Hạ Long Bay"]),
    "lf_kras_karst": ("スロベニア・クラス地方（カルスト地形の語源・鍾乳洞）", ["Postojna Cave", "Škocjan Caves"]),
    "lf_plitvice_karst": ("プリトヴィツェ湖群の石灰華段丘カルスト", ["Plitvice Lakes National Park"]),
    "lf_akiyoshidai": ("秋吉台・秋芳洞のドリーネ・カレンフェルト", ["Akiyoshidai Quasi-National Park", "Akiyoshido Cave"]),
    "lf_yucatan_cenote": ("ユカタン半島のセノーテ（石灰岩陥没穴）", ["Cenote", "Ik Kil"]),
    "lf_gbr": ("グレートバリアリーフ（世界最大の堡礁）", ["Great Barrier Reef", "Heart Reef"]),
    "lf_new_caledonia_reef": ("ニューカレドニアのサンゴ礁とラグーン（堡礁）", ["Lagoons of New Caledonia", "Isle of Pines (New Caledonia)"]),
    "lf_belize_barrier_reef": ("ベリーズの堡礁とグレート・ブルーホール", ["Great Blue Hole", "Belize Barrier Reef"]),
    "lf_maldives_atoll": ("モルディブの低平なサンゴ礁（環礁）", ["Maldives", "Atoll"]),
    "lf_tuvalu_atoll": ("ツバルの環礁地形（海面上昇の危機）", ["Funafuti", "Tuvalu"]),
    "lf_marshall_atoll": ("マーシャル諸島・典型的サンゴ環礁の全景", ["Majuro", "Arno Atoll", "Kwajalein Atoll"]),
    "lf_okinawa_fringing_reef": ("沖縄・八重山諸島（石西礁湖・川平湾サンゴ礁）", ["Kabira Bay", "Taketomi Island", "Iriomote Island"]),
    "lf_aral_sea": ("縮小したアラル海・ムイナクの「船の墓場」", ["Moynaq", "Aralkum Desert"]),
    "lf_polder": ("オランダの海抜0m以下の干拓地ポルダー", ["Polder", "Kinderdijk"]),
    "lf_paris_cuesta": ("パリ盆地のケスタ地形（シャンパーニュ丘陵）", ["Champagne (wine region)", "Épernay"]),
    "lf_atacama": ("世界最乾燥のアタカマ砂漠・月の谷（チリ）", ["Valle de la Luna (Chile)", "San Pedro de Atacama", "Salar de Atacama"]),
    "lf_great_lakes": ("氷食湖・五大湖（スペリオル湖等）", ["Lake Superior", "Pictured Rocks National Lakeshore"]),
    # Ocean currents
    "oc_kuroshio": ("黒潮が洗う紀伊半島・潮岬の沿岸風景", ["Cape Shionomisaki", "Cape Ashizuri"]),
    "oc_oyashio": ("親潮・釧路沖に発生する濃い海霧", ["Kushiro, Hokkaido", "Oyashio Current"]),
    "oc_peru": ("ペルー海流の湧昇沿岸とパラカス海岸", ["Paracas National Reserve", "Peruvian anchoveta"]),
    "oc_california": ("カリフォルニア海流がもたらすサンフランシスコの海霧", ["Golden Gate Bridge"]),
    "oc_north_atlantic": ("北大西洋海流がもたらす高緯度不凍港（トロムソ）", ["Tromsø", "Lofoten"]),
    "oc_benguela": ("ベンゲラ海流と砂漠が海に接するナミブ砂漠沿岸", ["Skeleton Coast", "Swakopmund", "Sossusvlei"]),
    "oc_labrador": ("ラブラドル海流が運ぶカナダ沖の氷山", ["Iceberg Alley", "St. John's, Newfoundland and Labrador"]),
    # Straits & canals
    "sc_malacca": ("マラッカ海峡に臨む国際貿易港シンガポール", ["Port of Singapore", "Malacca City"]),
    "sc_hormuz": ("ホルムズ海峡を臨むオマーン・ムサンダム半島の入り江", ["Khasab", "Musandam Governorate", "Qeshm"]),
    "sc_suez": ("水平式運河・スエズ運河を通過する大型コンテナ船", ["Suez Canal"]),
    "sc_panama": ("閘門（ロック）で船を昇降させるパナマ運河", ["Bridge of the Americas", "Pedro Miguel Locks", "Gatun Lake"]),
    "sc_gibraltar": ("地中海と大西洋を隔てるジブラルタルの岩", ["Rock of Gibraltar", "Strait of Gibraltar"]),
    "sc_bosphorus": ("ボスポラス海峡（アジア側とヨーロッパ側を結ぶ水道）", ["Bosphorus Bridge", "Golden Horn"]),
    "sc_dover": ("ドーバー海峡の白い崖（チョーク台地）", ["White Cliffs of Dover"]),
    # Volcanoes & hotspots (26)
    "vol_kilauea": ("ハワイ・キラウエア火山の穏やかな溶岩流出", ["Kīlauea"]),
    "vol_mauna_loa": ("ハワイ・マウナ・ロアのなだらかな盾状火山", ["Mauna Loa"]),
    "vol_yellowstone": ("イエローストーン・カルデラの熱水間欠泉", ["Grand Prismatic Spring", "Old Faithful"]),
    "vol_teide": ("カナリア諸島・テイデ山（ホットスポット成層火山）", ["Teide"]),
    "vol_galapagos": ("ガラパゴス諸島の火山島景観", ["Galápagos Islands", "Bartolomé Island"]),
    "vol_reunion": ("レユニオン島・ピトン・ドゥ・ラ・フルネーズ火山", ["Piton de la Fournaise"]),
    "vol_eyja": ("アイスランド・エイヤフィヤトラヨークトル火山", ["Eyjafjallajökull"]),
    "vol_hekla": ("アイスランド・ヘクラ火山（広がる境界）", ["Hekla"]),
    "vol_kilimanjaro": ("アフリカ最高峰・キリマンジャロ（大地溝帯東縁）", ["Mount Kilimanjaro"]),
    "vol_nyiragongo": ("コンゴ・ニーラゴンゴ山の溶岩湖", ["Mount Nyiragongo"]),
    "vol_erta_ale": ("エチオピア・アファール三重点のエルタ・アレ火山", ["Erta Ale"]),
    "vol_fuji": ("富士山（沈み込み帯の美しい成層火山）", ["Mount Fuji"]),
    "vol_sakurajima": ("桜島（姶良カルデラ内の活火山）", ["Sakurajima"]),
    "vol_aso": ("世界最大級のカルデラ地形・阿蘇山", ["Mount Aso"]),
    "vol_pinatubo": ("フィリピン・ピナツボ山のカルデラ湖", ["Mount Pinatubo"]),
    "vol_merapi": ("ジャワ島中央部・メラピ火山と肥沃な山麓", ["Mount Merapi"]),
    "vol_krakatau": ("スンダ海峡のクラカタウ（アナク・クラカタウ）", ["Anak Krakatoa", "Krakatoa"]),
    "vol_etna": ("イタリア・エトナ山（ヨーロッパ最大の活火山）", ["Mount Etna"]),
    "vol_vesuvius": ("ナポリ湾を望むヴェスヴィオ火山", ["Mount Vesuvius"]),
    "vol_st_helens": ("カスケード山脈・セント・ヘレンズ山", ["Mount St. Helens"]),
    "vol_popocatepetl": ("メキシコ高原にそびえるポポカテペトル山", ["Popocatépetl"]),
    "vol_cotopaxi": ("アンデス北部・コトパクシ山（雪冠火山）", ["Cotopaxi"]),
    "vol_chimborazo": ("エクアドル最高峰チンボラソ山", ["Chimborazo"]),
    "vol_ruapehu": ("NZ北島・ルアペフ山（トンガリロ火山帯）", ["Mount Ruapehu"]),
    "vol_klyuchevskaya": ("カムチャツカ半島・クリュチェフスカヤ山", ["Klyuchevskaya Sopka"]),
    "vol_baekdu": ("白頭山（長白山）山頂のカルデラ湖・天池", ["Baekdu Mountain"]),
    # Special Gazetteer: Soils, South American Biomes, Agricultural/Industrial Regions
    "pl_chernozem": ("チェルノーゼム（黒土）の土壌断面・肥沃黒土", ["Chernozem", "Ukraine agriculture"]),
    "pl_terra_roxa": ("テラローシャ（ブラジル南部の赤紫色土・コーヒー畑）", ["Terra roxa", "Coffee production in Brazil"]),
    "pl_regur": ("レグール（デカン高原・玄武岩溶岩台地と綿花畑）", ["Deccan Traps", "Ajanta Caves", "Maharashtra"]),
    "pl_latosol": ("ラトソル（熱帯地域の酸化鉄を含む赤色土断面）", ["Laterite", "Oxisol"]),
    "pl_podzol": ("ポドゾル（タイガ帯の強酸性灰白色土の断面）", ["Podzol"]),
    "pl_terra_rossa": ("テラロッサ（地中海石灰岩由来の赤土とブドウ・オリーブ畑）", ["Olive grove", "Istria"]),
    "pl_andosol": ("黒ボク土・火山灰土の土壌断面", ["Andosol"]),
    "pl_kastanozem": ("栗色土・ステップ草原風景", ["Kastanozem", "Kazakh steppe"]),
    "pl_tundra_soil": ("ツンドラ土と北極圏永久凍土景観", ["Tundra", "Permafrost"]),
    "pl_loess": ("中国・黄土高原の黄土（レス）段丘", ["Loess Plateau", "Yaodong"]),
    "pl_alluvial": ("河川堆積の沖積土が広がる平野と水田", ["Alluvial plain", "Alluvium"]),
    "pl_pampa": ("アルゼンチン・パンパの広大な温帯草原", ["Pampas"]),
    "pl_pampa_humid": ("湿潤パンパの豊かな穀物・大豆農業地帯", ["Buenos Aires Province", "Pergamino"]),
    "pl_pampa_dry": ("乾燥パンパの草原とガウチョの牛放牧", ["Gaucho", "La Pampa Province"]),
    "pl_llanos": ("リャノ（オリノコ川流域の熱帯サバナ草原と牧畜）", ["Apure", "Casanare", "Orinoco"]),
    "pl_selva": ("セルバ（アマゾン川流域の広大な熱帯雨林）", ["Amazon rainforest"]),
    "pl_campo": ("カンポ（ブラジル南部の草原と牧場）", ["Campos (biome)", "Pampas", "Pampa (Rio Grande do Sul)"]),
    "pl_cerrado": ("セラード（ブラジル中央高原の大豆開拓地帯）", ["Cerrado"]),
    "pl_caatinga": ("カーチンガ（ブラジル北東部の半乾燥有刺低木林）", ["Caatinga"]),
    "pl_gran_chaco": ("グランチャコ（南米中央の半乾燥疎林）", ["Gran Chaco"]),
    "pl_patagonia": ("パタゴニア（アンデス風下の乾燥ステップ・山岳）", ["Fitz Roy", "Argentine Patagonia"]),
    "pl_prairie": ("北米プレーリー・グレートプレーンズの小麦・センターピボット", ["Center-pivot irrigation", "Great Plains"]),
    "pl_sunbelt": ("米国サンベルト（シリコンバレー／先端産業拠点）", ["Silicon Valley", "Downtown Houston"]),
    "pl_rustbelt": ("米国ラストベルト（ピッツバーグ等旧製鉄・工業景観）", ["Pittsburgh", "Detroit"]),
    "pl_sahel": ("サヘル地帯の乾燥サバナ草原景観", ["Sahel", "Niamey"]),
    "pl_qinling": ("秦嶺山脈（中国の南北気候・農業境界）", ["Qinling"]),
    "pl_ruhr": ("ドイツ・ルール工業地域の産業遺産・ツォルフェアアイン", ["Zollverein Coal Mine Industrial Complex", "Ruhr"]),
    "pl_polder": ("オランダの干拓地ポルダー（運河・風車）", ["Kinderdijk", "Polder"]),
    "pl_fergana": ("フェルガナ盆地と中央アジアのオアシス灌漑", ["Fergana Valley", "Samarkand"]),
    "pl_maquiladora": ("メキシコ北部の米国国境都市ティフアナ・工業地域", ["Tijuana", "Ciudad Juárez"]),
    "pl_pilbara": ("オーストラリア・ピルバラ地域の赤色鉄鉱石地層", ["Pilbara", "Karijini National Park"]),
    "pl_great_artesian": ("オーストラリア内陸アウトバックの湧水・牧畜景観", ["Dalhousie Springs", "Birdsville", "Outback"]),
    "pl_hawaii": ("ハワイ火山列島の自然景観", ["Nā Pali Coast State Park", "Waikiki", "Kīlauea"]),
    "pl_tibet": ("平均標高4000m超のチベット高原とラサ", ["Potala Palace", "Tibetan Plateau"]),
    "pl_niger_delta": ("ニジェール川デルタの水路・マングローブ湿地", ["Port Harcourt", "Niger River"]),
    "pl_katanga": ("カタンガ地方（カッパーベルト）の鉱山開発", ["Lubumbashi", "Katanga Province"]),
    "pl_hokkaido": ("北海道・十勝平野や美瑛の大規模畑作景観", ["Biei, Hokkaido", "Furano", "Obihiro"]),
    "pl_shenzhen": ("経済特区から巨大ICT都市へ成長した深セン", ["Shenzhen"]),
    "pl_hsinchu": ("台湾の半導体集積地・新竹", ["Hsinchu", "Hsinchu Science Park"]),
    "pl_baku": ("カスピ海西岸バクーの市街と産油地域", ["Baku"]),
    "pl_aswan": ("ナイル川を制御するアスワン・ハイ・ダム", ["Aswan Dam"]),
}


def is_usable_photo_url(url: str | None) -> bool:
    if not url or not url.startswith("http"):
        return False
    low = url.lower()
    if any(bad in low for bad in REJECT_SUBSTRS):
        return False
    return any(ext in low for ext in (".jpg", ".jpeg", ".webp"))


def query_pageimages(titles: list[str]) -> dict[str, dict[str, str]]:
    results: dict[str, dict[str, str]] = {}
    for i in range(0, len(titles), 45):
        batch = titles[i : i + 45]
        params = urllib.parse.urlencode(
            {
                "action": "query",
                "titles": "|".join(batch),
                "redirects": "1",
                "prop": "pageimages|info",
                "inprop": "url",
                "pithumbsize": "640",
                "format": "json",
            }
        )
        req = urllib.request.Request(
            f"{WIKI_API}?{params}",
            headers={"User-Agent": "kyoute-chiri-edu/1.0 (local study tool)"},
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        query = data.get("query", {})
        norm_map = {n["from"]: n["to"] for n in query.get("normalized", [])}
        redir_map = {r["from"]: r["to"] for r in query.get("redirects", [])}
        pages_by_title: dict[str, dict] = {}
        for page in query.get("pages", {}).values():
            if "title" in page:
                pages_by_title[page["title"]] = page

        for orig in batch:
            cur = norm_map.get(orig, orig)
            cur = redir_map.get(cur, cur)
            page = pages_by_title.get(cur)
            if not page:
                continue
            thumb = (page.get("thumbnail") or {}).get("source")
            if is_usable_photo_url(thumb):
                results[orig] = {
                    "url": thumb,
                    "title": cur,
                }
        time.sleep(0.15)
    return results


def main() -> None:
    all_titles: list[str] = []
    seen: set[str] = set()
    for _, titles in PHOTO_TARGETS.values():
        for t in titles:
            if t not in seen:
                seen.add(t)
                all_titles.append(t)

    print(f"Querying Wikipedia pageimages for {len(all_titles)} candidate place titles...")
    found_map = query_pageimages(all_titles)

    out: dict[str, dict[str, str]] = {}
    missing: list[str] = []
    for fid, (caption, titles) in PHOTO_TARGETS.items():
        chosen = None
        for t in titles:
            if t in found_map:
                chosen = found_map[t]
                break
        if chosen:
            out[fid] = {
                "url": chosen["url"],
                "caption": caption,
                "credit": f"Wikimedia Commons（出典: {chosen['title']}）",
            }
        else:
            missing.append(fid)

    OUT_PATH.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Saved {len(out)}/{len(PHOTO_TARGETS)} place photos to {OUT_PATH.name}")
    if missing:
        print(f"Missing ({len(missing)}): {missing}")


if __name__ == "__main__":
    main()
