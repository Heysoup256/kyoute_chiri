"""Generate feature-adaptive visual highlight charts/tables only where distinctive for each country."""

from __future__ import annotations

import json
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]
RAW_DIR = ROOT_DIR / "data_pipeline" / "raw"
POWER_MIX_PATH = RAW_DIR / "country_power_mix_v1.json"
STATS_PATH = RAW_DIR / "country_stats_v1.json"
OUT_PATH = RAW_DIR / "country_highlight_visuals_v1.json"


def make_power_donut(iso: str, pm: dict, title_override: str, note: str) -> dict | None:
    if not pm:
        return None
    raw_slices = [
        ("石炭", pm.get("coalPct", 0.0), "#334155"),
        ("天然ガス", pm.get("gasPct", 0.0), "#f97316"),
        ("石油等", pm.get("oilPct", 0.0), "#a16207"),
        ("水力", pm.get("hydroPct", 0.0), "#0284c7"),
        ("原子力", pm.get("nuclearPct", 0.0), "#9333ea"),
        ("風力・太陽光", pm.get("windSolarPct", 0.0), "#10b981"),
        ("地熱・他再エネ", pm.get("otherRenewPct", 0.0), "#e11d48"),
    ]
    slices = [{"label": lbl, "value": round(val, 1), "color": col} for lbl, val, col in raw_slices if val >= 2.0]
    if not slices:
        return None
    return {
        "id": f"hv_power_{iso.lower()}",
        "placement": "industry",
        "kind": "donut",
        "title": title_override,
        "subtitle": f"総発電電力量の構成 ({pm.get('year', '2024')}年)",
        "slices": slices,
        "unit": "%",
        "note": note,
        "source": "Our World in Data / Ember",
    }


def make_pop_line(iso: str, st: dict, title: str, note: str) -> dict | None:
    hist = st.get("popHistory")
    if not hist or len(hist) < 5:
        return None
    return {
        "id": f"hv_pop_{iso.lower()}",
        "placement": "population",
        "kind": "line",
        "title": title,
        "subtitle": "1960年〜2024年の推移",
        "series": [{"label": str(pt["year"]), "value": pt["popMan"]} for pt in hist],
        "unit": "万人",
        "note": note,
        "source": "World Bank (SP.POP.TOTL)",
    }


POWER_HIGHLIGHTS: dict[str, tuple[str, str]] = {
    "NOR": (
        "水力発電が約9割を占める自然エネルギー電力国",
        "急峻な地形・フィヨルドと氷食湖・偏西風による多雨を活かし水力発電が圧倒的。石油・ガスは多くを輸出し国内電力は水力が担う。",
    ),
    "ISL": (
        "水力約7割＋地熱等約3割の再エネ100%電力",
        "大西洋中央海嶺（広がる境界）上の豊富な地熱と氷河融解水による水力で化石燃料ゼロ発電を実現。安価な電力を求めてアルミ精錬が集積。",
    ),
    "FRA": (
        "原子力発電の比率が世界最高水準（約7割）",
        "石油危機後の国産エネルギー政策により原子力比率が突出。電力網でドイツ・イタリア等の周辺国へ電力輸出も行っている。",
    ),
    "BRA": (
        "水力＋バイオ・風力・太陽光で8割超のクリーン電源",
        "パラナ川（イタイプ水力発電所）など大河川の豊富水量による水力発電が中核。自動車燃料のバイオエタノール利用も世界有数。",
    ),
    "CAN": (
        "水力発電が約6割を占める電力構成（アルミ精錬の誘因）",
        "ローレンシア台地の氷食湖群や豊かな水資源による安価な水力発電を背景に、ケベック州（キティマット・ベコモー等）でアルミ精錬が発達。",
    ),
    "SWE": (
        "水力＋原子力＋風力で脱化石燃料を達成",
        "北部河川の豊かな水力と原子力・風力によりCO2排出の少ない電源構成を確立。寒冷地でも電力由来の電化が進む。",
    ),
    "CHE": (
        "アルプスの氷河融解水・急流を活かした水力＋原子力",
        "高山地形の落差を利用した水力発電が過半を占め、冬場の融雪減少期を補う形で原子力・揚水発電を運用。",
    ),
    "NZL": (
        "水力と環太平洋火山帯の地熱・風力による高い再エネ率",
        "南北両島の地形と降水量・プレート収束帯の地熱資源により発電の8割以上を自然エネルギーで供給。南島の水力はアルミ精錬にも利用。",
    ),
    "PRY": (
        "イタイプ・ヤシレタ水力発電所による水力100%近くの発電",
        "パラナ川流域の巨大ダムにより国内需要を大幅に上回る電力を水力で発電し、隣国ブラジル・アルゼンチンへ余剰電力を輸出する世界屈指の電力輸出国。",
    ),
    "UKR": (
        "旧ソ連時代からの原子力中心（過半）と戦時下の電源課題",
        "欧州最大級の原子力発電所群を抱え、電力の過半を原子力に依存。近年はインフラ被害に伴う送電・再生可能分散が急務。",
    ),
    "ZAF": (
        "豊富な石炭資源に支えられた石炭火力約8割の電源構成",
        "古期造山帯（ウィットウォーターズランド周辺〜東部）の豊富な石炭を背景に8割以上が石炭火力。脱炭素移行が国家課題。",
    ),
    "IND": (
        "急速な電化を支える石炭火力7割超＋太陽光拡大",
        "東部デカン高原北東端の炭田等に依存し石炭火力が約75%。一方で政府主導の大規模太陽光発電（タール砂漠周辺など）が急伸。",
    ),
    "CHN": (
        "世界最大の石炭消費・発電大国と急拡大する再エネ",
        "石炭火力が過半を占めるが、三峡ダム等の世界最大級水力や西部砂漠地帯の太陽光・風力容量も世界1位で急激に再エネ比率が上昇中。",
    ),
    "AUS": (
        "石炭輸出・火力中心から太陽光・風力への急転換期",
        "ニューサウスウェールズ・クイーンズランドの豊富な石炭による火力依存が高かったが、近年は高い日照を活かした家庭用/大規模太陽光が急増。",
    ),
    "POL": (
        "シレジア炭田を背景としたEU屈指の石炭依存型電源",
        "南部シレジア地方の豊富な石炭（および褐炭）に支えられ石炭火力が今なお高水準。EU脱炭素規制との調整と洋上風力整備が進む。",
    ),
    "IDN": (
        "急速な工業化・電化に伴う石炭・ガス火力と豊かな地熱潜在力",
        "カリマンタン・スマトラの豊富な一般炭で電力を急拡大しつつ、環太平洋造山帯の豊富な地熱資源開発を進める。",
    ),
    "DNK": (
        "風力発電が国内電力の過半を担う脱石炭の先駆国",
        "北海・ユトランド半島の強い偏西風と平坦地形・遠浅海域を活かした洋上/陸上風力が電源の過半を占め、バイオマスと合わせ脱化石を達成。",
    ),
    "DEU": (
        "脱原発を完了し風力・太陽光が過半へ成長（石炭削減途上）",
        "エネルギー転換（Energiewende）と2023年の全原発停止により風力・太陽光等の再エネが半数を超えた一方、安定供給や工業用電力価格が課題。",
    ),
    "JPN": (
        "LNG・石炭の火力中心と原発・太陽光の分散型電源構成",
        "2011年以降、輸入天然ガス（LNG）・石炭による火力発電が約7割を占め、エネルギー自給率向上と脱炭素の両立が共通テストでも頻出論点。",
    ),
    "USA": (
        "シェールガス革命で石炭から天然ガス火力へ主役交代",
        "かつて石炭火力と原子力が中心だったが、国内シェールガス生産急増により天然ガス火力が最大電源となり、風力・太陽光も急伸。",
    ),
}

POP_LINE_NOTES: dict[str, tuple[str, str]] = {
    "NGA": ("アフリカ最大・爆発的増加が続く人口推移", "多産多死から多産少死への移行期に人口が急増し、2億人超へ。今世紀後半には世界第3位前後に迫る見込み。"),
    "ETH": ("アフリカ第2位の人口大国へ急速拡大", "高い出生率と乳幼児死亡率低下が重なり1960年の約2,200万人から1億3,000万人規模へと6倍近くに急増。"),
    "KEN": ("サハラ以南アフリカの典型的な急増型人口曲線", "都市部ナイロビへの人口集中とともに急速な若年人口増加が続き、雇用創出とインフラ整備が課題。"),
    "IND": ("中国を抜いて世界第1位へ到達した人口推移", "1960年代の約4.5億人から14.6億人超へと急増。現在は出生率低下傾向にあるものの巨大コーホートにより増加が続く。"),
    "PAK": ("世界第5位の人口大国・急増する若年層", "インダス川流域の肥沃な灌漑農地を抱えつつ高い自然増加率が継続し、2.5億人超へ急拡大。"),
    "BGD": ("出生率低下しつつも超高密度のまま2億人に迫る推移", "独立前後の極端な多産から女性教育・農村開発等で合計特殊出生率は2前後へ低下したが総人口は大きく拡大。"),
    "PHL": ("カトリック文化等を背景に長期の人口増加が続く東南アジア大国", "1億人を超えた現在も比較的若い年齢構成を持ち、海外出稼ぎ（OFW）労働力の重要な送り出し国。"),
    "EGY": ("ナイル川沿いの狭い可住地に急増し1億1,000万人超へ", "アラブ世界最大の人口を抱え、食料自給やカイロ過密緩和のための新行政首都建設が国家課題。"),
    "IDN": ("ジャワ島中心に2.8億人超へと拡大（現在は安定成長へ）", "世界第4位の人口大国。家族計画により増加率は緩やかになりつつあり、人口ボーナス期から中位年齢上昇へ移行。"),
    "JPN": ("2008〜2010年をピークに明確な人口減少・超高齢社会へ突入", "主要先進国の中で最も早く人口減少局面に入り、労働力不足と大都市一極集中・地方過疎が深刻化。"),
    "KOR": ("急増から急ブレーキ・世界最低水準の出生率で減少期入り", "漢江の奇跡に伴う急激な都市化・教育熱等により合計特殊出生率が0.7台まで低下し、人口減少局面へ移行。"),
    "CHN": ("一人っ子政策を経て増加頭打ち・2022年に約60年ぶり人口減少へ", "世界の工場を支えた膨大な人口が少子高齢化（「未富先老」）に転じ、2023年にインドに世界1位を譲った。"),
    "DEU": ("少子高齢化と移民受入の綱引きによる横ばい〜緩増推移", "自然増減はマイナスが続く一方、EU域内や中東・ウクライナからの移民流入が総人口を支える典型的構造。"),
    "ITA": ("南欧の極端な少子高齢化による人口停滞・減少傾向", "若年失業率の高さや家族支援の遅れ等から低出生率が長期化し、近年は総人口が緩やかに減少している。"),
    "RUS": ("ソ連崩壊期以降の出生低下・平均寿命短さと人口減", "1990年代初頭の混乱で死亡率上昇・出生急減を経験し、その後も自然減傾向が続き広大な国土の過疎が進む。"),
    "UKR": ("独立後の経済停滞・出生率低下・国外流出による継続的減少", "1990年代から人口減少が続き、近年の紛争に伴う数百万人の国外避難でさらに急減。"),
}

MEAT_CULTURE_SLICES: dict[str, dict] = {
    "CHN": {
        "title": "食肉生産・消費の圧倒的「豚肉」偏重と大豆輸入",
        "subtitle": "中国の家畜肉種別シェア目安（%）",
        "slices": [
            {"label": "豚肉", "value": 60.0, "color": "#f43f5e"},
            {"label": "鶏肉・家禽", "value": 26.0, "color": "#f59e0b"},
            {"label": "牛肉", "value": 8.0, "color": "#b91c1c"},
            {"label": "羊・ヤギ肉", "value": 6.0, "color": "#8b5cf6"},
        ],
        "note": "伝統的に中華料理で豚肉が最も好まれ、世界の豚飼養頭数・豚肉消費の約半分を占める。飼料用のトウモロコシ・大豆（ブラジル・米国産）の巨大輸入につながる。",
        "source": "FAO 食料需給構造（共通テスト頻出論点）",
    },
    "IND": {
        "title": "宗教的禁忌を反映した「鶏肉中心・全体低消費」",
        "subtitle": "インドの肉類消費種別シェア目安（%）",
        "slices": [
            {"label": "鶏肉（禁止宗教が少なく中心）", "value": 58.0, "color": "#f59e0b"},
            {"label": "水牛肉・その他（主に非ヒンドゥー）", "value": 24.0, "color": "#94a3b8"},
            {"label": "羊・ヤギ肉", "value": 16.0, "color": "#8b5cf6"},
            {"label": "豚肉（イスラム禁忌等）", "value": 2.0, "color": "#f43f5e"},
        ],
        "note": "多数派のヒンドゥー教が牛を神聖視し、イスラム教徒が豚肉を忌避するため、1人当たり年間食肉消費量は世界最低水準。食べる場合も両宗教で許容される鶏肉・羊肉が主流（牛飼養頭数自体は世界最多級で乳製品ギ―や皮革・農耕用に利用）。",
        "source": "FAO / OECD農業統計目安",
    },
    "IDN": {
        "title": "世界最大のイスラム人口による「豚肉ほぼゼロ・鶏肉主体」",
        "subtitle": "インドネシアの食肉構成目安（%）",
        "slices": [
            {"label": "鶏肉・家禽", "value": 74.0, "color": "#f59e0b"},
            {"label": "牛肉・水牛肉", "value": 17.0, "color": "#b91c1c"},
            {"label": "豚肉（非ムスリム向けのみ）", "value": 6.0, "color": "#f43f5e"},
            {"label": "羊肉等", "value": 3.0, "color": "#8b5cf6"},
        ],
        "note": "国民の約87%がイスラム教徒（ハラール食規定）のため豚肉消費が極端に少なく、安価なたんぱく源として養鶏と漁業・大豆製品（テンペ）が普及。",
        "source": "FAO / OECD統計目安",
    },
    "SAU": {
        "title": "イスラム聖地の厳格な豚肉禁忌と高い鶏肉輸入依存",
        "subtitle": "サウジアラビアの食肉消費シェア目安（%）",
        "slices": [
            {"label": "鶏肉（ブロイラー・ブラジル等から輸入）", "value": 78.0, "color": "#f59e0b"},
            {"label": "羊・ヤギ肉（遊牧文化）", "value": 14.0, "color": "#8b5cf6"},
            {"label": "牛肉・ラクダ肉", "value": 8.0, "color": "#b91c1c"},
        ],
        "note": "イスラム法により豚肉・アルコールは厳禁（0%）。乾燥地で飼料栽培が限られるため、ブラジル等から冷凍鶏肉を大量輸入する一方、伝統的な羊肉料理も根強い。",
        "source": "FAO 食料需給統計目安",
    },
    "EGY": {
        "title": "イスラム文化圏の鶏肉・牛・羊中心と低い豚肉消費",
        "subtitle": "エジプトの食肉消費構成目安（%）",
        "slices": [
            {"label": "鶏肉", "value": 56.0, "color": "#f59e0b"},
            {"label": "牛・水牛肉", "value": 34.0, "color": "#b91c1c"},
            {"label": "羊・ヤギ肉", "value": 9.5, "color": "#8b5cf6"},
            {"label": "豚肉", "value": 0.5, "color": "#f43f5e"},
        ],
        "note": "ナイル川沿いに人口が集中し、イスラム教徒が約9割のため豚肉比率は極めて低く、鶏肉とパン（輸入小麦）・豆類が主食・たんぱく源を支える。",
        "source": "FAO 食料需給統計目安",
    },
    "ARG": {
        "title": "パンパの牧畜文化（アサード）を反映した突出した牛肉消費",
        "subtitle": "アルゼンチンの食肉消費構成目安（%）",
        "slices": [
            {"label": "牛肉（1人当たり消費量 世界最高水準）", "value": 47.0, "color": "#b91c1c"},
            {"label": "鶏肉", "value": 38.0, "color": "#f59e0b"},
            {"label": "豚肉・その他", "value": 15.0, "color": "#f43f5e"},
        ],
        "note": "肥沃な草原パンパで大規模牧牛が発展し、かつて欧州向け冷凍船輸出とともに国民食「アサード（牛肉炭火焼き）」文化が定着。1人当たり牛肉消費量は世界1〜2位級。",
        "source": "FAO / OECD農業統計目安",
    },
}

EXPORT_DONUTS: dict[str, dict] = {
    "SAU": {
        "title": "輸出に占める鉱物性燃料（原油等）への圧倒的依存",
        "subtitle": "サウジアラビアの総輸出構成目安（%）",
        "slices": [
            {"label": "原油・石油製品・ガス", "value": 76.0, "color": "#1e293b"},
            {"label": "石油化学製品・プラスチック", "value": 15.0, "color": "#0284c7"},
            {"label": "その他工業品・農水産", "value": 9.0, "color": "#94a3b8"},
        ],
        "note": "世界最大級の原油埋蔵・輸出量を誇り（ガワール油田など）、輸出収入の大半を石油・石油化学に依存するため脱石油改革「ビジョン2030」を推進。",
        "source": "WTO / UN Comtrade統計目安",
    },
    "NGA": {
        "title": "サハラ以南アフリカ最大の産油国（原油モノカルチャー）",
        "subtitle": "ナイジェリアの商品輸出構成目安（%）",
        "slices": [
            {"label": "原油・天然ガス（ニジェールデルタ）", "value": 85.0, "color": "#1e293b"},
            {"label": "その他農産品（カカオ・ゴマ等）", "value": 7.0, "color": "#16a34a"},
            {"label": "化学・軽工業他", "value": 8.0, "color": "#94a3b8"},
        ],
        "note": "輸出の8割超が原油・LNGに偏り、国際原油価格の変動で経済が大きく揺さぶられる。一方、農業従事者も依然多く巨大人口向けの食料増産と国内製油能力整備が急務。",
        "source": "UN Comtrade統計目安",
    },
    "CHL": {
        "title": "世界1位の銅輸出を軸とした資源＋南半球農水産の輸出構造",
        "subtitle": "チリの輸出構成目安（%）",
        "slices": [
            {"label": "銅鉱・精製銅（世界生産1位）", "value": 51.0, "color": "#ea580c"},
            {"label": "農林水産品（サケ・果実・ワイン・パルプ）", "value": 24.0, "color": "#10b981"},
            {"label": "リチウム・化学・他", "value": 25.0, "color": "#6366f1"},
        ],
        "note": "北部アタカマ砂漠（チュキカマタ等）の銅と塩湖リチウムに加え、中部の地中海性気候(Cs)による季節差を活かしたブドウ・果実輸出、南部のサケ養殖（日本向けも大）が外貨を稼ぐ。",
        "source": "UN Comtrade統計目安",
    },
    "AUS": {
        "title": "「脱欧州・対アジア」へ転換した資源・エネルギー＋農畜産輸出",
        "subtitle": "オーストラリアの主要商品輸出目安（%）",
        "slices": [
            {"label": "鉄鉱石（ピルバラ地域）", "value": 31.0, "color": "#9a3412"},
            {"label": "石炭・LNG（炭鉱・天然ガス）", "value": 34.0, "color": "#334155"},
            {"label": "金・ボーキサイト・非鉄", "value": 12.0, "color": "#eab308"},
            {"label": "小麦・牛肉・羊毛等農産", "value": 12.0, "color": "#16a34a"},
            {"label": "機械・他", "value": 11.0, "color": "#94a3b8"},
        ],
        "note": "1973年の英国EC加盟を機に農産中心の対英輸出から、鉄鉱石・石炭・LNG等の中国・日本・韓国向け資源輸出へ劇的に転換。",
        "source": "DFAT / UN Comtrade統計目安",
    },
}

TABLES_BY_ISO: dict[str, list[dict]] = {
    "USA": [
        {
            "id": "hv_usa_belt",
            "placement": "industry",
            "kind": "table",
            "title": "アメリカ国内の地域構造対比（産業・農業）",
            "subtitle": "試験最頻出の2軸比較",
            "headers": ["対比軸", "北東部・五大湖周辺（スノーベルト）", "南部・西部（サンベルト）"],
            "rows": [
                ["歴史的産業", "五大湖水運＋アパラチア炭田＋メサビ鉄鉱の重工業", "伝統的綿花・プランテーション農業（旧南部）"],
                ["現代の特徴", "ラストベルト化から先端大学・金融（NY）・医薬・ICT再生", "航空宇宙（ヒューストン/シアトル）・石油・半導体（シリコンバレー）"],
                ["農業境界（100°W）", "以東（湿潤）：混合農業・コーンベルト（トウモロコシ/大豆）・酪農", "以西（乾燥BS/BW）：企業的牧畜・小麦・センターピボット灌漑"],
            ],
            "note": "西経100度（年降水量約500mm）を境とする東の湿潤農牧業と西の乾燥放牧・灌漑、および北東から南西「サンベルト」への人口・先端産業シフトが定番。",
        }
    ],
    "CHN": [
        {
            "id": "hv_chn_ns",
            "placement": "overview",
            "kind": "table",
            "title": "「秦嶺（チンリン）・淮河（ホワイ）線」による南北対比",
            "subtitle": "中国の自然・農業・気候境界（年降水量約1,000mm・1月0℃線）",
            "headers": ["比較項目", "華北・東北（以北）", "華中・華南（以南）"],
            "rows": [
                ["気候区分", "冷帯夏雨 Dw・ステップ BS・温暖湿潤の乾燥側", "温暖湿潤 Cfa（亜熱帯的・温暖多雨）"],
                ["伝統的農業", "畑作中心（小麦・トウモロコシ・コウリャン・綿花）", "水田稲作中心（二期作も可能な華南）・茶・サトウキビ"],
                ["都市・経済圏", "北京・天津・東北（鞍山鉄鋼など重化学・自動車）", "長江デルタ（上海）・珠江デルタ（深セン/香港）のハイテク・輸出工場"],
            ],
            "note": "さらに南北間だけでなく沿海部（経済特区から高所得化）と西部内陸部（西部大開発・天然ガスパイプライン「西気東輸」）の地域間経済格差も最頻出。",
        }
    ],
    "IND": [
        {
            "id": "hv_ind_ns",
            "placement": "overview",
            "kind": "table",
            "title": "インド北部と南部の文化・農業・産業対比",
            "headers": ["比較項目", "北部（ガンジス平原・パンジャブ等）", "南部・デカン高原（ベンガルール等）"],
            "rows": [
                ["言語系統", "インド・ヨーロッパ語族（ヒンディー語など）", "ドラヴィダ語族（タミル語・カンナダ語など固有系統）"],
                ["主食・農業", "西部〜パンジャブの小麦中心・東部アッサムは稲作/茶", "南部沿岸・河川デルタの稲作＋デカン高原の綿花（レグール土）"],
                ["先端産業", "デリー首都圏・グルガオンの日系自動車等の集積", "「インドのシリコンバレー」ベンガルール中心のICTオフショア開発"],
            ],
        }
    ],
    "ITA": [
        {
            "id": "hv_ita_ns",
            "placement": "industry",
            "kind": "table",
            "title": "イタリアの「南北問題（経済格差）」構造対比",
            "headers": ["地域", "北部（工業三角：ミラノ・トリノ・ジェノヴァ）", "南部・島嶼（メッツォジョルノ）"],
            "rows": [
                ["気候・地形", "ポー川沿いの肥沃な平野・Cfa気候・アルプス水力", "乾燥しがちな地中海性気候(Cs)・シチリア等急傾斜地"],
                ["産業構造", "自動車（トリノ）・デザイン/金融（ミラノ）・「第三のイタリア」中小専門産地", "オリーブ・柑橘類等の農業や観光中心・製鉄等重化学誘致も停滞傾向"],
                ["労働・所得", "EU中核圏と直結し高所得・欧州有数の工業集積", "若年失業率が依然高く北部やドイツ方面への域内人口流出が続く"],
            ],
        }
    ],
    "BEL": [
        {
            "id": "hv_bel_regions",
            "placement": "culture",
            "kind": "table",
            "title": "言語境界と産業興亡（フランデレン vs ワロン）",
            "headers": ["地域", "北部 フランデレン地域", "南部 ワロン地域"],
            "rows": [
                ["公用語", "オランダ語（フラマン語）・ゲルマン系", "フランス語・ロマンス系（東端に少数のドイツ語圏）"],
                ["経済の歴史と現在", "かつて農業中心→アントウェルペン国際港を核に化学・IT・物流で好調", "サンブル＝ミューズ炭田による石炭・鉄鋼で繁栄→炭鉱閉山後は相対的に停滞"],
                ["政治的課題", "首都ブリュッセルは仏語多数だが地理的にフランデレン内に位置する連邦制・言語対立", "裕福な北部から南部への財政移転に対する北部の不満が分権議論の火種"],
            ],
        }
    ],
    "DEU": [
        {
            "id": "hv_deu_ew",
            "placement": "overview",
            "kind": "table",
            "title": "統一30年超を経た旧西ドイツと旧東ドイツの地域構造",
            "headers": ["比較項目", "旧西ドイツ地域", "旧東ドイツ地域（旧社会主義圏）"],
            "rows": [
                ["主な都市・経済", "ルール工業地域（エッセン/デュッセルドルフ）・フランクフルト金融・ミュンヘン", "ベルリン（首都）・ドレスデン（精密光学）・ライプツィヒ（見本市）"],
                ["人口動態・雇用", "高い賃金と雇用機会により旧東側や移民を吸引", "若年・女性層が旧西側へ流出し地方過疎化・右派ポピュリズム支持上昇"],
                ["歴史的背景", "戦後のEU統合・ライン川軸の発展とガストアルバイター受入", "ソ連型計画経済期の環境汚染対策と統一後の大規模復興投資"],
            ],
        }
    ],
    "CHL": [
        {
            "id": "hv_chl_ns",
            "placement": "overview",
            "kind": "table",
            "title": "南北約4,300kmの細長い国土を貫く3つの自然地域帯",
            "headers": ["地域帯", "気候区分・海岸流", "代表資源・産業"],
            "rows": [
                ["北部（アタカマ）", "砂漠気候 BW（寒流ペルー海流＋亜熱帯高圧帯）", "銅鉱世界1位（チュキカマタ等）・塩湖のリチウム・硝石"],
                ["中部（サンティアゴ）", "地中海性気候 Cs（夏乾燥・冬雨）", "人口大半が集中・ブドウ・ワイン・サクランボ等の対北半球裏作輸出"],
                ["南部（パタゴニア）", "西岸海洋性気候 Cfb（強い偏西風・多雨）", "氷河によるフィヨルド（沈水地形）・冷涼水域を活かしたサケ・マス養殖"],
            ],
        }
    ],
}


def main() -> None:
    power_mix = json.loads(POWER_MIX_PATH.read_text(encoding="utf-8"))
    stats = json.loads(STATS_PATH.read_text(encoding="utf-8"))

    visuals_by_iso: dict[str, list[dict]] = {}

    def add_vis(iso: str, card: dict | None) -> None:
        if card:
            visuals_by_iso.setdefault(iso, []).append(card)

    # 1. Distinctive power mix donuts (~20 selected countries)
    for iso, (title, note) in POWER_HIGHLIGHTS.items():
        add_vis(iso, make_power_donut(iso, power_mix.get(iso, {}), title, note))

    # 2. Population explosion / decline lines (from real WB history in stats)
    for iso, (title, note) in POP_LINE_NOTES.items():
        add_vis(iso, make_pop_line(iso, stats.get(iso, {}), title, note))

    # 3. Meat culture donuts
    for iso, cfg in MEAT_CULTURE_SLICES.items():
        add_vis(
            iso,
            {
                "id": f"hv_meat_{iso.lower()}",
                "placement": "culture",
                "kind": "donut",
                "title": cfg["title"],
                "subtitle": cfg["subtitle"],
                "slices": cfg["slices"],
                "unit": "%",
                "note": cfg["note"],
                "source": cfg["source"],
            },
        )

    # 4. Monoculture / resource export donuts
    for iso, cfg in EXPORT_DONUTS.items():
        add_vis(
            iso,
            {
                "id": f"hv_export_{iso.lower()}",
                "placement": "industry",
                "kind": "donut",
                "title": cfg["title"],
                "subtitle": cfg["subtitle"],
                "slices": cfg["slices"],
                "unit": "%",
                "note": cfg["note"],
                "source": cfg["source"],
            },
        )

    # 5. International comparison bar charts:
    # 5a) Social welfare & national burden rate (Nordic / Western Europe vs JPN / USA)
    burden_scores = [
        ("スウェーデン", 51.0, "SWE"),
        ("フランス", 66.0, "FRA"),
        ("ノルウェー", 56.0, "NOR"),
        ("デンマーク", 63.0, "DNK"),
        ("ドイツ", 54.0, "DEU"),
        ("日本", 46.0, "JPN"),
        ("アメリカ", 33.0, "USA"),
    ]
    for target_iso in ("SWE", "NOR", "DNK", "FIN", "FRA", "DEU"):
        bars = []
        target_included = False
        for lbl, val, code in burden_scores:
            bars.append({"label": lbl, "value": val, "isTarget": code == target_iso})
            if code == target_iso:
                target_included = True
        if not target_included:
            bars.insert(0, {"label": "フィンランド", "value": 58.0, "isTarget": True})
        add_vis(
            target_iso,
            {
                "id": f"hv_welfare_{target_iso.lower()}",
                "placement": "overview",
                "kind": "bar",
                "title": "国民負担率の国際比較（税＋社会保障負担／対国民所得比目安）",
                "subtitle": "「高福祉・高負担」北欧・欧州型の位置づけ",
                "bars": bars,
                "unit": "%",
                "maxValue": 75,
                "note": "欧州・北欧諸国は高い租税・社会保障負担と引き換えに、大学までの教育無償化や手厚い医療・年金・子育て支援を提供する点が高頻度で比較出題される。",
                "source": "財務省・OECD国民負担率統計目安",
            },
        )

    # 5b) Female labor force participation (real WB SL.TLF.CACT.FE.ZS from stats)
    flab_candidates = [
        ("SWE", "スウェーデン"),
        ("ISL", "アイスランド"),
        ("NOR", "ノルウェー"),
        ("JPN", "日本"),
        ("DEU", "ドイツ"),
        ("USA", "アメリカ"),
        ("IND", "インド"),
        ("SAU", "サウジアラビア"),
    ]
    flab_rows = [
        (lbl, code, stats.get(code, {}).get("femaleLaborPct"))
        for code, lbl in flab_candidates
        if stats.get(code, {}).get("femaleLaborPct") is not None
    ]
    for target_iso in ("SWE", "ISL", "NOR", "IND", "SAU", "EGY"):
        if stats.get(target_iso, {}).get("femaleLaborPct") is None:
            continue
        bars = [
            {"label": lbl, "value": round(val, 1), "isTarget": code == target_iso}
            for lbl, code, val in flab_rows
        ]
        if target_iso == "EGY":
            ev = round(stats["EGY"]["femaleLaborPct"], 1)
            bars.append({"label": "エジプト", "value": ev, "isTarget": True})
        bars.sort(key=lambda b: -b["value"])
        add_vis(
            target_iso,
            {
                "id": f"hv_flab_{target_iso.lower()}",
                "placement": "population",
                "kind": "bar",
                "title": "女性の労働力率（15歳以上・国際比較）",
                "subtitle": "ジェンダー・就労環境の地域差",
                "bars": bars,
                "unit": "%",
                "maxValue": 85,
                "note": "北欧は手厚い保育・育休制度により高く、日本も近年上昇傾向。一方、南アジアや中東諸国は宗教的・社会的規範や家事負担により女性労働力率が低めに推移する。",
                "source": "World Bank (SL.TLF.CACT.FE.ZS)",
            },
        )

    # 5c) Personal remittances % of GDP (real WB BX.TRF.PWKR.DT.GD.ZS from stats)
    remit_candidates = [
        ("NPL", "ネパール"),
        ("PHL", "フィリピン"),
        ("SLV", "エルサルバドル"),
        ("GTM", "グアテマラ"),
        ("EGY", "エジプト"),
        ("PAK", "パキスタン"),
        ("MEX", "メキシコ"),
        ("BGD", "バングラデシュ"),
    ]
    remit_bars_base = [
        (lbl, code, stats.get(code, {}).get("remittanceGdpPct"))
        for code, lbl in remit_candidates
        if stats.get(code, {}).get("remittanceGdpPct") is not None
    ]
    for target_iso in ("NPL", "PHL", "SLV", "GTM", "EGY", "PAK", "MEX", "BGD"):
        if stats.get(target_iso, {}).get("remittanceGdpPct") is None:
            continue
        bars = [
            {"label": lbl, "value": round(val, 1), "isTarget": code == target_iso}
            for lbl, code, val in remit_bars_base
        ]
        bars.append({"label": "日本（参考）", "value": round(stats.get("JPN", {}).get("remittanceGdpPct") or 0.1, 1)})
        bars.sort(key=lambda b: -b["value"])
        add_vis(
            target_iso,
            {
                "id": f"hv_remit_{target_iso.lower()}",
                "placement": "industry",
                "kind": "bar",
                "title": "海外出稼ぎ労働者からの個人送金（対GDP比 %）",
                "subtitle": "頭脳流出・出稼ぎ送金依存国の実態",
                "bars": bars,
                "unit": "%",
                "maxValue": 32,
                "note": "中東湾岸・北米・アジア先進国への出稼ぎによる外貨送金がGDPの大きな割合を占め、国内消費と国際収支を下支えしている。",
                "source": "World Bank (BX.TRF.PWKR.DT.GD.ZS)",
            },
        )

    # 5d) Foreign resident share (Gulf + city/financial hubs)
    foreign_share_data = [
        ("アラブ首長国連邦(UAE)", 88.5, "ARE"),
        ("カタール", 87.0, "QAT"),
        ("クウェート", 68.0, "KWT"),
        ("ルクセンブルク", 47.0, "LUX"),
        ("シンガポール", 40.0, "SGP"),
        ("スイス", 27.0, "CHE"),
        ("日本（参考）", 2.8, "JPN"),
    ]
    for target_iso in ("ARE", "QAT", "KWT", "LUX", "SGP", "CHE"):
        bars = [
            {"label": lbl, "value": val, "isTarget": code == target_iso}
            for lbl, val, code in foreign_share_data
        ]
        add_vis(
            target_iso,
            {
                "id": f"hv_foreign_{target_iso.lower()}",
                "placement": "population",
                "kind": "bar",
                "title": "総人口に占める外国籍・海外出身者割合（比較目安）",
                "subtitle": "出稼ぎ労働・国際金融ハブ型国家の特徴",
                "bars": bars,
                "unit": "%",
                "maxValue": 100,
                "note": "湾岸産油国（UAE・カタール）では南アジア等からの建設・サービス男性労働者が人口の大半を占め、人口ピラミッドの青壮年男性が突出する。シンガポールやスイスは高度外国人材受入が特徴。",
                "source": "UN International Migrant Stock 目安",
            },
        )

    # 5e) International tourist arrivals benchmark (for top tourism powers)
    tour_data = [
        ("フランス", 100.0, "FRA"),
        ("スペイン", 85.0, "ESP"),
        ("アメリカ", 66.0, "USA"),
        ("イタリア", 57.0, "ITA"),
        ("タイ", 35.0, "THA"),
        ("日本", 36.8, "JPN"),
    ]
    for target_iso in ("FRA", "ESP", "ITA", "THA"):
        bars = [
            {"label": lbl, "value": val, "isTarget": code == target_iso}
            for lbl, val, code in tour_data
        ]
        add_vis(
            target_iso,
            {
                "id": f"hv_tour_{target_iso.lower()}",
                "placement": "industry",
                "kind": "bar",
                "title": "国際観光客受入数の国際比較（年間・百万人単位目安）",
                "subtitle": "観光立国・インバウンド収入と文化遺産集積",
                "bars": bars,
                "unit": "百万人",
                "maxValue": 110,
                "note": "シェンゲン協定やEU内陸路移動・温暖な地中海リゾート・豊富な世界遺産を背景に、欧州南部・フランスへの受入数と観光黒字が突出。タイは東南アジア屈指の観光ハブ。",
                "source": "UNWTO 国際観光統計目安",
            },
        )

    # 6. Regional contrast tables
    for iso, tables in TABLES_BY_ISO.items():
        for tbl in tables:
            add_vis(iso, tbl)

    OUT_PATH.write_text(json.dumps(visuals_by_iso, ensure_ascii=False, indent=2), encoding="utf-8")
    total_cards = sum(len(v) for v in visuals_by_iso.values())
    print(f"Generated {total_cards} adaptive visual highlights across {len(visuals_by_iso)} countries -> {OUT_PATH.name}")


if __name__ == "__main__":
    main()
