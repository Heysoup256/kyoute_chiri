"""Download verified 2015-2023 Geography B exam & answer PDFs from Wayback Machine and inspect their PDF layout."""

from __future__ import annotations

import json
import re
import time
import urllib.request
from pathlib import Path

import pymupdf

ROOT_DIR = Path(__file__).resolve().parents[2]
OUT_PDF_DIR = ROOT_DIR / "data_pipeline" / "raw" / "wayback_pdfs"
DIAG_OUT = ROOT_DIR / "data_pipeline" / "raw" / "wayback_diag_v1.json"

WAYBACK_EXAMS = [
    {
        "examId": "2023_main",
        "year": 2023,
        "session": "main",
        "examType": "kyotsu",
        "sessionLabel": "2023年度 共通テスト 本試験（地理B）",
        "questionPdf": "2023_main_question.pdf",
        "answerPdf": "2023_main_answer.pdf",
        "qUrl": "https://web.archive.org/web/20240506043803id_/https://www.dnc.ac.jp/albums/abm.php?d=432&f=abm00003648.pdf&n=2023_ot_07_chiriB.pdf",
        "aUrl": "https://web.archive.org/web/20231203100944id_/https://www.dnc.ac.jp/albums/abm.php?d=507&f=abm00003321.pdf&n=R5_%E5%9C%B0%E7%90%86B_%E6%9C%AC%E8%A9%A6%E9%A8%93%E3%81%AE%E6%AD%A3%E8%A7%A3.pdf",
    },
    {
        "examId": "2023_makeup",
        "year": 2023,
        "session": "makeup",
        "examType": "kyotsu",
        "sessionLabel": "2023年度 共通テスト 追・再試験（地理B）",
        "questionPdf": "2023_makeup_question.pdf",
        "answerPdf": "2023_makeup_answer.pdf",
        "qUrl": "https://web.archive.org/web/20240416102349id_/https://www.dnc.ac.jp/albums/abm.php?d=434&f=abm00003696.pdf&n=2023_os_07_chiriB.pdf",
        "aUrl": "https://web.archive.org/web/20231203114205id_/https://www.dnc.ac.jp/albums/abm.php?d=508&f=abm00003387.pdf&n=R5_%E5%9C%B0%E7%90%86B_%E8%BF%BD%E8%A9%A6%E9%A8%93%E3%81%AE%E6%AD%A3%E8%A7%A3.pdf",
    },
    {
        "examId": "2022_main",
        "year": 2022,
        "session": "main",
        "examType": "kyotsu",
        "sessionLabel": "2022年度 共通テスト 本試験（地理B）",
        "questionPdf": "2022_main_question.pdf",
        "answerPdf": "2022_main_answer.pdf",
        "qUrl": "https://web.archive.org/web/20221208213151id_/https://www.dnc.ac.jp/albums/abm.php?d=67&f=abm00000862.pdf&n=R4%E5%95%8F%E9%A1%8C_%E5%95%8F%E9%A1%8C_%E5%9C%B0%E7%90%86%EF%BC%A2.pdf",
        "aUrl": "https://web.archive.org/web/20230926022853id_/https://www.dnc.ac.jp/albums/abm.php?d=68&f=abm00000894.pdf&n=R4_%E5%9C%B0%E7%90%86%EF%BC%A2_%E6%9C%AC%E8%A9%A6%E9%A8%93%E3%81%AE%E6%AD%A3%E8%A7%A3.pdf",
    },
    {
        "examId": "2022_makeup",
        "year": 2022,
        "session": "makeup",
        "examType": "kyotsu",
        "sessionLabel": "2022年度 共通テスト 追・再試験（地理B）",
        "questionPdf": "2022_makeup_question.pdf",
        "answerPdf": "2022_makeup_answer.pdf",
        "qUrl": "https://web.archive.org/web/20221130144501id_/https://www.dnc.ac.jp/albums/abm.php?d=69&f=abm00000952.pdf&n=R4%E8%BF%BD%E3%83%BB%E5%86%8D%E8%A9%A6%E9%A8%93%E3%81%AE%E5%95%8F%E9%A1%8C_%E5%95%8F%E9%A1%8C_%E5%9C%B0%E7%90%86%EF%BC%A2.pdf",
        "aUrl": "https://web.archive.org/web/20230926024030id_/https://www.dnc.ac.jp/albums/abm.php?d=70&f=abm00000975.pdf&n=R4_%E5%9C%B0%E7%90%86%EF%BC%A2_%E8%BF%BD%E3%83%BB%E5%86%8D%E8%A9%A6.pdf",
    },
    {
        "examId": "2021_main",
        "year": 2021,
        "session": "main",
        "examType": "kyotsu",
        "sessionLabel": "2021年度 共通テスト 第1日程（地理B）",
        "questionPdf": "2021_main_question.pdf",
        "answerPdf": "2021_main_answer.pdf",
        "qUrl": "https://web.archive.org/web/20221209223741id_/https://www.dnc.ac.jp/albums/abm.php?d=88&f=abm00001290.pdf&n=R3_%E5%9C%B0%E7%90%86%EF%BC%A2%EF%BC%88%EF%BC%91%E6%9C%8816%E6%97%A5%E3%83%BB17%E6%97%A5%EF%BC%89%E3%81%AE%E5%95%8F%E9%A1%8C.pdf",
        "aUrl": "https://web.archive.org/web/20230926023513id_/https://www.dnc.ac.jp/albums/abm.php?d=89&f=abm00001327.pdf&n=R3_%E5%9C%B0%E7%90%86%EF%BC%A2%EF%BC%88%EF%BC%91%E6%9C%8816%E6%97%A5%E3%83%BB17%E6%97%A5%EF%BC%89%E3%81%AE%E6%AD%A3%E8%A7%A3.pdf",
    },
    {
        "examId": "2021_makeup",
        "year": 2021,
        "session": "makeup",
        "examType": "kyotsu",
        "sessionLabel": "2021年度 共通テスト 第2日程（地理B）",
        "questionPdf": "2021_makeup_question.pdf",
        "answerPdf": "2021_makeup_answer.pdf",
        "qUrl": "https://web.archive.org/web/20221130134930id_/https://www.dnc.ac.jp/albums/abm.php?d=90&f=abm00001386.pdf&n=R3_%E5%9C%B0%E7%90%86%EF%BC%A2%EF%BC%88%EF%BC%91%E6%9C%8830%E6%97%A5%E3%83%BB31%E6%97%A5%EF%BC%89%E3%81%AE%E5%95%8F%E9%A1%8C.pdf",
        "aUrl": "https://web.archive.org/web/20230929200430id_/https://www.dnc.ac.jp/albums/abm.php?d=91&f=abm00001416.pdf&n=R3_%E5%9C%B0%E7%90%86%EF%BC%A2%EF%BC%88%EF%BC%91%E6%9C%8830%E6%97%A5%E3%83%BB31%E6%97%A5%EF%BC%89%E3%81%AE%E6%AD%A3%E8%A7%A3.pdf",
    },
    {
        "examId": "2020_main",
        "year": 2020,
        "session": "main",
        "examType": "center",
        "sessionLabel": "2020年度 センター試験 本試験（地理B）",
        "questionPdf": "2020_main_question.pdf",
        "answerPdf": "2020_main_answer.pdf",
        "qUrl": "https://web.archive.org/web/20230126042655id_/https://www.dnc.ac.jp/albums/abm.php?d=239&f=abm00002151.pdf&n=R2%E5%95%8F%E9%A1%8C_%E5%9C%B0%E7%90%86%EF%BC%A2.pdf",
        "aUrl": "https://web.archive.org/web/20211227140759id_/https://www.dnc.ac.jp/albums/abm.php?f=abm00038045.pdf&n=06+%E5%9C%B0%E7%90%86B%E3%80%80H.pdf",
    },
    {
        "examId": "2020_makeup",
        "year": 2020,
        "session": "makeup",
        "examType": "center",
        "sessionLabel": "2020年度 センター試験 追・再試験（地理B）",
        "questionPdf": "2020_makeup_question.pdf",
        "answerPdf": "2020_makeup_answer.pdf",
        "qUrl": "https://web.archive.org/web/20220706082842id_/https://www.dnc.ac.jp/albums/abm.php?f=abm00038462.pdf&n=2020-%E5%9C%B0%E7%90%86B-G(HP%E5%B7%AE%E6%9B%BF%EF%BC%89.pdf",
        "aUrl": "https://web.archive.org/web/20220530054141id_/https://www.dnc.ac.jp/albums/abm.php?f=abm00038144.pdf&n=06+%E5%9C%B0%E7%90%86B%E3%80%80G.pdf",
    },
    {
        "examId": "2019_main",
        "year": 2019,
        "session": "main",
        "examType": "center",
        "sessionLabel": "2019年度 センター試験 本試験（地理B）",
        "questionPdf": "2019_main_question.pdf",
        "answerPdf": "2019_main_answer.pdf",
        "qUrl": "https://web.archive.org/web/20210816054023id_/https://www.dnc.ac.jp/albums/abm.php?f=abm00036445.pdf&n=k+07+chiriB.pdf",
        "aUrl": "https://web.archive.org/web/20211227141619id_/https://www.dnc.ac.jp/albums/abm.php?f=abm00035737.pdf&n=%E5%9C%B0%E7%90%86B.pdf",
    },
    {
        "examId": "2019_makeup",
        "year": 2019,
        "session": "makeup",
        "examType": "center",
        "sessionLabel": "2019年度 センター試験 追・再試験（地理B）",
        "questionPdf": "2019_makeup_question.pdf",
        "answerPdf": "2019_makeup_answer.pdf",
        "qUrl": "https://web.archive.org/web/20211227140652id_/https://www.dnc.ac.jp/albums/abm.php?f=abm00036497.pdf&n=j+07+chiriB.pdf",
        "aUrl": "https://web.archive.org/web/20211227135712id_/https://www.dnc.ac.jp/albums/abm.php?f=abm00035795.pdf&n=%E5%9C%B0%E7%90%86B.pdf",
    },
    {
        "examId": "2018_main",
        "year": 2018,
        "session": "main",
        "examType": "center",
        "sessionLabel": "2018年度 センター試験 本試験（地理B）",
        "questionPdf": "2018_main_question.pdf",
        "answerPdf": "2018_main_answer.pdf",
        "qUrl": "https://web.archive.org/web/20211009235110id_/https://www.dnc.ac.jp/albums/abm.php?f=abm00033448.pdf&n=h30+chireki+06chiriB.pdf",
        "aUrl": "https://web.archive.org/web/20210613014306id_/https://www.dnc.ac.jp/albums/abm.php?f=abm00011327.pdf&n=06%E5%9C%B0%E7%90%86%EF%BC%A2.pdf",
    },
    {
        "examId": "2018_makeup",
        "year": 2018,
        "session": "makeup",
        "examType": "center",
        "sessionLabel": "2018年度 センター試験 追・再試験（地理B）",
        "questionPdf": "2018_makeup_question.pdf",
        "answerPdf": "2018_makeup_answer.pdf",
        "qUrl": "https://web.archive.org/web/20211010021212id_/https://www.dnc.ac.jp/albums/abm.php?f=abm00033260.pdf&n=h30L+chireki+06chiriB.pdf",
        "aUrl": "https://web.archive.org/web/20180311213504id_/http://www.dnc.ac.jp:80/albums/abm.php?f=abm00011378.pdf&n=06%E5%9C%B0%E7%90%86%EF%BC%A2.pdf",
    },
    {
        "examId": "2017_main",
        "year": 2017,
        "session": "main",
        "examType": "center",
        "sessionLabel": "2017年度 センター試験 本試験（地理B）",
        "questionPdf": "2017_main_question.pdf",
        "answerPdf": "2017_main_answer.pdf",
        "qUrl": "https://web.archive.org/web/20180626025109id_/http://www.dnc.ac.jp:80/albums/abm.php?f=abm00009403.pdf&n=%E5%9C%B0%E7%90%86%EF%BC%A2.pdf",
        "aUrl": "https://web.archive.org/web/20210926024117id_/https://www.dnc.ac.jp/albums/abm.php?f=abm00009577.pdf&n=%E5%9C%B0%E7%90%86B.pdf",
    },
    {
        "examId": "2017_makeup",
        "year": 2017,
        "session": "makeup",
        "examType": "center",
        "sessionLabel": "2017年度 センター試験 追・再試験（地理B）",
        "questionPdf": "2017_makeup_question.pdf",
        "answerPdf": "2017_makeup_answer.pdf",
        "qUrl": "https://web.archive.org/web/20171112140041id_/http://www.dnc.ac.jp:80/albums/abm.php?f=abm00009457.pdf&n=%E5%9C%B0%E7%90%86%EF%BC%A2.pdf",
        "aUrl": "https://web.archive.org/web/20171112135259id_/http://www.dnc.ac.jp:80/albums/abm.php?f=abm00009618.pdf&n=%E5%9C%B0%E7%90%86B.pdf",
    },
    {
        "examId": "2016_main",
        "year": 2016,
        "session": "main",
        "examType": "center",
        "sessionLabel": "2016年度 センター試験 本試験（地理B）",
        "questionPdf": "2016_main_question.pdf",
        "answerPdf": "2016_main_answer.pdf",
        "qUrl": "https://web.archive.org/web/20181029065505id_/http://www.dnc.ac.jp:80/albums/abm.php?f=abm00008834.pdf&n=(2809)2801-0206chiriB.pdf",
        "aUrl": "https://web.archive.org/web/20210926040545id_/https://www.dnc.ac.jp/albums/abm.php?f=abm00006808.pdf&n=%E5%9C%B0%E7%90%86%EF%BC%A2.pdf",
    },
    {
        "examId": "2015_main",
        "year": 2015,
        "session": "main",
        "examType": "center",
        "sessionLabel": "2015年度 センター試験 本試験（地理B）",
        "questionPdf": "2015_main_question.pdf",
        "answerPdf": "2015_main_answer.pdf",
        "qUrl": "https://web.archive.org/web/20180419041738id_/http://www.dnc.ac.jp:80/albums/abm.php?f=abm00005017.pdf&n=270610+chiriB.pdf",
        "aUrl": "https://web.archive.org/web/20210926064713id_/https://www.dnc.ac.jp/albums/abm.php?f=abm00004655.pdf&n=06%E3%80%8027%E5%9C%B0%E7%90%86%EF%BC%A2.pdf",
    },
]


def download_pdf(url: str, dest: Path, min_bytes: int) -> str:
    if dest.exists() and dest.stat().st_size >= min_bytes:
        head = dest.read_bytes()[:8]
        if head.startswith(b"%PDF-"):
            return f"cached ({dest.stat().st_size:,} B)"

    last_err: Exception | None = None
    for attempt in range(3):
        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "kyoute-chiri-edu/1.0 (https://web.archive.org)"},
            )
            with urllib.request.urlopen(req, timeout=90) as resp:
                data = resp.read()
            if not data[:8].startswith(b"%PDF-"):
                raise ValueError(f"Not a PDF header: {data[:40]!r}")
            if len(data) < min_bytes:
                raise ValueError(f"PDF too small ({len(data)} bytes < {min_bytes})")
            dest.write_bytes(data)
            return f"downloaded ({len(data):,} B)"
        except Exception as exc:
            last_err = exc
            time.sleep(2.5 * (2**attempt))
    raise RuntimeError(f"Failed downloading {dest.name}: {last_err}")


def normalize_ascii(s: str) -> str:
    return re.sub(r"\s+", " ", s.translate(str.maketrans("０１２３４５６７８９", "0123456789"))).strip()


def diagnose_exam(cfg: dict) -> dict:
    q_path = OUT_PDF_DIR / cfg["questionPdf"]
    a_path = OUT_PDF_DIR / cfg["answerPdf"]

    # Inspect answer PDF
    a_doc = pymupdf.open(a_path)
    a_text_lines = [ln.strip() for ln in normalize_ascii(a_doc[0].get_text("text")).split("  ") if ln.strip()]
    a_words = a_doc[0].get_text("words")
    header_xs = sorted([round(w[0], 1) for w in a_words if "解答番号" in w[4]])
    a_sample = normalize_ascii(a_doc[0].get_text("text"))[:260]
    a_doc.close()

    # Inspect question PDF
    q_doc = pymupdf.open(q_path)
    pages_count = len(q_doc)
    image_only_pages: list[int] = []
    text_pages_count = 0
    daimon_hits: list[tuple[int, int]] = []
    toi_hits: list[tuple[int, int]] = []

    for pno in range(pages_count):
        page = q_doc[pno]
        full_txt = page.get_text("text").strip()
        if not full_txt:
            image_only_pages.append(pno + 1)
            continue
        text_pages_count += 1
        blocks = sorted(page.get_text("blocks"), key=lambda b: (b[1], b[0]))
        for b in blocks:
            txt = normalize_ascii(b[4])
            md = re.search(r"第\s*([1-6])\s*問", txt)
            if md and ("配点" in txt or "答えよ" in txt or b[1] < 200):
                daimon_hits.append((pno + 1, int(md.group(1))))
            mt = re.search(r"(?:^| )問\s*([1-9])(?=\D|$)", txt)
            if mt:
                q_num = int(mt.group(1))
                if not (toi_hits and toi_hits[-1] == (pno + 1, q_num)):
                    toi_hits.append((pno + 1, q_num))
    q_doc.close()

    return {
        "examId": cfg["examId"],
        "examType": cfg["examType"],
        "pagesCount": pages_count,
        "textPages": text_pages_count,
        "imageOnlyPages": image_only_pages,
        "daimonHitsCount": len(daimon_hits),
        "toiHitsCount": len(toi_hits),
        "toiSeq": [t[1] for t in toi_hits],
        "answerHeaderXs": header_xs,
        "answerSample": a_sample,
        "answerLinesCount": len(a_text_lines),
    }


def main() -> None:
    OUT_PDF_DIR.mkdir(parents=True, exist_ok=True)
    diags: list[dict] = []
    for cfg in WAYBACK_EXAMS:
        q_stat = download_pdf(cfg["qUrl"], OUT_PDF_DIR / cfg["questionPdf"], min_bytes=200_000)
        time.sleep(0.8)
        a_stat = download_pdf(cfg["aUrl"], OUT_PDF_DIR / cfg["answerPdf"], min_bytes=5_000)
        time.sleep(0.8)
        info = diagnose_exam(cfg)
        diags.append(info)
        print(
            f"{cfg['examId']:12s} | Q:{q_stat} A:{a_stat} | "
            f"pages={info['pagesCount']} (txt={info['textPages']}, imgOnly={info['imageOnlyPages']}) | "
            f"daimon={info['daimonHitsCount']} toi={info['toiHitsCount']} ansHdrXs={info['answerHeaderXs']}"
        )

    DIAG_OUT.write_text(json.dumps(diags, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Saved diagnostic report to {DIAG_OUT}")


if __name__ == "__main__":
    main()
