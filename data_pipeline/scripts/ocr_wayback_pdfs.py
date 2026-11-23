"""Batch-OCR scanned and image-only Wayback PDF pages using built-in Windows Japanese OcrEngine."""

from __future__ import annotations

import json
import subprocess
from pathlib import Path

import pymupdf

ROOT_DIR = Path(__file__).resolve().parents[2]
WAYBACK_PDF_DIR = ROOT_DIR / "data_pipeline" / "raw" / "wayback_pdfs"
DIAG_PATH = ROOT_DIR / "data_pipeline" / "raw" / "wayback_diag_v1.json"
OVERRIDES_PATH = ROOT_DIR / "data_pipeline" / "raw" / "wayback_answer_overrides_v1.json"
TMP_DIR = WAYBACK_PDF_DIR / "ocr_tmp"
CACHE_DIR = WAYBACK_PDF_DIR / "ocr_cache"
PS_SCRIPT = ROOT_DIR / "data_pipeline" / "scripts" / "ocr_batch.ps1"

DPI = 180


def verify_answer_overrides() -> None:
    data = json.loads(OVERRIDES_PATH.read_text(encoding="utf-8"))
    for eid, entry in data.items():
        total = sum(q["points"] for q in entry["questions"])
        assert total == 100, f"{eid}: total points={total} != 100"
        for d_str, d_score in entry["daimonScores"].items():
            d_sum = sum(q["points"] for q in entry["questions"] if str(q["daimon"]) == d_str)
            assert d_sum == d_score, f"{eid} d={d_str}: sum={d_sum} != {d_score}"
    print(f"Verified answer overrides for {len(data)} exams (all 100 points exact).")


def main() -> None:
    verify_answer_overrides()
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    diag = json.loads(DIAG_PATH.read_text(encoding="utf-8"))
    manifest: list[dict] = []
    scale_by_exam: dict[str, dict[int, float]] = {}

    for entry in diag:
        eid = entry["examId"]
        img_pages = entry.get("imageOnlyPages", [])
        if not img_pages:
            continue
        cache_file = CACHE_DIR / f"{eid}.json"
        # Skip if already cached covering every imageOnlyPage
        if cache_file.exists():
            existing = json.loads(cache_file.read_text(encoding="utf-8"))
            cached_pages = {int(p) for p in existing.get("pages", {}).keys()}
            if all(p in cached_pages for p in img_pages):
                print(f"OCR cache hit: {eid} ({len(img_pages)} pages)")
                continue

        pdf_path = WAYBACK_PDF_DIR / f"{eid}_question.pdf"
        doc = pymupdf.open(pdf_path)
        for p_one in img_pages:
            p_idx = p_one - 1
            page = doc[p_idx]
            png_path = TMP_DIR / f"{eid}_p{p_one:03d}.png"
            pix = page.get_pixmap(dpi=DPI, alpha=False)
            pix.save(str(png_path))
            # Convert OCR pixel coordinates back to PDF point coordinates
            pt_scale = page.rect.width / pix.width
            scale_by_exam.setdefault(eid, {})[p_one] = pt_scale
            manifest.append(
                {
                    "key": f"{eid}:{p_one}",
                    "examId": eid,
                    "page": p_one,
                    "dpi": DPI,
                    "pngPath": str(png_path),
                }
            )
        doc.close()

    if not manifest:
        print("All OCR pages already cached.")
        return

    manifest_path = TMP_DIR / "ocr_manifest.json"
    raw_out_path = TMP_DIR / "ocr_raw_output.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Running Windows Japanese OCR on {len(manifest)} PDF pages...")
    cmd = [
        "powershell",
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        str(PS_SCRIPT),
        "-ManifestJson",
        str(manifest_path),
        "-OutJson",
        str(raw_out_path),
    ]
    subprocess.run(cmd, check=True)

    raw_results = json.loads(raw_out_path.read_text(encoding="utf-8"))
    grouped: dict[str, dict[str, dict]] = {}
    for item in raw_results:
        eid = item["examId"]
        p_one = int(item["page"])
        scale = scale_by_exam[eid][p_one]
        pdf_lines = []
        for ln in item.get("lines", []):
            pdf_lines.append(
                {
                    "text": ln["text"],
                    "x": round(ln["x"] * scale, 1),
                    "y": round(ln["y"] * scale, 1),
                    "x2": round(ln["x2"] * scale, 1),
                    "y2": round(ln["y2"] * scale, 1),
                }
            )
        grouped.setdefault(eid, {})[str(p_one)] = {
            "page": p_one,
            "lines": sorted(pdf_lines, key=lambda l: (l["y"], l["x"])),
        }

    for eid, pages_map in grouped.items():
        cache_file = CACHE_DIR / f"{eid}.json"
        if cache_file.exists():
            prev = json.loads(cache_file.read_text(encoding="utf-8")).get("pages", {})
            prev.update(pages_map)
            pages_map = prev
        cache_file.write_text(
            json.dumps({"examId": eid, "pages": pages_map}, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        print(f"Saved OCR cache: {cache_file.name} ({len(pages_map)} pages)")


if __name__ == "__main__":
    main()
