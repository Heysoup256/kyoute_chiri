"""世界統計84→139品目（比較グラフ24本・散布図9本・フロー地図10本）＆日本統計（グラフ10本・県別26品目）へ冪等拡充するスクリプト。"""

from __future__ import annotations

import json
import re
from pathlib import Path

from stats_extra_japan import EXTRA_JAPAN_CHARTS, EXTRA_JAPAN_PREF_RANKINGS
from stats_extra_world_ag_res import EXTRA_WORLD_AG_RES_ITEMS
from stats_extra_world_ind_soc import (
    EXTRA_WORLD_COMPARISON_CHARTS,
    EXTRA_WORLD_FLOW_MAPS,
    EXTRA_WORLD_IND_SOC_ITEMS,
    EXTRA_WORLD_SCATTERS,
)

ROOT_DIR = Path(__file__).resolve().parents[2]
RAW_DIR = ROOT_DIR / "data_pipeline" / "raw"
DATA_DIR = ROOT_DIR / "app" / "public" / "data"

WORLD_PATH = RAW_DIR / "world_rankings_v1.json"
JAPAN_PATH = RAW_DIR / "japan_geography_v1.json"
COUNTRIES_PATH = DATA_DIR / "countries_v1.json"

SUBCODE_RE = re.compile(
    r"(?<![A-Za-z])(BWh|BWk|BSh|BSk|Csa|Csb|Csc|Cwa|Cwb|Cwc|Cfc|Dfa|Dfb|Dfc|Dfd|Dwa|Dwb|Dwc|Dwd|Dsa|Dsb|Dsc|Dsd)(?![A-Za-z])"
)


def merge_by_id(existing: list[dict], additions: list[dict], id_key: str = "id") -> list[dict]:
    """既存リストへ追加リストを冪等マージ（同一IDは最新版で置換、それ以外は末尾追加）。"""
    add_map = {item[id_key]: item for item in additions}
    seen: set[str] = set()
    out: list[dict] = []
    for item in existing:
        k = item[id_key]
        if k in add_map:
            out.append(add_map[k])
            seen.add(k)
        else:
            out.append(item)
            seen.add(k)
    for item in additions:
        k = item[id_key]
        if k not in seen:
            out.append(item)
            seen.add(k)
    return out


def main() -> None:
    valid_isos = set(json.loads(COUNTRIES_PATH.read_text(encoding="utf-8"))["countries"].keys())

    # 1. World Rankings 拡充
    wr = json.loads(WORLD_PATH.read_text(encoding="utf-8"))
    new_world_items = EXTRA_WORLD_AG_RES_ITEMS + EXTRA_WORLD_IND_SOC_ITEMS

    for item in new_world_items:
        assert item["category"] in ("agriculture", "resource", "industry", "society"), item["id"]
        for bucket in ("primaryTop", "secondaryTop"):
            for ent in item.get(bucket) or []:
                if ent.get("iso3") and ent["iso3"] not in valid_isos:
                    raise ValueError(f"world item {item['id']}: invalid iso3={ent['iso3']}")

    for sc in EXTRA_WORLD_SCATTERS:
        for pt in sc["points"]:
            if pt.get("iso3") not in valid_isos:
                raise ValueError(f"scatter {sc['id']}: invalid iso3={pt.get('iso3')}")

    for fm in EXTRA_WORLD_FLOW_MAPS:
        for arc in fm["arcs"]:
            for k in ("fromIso3", "toIso3"):
                if arc.get(k) and arc[k] not in valid_isos:
                    raise ValueError(f"flowMap {fm['id']} arc {arc['id']}: invalid {k}={arc[k]}")

    for ch in EXTRA_WORLD_COMPARISON_CHARTS + EXTRA_JAPAN_CHARTS:
        if ch["kind"] == "stacked_bar":
            cats = ch["categories"]
            for i in range(len(cats)):
                tot = sum(float(s["values"][i]) for s in ch["series"])
                if abs(tot - 100.0) > 1.0:
                    raise ValueError(f"stacked_bar {ch['id']} cat '{cats[i]}': sum={tot} != 100")

    wr["items"] = merge_by_id(wr["items"], new_world_items)
    wr["comparisonCharts"] = merge_by_id(wr.get("comparisonCharts", []), EXTRA_WORLD_COMPARISON_CHARTS)
    wr["scatters"] = merge_by_id(wr.get("scatters", []), EXTRA_WORLD_SCATTERS)
    wr["flowMaps"] = merge_by_id(wr.get("flowMaps", []), EXTRA_WORLD_FLOW_MAPS)

    wr_txt = json.dumps(wr, ensure_ascii=False, indent=2)
    hits_wr = SUBCODE_RE.findall(wr_txt)
    if hits_wr:
        raise ValueError(f"world_rankings_v1.json に非13区分コードが含まれています: {sorted(set(hits_wr))}")
    WORLD_PATH.write_text(wr_txt + "\n", encoding="utf-8")

    # 2. Japan Geography 拡充
    jg = json.loads(JAPAN_PATH.read_text(encoding="utf-8"))
    dom = jg["domesticStats"]
    dom["charts"] = merge_by_id(dom["charts"], EXTRA_JAPAN_CHARTS)
    dom["prefRankings"] = merge_by_id(dom["prefRankings"], EXTRA_JAPAN_PREF_RANKINGS)

    jg_txt = json.dumps(jg, ensure_ascii=False, indent=2)
    hits_jg = SUBCODE_RE.findall(jg_txt)
    if hits_jg:
        raise ValueError(f"japan_geography_v1.json に非13区分コードが含まれています: {sorted(set(hits_jg))}")
    JAPAN_PATH.write_text(jg_txt + "\n", encoding="utf-8")

    print(
        f"Expanded world_rankings_v1.json: items={len(wr['items'])}, "
        f"comparisonCharts={len(wr['comparisonCharts'])}, scatters={len(wr['scatters'])}, "
        f"flowMaps={len(wr['flowMaps'])}"
    )
    print(
        f"Expanded japan_geography_v1.json: charts={len(dom['charts'])}, "
        f"prefRankings={len(dom['prefRankings'])}"
    )


if __name__ == "__main__":
    main()
