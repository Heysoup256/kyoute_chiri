"""Fetch and normalize electricity generation mix (%) from Our World in Data (owid-energy-data.csv)."""

from __future__ import annotations

import csv
import json
import urllib.request
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]
RAW_DIR = ROOT_DIR / "data_pipeline" / "raw"
DATA_DIR = ROOT_DIR / "app" / "public" / "data"
CACHE_DIR = Path(
    r"C:\Users\souosu\.gemini\antigravity\brain\6ae25a4e-afe3-408a-9994-ff75540ec085\scratch\worldclim_cache"
)

OWID_URL = "https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv"
GEO_COUNTRIES_PATH = DATA_DIR / "geo_countries_v1.geojson"
OUT_PATH = RAW_DIR / "country_power_mix_v1.json"

FALLBACK_POWER_MIX: dict[str, dict] = {
    "TWN": {
        "year": "2023",
        "coalPct": 42.2,
        "gasPct": 39.5,
        "oilPct": 1.6,
        "hydroPct": 1.4,
        "nuclearPct": 6.3,
        "windSolarPct": 7.6,
        "otherRenewPct": 1.4,
    },
    "VAT": {"year": "2023", "coalPct": 0.0, "gasPct": 0.0, "oilPct": 0.0, "hydroPct": 0.0, "nuclearPct": 0.0, "windSolarPct": 100.0, "otherRenewPct": 0.0},
    "MCO": {"year": "2023", "coalPct": 0.0, "gasPct": 45.0, "oilPct": 10.0, "hydroPct": 15.0, "nuclearPct": 15.0, "windSolarPct": 15.0, "otherRenewPct": 0.0},
    "SMR": {"year": "2023", "coalPct": 5.0, "gasPct": 45.0, "oilPct": 5.0, "hydroPct": 15.0, "nuclearPct": 0.0, "windSolarPct": 25.0, "otherRenewPct": 5.0},
    "LIE": {"year": "2023", "coalPct": 0.0, "gasPct": 0.0, "oilPct": 0.0, "hydroPct": 85.0, "nuclearPct": 0.0, "windSolarPct": 15.0, "otherRenewPct": 0.0},
    "AND": {"year": "2023", "coalPct": 0.0, "gasPct": 0.0, "oilPct": 0.0, "hydroPct": 82.0, "nuclearPct": 0.0, "windSolarPct": 12.0, "otherRenewPct": 6.0},
}


def parse_float(val: str) -> float:
    try:
        v = float(val)
        return max(0.0, v) if v == v else 0.0
    except Exception:
        return 0.0


def download_cached_owid() -> Path:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    target = CACHE_DIR / "owid-energy-data.csv"
    if target.exists() and target.stat().st_size > 2_000_000:
        print(f"Using cached {target.name}")
        return target
    print(f"Downloading {OWID_URL} ...")
    req = urllib.request.Request(OWID_URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=90) as resp:
        target.write_bytes(resp.read())
    print(f"Saved {target.name} ({target.stat().st_size / 1e6:.1f} MB)")
    return target


def main() -> None:
    csv_path = download_cached_owid()
    geo_isos = {
        f["properties"]["iso3"]
        for f in json.loads(GEO_COUNTRIES_PATH.read_text(encoding="utf-8")).get("features", [])
        if f.get("properties", {}).get("iso3")
    }

    best_by_iso: dict[str, tuple[int, dict]] = {}
    with csv_path.open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            iso = (row.get("iso_code") or "").strip()
            if not iso or iso not in geo_isos:
                continue
            try:
                yr = int(row.get("year") or "0")
            except ValueError:
                continue
            if yr < 2015 or yr > 2026:
                continue

            coal = parse_float(row.get("coal_share_elec", ""))
            gas = parse_float(row.get("gas_share_elec", ""))
            oil = parse_float(row.get("oil_share_elec", ""))
            hydro = parse_float(row.get("hydro_share_elec", ""))
            nuclear = parse_float(row.get("nuclear_share_elec", ""))
            wind = parse_float(row.get("wind_share_elec", ""))
            solar = parse_float(row.get("solar_share_elec", ""))
            other_ren = parse_float(row.get("other_renewables_share_elec", ""))
            tot = coal + gas + oil + hydro + nuclear + wind + solar + other_ren
            if tot < 50.0:
                continue

            prev = best_by_iso.get(iso)
            if not prev or yr >= prev[0]:
                # Normalize to 100.0
                scale = 100.0 / tot
                c_p = round(coal * scale, 1)
                g_p = round(gas * scale, 1)
                o_p = round(oil * scale, 1)
                h_p = round(hydro * scale, 1)
                n_p = round(nuclear * scale, 1)
                ws_p = round((wind + solar) * scale, 1)
                or_p = round(max(0.0, 100.0 - (c_p + g_p + o_p + h_p + n_p + ws_p)), 1)
                best_by_iso[iso] = (
                    yr,
                    {
                        "year": str(yr),
                        "coalPct": c_p,
                        "gasPct": g_p,
                        "oilPct": o_p,
                        "hydroPct": h_p,
                        "nuclearPct": n_p,
                        "windSolarPct": ws_p,
                        "otherRenewPct": or_p,
                    },
                )

    out: dict[str, dict] = {iso: pair[1] for iso, pair in sorted(best_by_iso.items())}
    for iso, fb in FALLBACK_POWER_MIX.items():
        if iso not in out or iso == "TWN":
            out[iso] = fb

    # Enrich summary percentages
    for iso, val in out.items():
        val["fossilPct"] = round(val["coalPct"] + val["gasPct"] + val["oilPct"], 1)
        val["renewablesPct"] = round(val["hydroPct"] + val["windSolarPct"] + val["otherRenewPct"], 1)

    OUT_PATH.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Saved power mix for {len(out)} countries to {OUT_PATH.name}")
    for sample in ["JPN", "USA", "CHN", "FRA", "NOR", "ISL", "BRA", "AUS", "ZAF", "TWN"]:
        if sample in out:
            print(f"  {sample}: {out[sample]}")


if __name__ == "__main__":
    main()
