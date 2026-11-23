"""
Natural Earth 110m Admin 0 Countries GeoJSON を取得し、
ISO 3166-1 alpha-3 コードを正規化して軽量な geo_countries_v1.geojson を生成するスクリプト。
110m で省略される主要小国（SGP シンガポール等）は 50m データから補完する。
"""

import json
import urllib.request
from pathlib import Path

URL_110M = (
    "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/"
    "master/geojson/ne_110m_admin_0_countries.geojson"
)
URL_50M = (
    "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/"
    "master/geojson/ne_50m_admin_0_countries.geojson"
)

ROOT_DIR = Path(__file__).resolve().parents[2]
OUTPUT_PATH = ROOT_DIR / "app" / "public" / "data" / "geo_countries_v1.geojson"

# 110m で落ちやすい小国の補完対象
SUPPLEMENT_ISO3 = {"SGP"}

# ネットワーク取得に失敗した場合の SGP 簡易ポリゴンフォールバック
SGP_FALLBACK_POLYGON = {
    "type": "Polygon",
    "coordinates": [
        [
            [103.605, 1.265],
            [103.65, 1.43],
            [103.80, 1.47],
            [103.99, 1.39],
            [104.04, 1.33],
            [103.90, 1.28],
            [103.75, 1.25],
            [103.605, 1.265],
        ]
    ],
}


def resolve_iso3(props: dict) -> str:
    """Natural Earth の -99 欠損を補完して正規化 ISO3 を返す。"""
    for key in ("ISO_A3", "ISO_A3_EH", "ADM0_A3", "SOV_A3"):
        val = str(props.get(key) or "").strip().upper()
        if val and val != "-99" and len(val) == 3:
            return val
    return "UNK"


def fetch_json(url: str) -> dict:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "kyoute-chiri-setup/1.0"},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def normalize_feature(feat: dict, feature_id: int) -> dict:
    props = feat.get("properties", {})
    iso3 = resolve_iso3(props)
    name_en = (
        props.get("NAME_EN")
        or props.get("NAME")
        or props.get("ADMIN")
        or iso3
    )
    name_ja = props.get("NAME_JA") or ""
    continent = props.get("CONTINENT") or ""
    return {
        "type": "Feature",
        "id": feature_id,
        "geometry": feat.get("geometry"),
        "properties": {
            "iso3": iso3,
            "nameEn": name_en,
            "nameJaNe": name_ja,
            "continent": continent,
        },
    }


def main() -> None:
    print(f"Fetching: {URL_110M}")
    raw_110 = fetch_json(URL_110M)

    normalized_features = []
    present_iso3 = set()
    for idx, feat in enumerate(raw_110.get("features", []), start=1):
        nf = normalize_feature(feat, idx)
        normalized_features.append(nf)
        present_iso3.add(nf["properties"]["iso3"])

    missing_supplements = SUPPLEMENT_ISO3 - present_iso3
    if missing_supplements:
        try:
            print(f"Fetching 50m for supplements: {missing_supplements}")
            raw_50 = fetch_json(URL_50M)
            for feat in raw_50.get("features", []):
                iso3 = resolve_iso3(feat.get("properties", {}))
                if iso3 in missing_supplements:
                    nf = normalize_feature(feat, len(normalized_features) + 1)
                    normalized_features.append(nf)
                    present_iso3.add(iso3)
                    print(f"Supplemented {iso3} from Natural Earth 50m.")
        except Exception as exc:
            print(f"50m fetch failed ({exc}); using fallback geometry if needed.")

    if "SGP" not in present_iso3:
        normalized_features.append(
            {
                "type": "Feature",
                "id": len(normalized_features) + 1,
                "geometry": SGP_FALLBACK_POLYGON,
                "properties": {
                    "iso3": "SGP",
                    "nameEn": "Singapore",
                    "nameJaNe": "シンガポール",
                    "continent": "Asia",
                },
            }
        )
        print("Supplemented SGP with fallback polygon.")

    output = {
        "type": "FeatureCollection",
        "features": normalized_features,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, separators=(",", ":"))

    size_kb = OUTPUT_PATH.stat().st_size / 1024
    print(f"Saved {len(normalized_features)} features to {OUTPUT_PATH} ({size_kb:.1f} KB)")


if __name__ == "__main__":
    main()
