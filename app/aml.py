"""
AML / sanctions screening using a local OpenSanctions export + RapidFuzz.

Data source: https://www.opensanctions.org/datasets/  (free, no license needed)
Download the "targets.simple.csv" (or similar consolidated CSV) from their
"default" dataset page and place it at the path in OPENSANCTIONS_CSV_PATH.

Expected CSV columns (OpenSanctions' simple/targets export uses these):
  id, schema, name, aliases, birth_date, countries, topics, datasets
We only really need: name, topics, datasets (used as "source_dataset").

If your downloaded file has different column names, adjust COLUMN_MAP below --
this is the one place you may need to tweak after downloading the real file.
"""
import csv
import functools
from pathlib import Path

from rapidfuzz import fuzz, process

from app.config import settings

COLUMN_MAP = {
    "name": "name",
    "topics": "topics",
    "source": "datasets",
}


@functools.lru_cache(maxsize=1)
def _load_sanctions_names() -> list[dict]:
    """
    Loads the CSV once and caches it in memory for the process lifetime.
    Returns a list of {"name": str, "topics": str, "source": str}
    """
    path = Path(settings.opensanctions_csv_path)
    if not path.exists():
        # Fail soft with a tiny built-in sample list so the demo still runs
        # even before the real CSV is downloaded -- swap this out once you
        # have the real file (see README section 4).
        return [
            {"name": "Osama Bin Laden", "topics": "sanction", "source": "sample-fallback"},
            {"name": "Vladimir Putin", "topics": "sanction.linked", "source": "sample-fallback"},
            {"name": "Kim Jong Un", "topics": "sanction", "source": "sample-fallback"},
        ]

    entries = []
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row.get(COLUMN_MAP["name"], "").strip()
            if not name:
                continue
            entries.append(
                {
                    "name": name,
                    "topics": row.get(COLUMN_MAP["topics"], ""),
                    "source": row.get(COLUMN_MAP["source"], ""),
                }
            )
    return entries


def screen_name(query_name: str, limit: int = 5) -> dict:
    """
    Fuzzy-matches query_name against the sanctions list.
    Returns {"matched": bool, "best_score": float, "matches": [...]}
    """
    entries = _load_sanctions_names()
    names_only = [e["name"] for e in entries]

    # token_sort_ratio handles word-order/spacing differences well for names
    results = process.extract(
        query_name,
        names_only,
        scorer=fuzz.token_sort_ratio,
        limit=limit,
    )
    # results is a list of (matched_string, score, index)

    matches = []
    best_score = 0.0
    for matched_name, score, idx in results:
        if score >= settings.aml_match_threshold:
            entry = entries[idx]
            matches.append(
                {
                    "matched_name": entry["name"],
                    "score": round(score, 2),
                    "topics": entry["topics"],
                    "source_dataset": entry["source"],
                }
            )
        best_score = max(best_score, score)

    return {
        "matched": len(matches) > 0,
        "best_score": round(best_score, 2),
        "matches": matches,
    }
