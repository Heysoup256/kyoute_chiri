"""昇格30カ国の概観・生活・写真ターゲット・主要都市・関連国・ビジュアル（パート2：13カ国）。"""

from __future__ import annotations

EXTRA_30_META_PART2 = {
    "GIN": {
        "overviewLife": {
            "quickOverview": {
                "headline": "西アフリカの給水塔と『世界2位のボーキサイト輸出国』、大資源と貧困の対比",
                "summary": "フータ・ジャロン高地からニジェール川など大河が発し、強い熱帯風化が育てた世界屈指のボーキサイトと巨大シマンドゥ鉄山を抱える。電力不足のため原鉱石のまま中国等へ輸出する構造が続く。",
                "keyPoints": [
                    "ボーキサイト産出＆輸出世界トップ争い（対中国供給の最大拠点の一つ）",
                    "ニジェール川源流『西アフリカの給水塔』・Am極多雨沿岸（コナクリ年3,700mm）",
                ],
            },
            "dailyLife": {
                "summary": "雨季には激しいスコールが毎日のように降る半島都市コナクリでは活気ある青空市場（マルシェ）で生鮮魚介やマンゴー・バナナが並び、家庭の台所には炭火コンロとアルミ大鍋が欠かせない。",
                "food": "米に落花生（ピーナッツ）ソースやパーム油の青菜煮込み（フイユ・ド・マニオク＝キャッサバの葉シチュー）や焼き魚を合わせた濃厚料理。",
                "housing": "半島部コナクリのトタン屋根付きブロック造住宅から内陸フータ・ジャロンの円錐茅葺き粘土住居（カーズ）まで地域多様。",
                "streetNote": "赤土の道路や鉱山鉄道を巨大な赤いボーキサイト鉱石運搬トラック・列車が港湾へ向けて行き交う。",
                "wikiPhotoTargets": [
                    {"title": "Conakry", "fallbackTitles": ["Fouta Djallon", "Guinea"], "caption": "ギニア湾に突き出す半島都市・首都コナクリの景観"},
                    {"title": "Fouta Djallon", "fallbackTitles": ["Kambadaga Falls"], "caption": "西アフリカ諸大河の水源となるフータ・ジャロン高地の渓谷"},
                ],
            },
        },
        "topCitiesRegions": {
            "topCities": [
                {"nameJa": "コナクリ", "popMan": 210, "lng": -13.58, "lat": 9.64, "isCapital": True, "note": "大西洋カラム半島に延びる首都・国内最大の交易港"},
                {"nameJa": "カンカン", "popMan": 48, "lng": -9.31, "lat": 10.39, "isCapital": False, "note": "東部サバナ地域の中心都市・ニジェール川上流商業地"},
            ],
            "specialRegions": [
                {"name": "ボケ・ボーキサイト鉱床帯＆シマンドゥ鉄山", "tag": "世界有数鉱物開発帯", "lng": -14.29, "lat": 10.94, "zoom": 6.4, "description": "中国・多国籍資本が掘削し専用港から世界へ積み出す巨大ボーキサイト地帯"},
            ],
        },
        "relations": [
            {"partnerIso3": "CHN", "partnerNameJa": "中華人民共和国", "category": "trade", "direction": "outgoing", "summary": "ボーキサイトの大半を中国へ輸出し、見返りに港湾鉄道・シマンドゥ鉱山インフラ建設を受ける。"},
            {"partnerIso3": "ARE", "partnerNameJa": "UAE", "category": "trade", "direction": "outgoing", "summary": "国内産金の主要輸出・流通先および港湾ロジスティクス投資相手。"},
            {"partnerIso3": "SEN", "partnerNameJa": "セネガル", "category": "migration", "direction": "mutual", "summary": "フータ・ジャロン地域出身のフラニ系商業ネットワークで深く繋がる北隣国。"},
        ],
        "visuals": [
            {
                "id": "hv_gin_bauxite_gap",
                "placement": "industry",
                "kind": "bar",
                "title": "ギニアの『ボーキサイト採掘2位 vs アルミ精錬ほぼゼロ』対比（2023・万t換算）",
                "bars": [
                    {"label": "オーストラリア（鉱石1位）", "value": 9800, "color": "#94a3b8"},
                    {"label": "ギニア（鉱石2位＝ほぼ原鉱輸出）", "value": 9700, "isTarget": True, "color": "#ea580c"},
                    {"label": "ギニア アルミ精錬量（電力不足！）", "value": 0, "color": "#ef4444"},
                    {"label": "カナダ（鉱石ゼロでも精錬300万t）", "value": 300, "color": "#0284c7"},
                ],
                "unit": "万t",
                "maxValue": 10500,
                "note": "安価電力あるカナダが精錬する一方、電力不足のギニアは原鉱のまま輸出（工業化ギャップの典型）",
            },
        ],
    },
    "SEN": {
        "overviewLife": {
            "quickOverview": {
                "headline": "カナリア寒流の良漁場と落花生モノカルチャー脱却へ歩む、仏語圏西アフリカの安定玄関",
                "summary": "アフリカ大陸最西端ダカールを擁し、内陸国マリの外洋出口を担う。独立以来クーデターのない民主選挙の伝統の下、かつての落花生依存から水産物・リン鉱石・金・新規沖合油ガス田へ経済多角化を進めている。",
                "keyPoints": [
                    "旧仏植民地の『落花生（ピーナッツ）単作』構造からの脱却と水産タコ輸出",
                    "ガンビア国境との二重地形・ゴレ島奴隷史・民主的安定と西アフリカCFAフラン圏",
                ],
            },
            "dailyLife": {
                "summary": "音楽（ンバラ）と相撲（ルット＝セネガル相撲）への国民的热狂があり、大西洋の涼しい風に吹かれるダカールでは、華やかな伝統布『バザン』を着飾る市民と活発な沿海漁師（ピローグ木造船）の朝市が並ぶ。",
                "food": "砕け米をトマトと魚の旨味で炊き込む国民食『チェブジェン（ユネスコ無形文化遺産）』と、ピーナッツ煮込み『マフェ』、ハイビスカスジュース『ビサップ』。",
                "housing": "ダカールの近代フランス風街区と建設中『新都市ディアムニアディオ』、地方農村の茅葺き円形住居と中庭（クール）共同生活。",
                "streetNote": "青と黄色の色鮮やかな木造漁船『ピローグ』がビーチにびっしりと並び、朝の水揚げ場が賑わう。",
                "wikiPhotoTargets": [
                    {"title": "Dakar", "fallbackTitles": ["African Renaissance Monument", "Gorée"], "caption": "アフリカ大陸最西端の都市・ダカール大西洋沿岸風景"},
                    {"title": "Lake Retba", "fallbackTitles": ["Saint-Louis, Senegal", "Gorée"], "caption": "ピンク色に輝く沿岸塩湖ラックローズ（レトバ湖）"},
                ],
            },
        },
        "topCitiesRegions": {
            "topCities": [
                {"nameJa": "ダカール", "popMan": 115, "metroPopMan": 390, "lng": -17.47, "lat": 14.72, "isCapital": True, "note": "大陸最西端の大西洋ハブ港・西アフリカ経済学術中心"},
                {"nameJa": "トゥバ", "popMan": 90, "lng": -15.88, "lat": 14.86, "isCapital": False, "note": "イスラム・ムリッド教団の聖地として急成長した第2都市"},
            ],
            "specialRegions": [
                {"name": "ゴレ島＆サン・ルイ", "tag": "奴隷貿易史跡・旧仏領西ア首都", "lng": -17.40, "lat": 14.67, "zoom": 8.0, "description": "大西洋奴隷貿易の歴史遺産ゴレ島とセネガル川河口の旧植民都サン・ルイ"},
            ],
        },
        "relations": [
            {"partnerIso3": "MLI", "partnerNameJa": "マリ共和国", "category": "trade", "direction": "outgoing", "summary": "内陸マリの海港（ダカール港・ダカール〜バマコ鉄道連絡）としての最大貿易相手。"},
            {"partnerIso3": "FRA", "partnerNameJa": "フランス", "category": "history", "direction": "mutual", "summary": "旧宗主国かつCFAフラン通貨ペッグ・語学文化・主要移民先としての密接パートナー。"},
            {"partnerIso3": "JPN", "partnerNameJa": "日本", "category": "trade", "direction": "outgoing", "summary": "セネガル沿岸やモーリタニア沖で獲れるマダコ等の水産物重要供給国の一つ。"},
        ],
        "visuals": [
            {
                "id": "hv_sen_trade_div",
                "placement": "industry",
                "kind": "donut",
                "title": "セネガルの輸出構造多角化（脱・落花生単作への移行目安）",
                "slices": [
                    {"label": "金（近年東部開発で急増）", "value": 24, "color": "#f59e0b"},
                    {"label": "精製油・新規原油ガス", "value": 22, "color": "#334155"},
                    {"label": "リン酸・肥料化学", "value": 16, "color": "#3b82f6"},
                    {"label": "水産物（タコ・魚）＆落花生油", "value": 18, "color": "#10b981"},
                    {"label": "農産・セメント他", "value": 20, "color": "#94a3b8"},
                ],
                "unit": "%",
                "note": "かつて輸出の7〜8割だった落花生から金・リン鉱石・水産・エネルギーへの多角化を達成",
            },
        ],
    },
    "MLI": {
        "overviewLife": {
            "quickOverview": {
                "headline": "泥のモスク『ジェンネ』と内陸デルタ・金/綿花を擁しサヘル同盟へ転じた内陸大国",
                "summary": "かつてサハラ交易で栄えたトンブクトゥとニジェール川内陸デルタを抱え、金が輸出の約8割を占める。北部トゥアレグ対立と治安悪化から軍事政権が発足し、ニジェール・ブルキナと共にECOWASを離脱した。",
                "keyPoints": [
                    "ニジェール川『内陸デルタ』＆世界遺産『ジェンネ日干しレンガモスク』",
                    "輸出8割が金＋綿花・超若年出生率・サヘル諸国同盟(AES)で脱仏/ECOWAS離脱",
                ],
            },
            "dailyLife": {
                "summary": "毎年雨季の前に町総出で日干しレンガ壁を泥で塗り直す『ジェンネ大モスク』の祭典が地域共同体の結束を象徴する。市場では乾燥気候で長持ちする川魚の燻製、サハラからの岩塩塊、綿織物が取引されている。",
                "food": "ミレット・ソルガム・米を主食に、ピーナッツソース『ティガデゲナ』や焼羊肉『ディビ』、非常に濃い緑茶に砂糖をたっぷり入れて小さなグラスで3度に分けて注ぐ伝統『アタヤ（サハラ茶）』。",
                "housing": "日中の高温と夜間の冷え込みを防ぐ厚い土壁・平坦屋根の『スーダン・サヘル様式』泥レンガ建築群。",
                "streetNote": "大河ニジェール川では細長い手漕ぎやモーターの平底川舟（ピナス）が都市と村を結ぶ大動脈になっている。",
                "wikiPhotoTargets": [
                    {"title": "Great Mosque of Djenné", "fallbackTitles": ["Djenné", "Timbuktu"], "caption": "世界最大の泥・日干しレンガ建造物であるジェンネの大モスク"},
                    {"title": "Bamako", "fallbackTitles": ["Niger River", "Bandiagara Escarpment"], "caption": "ニジェール川中上流の盆地に広がる首都バマコ"},
                ],
            },
        },
        "topCitiesRegions": {
            "topCities": [
                {"nameJa": "バマコ", "popMan": 280, "metroPopMan": 420, "lng": -8.00, "lat": 12.64, "isCapital": True, "note": "ニジェール川沿いの急膨張首都・綿花と金の商業中枢"},
                {"nameJa": "トンブクトゥ（歴史都市）", "popMan": 6, "lng": -3.01, "lat": 16.77, "isCapital": False, "note": "サハラ南縁の岩塩・金・イスラム学問古都（砂漠化進行）"},
            ],
            "specialRegions": [
                {"name": "ニジェール川内陸デルタ＆ジェンネ", "tag": "外来河川の巨大湿地網", "lng": -4.55, "lat": 14.30, "zoom": 6.2, "description": "サヘル乾燥地に稲作と漁業の恵みをもたらす網状氾濫原と泥モスク"},
            ],
        },
        "relations": [
            {"partnerIso3": "NER", "partnerNameJa": "ニジェール", "category": "history", "direction": "mutual", "summary": "ニジェール川を共有し、共に『サヘル諸国同盟(AES)』を結成してECOWASから離脱した軍政隣国。"},
            {"partnerIso3": "SEN", "partnerNameJa": "セネガル", "category": "trade", "direction": "mutual", "summary": "海港への最短アクセス（ダカール港利用）として物資輸送で不可欠な西隣国。"},
            {"partnerIso3": "ARE", "partnerNameJa": "UAE", "category": "trade", "direction": "outgoing", "summary": "輸出総額の大部分を占める金の主要取引・精製拠点国。"},
        ],
        "visuals": [
            {
                "id": "hv_mli_gold_export",
                "placement": "industry",
                "kind": "donut",
                "title": "マリ共和国の輸出構成（金への極端なモノカルチャー依存）",
                "slices": [
                    {"label": "金（外資/小規模鉱山）", "value": 80, "color": "#eab308"},
                    {"label": "綿花（サバナ商業農産）", "value": 10, "color": "#10b981"},
                    {"label": "肥料・家畜・油糧種子他", "value": 10, "color": "#94a3b8"},
                ],
                "unit": "%",
                "note": "リチウムなど新鉱山開発も進むが金価格変動に国家経済が直結する典型構造",
            },
        ],
    },
    "NER": {
        "overviewLife": {
            "quickOverview": {
                "headline": "出生率世界1位・若年人口爆発とサハラ『ウラン鉱山』・チャド湖縮小を抱える内陸国",
                "summary": "サハラ砂漠が8割を占め、世界一高い合計特殊出生率（約6.6）による極端なピラミッド型人口と最下位水準のHDIを抱える。フランス原発を支えたウランや新規石油パイプラインを通じ資源主権転換へ動いている。",
                "keyPoints": [
                    "『合計特殊出生率約6.6 世界最高レベル』・年齢中央値約15歳の超富士山型人口",
                    "アーリットの『ウラン産出』と対仏関係断絶・ベナン経由原油輸出開始",
                ],
            },
            "dailyLife": {
                "summary": "年平均30℃前後の酷熱と乾季の長さに合わせ、早朝に畑作業や水汲みを終えて日中は木陰で休む暮らし。北部砂漠ではインディゴ青色のターバンで顔と砂塵を守るトゥアレグ族の遊牧民が今もラクダとともに移動する。",
                "food": "トウジンビエ（ミレット）やソルガムを練った主食『トウ』、焼羊肉、モリンガ葉の和え物、乾燥ナツメヤシ（デーツ）。",
                "housing": "南部定住地帯の粘土ブロック・藁葺き住居や首都の日干しレンガ平屋と、北部砂漠遊牧民の木枠・革テント。",
                "streetNote": "サハラ横断を往来するラクダ隊商から改造四輪駆動車・自動二輪への移行が進みつつ、チャド湖等の水場減少に直面。",
                "wikiPhotoTargets": [
                    {"title": "Niamey", "fallbackTitles": ["Agadez", "Grand Mosque of Agadez"], "caption": "ニジェール川沿いの乾燥帯に広がる首都ニアメと泥建築文化"},
                    {"title": "Tenere", "fallbackTitles": ["Aïr Mountains", "Agadez"], "caption": "アイル山地とテネレ砂漠が広がるニジェールのサハラ風景"},
                ],
            },
        },
        "topCitiesRegions": {
            "topCities": [
                {"nameJa": "ニアメ", "popMan": 140, "lng": 2.11, "lat": 13.51, "isCapital": True, "note": "南西端のニジェール川畔に位置する首都・商業教育中心"},
                {"nameJa": "アガデス", "popMan": 14, "lng": 7.99, "lat": 16.97, "isCapital": False, "note": "サハラ交易とアーリットウラン鉱山・対欧州不法移民通過の玄関都市"},
            ],
            "specialRegions": [
                {"name": "アーリット（ウラン鉱床）＆チャド湖", "tag": "ウラン採掘・環境縮小湖", "lng": 7.38, "lat": 18.74, "zoom": 5.8, "description": "サハラ砂漠内の大ウラン鉱山と南東国境で干上がりつつあるチャド湖"},
            ],
        },
        "relations": [
            {"partnerIso3": "FRA", "partnerNameJa": "フランス", "category": "history", "direction": "mutual", "summary": "長年原発向けウランを採掘してきた旧宗主国だが、2023年クーデター後に仏軍撤退・資源契約見直し。"},
            {"partnerIso3": "NGA", "partnerNameJa": "ナイジェリア", "category": "trade", "direction": "mutual", "summary": "南部国境にまたがるハウサ人文化と電力を共有する人口・経済最大隣国。"},
            {"partnerIso3": "CHN", "partnerNameJa": "中華人民共和国", "category": "trade", "direction": "incoming", "summary": "アガデム油田開発およびベナン港直結2,000km原油パイプラインを主導した投資相手国。"},
        ],
        "visuals": [
            {
                "id": "hv_ner_fertility_gap",
                "placement": "population",
                "kind": "bar",
                "title": "合計特殊出生率の世界極値比較（2024–2025年統計）",
                "bars": [
                    {"label": "ニジェール（世界最高級）", "value": 6.6, "isTarget": True, "color": "#ef4444"},
                    {"label": "ナイジェリア", "value": 5.1, "color": "#f59e0b"},
                    {"label": "インド", "value": 2.0, "color": "#64748b"},
                    {"label": "日本", "value": 1.2, "color": "#3b82f6"},
                    {"label": "韓国", "value": 0.72, "color": "#6366f1"},
                ],
                "unit": "人（1人の女性が生む子の数）",
                "maxValue": 7.5,
                "note": "女子教育普及や乳児死亡改善が遅れ世界一高い出生率と極端なピラミッド型を維持",
            },
        ],
    },
    "CMR": {
        "overviewLife": {
            "quickOverview": {
                "headline": "気候も文化も『アフリカの縮図』、カカオ・原油・アルミ精錬と英仏二言語対立",
                "summary": "赤道熱帯雨林からサヘルまで全てを包含し、250超の民族が共生する一方、旧独領を英仏分割統治した歴史により英語圏西部2州とフランス語圏8州の対立が続く。水力電力でアルミ精錬も行う多様な資源国。",
                "keyPoints": [
                    "『アフリカの縮図』＋カメルーン山麓の極端多雨＋サナガ水力アルミ精錬",
                    "旧独→英仏委任統治ゆえの『仏語8割 vs 英語2割（分離運動紛争）』＆英連邦とOIF双方加盟",
                ],
            },
            "dailyLife": {
                "summary": "カメルーン人は熱狂的なサッカー愛（不屈のライオン）で知られ、南部ヤウンデ・ドゥアラでは湿潤熱帯の豊かなバナナ・キャッサバ料理が、北部乾燥帯ではイスラム文化と牛遊牧の生活が営まれている。",
                "food": "ニガウリに似た青菜『ンドレ』のピーナッツ煮込み（国民食）、焼き魚とプランテンバナナ揚げ、北部ではミレットと牛肉の串焼き『ソヤ』。",
                "housing": "南部の赤土・セメントブロックにトタン屋根や高床風の住まいと、北部サヘル（ムスグム族等）の砲弾型日干し土建築が好対照。",
                "streetNote": "バイリンガル表記の官庁街がある一方、英語圏（バメンダ等）では学校休校や治安緊張が続いている。",
                "wikiPhotoTargets": [
                    {"title": "Yaoundé", "fallbackTitles": ["Mount Cameroon", "Douala"], "caption": "7つの丘の上に広がる緑豊かな高原首都ヤウンデ"},
                    {"title": "Mount Cameroon", "fallbackTitles": ["Waza National Park", "Kribi"], "caption": "西アフリカ最高峰の活火山カメルーン山（4,040m）"},
                ],
            },
        },
        "topCitiesRegions": {
            "topCities": [
                {"nameJa": "ドゥアラ", "popMan": 280, "metroPopMan": 390, "lng": 9.77, "lat": 4.05, "isCapital": False, "note": "ギニア湾奥最大の商業・港湾工業都市（エデア・アルミ至近）"},
                {"nameJa": "ヤウンデ", "popMan": 280, "metroPopMan": 410, "lng": 11.50, "lat": 3.85, "isCapital": True, "note": "内陸標高約730mの高原に位置する政治首都"},
            ],
            "specialRegions": [
                {"name": "カメルーン山・西部英語圏＆エデア", "tag": "火山多雨・言語境界・水力アルミ", "lng": 9.20, "lat": 4.20, "zoom": 6.4, "description": "世界有数豪雨地カメルーン山と英語圏2州、サナガ川アルミ精錬地帯"},
            ],
        },
        "relations": [
            {"partnerIso3": "FRA", "partnerNameJa": "フランス", "category": "history", "direction": "mutual", "summary": "中部アフリカCFAフラン・教育インフラ・主要貿易で結ばれる旧仏側統治国。"},
            {"partnerIso3": "CHN", "partnerNameJa": "中華人民共和国", "category": "trade", "direction": "mutual", "summary": "木材・原油の最大買手であり、新深水港クリビ港・水力発電ダムの主要建設融資国。"},
            {"partnerIso3": "NGA", "partnerNameJa": "ナイジェリア", "category": "history", "direction": "mutual", "summary": "長い西国境を接しバカシ半島帰属平和解決・英語圏難民往来の重要隣国。"},
        ],
        "visuals": [
            {
                "id": "hv_cmr_north_south",
                "placement": "overview",
                "kind": "table",
                "title": "『アフリカの縮図』カメルーンの南北大対比",
                "headers": ["項目", "南部（沿岸〜高原）", "北部（チャド湖側）"],
                "rows": [
                    ["気候区分・植生", "Af（ドゥアラ年3,800mm超）・Aw（熱帯雨林）", "BSサヘル（年300〜700mm・草原/サバナ）"],
                    ["農産・資源", "カカオ・バナナ・天然ゴム・木材・原油・アルミ", "綿花・落花生・雑穀・牛羊遊牧"],
                    ["主要宗教・特徴", "キリスト教（約7割）＋英仏言語問題", "イスラム教主体・砂漠化/ボコハラム警戒"],
                ],
            },
        ],
    },
    "UGA": {
        "overviewLife": {
            "quickOverview": {
                "headline": "赤道直下の『アフリカの真珠』、白ナイル源流のコーヒー輸出＆アフリカ最大難民保護国",
                "summary": "標高1,200mのヴィクトリア湖北岸に位置するため年中涼しく緑が絶えない。ロブスタ種コーヒーの主要輸出国かつアフリカ一の難民受入（約160万人）を進歩的統合政策で支え、アルバート湖石油開発を進める。",
                "keyPoints": [
                    "赤道直下・高標高＋ヴィクトリア湖（白ナイル源流）で温暖快適（年中22℃前後）",
                    "ロブスタコーヒー主要輸出・アフリカ最多難民受入・アルバート湖油田計画",
                ],
            },
            "dailyLife": {
                "summary": "首都カンパラの七つの丘ではバイクタクシー『ボダボダ』が縦横に走り、赤土の緑豊かな庭先で調理用バナナの木やマンゴーの木を育てながら暮らす。難民を含めた若年層が非常に多く街全体が活気と交通混雑に包まれている。",
                "food": "青い調理用バナナを蒸して練った主食『マトケ』に、ピーナッツソース『ジーナッツ』、ヴィクトリア湖で獲れる白身魚『ティラピア』『ナイルパーチ』の素揚げ、卵オムレツをチャパティで巻いた屋台食『ロレックス』！",
                "housing": "傾斜地に建てられた赤レンガとトタン屋根の家々と、カンパラ新興ビジネス街の高層ビル群。",
                "streetNote": "赤道線モニュメント周辺でも長袖が必要な朝晩の爽やかさと、ケニア（モンバサ）へ向かう大型物流トラック列。",
                "wikiPhotoTargets": [
                    {"title": "Kampala", "fallbackTitles": ["Murchison Falls", "Lake Victoria"], "caption": "ヴィクトリア湖北岸の緑の丘陵に広がる首都カンパラ"},
                    {"title": "Murchison Falls", "fallbackTitles": ["Bwindi Impenetrable National Park"], "caption": "ヴィクトリア湖から流れ出る白ナイルの急流（マーチソン・フォールズ）"},
                ],
            },
        },
        "topCitiesRegions": {
            "topCities": [
                {"nameJa": "カンパラ", "popMan": 175, "metroPopMan": 380, "lng": 32.58, "lat": 0.35, "isCapital": True, "note": "ヴィクトリア湖北岸7丘の首都（赤道直下なのに年平均22℃）"},
                {"nameJa": "ジンジャ", "popMan": 30, "lng": 33.20, "lat": 0.42, "isCapital": False, "note": "ナイル川（白ナイル）の正確な流出点・水力ダム発電中心"},
            ],
            "specialRegions": [
                {"name": "ヴィクトリア湖＆アルバート湖油田帯", "tag": "白ナイル源流・地溝帯石油", "lng": 31.30, "lat": 1.60, "zoom": 6.2, "description": "西部大地溝帯アルバート湖で進む原油パイプライン開発とナイル源流"},
            ],
        },
        "relations": [
            {"partnerIso3": "KEN", "partnerNameJa": "ケニア", "category": "trade", "direction": "mutual", "summary": "内陸国ウガンダの全輸入物資・コーヒー輸出の大半が通るモンバサ港回廊の要パートナー。"},
            {"partnerIso3": "SSD", "partnerNameJa": "南スーダン", "category": "migration", "direction": "incoming", "summary": "90万人規模の南スーダン難民を受け入れるとともに食品・建設材を輸出する最重要隣国。"},
            {"partnerIso3": "TZA", "partnerNameJa": "タンザニア", "category": "trade", "direction": "mutual", "summary": "アルバート湖原油パイプライン（EACOP）のタンガ港出口先であるEAC加盟隣国。"},
        ],
        "visuals": [
            {
                "id": "hv_uga_refugee",
                "placement": "population",
                "kind": "bar",
                "title": "アフリカ・周辺主要国の難民保護受入数上位（2023–2024・万人目安）",
                "bars": [
                    {"label": "ウガンダ（アフリカ1位・先進保護）", "value": 165, "isTarget": True, "color": "#10b981"},
                    {"label": "チャド（スーダン内戦流入で急増）", "value": 115, "color": "#64748b"},
                    {"label": "エチオピア", "value": 98, "color": "#94a3b8"},
                    {"label": "ケニア", "value": 72, "color": "#cbd5e1"},
                ],
                "unit": "万人",
                "maxValue": 180,
                "note": "南スーダンやコンゴ民主共和国からの難民へ耕地や居住権を認める先駆モデル",
            },
        ],
    },
    "RWA": {
        "overviewLife": {
            "quickOverview": {
                "headline": "女性議員世界1位・虐殺復興の『アフリカのシンガポール』を走る千の丘のICT小国",
                "summary": "アフリカ本土随一の超高人口密度を持ちながら、1994年大虐殺を乗り越え、レジ袋完全禁止・光ファイバー網・ドローン医療配送・清潔都市キガリを実現。女性国会議員64%世界首位と英連邦加入・英語導入も注目。",
                "keyPoints": [
                    "女性議員比率64%世界1位＋1994年虐殺からのICT立国・レジ袋完全禁止",
                    "500人/km²超の超高密度『千の丘』段々畑（スペシャルティコーヒー/茶）",
                ],
            },
            "dailyLife": {
                "summary": "毎月最終土曜日の朝に大統領から一般市民まで全員で街を掃除する伝統『ウムガンダ』とレジ袋全面禁止により、首都キガリは『アフリカで最も清潔で安全な都市』と評される。高原のため一年中過ごしやすい。",
                "food": "インゲン豆やバナナ、ヤムイモ、キャッサバの葉をじっくり煮込んだ素朴で栄養ある農村・家庭料理と、国産の香り豊かな紅茶・高品質アラビカコーヒー。",
                "housing": "丘の斜面に赤レンガ造り・瓦/トタン屋根の集落『イミドゥグドゥ（計画村落）』が整然と並び、斜面下端から頂上近くまで緑の段々畑が続く。",
                "streetNote": "プラスチック袋の持ち込み自体が空港で禁止され、市民が布バッグを持ち清潔な歩道を歩く風景。",
                "wikiPhotoTargets": [
                    {"title": "Kigali", "fallbackTitles": ["Kigali Convention Centre", "Lake Kivu"], "caption": "清潔で近代的ICT開発が進む『千の丘』の首都キガリ"},
                    {"title": "Volcanoes National Park", "fallbackTitles": ["Nyungwe Forest"], "caption": "絶滅危惧マウンテンゴリラが生息するヴィルンガ火山群の雲霧林"},
                ],
            },
        },
        "topCitiesRegions": {
            "topCities": [
                {"nameJa": "キガリ", "popMan": 150, "lng": 30.06, "lat": -1.94, "isCapital": True, "note": "標高1,500mの清潔・ICT・国際会議ハブ首都"},
                {"nameJa": "ギセニ（ルバヴ）", "popMan": 15, "lng": 29.26, "lat": -1.70, "isCapital": False, "note": "キヴ湖畔リゾート＆メタンガス発電・コンゴ民主国境都市"},
            ],
            "specialRegions": [
                {"name": "キヴ湖＆ヴィルンガ火山帯", "tag": "湖底メタン発電・ゴリラ保護観光", "lng": 29.35, "lat": -1.65, "zoom": 7.4, "description": "高付加価値マウンテンゴリラ・エコツーリズムとキヴ湖メタンエネルギー開発地"},
            ],
        },
        "relations": [
            {"partnerIso3": "KEN", "partnerNameJa": "ケニア", "category": "trade", "direction": "mutual", "summary": "EAC共通市場かつ海港モンバサを通じた外洋貿易の重要パートナー。"},
            {"partnerIso3": "GBR", "partnerNameJa": "イギリス", "category": "history", "direction": "mutual", "summary": "旧ベルギー領ながらフランスとの対立を経て2009年英連邦へ異例の加盟・開発協力関係を結ぶ。"},
            {"partnerIso3": "COD", "partnerNameJa": "コンゴ民主共和国", "category": "history", "direction": "mutual", "summary": "キヴ湖を挟んで接し東部資源・武装勢力巡る複雑な歴史・摩擦関係を持つ大隣国。"},
        ],
        "visuals": [
            {
                "id": "hv_rwa_women_density",
                "placement": "population",
                "kind": "bar",
                "title": "主要国の女性国会議員（下院）比率 世界比較（2024・%）",
                "bars": [
                    {"label": "ルワンダ（クオータ制・世界1位）", "value": 63.8, "isTarget": True, "color": "#10b981"},
                    {"label": "キューバ", "value": 55.7, "color": "#64748b"},
                    {"label": "メキシコ", "value": 50.2, "color": "#94a3b8"},
                    {"label": "スウェーデン", "value": 46.4, "color": "#cbd5e1"},
                    {"label": "日本（衆議院）", "value": 15.7, "color": "#ef4444"},
                ],
                "unit": "%",
                "maxValue": 70,
                "note": "アフリカ内戦復興過程の積極的女性登用により北欧を抑え20年以上世界首位級を維持",
            },
        ],
    },
    "ZMB": {
        "overviewLife": {
            "quickOverview": {
                "headline": "輸出7割を握る『カッパーベルト銅鉱帯』＆タンザン鉄道、内陸高原の平和国家",
                "summary": "コンゴ民主共和国境の銅ベルトから世界有数の銅を採掘する一方、内陸国ゆえタンザニアへ抜ける中国支援『タンザン鉄道』等の輸送路に依存。カリバダム水力への8割依存のため干ばつ停電や債務再編を経験した。",
                "keyPoints": [
                    "『カッパーベルト銅鉱帯』＝銅輸出約7割のモノカルチャーと対中債務問題",
                    "『タンザン鉄道（TAZARA）』とカリバダム水力依存による干ばつ電力危機",
                ],
            },
            "dailyLife": {
                "summary": "独立以来大きな内戦を知らない穏やかな国民性で、100万超の都市ルサカから銅鉱山の町ンドラ・キトウェまで、週末には家族や教会へ集う暮らし。高地気候のため5〜8月の乾季の朝晩はセーターが要るほど爽やかに冷える。",
                "food": "白いトウモロコシ粉を硬く練った主食『ンシマ』に、カリバ湖等のティラピア干物やトマトオニオン煮込み、菜っ葉（レイプ）のソテーを添える。",
                "housing": "首都・鉱山都市の煉瓦造り低層住宅や団地と、農村の円形粘土壁・草葺き家屋が並ぶ。",
                "streetNote": "銅インゴット（粗銅板）を積んだ大型トラックがタンザニア（ダルエスサラーム）や南ア港湾へ長蛇の列を作って走る。",
                "wikiPhotoTargets": [
                    {"title": "Victoria Falls", "fallbackTitles": ["Lusaka", "Kariba Dam"], "caption": "ザンベジ川の断崖を落下する世界三大瀑布ヴィクトリアの滝"},
                    {"title": "Lusaka", "fallbackTitles": ["Ndola", "Copperbelt Province"], "caption": "南半球の標高1,280m高原に開けた首都ルサカの市街"},
                ],
            },
        },
        "topCitiesRegions": {
            "topCities": [
                {"nameJa": "ルサカ", "popMan": 220, "metroPopMan": 310, "lng": 28.28, "lat": -15.42, "isCapital": True, "note": "中央高原の政治商業首都・COMESA本部所在"},
                {"nameJa": "ンドラ / キトウェ", "popMan": 65, "lng": 28.64, "lat": -12.97, "isCapital": False, "note": "北部カッパーベルト銅鉱業・製錬産業の中枢都市群"},
            ],
            "specialRegions": [
                {"name": "カッパーベルト（銅鉱帯）＆タンザン鉄道起点", "tag": "世界有数銅鉱・対海港鉄道", "lng": 28.20, "lat": -12.80, "zoom": 6.4, "description": "コンゴ民主境に連なる銅鉱山群とタンザニアへ抜けるTAZARA鉄道路軸"},
            ],
        },
        "relations": [
            {"partnerIso3": "TZA", "partnerNameJa": "タンザニア", "category": "trade", "direction": "mutual", "summary": "中国の支援で敷かれたタンザン鉄道の終着ダルエスサラーム港を抱える外洋銅輸出口。"},
            {"partnerIso3": "CHN", "partnerNameJa": "中華人民共和国", "category": "trade", "direction": "mutual", "summary": "1970年代のタンザン鉄道建設以来、銅鉱山保有・最大債権国として極めて深い関係。"},
            {"partnerIso3": "COD", "partnerNameJa": "コンゴ民主共和国", "category": "trade", "direction": "mutual", "summary": "カッパーベルト鉱床地質を共有し、コンゴ側銅・硫酸輸送を通じる相互隣接圏。"},
        ],
        "visuals": [
            {
                "id": "hv_zmb_copper_power",
                "placement": "industry",
                "kind": "donut",
                "title": "ザンビアの輸出構造＆水力偏重リスク（輸出＝銅約7割・電力＝水力約85%）",
                "slices": [
                    {"label": "銅・粗銅（輸出総額の約72%）", "value": 72, "color": "#ea580c"},
                    {"label": "金・コバルト・エメラルド等鉱物", "value": 12, "color": "#eab308"},
                    {"label": "農産・電気機械・タバコ他", "value": 16, "color": "#10b981"},
                ],
                "unit": "%",
                "note": "一次産品（銅）価格と干ばつ（水力電力減）のダブルリスクに晒される典型内陸資源国",
            },
        ],
    },
    "AGO": {
        "overviewLife": {
            "quickOverview": {
                "headline": "ポルトガル語公用・サブサハラ2位の原油とダイヤモンド、飛び地カビンダと『ロビト回廊』",
                "summary": "旧ポルトガル領から長期冷戦内戦を経て、石油担保の対中復興でアフリカ屈指の産油大国へ。沿岸を洗うベンゲラ寒流が低緯度ルアンダを乾燥化させ、資源の呪い『オランダ病』による極端物価高と格差も抱える。",
                "keyPoints": [
                    "アフリカ最大のポルトガル語圏・サブサハラ第2の原油＆世界4位ダイヤ（2024 OPEC脱退）",
                    "飛地『カビンダ』・ベンゲラ寒流によるBS沿岸乾燥・内陸銅を結ぶ『ロビト鉄道回廊』",
                ],
            },
            "dailyLife": {
                "summary": "首都ルアンダの湾岸通り（マルジナル）にはオイルマネーで建った超高層ビルが並びブラジルに似たポルトガル語とキゾンバ音楽が響くが、数km離れた郊外スラム（ムセケ）には電気・水道を欠く庶民生活が広がる極端格差社会。",
                "food": "キャッサバ粉の練り粥『フンジ』に、パーム油で煮た魚のシチュー『ムアンバ・デ・ガリーニャ』やモアンバチキン、オクラ料理（ポルトガル・ブラジルと共通点多）。",
                "housing": "超高層マンションや植民地コロニアル建築の広がる中心部と、赤土丘陵に密集するトタン・ブロックの郊外ムセケ地区。",
                "streetNote": "内戦後の地雷除去を経て農地整備が進むも、輸入食品に頼る都市の物価は世界屈指の高さ。",
                "wikiPhotoTargets": [
                    {"title": "Luanda", "fallbackTitles": ["Fortaleza de São Miguel", "Tundavala"], "caption": "大西洋岸の湾を抱く超高層石油首都ルアンダのスカイライン"},
                    {"title": "Kalandula Falls", "fallbackTitles": ["Miradouro da Lua", "Namibe"], "caption": "内陸サバナ高原の豊かな水流・カランドゥラ滝（沿岸乾燥と好対照）"},
                ],
            },
        },
        "topCitiesRegions": {
            "topCities": [
                {"nameJa": "ルアンダ", "popMan": 280, "metroPopMan": 920, "lng": 13.23, "lat": -8.84, "isCapital": True, "note": "ベンゲラ寒流で低緯度BS乾燥気候となる巨大産油港首都"},
                {"nameJa": "ロビト / ベンゲラ", "popMan": 45, "lng": 13.55, "lat": -12.36, "isCapital": False, "note": "コンゴ民主・ザンビア銅ベルトへ直結する大西洋終端鉄道路港"},
            ],
            "specialRegions": [
                {"name": "カビンダ飛び地＆ロビト鉄道回廊", "tag": "飛び地油田・米欧対中インフラ", "lng": 12.19, "lat": -5.56, "zoom": 6.8, "description": "コンゴ川河口北側に孤立した主要産油飛び地カビンダと銅輸送港ロビト"},
            ],
        },
        "relations": [
            {"partnerIso3": "CHN", "partnerNameJa": "中華人民共和国", "category": "trade", "direction": "outgoing", "summary": "輸出原油の半分前後を買い取る最大顧客であり、内戦後の『石油返済型インフラ整備（アンゴラモデル）』相手国。"},
            {"partnerIso3": "PRT", "partnerNameJa": "ポルトガル", "category": "history", "direction": "mutual", "summary": "1975年まで支配した旧宗主国（逆にアンゴラ富裕層が近年リスボン不動産や企業を買収する逆投資も発生！）。"},
            {"partnerIso3": "BRA", "partnerNameJa": "ブラジル", "category": "history", "direction": "mutual", "summary": "大西洋対岸の同じポルトガル語姉妹国として食文化・建設事業・貿易で密接。"},
        ],
        "visuals": [
            {
                "id": "hv_ago_opec_oil",
                "placement": "industry",
                "kind": "donut",
                "title": "アンゴラの輸出収入構成（典型的な化石資源モノカルチャー型）",
                "slices": [
                    {"label": "原油・LNG（2024 OPEC脱退！）", "value": 92, "color": "#334155"},
                    {"label": "ダイヤモンド", "value": 5, "color": "#06b6d4"},
                    {"label": "花崗岩・魚介・コーヒー他", "value": 3, "color": "#10b981"},
                ],
                "unit": "%",
                "note": "輸出の9割超が原油（国内食料自給が育たないオランダ病と高い物価の根因）",
            },
        ],
    },
    "LBR": {
        "overviewLife": {
            "quickOverview": {
                "headline": "便宜置籍船『世界第1位』の船籍国、米解放奴隷建国史と超多雨のゴム園を抱える西ア沿岸国",
                "summary": "アフリカでほぼ唯一欧米植民地とならず1847年に米国解放黒人らが建国した国。世界最多級の雨量を誇る沿岸と米国系ゴム園に加え、近年パナマを抜き『世界最大の登録船舶数（便宜置籍船）』を誇る海上登録王国。",
                "keyPoints": [
                    "『便宜置籍船 船籍数世界1位（パナマと1・2位・日本船も多登録）』",
                    "1847年米国解放黒人により建国（非植民地）・超多雨モンロビア（年4600mm）とゴム",
                ],
            },
            "dailyLife": {
                "summary": "熱帯の猛烈なスコールが半年続くモンロビアは世界でも突出した多雨首都で、屋根を叩く豪雨の中を色鮮やかなゴム製品や米の露店が並ぶ。内戦とエボラ危機から立ち直り、サッカー文化や福音派教会コミュニティが生活を支える。",
                "food": "米にキャッサバの葉煮込み（カッサバ・リーフ）やオクラ入り激辛スープ（ペッパー・スープ）、パーム油のヤシの実シチュー（パームバター）が国民食。",
                "housing": "多雨と湿気に耐えるトタン張り・コンクリート壁の家屋や高床式の木造・泥壁伝統住宅、米国南部の建築様式を真似た初期アメリコ系邸宅跡。",
                "streetNote": "町では通貨として米ドルとリベリア・ドルの双方が流通しており、歴史的対米関係の深さが一目でわかる。",
                "wikiPhotoTargets": [
                    {"title": "Monrovia", "fallbackTitles": ["Providence Island, Liberia", "Sapo National Park"], "caption": "年4,600mm超の豪雨と大西洋を臨む建国の港都モンロビア"},
                    {"title": "Firestone Natural Rubber Company", "fallbackTitles": ["Buchanan, Liberia"], "caption": "世界最大級を誇る天然ゴムプランテーションのゴム樹林"},
                ],
            },
        },
        "topCitiesRegions": {
            "topCities": [
                {"nameJa": "モンロビア", "popMan": 165, "lng": -10.79, "lat": 6.30, "isCapital": True, "note": "米大統領モンロー名由来の首都・自由港・世界一級多雨都市"},
                {"nameJa": "ブキャナン", "popMan": 5, "lng": -10.05, "lat": 5.88, "isCapital": False, "note": "内陸ニンバ山地の鉄鉱石積出港"},
            ],
            "specialRegions": [
                {"name": "ファイアストンゴム園＆ニンバ山鉄山", "tag": "米資本ゴム・西ア鉄鉱石帯", "lng": -10.35, "lat": 6.29, "zoom": 6.6, "description": "世界最大の単一天然ゴム農園とギニア境ニンバ山地鉄鉱床"},
            ],
        },
        "relations": [
            {"partnerIso3": "USA", "partnerNameJa": "アメリカ合衆国", "category": "history", "direction": "mutual", "summary": "米国解放奴隷が建国し米ドル流通・ファイアストン天然ゴム農園・安価船籍登録枠組みを築いた歴史的原点。"},
            {"partnerIso3": "JPN", "partnerNameJa": "日本", "category": "trade", "direction": "mutual", "summary": "日本の海運企業が税金・乗組員規制緩和を目的に大量登録する世界最大便宜置籍先の一つ。"},
            {"partnerIso3": "GIN", "partnerNameJa": "ギニア", "category": "trade", "direction": "mutual", "summary": "ニンバ鉄鉱石のブキャナン港鉄道輸送案を共有する北隣国。"},
        ],
        "visuals": [
            {
                "id": "hv_lbr_foc_fleet",
                "placement": "industry",
                "kind": "bar",
                "title": "世界の登録船籍（便宜置籍船等）上位国比較（2024・億DWT/総トン目安）",
                "bars": [
                    {"label": "リベリア（世界1位・米主導登録制度）", "value": 415, "isTarget": True, "color": "#2563eb"},
                    {"label": "パナマ（世界2位・日本船籍定番）", "value": 376, "color": "#64748b"},
                    {"label": "マーシャル諸島（世界3位・微小島嶼国）", "value": 308, "color": "#94a3b8"},
                    {"label": "日本（実保有船主トップ級だが国内籍少）", "value": 38, "color": "#ef4444"},
                ],
                "unit": "百万総トン（目安）",
                "maxValue": 450,
                "note": "船の『所有主（日・希・中）』と『登録船籍（リベリア・パナマ・マーシャル）』が完全乖離する試験必須統計！",
            },
        ],
    },
    "DOM": {
        "overviewLife": {
            "quickOverview": {
                "headline": "一つの島で『ハイチと鮮烈対比』をなすカリブ最大の観光＆医療機器輸出・野球大国",
                "summary": "イスパニョーラ島をハイチと分け合い、国境線を境に『東＝森林・観光・フリーゾーン工業成長（スペイン語）』と『西＝極貧・森林破壊（仏語系ハイチ）』の劇的対照が衛星写真でも見える。野球人材や在米送金も多い。",
                "keyPoints": [
                    "ハイチとの国境『森林/経済明暗コントラスト』＆不法移入防ぐ国境壁",
                    "カリブ最大観光客受入＆医療用精密機器フリーゾーン輸出＋有機カカオ/金/葉巻",
                ],
            },
            "dailyLife": {
                "summary": "陽気なメレンゲ・バチャータ音楽が街角から流れ、空き地で少年たちがプロ野球選手を夢見て練習する日常。首都サントドミンゴの植民地石畳市街の隣にカリブ随一の地下鉄と大型ショッピングモールが広がる。",
                "food": "『ラ・バンデーラ（国旗）』と呼ばれる白米・赤インゲン豆シチュー・肉煮込みの国民食定食、揚げ潰しバナナ『トストーネス』、熱帯果実ジュース。",
                "housing": "カリブ特有のカラフルなパステルカラー木造・コンクリート家屋とハリケーン耐性RCマンション、リゾート地のヤシ葺きヴィラ。",
                "streetNote": "サトウキビ畑や建設現場では隣国ハイチからの低賃金移民労働者が数多く働く一方、厳格な国境警備・壁建設が進む。",
                "wikiPhotoTargets": [
                    {"title": "Santo Domingo", "fallbackTitles": ["Alcázar de Colón", "Zona Colonial (Santo Domingo)"], "caption": "アメリカ大陸最古の欧州植民都市遺産を抱く首都サントドミンゴ"},
                    {"title": "Punta Cana", "fallbackTitles": ["Samaná Peninsula", "Pico Duarte"], "caption": "年間数百万人の北米欧州観光客が訪れる白砂のプンタカナ沿岸"},
                ],
            },
        },
        "topCitiesRegions": {
            "topCities": [
                {"nameJa": "サントドミンゴ", "popMan": 110, "metroPopMan": 350, "lng": -69.93, "lat": 18.49, "isCapital": True, "note": "新大陸最古植民都市・国内最大の経済＆医療機器フリーゾーン圏"},
                {"nameJa": "サンティアゴ", "popMan": 78, "lng": -70.70, "lat": 19.45, "isCapital": False, "note": "肥沃な北部シバオ谷の中心都市・葉巻タバコ・加工工業"},
            ],
            "specialRegions": [
                {"name": "プンタカナ＆ハイチ国境壁線", "tag": "カリブ観光首位・森林明暗国境", "lng": -71.70, "lat": 19.20, "zoom": 6.8, "description": "東端の世界的ビーチリゾートと西端で森林保護と国境管理が対照をなす境目"},
            ],
        },
        "relations": [
            {"partnerIso3": "USA", "partnerNameJa": "アメリカ合衆国", "category": "migration", "direction": "mutual", "summary": "総輸出の約半分（医療機器等）を吸収し、200万人規模の在米系移民・大リーガーからの送金＆観光客を送る。"},
            {"partnerIso3": "HTI", "partnerNameJa": "ハイチ", "category": "migration", "direction": "incoming", "summary": "一つの島に共存しつつも経済/人口/森林状態の差が激しく、難民流入規制と国境管理が最大焦点。"},
            {"partnerIso3": "ESP", "partnerNameJa": "スペイン", "category": "tourism", "direction": "mutual", "summary": "スペイン語歴史縁を基盤にプンタカナ等の大型リゾートホテル資本投資を主導。"},
        ],
        "visuals": [
            {
                "id": "hv_dom_haiti_contrast",
                "placement": "overview",
                "kind": "table",
                "title": "同一島（イスパニョーラ島）東西2国の衝撃的な対比データ",
                "headers": ["項目", "ドミニカ共和国（東2/3）", "ハイチ（西1/3）"],
                "rows": [
                    ["旧宗主国・公用語", "スペイン（スペイン語）", "フランス（仏語・ハイチクレオール語）"],
                    ["1人当たりGDP", "約11,000ドル（中南米優等成長）", "約1,800ドル（西半球最貧水準・約6倍差！）"],
                    ["森林被覆率と環境", "約44%（保全政策により回復維持）", "約3〜10%未満（薪炭過剰伐採で禿山・土石流）"],
                    ["主力産業・特徴", "医療機器FTZ・観光・金・カカオ", "衣類委託加工・海外送金依存・治安崩壊危機"],
                ],
            },
        ],
    },
    "NCL": {
        "overviewLife": {
            "quickOverview": {
                "headline": "世界遺産『最大級堡礁』と世界有数の『ニッケル島』、カナック独立問題を抱える仏特別領",
                "summary": "珊瑚海に浮かぶ細長い島で、マントル由来岩の風化により世界屈指のニッケル埋蔵・フェロニッケル輸出を持つ。美しいサンゴ礁観光やフランス本国補助による高所得を保ちつつ、先住民カナックと白人系の政治対立が焦点。",
                "keyPoints": [
                    "ニッケル埋蔵＆産出世界トップ級（近年インドネシア産に押され課題）",
                    "世界最大級の連続堡礁ラグーン・3度の独立住民投票（カナック vs 仏系住民）",
                ],
            },
            "dailyLife": {
                "summary": "『プチ・フランス』とも呼ばれるヌメアでは焼き立てバゲットやフレンチカフェと南太平洋メラネシアの緩やかな島時間・ヨットハーバーの生活が同居。一方地方（グランドテール北部・ロイヤルティ諸島）ではカナックの部族伝統『クチューム』とヤムイモ農耕が色濃く残る。",
                "food": "タロイモ・ヤムイモ・バナナのココナッツミルク煮をバナナの葉で蒸し焼きにするメラネシア伝統料理『ブーニャ』、青い海老（天使の海老）やフランスパン・チーズ。",
                "housing": "カナック伝統の円錐形高い屋根の木造集会所『カーズ』と、ヌメアの白人系南仏風別荘・近代マンション。",
                "streetNote": "赤土（ラテライト）の露天掘りニッケル鉱山が走る山々と、息を呑むエメラルドグリーンのサンゴ礁ラグーンが同居する。",
                "wikiPhotoTargets": [
                    {"title": "New Caledonia", "fallbackTitles": ["Nouméa", "Isle of Pines (New Caledonia)"], "caption": "世界自然遺産の巨大な連続堡礁ラグーンに囲まれたニューカレドニア"},
                    {"title": "Nouméa", "fallbackTitles": ["Tjibaou Cultural Centre"], "caption": "南太平洋の仏海外特別領首都・ヌメアと近代的海岸風景"},
                ],
            },
        },
        "topCitiesRegions": {
            "topCities": [
                {"nameJa": "ヌメア", "popMan": 10, "metroPopMan": 18, "lng": 166.46, "lat": -22.27, "isCapital": True, "note": "全人口の約6割が集中する西南岸都市・ニッケル製錬所と国際観光拠点"},
            ],
            "specialRegions": [
                {"name": "コニアムボ（北部ニッケル）＆ウベア/イルデパン", "tag": "ニッケル鉱床・世界遺産堡礁", "lng": 164.75, "lat": -21.00, "zoom": 6.6, "description": "北部の露天掘り鉱床・精錬施設と日本観光客にも知られる連続サンゴ礁島々"},
            ],
        },
        "relations": [
            {"partnerIso3": "FRA", "partnerNameJa": "フランス", "category": "history", "direction": "mutual", "summary": "フランス領（特別共同体）として年多額の財政補助・CFP通貨保証・フランス軍駐留を受ける。"},
            {"partnerIso3": "JPN", "partnerNameJa": "日本", "category": "trade", "direction": "outgoing", "summary": "ステンレス鋼原料向けニッケル鉱・フェロニッケル輸出相手かつ歴史ある『天国に一番近い島』観光送客国。"},
            {"partnerIso3": "CHN", "partnerNameJa": "中華人民共和国", "category": "trade", "direction": "outgoing", "summary": "現在のニッケル関連最大の輸出先（ただしインドネシア台頭でシェア低下競争）。"},
        ],
        "visuals": [
            {
                "id": "hv_ncl_ethnic_vote",
                "placement": "culture",
                "kind": "donut",
                "title": "ニューカレドニアの複雑な民族構成（独立投票の構図背景）",
                "slices": [
                    {"label": "カナック（メラネシア先住民＝独立支持多）", "value": 41, "color": "#10b981"},
                    {"label": "欧州系（カルドシュ・仏本土移住＝残留支持多）", "value": 24, "color": "#3b82f6"},
                    {"label": "混血・ポリネシア(ウォリス等)・アジア系", "value": 35, "color": "#f59e0b"},
                ],
                "unit": "%",
                "note": "先住民カナックが過半数を割る民族バランスのもと、選挙人資格をめぐる議論と独立投票が焦点",
            },
        ],
    },
    "GRL": {
        "overviewLife": {
            "quickOverview": {
                "headline": "厚さ3km氷床とフィヨルドに覆われた世界最大の島、水産輸出9割＆1985年『世界初EC離脱』",
                "summary": "オーストラリアに次ぐ世界最大の島で、約8割が大陸氷床（EF）。わずかな海岸ツンドラ地帯にイヌイット系カラーリットが住み、氷河水力発電とエビ・カラスガレイ輸出を営む。1985年に漁業権を守るため本国デンマークから離れて単独EC脱退した歴史が定番。",
                "keyPoints": [
                    "『大陸氷床(EF)8割＆海面上昇7mリスク』と海岸ツンドラ(ET)・暖流不凍港ヌーク",
                    "『1985年EC独自離脱（漁業権保全）』・輸出9割水産物・レアアース地政学焦点",
                ],
            },
            "dailyLife": {
                "summary": "集落と集落を繋ぐ道路が存在しないため、市民は犬ぞり・スノーモービル（冬）、小型ボート（夏）、ヘリコプターやプロペラ機で移動する！厳しい冬を彩るカラフルな赤・青・黄・緑の木造家屋が雪景色の町に並び、水力発電によるクリーン電力と高速ネットが使われている。",
                "food": "甘エビ（北極エビ）・オヒョウ（カラスガレイ）のボイルや刺身、伝統的なアザラシ肉・クジラ皮『マッタック』煮込み「スアサート」（現代はスーパーの輸入食品も普及）。",
                "housing": "永久凍土の融解や強風から守る基礎杭上に建てられた、視認性を高める原色塗装（昔は建物用途ごとに色分け＝病院黄・商店赤等）の断熱木造家屋・近代集合住宅。",
                "streetNote": "7月でも平均7℃の海岸沿いに氷山（イルリサット）が浮遊し、極夜と白夜が生活リズムを大きく決める。",
                "wikiPhotoTargets": [
                    {"title": "Nuuk", "fallbackTitles": ["Ilulissat", "Greenland"], "caption": "海岸に原色の断熱木造住宅が立ち並ぶ首都ヌークの風景"},
                    {"title": "Ilulissat Icefjord", "fallbackTitles": ["Ilulissat"], "caption": "大陸氷床から押し出された巨大氷山が浮かぶ世界遺産イルリサット"},
                ],
            },
        },
        "topCitiesRegions": {
            "topCities": [
                {"nameJa": "ヌーク", "popMan": 2, "lng": -51.72, "lat": 64.18, "isCapital": True, "note": "全人口の約3分の1が集中する西岸の行政・水産拠点首都"},
                {"nameJa": "シシミウト / イルリサット", "popMan": 1, "lng": -51.10, "lat": 69.22, "isCapital": False, "note": "北極圏の氷山世界遺産・エビ加工漁業基地都市"},
            ],
            "specialRegions": [
                {"name": "イルリサット・アイスフィヨルド＆南端レアアース帯", "tag": "氷床融解最前線・戦略鉱物", "lng": -51.10, "lat": 69.22, "zoom": 5.8, "description": "地球温暖化研究の最重要拠点である巨大氷河出口と南部クヴァネフィエル鉱床"},
            ],
        },
        "relations": [
            {"partnerIso3": "DNK", "partnerNameJa": "デンマーク", "category": "history", "direction": "mutual", "summary": "外交・防衛と年間多額の財政補助（ブロックグラント）を供与し、水産輸出の大半を受け入れる本国。"},
            {"partnerIso3": "JPN", "partnerNameJa": "日本", "category": "trade", "direction": "outgoing", "summary": "回転寿司・スーパー等で馴染みの深い『北極エビ（甘エビ）』『カラスガレイ（エンガワ等）』重要輸出先！"},
            {"partnerIso3": "USA", "partnerNameJa": "アメリカ合衆国", "category": "history", "direction": "mutual", "summary": "北部のピトゥフィク（チューレ）宇宙軍基地を置き北極圏安全保障・レアアースに強く注目。"},
        ],
        "visuals": [
            {
                "id": "hv_grl_fish_export",
                "placement": "industry",
                "kind": "donut",
                "title": "グリーンランドの輸出品目構造（極端な冷寒水産モノカルチャー）",
                "slices": [
                    {"label": "北極エビ（甘エビ）・カニ・オヒョウ等魚介", "value": 92, "color": "#0284c7"},
                    {"label": "アザラシ皮・鉱物・調査機器再輸出等", "value": 8, "color": "#94a3b8"},
                ],
                "unit": "%",
                "note": "輸出の9割超が漁業依存！だからこそ共通漁業政策を避けるため1985年にECを離脱した",
            },
        ],
    },
}
