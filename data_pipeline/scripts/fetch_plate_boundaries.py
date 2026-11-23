"""Download PB2002 tectonic plate steps and build simplified global GeoJSON."""

from __future__ import annotations

import json
import math
import re
import urllib.request
from collections import defaultdict
from pathlib import Path

PB2002_URL = (
    "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_steps.json"
)
OUT_PATH = (
    Path(__file__).resolve().parents[2]
    / "app"
    / "public"
    / "data"
    / "plate_boundaries_v1.geojson"
)

STEPCLASS_MAP = {
    "SUB": "convergent",
    "OCB": "convergent",
    "CCB": "convergent",
    "OSR": "divergent",
    "CRB": "divergent",
    "OTF": "transform",
    "CTF": "transform",
}

BOUNDARY_TYPE_JA = {
    "convergent": "狭まる境界（海溝・島弧・造山帯）",
    "divergent": "広がる境界（中央海嶺・大地溝帯）",
    "transform": "ずれる境界（トランスフォーム断層）",
}

PLATE_NAMES_JA = {
    "AF": "アフリカプレート",
    "AM": "アムールプレート",
    "AN": "南極プレート",
    "AP": "アルティプラノプレート",
    "AR": "アラビアプレート",
    "AS": "エーゲ海プレート",
    "AT": "アナトリアプレート",
    "AU": "オーストラリアプレート",
    "BH": "バードヘッドプレート",
    "BR": "バルモラル礁プレート",
    "BS": "バンダ海プレート",
    "BU": "ビルマプレート",
    "CA": "カリブプレート",
    "CL": "カロリンプレート",
    "CO": "ココスプレート",
    "CR": "コンウェイ礁プレート",
    "EA": "イースタープレート",
    "EU": "ユーラシアプレート",
    "FT": "フツナプレート",
    "GP": "ガラパゴスプレート",
    "IN": "インドプレート",
    "JF": "ファンデフカプレート",
    "JZ": "ファンフェルナンデスプレート",
    "KE": "ケルマデックプレート",
    "MA": "マリアナプレート",
    "MN": "マヌスプレート",
    "MO": "マオケプレート",
    "MS": "モルッカ海プレート",
    "NA": "北アメリカプレート",
    "NB": "北ビスマルクプレート",
    "ND": "北アンデスプレート",
    "NH": "ニューヘブリデスプレート",
    "NI": "ニウアフォオウプレート",
    "NZ": "ナスカプレート",
    "OK": "オホーツクプレート",
    "ON": "沖縄プレート",
    "PA": "太平洋プレート",
    "PH": "フィリピン海プレート",
    "PM": "パナマプレート",
    "PS": "フィリピン海プレート",
    "RI": "リベラプレート",
    "SA": "南アメリカプレート",
    "SB": "南ビスマルクプレート",
    "SC": "スコシアプレート",
    "SL": "シェトランドプレート",
    "SO": "ソマリアプレート",
    "SS": "ソロモン海プレート",
    "SU": "スンダプレート",
    "SW": "サンドイッチプレート",
    "TI": "ティモールプレート",
    "TO": "トンガプレート",
    "WL": "ウッドラークプレート",
    "YA": "揚子江プレート",
}


def format_plate_bound_ja(code: str) -> str:
    parts = [p for p in re.split(r"[-/\\]", code) if p]
    if len(parts) == 2:
        left_ja = PLATE_NAMES_JA.get(parts[0], parts[0])
        right_ja = PLATE_NAMES_JA.get(parts[1], parts[1])
        return f"{left_ja}・{right_ja}"
    return code


def _perp_dist(pt: list[float], start: list[float], end: list[float]) -> float:
    dx = end[0] - start[0]
    dy = end[1] - start[1]
    if dx == 0.0 and dy == 0.0:
        return math.hypot(pt[0] - start[0], pt[1] - start[1])
    t = ((pt[0] - start[0]) * dx + (pt[1] - start[1]) * dy) / (dx * dx + dy * dy)
    t = max(0.0, min(1.0, t))
    proj_x = start[0] + t * dx
    proj_y = start[1] + t * dy
    return math.hypot(pt[0] - proj_x, pt[1] - proj_y)


def douglas_peucker(pts: list[list[float]], tol: float) -> list[list[float]]:
    if len(pts) <= 2:
        return pts
    max_d = -1.0
    max_i = 0
    for i in range(1, len(pts) - 1):
        d = _perp_dist(pts[i], pts[0], pts[-1])
        if d > max_d:
            max_d = d
            max_i = i
    if max_d > tol:
        left = douglas_peucker(pts[: max_i + 1], tol)
        right = douglas_peucker(pts[max_i:], tol)
        return left[:-1] + right
    return [pts[0], pts[-1]]


def split_antimeridian(coords: list[list[float]]) -> list[list[list[float]]]:
    """Split a coordinate sequence wherever consecutive longitudes cross +-180."""
    if len(coords) < 2:
        return []
    parts: list[list[list[float]]] = [[coords[0]]]
    for pt in coords[1:]:
        prev = parts[-1][-1]
        if abs(pt[0] - prev[0]) > 180.0:
            if len(parts[-1]) >= 2:
                parts.append([pt])
            else:
                parts[-1] = [pt]
        else:
            parts[-1].append(pt)
    return [p for p in parts if len(p) >= 2]


def stitch_lines(lines: list[list[list[float]]]) -> list[list[list[float]]]:
    """Merge connected LineStrings sharing identical rounded endpoints."""
    if not lines:
        return []

    def key(pt: list[float]) -> tuple[float, float]:
        return (round(pt[0], 4), round(pt[1], 4))

    adj: dict[tuple[float, float], list[int]] = defaultdict(list)
    for idx, line in enumerate(lines):
        adj[key(line[0])].append(idx)
        adj[key(line[-1])].append(idx)

    used = [False] * len(lines)
    merged: list[list[list[float]]] = []

    for start_idx in range(len(lines)):
        if used[start_idx]:
            continue
        used[start_idx] = True
        chain = list(lines[start_idx])

        while True:
            end_k = key(chain[-1])
            found = None
            for nxt in adj[end_k]:
                if used[nxt]:
                    continue
                cand = lines[nxt]
                if key(cand[0]) == end_k:
                    seg = cand[1:]
                elif key(cand[-1]) == end_k:
                    seg = list(reversed(cand[:-1]))
                else:
                    continue
                if seg and abs(seg[0][0] - chain[-1][0]) > 180.0:
                    continue
                used[nxt] = True
                chain.extend(seg)
                found = nxt
                break
            if found is None:
                break

        while True:
            start_k = key(chain[0])
            found = None
            for nxt in adj[start_k]:
                if used[nxt]:
                    continue
                cand = lines[nxt]
                if key(cand[-1]) == start_k:
                    seg = cand[:-1]
                elif key(cand[0]) == start_k:
                    seg = list(reversed(cand[1:]))
                else:
                    continue
                if seg and abs(seg[-1][0] - chain[0][0]) > 180.0:
                    continue
                used[nxt] = True
                chain = seg + chain
                found = nxt
                break
            if found is None:
                break

        for part in split_antimeridian(chain):
            simplified = douglas_peucker(part, 0.08)
            rounded: list[list[float]] = []
            for lon, lat in simplified:
                pt = [round(lon, 2), round(lat, 2)]
                if not rounded or rounded[-1] != pt:
                    rounded.append(pt)
            if len(rounded) >= 2:
                merged.append(rounded)

    return merged


def main() -> None:
    print(f"Downloading {PB2002_URL} ...")
    req = urllib.request.Request(
        PB2002_URL,
        headers={"User-Agent": "kyoute-chiri-data-builder/1.0"},
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        raw = json.loads(resp.read().decode("utf-8"))

    groups: dict[tuple[str, str], dict] = {}
    for feat in raw.get("features", []):
        props = feat.get("properties", {})
        step_class = str(props.get("STEPCLASS", "")).upper()
        b_type = STEPCLASS_MAP.get(step_class)
        if not b_type:
            continue
        plate_bound = str(props.get("PLATEBOUND") or props.get("LAYER") or "unknown")
        geom = feat.get("geometry") or {}
        gtype = geom.get("type")
        coords = geom.get("coordinates") or []

        raw_lines: list[list[list[float]]] = []
        if gtype == "LineString":
            raw_lines = [coords]
        elif gtype == "MultiLineString":
            raw_lines = coords

        grp_key = (plate_bound, b_type)
        if grp_key not in groups:
            groups[grp_key] = {
                "plateBound": plate_bound,
                "boundaryType": b_type,
                "stepClasses": set(),
                "lines": [],
            }
        groups[grp_key]["stepClasses"].add(step_class)
        for line in raw_lines:
            if len(line) >= 2:
                groups[grp_key]["lines"].append([[float(p[0]), float(p[1])] for p in line])

    features = []
    for idx, ((plate_bound, b_type), data) in enumerate(sorted(groups.items())):
        stitched = stitch_lines(data["lines"])
        if not stitched:
            continue
        geom = (
            {"type": "LineString", "coordinates": stitched[0]}
            if len(stitched) == 1
            else {"type": "MultiLineString", "coordinates": stitched}
        )
        type_ja = BOUNDARY_TYPE_JA[b_type]
        pair_ja = format_plate_bound_ja(plate_bound)
        step_list = "/".join(sorted(data["stepClasses"]))
        features.append(
            {
                "type": "Feature",
                "properties": {
                    "id": f"pb_{idx:03d}_{plate_bound}_{b_type}",
                    "name": f"{pair_ja}の境界",
                    "plateBound": plate_bound,
                    "boundaryType": b_type,
                    "boundaryTypeJa": type_ja,
                    "stepClasses": step_list,
                    "description": f"{type_ja}（{pair_ja} / {plate_bound}）",
                },
                "geometry": geom,
            }
        )

    out_obj = {"type": "FeatureCollection", "features": features}
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(
        json.dumps(out_obj, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    size_kb = OUT_PATH.stat().st_size / 1024
    print(f"Wrote {len(features)} features to {OUT_PATH} ({size_kb:.1f} KB)")


if __name__ == "__main__":
    main()
