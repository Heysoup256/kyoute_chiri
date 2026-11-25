"""昇格30カ国の概観・生活・写真ターゲット・主要都市・関連国・ビジュアル（パート1：17カ国）。"""

from __future__ import annotations

EXTRA_30_META_PART1 = {
    "EST": {
        "overviewLife": {
            "quickOverview": {
                "headline": "電子国家『e-Estonia』を築いた、ウラル語族（フィン・ウゴル系）のバルト三国北端",
                "summary": "バルト三国で唯一フィンランドと同系のウラル語族を話し、99%の行政手続きをオンライン化したIT最先端小国。冷帯の平坦な森・湿原にタリン歴史市街とデジタル産業が共存する。",
                "keyPoints": [
                    "バルト三国唯一のウラル語族（フィンランド親近）・プロテスタント/無宗教圏",
                    "電子政府『e-Estonia』・Skype等IT輩出・EU＆ユーロ早期加盟",
                ],
            },
            "dailyLife": {
                "summary": "税金申告や医療処方箋、学校連絡までスマホと電子IDカードで完結する超効率デジタル生活の一方、週末はバルト三国共通の深い森でのベリー・キノコ採りやサウナ（サウン）を楽しむ自然派の暮らしが根付く。",
                "food": "酸味のある黒ライ麦パン（レイブ）にバルト海のニシン・スプラットの酢漬け、豚肉と大麦の煮込みや乳製品（コフケ＝チーズスイーツ）が日常食。",
                "housing": "タリン旧市街のハンザ同盟期の尖塔・赤瓦石造建築や木造タウンハウスと、郊外のソ連期集合住宅・北欧風近代木造住宅が並ぶ。",
                "streetNote": "中世の城壁が囲む旧市街に無料Wi-Fiと配膳・宅配ロボットが走る新旧融合の景観が特徴。",
                "wikiPhotoTargets": [
                    {"title": "Tallinn", "fallbackTitles": ["Toompea", "Estonia"], "caption": "ハンザ同盟の面影と近代IT都市が融合する首都タリン"},
                    {"title": "Lahemaa National Park", "fallbackTitles": ["Tartu", "Pärnu"], "caption": "氷河期の泥炭湿原と針葉樹林が広がるエストニアの自然"},
                ],
            },
        },
        "topCitiesRegions": {
            "topCities": [
                {"nameJa": "タリン", "popMan": 45, "metroPopMan": 62, "lng": 24.75, "lat": 59.44, "isCapital": True, "note": "人口の約3分の1が集まる首都・バルト海港湾・e-Estonia中枢"},
                {"nameJa": "タルトゥ", "popMan": 10, "lng": 26.73, "lat": 58.38, "isCapital": False, "note": "17世紀創設のタルトゥ大学を抱える国内第2の学術・IT都市"},
            ],
            "specialRegions": [
                {"name": "タリン〜バルト海沿岸", "tag": "電子国家・ハンザ港湾", "lng": 24.75, "lat": 59.44, "zoom": 6.4, "description": "フィンランド・ヘルシンキとフェリー2時間で結ばれIT・金融・観光が集中する首都圏"},
            ],
        },
        "relations": [
            {"partnerIso3": "FIN", "partnerNameJa": "フィンランド", "category": "trade", "direction": "mutual", "summary": "フィンランド湾を挟んで同じウラル語族（言語近似）を共有し、電力網・資本・観光・通勤で最も密接な経済関係。"},
            {"partnerIso3": "LVA", "partnerNameJa": "ラトビア", "category": "trade", "direction": "mutual", "summary": "バルト三国として電力・輸送網『レイル・バルティカ』を共有する最重要EU隣国。"},
            {"partnerIso3": "SWE", "partnerNameJa": "スウェーデン", "category": "trade", "direction": "incoming", "summary": "銀行・通信・木材加工分野で主要北欧投資元・輸出パートナー。"},
        ],
        "visuals": [
            {
                "id": "hv_est_baltic_compare",
                "placement": "culture",
                "kind": "table",
                "title": "バルト三国（EST・LVA・LTU）の必須識別比較表",
                "headers": ["国名", "語族・系統（最頻出！）", "伝統多数派宗教", "特徴・強み"],
                "rows": [
                    ["エストニア", "ウラル語族（フィン・ウゴル系）", "無宗教/プロテスタント（ルーテル）", "電子政府『e-Estonia』・北欧密接"],
                    ["ラトビア", "印欧語族（バルト語派）", "プロテスタント（ルーテル中心）", "最大都市リガ（歴史港湾）・水力・ロシア系24%"],
                    ["リトアニア", "印欧語族（バルト語派）", "カトリック（約74%＝ポーランド影響）", "レーザー産業・風力＆LNG脱露・ロシア系約5%"],
                ],
            },
        ],
    },
    "LVA": {
        "overviewLife": {
            "quickOverview": {
                "headline": "ハンザの商都『リガ』とダウガヴァ水力・木材輸出が支えるバルト三国の中央国",
                "summary": "バルト三国の中央に位置し、ダウガヴァ川河口の歴史港湾都市リガに総人口の約3割強が集まる。バルト語派とルーテル系文化を保ちつつ、ロシア系住民との統合や脱ロシア・EU物流網整備を進める。",
                "keyPoints": [
                    "バルト語派（リトアニアと同系）× プロテスタント文化・ロシア系約24%",
                    "バルト三国最大都市リガ（アールヌーヴォー建築群）と木材・小麦・水力",
                ],
            },
            "dailyLife": {
                "summary": "欧州随一のアールヌーヴォー建築群が残るリガでは、広大な中央市場や合唱祭の伝統が市民生活を彩り、夏季の短い白夜期にはバルト海砂浜のリゾートで過ごすのが楽しみとなっている。",
                "food": "黒ライ麦パン、ニシンやサワークリーム・ディルを効かせた冷たいビーツスープ、豆とベーコンの伝統料理（ペレーキエ・ジルニ）が定番。",
                "housing": "リガ旧市街・新市街の歴史的石造集合住宅や木造住宅、ダウガヴァ川沿いの郊外住宅地が混在する。",
                "streetNote": "ダウガヴァ川の広い河口に沿って貨物港と橋が架かり、ドイツ・スウェーデン・バルト他国を結ぶ鉄道道路が交差する。",
                "wikiPhotoTargets": [
                    {"title": "Riga", "fallbackTitles": ["Vecrīga", "House of the Blackheads, Riga"], "caption": "ダウガヴァ川河口に開けたハンザ都市・首都リガ"},
                    {"title": "Gauja National Park", "fallbackTitles": ["Sigulda", "Jūrmala"], "caption": "緩やかな森と川の風景が広がるラトビアの自然公園"},
                ],
            },
        },
        "topCitiesRegions": {
            "topCities": [
                {"nameJa": "リガ", "popMan": 61, "metroPopMan": 92, "lng": 24.11, "lat": 56.95, "isCapital": True, "note": "バルト三国最大の歴史港湾都市・アールヌーヴォー世界遺産"},
                {"nameJa": "ダウガフピルス", "popMan": 8, "lng": 26.54, "lat": 55.87, "isCapital": False, "note": "南東部のロシア・ベラルーシ近接鉄道要衝"},
            ],
            "specialRegions": [
                {"name": "リガ湾岸・ダウガヴァ川水系", "tag": "バルト海物流・水力ダム", "lng": 24.11, "lat": 56.95, "zoom": 6.4, "description": "不凍港リガ・ヴェンツピルスと複数の水力発電ダムが連なる経済大動脈"},
            ],
        },
        "relations": [
            {"partnerIso3": "LTU", "partnerNameJa": "リトアニア", "category": "trade", "direction": "mutual", "summary": "同じバルト語派・EUユーロ加盟国としてバルト貿易圏最大のパートナー。"},
            {"partnerIso3": "EST", "partnerNameJa": "エストニア", "category": "trade", "direction": "mutual", "summary": "北部隣国として自由移動・エネルギー・レイルバルティカ計画を共有。"},
            {"partnerIso3": "DEU", "partnerNameJa": "ドイツ", "category": "trade", "direction": "mutual", "summary": "歴史的ハンザ同盟時代以来の木製品・機械貿易および主要EU投資国。"},
        ],
        "visuals": [
            {
                "id": "hv_lva_power_mix",
                "placement": "industry",
                "kind": "donut",
                "title": "ラトビアの発電電力量構成（水力・バイオマス主体・脱露達成）",
                "slices": [
                    {"label": "水力（ダウガヴァ川ダム群）", "value": 52, "color": "#0284c7"},
                    {"label": "天然ガス等", "value": 28, "color": "#f59e0b"},
                    {"label": "バイオマス・風力等再エネ", "value": 20, "color": "#22c55e"},
                ],
                "unit": "%",
                "note": "ダウガヴァ川の豊富な水量によりバルト三国中最も水力発電比率が高い",
            },
        ],
    },
    "LTU": {
        "overviewLife": {
            "quickOverview": {
                "headline": "カトリック多数派のバルト大国、科学レーザー・風力脱露・クルシュー砂州の海運拠点",
                "summary": "バルト三国で最も人口が多く、歴史的ポーランド連合の影響でカトリックが約7割超を占める。クライペダ港LNGと急速な風力導入でエネルギー自立を達成し、世界有数の科学レーザー・フィンテック拠点へ成長。",
                "keyPoints": [
                    "バルト三国唯一のカトリック多数派（約74%）＆ロシア系人口最小（約5%）",
                    "クルシュー砂州の砂嘴・ラグーンと飛び地カリーニングラード隣接・風力4割超",
                ],
            },
            "dailyLife": {
                "summary": "バロック様式の教会が林立するビリニュス旧市街でカフェや学術交流が活発で、バスケットボールが熱狂的な国民的スポーツとして親しまれている。",
                "food": "すりおろしジャガイモで挽き肉を包む国民食『ツェペリナイ（飛行船）』や、鮮やかなピンク色の冷製ビーツスープ（シャルティバルシュチャイ）、燻製チーズが名物。",
                "housing": "歴史都市中心部のレンガ造バロック〜ネオクラシック建築と、郊外のソ連期パネル団地・木造ヴィラが並ぶ。",
                "streetNote": "国境付近でロシア飛地カリーニングラード州やベラルーシへの検問が厳格化する一方、EU域内ポーランド側とはシームレスに行き来できる。",
                "wikiPhotoTargets": [
                    {"title": "Vilnius", "fallbackTitles": ["Gediminas' Tower", "Trakai Island Castle"], "caption": "バロック建築と中世城塞が残る首都ビリニュスの全景"},
                    {"title": "Curonian Spit", "fallbackTitles": ["Klaipėda", "Hill of Crosses"], "caption": "バルト海に延びる細長い砂嘴・クルシュー砂州の自然"},
                ],
            },
        },
        "topCitiesRegions": {
            "topCities": [
                {"nameJa": "ビリニュス", "popMan": 59, "metroPopMan": 72, "lng": 25.28, "lat": 54.69, "isCapital": True, "note": "バロック旧市街の世界遺産首都・レーザー・フィンテック集積"},
                {"nameJa": "カウナス", "popMan": 30, "lng": 23.90, "lat": 54.90, "isCapital": False, "note": "ネマン川沿いの戦間期首都（杉原千畝『命のビザ』記念地）"},
            ],
            "specialRegions": [
                {"name": "クルシュー砂州＆クライペダ港", "tag": "砂嘴・潟（ラグーン）・脱露LNG拠点", "lng": 21.12, "lat": 55.60, "zoom": 6.6, "description": "沿岸流砂嘴に守られた唯一の不凍港クライペダ（LNGターミナル立地）"},
            ],
        },
        "relations": [
            {"partnerIso3": "POL", "partnerNameJa": "ポーランド", "category": "history", "direction": "mutual", "summary": "歴史的ポーランド＝リトアニア共和国以来の共通カトリック基盤と、スヴァウキ回廊で結ばれるEU防衛・交通の生命線。"},
            {"partnerIso3": "DEU", "partnerNameJa": "ドイツ", "category": "trade", "direction": "mutual", "summary": "最大貿易パートナーの一つで精密機械・レーザー部品・EU防備提携相手。"},
            {"partnerIso3": "RUS", "partnerNameJa": "ロシア", "category": "history", "direction": "mutual", "summary": "西側飛び地カリーニングラード州を挟んで接するが、ウクライナ侵攻以降は資源・電力取引を遮断。"},
        ],
        "visuals": [
            {
                "id": "hv_ltu_wind_shift",
                "placement": "industry",
                "kind": "bar",
                "title": "バルト三国の1人あたりGDP（成長・購買力平価・名目比較 USD）",
                "bars": [
                    {"label": "エストニア", "value": 34418, "color": "#64748b"},
                    {"label": "リトアニア", "value": 32959, "isTarget": True, "color": "#2563eb"},
                    {"label": "ラトビア", "value": 26312, "color": "#94a3b8"},
                    {"label": "ベラルーシ（非EU比較）", "value": 10279, "color": "#cbd5e1"},
                ],
                "unit": "USD",
                "maxValue": 38000,
                "note": "EU・ユーロ加盟のバルト三国は同じ旧ソ連圏の非EU隣国ベラルーシの約3倍もの所得水準を実現！",
            },
        ],
    },
    "BLR": {
        "overviewLife": {
            "quickOverview": {
                "headline": "世界有数のカリ塩肥料・重機械輸出と露連合・チェルノブイリ記憶を抱える東欧内陸国",
                "summary": "広大な平坦森林・湿原を抱える旧ソ連構成国。独立後も国営重工業・集団農場をほぼ残しつつ『カリ肥料』『大型トラクター/ダンプ』で知られ、経済・言語面でロシアと極めて深く結びつく。",
                "keyPoints": [
                    "ソリゴルスクの世界上位『カリ塩（化学肥料）』と重機械（トラクター等）工業",
                    "ロシア語が事実上主流・ユーラシア経済連合(EAEU)中核・チェルノブイリ影響",
                ],
            },
            "dailyLife": {
                "summary": "ソ連時代に徹底整備された広大な通りと清潔な公園が印象的な首都ミンスクでは、国営企業勤務者やIT技術者が地下鉄網を利用して整然と通勤し、週末は別荘兼菜園（ダーチャ）でジャガイモや野菜を育てる暮らしが一般的。",
                "food": "国民1人当たり消費量世界トップ級の『ジャガイモ』を使ったすりおろしパンケーキ「ドラニキ」とサワークリーム、冷製スープ「ホロドニク」が国民食。",
                "housing": "大戦後の再建で築かれた壮大なソ連古典主義様式の中心部と、郊外の広大なコンクリート団地群、木造ダーチャで構成される。",
                "streetNote": "街角の看板や会話のほとんどがロシア語で表記・使用され、周辺中東欧とは異なる旧ソ連的な公共景観が色濃く残る。",
                "wikiPhotoTargets": [
                    {"title": "Minsk", "fallbackTitles": ["Independence Square, Minsk", "Mir Castle Complex"], "caption": "整然とした広場と大通りが広がる首都ミンスク"},
                    {"title": "Belovezhskaya Pushcha National Park", "fallbackTitles": ["Nesvizh Castle"], "caption": "ヨーロッパバイソンが生息する手つかずの混合林ビャウォヴィエジャ"},
                ],
            },
        },
        "topCitiesRegions": {
            "topCities": [
                {"nameJa": "ミンスク", "popMan": 200, "metroPopMan": 210, "lng": 27.56, "lat": 53.90, "isCapital": True, "note": "人口の2割超が集中する首都・トラクター/重機械・IT公園都市"},
                {"nameJa": "ホメリ（ゴメリ）", "popMan": 50, "lng": 31.00, "lat": 52.44, "isCapital": False, "note": "南東部第2都市・チェルノブイリ事故影響を受けたウクライナ国境近郊"},
            ],
            "specialRegions": [
                {"name": "ソリゴルスク〜プリピャチ湿原", "tag": "カリ塩鉱床・原発被害帯", "lng": 27.54, "lat": 52.79, "zoom": 6.4, "description": "世界有数のカリウム肥料産地ソリゴルスクと南部の大湿地・放射能立入制限域"},
            ],
        },
        "relations": [
            {"partnerIso3": "RUS", "partnerNameJa": "ロシア", "category": "trade", "direction": "mutual", "summary": "軍事・経済同盟の中軸であり、割安な原油・天然ガスの供給元兼ベラルーシ機械・乳製品の最大輸出市場。"},
            {"partnerIso3": "CHN", "partnerNameJa": "中華人民共和国", "category": "trade", "direction": "mutual", "summary": "一帯一路工業団地『グレートストーン』整備やカリ肥料の重要な対外取引パートナー。"},
            {"partnerIso3": "UKR", "partnerNameJa": "ウクライナ", "category": "history", "direction": "mutual", "summary": "南国境を接しプリピャチ流域とチェルノブイリの悲劇を共有する隣国だが2022年以降関係緊張。"},
        ],
        "visuals": [
            {
                "id": "hv_blr_potash_export",
                "placement": "industry",
                "kind": "bar",
                "title": "世界のカリ塩（カリウム肥料）生産上位国比較（万t・K₂O換算目安）",
                "bars": [
                    {"label": "カナダ", "value": 1350, "color": "#64748b"},
                    {"label": "ロシア", "value": 650, "color": "#94a3b8"},
                    {"label": "中国", "value": 600, "color": "#cbd5e1"},
                    {"label": "ベラルーシ", "value": 420, "isTarget": True, "color": "#2563eb"},
                ],
                "unit": "万t",
                "maxValue": 1500,
                "note": "制裁前は世界シェア約2割を占めた最重要農業肥料の供給源",
            },
        ],
    },
    "BGR": {
        "overviewLife": {
            "quickOverview": {
                "headline": "EU唯一のキリル文字圏、バラの谷・ヨーグルトと急速な人口減少が進むバルカン国家",
                "summary": "ドナウ川と黒海に面し、キリル文字を生み出したスラブ正教文化にトルコ系少数住民が混在。世界最大のローズオイル産地と低コストICT/自動車部品工場を持つ一方、少子化と西欧流出による人口減が顕著。",
                "keyPoints": [
                    "キリル文字発祥・EU加盟国で唯一キリル文字を使用＆正教中心",
                    "世界1位のバラ香料（バラの谷）＋深刻な『若年EU流出型人口減少』",
                ],
            },
            "dailyLife": {
                "summary": "バルカン山脈の温泉や黒海ビーチ、週末のローズ祭りや市場の乳製品・チーズ売場など素朴な暮らしが残る一方、ソフィアではIT産業に勤める若者と西欧へ出稼ぎに行く家族の仕送り送金が生活を支える。",
                "food": "世界的に有名な乳酸菌『ブルガリアヨーグルト』を使った冷製キュウリスープ「タラトール」、羊チーズ（シレネ）のパイ「バニッツァ」、ショップスカサラダ。",
                "housing": "ソフィアにはオスマン・中欧風建築と社会主義期の集合住宅、地方では石と木を使った切妻瓦屋根の伝統民家が点在する。",
                "streetNote": "街角の看板がキリル文字（ЗДРАВЕЙ等）で書かれているのが他のカトリック系中東欧諸国との視覚的な最大の違い。",
                "wikiPhotoTargets": [
                    {"title": "Sofia", "fallbackTitles": ["Alexander Nevsky Cathedral, Sofia", "Rila Monastery"], "caption": "ヴィトシャ山を背に広がる首都ソフィアと正教大聖堂"},
                    {"title": "Rose Valley, Bulgaria", "fallbackTitles": ["Plovdiv", "Nessebar"], "caption": "バルカン山脈南麓の微気候帯に広がるバラの谷の景観"},
                ],
            },
        },
        "topCitiesRegions": {
            "topCities": [
                {"nameJa": "ソフィア", "popMan": 128, "metroPopMan": 155, "lng": 23.32, "lat": 42.70, "isCapital": True, "note": "西部盆地の政治経済首都・IT＆電子部品集積"},
                {"nameJa": "プロヴディフ", "popMan": 35, "lng": 24.75, "lat": 42.14, "isCapital": False, "note": "トラキア平原中心の古代都市・工業自動車部品拠点"},
            ],
            "specialRegions": [
                {"name": "カザンラク『バラの谷』＆トラキア平原", "tag": "微気候特産ローズ・穀倉", "lng": 25.40, "lat": 42.62, "zoom": 7.0, "description": "バルカン山脈が冷風を遮ることで世界の高級香水原料ローズオイルを独占生産"},
            ],
        },
        "relations": [
            {"partnerIso3": "DEU", "partnerNameJa": "ドイツ", "category": "trade", "direction": "mutual", "summary": "最大の輸出先・投資元であり、自動車用電装・機械部品の委託生産およびブルガリア人移住労働者の主要先。"},
            {"partnerIso3": "TUR", "partnerNameJa": "トルコ", "category": "history", "direction": "mutual", "summary": "500年のオスマン支配歴史（約8.4%トルコ系住民の存在）と陸路ボスポラス〜欧州物流の大関門。"},
            {"partnerIso3": "ROU", "partnerNameJa": "ルーマニア", "category": "trade", "direction": "mutual", "summary": "ドナウ川国境を挟み2007年同時EU加盟、ともに2024〜25年シェンゲン完全統合を果たした黒海隣国。"},
        ],
        "visuals": [
            {
                "id": "hv_bgr_pop_shrink",
                "placement": "population",
                "kind": "line",
                "title": "ブルガリアの急激な総人口減少推移（万人・1989→2024年）",
                "series": [
                    {"label": "1989年（東欧革命時）", "value": 899},
                    {"label": "2000年", "value": 817},
                    {"label": "2007年（EU加盟）", "value": 755},
                    {"label": "2015年", "value": 718},
                    {"label": "2024年（約3割減！）", "value": 643},
                ],
                "unit": "万人",
                "note": "低出生率＋EU加盟に伴う労働移動自由化による西欧流出が重なった極端な人口減少例",
            },
        ],
    },
    "SVN": {
        "overviewLife": {
            "quickOverview": {
                "headline": "『カルスト地形』発祥地にして旧ユーゴ諸国最速のユーロ加盟・低格差優等生",
                "summary": "アルプス南端の豊かな森と湖、そして地理用語の起源となった『クラス地方』の鍾乳洞・カルスト台地を擁する。旧ユーゴ諸国で最初（2007年）にユーロを導入し、医薬・自動車の先端製造業と世界最小級の貧富格差を達成。",
                "keyPoints": [
                    "用語『カルスト地形（ポストイナ鍾乳洞・クラス台地）』発祥地＆森とブレッド湖",
                    "旧ユーゴ最速EU/ユーロ加盟・カトリック/ラテン文字・世界最小水準ジニ係数",
                ],
            },
            "dailyLife": {
                "summary": "中欧ハプスブルク文化の影響色濃い落ち着いた生活リズムで、週末はアルプス山岳ハイキングやブレッド湖でのサイクリング、アドリア海コペルへの小旅行を楽しみ、国土の6割近い森林と共存している。",
                "food": "アルプス〜中欧とバルカン・地中海が交差し、蕎麦粉お粥『ジュガンツィ』、ソーセージ（クランjska）、層状パイ『ギバニツァ』やブレッド名物クリームケーキが愛される。",
                "housing": "アルプス風急勾配屋根の清潔な木造・漆喰住宅や、リュブリャナのウィーン風バロック〜分離派建築が特徴。",
                "streetNote": "わずか47kmのアドリア海沿いに中欧内陸各国の貨物船が集うコペル港が稼働し、内陸と海を結ぶ。",
                "wikiPhotoTargets": [
                    {"title": "Lake Bled", "fallbackTitles": ["Ljubljana", "Postojna Cave"], "caption": "ユリアン・アルプスに抱かれた氷河湖・ブレッド湖"},
                    {"title": "Ljubljana", "fallbackTitles": ["Škocjan Caves", "Piran"], "caption": "リュブリャニツァ川と中欧の趣が漂う首都リュブリャナ"},
                ],
            },
        },
        "topCitiesRegions": {
            "topCities": [
                {"nameJa": "リュブリャナ", "popMan": 29, "metroPopMan": 54, "lng": 14.51, "lat": 46.06, "isCapital": True, "note": "政治文化中枢・欧州グリーン首都受賞経験"},
                {"nameJa": "マリボル", "popMan": 11, "lng": 15.65, "lat": 46.55, "isCapital": False, "note": "北東部の伝統的産業都市・ドラヴァ川水力"},
            ],
            "specialRegions": [
                {"name": "クラス地方＆ポストイナ鍾乳洞", "tag": "カルスト地形発祥地", "lng": 14.21, "lat": 45.78, "zoom": 7.4, "description": "石灰岩の溶食が作るドリーネ・鍾乳洞・消える河川の教科書的標準地域"},
            ],
        },
        "relations": [
            {"partnerIso3": "DEU", "partnerNameJa": "ドイツ", "category": "trade", "direction": "mutual", "summary": "自動車部品・工作機械・医薬品の最大貿易相手国で製造サプライチェーンで一体化。"},
            {"partnerIso3": "ITA", "partnerNameJa": "イタリア", "category": "trade", "direction": "mutual", "summary": "カルスト台地やアドリア海コペル〜トリエステ港圏を共有し貿易・歴史的に緊密。"},
            {"partnerIso3": "HRV", "partnerNameJa": "クロアチア", "category": "trade", "direction": "mutual", "summary": "旧ユーゴから共に離脱し現在クルシュコ原発の共同所有・EU/ユーロ/シェンゲン完全一体関係。"},
        ],
        "visuals": [
            {
                "id": "hv_svn_gini_gdp",
                "placement": "overview",
                "kind": "bar",
                "title": "旧ユーゴ諸国の1人あたりGDPの劇的な格差対比（2025目安 USD）",
                "bars": [
                    {"label": "スロベニア（2007ユーロ・優等生）", "value": 37376, "isTarget": True, "color": "#10b981"},
                    {"label": "クロアチア（2023ユーロ）", "value": 27104, "color": "#3b82f6"},
                    {"label": "セルビア（EU未加盟）", "value": 15262, "color": "#94a3b8"},
                    {"label": "ボスニア・ヘルツェゴビナ", "value": 10382, "color": "#cbd5e1"},
                ],
                "unit": "USD",
                "maxValue": 40000,
                "note": "北西の旧ハプスブルク工業帯（スロベニア）と内戦経験南部（ボスニア等）で3〜4倍近い所得差！",
            },
        ],
    },
    "BIH": {
        "overviewLife": {
            "quickOverview": {
                "headline": "イスラム・正教・カトリックの3民族が混住モザイクをなす、歴史的十字路サラエボの国",
                "summary": "ディナル・アルプス山脈の山あいに『ボシュニャク人（イスラム）』『セルビア人（正教）』『クロアチア人（カトリック）』が同居する欧州内多宗教国家。1990年代の内戦をデイトン合意の複雑連邦で収めつつ復興中。",
                "keyPoints": [
                    "欧州稀有のイスラム教過半＋正教＋カトリック『3民族モザイク国家』",
                    "デイトン合意による複雑な2自治体・3人大統領制と僅か20kmの海（ネウム）",
                ],
            },
            "dailyLife": {
                "summary": "サラエボ旧市街『バシュチャルシヤ』にはオスマン時代のモスクとオーストリア・ハンガリー時代の教会・シナゴーグが徒歩数分圏に並び立ち、銅細工の路地で濃いボスニアコーヒーを囲むゆったりした喫茶文化『チェイフ』が日常。",
                "food": "挽き肉網焼きの「チェヴァピ」、渦巻きパイ生地に肉を詰めた本場「ブレク」、詰め物野菜「ドルマ」、濃厚なバクラヴァ等のオスマン〜バルカン融合料理。",
                "housing": "山の急斜面に白い漆喰と急勾配瓦屋根のオスマン様式民家が段状に建ち並び、一部建物には内戦の弾痕や墓標の記憶も残る。",
                "streetNote": "モスタルの石灰岩アーチ橋（スタリ・モスト）は紛争で破壊後に再建され民族和解のシンボルとなっている。",
                "wikiPhotoTargets": [
                    {"title": "Sarajevo", "fallbackTitles": ["Baščaršija", "Mostar"], "caption": "山に囲まれた谷間に教会とモスクが並ぶ首都サラエボ"},
                    {"title": "Stari Most", "fallbackTitles": ["Mostar", "Kravica Waterfall"], "caption": "ネレトヴァ川の渓谷に架かるモスタルの石橋スタリ・モスト"},
                ],
            },
        },
        "topCitiesRegions": {
            "topCities": [
                {"nameJa": "サラエボ", "popMan": 28, "metroPopMan": 42, "lng": 18.41, "lat": 43.86, "isCapital": True, "note": "東西文明交差の首都（1914年第一次大戦勃発の地・1984五輪）"},
                {"nameJa": "バニャ・ルカ", "popMan": 19, "lng": 17.19, "lat": 44.77, "isCapital": False, "note": "北部スルプスカ共和国（セルビア系主体構成体）の事実上中枢"},
            ],
            "specialRegions": [
                {"name": "モスタル＆ネウム回廊", "tag": "世界遺産橋・唯一20kmの海出口", "lng": 17.81, "lat": 43.34, "zoom": 7.0, "description": "ヘルツェゴビナ中心都市モスタルとアドリア海へ辛うじて達するネウム"},
            ],
        },
        "relations": [
            {"partnerIso3": "HRV", "partnerNameJa": "クロアチア", "category": "trade", "direction": "mutual", "summary": "長い国境を共有しアドリア海プロチェ港を利用する最大級の貿易隣国（ネウムとペリェシャツ橋で関係深い）。"},
            {"partnerIso3": "DEU", "partnerNameJa": "ドイツ", "category": "migration", "direction": "outgoing", "summary": "内戦時からの難民定住と現在の最大級の貿易＆若年労働者移住・送金元。"},
            {"partnerIso3": "TUR", "partnerNameJa": "トルコ", "category": "history", "direction": "mutual", "summary": "オスマン帝国の歴史遺産で結びつき、モスタル復興やインフラ投資・文化交流を展開。"},
        ],
        "visuals": [
            {
                "id": "hv_bih_mosaic",
                "placement": "culture",
                "kind": "donut",
                "title": "ボスニア・ヘルツェゴビナの宗教・民族3極構成",
                "slices": [
                    {"label": "ボシュニャク人（イスラム教）", "value": 50.7, "color": "#10b981"},
                    {"label": "セルビア人（正教）", "value": 30.8, "color": "#3b82f6"},
                    {"label": "クロアチア人（カトリック）", "value": 15.4, "color": "#f59e0b"},
                    {"label": "その他", "value": 3.1, "color": "#94a3b8"},
                ],
                "unit": "%",
                "note": "同系言語を話しながら宗教で分かれた3民族がモザイク状に混住し、2構成体連邦制で均衡",
            },
        ],
    },
    "LUX": {
        "overviewLife": {
            "quickOverview": {
                "headline": "鉄鋼立国から世界最高の1人当たりGDP・国際金融・公共交通無料国へ大転換した欧州核",
                "summary": "ベネルクスの一員・EU創設原加盟国であり『シェンゲン協定』生誕の地。かつてのロレーヌ鉄鉱床製鉄から投資信託・宇宙通信・EU司法裁判所へ産業高度化し、人口の約半分が外国人＋周辺3国から毎日20万人が越境通勤する。",
                "keyPoints": [
                    "1人当たりGDP世界最高クラス（約14万ドル）＆ベネルクス/シェンゲン発祥地",
                    "外国人比率約47%・毎日周辺3国からの越境通勤＋『世界初の公共交通完全無料化』",
                ],
            },
            "dailyLife": {
                "summary": "ペトリュス川の深い渓谷が旧市街と近代EU金融街キルヒベルクを分かつ緑豊かな街で、市民も越境通勤者も切符なし無料でトラム・バス・列車を自由に乗り継ぐ。学校や職場では3言語が飛び交う国際都市生活。",
                "food": "川魚ザリガニやマスのリースリング酒煮込み、豚の燻製とそら豆『ユッド・マット・ガールドボウネン』、モーゼル川産の白ワインとパティスリー文化。",
                "housing": "世界遺産の要塞崖沿い歴史地区と、地価高騰ゆえに郊外や仏・白・独国境の町から通勤する国際ベッドタウン層が特徴。",
                "streetNote": "欧州司法裁判所などEU重要機関と世界的運用会社のガラス張りオフィスが渓谷上の台地に建ち並ぶ。",
                "wikiPhotoTargets": [
                    {"title": "Luxembourg City", "fallbackTitles": ["Adolphe Bridge", "Vianden Castle"], "caption": "渓谷の上下に旧市街の要塞と近代金融街が広がる首都ルクセンブルク"},
                    {"title": "Schengen, Luxembourg", "fallbackTitles": ["Moselle"], "caption": "独仏白の国境が接しシェンゲン協定が調印されたモーゼル川沿い"},
                ],
            },
        },
        "topCitiesRegions": {
            "topCities": [
                {"nameJa": "ルクセンブルク市", "popMan": 13, "metroPopMan": 25, "lng": 6.13, "lat": 49.61, "isCapital": True, "note": "国際金融投資・EU裁判所・SES衛星本社が集中する首都"},
                {"nameJa": "エシュ＝シュル＝アルゼット", "popMan": 4, "lng": 5.98, "lat": 49.50, "isCapital": False, "note": "仏国境の旧鉄鋼都市→ベルヴァル大学先端研究都市へ再生"},
            ],
            "specialRegions": [
                {"name": "シェンゲン（三国境界）", "tag": "EU自由移動協定の聖地", "lng": 6.37, "lat": 49.47, "zoom": 8.0, "description": "独・仏・ルクセンブルク国境がモーゼル川上で交わる歴史的条約調印地"},
            ],
        },
        "relations": [
            {"partnerIso3": "DEU", "partnerNameJa": "ドイツ", "category": "trade", "direction": "mutual", "summary": "最大の貿易相手であり毎日約5万人超がドイツ側から通勤する密接経済関係。"},
            {"partnerIso3": "FRA", "partnerNameJa": "フランス", "category": "migration", "direction": "incoming", "summary": "最大約12万人の仏人越境通勤者を受け入れ、ビジネス公用語としてもフランス語が主流。"},
            {"partnerIso3": "BEL", "partnerNameJa": "ベルギー", "category": "history", "direction": "mutual", "summary": "1921年のベルギー・ルクセンブルク経済同盟からベネルクス・EU創設まで一体で歩んだ最古パートナー。"},
        ],
        "visuals": [
            {
                "id": "hv_lux_gdp_trade",
                "placement": "overview",
                "kind": "bar",
                "title": "欧州・世界の突出した1人あたりGDP高水準国比較（USD）",
                "bars": [
                    {"label": "ルクセンブルク（金融＆越境通勤効果）", "value": 147252, "isTarget": True, "color": "#4f46e5"},
                    {"label": "スイス", "value": 100000, "color": "#64748b"},
                    {"label": "シンガポール", "value": 89000, "color": "#94a3b8"},
                    {"label": "ドイツ（参考大国）", "value": 54000, "color": "#cbd5e1"},
                ],
                "unit": "USD",
                "maxValue": 160000,
                "note": "分母（自国居住人口約68万）に越境通勤者20万人超が含まれないため見かけの1人あたりGDPが極めて高い特殊効果もある！",
            },
        ],
    },
    "HKG": {
        "overviewLife": {
            "quickOverview": {
                "headline": "国際航空貨物世界首位・自由港中継貿易と高層垂直都市が密集する一国二制度ハブ",
                "summary": "英国から1997年返還後も独自通貨・無関税自由港を保ち、隣接する中国珠江デルタ（深圳等）の製造力を背景に航空貨物取扱量世界1位・国際金融拠点として君臨してきた超高密度都市地域。",
                "keyPoints": [
                    "1997年英国返還・一国二制度・独自関税（中国統計註記の定番！）",
                    "『前店後廠』（深圳製造×香港金融物流）と世界1位航空貨物空港・超高人口密度",
                ],
            },
            "dailyLife": {
                "summary": "狭い平地に40〜60階建ての超高層マンション群がびっしり聳え立ち、住民の9割以上が世界有数の効率的地下鉄（MTR）・2階建てトラム・フェリーで移動。朝は飲茶（ヤムチャ）を楽しみ夜遅くまで街が輝く。",
                "food": "点心と中国茶の飲茶（ヤムチャ）文化、ワンタン麺、ローストグース、エッグタルト、香港式ミルクティーなど広東と英国文化の融合食。",
                "housing": "極めて高い住宅地価から狭い高層集合住宅や公営団地が主流で、足場に竹を使う伝統工事光景と超高層タワーの対比が名物。",
                "streetNote": "背後の緑豊かな急峻山地（郊野公園が土地の約4割！）とすぐ隣り合う極限垂直ビルの境界線。",
                "wikiPhotoTargets": [
                    {"title": "Victoria Harbour", "fallbackTitles": ["Hong Kong", "Hong Kong Island"], "caption": "天然の深水良港ビクトリアハーバーと超高層金融街"},
                    {"title": "Hong Kong International Airport", "fallbackTitles": ["Kowloon", "Lantau Island"], "caption": "世界最大の国際航空貨物取扱量を誇る海上埋立ハブ空港"},
                ],
            },
        },
        "topCitiesRegions": {
            "topCities": [
                {"nameJa": "香港（九龍・香港島）", "popMan": 750, "lng": 114.17, "lat": 22.30, "isCapital": True, "note": "一極超高密度都市・国際金融＆世界一航空貨物ハブ"},
            ],
            "specialRegions": [
                {"name": "赤鱲角（チェクラップコク）空港＆新界深圳境界", "tag": "世界一航空貨物・前店後廠境界", "lng": 113.91, "lat": 22.31, "zoom": 7.4, "description": "埋立巨大ハブ空港と珠江デルタ生産網を繋ぐ港珠澳大橋・深圳境界"},
            ],
        },
        "relations": [
            {"partnerIso3": "CHN", "partnerNameJa": "中華人民共和国", "category": "trade", "direction": "mutual", "summary": "水・食料・輸入再輸出の最大のパートナーかつグレーターベイエリアで一体化する母国特別行政区。"},
            {"partnerIso3": "TWN", "partnerNameJa": "台湾", "category": "trade", "direction": "mutual", "summary": "台湾製半導体・電子部品の中継物流・日本産果実等の重要なアジア貿易相手。"},
            {"partnerIso3": "USA", "partnerNameJa": "アメリカ合衆国", "category": "trade", "direction": "outgoing", "summary": "米国向け再輸出電子・精密製品の主要取引先（近年は米中緊張・優遇撤廃で課題）。"},
        ],
        "visuals": [
            {
                "id": "hv_hkg_cargo_trade",
                "placement": "industry",
                "kind": "bar",
                "title": "世界の国際航空貨物取扱量 上位拠点比較（万t/年・2023）",
                "bars": [
                    {"label": "香港（HKG・世界1位）", "value": 433, "isTarget": True, "color": "#2563eb"},
                    {"label": "メンフィス（米・FedEx拠点）", "value": 388, "color": "#64748b"},
                    {"label": "上海浦東（中国）", "value": 344, "color": "#94a3b8"},
                    {"label": "アンカレジ（米・極圏給油ハブ）", "value": 338, "color": "#cbd5e1"},
                    {"label": "仁川（韓国）", "value": 274, "color": "#cbd5e1"},
                ],
                "unit": "万t",
                "maxValue": 500,
                "note": "精密電子・半導体・越境EC貨物の高付加価値空輸により香港空港は長年世界トップ",
            },
        ],
    },
    "KWT": {
        "overviewLife": {
            "quickOverview": {
                "headline": "外国人労働者7割の人口偏重ピラミッドと海水淡水化100%で立つ湾岸産油国",
                "summary": "ペルシャ湾奥の砂漠平坦地に巨大ブルガン油田を擁するOPEC創設国。高い1人あたりGDPと無税福祉のもとで総人口の約7割が外国人出稼ぎ労働者という極端な人口構造と高いCO2排出を持つ。",
                "keyPoints": [
                    "OPEC原加盟・巨大ブルガン油田・恒久河川ゼロのため海水淡水化100%",
                    "総人口約7割の外国人労働者（20〜40代男性極大の人工的歪みピラミッド）",
                ],
            },
            "dailyLife": {
                "summary": "夏の昼間50℃近い猛暑を避けて巨大エアコン完備のショッピングモールや海岸通りのカフェに夜遅くまで人が集う。クウェート国民は手厚い公共福祉を享受する一方、建設・商業現場は南アジア等の出稼ぎ労働者が担う二層社会。",
                "food": "スパイスで炊いた米の上に柔らかく煮た羊肉や魚を乗せる国民食「マクブース（カブサ）」、フムス、デーツとカルダモン珈琲。",
                "housing": "白・ベージュのコンクリート製ヴィラや高層タワーが空調頼みに建ち並び、街のランドマーク『クウェート・タワー』が水道の重要性を象徴。",
                "streetNote": "高い気温と安いガソリン代を背景に完全な車社会で、海岸高速道路に大型SUVが連なる。",
                "wikiPhotoTargets": [
                    {"title": "Kuwait Towers", "fallbackTitles": ["Kuwait City", "Al Hamra Tower"], "caption": "海水淡水化水の貯水塔兼シンボル『クウェート・タワー』と市街"},
                    {"title": "Kuwait City", "fallbackTitles": ["Grand Mosque (Kuwait)"], "caption": "ペルシャ湾奥の摩天楼と砂漠海岸に広がるクウェート市"},
                ],
            },
        },
        "topCitiesRegions": {
            "topCities": [
                {"nameJa": "クウェート市", "popMan": 320, "metroPopMan": 430, "lng": 47.98, "lat": 29.38, "isCapital": True, "note": "人口の9割以上が集住する湾岸都市圏"},
            ],
            "specialRegions": [
                {"name": "ブルガン油田・ミナアルアハマディ港", "tag": "世界屈指の超低コスト油田", "lng": 47.90, "lat": 28.92, "zoom": 7.0, "description": "クウェート財政の9割以上を生み出す巨大油田地帯と石油積出ターミナル"},
            ],
        },
        "relations": [
            {"partnerIso3": "JPN", "partnerNameJa": "日本", "category": "trade", "direction": "outgoing", "summary": "日本の総原油輸入の上位（約8〜9%）を占める重要な安定エネルギー供給パートナー。"},
            {"partnerIso3": "CHN", "partnerNameJa": "中華人民共和国", "category": "trade", "direction": "outgoing", "summary": "最大の原油輸出先かつインフラ建設受注パートナー。"},
            {"partnerIso3": "IND", "partnerNameJa": "インド", "category": "migration", "direction": "incoming", "summary": "クウェート国内最大の外国人労働者（約100万人超）出身国であり、原油の重要取引先。"},
        ],
        "visuals": [
            {
                "id": "hv_kwt_foreign_pop",
                "placement": "population",
                "kind": "bar",
                "title": "湾岸GCC諸国の総人口に占める外国人割合比較（%）",
                "bars": [
                    {"label": "UAE", "value": 88, "color": "#64748b"},
                    {"label": "カタール", "value": 77, "color": "#94a3b8"},
                    {"label": "クウェート", "value": 72, "isTarget": True, "color": "#2563eb"},
                    {"label": "サウジアラビア", "value": 41, "color": "#cbd5e1"},
                ],
                "unit": "%",
                "maxValue": 100,
                "note": "産油小国ほど国内労働力不足を海外出稼ぎ（インド・バングラ・比・エジプト等）で補う割合が極端に高い",
            },
        ],
    },
    "LBN": {
        "overviewLife": {
            "quickOverview": {
                "headline": "砂漠なき地中海東岸山脈国、多宗派権力配分制と人口比世界最大級の難民危機",
                "summary": "レバノン山脈が冬雪をもたらしCsの恵みを享受する一方、キリスト教・イスラム各派が拮抗する宗教モザイク社会。シリア内戦以降、人口の約4分の1相当の難民を抱えるうえ深刻な金融経済危機に見舞われている。",
                "keyPoints": [
                    "西アジア唯一の『砂漠なし』＆レバノン杉（国旗）とベカー高原（Cs地中海式農業）",
                    "多宗派権力配分制（大統領キリスト・首相スンニ）＆難民負担率・在外送金依存",
                ],
            },
            "dailyLife": {
                "summary": "金融危機による深刻なインフレ・停電に直面し、各家庭・ビルの屋上に自家発電機や太陽光パネルが並びながらも、ベイルート市民は海辺の遊歩道（コルニッシュ）での交流と食文化の誇りを保っている。",
                "food": "オリーブ油とレモン・パセリの『タブーリ』サラダ、ひよこ豆『フムス』、焼きナスペースト『ババガヌーシュ』等のメッゼ（前菜群）とピタパンが中東随一の美食と名高い。",
                "housing": "赤いテラコッタ瓦の伝統石造アーチ窓邸宅と、近代高層マンション・密集難民居住区が近接して混在する。",
                "streetNote": "街中でアラビア語挨拶『ボンジュール・ハイ・キーファック（仏・英・アラビア語混在）』が日常的に飛び交う。",
                "wikiPhotoTargets": [
                    {"title": "Beirut", "fallbackTitles": ["Raouché", "Baalbek"], "caption": "地中海とレバノン山脈を背にする首都ベイルート海岸"},
                    {"title": "Byblos", "fallbackTitles": ["Kadisha Valley", "Cedars of God"], "caption": "フェニキア文明の古港ビブロスとレバノン杉の山岳谷"},
                ],
            },
        },
        "topCitiesRegions": {
            "topCities": [
                {"nameJa": "ベイルート", "popMan": 45, "metroPopMan": 240, "lng": 35.50, "lat": 33.89, "isCapital": True, "note": "総人口の約4割が集う地中海沿岸首都・金融商業中心"},
                {"nameJa": "トリポリ", "popMan": 35, "lng": 35.85, "lat": 34.44, "isCapital": False, "note": "北部沿岸第2都市・スンニ派中心・シリア避難民多い"},
            ],
            "specialRegions": [
                {"name": "ベカー高原＆バールベック", "tag": "地溝帯農業・ワイン・難民集積", "lng": 36.10, "lat": 33.90, "zoom": 7.4, "description": "レバノン山脈とアンチレバノン山脈に挟まれた肥沃地溝谷"},
            ],
        },
        "relations": [
            {"partnerIso3": "SYR", "partnerNameJa": "シリア", "category": "migration", "direction": "incoming", "summary": "内戦に伴う100万人超のシリア難民流入先となり国内経済・宗派バランスに決定的影響。"},
            {"partnerIso3": "FRA", "partnerNameJa": "フランス", "category": "history", "direction": "mutual", "summary": "第一次大戦後の仏委任統治時代以来のフランス語・文化・キリスト教マロン派保護の強い絆。"},
            {"partnerIso3": "ARE", "partnerNameJa": "UAE", "category": "migration", "direction": "outgoing", "summary": "多数の高学歴レバノン人専門職が湾岸や世界へ渡り、母国へ重要な送金を行う。"},
        ],
        "visuals": [
            {
                "id": "hv_lbn_religion_split",
                "placement": "culture",
                "kind": "donut",
                "title": "レバノンの独特な多宗派混成社会（公認18宗派均衡枠組み）",
                "slices": [
                    {"label": "イスラム教（スンニ派）", "value": 31, "color": "#10b981"},
                    {"label": "イスラム教（シーア派）", "value": 30, "color": "#0284c7"},
                    {"label": "キリスト教（マロン派・正教等）", "value": 34, "color": "#6366f1"},
                    {"label": "ドゥルーズ派", "value": 5, "color": "#f59e0b"},
                ],
                "unit": "%",
                "note": "中東アラブ諸国の中で例外的にキリスト教勢力が大きく、宗派ごとの議席・役職割当制を採用",
            },
        ],
    },
    "YEM": {
        "overviewLife": {
            "quickOverview": {
                "headline": "国際海運の関門『バブ・エル・マンデブ海峡』を扼するモカ発祥・日干しレンガ高層都市の国",
                "summary": "アラビア半島南西端の高原地形により半島内で例外的に古くからの段々畑農業と日干しレンガ摩天楼『シバーム』を発達させた一方、長期内戦により石油開発は止まり深刻な食料・人道危機に直面している。",
                "keyPoints": [
                    "スエズ運河ルート喉元『バブ・エル・マンデブ海峡』の戦略地政学要衝",
                    "日干しレンガ高層住宅群・モカ発祥・非産油的貧困（GCC非加盟）と人道危機",
                ],
            },
            "dailyLife": {
                "summary": "サナア旧市街に建つ白枠装飾の日干しレンガ高層住宅では上の階に家族居間・眺望室（マフラジュ）を設け、男性が伝統短剣（ジャンビーヤ）を腰に挿し、午後には嗜好葉カートを噛み語らう風景が残るが、内戦下で生活物資不足が深刻。",
                "food": "平たい大釜焼きパンに、熱々の土鍋で煮立てた豆・野菜シチュー「サルタ」や「ファフサ」、焼き魚（アデン沿岸）を囲む。",
                "housing": "乾燥気候の高温と日射・外敵に強い厚い石と日干しレンガによる5〜8階建て垂直民家（シバーム・サナア世界遺産）が建築地理の定番。",
                "streetNote": "内戦の傷跡と物価高の中、太陽光パネルを屋根に載せた小型自家電力に頼る家庭が都市農村問わず広がっている。",
                "wikiPhotoTargets": [
                    {"title": "Old City of Sanaa", "fallbackTitles": ["Sanaa", "Dar al-Hajar"], "caption": "装飾白い漆喰が施されたサナア旧市街の伝統多層建築群"},
                    {"title": "Shibam", "fallbackTitles": ["Socotra", "Aden"], "caption": "『砂漠のマンハッタン』と呼ばれる日干しレンガ高層都市シバーム"},
                ],
            },
        },
        "topCitiesRegions": {
            "topCities": [
                {"nameJa": "サナア", "popMan": 295, "metroPopMan": 340, "lng": 44.19, "lat": 15.37, "isCapital": True, "note": "標高2,250mの高原盆地首都・世界遺産の日干しレンガ旧市街"},
                {"nameJa": "アデン", "popMan": 100, "lng": 45.03, "lat": 12.78, "isCapital": False, "note": "インド洋アデン湾に面する天然火山カルデラ良港"},
            ],
            "specialRegions": [
                {"name": "バブ・エル・マンデブ海峡＆モカ", "tag": "世界海運チョークポイント・珈琲原点", "lng": 43.30, "lat": 12.68, "zoom": 6.6, "description": "欧州〜アジア大動脈を握る紅海入口と古来珈琲積出港モカ"},
            ],
        },
        "relations": [
            {"partnerIso3": "SAU", "partnerNameJa": "サウジアラビア", "category": "history", "direction": "mutual", "summary": "長い砂漠国境を共有する富裕産油隣国（出稼ぎ先かつ紛争直接介入当事国）。"},
            {"partnerIso3": "IRN", "partnerNameJa": "イラン", "category": "history", "direction": "mutual", "summary": "北部のザイド派武装組織（フーシ派）との政治軍事連携を通じて地域緊張の背景となっている。"},
            {"partnerIso3": "DJI", "partnerNameJa": "ジブチ", "category": "history", "direction": "mutual", "summary": "幅30km未満のバブ・エル・マンデブ海峡を挟んだ対岸国（紅海避難ルートにも）。"},
        ],
        "visuals": [
            {
                "id": "hv_yem_arabian_gdp",
                "placement": "overview",
                "kind": "bar",
                "title": "アラビア半島諸国の極端な南北所得格差（1人あたりGDP USD）",
                "bars": [
                    {"label": "カタール", "value": 81000, "color": "#64748b"},
                    {"label": "UAE", "value": 53000, "color": "#94a3b8"},
                    {"label": "サウジアラビア", "value": 33000, "color": "#cbd5e1"},
                    {"label": "イエメン（GCC外・内戦）", "value": 634, "isTarget": True, "color": "#ef4444"},
                ],
                "unit": "USD",
                "maxValue": 85000,
                "note": "同じアラビア半島なのに石油有無と内戦で50〜120倍もの1人当たりGDP格差が存在！",
            },
        ],
    },
    "TKM": {
        "overviewLife": {
            "quickOverview": {
                "headline": "カラクム運河が砂漠の綿花を潤し、巨大天然ガスを中国へ送る永世中立リソース国",
                "summary": "国土8割をカラクム砂漠が占め、ソ連期開削の『カラクム運河』は綿花生産と同時にアラル海縮小と土壌塩害を引き起こした。ロシア一辺倒から中国パイプライン直結へ切り替え、世界4位級の天然ガス埋蔵で潤う。",
                "keyPoints": [
                    "アラル海縮小主因『カラクム運河（素掘り長大灌漑・塩害）』と綿花栽培",
                    "世界4位級『天然ガス』の対中輸出独占・『地獄の門』・国連永世中立国",
                ],
            },
            "dailyLife": {
                "summary": "白亜の大理石高層ビルが整然と並ぶ首都アシガバートでは豊富なガス・電力補助のもと穏やかな街並みが保たれる一方、農村部やオアシスでは伝統の大きな羊毛帽子（テルペク）や豪華なトルクメン絨毯織りが日常に生きている。",
                "food": "大鍋で炊く羊肉の炊き込みご飯「プロフ（パロウ）」、厚手ナン「チョレク」、夏バテを防ぐ発酵ラクダ乳「チャル」や甘いメロンが特産。",
                "housing": "アシガバートの真白い大理石張り近代集合住宅群と、砂漠牧民文化に根ざす円形テント「アク・オイ（ユルト）」の伝統がある。",
                "streetNote": "乾燥と強烈な太陽光に白く反射する首都の大理石街路と、国家の誇り・名馬『アハルテケ』の像が各地に立つ。",
                "wikiPhotoTargets": [
                    {"title": "Ashgabat", "fallbackTitles": ["Darvaza gas crater", "Merv"], "caption": "白亜の大理石建築群が並ぶ砂漠の首都アシガバート"},
                    {"title": "Darvaza gas crater", "fallbackTitles": ["Karakum Desert"], "caption": "カラクム砂漠地下の豊富な天然ガスを象徴するダルヴァザ・ガス火口"},
                ],
            },
        },
        "topCitiesRegions": {
            "topCities": [
                {"nameJa": "アシガバート", "popMan": 103, "lng": 58.33, "lat": 37.96, "isCapital": True, "note": "コペトダグ山麓オアシスの大理石都市・政治中心"},
                {"nameJa": "トゥルクメナバート", "popMan": 25, "lng": 63.58, "lat": 39.08, "isCapital": False, "note": "東部アムダリヤ川沿いの灌漑農業・綿花集散都市"},
            ],
            "specialRegions": [
                {"name": "カラクム運河＆ダルヴァザ（地獄の門）", "tag": "長大砂漠運河・天然ガス帯", "lng": 58.44, "lat": 40.25, "zoom": 6.0, "description": "アムダリヤ水を取水してカラクム砂漠を横断する大運河とガス埋蔵地帯"},
            ],
        },
        "relations": [
            {"partnerIso3": "CHN", "partnerNameJa": "中華人民共和国", "category": "trade", "direction": "outgoing", "summary": "中央アジア―中国天然ガスパイプラインを通じ輸出の7割以上を引き受ける絶対的顧客。"},
            {"partnerIso3": "TUR", "partnerNameJa": "トルコ", "category": "history", "direction": "mutual", "summary": "オグズ・テュルク系の言語文化を共有し、首都建築工事等を請け負う親密パートナー。"},
            {"partnerIso3": "UZB", "partnerNameJa": "ウズベキスタン", "category": "history", "direction": "mutual", "summary": "アムダリヤ川の水利配分・カラクム運河取水を巡り調整が必要な隣国。"},
        ],
        "visuals": [
            {
                "id": "hv_tkm_gas_export",
                "placement": "industry",
                "kind": "bar",
                "title": "旧ソ連中央アジア諸国の対外輸出構造の違い（資源特化比較・主輸出品割合）",
                "bars": [
                    {"label": "トルクメニスタン（天然ガス特化）", "value": 82, "isTarget": True, "color": "#0284c7"},
                    {"label": "カザフスタン（原油中心）", "value": 58, "color": "#64748b"},
                    {"label": "キルギス（金・再輸出等）", "value": 36, "color": "#94a3b8"},
                    {"label": "ウズベキスタン（金・ガス・綿花/製品多様）", "value": 34, "color": "#cbd5e1"},
                ],
                "unit": "%（燃料資源輸出依存概算）",
                "maxValue": 100,
                "note": "中央アジア最大のガス専業・対中依存輸出モデル",
            },
        ],
    },
    "KGZ": {
        "overviewLife": {
            "quickOverview": {
                "headline": "天山山脈の『移牧』と氷河水力・金鉱山、そして対露送金が支える中央アジア山岳国",
                "summary": "国土9割以上が天山・パミール山脈という急峻地形。夏季の高山草原『ジャイロー』への移牧と移動天幕（ユルト）の伝統を残しつつ、急流の豊かな水力発電（下流ウズベキスタンと季節水争い）や金鉱山・出稼ぎ送金に頼る。",
                "keyPoints": [
                    "垂直『移牧』文化（ボズ・ユイ）＆高山不凍湖『イシククル湖』",
                    "下流綿花国との『水力電力 vs 灌漑水』対立・金輸出・ロシア出稼ぎ送金約25%",
                ],
            },
            "dailyLife": {
                "summary": "夏には天山山麓の高原へ家族で羊と馬を連れ上がり、白いフェルト製移動式住居『ボズ・ユイ（ユルト）』で馬乳酒を仕込みながら暮らす半定住・移牧サイクルが観光資源かつ生活文化として健在。首都ビシュケクにはソ連風の並木道とバザールが広がる。",
                "food": "手打ち太麺と羊肉の『ベシュバルマク』（5本指で食べる遊牧伝統料理）、羊肉ピラフ（プロフ）、焼き餃子（サムサ）、発酵馬乳『クミス』。",
                "housing": "冬季は谷や都市の日干しレンガ・木造住宅やアパートに住み、夏山では組み立て分解が数時間でできる円形木組フェルト住居ユルトを使う。",
                "streetNote": "オシュ・バザール等の市場には中国製の衣料・雑貨が山積みになりEAEU域内への貿易中継点となっている。",
                "wikiPhotoTargets": [
                    {"title": "Issyk-Kul", "fallbackTitles": ["Ala-Archa National Park", "Song-Köl"], "caption": "天山山脈に抱かれた不凍の山岳塩湖イシククル湖と移牧草原"},
                    {"title": "Bishkek", "fallbackTitles": ["Sulaiman-Too"], "caption": "雪を頂くアラ・トー山脈を望む首都ビシュケク"},
                ],
            },
        },
        "topCitiesRegions": {
            "topCities": [
                {"nameJa": "ビシュケク", "popMan": 114, "lng": 74.59, "lat": 42.87, "isCapital": True, "note": "北部チュイ谷の首都・製造商業・教育中心"},
                {"nameJa": "オシュ", "popMan": 34, "lng": 72.80, "lat": 40.53, "isCapital": False, "note": "南部フェルガナ盆地東端の古都・ウズベク系住民も多い多民族街"},
            ],
            "specialRegions": [
                {"name": "イシククル湖＆フェルガナ盆地縁", "tag": "不凍高山湖・入り組む国境", "lng": 77.25, "lat": 42.45, "zoom": 6.4, "description": "冬季も凍結しない深湖イシククルとウズベク・タジク国境錯綜の南西部"},
            ],
        },
        "relations": [
            {"partnerIso3": "RUS", "partnerNameJa": "ロシア", "category": "migration", "direction": "outgoing", "summary": "約100万人規模のキルギス人が働きGDPの約25%に及ぶ出稼ぎ送金を送る最大依存先。"},
            {"partnerIso3": "CHN", "partnerNameJa": "中華人民共和国", "category": "trade", "direction": "incoming", "summary": "最大の輸入元かつ『中国―キルギス―ウズベキスタン鉄道』など一帯一路鉱業投資元。"},
            {"partnerIso3": "UZB", "partnerNameJa": "ウズベキスタン", "category": "history", "direction": "mutual", "summary": "シルダリヤ川上流ダムの放水時期調整やフェルガナ飛び地国境画定を進める重要隣国。"},
        ],
        "visuals": [
            {
                "id": "hv_kgz_elevation_water",
                "placement": "overview",
                "kind": "table",
                "title": "中央アジア旧ソ連5カ国の『平坦砂漠ガス油田型 vs 山岳水力送金型』の完全対比",
                "headers": ["国タイプ", "代表国", "地形・資源", "水・エネルギー立場"],
                "rows": [
                    ["山岳上流型", "キルギス・タジキスタン", "天山/パミール山脈・水力・金・氷河", "上流国（冬発電放水）＝個人送金依存非常に高い"],
                    ["平野下流型", "ウズベク・トルクメン・カザフ", "砂漠盆地・原油・天然ガス・綿花", "下流国（夏灌漑取水）＝地下化石資源輸出依存"],
                ],
            },
        ],
    },
    "BRN": {
        "overviewLife": {
            "quickOverview": {
                "headline": "豊かな原油・LNG福祉で東南アジア有数の高所得と手厚い熱帯林保護を両立するスルタン国",
                "summary": "ボルネオ島北岸に二つの飛び地状に領土を分けられながら、石油・LNGの莫大な収入（日本へLNG供給）によりシンガポールに次ぐASEAN2位級の高所得を実現し、大規模な森林伐採も抑制している。",
                "keyPoints": [
                    "シンガポールに次ぐASEAN高1人当たりGDP・スルタン絶対君主＆医療教育無料",
                    "対日LNG長期輸出国・飛び地領土・東南アジア最高の原生熱帯雨林保全率",
                ],
            },
            "dailyLife": {
                "summary": "税金ゼロ・手厚い医療教育補助と安いガソリンを享受する豊かな車社会である一方、国内全土でアルコール販売禁止・豚肉制限など厳格なイスラム教規範（ハラル生活）が日常を律している。ブルネイ川の『水上集落カンポン・アイール』の暮らしも現役。",
                "food": "もち米の竹筒焼きやココナッツミルク煮込み、辛いエビチリ風付け合わせ『アンブヤット（サゴヤシ澱粉のとろみ主食）』とハラル料理。",
                "housing": "ブルネイ川の水面上に木製高床杭で支えられた数千戸の水上木造集落『カンポン・アイール』（電気水道・水上モスク・消防署完備！）と陸上の近代郊外邸宅。",
                "streetNote": "黄金のドームが輝くオマール・アリ・サイフディン・モスクと静かな水上タクシー（ボート）の往来。",
                "wikiPhotoTargets": [
                    {"title": "Sultan Omar Ali Saifuddien Mosque", "fallbackTitles": ["Bandar Seri Begawan", "Kampong Ayer"], "caption": "首都中心に輝く黄金ドームのモスクと水上集落カンポン・アイール"},
                    {"title": "Ulu Temburong National Park", "fallbackTitles": ["Kampong Ayer"], "caption": "飛び地テンブロン地区に原生林のまま保全された熱帯雨林(Af)"},
                ],
            },
        },
        "topCitiesRegions": {
            "topCities": [
                {"nameJa": "バンダルスリブガワン", "popMan": 10, "metroPopMan": 28, "lng": 114.94, "lat": 4.90, "isCapital": True, "note": "水上集落カンポン・アイールを抱く首都・王宮モスク中心"},
                {"nameJa": "クアラ・ブライト／セリア", "popMan": 7, "lng": 114.20, "lat": 4.58, "isCapital": False, "note": "西部のセリア油田・ルムットLNGプラント拠点"},
            ],
            "specialRegions": [
                {"name": "テンブロン地区（東側飛び地）", "tag": "マレーシアに隔てられた原生熱帯林", "lng": 115.14, "lat": 4.55, "zoom": 8.0, "description": "30kmの海上連絡橋開通で本島側と直結した原生熱帯雨林保護区"},
            ],
        },
        "relations": [
            {"partnerIso3": "JPN", "partnerNameJa": "日本", "category": "trade", "direction": "outgoing", "summary": "1972年以来、日本のクリーンなLNG輸入の歴史的かつ極めて重要な安定輸出パートナー。"},
            {"partnerIso3": "SGP", "partnerNameJa": "シンガポール", "category": "trade", "direction": "mutual", "summary": "通貨等価交換協定（シンガポールドルと1:1交換可能！）を結ぶ特殊な緊密金融パートナー。"},
            {"partnerIso3": "MYS", "partnerNameJa": "マレーシア", "category": "history", "direction": "mutual", "summary": "陸上国境をすべて東マレーシア・サラワク州に囲まれる隣国（マレー文化・イスラム圏共有）。"},
        ],
        "visuals": [
            {
                "id": "hv_brn_asean_income",
                "placement": "overview",
                "kind": "bar",
                "title": "ASEAN諸国の1人当たりGDPの極端な2極・多層構造（USD・2025目安）",
                "bars": [
                    {"label": "シンガポール（金融貿易）", "value": 89000, "color": "#64748b"},
                    {"label": "ブルネイ（産油ガス小国）", "value": 32235, "isTarget": True, "color": "#10b981"},
                    {"label": "マレーシア", "value": 14000, "color": "#94a3b8"},
                    {"label": "タイ", "value": 7600, "color": "#cbd5e1"},
                    {"label": "ミャンマー", "value": 1200, "color": "#e2e8f0"},
                ],
                "unit": "USD",
                "maxValue": 95000,
                "note": "ASEAN10カ国の中ではシンガポールに次ぐ『唯一の高所得・福祉産油国』という異色ポジション",
            },
        ],
    },
    "BTN": {
        "overviewLife": {
            "quickOverview": {
                "headline": "『GNH（国民総幸福量）』と森林率70%・水力電力輸出で進むヒマラヤの山岳仏教王国",
                "summary": "物質的なGDPではなく『国民総幸福量(GNH)』を国是に掲げ、憲法で森林率6割維持を義務化した世界希少のカーボンネガティブ国家。急流の水力電力をインドへ売り外貨を得つつ、伝統文化を厚く保護している。",
                "keyPoints": [
                    "GNH（国民総幸福量）理念・憲法森林率60%義務・カーボンネガティブ",
                    "対インド水力電力輸出（外貨最大の柱）とチベット仏教『ゾン』城塞建築",
                ],
            },
            "dailyLife": {
                "summary": "役所や学校の場では男性が着物風の『ゴ』、女性が巻きスカート風の『キラ』という民族衣装を着用する規定があり、チベット仏教の五色旗（タルチョ）と城塞寺院『ゾン』が山峡の暮らしに溶け込む。なお国内に信号機はほぼ無く手信号交差点の首都ティンプーが名物。",
                "food": "唐辛子とチーズを煮込んだ国民的おかず『エマ・ダツィ』に、高地産の赤米飯・蕎麦粉パスタ（プタ）と塩味のバター茶（スジャ）が欠かせない。",
                "housing": "石と木・突き固めた土壁で作られた伝統3階建て家屋（1階＝家畜小屋、2階＝居住、3階＝仏間兼貯蔵）が傾斜地に建つ。",
                "streetNote": "首都ティンプーには近代的高層ビルを禁じる伝統建築様式の景観規制が守られている。",
                "wikiPhotoTargets": [
                    {"title": "Paro Taktsang", "fallbackTitles": ["Punakha Dzong", "Thimphu"], "caption": "切り立ったヒマラヤ絶壁に建つチベット仏教の聖地タクツァン僧院"},
                    {"title": "Thimphu", "fallbackTitles": ["Tashichho Dzong"], "caption": "山間盆地に伝統建築様式で整えられた首都ティンプー"},
                ],
            },
        },
        "topCitiesRegions": {
            "topCities": [
                {"nameJa": "ティンプー", "popMan": 12, "lng": 89.64, "lat": 27.47, "isCapital": True, "note": "標高2,320mの山間首都（高層ビル・信号なし伝統景観）"},
                {"nameJa": "パロ", "popMan": 2, "lng": 89.41, "lat": 27.43, "isCapital": False, "note": "唯一の国際空港・タクツァン僧院を擁する歴史盆地"},
            ],
            "specialRegions": [
                {"name": "プナカ〜チュカ水力発電谷", "tag": "ゾン城塞・水力輸出拠点", "lng": 89.56, "lat": 26.95, "zoom": 7.5, "description": "旧冬都プナカとインド向け大型水力発電所が連なる南下河川渓谷"},
            ],
        },
        "relations": [
            {"partnerIso3": "IND", "partnerNameJa": "インド", "category": "trade", "direction": "mutual", "summary": "水力ダム建設投資から電力のほぼ全量購入、生活物資供給まで外交・貿易約8割を占める特別パートナー。"},
            {"partnerIso3": "CHN", "partnerNameJa": "中華人民共和国", "category": "history", "direction": "mutual", "summary": "チベット自治区と国境接し国境画定・シルクロード地政学の均衡課題を抱える北隣国。"},
            {"partnerIso3": "AUS", "partnerNameJa": "オーストラリア", "category": "migration", "direction": "outgoing", "summary": "近年、英語教育を受けたブータン若年層の最大の留学・就労移住先となっている。"},
        ],
        "visuals": [
            {
                "id": "hv_btn_forest_power",
                "placement": "overview",
                "kind": "donut",
                "title": "ブータンの土地被覆＆クリーン発電体制（約100%水力）",
                "slices": [
                    {"label": "森林被覆（約70%・憲法60%下限義務）", "value": 71, "color": "#16a34a"},
                    {"label": "高山岩場・氷河（北部ヒマラヤ）", "value": 21, "color": "#94a3b8"},
                    {"label": "農耕地・牧草地・居住地", "value": 8, "color": "#f59e0b"},
                ],
                "unit": "%",
                "note": "豊富な森林吸収により世界で極めて珍しいCO2『吸収超過（カーボンネガティブ）』国！",
            },
        ],
    },
    "GEO": {
        "overviewLife": {
            "quickOverview": {
                "headline": "固有語族・固有文字の誇りとワイン8000年の伝統、カスピ海〜黒海の資源通過回廊",
                "summary": "大コーカサス山脈の南、黒海とカスピ海の間に開かれた古代キリスト教国家。独自の文字とワイン醸造文化を保ち、アゼルバイジャン原油/ガスを欧州へ繋ぐBTCパイプラインやミドルコリドー物流を担う一方、親露分離地域問題を抱える。",
                "keyPoints": [
                    "孤立した『カルトヴェリ語族』＋曲線美しい固有文字＋正教＋世界最古ワイン文化",
                    "BTCパイプライン（黒海〜トルコ輸送）・バトゥミ超多雨Cfa茶 vs トビリシ盆地",
                ],
            },
            "dailyLife": {
                "summary": "親族や客人を招いた宴『スプラ』では乾杯の音頭（タマダ）が何時間も続き、素焼き壺で作られた琥珀色の伝統ワインを酌み交わす温かなおもてなし文化が国民のアイデンティティ。トビリシの硫黄温泉（アバノトゥバニ）とレトロ街区に近年欧米露からのIT移住者が急増。",
                "food": "舟形チーズパンに卵を落とす『ハチャプリ（アジャリア風）』、大きな肉汁入り小籠包型ダンプリング『ヒンカリ』、クルミソースの鶏料理（サツィヴィ）にワイン。",
                "housing": "トビリシ旧市街の精巧な木彫り張り出しバルコニーが付いた斜面の多層住宅群と、山岳地スヴァネティの防衛用石造塔屋（コシュキ）が名高い。",
                "streetNote": "街角の看板に独特の丸みを帯びた『ムヘドルリ文字（ジョージア文字）』が並び、ロシア語とは一目で判別可能。",
                "wikiPhotoTargets": [
                    {"title": "Tbilisi", "fallbackTitles": ["Narikala", "Mtskheta"], "caption": "クラ川渓谷と木彫りバルコニーの街並みが広がる首都トビリシ"},
                    {"title": "Ushguli", "fallbackTitles": ["Svaneti", "Batumi"], "caption": "大コーカサス山脈の防衛石塔が残る世界遺産スヴァネティ地方"},
                ],
            },
        },
        "topCitiesRegions": {
            "topCities": [
                {"nameJa": "トビリシ", "popMan": 124, "metroPopMan": 145, "lng": 44.83, "lat": 41.72, "isCapital": True, "note": "東部クラ川沿いの政治文化首都・ITサービス急伸拠点"},
                {"nameJa": "バトゥミ", "popMan": 18, "lng": 41.64, "lat": 41.64, "isCapital": False, "note": "南西黒海岸の亜熱帯超多雨港湾都市・観光カジノリゾート"},
            ],
            "specialRegions": [
                {"name": "大コーカサス山脈（カズベキ・スヴァネティ）＆アブハジア", "tag": "氷河山岳・2008年分離紛争帯", "lng": 44.60, "lat": 42.66, "zoom": 6.6, "description": "5000m級の氷河峰と北側のアブハジア/南オセチア事実上分離地域"},
            ],
        },
        "relations": [
            {"partnerIso3": "TUR", "partnerNameJa": "トルコ", "category": "trade", "direction": "mutual", "summary": "最大の貿易パートナーでありバクー＝トビリシ＝ジェイハン(BTC)パイプラインと鉄道で直結。"},
            {"partnerIso3": "AZE", "partnerNameJa": "アゼルバイジャン", "category": "trade", "direction": "mutual", "summary": "燃料ガス供給元かつエネルギー・物流回廊（カスピ海⇄黒海）を共営する最重要隣国。"},
            {"partnerIso3": "RUS", "partnerNameJa": "ロシア", "category": "history", "direction": "mutual", "summary": "2008年戦争による国交断絶を抱えつつも農産物・観光・露人IT避難民で複雑な相互依存残る。"},
        ],
        "visuals": [
            {
                "id": "hv_geo_caucasus_three",
                "placement": "culture",
                "kind": "table",
                "title": "南コーカサス三国（ジョージア・アルメニア・アゼルバイジャン）の完全比較",
                "headers": ["国名", "言語語族", "主要宗教", "地形・国際対立・エネルギー"],
                "rows": [
                    ["ジョージア", "カルトヴェリ語族（固有文字）", "キリスト教（正教）", "黒海面す・通過回廊（BTC）／南オセチア・アブハジア問題"],
                    ["アルメニア", "印欧語族（固有文字）", "キリスト教（東方諸教会）", "内陸高原・国境封鎖（土/アゼ）／露から距離を置き欧米接近"],
                    ["アゼルバイジャン", "テュルク語族（ラテン文字）", "イスラム教（シーア派）", "カスピ海油田・ガス田／トルコ同盟・飛地ナヒチェヴァン"],
                ],
            },
        ],
    },
}
