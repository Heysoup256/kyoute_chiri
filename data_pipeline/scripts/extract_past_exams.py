"""
共テ地理過去問/ 配下の問題PDF・正解PDF（2024〜2026年 本試・追試 計6回分・180問）を解析し、
1) 設問単位の切り抜きPNG画像（app/public/data/clips/<examId>/<questionId>.png）
2) 設問別メタデータJSON（data_pipeline/raw/past_exams/<examId>_v1.json）
を生成するスクリプト。

※ 元の 共テ地理過去問/ 配下のPDFは読み取り専用であり、一切変更しない。
"""

import json
import re
from pathlib import Path
import pymupdf

ROOT_DIR = Path(__file__).resolve().parents[2]
EXAM_DIR = ROOT_DIR / "共テ地理過去問"
OUT_JSON_DIR = ROOT_DIR / "data_pipeline" / "raw" / "past_exams"
OUT_CLIPS_DIR = ROOT_DIR / "app" / "public" / "data" / "clips"

EXAMS = [
    {
        "examId": "2024_main",
        "year": 2024,
        "session": "main",
        "sessionLabel": "2024年度 共通テスト 本試験（地理B）",
        "questionPdf": "2024_本試_chiriB.pdf",
        "answerPdf": "R6_地理Ｂ_本試験の正解.pdf",
        "daimonCounts": {1: 6, 2: 6, 3: 6, 4: 6, 5: 6},
    },
    {
        "examId": "2024_makeup",
        "year": 2024,
        "session": "makeup",
        "sessionLabel": "2024年度 共通テスト 追試験（地理B）",
        "questionPdf": "2024_追試_chiriB.pdf",
        "answerPdf": "R6_地理Ｂ_追試験の正解.pdf",
        "daimonCounts": {1: 6, 2: 6, 3: 6, 4: 6, 5: 6},
    },
    {
        "examId": "2025_main",
        "year": 2025,
        "session": "main",
        "sessionLabel": "2025年度 共通テスト 本試験（地理総合・地理探究）",
        "questionPdf": "2025_本試_chirisougouchiritankyuu.pdf",
        "answerPdf": "R7_【地理総合，地理探究】本試験の正解.pdf",
        "daimonCounts": {1: 4, 2: 4, 3: 6, 4: 6, 5: 5, 6: 5},
    },
    {
        "examId": "2025_makeup",
        "year": 2025,
        "session": "makeup",
        "sessionLabel": "2025年度 共通テスト 追試験（地理総合・地理探究）",
        "questionPdf": "2025_追試_chirisougouchiritankyuu.pdf",
        "answerPdf": "R7追再_【地理総合，地理探究】発表用正解.pdf",
        "daimonCounts": {1: 4, 2: 4, 3: 6, 4: 6, 5: 5, 6: 5},
    },
    {
        "examId": "2026_main",
        "year": 2026,
        "session": "main",
        "sessionLabel": "2026年度 共通テスト 本試験（地理総合・地理探究）",
        "questionPdf": "2026_本試_chirisougouchiritankyuu.pdf",
        "answerPdf": "R8_【地理総合，地理探究】発表用正解.pdf",
        "daimonCounts": {1: 4, 2: 4, 3: 6, 4: 5, 5: 6, 6: 5},
    },
    {
        "examId": "2026_makeup",
        "year": 2026,
        "session": "makeup",
        "sessionLabel": "2026年度 共通テスト 追試験（地理総合・地理探究）",
        "questionPdf": "2026_追試_chirisougouchiritankyuu.pdf",
        "answerPdf": "R8_追・再試験【地理総合，地理探究】発表用正解.pdf",
        "daimonCounts": {1: 4, 2: 4, 3: 6, 4: 5, 5: 6, 6: 5},
    },
]

# 著作権保護等でページ全体が画像化されている6ページの補完メタデータ
IMAGE_PAGE_OVERRIDES = {
    ("2024_main", 15): {
        "daimon": 3,
        "toi": 1,
        "isDaimonStart": True,
        "title": "第3問 問1 日本の大都市圏（都心・郊外・臨海地域）の景観変化",
        "promptSummary": "日本の大都市圏における都心・郊外・臨海地域の1960年代の景観写真と1960年代以降の人口・土地利用変化の組み合わせを問う問題。",
        "relatedCountries": ["JPN"],
        "topicTags": ["都市構造", "大都市圏", "ドーナツ化", "再開発", "臨海地域"],
        "choicesCount": 6,
    },
    ("2024_makeup", 3): {
        "daimon": 1,
        "toi": 3,
        "isDaimonStart": False,
        "title": "第1問 問3 日本列島の植生垂直分布と氷期の森林限界",
        "promptSummary": "本州北部から九州にかけての垂直的な植生分布（常緑広葉樹林帯・落葉広葉樹林帯・針葉樹林帯）および氷期における森林限界の低下を問う問題。",
        "relatedCountries": ["JPN"],
        "topicTags": ["植生帯", "垂直分布", "常緑広葉樹林", "針葉樹林", "森林限界"],
        "choicesCount": 4,
    },
    ("2024_makeup", 17): {
        "daimon": 3,
        "toi": 3,
        "isDaimonStart": False,
        "title": "第3問 問3 シカゴ市のアフリカ系住民分布と文化（ブルース）の立地変化",
        "promptSummary": "アメリカ合衆国シカゴ市における地区別アフリカ系住民割合と、アフリカ系文化から誕生したブルース演奏飲食店の立地変化を読み取る問題。",
        "relatedCountries": ["USA"],
        "topicTags": ["人種・民族", "アメリカ都市", "シカゴ", "生活文化"],
        "choicesCount": 4,
    },
    ("2026_main", 15): {
        "daimon": 3,
        "toi": 4,
        "isDaimonStart": False,
        "title": "第3問 問4 北アメリカの湿地・湖沼分布と氷河地形・三角州",
        "promptSummary": "アメリカ合衆国とカナダの湿地・湖沼分布について、ツンドラ、ミシシッピ川の鳥趾状三角州、氷床が削った湖沼群、マングローブ等の特徴を問う問題。",
        "relatedCountries": ["USA", "CAN"],
        "topicTags": ["氷河地形", "鳥趾状三角州", "ツンドラ", "マングローブ", "北アメリカ"],
        "choicesCount": 4,
    },
    ("2026_main", 33): {
        "daimon": 6,
        "toi": 1,
        "isDaimonStart": True,
        "title": "第6問 問1 国際河川（ドナウ川・ナイル川・メコン川）の流域気候区分",
        "promptSummary": "国際河川であるドナウ川、ナイル川、メコン川の源流から河口にかけてのケッペンの気候区分（熱帯・乾燥帯・温帯・寒帯）の推移を判別する問題。",
        "relatedCountries": ["DEU", "AUT", "EGY", "ETH", "SDN", "CHN", "THA", "VNM"],
        "topicTags": ["国際河川", "ケッペンの気候区分", "ドナウ川", "ナイル川", "メコン川"],
        "choicesCount": 6,
    },
    ("2026_makeup", 14): {
        "daimon": 3,
        "toi": 2,
        "isDaimonStart": False,
        "title": "第3問 問2 氷床による巨石（迷子石）・土石流・風化と侵食",
        "promptSummary": "世界各地にみられる巨石の成因（最終氷期の氷床、土石流、風化と侵食）と地域の組み合わせを判別する問題。",
        "relatedCountries": ["GBR", "NOR", "AUS"],
        "topicTags": ["氷河地形", "風化", "侵食", "自然災害"],
        "choicesCount": 6,
    },
}

# 高校地理キーワード → ISO3 マッピング辞書
COUNTRY_KEYWORDS = {
    "JPN": ["日本", "東京", "大阪", "名古屋", "北海道", "札幌", "広島", "島根", "青森", "津軽", "三陸", "瀬戸内", "京浜", "中京", "関東", "九州", "本州", "沖縄"],
    "CHN": ["中国", "中華人民共和国", "北京", "上海", "深圳", "広州", "香港", "長江", "揚子江", "黄河", "チベット", "ウイグル", "タクラマカン", "秦嶺", "淮河", "華北", "華南", "三峡", "経済特区"],
    "KOR": ["韓国", "大韓民国", "ソウル", "釜山", "朝鮮半島"],
    "TWN": ["台湾", "台北", "TSMC"],
    "MNG": ["モンゴル", "ウランバートル", "ゴビ"],
    "IDN": ["インドネシア", "ジャカルタ", "ジャワ", "スマトラ", "カリマンタン", "バリ"],
    "THA": ["タイ", "バンコク", "チャオプラヤ", "メコン"],
    "VNM": ["ベトナム", "ハノイ", "ホーチミン", "メコン"],
    "MYS": ["マレーシア", "クアラルンプール", "マラッカ"],
    "SGP": ["シンガポール", "マラッカ"],
    "PHL": ["フィリピン", "マニラ", "ルソン"],
    "MMR": ["ミャンマー", "ヤンゴン", "エーヤワディー"],
    "IND": ["インド", "デリー", "ニューデリー", "ムンバイ", "バンガロール", "カルカッタ", "コルカタ", "ガンジス", "デカン", "ヒンドゥー", "ヒマラヤ"],
    "PAK": ["パキスタン", "カラチ", "インダス", "イスラマバード"],
    "BGD": ["バングラデシュ", "ダッカ", "ベンガル", "サイクロン"],
    "LKA": ["スリランカ", "コロンボ", "セイロン"],
    "SAU": ["サウジアラビア", "リヤド", "メッカ", "ペルシャ湾"],
    "IRN": ["イラン", "テヘラン", "シーア派", "カナート", "ホルムズ"],
    "IRQ": ["イラク", "バグダッド", "チグリス", "ユーフラテス"],
    "TUR": ["トルコ", "アンカラ", "イスタンブール", "ボスポラス", "アナトリア"],
    "ISR": ["イスラエル", "エルサレム", "テルアビブ", "死海"],
    "ARE": ["アラブ首長国連邦", "UAE", "ドバイ", "アブダビ"],
    "KAZ": ["カザフスタン", "アラル海", "アスタナ"],
    "UZB": ["ウズベキスタン", "アラル海", "タシケント"],
    "GBR": ["イギリス", "英国", "ロンドン", "テムズ", "マンチェスター", "スコットランド", "北海"],
    "FRA": ["フランス", "パリ", "リヨン", "セーヌ", "マルセイユ", "アルプス"],
    "DEU": ["ドイツ", "ベルリン", "ハンブルク", "ミュンヘン", "ルール", "ライン川", "エルベ川", "ドナウ川"],
    "ITA": ["イタリア", "ローマ", "ミラノ", "ベネチア", "ポー川", "地中海"],
    "ESP": ["スペイン", "マドリード", "バルセロナ", "イベリア", "ジブラルタル"],
    "NLD": ["オランダ", "アムステルダム", "ロッテルダム", "ポルダー", "ライン川"],
    "BEL": ["ベルギー", "ブリュッセル", "フランドル"],
    "CHE": ["スイス", "チューリヒ", "ジュネーブ", "アルプス"],
    "AUT": ["オーストリア", "ウィーン", "ドナウ川", "アルプス"],
    "SWE": ["スウェーデン", "ストックホルム", "キルナ"],
    "NOR": ["ノルウェー", "オスロ", "ベルゲン", "フィヨルド", "サーミ", "北海油田"],
    "FIN": ["フィンランド", "ヘルシンキ"],
    "DNK": ["デンマーク", "コペンハーゲン", "グリーンランド"],
    "ISL": ["アイスランド", "レイキャビク", "地熱", "海嶺"],
    "POL": ["ポーランド", "ワルシャワ"],
    "UKR": ["ウクライナ", "キーウ", "チェルノーゼム", "黒海"],
    "RUS": ["ロシア", "モスクワ", "シベリア", "ウラル", "ヤクーツク", "バイカル", "永久凍土"],
    "USA": ["アメリカ", "合衆国", "ニューヨーク", "シカゴ", "ロサンゼルス", "サンフランシスコ", "ヒューストン", "シリコンバレー", "フィラデルフィア", "アパラチア", "ロッキー", "ミシシッピ", "コーンベルト", "グレートプレーンズ", "サンベルト", "ラストベルト", "ヒスパニック"],
    "CAN": ["カナダ", "トロント", "バンクーバー", "モントリオール", "ケベック", "ハドソン湾", "五大湖"],
    "MEX": ["メキシコ", "メキシコシティ", "マキラドーラ", "USMCA"],
    "BRA": ["ブラジル", "ブラジリア", "サンパウロ", "リオデジャネイロ", "マナウス", "アマゾン", "セラード", "カラジャス"],
    "ARG": ["アルゼンチン", "ブエノスアイレス", "パンパ", "パタゴニア"],
    "CHL": ["チリ", "サンティアゴ", "アタカマ", "アンデス", "ペルー海流"],
    "PER": ["ペルー", "リマ", "アンデス", "ペルー海流", "インカ"],
    "COL": ["コロンビア", "ボゴタ", "アンデス"],
    "VEN": ["ベネズエラ", "カラカス", "オリノコ"],
    "EGY": ["エジプト", "カイロ", "アレキサンドリア", "ナイル", "スエズ", "アスワン"],
    "MAR": ["モロッコ", "カサブランカ", "アトラス", "ジブラルタル"],
    "DZA": ["アルジェリア", "アルジェ", "サハラ"],
    "NGA": ["ナイジェリア", "ラゴス", "アブジャ", "ニジェール川"],
    "KEN": ["ケニア", "ナイロビ", "大地溝帯"],
    "ETH": ["エチオピア", "アディスアベバ", "青ナイル", "大地溝帯"],
    "ZAF": ["南アフリカ", "ヨハネスブルグ", "ケープタウン", "レアメタル", "白金", "ダイヤモンド"],
    "COD": ["コンゴ", "キンシャサ", "コバルト"],
    "AUS": ["オーストラリア", "シドニー", "メルボルン", "キャンベラ", "パース", "ピルバラ", "グレートバリアリーフ", "グレートアーテジアン", "白豪主義"],
    "NZL": ["ニュージーランド", "ウェリントン", "オークランド", "南アルプス", "マオリ"],
}

LAYER_KEYWORDS = {
    "mr_andes": ["アンデス", "ナスカプレート"],
    "mr_himalaya": ["ヒマラヤ", "チベット"],
    "mr_alps": ["アルプス山脈"],
    "mr_rocky": ["ロッキー山脈"],
    "mr_ural": ["ウラル山脈"],
    "mr_appalachian": ["アパラチア"],
    "rv_rhine": ["ライン川", "ロッテルダム"],
    "rv_amazon": ["アマゾン川", "セルバ"],
    "rv_nile": ["ナイル川", "ナイルデルタ", "ハルツーム", "アスワン"],
    "rv_changjiang": ["長江", "揚子江", "三峡"],
    "oc_north_atlantic": ["北大西洋海流"],
    "oc_kuroshio": ["黒潮", "日本海流"],
    "oc_peru": ["ペルー海流", "フンボルト海流"],
    "oc_benguela": ["ベンゲラ海流", "ナミブ"],
    "pb_japan_trench": ["日本海溝", "プレート"],
    "pb_mid_atlantic": ["大西洋中央海嶺", "海嶺"],
    "pb_east_africa_rift": ["大地溝帯", "リフトバレー"],
    "lf_sognefjord": ["フィヨルド"],
    "lf_elbe_estuary": ["エスチュアリー", "三角江", "エルベ川"],
    "lf_nile_delta": ["三角州", "デルタ"],
    "lf_gbr": ["グレートバリアリーフ", "サンゴ礁"],
    "sc_malacca": ["マラッカ海峡"],
    "sc_suez": ["スエズ運河"],
    "sc_panama": ["パナマ運河"],
    "sc_gibraltar": ["ジブラルタル海峡"],
}

TOPIC_KEYWORDS = [
    "プレート", "造山帯", "火山", "地震", "氷河", "フィヨルド", "扇状地", "三角州", "エスチュアリー",
    "リアス海岸", "サンゴ礁", "モンスーン", "ケッペン", "雨温図", "ハイサーグラフ", "海流",
    "稲作", "小麦", "トウモロコシ", "大豆", "プランテーション", "酪農", "混合農業", "地中海式農業",
    "鉄鉱石", "石炭", "原油", "天然ガス", "シェール", "再生可能エネルギー", "水力発電", "原子力",
    "鉄鋼業", "自動車", "半導体", "ICT", "経済特区", "EU", "ASEAN", "USMCA", "メルコスール",
    "人口", "少子高齢化", "都市圏", "移民", "ヒスパニック", "宗教", "イスラム教", "キリスト教",
    "言語", "自然災害", "洪水", "地球温暖化", "砂漠化", "国際河川", "地形図", "GIS"
]


def to_ascii_digits(s: str) -> str:
    return s.translate(str.maketrans("０１２３４５６７８９", "0123456789"))


def normalize_text(s: str) -> str:
    return re.sub(r"\s+", " ", to_ascii_digits(s)).strip()


def parse_answer_pdf(pdf_path: Path) -> dict[int, tuple[int, int]]:
    """正解PDFから 解答番号(1..30) -> (正解番号, 配点) を正確に抽出する。"""
    doc = pymupdf.open(pdf_path)
    words = doc[0].get_text("words")

    # ヘッダーの「解答番号」X座標を検出（左表・右表の2列）
    header_xs = sorted([w[0] for w in words if "解答番号" in w[4]])
    if len(header_xs) < 2:
        raise ValueError(f"解答番号ヘッダーが2列見つかりません: {pdf_path}")

    left_min_x = header_xs[0] - 15
    left_max_x = header_xs[0] + 150
    right_min_x = header_xs[1] - 15

    answers: dict[int, tuple[int, int]] = {}
    for col_min, col_max in [(left_min_x, left_max_x), (right_min_x, 9999)]:
        rows: dict[int, list[tuple[float, str]]] = {}
        for w in words:
            if col_min <= w[0] < col_max:
                t = to_ascii_digits(w[4]).strip()
                if t.isdigit():
                    y_key = round(w[1] / 5) * 5
                    rows.setdefault(y_key, []).append((w[0], t))
        for y_key in sorted(rows):
            vals = [int(t) for _, t in sorted(rows[y_key])]
            if len(vals) == 3:
                qno, ans, pts = vals
                if 1 <= qno <= 30 and 1 <= ans <= 9 and 2 <= pts <= 6:
                    answers[qno] = (ans, pts)

    if len(answers) != 30:
        raise ValueError(f"{pdf_path.name}: 抽出数={len(answers)} (期待値30)")
    total_pts = sum(v[1] for v in answers.values())
    if total_pts != 100:
        raise ValueError(f"{pdf_path.name}: 合計配点={total_pts} (期待値100)")
    return answers


def detect_choices_count(text: str, correct_ans: int) -> int:
    """設問文と正解番号から選択肢数（4 / 6 / 8 等）を推定する。"""
    # PDF内では ①..⑧ が \x02..\x09 にマッピングされることが多い
    circled_unicode = re.findall(r"[①②③④⑤⑥⑦⑧]", text)
    max_c = 4
    mapping = {"①": 1, "②": 2, "③": 3, "④": 4, "⑤": 5, "⑥": 6, "⑦": 7, "⑧": 8}
    for ch in circled_unicode:
        max_c = max(max_c, mapping[ch])
    for ch in text:
        code = ord(ch)
        if 2 <= code <= 9:
            # テキスト中に出現する \x02(=1) .. \x09(=8)
            max_c = max(max_c, code - 1)
    max_c = max(max_c, correct_ans)
    if max_c <= 4:
        return 4
    if max_c <= 6:
        return 6
    return min(8, max_c)


def extract_keywords_and_countries(text: str) -> tuple[list[str], list[str], list[str]]:
    countries: list[str] = []
    for iso3, kws in COUNTRY_KEYWORDS.items():
        if any(kw in text for kw in kws):
            countries.append(iso3)

    layers: list[str] = []
    for lid, kws in LAYER_KEYWORDS.items():
        if any(kw in text for kw in kws):
            layers.append(lid)

    topics: list[str] = []
    for kw in TOPIC_KEYWORDS:
        if kw in text and kw not in topics:
            topics.append(kw)

    return countries, layers, topics[:6]


def clean_prompt_summary(raw_text: str) -> str:
    txt = normalize_text(raw_text)
    # 制御文字(\x02..\x09)を丸数字表記へ復元
    repl = {chr(i + 1): f"({i})" for i in range(1, 10)}
    for k, v in repl.items():
        txt = txt.replace(k, v)
    # ページ番号表記を除去
    txt = re.sub(r"―\s*\d+\s*―\s*（\d+―\d+）", "", txt)
    txt = re.sub(r"地理総合，地理探究|地理B", "", txt)
    txt = re.sub(r"\s+", " ", txt).strip()
    if len(txt) > 220:
        return txt[:217] + "..."
    return txt


def build_expected_slots(daimon_counts: dict[int, int]) -> list[tuple[int, int]]:
    slots = []
    for d in sorted(daimon_counts):
        for q in range(1, daimon_counts[d] + 1):
            slots.append((d, q))
    return slots


def process_exam(exam_cfg: dict) -> list[dict]:
    exam_id = exam_cfg["examId"]
    q_pdf = EXAM_DIR / exam_cfg["questionPdf"]
    a_pdf = EXAM_DIR / exam_cfg["answerPdf"]

    answers = parse_answer_pdf(a_pdf)
    doc = pymupdf.open(q_pdf)
    expected_slots = build_expected_slots(exam_cfg["daimonCounts"])
    assert len(expected_slots) == 30

    # 各ページから大問見出しと問見出しを収集
    page_daimon_headers: dict[int, tuple[int, float, str]] = {}
    detected_markers: list[dict] = []

    for pno in range(len(doc)):
        page = doc[pno]
        blocks = sorted(page.get_text("blocks"), key=lambda b: (b[1], b[0]))
        full_txt = page.get_text("text").strip()

        # 画像オンリーページのチェック
        if len(full_txt) == 0 and (exam_id, pno + 1) in IMAGE_PAGE_OVERRIDES:
            ov = IMAGE_PAGE_OVERRIDES[(exam_id, pno + 1)]
            if ov["isDaimonStart"]:
                page_daimon_headers[pno] = (ov["daimon"], 62.0, ov["title"])
            detected_markers.append(
                {
                    "page": pno,
                    "y": 62.0,
                    "toi": ov["toi"],
                    "daimonHint": ov["daimon"],
                    "isImageOnly": True,
                    "override": ov,
                }
            )
            continue

        for b in blocks:
            txt = normalize_text(b[4])
            md = re.search(r"第\s*([1-6])\s*問", txt)
            if md and ("配点" in txt or "答えよ" in txt or b[1] < 200):
                d_num = int(md.group(1))
                if pno not in page_daimon_headers:
                    page_daimon_headers[pno] = (d_num, max(58.0, b[1] - 8), txt)

            mt = re.search(r"(?:^| )問\s*([1-6])(?=\D|$)", txt)
            if mt:
                q_num = int(mt.group(1))
                # 同一ページ・極近傍での重複検出を回避
                if detected_markers and detected_markers[-1]["page"] == pno and abs(detected_markers[-1]["y"] - b[1]) < 20 and detected_markers[-1]["toi"] == q_num:
                    continue
                detected_markers.append(
                    {
                        "page": pno,
                        "y": max(58.0, b[1] - 8),
                        "toi": q_num,
                        "daimonHint": page_daimon_headers[pno][0] if pno in page_daimon_headers else None,
                        "isImageOnly": False,
                        "override": None,
                    }
                )

    if len(detected_markers) != 30:
        raise ValueError(
            f"{exam_id}: 検出された問数が30ではありません ({len(detected_markers)}): "
            f"{[(m['page']+1, m['toi']) for m in detected_markers]}"
        )

    # expected_slots と 1対1 整合確認
    for idx, (slot, m) in enumerate(zip(expected_slots, detected_markers)):
        d_num, q_num = slot
        if m["toi"] != q_num:
            raise ValueError(
                f"{exam_id} idx={idx}: 期待問番 Q{q_num} != 検出 Q{m['toi']} (page {m['page']+1})"
            )
        m["daimon"] = d_num
        m["qno"] = idx + 1

    # 大問ごとのリード文マップを作成
    daimon_intro_texts: dict[int, str] = {}
    for pno, (d_num, _, intro_txt) in page_daimon_headers.items():
        daimon_intro_texts[d_num] = intro_txt

    # 出力先フォルダ作成
    clip_dir = OUT_CLIPS_DIR / exam_id
    clip_dir.mkdir(parents=True, exist_ok=True)

    questions_out: list[dict] = []

    for idx, m in enumerate(detected_markers):
        qno = m["qno"]
        daimon = m["daimon"]
        toi = m["toi"]
        question_id = f"{exam_id}_d{daimon}_q{toi}"
        correct_ans, pts = answers[qno]

        start_page = m["page"]
        # 大問最初の問(問1)なら大問見出しから切り抜く
        if toi == 1 and start_page in page_daimon_headers:
            start_y = min(m["y"], page_daimon_headers[start_page][1])
        else:
            start_y = m["y"]

        if idx + 1 < len(detected_markers):
            next_m = detected_markers[idx + 1]
            # 次の大問の問1なら次の大問見出しの上で止める
            if next_m["toi"] == 1 and next_m["page"] in page_daimon_headers:
                next_start_y = min(next_m["y"], page_daimon_headers[next_m["page"]][1])
            else:
                next_start_y = next_m["y"]
            next_page = next_m["page"]
        else:
            next_page = len(doc) - 1
            next_start_y = doc[next_page].rect.height - 65.0

        # クリップ矩形リスト (page_idx, y0, y1) を構築
        clips: list[tuple[int, float, float]] = []
        raw_text_parts: list[str] = []

        if start_page == next_page:
            y0 = max(64.0, start_y)
            y1 = min(doc[start_page].rect.height - 78.0, next_start_y - 6.0)
            if y1 - y0 > 20:
                clips.append((start_page, y0, y1))
                raw_text_parts.append(doc[start_page].get_text("text", clip=pymupdf.Rect(0, y0, doc[start_page].rect.width, y1)))
        else:
            # 開始ページ
            p_rect = doc[start_page].rect
            y0 = max(64.0, start_y)
            y1 = p_rect.height - 78.0
            if y1 - y0 > 20:
                clips.append((start_page, y0, y1))
                raw_text_parts.append(doc[start_page].get_text("text", clip=pymupdf.Rect(0, y0, p_rect.width, y1)))

            # 中間ページ
            for mid_p in range(start_page + 1, next_page):
                mp_rect = doc[mid_p].rect
                mid_txt = doc[mid_p].get_text("text").strip()
                # 完全な白紙ページ（「下書き用紙」等）があればスキップ
                if "下書き" in mid_txt and len(mid_txt) < 30:
                    continue
                clips.append((mid_p, 64.0, mp_rect.height - 78.0))
                raw_text_parts.append(mid_txt)

            # 終了ページ（次の設問がそのページ上端 y<=115 で始まっていない場合のみ前半を切り抜く）
            if next_start_y > 115.0:
                np_rect = doc[next_page].rect
                y0_n = 64.0
                y1_n = next_start_y - 6.0
                if y1_n - y0_n > 25:
                    clips.append((next_page, y0_n, y1_n))
                    raw_text_parts.append(doc[next_page].get_text("text", clip=pymupdf.Rect(0, y0_n, np_rect.width, y1_n)))

        # 縦結合PNGを生成
        out_png = clip_dir / f"{question_id}.png"
        page_w = doc[start_page].rect.width
        total_h = sum((c[2] - c[1]) for c in clips) + max(0, len(clips) - 1) * 8.0
        merged_pdf = pymupdf.open()
        merged_page = merged_pdf.new_page(width=page_w, height=max(100.0, total_h))
        cur_y = 0.0
        for p_idx, cy0, cy1 in clips:
            seg_h = cy1 - cy0
            dest_rect = pymupdf.Rect(0, cur_y, page_w, cur_y + seg_h)
            src_rect = pymupdf.Rect(0, cy0, page_w, cy1)
            merged_page.show_pdf_page(dest_rect, doc, p_idx, clip=src_rect)
            cur_y += seg_h + 8.0

        pix = merged_page.get_pixmap(dpi=145, alpha=False)
        pix.save(str(out_png))
        merged_pdf.close()

        # メタデータ生成
        ov = m["override"]
        combined_text = "\n".join(raw_text_parts)
        intro_text = daimon_intro_texts.get(daimon, "")

        if ov:
            title = ov["title"]
            prompt_summary = ov["promptSummary"]
            rel_countries = ov["relatedCountries"]
            _, rel_layers, ov_topics = extract_keywords_and_countries(intro_text)
            topic_tags = list(dict.fromkeys(ov["topicTags"] + ov_topics))[:6]
            choices_count = ov["choicesCount"]
        else:
            # 設問最初の文をタイトル化
            clean_body = clean_prompt_summary(combined_text)
            first_sent = clean_body.split("。")[0]
            if len(first_sent) > 48:
                first_sent = first_sent[:45] + "..."
            title = f"第{daimon}問 問{toi}: {first_sent}" if first_sent else f"第{daimon}問 問{toi}"
            prompt_summary = clean_body
            rel_countries, rel_layers, topic_tags = extract_keywords_and_countries(combined_text + "\n" + intro_text)
            choices_count = detect_choices_count(combined_text, correct_ans)

        questions_out.append(
            {
                "questionId": question_id,
                "examId": exam_id,
                "year": exam_cfg["year"],
                "session": exam_cfg["session"],
                "sessionLabel": exam_cfg["sessionLabel"],
                "daimon": daimon,
                "toi": toi,
                "answerNo": qno,
                "points": pts,
                "questionLabel": f"第{daimon}問 問{toi}（問番号{qno}）",
                "title": title,
                "promptSummary": prompt_summary,
                "relatedCountries": rel_countries,
                "relatedLayerIds": rel_layers,
                "topicTags": topic_tags if topic_tags else ["地理総合・探究"],
                "clipImagePath": f"/data/clips/{exam_id}/{question_id}.png",
                "clipPdfPath": None,
                "choicesCount": choices_count,
                "choiceLabels": [f"選択肢 {i}" for i in range(1, choices_count + 1)],
                "correctAnswer": correct_ans,
                "explanation": f"【正解：{correct_ans}（配点 {pts}点）】問題画像の設問文および図表・選択肢を確認して復習してください。",
                "isPrototypeSample": False,
            }
        )

    return questions_out


def main() -> None:
    OUT_JSON_DIR.mkdir(parents=True, exist_ok=True)
    OUT_CLIPS_DIR.mkdir(parents=True, exist_ok=True)

    total_questions = 0
    total_png_bytes = 0

    for cfg in EXAMS:
        questions = process_exam(cfg)
        out_json = OUT_JSON_DIR / f"{cfg['examId']}_v1.json"
        with out_json.open("w", encoding="utf-8") as f:
            json.dump(
                {
                    "examId": cfg["examId"],
                    "year": cfg["year"],
                    "session": cfg["session"],
                    "sessionLabel": cfg["sessionLabel"],
                    "questions": questions,
                },
                f,
                ensure_ascii=False,
                indent=2,
            )

        clip_files = list((OUT_CLIPS_DIR / cfg["examId"]).glob("*.png"))
        dir_bytes = sum(p.stat().st_size for p in clip_files)
        total_questions += len(questions)
        total_png_bytes += dir_bytes
        mapped_c = sum(1 for q in questions if q["relatedCountries"])
        print(
            f"Processed {cfg['examId']}: {len(questions)} questions, "
            f"country_mapped={mapped_c}/30, clips_size={dir_bytes/1024/1024:.2f} MB"
        )

    print(f"ALL DONE: total_questions={total_questions}, total_clips_size={total_png_bytes/1024/1024:.2f} MB")


if __name__ == "__main__":
    main()
