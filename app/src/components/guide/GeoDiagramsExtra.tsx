/**
 * 系統地理・日本自然環境用の追加インラインSVG模式図群（10種）
 */
export function ExtraGeoDiagramRenderer({ diagramId }: { diagramId: string }) {
  switch (diagramId) {
    case 'erosion_cuesta_terrace':
      return <ErosionCuestaTerraceSvg />;
    case 'coastal_landforms':
      return <CoastalLandformsSvg />;
    case 'atmospheric_circulation':
      return <AtmosphericCirculationSvg />;
    case 'koppen_ideal_continent':
      return <KoppenIdealContinentSvg />;
    case 'ocean_currents_gyre':
      return <OceanCurrentsGyreSvg />;
    case 'whittlesey_thunen':
      return <WhittleseyThunenSvg />;
    case 'weber_industrial':
      return <WeberIndustrialSvg />;
    case 'religion_tree':
      return <ReligionTreeSvg />;
    case 'language_tree':
      return <LanguageTreeSvg />;
    case 'japan_tectonics_climate':
      return <JapanTectonicsClimateSvg />;
    default:
      return null;
  }
}

function ErosionCuestaTerraceSvg() {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-extrabold text-slate-700">
        模式図：侵食平野（ケスタ・メサ/ビュート・準平原）と洪積台地・河岸段丘
      </div>
      <svg viewBox="0 0 640 215" className="w-full select-none">
        <rect x="0" y="0" width="640" height="215" rx="8" fill="#f8fafc" />
        {/* 左：ケスタ地形（パリ盆地モデル） */}
        <g transform="translate(10,10)">
          <rect width="305" height="195" rx="6" fill="#fff" stroke="#cbd5e1" />
          <text x="152" y="18" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#7c2d12">
            ① ケスタ（傾いた硬軟地層：パリ盆地型）
          </text>
          {/* 地層表現 */}
          <path d="M18,165 L18,118 L112,92 L126,118 L210,95 L224,118 L288,100 L288,165 Z" fill="#fef3c7" stroke="#92400e" strokeWidth="1.5" />
          <path d="M18,136 L118,108 L130,132 L214,108 L228,132 L288,114" fill="none" stroke="#d97706" strokeWidth="1.4" strokeDasharray="4 2" />
          <text x="72" y="88" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#15803d">
            緩斜面：小麦・混合農業
          </text>
          <text x="135" y="128" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#9333ea">
            急崖：ブドウ
          </text>
          <text x="172" y="88" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#15803d">
            緩斜面（農耕）
          </text>
          <text x="248" y="128" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#9333ea">
            急崖(日照)
          </text>
          {/* メサ・ビュート注記 */}
          <rect x="14" y="146" width="277" height="40" rx="5" fill="#fffbeb" stroke="#fde68a" />
          <text x="152" y="161" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#78350f">
            水平硬軟層 → メサ（広卓上）→ 侵食進むとビュート（孤立丘）
          </text>
          <text x="152" y="177" textAnchor="middle" fontSize="9" fill="#92400e">
            準平原＝長期侵食で平坦（残丘＝硬岩残存：豪ウルル）
          </text>
        </g>

        {/* 右：洪積台地・河岸段丘（新旧と宙水・土地利用） */}
        <g transform="translate(325,10)">
          <rect width="305" height="195" rx="6" fill="#fff" stroke="#cbd5e1" />
          <text x="152" y="18" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0369a1">
            ② 洪積台地・河岸段丘の断面と土地利用
          </text>
          {/* 段丘断面 */}
          <path d="M15,52 L92,52 L110,96 L185,96 L202,135 L278,135 L278,150 L15,150 Z" fill="#e2e8f0" stroke="#475569" strokeWidth="1.6" />
          {/* 宙水層 */}
          <line x1="25" y1="68" x2="88" y2="68" stroke="#0284c7" strokeWidth="2.5" strokeDasharray="3 2" />
          <text x="56" y="81" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#0284c7">
            不透水層上の宙水
          </text>
          {/* 川 */}
          <ellipse cx="255" cy="136" rx="14" ry="5" fill="#38bdf8" />
          <text x="255" y="124" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#0284c7">
            河川(現在)
          </text>
          {/* ラベル */}
          <text x="54" y="42" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#b45309">
            高位(古い)段丘面
          </text>
          <text x="54" y="61" textAnchor="middle" fontSize="8.5" fill="#78350f">
            畑・果樹・新興宅地
          </text>
          <text x="148" y="88" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#15803d">
            中位段丘面（新しい）
          </text>
          <text x="108" y="114" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#dc2626">
            段丘崖(林・つづら折道路)
          </text>
          <text x="218" y="146" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#0369a1">
            沖積低地・水田・古集落
          </text>
          <rect x="14" y="156" width="277" height="30" rx="5" fill="#f0f9ff" stroke="#bae6fd" />
          <text x="152" y="175" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#0c4a6e">
            原則：川から離れて高い段丘面ほど古く、崖下の湧水帯に古集落！
          </text>
        </g>
      </svg>
    </div>
  );
}

function CoastalLandformsSvg() {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-extrabold text-slate-700">
        模式図：沈水海岸（リアス/フィヨルド/エスチュアリー）・離水海岸・砂州＆サンゴ礁
      </div>
      <svg viewBox="0 0 640 205" className="w-full select-none">
        <rect x="0" y="0" width="640" height="205" rx="8" fill="#f8fafc" />
        {/* 沈水海岸 3種 */}
        <g transform="translate(10,10)">
          <rect width="380" height="185" rx="6" fill="#fff" stroke="#cbd5e1" />
          <text x="190" y="18" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0369a1">
            ① 沈水海岸3タイプの決定的な違い
          </text>
          {/* リアス */}
          <rect x="12" y="28" width="112" height="106" rx="4" fill="#e0f2fe" />
          <path d="M12,28 L96,28 L55,50 L98,66 L52,84 L96,102 L48,118 L85,134 L12,134 Z" fill="#fef3c7" stroke="#92400e" />
          <text x="68" y="150" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#92400e">
            リアス海岸
          </text>
          <text x="68" y="164" textAnchor="middle" fontSize="8.5" fill="#475569">
            V字谷が沈水(中緯度)
          </text>
          <text x="68" y="176" textAnchor="middle" fontSize="8.5" fill="#dc2626">
            津波増幅・養殖漁業
          </text>
          {/* フィヨルド */}
          <rect x="134" y="28" width="112" height="106" rx="4" fill="#dbeafe" />
          <path d="M134,28 L236,28 L236,42 L152,58 L236,72 L236,92 L156,106 L236,118 L236,134 L134,134 Z" fill="#e2e8f0" stroke="#334155" />
          <text x="190" y="150" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1e293b">
            フィヨルド
          </text>
          <text x="190" y="164" textAnchor="middle" fontSize="8.5" fill="#475569">
            氷食U字谷が沈水(高緯度)
          </text>
          <text x="190" y="176" textAnchor="middle" fontSize="8.5" fill="#0284c7">
            急崖・極深・発電＋観光
          </text>
          {/* エスチュアリー */}
          <rect x="256" y="28" width="112" height="106" rx="4" fill="#e0f2fe" />
          <path d="M256,28 L352,28 C332,68 308,74 282,81 C308,88 332,94 352,134 L256,134 Z" fill="#dcfce7" stroke="#166534" />
          <text x="312" y="150" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#166534">
            エスチュアリー
          </text>
          <text x="312" y="164" textAnchor="middle" fontSize="8.5" fill="#475569">
            平野河口沈水(ラッパ状)
          </text>
          <text x="312" y="176" textAnchor="middle" fontSize="8.5" fill="#0f766e">
            大港湾(倫敦/ハンブルク)
          </text>
        </g>

        {/* 右：砂州・トンボロ＆サンゴ礁 */}
        <g transform="translate(400,10)">
          <rect width="230" height="185" rx="6" fill="#fff" stroke="#cbd5e1" />
          <text x="115" y="18" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#0f766e">
            ② 砂堆積＆サンゴ礁3段階
          </text>
          {/* 砂州とラグーン */}
          <rect x="12" y="28" width="206" height="62" rx="4" fill="#cffafe" />
          <path d="M12,28 L218,28 L218,46 Q115,32 12,48 Z" fill="#bbf7d0" stroke="#15803d" />
          <path d="M26,48 Q115,72 204,47" fill="none" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" />
          <text x="115" y="54" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#0e7490">
            ラグーン（潟湖：汽水湖）
          </text>
          <text x="115" y="79" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#b45309">
            砂州（天橋立・サロマ湖） / 島接続＝トンボロ
          </text>
          {/* サンゴ礁進化 */}
          <rect x="12" y="98" width="206" height="78" rx="4" fill="#f0f9ff" stroke="#bae6fd" />
          <text x="115" y="114" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#0369a1">
            サンゴ礁：裾礁 → 堡礁 → 環礁
          </text>
          <text x="115" y="131" textAnchor="middle" fontSize="8.5" fill="#334155">
            (島沈降/海面上昇に伴い沖へ成長・中央に礁湖)
          </text>
          <text x="115" y="148" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#dc2626">
            生育条件：水温18℃↑・水深30m↓・清浄(泥不可)
          </text>
          <text x="115" y="164" textAnchor="middle" fontSize="8" fill="#475569">
            ※寒流海域や大河川の河口付近には形成されない
          </text>
        </g>
      </svg>
    </div>
  );
}

function AtmosphericCirculationSvg() {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-extrabold text-slate-700">
        模式図：大気大循環（気圧帯の季節移動）とフェーン現象の温度変化
      </div>
      <svg viewBox="0 0 640 210" className="w-full select-none">
        <rect x="0" y="0" width="640" height="210" rx="8" fill="#f8fafc" />
        {/* 左：気圧帯と卓越風＋季節移動 */}
        <g transform="translate(10,10)">
          <rect width="340" height="190" rx="6" fill="#fff" stroke="#cbd5e1" />
          <text x="170" y="18" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#1e293b">
            ① 大気大循環・卓越風と1月/7月の南北移動
          </text>
          {/* 帯 */}
          <rect x="18" y="28" width="215" height="24" fill="#dbeafe" />
          <text x="125" y="44" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#1d4ed8">
            亜寒帯低圧帯(60°) ← 極偏東風 / 偏西風
          </text>
          <rect x="18" y="56" width="215" height="28" fill="#fef3c7" />
          <text x="125" y="74" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#b45309">
            亜熱帯高圧帯(25〜30°)：下降気流＝砂漠/Cs夏乾燥
          </text>
          <rect x="18" y="88" width="215" height="24" fill="#fee2e2" />
          <text x="125" y="104" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#b91c1c">
            熱帯収束帯(ITCZ・赤道0°)：上昇気流＝スコール多雨
          </text>
          <rect x="18" y="116" width="215" height="24" fill="#fef3c7" />
          <text x="125" y="132" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#b45309">
            南半球 亜熱帯高圧帯(25〜30°S)：南東貿易風
          </text>
          {/* 矢印季節 */}
          <line x1="252" y1="95" x2="252" y2="55" stroke="#ef4444" strokeWidth="2.5" />
          <polygon points="252,48 247,57 257,57" fill="#ef4444" />
          <text x="292" y="64" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#dc2626">
            7月：全体北上
          </text>
          <text x="292" y="77" textAnchor="middle" fontSize="8" fill="#991b1b">
            (北Cs乾燥/北Aw雨)
          </text>
          <line x1="252" y1="98" x2="252" y2="135" stroke="#2563eb" strokeWidth="2.5" />
          <polygon points="252,142 247,133 257,133" fill="#2563eb" />
          <text x="292" y="122" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#2563eb">
            1月：全体南下
          </text>
          <text x="292" y="135" textAnchor="middle" fontSize="8" fill="#1e40af">
            (北Cs雨/北Aw乾)
          </text>
          <text x="170" y="160" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#334155">
            貿易風(北東/南東)：低緯度東風 / 偏西風(西→東)：中緯度温帯西岸湿潤
          </text>
          <text x="170" y="176" textAnchor="middle" fontSize="8.5" fill="#475569">
            コリオリの力：北半球＝進行方向右向き / 南半球＝左向き(赤道はゼロ)
          </text>
        </g>

        {/* 右：フェーン現象と気温の逓減率 */}
        <g transform="translate(360,10)">
          <rect width="270" height="190" rx="6" fill="#fff" stroke="#cbd5e1" />
          <text x="135" y="18" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#c2410c">
            ② フェーン現象（山越え乾燥高温）
          </text>
          <path d="M20,152 L135,54 L250,152 Z" fill="#e2e8f0" stroke="#475569" strokeWidth="1.5" />
          {/* 雲と雨 */}
          <ellipse cx="78" cy="76" rx="28" ry="12" fill="#93c5fd" stroke="#2563eb" />
          <text x="64" y="106" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#1d4ed8">
            風上：雨で冷却緩
          </text>
          <text x="64" y="119" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#1d4ed8">
            -0.5〜0.65℃/100m
          </text>
          {/* 風下昇温 */}
          <path d="M142,58 L235,142" stroke="#dc2626" strokeWidth="2.5" />
          <polygon points="239,146 230,143 236,136" fill="#dc2626" />
          <text x="206" y="88" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#dc2626">
            風下：乾燥断熱
          </text>
          <text x="206" y="101" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#dc2626">
            +1.0℃/100m 急昇温!
          </text>
          <text x="26" y="145" fontSize="9.5" fontWeight="bold" fill="#0369a1">20℃</text>
          <text x="135" y="46" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#334155">山頂2000m(7℃)</text>
          <text x="238" y="145" textAnchor="end" fontSize="9.5" fontWeight="bold" fill="#dc2626">27℃超!</text>
          <text x="135" y="176" textAnchor="middle" fontSize="8.5" fill="#475569">
            山麓で高温乾燥風→融雪洪水・火災注意（アルプス/北陸春）
          </text>
        </g>
      </svg>
    </div>
  );
}

function KoppenIdealContinentSvg() {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-extrabold text-slate-700">
        模式図：ケッペンの仮想大陸モデル（大陸西岸と東岸の配列対比・南北非対称）
      </div>
      <svg viewBox="0 0 640 220" className="w-full select-none">
        <rect x="0" y="0" width="640" height="220" rx="8" fill="#f8fafc" />
        {/* 背景海洋 */}
        <rect x="12" y="12" width="400" height="196" rx="6" fill="#dbeafe" stroke="#cbd5e1" />
        {/* 仮想大陸シルエット（北が広く南40-60Sにほぼ陸地なし） */}
        <path
          d="M110,24 L320,24 L315,75 L300,112 L322,125 L268,170 L205,170 L175,118 L120,115 L105,70 Z"
          fill="#ffffff"
          stroke="#475569"
          strokeWidth="1.5"
        />
        {/* 赤道ライン */}
        <line x1="16" y1="115" x2="408" y2="115" stroke="#ef4444" strokeWidth="1.3" strokeDasharray="4 3" />
        <text x="22" y="112" fontSize="9" fontWeight="bold" fill="#dc2626">赤道0°</text>

        {/* 左列ラベル（西岸側気候帯） */}
        <rect x="116" y="28" width="84" height="16" fill="#89e4e0" />
        <text x="158" y="39" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#0f172a">ET (66°N〜)</text>
        <rect x="110" y="45" width="94" height="22" fill="#18cc55" />
        <text x="157" y="59" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#fff">Cfb 西岸(40-60°)</text>
        <rect x="108" y="68" width="90" height="16" fill="#f9a820" />
        <text x="153" y="79" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#fff">Cs (30-40°)</text>
        <rect x="110" y="85" width="95" height="15" fill="#d3b173" />
        <text x="157" y="96" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#0f172a">BW/BS(回帰線)</text>
        <rect x="130" y="102" width="130" height="24" fill="#ff4d48" fillOpacity="0.9" />
        <text x="195" y="117" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#fff">Af(赤道) / 周縁 Aw</text>
        <rect x="180" y="128" width="52" height="15" fill="#d3b173" />
        <text x="206" y="139" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#0f172a">BW/BS</text>
        <rect x="192" y="144" width="42" height="14" fill="#f9a820" />
        <text x="213" y="154" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#fff">Cs</text>

        {/* 右列ラベル（東岸側） */}
        <rect x="214" y="45" width="96" height="22" fill="#9c61b0" />
        <text x="262" y="59" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#fff">Df / Dw(北半球東)</text>
        <rect x="214" y="68" width="90" height="16" fill="#a2fa06" />
        <text x="259" y="79" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#0f172a">Cfa / Cw(東岸)</text>
        <rect x="242" y="128" width="52" height="20" fill="#a2fa06" />
        <text x="268" y="141" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#0f172a">Cfa/Cw</text>
        <text x="236" y="182" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#1e293b">
          南緯40〜60°：陸地極小 → D気候なし！
        </text>

        {/* 右側原則まとめ */}
        <g transform="translate(422,12)">
          <rect width="206" height="196" rx="6" fill="#fff" stroke="#cbd5e1" />
          <text x="103" y="20" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#4f46e5">
            必ず覚える配置の鉄則
          </text>
          <text x="12" y="42" fontSize="9.2" fontWeight="bold" fill="#0f172a">1. 40〜60°Nの東西差：</text>
          <text x="18" y="56" fontSize="8.8" fill="#334155">西岸＝暖流＋偏西風で温暖 Cfb</text>
          <text x="18" y="69" fontSize="8.8" fill="#334155">東岸＝季節風・大陸性で寒冷 Df/Dw</text>

          <text x="12" y="90" fontSize="9.2" fontWeight="bold" fill="#0f172a">2. 中低緯度西岸＝砂漠/Cs：</text>
          <text x="18" y="104" fontSize="8.8" fill="#334155">東岸は夏のモンスーン湿潤で</text>
          <text x="18" y="117" fontSize="8.8" fill="#334155">原則 B気候・Cs気候は出現しない</text>

          <text x="12" y="138" fontSize="9.2" fontWeight="bold" fill="#0f172a">3. 二つの限定気候：</text>
          <text x="18" y="152" fontSize="8.8" fill="#7c3aed">• Dw＝ユーラシア東部(シベリア)のみ</text>
          <text x="18" y="165" fontSize="8.8" fill="#dc2626">• D気候＝北半球のみ(南は海)</text>
          <text x="18" y="178" fontSize="8.8" fill="#0369a1">• 豪州にCwなし(東岸高地欠如)</text>
        </g>
      </svg>
    </div>
  );
}

function OceanCurrentsGyreSvg() {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-extrabold text-slate-700">
        模式図：亜熱帯海洋循環（暖流 vs 寒流）・海岸砂漠と潮目好漁場
      </div>
      <svg viewBox="0 0 640 195" className="w-full select-none">
        <rect x="0" y="0" width="640" height="195" rx="8" fill="#f0f9ff" />
        {/* 大陸ブロック左右 */}
        <rect x="18" y="16" width="90" height="162" rx="6" fill="#fef3c7" stroke="#92400e" />
        <text x="63" y="98" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#78350f">
          大陸東岸
        </text>
        <text x="63" y="114" textAnchor="middle" fontSize="8.5" fill="#92400e">
          (亜熱帯:暖流)
        </text>

        <rect x="330" y="16" width="90" height="162" rx="6" fill="#fde68a" stroke="#92400e" />
        <text x="375" y="92" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#78350f">
          大陸西岸
        </text>
        <text x="375" y="108" textAnchor="middle" fontSize="8.5" fill="#b91c1c">
          高緯度:暖流(Cfb)
        </text>
        <text x="375" y="122" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#0369a1">
          低緯度:寒流(砂漠)
        </text>

        {/* 赤道 */}
        <line x1="108" y1="98" x2="330" y2="98" stroke="#dc2626" strokeDasharray="4 3" />
        <text x="219" y="94" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#dc2626">
          赤道 0°（貿易風→西向き赤道海流）
        </text>

        {/* 北半球時計回り */}
        <path d="M126,84 L126,34 L312,34" fill="none" stroke="#ef4444" strokeWidth="3.5" />
        <polygon points="318,34 308,29 308,39" fill="#ef4444" />
        <path d="M312,42 L312,84 L132,84" fill="none" stroke="#0284c7" strokeWidth="3.5" />
        <polygon points="126,84 136,79 136,89" fill="#0284c7" />
        <text x="219" y="54" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#b91c1c">
          北半球：時計回り（黒潮・メキシコ湾流＝暖流）
        </text>
        <text x="280" y="68" textAnchor="end" fontSize="8.5" fontWeight="bold" fill="#0369a1">
          寒流(カリフォルニア/カナリア)
        </text>

        {/* 南半球反時計回り */}
        <path d="M126,112 L126,162 L312,162" fill="none" stroke="#ef4444" strokeWidth="3.5" />
        <path d="M312,162 L312,114 L132,114" fill="none" stroke="#0284c7" strokeWidth="3.5" />
        <polygon points="312,112 307,122 317,122" fill="#0284c7" />
        <text x="219" y="148" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#0369a1">
          南半球：反時計回り（ペルー/ベンゲラ寒流→湧昇・漁場）
        </text>

        {/* 右解説ボックス */}
        <g transform="translate(432,14)">
          <rect width="196" height="166" rx="6" fill="#fff" stroke="#cbd5e1" />
          <text x="98" y="20" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0369a1">
            海流が生む3大現象
          </text>
          <text x="10" y="42" fontSize="9" fontWeight="bold" fill="#b91c1c">1. 西岸不凍港＆温暖 Cfb</text>
          <text x="14" y="56" fontSize="8.3" fill="#334155">北大西洋海流×偏西風→ノルウェー等</text>
          <text x="10" y="76" fontSize="9" fontWeight="bold" fill="#d97706">2. 海岸砂漠（逆転現象）</text>
          <text x="14" y="90" fontSize="8.3" fill="#334155">寒流が下層を冷却→上昇気流なし</text>
          <text x="14" y="102" fontSize="8.3" fill="#334155">(アタカマ・ナミブ：霧は濃いが無雨)</text>
          <text x="10" y="124" fontSize="9" fontWeight="bold" fill="#0f766e">3. 潮目＆湧昇流の好漁場</text>
          <text x="14" y="138" fontSize="8.3" fill="#334155">黒潮×親潮 / 湾流×ラブラドル海流</text>
          <text x="14" y="151" fontSize="8.3" fill="#334155">ペルー沖湧昇(エルニーニョ時は不漁!)</text>
        </g>
      </svg>
    </div>
  );
}

function WhittleseyThunenSvg() {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-extrabold text-slate-700">
        模式図：チューネンの孤立国（輸送費×地代による同心円）＆欧州50°N氷河南限
      </div>
      <svg viewBox="0 0 640 195" className="w-full select-none">
        <rect x="0" y="0" width="640" height="195" rx="8" fill="#f8fafc" />
        {/* 左：チューネン同心円 */}
        <g transform="translate(10,10)">
          <rect width="315" height="175" rx="6" fill="#fff" stroke="#cbd5e1" />
          <text x="157" y="18" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#15803d">
            ① チューネン『孤立国』同心円モデル
          </text>
          <circle cx="95" cy="96" r="70" fill="#fef9c3" stroke="#ca8a04" />
          <circle cx="95" cy="96" r="54" fill="#dbeafe" stroke="#2563eb" />
          <circle cx="95" cy="96" r="38" fill="#bbf7d0" stroke="#16a34a" />
          <circle cx="95" cy="96" r="22" fill="#fed7aa" stroke="#ea580c" />
          <circle cx="95" cy="96" r="10" fill="#ef4444" />
          <text x="95" y="99" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#fff">都市</text>
          {/* 凡例 */}
          <text x="178" y="45" fontSize="9.5" fontWeight="bold" fill="#c2410c">1. 自由式・園芸(牛乳/生鮮)</text>
          <text x="184" y="58" fontSize="8.3" fill="#475569">地代極高・鮮度重要</text>
          <text x="178" y="76" fontSize="9.5" fontWeight="bold" fill="#15803d">2. 林業（薪炭材）</text>
          <text x="184" y="89" fontSize="8.3" fill="#475569">重量重く馬車輸送費高</text>
          <text x="178" y="107" fontSize="9.5" fontWeight="bold" fill="#1d4ed8">3. 輪栽・混合農業</text>
          <text x="184" y="120" fontSize="8.3" fill="#475569">穀物＋飼料作物の輪作</text>
          <text x="178" y="138" fontSize="9.5" fontWeight="bold" fill="#a16207">4. 三圃式・穀物 → 5. 牧畜</text>
          <text x="184" y="151" fontSize="8.3" fill="#475569">地代安・輸送しやすい乾物/生体</text>
        </g>

        {/* 右：欧州と北米の農業境界 */}
        <g transform="translate(335,10)">
          <rect width="295" height="175" rx="6" fill="#fff" stroke="#cbd5e1" />
          <text x="147" y="18" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#4f46e5">
            ② 欧州50°N氷河南限＆集約度・生産性の4象限
          </text>
          <rect x="16" y="30" width="263" height="24" rx="4" fill="#e0f2fe" />
          <text x="147" y="45" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#0369a1">
            欧州 50°N以北：氷食地(やせ土・冷涼) →『酪農』
          </text>
          <rect x="16" y="58" width="263" height="24" rx="4" fill="#dcfce7" />
          <text x="147" y="73" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#15803d">
            欧州 40〜50°N：氷成レス等肥沃土 →『混合農業』
          </text>
          <rect x="16" y="86" width="263" height="24" rx="4" fill="#ffedd5" />
          <text x="147" y="101" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#c2410c">
            地中海40°N周辺：Cs夏乾燥 →『地中海式農業』
          </text>
          <text x="16" y="130" fontSize="9" fontWeight="bold" fill="#0f172a">
            • アジア稲作：労働集約大 → 土地生産性◎ / 労働生産性△
          </text>
          <text x="16" y="146" fontSize="9" fontWeight="bold" fill="#0f172a">
            • 新大陸穀物：粗放＋大型機 → 労働生産性◎ / 土地生産性△
          </text>
          <text x="16" y="162" fontSize="9" fontWeight="bold" fill="#4f46e5">
            • 西欧(蘭/独/仏)：資本集約 → 土地・労働ともに高水準◎
          </text>
        </g>
      </svg>
    </div>
  );
}

function WeberIndustrialSvg() {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-extrabold text-slate-700">
        模式図：ウェーバー工業立地指向＆国際水平分業『スマイルカーブ』
      </div>
      <svg viewBox="0 0 640 205" className="w-full select-none">
        <rect x="0" y="0" width="640" height="205" rx="8" fill="#f8fafc" />
        {/* 左：ウェーバー立地三角形 */}
        <g transform="translate(10,10)">
          <rect width="305" height="185" rx="6" fill="#fff" stroke="#cbd5e1" />
          <text x="152" y="18" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#1e293b">
            ① 輸送費最小立地の決定ルール（原料 vs 市場）
          </text>
          <polygon points="62,55 152,145 242,55" fill="#f1f5f9" stroke="#64748b" strokeWidth="1.5" />
          <circle cx="62" cy="55" r="7" fill="#78350f" />
          <text x="62" y="42" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#78350f">原料M1</text>
          <circle cx="242" cy="55" r="7" fill="#475569" />
          <text x="242" y="42" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#475569">動力M2</text>
          <circle cx="152" cy="145" r="8" fill="#2563eb" />
          <text x="152" y="166" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#1d4ed8">消費市場 C</text>
          {/* 原料指向点・市場指向点 */}
          <circle cx="105" cy="78" r="5.5" fill="#dc2626" />
          <text x="152" y="78" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#dc2626">
            原料指数＞1 → 原料指向(セメント/製糖/鉄鋼昔)
          </text>
          <circle cx="152" cy="126" r="5.5" fill="#10b981" />
          <text x="152" y="114" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#047857">
            水増加/破損/流行 → 市場指向(飲料・新聞・食品)
          </text>
        </g>

        {/* 右：スマイルカーブ */}
        <g transform="translate(325,10)">
          <rect width="305" height="185" rx="6" fill="#fff" stroke="#cbd5e1" />
          <text x="152" y="18" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#4f46e5">
            ② 国際水平分業と『スマイルカーブ』
          </text>
          {/* 軸 */}
          <line x1="34" y1="35" x2="34" y2="145" stroke="#64748b" />
          <line x1="34" y1="145" x2="285" y2="145" stroke="#64748b" />
          <text x="24" y="42" fontSize="8.5" fontWeight="bold" fill="#475569" textAnchor="middle">高</text>
          <text x="20" y="92" fontSize="8" fill="#64748b" textAnchor="middle" transform="rotate(-90 20,92)">付加価値(利益)</text>
          {/* カーブ */}
          <path d="M46,52 Q160,175 272,54" fill="none" stroke="#4f46e5" strokeWidth="3.5" />
          <circle cx="52" cy="56" r="5" fill="#4f46e5" />
          <text x="72" y="46" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#312e81">R&D・設計・コア半導体</text>
          <text x="72" y="72" textAnchor="middle" fontSize="8" fill="#4f46e5">(米/日/台/独/蘭ASML)</text>
          <circle cx="160" cy="115" r="5" fill="#f97316" />
          <text x="160" y="136" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#c2410c">組立・加工(賃金重視)</text>
          <text x="160" y="160" textAnchor="middle" fontSize="8" fill="#ea580c">(中国・ベトナム・印)</text>
          <circle cx="268" cy="58" r="5" fill="#10b981" />
          <text x="242" y="46" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#065f46">販売・ブランド・金融</text>
          <text x="242" y="72" textAnchor="middle" fontSize="8" fill="#059669">(欧米日ブランド本社)</text>
          <text x="155" y="177" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#475569">
            技術集約(日米欧韓台)と労働集約(途上・ASEAN)の棲み分け
          </text>
        </g>
      </svg>
    </div>
  );
}

function ReligionTreeSvg() {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-extrabold text-slate-700">
        模式図：世界三大宗教・宗派分岐と民族宗教・生活禁忌＆聖地マップ
      </div>
      <svg viewBox="0 0 640 218" className="w-full select-none">
        <rect x="0" y="0" width="640" height="218" rx="8" fill="#f8fafc" />
        {/* 一神教系（アブラハムの宗教） */}
        <g transform="translate(10,10)">
          <rect width="380" height="198" rx="6" fill="#fff" stroke="#cbd5e1" />
          <text x="190" y="18" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#1e293b">
            ① 一神教（ユダヤ→キリスト→イスラム：聖地エルサレム共有）
          </text>
          <rect x="18" y="30" width="112" height="28" rx="5" fill="#cffafe" stroke="#06b6d4" />
          <text x="74" y="43" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#0e7490">ユダヤ教（民族）</text>
          <text x="74" y="54" textAnchor="middle" fontSize="8" fill="#155e75">イスラエル・豚不可</text>

          {/* キリスト教 */}
          <rect x="148" y="30" width="218" height="72" rx="5" fill="#eff6ff" stroke="#3b82f6" />
          <text x="257" y="44" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#1d4ed8">
            キリスト教（約29%・3大宗派）
          </text>
          <text x="156" y="60" fontSize="8.5" fontWeight="bold" fill="#a16207">• カトリック：南欧・中南米・比・愛蘭</text>
          <text x="156" y="75" fontSize="8.5" fontWeight="bold" fill="#1d4ed8">• プロテスタント：北欧・英・独北・北米・豪</text>
          <text x="156" y="90" fontSize="8.5" fontWeight="bold" fill="#7c3aed">• 東方正教：露・烏・希・羅・勃（玉ねぎ屋根）</text>

          {/* イスラム教 */}
          <rect x="18" y="112" width="348" height="76" rx="5" fill="#ecfdf5" stroke="#10b981" />
          <text x="192" y="128" textAnchor="middle" fontSize="9.8" fontWeight="bold" fill="#065f46">
            イスラム教（約26%：メッカ巡礼・豚肉&amp;酒厳禁・ラマダン・五行）
          </text>
          <text x="26" y="146" fontSize="8.7" fontWeight="bold" fill="#047857">
            • スンニ派(約85-90%)：インドネシア(最多)・パキスタン・トルコ・サウジ・エジプト・西阿
          </text>
          <text x="26" y="162" fontSize="8.7" fontWeight="bold" fill="#0f766e">
            • シーア派(約10-15%)：イラン(国教・9割)・イラク(約6割)・アゼルバイジャン・バーレーン
          </text>
          <text x="26" y="179" fontSize="8.3" fill="#475569">
            ※利子を禁じる『イスラム金融』や金曜日の集団礼拝（モスク/ミナレット）が特徴
          </text>
        </g>

        {/* インド発祥系（ヒンドゥー・仏教・シク） */}
        <g transform="translate(400,10)">
          <rect width="230" height="198" rx="6" fill="#fff" stroke="#cbd5e1" />
          <text x="115" y="18" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#c2410c">
            ② インド発祥宗教（輪廻転生）
          </text>
          <rect x="12" y="30" width="206" height="58" rx="5" fill="#fff7ed" stroke="#f97316" />
          <text x="115" y="45" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#c2410c">
            ヒンドゥー教（約15%・民族宗教）
          </text>
          <text x="18" y="60" fontSize="8.3" fill="#334155">• 印8割・ネパール・バリ島・フィジー・モーリシャス</text>
          <text x="18" y="74" fontSize="8.3" fontWeight="bold" fill="#dc2626">• 聖河ガンジス・牛神聖(水牛輸出)・菜食多い</text>

          <rect x="12" y="96" width="206" height="68" rx="5" fill="#fefce8" stroke="#eab308" />
          <text x="115" y="111" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#854d0e">
            仏教（約4%・3大潮流に伝播）
          </text>
          <text x="18" y="126" fontSize="8.2" fill="#334155">• 上座部：泰・緬・柬・斯（出家・個人修行）</text>
          <text x="18" y="139" fontSize="8.2" fill="#334155">• 大乗：日・中・韓・越（儒教道教神道と習合）</text>
          <text x="18" y="152" fontSize="8.2" fill="#334155">• チベット仏教：蔵・ブータン・モンゴル</text>

          <rect x="12" y="170" width="206" height="20" rx="4" fill="#f1f5f9" />
          <text x="115" y="183" textAnchor="middle" fontSize="8.2" fontWeight="bold" fill="#475569">
            シク教：インド北西部パンジャブ州（ターバン）
          </text>
        </g>
      </svg>
    </div>
  );
}

function LanguageTreeSvg() {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-extrabold text-slate-700">
        模式図：世界の主要語族・語派分類（印欧語族の広がりと孤立語・多言語国家）
      </div>
      <svg viewBox="0 0 640 200" className="w-full select-none">
        <rect x="0" y="0" width="640" height="200" rx="8" fill="#f8fafc" />
        {/* 印欧語族 */}
        <g transform="translate(10,10)">
          <rect width="350" height="180" rx="6" fill="#fff" stroke="#cbd5e1" />
          <text x="175" y="18" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#1d4ed8">
            ① インド＝ヨーロッパ（印欧）語族（世界最大：約半数）
          </text>
          <rect x="14" y="30" width="155" height="64" rx="5" fill="#eff6ff" stroke="#93c5fd" />
          <text x="91" y="45" textAnchor="middle" fontSize="9.3" fontWeight="bold" fill="#1e40af">ゲルマン語派</text>
          <text x="20" y="60" fontSize="8.4" fill="#334155">英・独・蘭・瑞典・諾・丁</text>
          <text x="20" y="74" fontSize="8.2" fill="#0369a1">→ 北米・豪・NZ・南ア・印公用へ拡大</text>

          <rect x="180" y="30" width="156" height="64" rx="5" fill="#fefce8" stroke="#fde047" />
          <text x="258" y="45" textAnchor="middle" fontSize="9.3" fontWeight="bold" fill="#a16207">ロマンス（ラテン）語派</text>
          <text x="186" y="60" fontSize="8.4" fill="#334155">仏・西・葡・伊・ルーマニア</text>
          <text x="186" y="74" fontSize="8.2" fill="#b45309">→ 中南米(伯=葡/他=西)・西阿仏語へ</text>

          <rect x="14" y="102" width="155" height="66" rx="5" fill="#f5f3ff" stroke="#c4b5fd" />
          <text x="91" y="117" textAnchor="middle" fontSize="9.3" fontWeight="bold" fill="#6d28d9">スラブ語派</text>
          <text x="20" y="132" fontSize="8.4" fill="#334155">露・烏・波・チェコ・セルビア</text>
          <text x="20" y="146" fontSize="8.2" fill="#5b21b6">正教圏はキリル文字 / カトリック圏はラテン文字</text>

          <rect x="180" y="102" width="156" height="66" rx="5" fill="#fef2f2" stroke="#fca5a5" />
          <text x="258" y="117" textAnchor="middle" fontSize="9.3" fontWeight="bold" fill="#b91c1c">インド・イラン語派</text>
          <text x="186" y="132" fontSize="8.4" fill="#334155">ヒンディー・ベンガル・ペルシア(イラン)</text>
          <text x="186" y="146" fontSize="8.2" fill="#991b1b">※南インド(タミル等)はドラヴィダ語族</text>
        </g>

        {/* その他語族と欧州例外 */}
        <g transform="translate(370,10)">
          <rect width="260" height="180" rx="6" fill="#fff" stroke="#cbd5e1" />
          <text x="130" y="18" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#0f766e">
            ② 欧州の例外『ウラル語族』＆その他語族
          </text>
          <text x="12" y="40" fontSize="8.8" fontWeight="bold" fill="#0d9488">• ウラル語族（アジア起源の孤立島）</text>
          <text x="18" y="54" fontSize="8.3" fill="#334155">フィンランド語・エストニア語・ハンガリー語</text>
          <text x="12" y="74" fontSize="8.8" fontWeight="bold" fill="#16a34a">• アフロ・アジア語族</text>
          <text x="18" y="88" fontSize="8.3" fill="#334155">アラビア語(中東/北阿)・アムハラ語(伊)・ヘブライ</text>
          <text x="12" y="108" fontSize="8.8" fontWeight="bold" fill="#ea580c">• シナ・チベット / ニジェール・コンゴ</text>
          <text x="18" y="122" fontSize="8.3" fill="#334155">中国語・ビルマ語 / スワヒリ語(東阿商業共通語)</text>
          <text x="12" y="142" fontSize="8.8" fontWeight="bold" fill="#0284c7">• オーストロネシア語族（海洋民族）</text>
          <text x="18" y="156" fontSize="8.3" fill="#334155">インドネシア・マレー・タガログ・マダガスカル！</text>
          <text x="18" y="170" fontSize="8.2" fontWeight="bold" fill="#dc2626">※バスク語（西・仏国境）：系統不明の孤立言語</text>
        </g>
      </svg>
    </div>
  );
}

function JapanTectonicsClimateSvg() {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-extrabold text-slate-700">
        模式図：日本列島の4プレート境界（フォッサマグナ・中央構造線）＆冬の豪雪／冬晴れ断面
      </div>
      <svg viewBox="0 0 640 200" className="w-full select-none">
        <rect x="0" y="0" width="640" height="200" rx="8" fill="#f8fafc" />
        {/* 左：4プレートと2大構造線 */}
        <g transform="translate(10,10)">
          <rect width="305" height="180" rx="6" fill="#fff" stroke="#cbd5e1" />
          <text x="152" y="18" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#b91c1c">
            ① 日本列島：4プレートと構造線
          </text>
          {/* 4エリア分割イメージ */}
          <rect x="16" y="28" width="136" height="68" fill="#fef3c7" rx="4" />
          <text x="84" y="48" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#78350f">ユーラシアプレート</text>
          <text x="84" y="62" textAnchor="middle" fontSize="8.3" fill="#92400e">(西南日本：内帯 vs 外帯)</text>
          <rect x="156" y="28" width="134" height="68" fill="#e0f2fe" rx="4" />
          <text x="223" y="48" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#0369a1">北アメリカプレート</text>
          <text x="223" y="62" textAnchor="middle" fontSize="8.3" fill="#0c4a6e">(東北日本・北海道)</text>

          <rect x="16" y="102" width="136" height="44" fill="#fce7f3" rx="4" />
          <text x="84" y="122" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#9d174d">フィリピン海プレート</text>
          <text x="84" y="135" textAnchor="middle" fontSize="8" fill="#be185d">南海トラフ沈込・伊豆衝突</text>
          <rect x="156" y="102" width="134" height="44" fill="#dbeafe" rx="4" />
          <text x="223" y="122" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#1d4ed8">太平洋プレート</text>
          <text x="223" y="135" textAnchor="middle" fontSize="8" fill="#1e40af">日本海溝へ急角度沈込</text>

          {/* 構造線ライン */}
          <line x1="154" y1="28" x2="154" y2="100" stroke="#dc2626" strokeWidth="3.5" />
          <text x="154" y="88" textAnchor="middle" fontSize="8.3" fontWeight="bold" fill="#dc2626">フォッサマグナ(糸魚川-静岡線)</text>
          <line x1="22" y1="78" x2="148" y2="74" stroke="#7c3aed" strokeWidth="2.5" strokeDasharray="3 2" />
          <text x="84" y="88" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#6d28d9">中央構造線(紀伊〜四国〜九州)</text>
          <text x="152" y="166" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#475569">
            中央構造線＝プレート境界ではなく『西南日本を縦断する巨大断層帯』!
          </text>
        </g>

        {/* 右：冬の断面図 */}
        <g transform="translate(325,10)">
          <rect width="305" height="180" rx="6" fill="#fff" stroke="#cbd5e1" />
          <text x="152" y="18" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#0369a1">
            ② 冬の北西季節風と6気候区分の骨格
          </text>
          {/* 日本海・脊梁山脈・太平洋 */}
          <rect x="16" y="125" width="90" height="22" fill="#93c5fd" />
          <text x="61" y="140" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#1e3a8a">日本海(暖流:対馬海流)</text>
          <path d="M106,125 L165,64 L220,125 Z" fill="#cbd5e1" stroke="#475569" />
          <text x="165" y="114" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#334155">脊梁山脈</text>
          <rect x="220" y="125" width="72" height="22" fill="#bfdbfe" />
          <text x="256" y="140" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#1e40af">太平洋側</text>
          {/* 風・雪・晴 */}
          <path d="M25,52 L135,52" stroke="#0284c7" strokeWidth="2.5" />
          <polygon points="142,52 132,47 132,57" fill="#0284c7" />
          <text x="72" y="45" textAnchor="middle" fontSize="8.8" fontWeight="bold" fill="#0369a1">北西季節風(シベリア気団)</text>
          <text x="98" y="84" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#1d4ed8">❄ 世界屈指の豪雪</text>
          <path d="M180,68 L255,108" stroke="#f97316" strokeWidth="2.5" />
          <text x="242" y="78" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#ea580c">☀ 乾燥冬晴れ</text>
          <text x="242" y="91" textAnchor="middle" fontSize="8" fill="#c2410c">(からっ風・施設園芸)</text>
          <text x="152" y="167" textAnchor="middle" fontSize="8.5" fill="#475569">
            夏：小笠原気団南東風→太平洋多雨 / 親潮×オホーツク海気団→東北『やませ』冷害
          </text>
        </g>
      </svg>
    </div>
  );
}
