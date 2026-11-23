/**
 * 系統地理・日本地形図マスター用の軽量インラインSVG模式図群
 * （暗記モードなし：視覚的構造・メカニズムを一目で理解・記憶するための図解コンポーネント）
 */
export function GeoDiagramRenderer({ diagramId }: { diagramId?: string }) {
  if (!diagramId) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
      {diagramId === 'river_landform' && <RiverLandformSvg />}
      {diagramId === 'plate_depth' && <PlateDepthSvg />}
      {diagramId === 'koppen_flow' && <KoppenFlowSvg />}
      {diagramId === 'soil_zonation' && <SoilZonationSvg />}
      {diagramId === 'co2_hemisphere' && <Co2HemisphereSvg />}
      {diagramId === 'settlement_patterns' && <SettlementPatternsSvg />}
      {diagramId === 'urban_structure' && <UrbanStructureSvg />}
      {diagramId === 'demographic_transition' && <DemographicTransitionSvg />}
      {diagramId === 'contour_landforms' && <ContourLandformsSvg />}
    </div>
  );
}

function RiverLandformSvg() {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-extrabold text-slate-700">
        模式図：河川の上流〜下流と土地利用・災害リスク
      </div>
      <svg viewBox="0 0 640 215" className="w-full select-none">
        <rect x="0" y="0" width="640" height="215" rx="8" fill="#f8fafc" />
        {/* 空と海 */}
        <rect x="500" y="135" width="140" height="80" fill="#bae6fd" />
        <text x="570" y="160" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0369a1">
          海（三角州へ堆積）
        </text>
        {/* 地形断面 */}
        <path
          d="M0,30 L90,85 L220,122 L280,122 C295,112 315,112 330,126 L410,136 C425,118 440,118 455,134 L535,142 L560,175 L0,175 Z"
          fill="#e2e8f0"
          stroke="#475569"
          strokeWidth="1.8"
        />
        {/* 扇状地 礫層強調 */}
        <path d="M90,85 L220,122 L110,122 Z" fill="#fef3c7" opacity="0.85" />
        {/* 伏流水ライン */}
        <path
          d="M90,86 Q155,118 220,122"
          fill="none"
          stroke="#0284c7"
          strokeWidth="2.5"
          strokeDasharray="4 3"
        />
        <circle cx="220" cy="122" r="4.5" fill="#0284c7" />
        {/* 河道位置 */}
        <path d="M312,118 L318,125 L306,125 Z" fill="#0284c7" />
        <path d="M437,120 L443,128 L431,128 Z" fill="#0284c7" />

        {/* ラベルボックス */}
        <text x="44" y="24" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#7c2d12">
          V字谷（山地）
        </text>
        <text x="44" y="38" textAnchor="middle" fontSize="9.5" fill="#78350f">
          下方侵食・ダム
        </text>

        <text x="155" y="72" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#b45309">
          扇状地（扇央＝水無川）
        </text>
        <text x="155" y="85" textAnchor="middle" fontSize="9.5" fill="#92400e">
          礫・砂：果樹園・桑畑
        </text>
        <text x="155" y="97" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#dc2626">
          ⚠ 扇頂は土石流注意
        </text>

        <text x="232" y="148" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#0369a1">
          扇端（湧水帯）
        </text>
        <text x="232" y="160" textAnchor="middle" fontSize="9" fill="#0c4a6e">
          古集落・水田
        </text>

        <text x="315" y="90" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#15803d">
          自然堤防（微高地）
        </text>
        <text x="315" y="103" textAnchor="middle" fontSize="9" fill="#166534">
          砂質：古集落・畑・桑
        </text>

        <text x="372" y="60" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#1d4ed8">
          後背湿地・旧河道
        </text>
        <text x="372" y="73" textAnchor="middle" fontSize="9" fill="#1e40af">
          粘土質：水田
        </text>
        <text x="372" y="85" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#dc2626">
          ⚠ 浸水・液状化危険
        </text>
        <line x1="372" y1="90" x2="372" y2="128" stroke="#64748b" strokeDasharray="2 2" />

        <text x="495" y="106" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#0f766e">
          三角州（デルタ）
        </text>
        <text x="495" y="119" textAnchor="middle" fontSize="9" fill="#115e59">
          細粒泥・低平：水田・港
        </text>
        <text x="495" y="131" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#dc2626">
          ⚠ 高潮・0m地帯浸水
        </text>
      </svg>
    </div>
  );
}

function PlateDepthSvg() {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-extrabold text-slate-700">
        模式図：プレート境界の型と震源の深さ・火山分布（断面比較）
      </div>
      <svg viewBox="0 0 640 200" className="w-full select-none">
        <rect x="0" y="0" width="640" height="200" rx="8" fill="#f8fafc" />
        {/* 左：狭まる境界 */}
        <rect x="10" y="10" width="300" height="180" rx="6" fill="#fff" stroke="#e2e8f0" />
        <text x="160" y="28" textAnchor="middle" fontSize="11.5" fontWeight="bold" fill="#b91c1c">
          ① 狭まる境界（海溝・島弧）
        </text>
        {/* 大陸地殻と海溝 */}
        <path d="M20,90 L130,90 L160,115 L180,82 L220,82 L235,55 L250,82 L300,82 L300,175 L20,175 Z" fill="#fef2f2" stroke="#991b1b" strokeWidth="1.2" />
        {/* 沈み込みプレート */}
        <path d="M20,90 L150,92 L290,175 L250,175 L135,105 L20,105 Z" fill="#cbd5e1" stroke="#475569" />
        {/* 震源分布 (浅→深傾斜) */}
        <circle cx="145" cy="98" r="4" fill="#ef4444" />
        <circle cx="172" cy="112" r="4" fill="#ef4444" />
        <circle cx="202" cy="128" r="4" fill="#f97316" />
        <circle cx="235" cy="146" r="4.5" fill="#7c3aed" />
        <circle cx="268" cy="164" r="4.5" fill="#7c3aed" />
        {/* 火山マーク */}
        <polygon points="235,44 228,56 242,56" fill="#dc2626" />
        <text x="160" y="50" textAnchor="middle" fontSize="9.5" fill="#0369a1" fontWeight="bold">
          海溝（深海・津波発生源）
        </text>
        <text x="255" y="42" textAnchor="middle" fontSize="9.5" fill="#dc2626" fontWeight="bold">
          成層火山
        </text>
        <text x="160" y="182" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#7c3aed">
          震源は海溝から大陸側へ傾斜し深発(300km超)あり
        </text>

        {/* 右：広がる境界 */}
        <rect x="330" y="10" width="300" height="180" rx="6" fill="#fff" stroke="#e2e8f0" />
        <text x="480" y="28" textAnchor="middle" fontSize="11.5" fontWeight="bold" fill="#0369a1">
          ② 広がる境界（海嶺・地溝帯）
        </text>
        <path d="M340,95 L445,95 L468,72 L480,82 L492,72 L515,95 L620,95 L620,175 L340,175 Z" fill="#f0f9ff" stroke="#0369a1" strokeWidth="1.2" />
        {/* マントル上昇矢印 */}
        <path d="M480,160 L480,88" stroke="#f97316" strokeWidth="3" />
        <path d="M465,86 L430,86 M495,86 L530,86" stroke="#0284c7" strokeWidth="2.5" />
        {/* 浅発地震のみ */}
        <circle cx="472" cy="85" r="3.8" fill="#ef4444" />
        <circle cx="480" cy="92" r="3.8" fill="#ef4444" />
        <circle cx="488" cy="85" r="3.8" fill="#ef4444" />
        <text x="480" y="60" textAnchor="middle" fontSize="9.5" fill="#0284c7" fontWeight="bold">
          海嶺（アイスランド・大西洋中央海嶺）
        </text>
        <text x="480" y="182" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#dc2626">
          震源はすべて浅発（30km以浅）のみ！
        </text>
      </svg>
    </div>
  );
}

function KoppenFlowSvg() {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-extrabold text-slate-700">
        ケッペン気候区分・雨温図判別フローチャート（最寒月・最暖月・降水配分）
      </div>
      <svg viewBox="0 0 640 205" className="w-full select-none">
        <rect x="0" y="0" width="640" height="205" rx="8" fill="#f8fafc" />
        {/* Step 1: 最暖月 < 10 */}
        <rect x="14" y="16" width="135" height="44" rx="8" fill="#e0f2fe" stroke="#0284c7" />
        <text x="81" y="34" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#0c4a6e">
          ① 最暖月 ＜ 10℃ ?
        </text>
        <text x="81" y="50" textAnchor="middle" fontSize="9.5" fill="#0369a1">
          （無樹木気候）
        </text>
        <line x1="81" y1="60" x2="81" y2="95" stroke="#0284c7" strokeWidth="1.5" />
        <rect x="14" y="95" width="135" height="46" rx="8" fill="#38bdf8" opacity="0.25" stroke="#0284c7" />
        <text x="81" y="114" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0c4a6e">
          YES → 寒帯 (E)
        </text>
        <text x="81" y="130" textAnchor="middle" fontSize="9.5" fill="#0369a1">
          0〜10℃:ET / ＜0℃:EF
        </text>

        {/* Arrow NO -> Step 2 */}
        <line x1="149" y1="38" x2="178" y2="38" stroke="#64748b" strokeWidth="1.5" />
        <rect x="178" y="16" width="142" height="44" rx="8" fill="#fef3c7" stroke="#d97706" />
        <text x="249" y="34" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#78350f">
          ② 年降水量が少ない?
        </text>
        <text x="249" y="50" textAnchor="middle" fontSize="9" fill="#92400e">
          (乾燥限界未満・約500mm目安)
        </text>
        <line x1="249" y1="60" x2="249" y2="95" stroke="#d97706" strokeWidth="1.5" />
        <rect x="178" y="95" width="142" height="46" rx="8" fill="#fde68a" opacity="0.6" stroke="#d97706" />
        <text x="249" y="114" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#78350f">
          YES → 乾燥帯 (B)
        </text>
        <text x="249" y="130" textAnchor="middle" fontSize="9.5" fill="#92400e">
          極少:BW(砂漠) / 草原:BS
        </text>

        {/* Arrow NO -> Step 3 */}
        <line x1="320" y1="38" x2="348" y2="38" stroke="#64748b" strokeWidth="1.5" />
        <rect x="348" y="16" width="276" height="44" rx="8" fill="#dcfce7" stroke="#16a34a" />
        <text x="486" y="34" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#14532d">
          ③ 樹木気候：最寒月の平均気温で A / C / D に分類
        </text>
        <text x="486" y="50" textAnchor="middle" fontSize="9.5" fill="#166534">
          境界は【18℃】と【−3℃】の2本だけ！
        </text>

        {/* 3分岐ボックス */}
        <line x1="486" y1="60" x2="400" y2="92" stroke="#16a34a" strokeWidth="1.5" />
        <line x1="486" y1="60" x2="495" y2="92" stroke="#16a34a" strokeWidth="1.5" />
        <line x1="486" y1="60" x2="585" y2="92" stroke="#16a34a" strokeWidth="1.5" />

        <rect x="342" y="92" width="90" height="98" rx="7" fill="#fee2e2" stroke="#dc2626" />
        <text x="387" y="110" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#991b1b">
          ≧ 18℃: A
        </text>
        <text x="387" y="126" textAnchor="middle" fontSize="9" fill="#7f1d1d">
          Af: 最少月≧60
        </text>
        <text x="387" y="140" textAnchor="middle" fontSize="9" fill="#7f1d1d">
          Am: 短乾季+多雨
        </text>
        <text x="387" y="154" textAnchor="middle" fontSize="9" fill="#7f1d1d">
          Aw: 明瞭な乾季
        </text>
        <text x="387" y="174" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#991b1b">
          熱帯雨林・サバナ
        </text>

        <rect x="440" y="92" width="94" height="98" rx="7" fill="#dcfce7" stroke="#16a34a" />
        <text x="487" y="110" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#14532d">
          -3〜18℃: C
        </text>
        <text x="487" y="126" textAnchor="middle" fontSize="9" fill="#14532d">
          Cs: 夏乾(3倍)
        </text>
        <text x="487" y="140" textAnchor="middle" fontSize="9" fill="#14532d">
          Cw: 冬乾(10倍)
        </text>
        <text x="487" y="154" textAnchor="middle" fontSize="9" fill="#14532d">
          Cfa: 最暖月≧22℃
        </text>
        <text x="487" y="168" textAnchor="middle" fontSize="9" fill="#14532d">
          Cfb: 最暖月＜22℃
        </text>

        <rect x="542" y="92" width="84" height="98" rx="7" fill="#f3e8ff" stroke="#7c3aed" />
        <text x="584" y="110" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#4c1d95">
          ＜ -3℃: D
        </text>
        <text x="584" y="128" textAnchor="middle" fontSize="9" fill="#5b21b6">
          Df: 年中湿潤
        </text>
        <text x="584" y="144" textAnchor="middle" fontSize="9" fill="#5b21b6">
          Dw: 冬極乾燥
        </text>
        <text x="584" y="164" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#4c1d95">
          タイガ・ポドゾル
        </text>
      </svg>
    </div>
  );
}

function SoilZonationSvg() {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-extrabold text-slate-700">
        模式図：気温 × 降水量による『成帯土壌』と植生の対応関係
      </div>
      <svg viewBox="0 0 640 190" className="w-full select-none">
        <rect x="0" y="0" width="640" height="190" rx="8" fill="#f8fafc" />
        {/* 軸ラベル */}
        <text x="330" y="22" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#334155">
          ← 湿潤（多雨）　　　　　降水量（蒸発量とのバランス）　　　　　乾燥（少雨） →
        </text>
        {/* 4行の気候帯土壌帯 */}
        <rect x="20" y="34" width="600" height="32" rx="6" fill="#e0f2fe" stroke="#7dd3fc" />
        <text x="110" y="54" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#0c4a6e">
          寒帯 (E)
        </text>
        <text x="370" y="54" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#0369a1">
          ツンドラ土（永久凍土上・強酸性・コケ地衣類）
        </text>

        <rect x="20" y="72" width="600" height="32" rx="6" fill="#f3e8ff" stroke="#c084fc" />
        <text x="110" y="92" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#4c1d95">
          亜寒帯 (D)
        </text>
        <text x="370" y="92" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#6b21a8">
          ポドゾル（タイガ針葉樹林下・灰白色・酸性やせ地）
        </text>

        <rect x="20" y="110" width="320" height="34" rx="6" fill="#dcfce7" stroke="#4ade80" />
        <text x="180" y="131" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#14532d">
          褐色森林土（温帯C・広葉樹・混合農業）
        </text>

        <rect x="348" y="110" width="150" height="34" rx="6" fill="#1e293b" stroke="#0f172a" />
        <text x="423" y="126" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#fde047">
          チェルノーゼム・プレーリー土
        </text>
        <text x="423" y="139" textAnchor="middle" fontSize="8.5" fill="#e2e8f0">
          ステップ肥沃黒土（小麦帯）
        </text>

        <rect x="504" y="110" width="116" height="72" rx="6" fill="#fef3c7" stroke="#d97706" />
        <text x="562" y="142" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#92400e">
          砂漠土
        </text>
        <text x="562" y="158" textAnchor="middle" fontSize="9" fill="#b45309">
          アルカリ・塩集積
        </text>

        <rect x="20" y="150" width="478" height="32" rx="6" fill="#fee2e2" stroke="#f87171" />
        <text x="259" y="170" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#991b1b">
          熱帯 (A)：ラトソル（赤色・高温多雨で養分流亡・鉄アルミ残存→ボーキサイト）
        </text>
      </svg>
    </div>
  );
}

function Co2HemisphereSvg() {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-extrabold text-slate-700">
        大気中CO₂濃度の季節変動：北半球（大振幅）vs 南半球（小振幅）
      </div>
      <svg viewBox="0 0 640 165" className="w-full select-none">
        <rect x="0" y="0" width="640" height="165" rx="8" fill="#f8fafc" />
        <line x1="60" y1="135" x2="600" y2="135" stroke="#64748b" strokeWidth="1.5" />
        <line x1="60" y1="20" x2="60" y2="135" stroke="#64748b" strokeWidth="1.5" />
        {/* 2年分季節曲線 */}
        <path
          d="M60,72 Q105,40 150,72 T240,95 T330,36 T420,68 T510,88 T590,32"
          fill="none"
          stroke="#dc2626"
          strokeWidth="2.8"
        />
        <path
          d="M60,76 L330,72 L590,67"
          fill="none"
          stroke="#0284c7"
          strokeWidth="2.8"
          strokeDasharray="6 3"
        />
        <text x="150" y="28" fontSize="10" fontWeight="bold" fill="#dc2626">
          春山（光合成前）→ 夏〜秋に光合成で急低下！
        </text>
        <text x="455" y="114" fontSize="10.5" fontWeight="bold" fill="#dc2626">
          ── 北半球中〜高緯度（大振幅）
        </text>
        <text x="455" y="54" fontSize="10.5" fontWeight="bold" fill="#0284c7">
          --- 南半球（海洋多くほぼ平坦）
        </text>
        <text x="330" y="152" textAnchor="middle" fontSize="9.5" fill="#475569">
          1月　　　　7月（北夏）　　　　1月　　　　7月（北夏）　　　　1月
        </text>
      </svg>
    </div>
  );
}

function SettlementPatternsSvg() {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-extrabold text-slate-700">
        模式図：代表的な村落・集落形態6選
      </div>
      <svg viewBox="0 0 640 135" className="w-full select-none">
        <rect x="0" y="0" width="640" height="135" rx="8" fill="#f8fafc" />
        {/* 1. 塊村 */}
        <g transform="translate(15,12)">
          <rect width="92" height="92" rx="6" fill="#fff" stroke="#cbd5e1" />
          <circle cx="46" cy="46" r="14" fill="#cbd5e1" />
          {[[-12, -10], [8, -14], [14, 4], [-10, 12], [2, 2], [-2, -2]].map(([dx, dy], i) => (
            <rect key={i} x={43 + dx} y={43 + dy} width="7" height="7" fill="#dc2626" />
          ))}
          <text x="46" y="110" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1e293b">
            塊村（湧水/条里）
          </text>
        </g>
        {/* 2. 散村 */}
        <g transform="translate(119,12)">
          <rect width="92" height="92" rx="6" fill="#fff" stroke="#cbd5e1" />
          {[[14, 16], [62, 18], [32, 42], [70, 56], [18, 72], [52, 76]].map(([x, y], i) => (
            <g key={i}>
              <circle cx={x + 4} cy={y + 4} r="8" fill="#bbf7d0" />
              <rect x={x} y={y} width="7" height="7" fill="#dc2626" />
            </g>
          ))}
          <text x="46" y="110" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1e293b">
            散村（砺波平野）
          </text>
        </g>
        {/* 3. 路村・新田 */}
        <g transform="translate(223,12)">
          <rect width="92" height="92" rx="6" fill="#fff" stroke="#cbd5e1" />
          <line x1="10" y1="46" x2="82" y2="46" stroke="#64748b" strokeWidth="3" />
          {[16, 30, 44, 58, 72].map((x, i) => (
            <g key={i}>
              <rect x={x} y="34" width="6" height="6" fill="#dc2626" />
              <rect x={x} y="52" width="6" height="6" fill="#dc2626" />
              <line x1={x + 3} y1="10" x2={x + 3} y2="33" stroke="#86efac" strokeWidth="1" />
              <line x1={x + 3} y1="59" x2={x + 3} y2="82" stroke="#86efac" strokeWidth="1" />
            </g>
          ))}
          <text x="46" y="110" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1e293b">
            新田/路村（短冊）
          </text>
        </g>
        {/* 4. 円村 */}
        <g transform="translate(327,12)">
          <rect width="92" height="92" rx="6" fill="#fff" stroke="#cbd5e1" />
          <circle cx="46" cy="46" r="14" fill="#dcfce7" stroke="#86efac" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
            const rad = (deg * Math.PI) / 180;
            return (
              <rect
                key={i}
                x={43 + 22 * Math.cos(rad)}
                y={43 + 22 * Math.sin(rad)}
                width="6"
                height="6"
                fill="#dc2626"
              />
            );
          })}
          <text x="46" y="110" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1e293b">
            円村（中欧防衛）
          </text>
        </g>
        {/* 5. 環濠集落 */}
        <g transform="translate(431,12)">
          <rect width="92" height="92" rx="6" fill="#fff" stroke="#cbd5e1" />
          <rect x="20" y="20" width="52" height="52" rx="4" fill="none" stroke="#0284c7" strokeWidth="4" />
          {[[30, 30], [44, 32], [52, 46], [34, 52], [48, 54]].map(([x, y], i) => (
            <rect key={i} x={x} y={y} width="7" height="7" fill="#dc2626" />
          ))}
          <text x="46" y="110" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1e293b">
            環濠集落（奈良）
          </text>
        </g>
        {/* 6. 屯田兵・タウンシップ */}
        <g transform="translate(535,12)">
          <rect width="92" height="92" rx="6" fill="#fff" stroke="#cbd5e1" />
          <path d="M10,30 H82 M10,60 H82 M30,10 V82 M60,10 V82" stroke="#64748b" strokeWidth="1.4" />
          {[[26, 26], [56, 26], [26, 56], [56, 56]].map(([x, y], i) => (
            <rect key={i} x={x} y={y} width="7" height="7" fill="#dc2626" />
          ))}
          <text x="46" y="110" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1e293b">
            屯田兵・米国格子
          </text>
        </g>
      </svg>
    </div>
  );
}

function UrbanStructureSvg() {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-extrabold text-slate-700">
        模式図：先進国都市モデル vs 途上国大都市の二極化比較
      </div>
      <svg viewBox="0 0 640 165" className="w-full select-none">
        <rect x="0" y="0" width="640" height="165" rx="8" fill="#f8fafc" />
        {/* 左：先進国（バージェス・現代再開発） */}
        <g transform="translate(15,10)">
          <rect width="295" height="145" rx="6" fill="#fff" stroke="#cbd5e1" />
          <text x="148" y="18" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#1e40af">
            ① 先進国都市（欧米・日本モデル）
          </text>
          <circle cx="148" cy="84" r="56" fill="#dcfce7" stroke="#22c55e" />
          <circle cx="148" cy="84" r="36" fill="#fef3c7" stroke="#f59e0b" />
          <circle cx="148" cy="84" r="16" fill="#4f46e5" />
          <text x="148" y="88" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#fff">
            CBD
          </text>
          <text x="148" y="59" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#92400e">
            インナーシティ（近年ジェントリフィケーション）
          </text>
          <text x="148" y="38" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#166534">
            郊外住宅（ニュータウン/欧米高所得層）
          </text>
        </g>
        {/* 右：途上国大都市 */}
        <g transform="translate(330,10)">
          <rect width="295" height="145" rx="6" fill="#fff" stroke="#cbd5e1" />
          <text x="148" y="18" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#b91c1c">
            ② 開発途上国大都市（二極化構造）
          </text>
          <circle cx="148" cy="84" r="56" fill="#fee2e2" stroke="#ef4444" strokeDasharray="3 2" />
          <circle cx="148" cy="84" r="24" fill="#0ea5e9" opacity="0.25" stroke="#0284c7" />
          <circle cx="148" cy="84" r="14" fill="#0369a1" />
          <rect x="174" y="66" width="22" height="14" rx="2" fill="#f59e0b" />
          <text x="148" y="88" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#fff">
            都心
          </text>
          <text x="206" y="76" fontSize="8" fontWeight="bold" fill="#92400e">
            ゲーテッド(富裕)
          </text>
          <text x="148" y="40" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#991b1b">
            周辺のスラム・不法占拠（インフォーマル）
          </text>
          <text x="148" y="132" textAnchor="middle" fontSize="8" fill="#7f1d1d">
            地方農村からの過剰人口流入（プライメートシティ化）
          </text>
        </g>
      </svg>
    </div>
  );
}

function DemographicTransitionSvg() {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-extrabold text-slate-700">
        模式図：人口転換4段階と人口ボーナス・自然減への推移
      </div>
      <svg viewBox="0 0 640 185" className="w-full select-none">
        <rect x="0" y="0" width="640" height="185" rx="8" fill="#f8fafc" />
        {/* 4段階区切り */}
        <rect x="30" y="25" width="130" height="125" fill="#f1f5f9" />
        <rect x="160" y="25" width="150" height="125" fill="#fef3c7" opacity="0.55" />
        <rect x="310" y="25" width="155" height="125" fill="#dcfce7" opacity="0.5" />
        <rect x="465" y="25" width="150" height="125" fill="#fee2e2" opacity="0.45" />

        {/* 出生率 (赤) & 死亡率 (青) */}
        <path
          d="M35,50 L165,52 C225,52 290,72 340,108 C395,126 460,130 610,134"
          fill="none"
          stroke="#dc2626"
          strokeWidth="3"
        />
        <path
          d="M35,56 C100,56 145,58 175,85 C215,118 280,126 370,128 C445,128 530,122 610,118"
          fill="none"
          stroke="#2563eb"
          strokeWidth="3"
        />
        {/* テキスト */}
        <text x="95" y="42" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#334155">
          第1: 多産多死
        </text>
        <text x="235" y="42" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#92400e">
          第2: 人口爆発
        </text>
        <text x="387" y="42" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#166534">
          第3: 少産少死移行
        </text>
        <text x="540" y="42" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#991b1b">
          第4: 少子高齢(減)
        </text>

        <text x="235" y="88" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#b45309">
          死亡率先に低下
        </text>
        <text x="235" y="100" textAnchor="middle" fontSize="9" fill="#92400e">
          (アフリカ途上国)
        </text>
        <text x="387" y="92" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#15803d">
          人口ボーナス期
        </text>
        <text x="540" y="108" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#dc2626">
          死亡率 ＞ 出生率
        </text>
        <text x="540" y="144" textAnchor="middle" fontSize="8.5" fill="#991b1b">
          (日・独・韓：つぼ型)
        </text>
        <text x="320" y="172" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#475569">
          ― 赤：粗出生率　　　― 青：粗死亡率（第4段階では高齢化により死亡率がわずかに再上昇！）
        </text>
      </svg>
    </div>
  );
}

function ContourLandformsSvg() {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-extrabold text-slate-700">
        模式図：等高線の『尾根と谷』・『緩斜面と急斜面』・縮尺比較
      </div>
      <svg viewBox="0 0 640 165" className="w-full select-none">
        <rect x="0" y="0" width="640" height="165" rx="8" fill="#f8fafc" />
        {/* 尾根 vs 谷 */}
        <g transform="translate(15,12)">
          <rect width="295" height="140" rx="6" fill="#fff" stroke="#cbd5e1" />
          <text x="147" y="18" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#1e293b">
            ① 等高線の張り出し：低い方へ突出＝尾根 / 高い方＝谷
          </text>
          <path d="M50,120 Q110,45 170,120" fill="none" stroke="#9a3412" strokeWidth="1.5" />
          <path d="M70,120 Q110,70 150,120" fill="none" stroke="#9a3412" strokeWidth="1.5" />
          <path d="M90,120 Q110,95 130,120" fill="none" stroke="#9a3412" strokeWidth="1.5" />
          <text x="110" y="133" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#9a3412">
            低地へ凸 → 尾根（高→低方向へ張り出す）
          </text>

          <path d="M180,45 Q230,120 275,45" fill="none" stroke="#0284c7" strokeWidth="1.5" />
          <path d="M195,45 Q230,100 260,45" fill="none" stroke="#0284c7" strokeWidth="1.5" />
          <line x1="230" y1="75" x2="230" y2="120" stroke="#0284c7" strokeWidth="2.5" strokeDasharray="3 2" />
          <text x="230" y="133" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#0369a1">
            高い方へV字入込 → 谷（川）
          </text>
        </g>

        {/* 縮尺比較 */}
        <g transform="translate(330,12)">
          <rect width="295" height="140" rx="6" fill="#fff" stroke="#cbd5e1" />
          <text x="147" y="18" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#1e293b">
            ② 1/25,000 vs 1/50,000 地形図の計算鉄則
          </text>
          <text x="20" y="46" fontSize="10" fontWeight="bold" fill="#4f46e5">
            • 1/25,000地形図（詳細・主曲線10m・計曲線50m毎）
          </text>
          <text x="28" y="62" fontSize="9.5" fill="#334155">
            図上の 1cm ＝ 実際 250m（4cm ＝ 1km）
          </text>
          <text x="20" y="88" fontSize="10" fontWeight="bold" fill="#059669">
            • 1/50,000地形図（広域・主曲線20m・計曲線100m毎）
          </text>
          <text x="28" y="104" fontSize="9.5" fill="#334155">
            図上の 1cm ＝ 実際 500m（2cm ＝ 1km）
          </text>
          <text x="20" y="128" fontSize="9.5" fontWeight="bold" fill="#dc2626">
            ⚠ 面積比＝縮尺比の2乗！（同じ図上面積で1/50,000は実面積4倍）
          </text>
        </g>
      </svg>
    </div>
  );
}
