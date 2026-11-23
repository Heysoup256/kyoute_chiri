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
WAYBACK_DIR = ROOT_DIR / "data_pipeline" / "raw" / "wayback_pdfs"
OCR_CACHE_DIR = WAYBACK_DIR / "ocr_cache"
WAYBACK_ANS_OVERRIDES_PATH = ROOT_DIR / "data_pipeline" / "raw" / "wayback_answer_overrides_v1.json"
OUT_JSON_DIR = ROOT_DIR / "data_pipeline" / "raw" / "past_exams"
OUT_CLIPS_DIR = ROOT_DIR / "app" / "public" / "data" / "clips"

EXAMS = [
    {
        "examId": "2015_main",
        "sourceDir": "wayback",
        "examType": "center",
        "year": 2015,
        "session": "main",
        "sessionLabel": "2015年度 センター試験 本試験（地理B）",
        "questionPdf": "2015_main_question.pdf",
        "answerPdf": "2015_main_answer.pdf",
        "daimonCounts": {1: 6, 2: 6, 3: 6, 4: 6, 5: 5, 6: 6},
    },
    {
        "examId": "2016_main",
        "sourceDir": "wayback",
        "examType": "center",
        "year": 2016,
        "session": "main",
        "sessionLabel": "2016年度 センター試験 本試験（地理B）",
        "questionPdf": "2016_main_question.pdf",
        "answerPdf": "2016_main_answer.pdf",
        "daimonCounts": {1: 6, 2: 6, 3: 6, 4: 6, 5: 5, 6: 6},
    },
    {
        "examId": "2017_main",
        "sourceDir": "wayback",
        "examType": "center",
        "year": 2017,
        "session": "main",
        "sessionLabel": "2017年度 センター試験 本試験（地理B）",
        "questionPdf": "2017_main_question.pdf",
        "answerPdf": "2017_main_answer.pdf",
        "daimonCounts": {1: 6, 2: 6, 3: 5, 4: 6, 5: 5, 6: 7},
    },
    {
        "examId": "2017_makeup",
        "sourceDir": "wayback",
        "examType": "center",
        "year": 2017,
        "session": "makeup",
        "sessionLabel": "2017年度 センター試験 追・再試験（地理B）",
        "questionPdf": "2017_makeup_question.pdf",
        "answerPdf": "2017_makeup_answer.pdf",
        "daimonCounts": {1: 6, 2: 6, 3: 5, 4: 6, 5: 5, 6: 7},
    },
    {
        "examId": "2018_main",
        "sourceDir": "wayback",
        "examType": "center",
        "year": 2018,
        "session": "main",
        "sessionLabel": "2018年度 センター試験 本試験（地理B）",
        "questionPdf": "2018_main_question.pdf",
        "answerPdf": "2018_main_answer.pdf",
        "daimonCounts": {1: 6, 2: 6, 3: 6, 4: 6, 5: 5, 6: 6},
    },
    {
        "examId": "2018_makeup",
        "sourceDir": "wayback",
        "examType": "center",
        "year": 2018,
        "session": "makeup",
        "sessionLabel": "2018年度 センター試験 追・再試験（地理B）",
        "questionPdf": "2018_makeup_question.pdf",
        "answerPdf": "2018_makeup_answer.pdf",
        "daimonCounts": {1: 6, 2: 6, 3: 6, 4: 6, 5: 5, 6: 6},
    },
    {
        "examId": "2019_main",
        "sourceDir": "wayback",
        "examType": "center",
        "year": 2019,
        "session": "main",
        "sessionLabel": "2019年度 センター試験 本試験（地理B）",
        "questionPdf": "2019_main_question.pdf",
        "answerPdf": "2019_main_answer.pdf",
        "daimonCounts": {1: 6, 2: 6, 3: 6, 4: 6, 5: 5, 6: 6},
    },
    {
        "examId": "2019_makeup",
        "sourceDir": "wayback",
        "examType": "center",
        "year": 2019,
        "session": "makeup",
        "sessionLabel": "2019年度 センター試験 追・再試験（地理B）",
        "questionPdf": "2019_makeup_question.pdf",
        "answerPdf": "2019_makeup_answer.pdf",
        "daimonCounts": {1: 6, 2: 6, 3: 6, 4: 6, 5: 5, 6: 6},
    },
    {
        "examId": "2020_main",
        "sourceDir": "wayback",
        "examType": "center",
        "year": 2020,
        "session": "main",
        "sessionLabel": "2020年度 センター試験 本試験（地理B）",
        "questionPdf": "2020_main_question.pdf",
        "answerPdf": "2020_main_answer.pdf",
        "daimonCounts": {1: 6, 2: 6, 3: 6, 4: 6, 5: 5, 6: 6},
    },
    {
        "examId": "2020_makeup",
        "sourceDir": "wayback",
        "examType": "center",
        "year": 2020,
        "session": "makeup",
        "sessionLabel": "2020年度 センター試験 追・再試験（地理B）",
        "questionPdf": "2020_makeup_question.pdf",
        "answerPdf": "2020_makeup_answer.pdf",
        "daimonCounts": {1: 6, 2: 6, 3: 6, 4: 6, 5: 5, 6: 6},
    },
    {
        "examId": "2021_main",
        "sourceDir": "wayback",
        "examType": "kyotsu",
        "year": 2021,
        "session": "main",
        "sessionLabel": "2021年度 共通テスト 第1日程（地理B）",
        "questionPdf": "2021_main_question.pdf",
        "answerPdf": "2021_main_answer.pdf",
        "daimonCounts": {1: 6, 2: 6, 3: 6, 4: 6, 5: 6},
    },
    {
        "examId": "2021_makeup",
        "sourceDir": "wayback",
        "examType": "kyotsu",
        "year": 2021,
        "session": "makeup",
        "sessionLabel": "2021年度 共通テスト 第2日程（地理B）",
        "questionPdf": "2021_makeup_question.pdf",
        "answerPdf": "2021_makeup_answer.pdf",
        "daimonCounts": {1: 6, 2: 6, 3: 6, 4: 6, 5: 6},
    },
    {
        "examId": "2022_main",
        "sourceDir": "wayback",
        "examType": "kyotsu",
        "year": 2022,
        "session": "main",
        "sessionLabel": "2022年度 共通テスト 本試験（地理B）",
        "questionPdf": "2022_main_question.pdf",
        "answerPdf": "2022_main_answer.pdf",
        "daimonCounts": {1: 6, 2: 6, 3: 6, 4: 6, 5: 6},
    },
    {
        "examId": "2022_makeup",
        "sourceDir": "wayback",
        "examType": "kyotsu",
        "year": 2022,
        "session": "makeup",
        "sessionLabel": "2022年度 共通テスト 追・再試験（地理B）",
        "questionPdf": "2022_makeup_question.pdf",
        "answerPdf": "2022_makeup_answer.pdf",
        "daimonCounts": {1: 6, 2: 6, 3: 6, 4: 6, 5: 6},
    },
    {
        "examId": "2023_main",
        "sourceDir": "wayback",
        "examType": "kyotsu",
        "year": 2023,
        "session": "main",
        "sessionLabel": "2023年度 共通テスト 本試験（地理B）",
        "questionPdf": "2023_main_question.pdf",
        "answerPdf": "2023_main_answer.pdf",
        "daimonCounts": {1: 6, 2: 6, 3: 6, 4: 6, 5: 6},
    },
    {
        "examId": "2023_makeup",
        "sourceDir": "wayback",
        "examType": "kyotsu",
        "year": 2023,
        "session": "makeup",
        "sessionLabel": "2023年度 共通テスト 追・再試験（地理B）",
        "questionPdf": "2023_makeup_question.pdf",
        "answerPdf": "2023_makeup_answer.pdf",
        "daimonCounts": {1: 6, 2: 6, 3: 6, 4: 6, 5: 6},
    },
    {
        "examId": "2024_main",
        "sourceDir": "local",
        "examType": "kyotsu",
        "year": 2024,
        "session": "main",
        "sessionLabel": "2024年度 共通テスト 本試験（地理B）",
        "questionPdf": "2024_本試_chiriB.pdf",
        "answerPdf": "R6_地理Ｂ_本試験の正解.pdf",
        "daimonCounts": {1: 6, 2: 6, 3: 6, 4: 6, 5: 6},
    },
    {
        "examId": "2024_makeup",
        "sourceDir": "local",
        "examType": "kyotsu",
        "year": 2024,
        "session": "makeup",
        "sessionLabel": "2024年度 共通テスト 追試験（地理B）",
        "questionPdf": "2024_追試_chiriB.pdf",
        "answerPdf": "R6_地理Ｂ_追試験の正解.pdf",
        "daimonCounts": {1: 6, 2: 6, 3: 6, 4: 6, 5: 6},
    },
    {
        "examId": "2025_main",
        "sourceDir": "local",
        "examType": "kyotsu",
        "year": 2025,
        "session": "main",
        "sessionLabel": "2025年度 共通テスト 本試験（地理総合・地理探究）",
        "questionPdf": "2025_本試_chirisougouchiritankyuu.pdf",
        "answerPdf": "R7_【地理総合，地理探究】本試験の正解.pdf",
        "daimonCounts": {1: 4, 2: 4, 3: 6, 4: 6, 5: 5, 6: 5},
    },
    {
        "examId": "2025_makeup",
        "sourceDir": "local",
        "examType": "kyotsu",
        "year": 2025,
        "session": "makeup",
        "sessionLabel": "2025年度 共通テスト 追試験（地理総合・地理探究）",
        "questionPdf": "2025_追試_chirisougouchiritankyuu.pdf",
        "answerPdf": "R7追再_【地理総合，地理探究】発表用正解.pdf",
        "daimonCounts": {1: 4, 2: 4, 3: 6, 4: 6, 5: 5, 6: 5},
    },
    {
        "examId": "2026_main",
        "sourceDir": "local",
        "examType": "kyotsu",
        "year": 2026,
        "session": "main",
        "sessionLabel": "2026年度 共通テスト 本試験（地理総合・地理探究）",
        "questionPdf": "2026_本試_chirisougouchiritankyuu.pdf",
        "answerPdf": "R8_【地理総合，地理探究】発表用正解.pdf",
        "daimonCounts": {1: 4, 2: 4, 3: 6, 4: 5, 5: 6, 6: 5},
    },
    {
        "examId": "2026_makeup",
        "sourceDir": "local",
        "examType": "kyotsu",
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
    "COD": ["コンゴ民主", "キンシャサ", "コバルト"],
    "AUS": ["オーストラリア", "シドニー", "メルボルン", "キャンベラ", "パース", "ピルバラ", "グレートバリアリーフ", "グレートアーテジアン", "白豪主義"],
    "NZL": ["ニュージーランド", "ウェリントン", "オークランド", "南アルプス", "マオリ"],
    # 追加詳細化26カ国
    "GRC": ["ギリシャ", "ギリシア", "アテネ", "エーゲ海"],
    "PRT": ["ポルトガル", "リスボン", "コルク"],
    "IRL": ["アイルランド", "ダブリン"],
    "CZE": ["チェコ", "プラハ"],
    "HUN": ["ハンガリー", "ブダペスト"],
    "ROU": ["ルーマニア", "ブカレスト"],
    "SVK": ["スロバキア", "ブラチスラバ"],
    "CUB": ["キューバ", "ハバナ"],
    "PAN": ["パナマ", "パナマ運河", "パナマシティ"],
    "JAM": ["ジャマイカ", "キングストン"],
    "BOL": ["ボリビア", "ラパス", "ウユニ", "スクレ"],
    "ECU": ["エクアドル", "キト", "ガラパゴス"],
    "URY": ["ウルグアイ", "モンテビデオ"],
    "LBY": ["リビア", "トリポリ"],
    "TUN": ["チュニジア", "チュニス"],
    "CIV": ["コートジボワール", "ヤムスクロ", "アビジャン"],
    "GHA": ["ガーナ", "アクラ"],
    "NAM": ["ナミビア", "ナミブ砂漠", "ベンゲラ海流", "ウィントフック"],
    "MDG": ["マダガスカル", "アンタナナリボ"],
    "NPL": ["ネパール", "カトマンズ"],
    "QAT": ["カタール", "ドーハ"],
    "OMN": ["オマーン", "マスカット"],
    "KHM": ["カンボジア", "プノンペン", "アンコール"],
    "FJI": ["フィジー", "スバ"],
    "MDV": ["モルディブ", "マレ"],
    "MUS": ["モーリシャス", "ポートルイス"],
    # その他過去問出現頻出の基礎国
    "SDN": ["スーダン", "ハルツーム"],
    "MAC": ["マカオ"],
    "KWT": ["クウェート"],
    "JOR": ["ヨルダン", "アンマン"],
    "SYR": ["シリア", "ダマスカス"],
    "AFG": ["アフガニスタン", "カブール"],
    "BWA": ["ボツワナ"],
    "AGO": ["アンゴラ"],
    "CMR": ["カメルーン"],
    "SEN": ["セネガル", "ダカール"],
    "TZA": ["タンザニア", "キリマンジャロ"],
    "UGA": ["ウガンダ"],
    "ZMB": ["ザンビア"],
    "ZWE": ["ジンバブエ"],
    "PRY": ["パラグアイ"],
    "GTM": ["グアテマラ"],
    "CRI": ["コスタリカ"],
    "DOM": ["ドミニカ共和国"],
    "BLR": ["ベラルーシ", "ミンスク"],
    "EST": ["エストニア", "タリン"],
    "LVA": ["ラトビア", "リガ"],
    "LTU": ["リトアニア", "ビリニュス"],
    "HRV": ["クロアチア", "ダルマチア"],
    "SRB": ["セルビア", "ベオグラード"],
    "BGR": ["ブルガリア", "ソフィア"],
    "SYC": ["セーシェル"],
    "WSM": ["サモア"],
    "TON": ["トンガ"],
    "PNG": ["パプアニューギニア"],
    "LAO": ["ラオス", "ビエンチャン"],
    "BRN": ["ブルネイ"],
    "KGZ": ["キルギス"],
    "TKM": ["トルクメニスタン"],
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
    "言語", "自然災害", "洪水", "地球温暖化", "砂漠化", "国際河川", "地形図", "GIS",
    "カカオ", "オリーブ", "ワイン", "綿花", "コーヒー", "天然ゴム", "パーム油",
    "リチウム", "コバルト", "ウラン", "アルミニウム", "ボーキサイト", "地熱", "養殖",
    "ハザードマップ", "観光", "世界遺産", "難民"
]


def to_ascii_digits(s: str) -> str:
    return s.translate(str.maketrans("０１２３４５６７８９", "0123456789"))


def normalize_text(s: str) -> str:
    return re.sub(r"\s+", " ", to_ascii_digits(s)).strip()


def normalize_ocr_text(s: str) -> str:
    t = normalize_text(s)
    t = re.sub(r"問\s+([1-7])", r"問\1", t)
    t = re.sub(r"第\s+([1-6])\s+問", r"第\1問", t)
    return t


def load_wayback_answer_overrides() -> dict:
    if WAYBACK_ANS_OVERRIDES_PATH.exists():
        return json.loads(WAYBACK_ANS_OVERRIDES_PATH.read_text(encoding="utf-8"))
    return {}


def parse_answer_map(exam_cfg: dict, overrides: dict) -> dict[tuple[int, int], dict]:
    """正解データを (daimon, toi) -> {answerNos, answers, points, note?} に正規化して抽出する。"""
    exam_id = exam_cfg["examId"]
    if exam_id in overrides:
        entry = overrides[exam_id]
        out: dict[tuple[int, int], dict] = {}
        total_pts = 0
        for q in entry["questions"]:
            out[(int(q["daimon"]), int(q["toi"]))] = {
                "answerNos": [int(x) for x in q["answerNos"]],
                "answers": [int(x) for x in q["answers"]],
                "points": int(q["points"]),
                "note": q.get("note", ""),
            }
            total_pts += int(q["points"])
        assert total_pts == 100, f"{exam_id}: override sum={total_pts}"
        return out

    src_dir = EXAM_DIR if exam_cfg.get("sourceDir") == "local" else WAYBACK_DIR
    pdf_path = src_dir / exam_cfg["answerPdf"]

    if exam_cfg.get("sourceDir") == "local":
        doc = pymupdf.open(pdf_path)
        words = doc[0].get_text("words")
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
        doc.close()
        if len(answers) != 30 or sum(v[1] for v in answers.values()) != 100:
            raise ValueError(f"{pdf_path.name}: local answer parse mismatch")
        slots = build_expected_slots(exam_cfg["daimonCounts"])
        out = {}
        for idx, (d_num, q_num) in enumerate(slots):
            qno = idx + 1
            ans, pts = answers[qno]
            out[(d_num, q_num)] = {
                "answerNos": [qno],
                "answers": [ans],
                "points": pts,
                "note": "",
            }
        return out

    # Wayback text answer PDFs (2019..2023): map exact 設問 <-> nearest 解答番号 row(s)
    doc = pymupdf.open(pdf_path)
    words = doc[0].get_text("words")
    doc.close()
    header_xs = sorted([w[0] for w in words if "解答番号" in w[4]])
    if len(header_xs) < 2:
        raise ValueError(f"解答番号ヘッダーが2列見つかりません: {pdf_path}")

    q_items: list[tuple[int, float, int, list[tuple[int, int, int]]]] = []
    for ci, (hx, cmax) in enumerate([(header_xs[0], header_xs[0] + 145), (header_xs[1], 9999.0)]):
        setsumon_ys: list[tuple[float, int]] = []
        rows: dict[int, list[tuple[float, int]]] = {}
        for w in words:
            t = to_ascii_digits(w[4]).strip()
            if not t.isdigit():
                continue
            if hx - 45 <= w[0] < hx - 8 and 1 <= int(t) <= 8:
                setsumon_ys.append((w[1], int(t)))
            elif hx - 8 <= w[0] < cmax:
                rows.setdefault(round(w[1] / 3) * 3, []).append((w[0], int(t)))
        ans_rows = []
        for yk in sorted(rows):
            vals = [v for _, v in sorted(rows[yk])]
            if len(vals) == 3:
                ans_rows.append((yk, vals[0], vals[1], vals[2]))
        setsumon_ys.sort()
        grouped: dict[tuple[float, int], list[tuple[int, int, int]]] = {}
        for yk, qno, ans, pts in ans_rows:
            best = min(setsumon_ys, key=lambda sy: abs(sy[0] - yk))
            grouped.setdefault(best, []).append((qno, ans, pts))
        for sy in sorted(grouped):
            q_items.append((ci, sy[0], sy[1], grouped[sy]))

    out = {}
    daimon_num = 0
    total_pts = 0
    for _, _, toi, grp in q_items:
        if toi == 1:
            daimon_num += 1
        grp_sorted = sorted(grp, key=lambda x: x[0])
        pts_sum = sum(x[2] for x in grp_sorted)
        total_pts += pts_sum
        out[(daimon_num, toi)] = {
            "answerNos": [x[0] for x in grp_sorted],
            "answers": [x[1] for x in grp_sorted],
            "points": pts_sum,
            "note": "",
        }
    if total_pts != 100:
        raise ValueError(f"{pdf_path.name}: 合計配点={total_pts} != 100")
    return out


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


def compact_cjk(text: str) -> str:
    """Windows OCR 等で日本語文字間に挟まった半角スペースを除去し、英字単語間の空白は保持する。"""
    t = normalize_text(text)
    t = re.sub(r"(?<=[^\x00-\x7F])\s+|\s+(?=[^\x00-\x7F])", "", t)
    return re.sub(r"\s+", " ", t).strip()


def extract_keywords_and_countries(text: str) -> tuple[list[str], list[str], list[str]]:
    clean_txt = compact_cjk(text)
    clean_no_ind_noise = (
        clean_txt.replace("インドネシア", "")
        .replace("インド洋", "")
        .replace("インドシナ", "")
        .replace("インド・ヨーロッパ", "")
    )
    countries: list[str] = []
    for iso3, kws in COUNTRY_KEYWORDS.items():
        hay = clean_no_ind_noise if iso3 == "IND" else clean_txt
        if any(kw in hay for kw in kws):
            countries.append(iso3)

    layers: list[str] = []
    for lid, kws in LAYER_KEYWORDS.items():
        if any(kw in clean_txt for kw in kws):
            layers.append(lid)

    topics: list[str] = []
    for kw in TOPIC_KEYWORDS:
        if kw in clean_txt and kw not in topics:
            topics.append(kw)

    return countries, layers, topics[:6]


def clean_prompt_summary(raw_text: str) -> str:
    txt = compact_cjk(raw_text)
    # 制御文字(\x02..\x09)を丸数字表記へ復元
    repl = {chr(i + 1): f"({i})" for i in range(1, 10)}
    for k, v in repl.items():
        txt = txt.replace(k, v)
    # ページ番号表記を除去
    txt = re.sub(r"―\s*\d+\s*―\s*（\d+―\d+）", "", txt)
    txt = re.sub(r"地理総合，地理探究|地理[BＢ]", "", txt)
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


def process_exam(exam_cfg: dict, overrides: dict) -> list[dict]:
    exam_id = exam_cfg["examId"]
    is_local = exam_cfg.get("sourceDir") == "local"
    q_pdf = (EXAM_DIR if is_local else WAYBACK_DIR) / exam_cfg["questionPdf"]

    ans_map = parse_answer_map(exam_cfg, overrides)
    doc = pymupdf.open(q_pdf)
    expected_slots = build_expected_slots(exam_cfg["daimonCounts"])
    assert len(expected_slots) == len(ans_map), f"{exam_id}: slots={len(expected_slots)} != answers={len(ans_map)}"

    ocr_pages: dict[str, dict] = {}
    ocr_file = OCR_CACHE_DIR / f"{exam_id}.json"
    if ocr_file.exists():
        ocr_pages = json.loads(ocr_file.read_text(encoding="utf-8")).get("pages", {})

    # 各ページから大問見出しと問見出しを収集
    page_daimon_headers: dict[int, tuple[int, float, str]] = {}
    detected_markers: list[dict] = []

    for pno in range(len(doc)):
        page = doc[pno]
        full_txt = page.get_text("text").strip()

        # 既存2024..2026の画像オンリーページの補完メタデータ
        if is_local and len(full_txt) == 0 and (exam_id, pno + 1) in IMAGE_PAGE_OVERRIDES:
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

        lines: list[tuple[float, float, str, bool]] = []
        if full_txt:
            for b in sorted(page.get_text("blocks"), key=lambda b: (b[1], b[0])):
                lines.append((b[0], b[1], b[4], False))
        elif str(pno + 1) in ocr_pages:
            for ln in ocr_pages[str(pno + 1)].get("lines", []):
                lines.append((ln["x"], ln["y"], ln["text"], True))

        for x, y, raw_txt, is_ocr in lines:
            txt = normalize_ocr_text(raw_txt)
            md = re.search(r"第([1-6])問", txt)
            if md and ("配点" in txt or "答えよ" in txt or "文章" in txt or "次の問い" in txt or y < 180):
                d_num = int(md.group(1))
                if pno not in page_daimon_headers:
                    page_daimon_headers[pno] = (d_num, max(56.0, y - 8), txt)

            if is_local:
                mt = re.search(r"(?:^| )問([1-6])(?=\D|$)", txt)
                if mt:
                    q_num = int(mt.group(1))
                    if (
                        detected_markers
                        and detected_markers[-1]["page"] == pno
                        and abs(detected_markers[-1]["y"] - y) < 20
                        and detected_markers[-1]["toi"] == q_num
                    ):
                        continue
                    detected_markers.append(
                        {
                            "page": pno,
                            "y": max(58.0, y - 8),
                            "toi": q_num,
                            "daimonHint": page_daimon_headers[pno][0] if pno in page_daimon_headers else None,
                            "isImageOnly": False,
                            "override": None,
                        }
                    )
            else:
                max_x = 125 if is_ocr else 98
                if x > max_x:
                    continue
                mt = re.match(
                    r"^(?:[ぁ-んァ-ヶー・\s]{1,28}\s+)?問([1-7])(?=(?:\D|(?:19|20)\d\d))(?![〜～~\-])",
                    txt,
                )
                if not mt:
                    continue
                q_num = int(mt.group(1))
                if (
                    detected_markers
                    and detected_markers[-1]["page"] == pno
                    and detected_markers[-1]["toi"] == q_num
                    and abs(detected_markers[-1]["y"] - y) < 35
                ):
                    continue
                detected_markers.append(
                    {
                        "page": pno,
                        "y": max(54.0, y - 10),
                        "toi": q_num,
                        "daimonHint": page_daimon_headers[pno][0] if pno in page_daimon_headers else None,
                        "isImageOnly": is_ocr,
                        "override": None,
                    }
                )

    if len(detected_markers) != len(expected_slots):
        raise ValueError(
            f"{exam_id}: 検出問数({len(detected_markers)}) != 期待({len(expected_slots)}): "
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

    # 大問ごとのリード文マップを作成
    daimon_intro_texts: dict[int, str] = {}
    for pno, (d_num, _, intro_txt) in page_daimon_headers.items():
        daimon_intro_texts[d_num] = intro_txt

    def extract_clip_text(p_idx: int, y0: float, y1: float) -> str:
        t_raw = doc[p_idx].get_text("text", clip=pymupdf.Rect(0, y0, doc[p_idx].rect.width, y1)).strip()
        if t_raw:
            return t_raw
        p_ocr = ocr_pages.get(str(p_idx + 1), {}).get("lines", [])
        return "\n".join(ln["text"] for ln in p_ocr if (y0 - 6) <= ln["y"] <= (y1 + 6))

    # 出力先フォルダ作成
    clip_dir = OUT_CLIPS_DIR / exam_id
    clip_dir.mkdir(parents=True, exist_ok=True)

    questions_out: list[dict] = []

    for idx, m in enumerate(detected_markers):
        daimon = m["daimon"]
        toi = m["toi"]
        question_id = f"{exam_id}_d{daimon}_q{toi}"
        ans_info = ans_map[(daimon, toi)]
        answer_nos = ans_info["answerNos"]
        answers = ans_info["answers"]
        correct_ans = answers[0]
        primary_no = answer_nos[0]
        pts = ans_info["points"]

        start_page = m["page"]
        if toi == 1 and start_page in page_daimon_headers:
            start_y = min(m["y"], page_daimon_headers[start_page][1])
        else:
            start_y = m["y"]

        if idx + 1 < len(detected_markers):
            next_m = detected_markers[idx + 1]
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
            y0 = max(56.0, start_y)
            y1 = min(doc[start_page].rect.height - 70.0, next_start_y - 6.0)
            if y1 - y0 > 20:
                clips.append((start_page, y0, y1))
                raw_text_parts.append(extract_clip_text(start_page, y0, y1))
        else:
            p_rect = doc[start_page].rect
            y0 = max(56.0, start_y)
            y1 = p_rect.height - 70.0
            if y1 - y0 > 20:
                clips.append((start_page, y0, y1))
                raw_text_parts.append(extract_clip_text(start_page, y0, y1))

            for mid_p in range(start_page + 1, next_page):
                mp_rect = doc[mid_p].rect
                mid_txt = extract_clip_text(mid_p, 56.0, mp_rect.height - 70.0).strip()
                if "下書き" in mid_txt and len(mid_txt) < 35:
                    continue
                clips.append((mid_p, 56.0, mp_rect.height - 70.0))
                raw_text_parts.append(mid_txt)

            if next_start_y > 115.0:
                y0_n = 56.0
                y1_n = next_start_y - 6.0
                if y1_n - y0_n > 25:
                    clips.append((next_page, y0_n, y1_n))
                    raw_text_parts.append(extract_clip_text(next_page, y0_n, y1_n))

        # 縦結合PNGを生成（既に有効なクリップが存在する場合は上書きせずスキップ）
        out_png = clip_dir / f"{question_id}.png"
        if not (out_png.exists() and out_png.stat().st_size > 1000):
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
            clean_body = clean_prompt_summary(combined_text)
            first_sent = clean_body.split("。")[0]
            if len(first_sent) > 48:
                first_sent = first_sent[:45] + "..."
            title = f"第{daimon}問 問{toi}: {first_sent}" if first_sent else f"第{daimon}問 問{toi}"
            prompt_summary = clean_body
            rel_countries, rel_layers, topic_tags = extract_keywords_and_countries(combined_text + "\n" + intro_text)
            choices_count = detect_choices_count(combined_text, max(answers))

        if len(answer_nos) == 1:
            q_label = f"第{daimon}問 問{toi}（解答番号{primary_no}）"
            exp_head = f"【正解：{correct_ans}（配点 {pts}点）】"
        else:
            nos_str = "・".join(str(x) for x in answer_nos)
            ans_str = "・".join(str(x) for x in answers)
            extra_note = f"／{ans_info['note']}" if ans_info.get("note") else ""
            q_label = f"第{daimon}問 問{toi}（解答番号{nos_str}）"
            exp_head = f"【正解（解答番号{nos_str}）：{ans_str}（計{pts}点{extra_note}）】"

        questions_out.append(
            {
                "questionId": question_id,
                "examId": exam_id,
                "year": exam_cfg["year"],
                "session": exam_cfg["session"],
                "sessionLabel": exam_cfg["sessionLabel"],
                "daimon": daimon,
                "toi": toi,
                "answerNo": primary_no,
                "points": pts,
                "questionLabel": q_label,
                "title": title,
                "promptSummary": prompt_summary,
                "relatedCountries": rel_countries,
                "relatedLayerIds": rel_layers,
                "topicTags": topic_tags if topic_tags else ["地理B"],
                "clipImagePath": f"/data/clips/{exam_id}/{question_id}.png",
                "clipPdfPath": None,
                "choicesCount": choices_count,
                "choiceLabels": [f"選択肢 {i}" for i in range(1, choices_count + 1)],
                "correctAnswer": correct_ans,
                "explanation": f"{exp_head} 問題画像の設問文および図表・選択肢を確認して復習してください。",
                "isPrototypeSample": False,
            }
        )

    doc.close()
    return questions_out


def main() -> None:
    OUT_JSON_DIR.mkdir(parents=True, exist_ok=True)
    OUT_CLIPS_DIR.mkdir(parents=True, exist_ok=True)
    overrides = load_wayback_answer_overrides()

    total_questions = 0
    total_png_bytes = 0

    for cfg in EXAMS:
        questions = process_exam(cfg, overrides)
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
            f"Processed {cfg['examId']:12s}: {len(questions)} questions, "
            f"country_mapped={mapped_c}/{len(questions)}, clips_size={dir_bytes/1024/1024:.2f} MB"
        )

    print(f"ALL DONE: total_questions={total_questions}, total_clips_size={total_png_bytes/1024/1024:.2f} MB")


if __name__ == "__main__":
    main()
