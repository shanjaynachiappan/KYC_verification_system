import csv
import functools
from pathlib import Path
from rapidfuzz import fuzz, process
from app.config import settings

@functools.lru_cache(maxsize=1)
def _load_pep_names() -> list[dict]:
    path = Path(settings.pep_csv_path)
    if not path.exists():
        return [
            {"name": "Test PEP", "position": "Minister of Test", "country": "Testland", "pep_category": "Foreign PEP"}
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
                    "pep_category": row.get("pep_category", ""),
                }
            )
    return entries

def screen_pep(query_name: str, limit: int = 5) -> dict:
    entries = _load_pep_names()
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
                    "pep_category": entry["pep_category"],
                }
            )
        best_score = max(best_score, score)

    return {
        "matched": len(matches) > 0,
        "best_score": round(best_score, 2),
        "matches": matches,
    }
