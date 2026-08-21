"""
Adverse media screening against a local, SYNTHETIC set of "news mentions".

In production this would call a real media-monitoring API (LexisNexis,
ComplyAdvantage, Refinitiv News, etc). For this demo, app/data/adverse_media.json
holds a small synthetic set of {name, headline, category, source, published_at}
entries -- none of these are real news stories or real people.

Swap _load_adverse_media() for a real news/media API integration before any
production use.
"""
import functools
import json
from pathlib import Path

from rapidfuzz import fuzz, process

from app.config import settings

# Categories that count as a genuine adverse hit (vs. neutral press mentions)
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
    path = Path(settings.adverse_media_json_path)
    if not path.exists():
        return []
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def check_adverse_media(query_name: str, limit: int = 5) -> dict:
    """
    Fuzzy-matches query_name against the synthetic adverse-media dataset.
    Returns {"flagged": bool, "best_score": float, "hits": [...]}

    "flagged" only turns True if a matched entry's category is a genuine
    negative-news category -- neutral/local-news mentions are returned in
    `hits` for transparency but don't flip the flag.
    """
    entries = _load_adverse_media()
    if not entries:
        return {"flagged": False, "best_score": 0.0, "hits": []}

    names_only = [e["name"] for e in entries]
    results = process.extract(
        query_name,
        names_only,
        scorer=fuzz.token_sort_ratio,
        limit=limit,
    )

    hits = []
    best_score = 0.0
    for matched_name, score, idx in results:
        if score >= settings.adverse_media_match_threshold:
            entry = entries[idx]
            hits.append(
                {
                    "matched_name": entry["name"],
                    "score": round(score, 2),
                    "headline": entry["headline"],
                    "category": entry["category"],
                    "source": entry["source"],
                    "published_at": entry["published_at"],
                }
            )
        best_score = max(best_score, score)

    flagged = any(h["category"] in NEGATIVE_CATEGORIES for h in hits)

    return {
        "flagged": flagged,
        "best_score": round(best_score, 2),
        "hits": hits,
    }