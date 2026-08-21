import json
import functools
from pathlib import Path
from rapidfuzz import fuzz, process
from app.config import settings

NEGATIVE_CATEGORIES = {
    "fraud",
    "money laundering",
    "corruption",
    "sanctions evasion",
    "terrorism financing",
    "tax evasion",
}

@functools.lru_cache(maxsize=1)
def _load_adverse_media() -> list[dict]:
    path = Path(settings.adverse_media_path)
    if not path.exists():
        return [
            {"name": "Test Adverse", "headline": "Arrested for fraud", "category": "fraud", "source": "Test News", "published_at": "2023-01-01"}
        ]
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def screen_adverse_media(query_name: str, limit: int = 5) -> dict:
    entries = _load_adverse_media()
    
    matches = []
    has_negative_hit = False

    for entry in entries:
        name = entry.get("name", "")
        # Use simple string match or fuzzy match (we use fuzzy match for consistency)
        score = fuzz.token_sort_ratio(query_name, name)
        
        if score >= settings.aml_match_threshold:
            category = entry.get("category", "").lower()
            is_negative = category in NEGATIVE_CATEGORIES
            
            if is_negative:
                has_negative_hit = True

            matches.append({
                "matched_name": name,
                "score": round(score, 2),
                "headline": entry.get("headline", ""),
                "category": category,
                "source": entry.get("source", ""),
                "published_at": entry.get("published_at", ""),
                "is_negative": is_negative,
            })

    # Sort matches by score descending
    matches = sorted(matches, key=lambda x: x["score"], reverse=True)[:limit]
    best_score = matches[0]["score"] if matches else 0.0

    return {
        "matched": has_negative_hit, # Only true if there's a negative hit
        "best_score": round(best_score, 2),
        "matches": matches,
    }
