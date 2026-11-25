import type { SubnationalProfile } from '../../types/schema_v1';

interface SubnationalDiagramProps {
  countryNameJa: string;
  subnational: SubnationalProfile;
}

/**
 * 主要20カ国の国内地域差・気候境界線・地形断面を一目で理解できる模式SVG図解
 */
export function SubnationalDiagram({
  countryNameJa,
  subnational,
}: SubnationalDiagramProps) {
  const diagramId = subnational.diagramId;

  if (diagramId === 'sub_usa') {
    return (
      <svg viewBox="0 0 640 240" className="w-full rounded-xl border border-slate-200 bg-white">
        <rect x="0" y="0" width="640" height="240" fill="#f8fafc" />
        <text x="16" y="22" fontSize="12" fontWeight="800" fill="#1e293b">
          アメリカ合衆国：地形配列（西→東）× 西経100度線 × 北緯37度線（サンベルト）
        </text>
        {/* 断面・帯域 */}
        <rect x="20" y="42" width="105" height="145" rx="8" fill="#ede9fe" stroke="#8b5cf6" />
        <text x="72" y="60" textAnchor="middle" fontSize="11" fontWeight="800" fill="#5b21b6">太平洋岸</text>
        <text x="72" y="78" textAnchor="middle" fontSize="9.5" fill="#4c1d95">Cs（南）・Cfb（北）</text>
        <text x="72" y="96" textAnchor="middle" fontSize="9" fill="#334155">地中海式灌漑</text>
        <text x="72" y="112" textAnchor="middle" fontSize="9" fill="#334155">シリコンバレー</text>
        <text x="72" y="128" textAnchor="middle" fontSize="9" fill="#334155">サンアンドレアス断層</text>

        <rect x="135" y="42" width="135" height="145" rx="8" fill="#fef3c7" stroke="#f59e0b" />
        <text x="202" y="60" textAnchor="middle" fontSize="11" fontWeight="800" fill="#92400e">ロッキー・大平原西部</text>
        <text x="202" y="78" textAnchor="middle" fontSize="9.5" fill="#78350f">BS・BW（500mm未満）</text>
        <text x="202" y="96" textAnchor="middle" fontSize="9" fill="#334155">雨蔭の半乾燥</text>
        <text x="202" y="112" textAnchor="middle" fontSize="9" fill="#334155">企業的肉牛牧畜</text>
        <text x="202" y="128" textAnchor="middle" fontSize="9" fill="#334155">センターピボット灌漑</text>
        <text x="202" y="144" textAnchor="middle" fontSize="9" fill="#b45309">（オガララ地下水低下）</text>

        {/* 西経100度線 */}
        <line x1="278" y1="36" x2="278" y2="195" stroke="#dc2626" strokeWidth="3" strokeDasharray="5,4" />
        <rect x="234" y="196" width="90" height="22" rx="4" fill="#fee2e2" stroke="#dc2626" />
        <text x="279" y="211" textAnchor="middle" fontSize="10" fontWeight="800" fill="#b91c1c">西経100°(500mm)</text>

        {/* 東部上下分割（北緯37度線） */}
        <rect x="288" y="42" width="225" height="68" rx="8" fill="#dbeafe" stroke="#3b82f6" />
        <text x="400" y="59" textAnchor="middle" fontSize="11" fontWeight="800" fill="#1e40af">中西部〜北東部・五大湖（ラストベルト）</text>
        <text x="400" y="76" textAnchor="middle" fontSize="9.5" fill="#1e3a8a">Df・Cfa / コーンベルト（大豆＋肉牛）・春/冬小麦・酪農</text>
        <text x="400" y="93" textAnchor="middle" fontSize="9" fill="#334155">旧重工業（鉄鋼・自動車）→ 金融・ICT・再都市化</text>

        <line x1="286" y1="116" x2="520" y2="116" stroke="#ea580c" strokeWidth="3" strokeDasharray="5,4" />
        <text x="400" y="129" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#c2410c">
          ――― 北緯37度線（サンベルト境界：工場と人口が南下）―――
        </text>

        <rect x="288" y="135" width="225" height="52" rx="8" fill="#ffedd5" stroke="#f97316" />
        <text x="400" y="152" textAnchor="middle" fontSize="11" fontWeight="800" fill="#9a3412">南部・メキシコ湾岸サンベルト</text>
        <text x="400" y="169" textAnchor="middle" fontSize="9.5" fill="#7c2d12">旧綿花→大豆・米・ブロイラー / 石油化学・航空・外資自動車</text>

        <rect x="524" y="42" width="98" height="145" rx="8" fill="#e0f2fe" stroke="#0284c7" />
        <text x="573" y="60" textAnchor="middle" fontSize="11" fontWeight="800" fill="#075985">滝線・大西洋岸</text>
        <text x="573" y="80" textAnchor="middle" fontSize="9" fill="#334155">アパラチア古期</text>
        <text x="573" y="96" textAnchor="middle" fontSize="9" fill="#334155">メガロポリス都市</text>
        <text x="573" y="112" textAnchor="middle" fontSize="9" fill="#334155">（NY・ボストン・</text>
        <text x="573" y="128" textAnchor="middle" fontSize="9" fill="#334155">フィラデルフィア）</text>
      </svg>
    );
  }

  if (diagramId === 'sub_chn') {
    return (
      <svg viewBox="0 0 640 245" className="w-full rounded-xl border border-slate-200 bg-white">
        <rect x="0" y="0" width="640" height="245" fill="#f8fafc" />
        <text x="16" y="22" fontSize="12" fontWeight="800" fill="#1e293b">
          中国：400mm線（遊牧/農耕）× 秦嶺・淮河線（800mm・1月0℃＝畑作/水田）× 胡煥庸線
        </text>
        {/* 左西部 */}
        <rect x="20" y="40" width="185" height="175" rx="8" fill="#f3e8ff" stroke="#8b5cf6" />
        <text x="112" y="62" textAnchor="middle" fontSize="11.5" fontWeight="800" fill="#5b21b6">西北内陸・青蔵高原</text>
        <text x="112" y="80" textAnchor="middle" fontSize="9.5" fill="#6b21a8">面積約57% / 人口わずか約6%</text>
        <text x="112" y="102" textAnchor="middle" fontSize="9.5" fill="#334155">BW・BS・ET（乾燥と高冷）</text>
        <text x="112" y="122" textAnchor="middle" fontSize="9.5" fill="#334155">羊・ヤク遊牧 / カレーズ綿花</text>
        <text x="112" y="142" textAnchor="middle" fontSize="9.5" fill="#334155">西気東輸（天然ガス・レアアース）</text>
        <text x="112" y="162" textAnchor="middle" fontSize="9.5" fill="#334155">少数民族自治域（新疆・チベット）</text>

        {/* 400mm / 胡煥庸線 */}
        <line x1="215" y1="36" x2="215" y2="220" stroke="#7c3aed" strokeWidth="3" strokeDasharray="5,4" />
        <text x="215" y="236" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#6d28d9">
          400mm線・黒河―騰衝線（東に人口94%）
        </text>

        {/* 東側：東北 / 華北 / 華中 / 華南 */}
        <rect x="228" y="40" width="392" height="50" rx="8" fill="#dbeafe" stroke="#0284c7" />
        <text x="424" y="59" textAnchor="middle" fontSize="11" fontWeight="800" fill="#075985">東北（Dw・黒土）&amp; 華北・環渤海（Cw・黄土）</text>
        <text x="424" y="77" textAnchor="middle" fontSize="9.5" fill="#1e3a8a">春/冬小麦・トウモロコシ・大豆 / 重工業・北京中関村・慢性水不足（南水北調）</text>

        <line x1="226" y1="99" x2="622" y2="99" stroke="#16a34a" strokeWidth="3" strokeDasharray="6,4" />
        <rect x="285" y="88" width="275" height="20" rx="4" fill="#dcfce7" stroke="#16a34a" />
        <text x="422" y="102" textAnchor="middle" fontSize="10" fontWeight="800" fill="#15803d">
          秦嶺・淮河線（年800mm ・ 1月平均0℃ ・ 畑作/水田境界）
        </text>

        <rect x="228" y="114" width="392" height="46" rx="8" fill="#d1fae5" stroke="#10b981" />
        <text x="424" y="133" textAnchor="middle" fontSize="11" fontWeight="800" fill="#065f46">華中・長江デルタ（Cfa）</text>
        <text x="424" y="150" textAnchor="middle" fontSize="9.5" fill="#064e3b">水稲・茶・三峡ダム / 上海金融ハイテク・重慶・武漢へ工場内陸シフト</text>

        <rect x="228" y="167" width="392" height="48" rx="8" fill="#fce7f3" stroke="#ec4899" />
        <text x="424" y="186" textAnchor="middle" fontSize="11" fontWeight="800" fill="#9d174d">華南・珠江デルタ（Cfa/Cw二期作・カルスト）</text>
        <text x="424" y="203" textAnchor="middle" fontSize="9.5" fill="#831843">経済特区発祥→深圳ICT・EV開発拠点＋香港金融連携（賃金高で一部海外移転）</text>
      </svg>
    );
  }

  if (diagramId === 'sub_jpn') {
    return (
      <svg viewBox="0 0 640 230" className="w-full rounded-xl border border-slate-200 bg-white">
        <defs>
          <marker id="arrowB" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#2563eb" />
          </marker>
          <marker id="arrowO" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#ea580c" />
          </marker>
        </defs>
        <rect x="0" y="0" width="640" height="230" fill="#f8fafc" />
        <text x="16" y="22" fontSize="12" fontWeight="800" fill="#1e293b">
          日本列島断面：冬・夏の季節風対比 × フォッサマグナ・中央構造線
        </text>
        {/* 左：日本海 */}
        <rect x="20" y="138" width="170" height="42" fill="#bfdbfe" />
        <text x="105" y="163" textAnchor="middle" fontSize="11" fontWeight="800" fill="#1e40af">日本海（対馬海流＝暖流）</text>
        {/* 冬の風 */}
        <path d="M 35 66 Q 110 66 205 90" fill="none" stroke="#2563eb" strokeWidth="3" markerEnd="url(#arrowB)" />
        <text x="115" y="57" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#1d4ed8">冬：北西季節風（水蒸気大量補給→大雪）</text>

        {/* 脊梁山脈 */}
        <polygon points="190,180 305,72 425,180" fill="#cbd5e1" stroke="#64748b" strokeWidth="2" />
        <text x="307" y="138" textAnchor="middle" fontSize="11" fontWeight="800" fill="#1e293b">脊梁山脈・中央高地</text>
        <text x="307" y="155" textAnchor="middle" fontSize="9" fill="#475569">糸魚川―静岡構造線 / 中央構造線</text>
        <text x="307" y="170" textAnchor="middle" fontSize="9" fill="#0f766e">高冷地・扇状地果樹・抑制栽培</text>

        {/* 夏の風 */}
        <path d="M 595 66 Q 505 66 390 92" fill="none" stroke="#ea580c" strokeWidth="3" markerEnd="url(#arrowO)" />
        <text x="500" y="57" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#c2410c">夏：南東季節風＋台風・梅雨（多雨）</text>

        {/* 右：太平洋 */}
        <rect x="425" y="138" width="195" height="42" fill="#fed7aa" />
        <text x="522" y="163" textAnchor="middle" fontSize="11" fontWeight="800" fill="#9a3412">太平洋（黒潮＝暖流）</text>

        {/* 下部対比カード */}
        <rect x="20" y="186" width="290" height="36" rx="6" fill="#eff6ff" stroke="#93c5fd" />
        <text x="165" y="201" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#1e3a8a">日本海側：12〜1月降水ピーク / 稲作単作・夏フェーン</text>
        <text x="165" y="215" textAnchor="middle" fontSize="9" fill="#334155">（金沢・新潟：冬の大雪を春の農業用水に活用）</text>

        <rect x="330" y="186" width="290" height="36" rx="6" fill="#fff7ed" stroke="#fdba74" />
        <text x="475" y="201" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#9a3412">太平洋側：6・9月多雨 / 冬は乾燥『空っ風』・促成栽培</text>
        <text x="475" y="215" textAnchor="middle" fontSize="9" fill="#334155">（瀬戸内は両山地に挟まれ年間少雨・ため池分布）</text>
      </svg>
    );
  }

  if (diagramId === 'sub_ind') {
    return (
      <svg viewBox="0 0 640 230" className="w-full rounded-xl border border-slate-200 bg-white">
        <rect x="0" y="0" width="640" height="230" fill="#f8fafc" />
        <text x="16" y="22" fontSize="12" fontWeight="800" fill="#1e293b">
          インド：年1000mm線（西の小麦・綿花 vs 東の稲・ジュート）× 南インドIT都市
        </text>
        <rect x="20" y="42" width="185" height="90" rx="8" fill="#fef3c7" stroke="#f59e0b" />
        <text x="112" y="61" textAnchor="middle" fontSize="11" fontWeight="800" fill="#92400e">北西部・パンジャーブ〜首都圏</text>
        <text x="112" y="79" textAnchor="middle" fontSize="9.5" fill="#78350f">1000mm未満（Cw・BS・BW）</text>
        <text x="112" y="96" textAnchor="middle" fontSize="9.5" fill="#334155">小麦（緑の革命灌漑）・綿花</text>
        <text x="112" y="113" textAnchor="middle" fontSize="9.5" fill="#334155">デリー首都圏（自動車組立）</text>

        <rect x="20" y="140" width="250" height="75" rx="8" fill="#fce7f3" stroke="#ec4899" />
        <text x="145" y="159" textAnchor="middle" fontSize="11" fontWeight="800" fill="#9d174d">西部デカン・ムンバイ</text>
        <text x="145" y="177" textAnchor="middle" fontSize="9.5" fill="#831843">玄武岩風化の肥沃土『レグール土』</text>
        <text x="145" y="194" textAnchor="middle" fontSize="9.5" fill="#334155">綿花・落花生 / 西ガーツ沿岸Am超多雨 / 金融ムンバイ</text>

        <line x1="295" y1="38" x2="295" y2="218" stroke="#16a34a" strokeWidth="3" strokeDasharray="5,4" />
        <rect x="225" y="42" width="140" height="24" rx="4" fill="#dcfce7" stroke="#16a34a" />
        <text x="295" y="58" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#15803d">年降水量1000mm線</text>

        <rect x="378" y="42" width="242" height="90" rx="8" fill="#d1fae5" stroke="#10b981" />
        <text x="499" y="61" textAnchor="middle" fontSize="11" fontWeight="800" fill="#065f46">東部ガンジス〜アッサム</text>
        <text x="499" y="79" textAnchor="middle" fontSize="9.5" fill="#064e3b">1000〜3000mm超（Cw・Aw）</text>
        <text x="499" y="96" textAnchor="middle" fontSize="9.5" fill="#334155">水稲（主穀）・ジュート・茶（アッサム）</text>
        <text x="499" y="113" textAnchor="middle" fontSize="9.5" fill="#334155">チョタナグプル炭田鉄山・コルカタ</text>

        <rect x="315" y="140" width="305" height="75" rx="8" fill="#e0e7ff" stroke="#6366f1" />
        <text x="467" y="159" textAnchor="middle" fontSize="11" fontWeight="800" fill="#3730a3">南インド（ドラヴィダ語系）</text>
        <text x="467" y="177" textAnchor="middle" fontSize="9.5" fill="#312e81">ベンガルール（標高900m冷涼・ITシリコンバレー）</text>
        <text x="467" y="194" textAnchor="middle" fontSize="9.5" fill="#334155">東岸チェンナイは冬10〜12月に北東モンスーン最多雨！</text>
      </svg>
    );
  }

  if (diagramId === 'sub_bra') {
    return (
      <svg viewBox="0 0 640 225" className="w-full rounded-xl border border-slate-200 bg-white">
        <rect x="0" y="0" width="640" height="225" fill="#f8fafc" />
        <text x="16" y="22" fontSize="12" fontWeight="800" fill="#1e293b">
          ブラジル：アマゾン開発・セラード緑地革命・ノルデステ乾燥と南東部軸
        </text>
        <rect x="20" y="42" width="290" height="75" rx="8" fill="#d1fae5" stroke="#059669" />
        <text x="165" y="61" textAnchor="middle" fontSize="11" fontWeight="800" fill="#065f46">北部：アマゾン盆地（Af・セルバ）</text>
        <text x="165" y="79" textAnchor="middle" fontSize="9.5" fill="#334155">カラジャス鉄山＋ツクルイ水力アルミ精錬</text>
        <text x="165" y="96" textAnchor="middle" fontSize="9.5" fill="#334155">マナウス自由貿易区（家電/二輪）と森林伐採</text>

        <rect x="330" y="42" width="290" height="75" rx="8" fill="#fef3c7" stroke="#f59e0b" />
        <text x="475" y="61" textAnchor="middle" fontSize="11" fontWeight="800" fill="#92400e">北東部：ノルデステ（沿岸Am / 内陸BS）</text>
        <text x="475" y="79" textAnchor="middle" fontSize="9.5" fill="#334155">沿岸＝サトウキビ奴隷史・アフリカ系住民多</text>
        <text x="475" y="96" textAnchor="middle" fontSize="9.5" fill="#334155">内陸セルタン＝半乾燥BS干ばつ・国内出稼ぎ源</text>

        <rect x="20" y="130" width="290" height="80" rx="8" fill="#fef9c3" stroke="#eab308" />
        <text x="165" y="150" textAnchor="middle" fontSize="11" fontWeight="800" fill="#854d0e">中西部：カンポ・セラード（Aw）</text>
        <text x="165" y="168" textAnchor="middle" fontSize="9.5" fill="#713f12">酸性土壌に石灰＋根粒菌大豆で世界的輸出基地！</text>
        <text x="165" y="186" textAnchor="middle" fontSize="9.5" fill="#334155">大豆・トウモロコシ・肉牛・遷都ブラジリア</text>

        <rect x="330" y="130" width="290" height="80" rx="8" fill="#e0e7ff" stroke="#6366f1" />
        <text x="475" y="150" textAnchor="middle" fontSize="11" fontWeight="800" fill="#3730a3">南東部＆南部（Cw・Cfa・テラローシャ）</text>
        <text x="475" y="168" textAnchor="middle" fontSize="9.5" fill="#312e81">SP工業金融・コーヒー・サトウキビ（エタノール）</text>
        <text x="475" y="186" textAnchor="middle" fontSize="9.5" fill="#334155">ミナス鉄鉱石・イタイプ巨大水力（水力約7割）</text>
      </svg>
    );
  }

  if (diagramId === 'sub_rus') {
    return (
      <svg viewBox="0 0 640 225" className="w-full rounded-xl border border-slate-200 bg-white">
        <rect x="0" y="0" width="640" height="225" fill="#f8fafc" />
        <text x="16" y="22" fontSize="12" fontWeight="800" fill="#1e293b">
          ロシア東西対比：欧州ロシア（黒土・人口3/4）× ウラル山脈 × シベリア資源・永久凍土
        </text>
        <rect x="20" y="42" width="190" height="165" rx="8" fill="#dbeafe" stroke="#3b82f6" />
        <text x="115" y="61" textAnchor="middle" fontSize="11" fontWeight="800" fill="#1e40af">欧州ロシア（西側・人口75%）</text>
        <text x="115" y="80" textAnchor="middle" fontSize="9.5" fill="#1e3a8a">北：Df（ポドゾル）ライ麦・林業</text>
        <text x="115" y="99" textAnchor="middle" fontSize="9.5" fill="#1e3a8a">中央：モスクワ放射環状都市軸</text>
        <rect x="30" y="114" width="170" height="82" rx="6" fill="#fef3c7" stroke="#16a34a" />
        <text x="115" y="133" textAnchor="middle" fontSize="10" fontWeight="800" fill="#15803d">南部：チェルノーゼム（黒土）</text>
        <text x="115" y="151" textAnchor="middle" fontSize="9" fill="#334155">冬小麦（世界トップ級輸出）</text>
        <text x="115" y="168" textAnchor="middle" fontSize="9" fill="#334155">ヒマワリ・テンサイ・黒海積出</text>

        <line x1="224" y1="36" x2="224" y2="212" stroke="#b45309" strokeWidth="4" strokeDasharray="4,3" />
        <text x="224" y="221" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#92400e">ウラル(60°E)</text>

        <rect x="238" y="42" width="185" height="165" rx="8" fill="#fef3c7" stroke="#f59e0b" />
        <text x="330" y="61" textAnchor="middle" fontSize="11" fontWeight="800" fill="#92400e">ウラル〜西シベリア低地</text>
        <text x="330" y="83" textAnchor="middle" fontSize="9.5" fill="#334155">ウラル古期山地＝鉄・非鉄金属</text>
        <text x="330" y="103" textAnchor="middle" fontSize="9.5" fill="#334155">チュメニ原油・ウレンゴイ天然ガス</text>
        <text x="330" y="123" textAnchor="middle" fontSize="9.5" fill="#334155">低湿平原・パイプライン網</text>
        <text x="330" y="143" textAnchor="middle" fontSize="9.5" fill="#334155">南縁にチェルノーゼム延長</text>

        <rect x="435" y="42" width="185" height="165" rx="8" fill="#f3e8ff" stroke="#8b5cf6" />
        <text x="527" y="61" textAnchor="middle" fontSize="11" fontWeight="800" fill="#5b21b6">東シベリア＆極東（Dw極寒）</text>
        <text x="527" y="83" textAnchor="middle" fontSize="9.5" fill="#334155">年較差60℃（ヤクーツク）</text>
        <text x="527" y="103" textAnchor="middle" fontSize="9.5" fill="#334155">連続永久凍土→高床式杭基礎</text>
        <text x="527" y="123" textAnchor="middle" fontSize="9.5" fill="#334155">クズバス炭田・サハのダイヤ</text>
        <text x="527" y="143" textAnchor="middle" fontSize="9.5" fill="#334155">大水力アルミ精錬・タイガ木材</text>
      </svg>
    );
  }

  if (diagramId === 'sub_aus') {
    return (
      <svg viewBox="0 0 640 225" className="w-full rounded-xl border border-slate-200 bg-white">
        <rect x="0" y="0" width="640" height="225" fill="#f8fafc" />
        <text x="16" y="22" fontSize="12" fontWeight="800" fill="#1e293b">
          オーストラリア東西断面：西の鉄鉱石・内陸被圧地下水（大鑽井盆地）・東の古期造山帯石炭
        </text>
        {/* 地塊と盆地断面 */}
        <polygon points="20,175 20,115 190,118 270,148 395,148 485,84 550,152 620,152 620,175" fill="#fde68a" stroke="#b45309" strokeWidth="1.5" />
        <rect x="20" y="175" width="600" height="40" fill="#f1f5f9" />
        {/* 各ゾーン */}
        <text x="105" y="70" textAnchor="middle" fontSize="11" fontWeight="800" fill="#b91c1c">西・ピルバラ盾状地</text>
        <text x="105" y="88" textAnchor="middle" fontSize="9.5" fill="#334155">安定陸塊（鉄鉱石・リチウム）</text>
        <text x="105" y="103" textAnchor="middle" fontSize="9" fill="#7f1d1d">BW砂漠・南西端パースCs</text>

        <text x="330" y="70" textAnchor="middle" fontSize="11" fontWeight="800" fill="#b45309">中央低地（大鑽井盆地）</text>
        <text x="330" y="88" textAnchor="middle" fontSize="9.5" fill="#334155">BS乾燥 / 東山地の雨が帯水層へ</text>
        <text x="330" y="103" textAnchor="middle" fontSize="9" fill="#92400e">塩分含む自噴井→家畜（羊）飲料</text>
        <line x1="330" y1="112" x2="330" y2="156" stroke="#0284c7" strokeWidth="2.5" strokeDasharray="3,2" />

        <text x="485" y="55" textAnchor="middle" fontSize="11" fontWeight="800" fill="#047857">グレートディバイディング</text>
        <text x="485" y="70" textAnchor="middle" fontSize="9.5" fill="#065f46">古期造山帯・石炭ベルト</text>

        <text x="580" y="110" textAnchor="middle" fontSize="10" fontWeight="800" fill="#1e40af">太平洋岸</text>
        <text x="580" y="126" textAnchor="middle" fontSize="9" fill="#334155">湿潤Cfa・Am</text>
        <text x="580" y="140" textAnchor="middle" fontSize="9" fill="#334155">シドニー・砂糖</text>

        <text x="320" y="198" textAnchor="middle" fontSize="10" fontWeight="700" fill="#1e293b">
          重要暗記：『西は鉄鉱石、東は石炭』『羊は砂漠ど真ん中でなく年250〜750mm帯＋南東に集中』
        </text>
      </svg>
    );
  }

  // その他の16カ国については全境界線を対比可視化するクリーンな動的模式図を自動生成
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="mb-2 text-[11px] font-extrabold text-slate-700">
        {countryNameJa}：主要境界線による国内対比イメージ（{subnational.boundaryLines.length}本・{subnational.zones.length}地域）
      </div>
      <div className="space-y-2">
        {subnational.boundaryLines.map((line) => (
          <div key={line.id} className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            <div
              className="flex items-center justify-between px-2.5 py-1 text-[11px] font-bold text-white"
              style={{ backgroundColor: line.color }}
            >
              <span>{line.name}</span>
              <span className="rounded bg-black/20 px-1.5 py-0.5 text-[9.5px]">{line.criterion}</span>
            </div>
            <div className="grid grid-cols-1 gap-1.5 p-2 text-[11px] sm:grid-cols-2">
              <div className="rounded bg-white p-2 shadow-2xs">
                <div className="font-bold text-slate-800">{line.sideALabel.split('：')[0]}</div>
                <p className="mt-0.5 text-slate-600">{line.sideALabel.split('：').slice(1).join('：') || line.sideALabel}</p>
              </div>
              <div className="rounded bg-white p-2 shadow-2xs">
                <div className="font-bold text-slate-800">{line.sideBLabel.split('：')[0]}</div>
                <p className="mt-0.5 text-slate-600">{line.sideBLabel.split('：').slice(1).join('：') || line.sideBLabel}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
