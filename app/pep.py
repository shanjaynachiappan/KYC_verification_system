"""
PEP (Politically Exposed Person) screening using a synthetic local dataset.

Mirrors the sanctions screening in app/aml.py, but checks the verified name
against app/data/pep_list.csv -- a small SYNTHETIC, made-up set of PEP-style
profiles for demo purposes. None of the names in that file are real people.

Swap _load_pep_entries() for a real PEP data provider feed (Dow Jones,
Refinitiv World-Check, ComplyAdvantage, an OpenSanctions "peps" export, etc.)
before any production use.
"""
import csv
import functools
from pathlib import Path

from rapidfuzz import fuzz, process

from app.config import settings


@functools.lru_cache(maxsize=1)
def _load_pep_entries() -> list[dict]:
    path = Path(settings.pep_csv_path)
    if not path.exists():
        # Fail-soft sample so the demo still runs even without the CSV.
        return [
            {"name": "Arvind Sharma", "position": "Union Minister of State",
             "country": "India", "category": "Domestic PEP"},
            {"name": "Elena Petrova", "position": "Deputy Minister of Finance",
             "country": "Russia", "category": "Foreign PEP"},
        ]

    entries = []
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row.get("name", "").strip()
            if not name:
                continue
            entries.append(
                {
                    "name": name,
                    "position": row.get("position", ""),
                    "country": row.get("country", ""),
                    "category": row.get("pep_category", ""),
                }
            )
    return entries


def screen_pep(query_name: str, limit: int = 5) -> dict:
    """
    Fuzzy-matches query_name against the synthetic PEP list.
    Returns {"matched": bool, "best_score": float, "matches": [...]}
    """
    entries = _load_pep_entries()
    names_only = [e["name"] for e in entries]

    results = process.extract(
        query_name,
        names_only,
        scorer=fuzz.token_sort_ratio,
        limit=limit,
    )

    matches = []
    best_score = 0.0
    for matched_name, score, idx in results:
        if score >= settings.pep_match_threshold:
            entry = entries[idx]
            matches.append(
                {
                    "matched_name": entry["name"],
                    "score": round(score, 2),
                    "position": entry["position"],
                    "country": entry["country"],
                    "category": entry["category"],
                }
            )
        best_score = max(best_score, score)

    return {
        "matched": len(matches) > 0,
        "best_score": round(best_score, 2),
        "matches": matches,
    }