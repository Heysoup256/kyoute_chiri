"""Fetch real photographs via Wikipedia pageimages API for daily life sections."""

from __future__ import annotations

import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

RAW_DIR = Path(__file__).resolve().parents[1] / "raw"
IN_PATH = RAW_DIR / "country_overviews_and_life_v1.json"
OUT_PATH = RAW_DIR / "life_photos_v1.json"

WIKI_API = "https://en.wikipedia.org/w/api.php"
REJECT_SUBSTRS = (".svg", "flag_of_", "locator_map", "location_map", "coat_of_arms", "emblem_of")


def is_usable_photo_url(url: str | None) -> bool:
    if not url or not url.startswith("http"):
        return False
    low = url.lower()
    if any(bad in low for bad in REJECT_SUBSTRS):
        return False
    return any(ext in low for ext in (".jpg", ".jpeg", ".png", ".webp"))


def query_pageimages(titles: list[str]) -> dict[str, dict[str, str]]:
    """Batch query up to 50 Wikipedia titles for thumbnail URLs."""
    results: dict[str, dict[str, str]] = {}
    for i in range(0, len(titles), 50):
        batch = titles[i : i + 50]
        params = urllib.parse.urlencode(
            {
                "action": "query",
                "titles": "|".join(batch),
                "redirects": "1",
                "prop": "pageimages|info",
                "inprop": "url",
                "pithumbsize": "640",
                "format": "json",
            }
        )
        req = urllib.request.Request(
            f"{WIKI_API}?{params}",
            headers={"User-Agent": "kyoute-chiri-edu/1.0 (local study tool)"},
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        query = data.get("query", {})
        norm_map = {n["from"]: n["to"] for n in query.get("normalized", [])}
        redir_map = {r["from"]: r["to"] for r in query.get("redirects", [])}
        pages_by_title: dict[str, dict] = {}
        for page in query.get("pages", {}).values():
            if "title" in page:
                pages_by_title[page["title"]] = page

        for orig in batch:
            cur = norm_map.get(orig, orig)
            cur = redir_map.get(cur, cur)
            page = pages_by_title.get(cur)
            if not page:
                continue
            thumb = (page.get("thumbnail") or {}).get("source")
            if is_usable_photo_url(thumb):
                results[orig] = {
                    "url": thumb,
                    "title": cur,
                    "pageUrl": page.get("fullurl", ""),
                }
        time.sleep(0.15)
    return results


def main() -> None:
    data = json.loads(IN_PATH.read_text(encoding="utf-8"))
    all_titles: list[str] = []
    seen: set[str] = set()
    for entry in data.values():
        targets = entry.get("wikiPhotoTargets") or entry.get("dailyLife", {}).get("wikiPhotoTargets", [])
        for target in targets:
            candidates = [target["title"], *target.get("fallbackTitles", [])]
            for t in candidates:
                if t and t not in seen:
                    seen.add(t)
                    all_titles.append(t)

    print(f"Querying Wikipedia pageimages for {len(all_titles)} candidate titles...")
    found_map = query_pageimages(all_titles)

    out: dict[str, list[dict[str, str]]] = {}
    missing: list[tuple[str, str]] = []
    for iso3, entry in sorted(data.items()):
        photos: list[dict[str, str]] = []
        used_urls: set[str] = set()
        targets = entry.get("wikiPhotoTargets") or entry.get("dailyLife", {}).get("wikiPhotoTargets", [])
        for target in targets:
            candidates = [target["title"], *target.get("fallbackTitles", [])]
            chosen = None
            for t in candidates:
                info = found_map.get(t)
                if info and info["url"] not in used_urls:
                    chosen = info
                    break
            if chosen:
                used_urls.add(chosen["url"])
                photos.append(
                    {
                        "url": chosen["url"],
                        "caption": target["caption"],
                        "credit": f"Wikimedia Commons（出典記事: {chosen['title']}）",
                    }
                )
            else:
                missing.append((iso3, target["title"]))
        out[iso3] = photos

    OUT_PATH.write_text(
        json.dumps(out, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    counts = [len(v) for v in out.values()]
    zero_countries = [k for k, v in out.items() if len(v) == 0]
    one_countries = [k for k, v in out.items() if len(v) == 1]
    print(
        f"Saved {len(out)} countries to {OUT_PATH}. "
        f"Total photos={sum(counts)}, 2-photo={counts.count(2)}, 1-photo={len(one_countries)}, 0-photo={len(zero_countries)}"
    )
    if missing:
        print(f"Missing targets ({len(missing)}): {missing[:20]}")


if __name__ == "__main__":
    main()
