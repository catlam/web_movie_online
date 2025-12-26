# serve_api.py — Personalized ALS Recommender (likedItems + category as string)
import os, json
from typing import List, Dict, Set

import numpy as np
from bson import ObjectId
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Movie/Series Recommendation")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MONGO_URL   = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME     = os.getenv("DB_NAME", "Movie-web")
PLAYBACK_COL = os.getenv("WATCH_COLLECTION", "playback_state")  # đồng bộ tên env WATCH_COLLECTION

db = MongoClient(MONGO_URL)[DB_NAME]

# === Load artifacts ===
try:
    with open("artifacts/user_id_map.json", "r", encoding="utf-8") as f:
        users = json.load(f)["users"]
    with open("artifacts/item_id_map.json", "r", encoding="utf-8") as f:
        items = json.load(f)["items"]  # "movie:<id>" or "series:<id>"

    data = np.load("artifacts/als_model.npz")
    U = data["user_factors"]
    V = data["item_factors"]

    # auto-fix if swapped
    if U.shape[0] == len(items) and V.shape[0] == len(users):
        U, V = V, U

    user_index = {u: i for i, u in enumerate(users)}
    item_index = {k: i for i, k in enumerate(items)}

    if U.shape[0] != len(users) or V.shape[0] != len(items):
        raise RuntimeError("Model/Mapping mismatch")

    MODEL_READY = True
except Exception as e:
    print("[ERROR] model load failed:", e)
    users = items = []
    user_index = item_index = {}
    U = V = None
    MODEL_READY = False


# === helpers ===
def _as_oid(s: str):
    try:
        return ObjectId(s)
    except Exception:
        return None

def _split_item_key(key: str):
    parts = key.split(":", 1)
    return (parts[0], parts[1]) if len(parts) == 2 else ("movie", key)

def _fetch_meta(kind: str, oid_str_list: List[str]) -> Dict[str, dict]:
    """
    Fetch movie/series metadata by ids (string form).
    IMPORTANT: category is a STRING in schema.
    """
    oids = [ObjectId(x) for x in oid_str_list if x and _as_oid(x)]
    if not oids:
        return {}

    proj = {
        "title": 1, "name": 1,
        "posterUrl": 1, "image": 1, "titleImage": 1,
        "year": 1, "category": 1, "rate": 1
    }
    col = db.movies if kind == "movie" else db.series
    cur = col.find({"_id": {"$in": oids}}, proj)

    meta = {}
    for d in cur:
        title = d.get("title") or d.get("name") or ""
        poster = d.get("posterUrl") or d.get("image") or d.get("titleImage") or ""
        # category is string; keep as-is (FE hiển thị)
        meta[str(d["_id"])] = {
            "title": title,
            "posterUrl": poster,
            "image": d.get("image"),
            "titleImage": d.get("titleImage"),
            "year": d.get("year"),
            "category": d.get("category") or "",   # string
            "rate": d.get("rate", 0),
        }
    return meta

def _fetch_items(item_keys: List[str]) -> Dict[str, dict]:
    """Fetch metadata for mixed list of 'movie:<id>' / 'series:<id>' keys."""
    by_kind = {"movie": [], "series": []}
    for k in item_keys:
        kind, oid = _split_item_key(k)
        by_kind.setdefault(kind, []).append(oid)

    res = {}
    if by_kind["movie"]:
        chunk = _fetch_meta("movie", by_kind["movie"])
        for oid, doc in chunk.items():
            res[f"movie:{oid}"] = doc
    if by_kind["series"]:
        chunk = _fetch_meta("series", by_kind["series"])
        for oid, doc in chunk.items():
            res[f"series:{oid}"] = doc
    return res

def _user_profile_categories(user_id: str, days: int = 60) -> Set[str]:
    """
    Collect user's preferred categories from:
    - playback_state (dựa theo season/episode để biết movie/series)
    - users.likedItems [{refId, kind}]
    Return lowercase set of categories (strings).
    """
    import datetime
    pref: Set[str] = set()
    oid = _as_oid(user_id)
    if not oid:
        return pref

    since = datetime.datetime.utcnow() - datetime.timedelta(days=days)

    # A) playback_state → quyết định kind theo season/episode
    if PLAYBACK_COL in db.list_collection_names():
        cur = db[PLAYBACK_COL].find(
            {"userId": oid, "lastActionAt": {"$gte": since}},
            {"movieId": 1, "seasonNumber": 1, "episodeNumber": 1}
        )
        movie_ids, series_ids = [], []
        for w in cur:
            mid = w.get("movieId")
            if not mid:
                continue
            is_series = (w.get("seasonNumber") is not None) or (w.get("episodeNumber") is not None)
            if is_series:
                series_ids.append(str(mid))
            else:
                movie_ids.append(str(mid))

        if movie_ids:
            mv = _fetch_meta("movie", movie_ids)
            for m in mv.values():
                c = (m.get("category") or "").strip().lower()
                if c: pref.add(c)
        if series_ids:
            sr = _fetch_meta("series", series_ids)
            for m in sr.values():
                c = (m.get("category") or "").strip().lower()
                if c: pref.add(c)

    # B) likedItems
    udoc = db.users.find_one({"_id": oid}, {"likedItems": 1}) or {}
    for it in (udoc.get("likedItems") or []):
        if not isinstance(it, dict): 
            continue
        ref = _as_oid(str(it.get("refId")))
        kind = it.get("kind")
        if not (ref and kind in ("Movie", "Series")):
            continue
        col = db.movies if kind == "Movie" else db.series
        d = col.find_one({"_id": ref}, {"category": 1}) or {}
        c = (d.get("category") or "").strip().lower()
        if c: pref.add(c)

    return pref

def _trending_filtered(pref: Set[str], topN=12):
    """
    Trending fallback from playback_state, filtered by user's categories (if any).
    category is string; match lowercase.
    """
    import datetime
    since = datetime.datetime.utcnow() - datetime.timedelta(days=30)
    if PLAYBACK_COL not in db.list_collection_names():
        return []

    pipe = [
        {"$match": {"lastActionAt": {"$gte": since}}},
        {"$group": {"_id": "$movieId", "c": {"$sum": 1}}},
        {"$sort": {"c": -1}},
        {"$limit": topN * 3},
    ]
    raw = list(db[PLAYBACK_COL].aggregate(pipe, allowDiskUse=True))
    ids = [str(r["_id"]) for r in raw if r.get("_id")]

    mv = _fetch_meta("movie", ids)
    sr = _fetch_meta("series", ids)

    res = []
    for r in raw:
        oid = str(r["_id"])
        m = mv.get(oid) or sr.get(oid)
        if not m:
            continue
        c = (m.get("category") or "").strip().lower()
        if pref and c not in pref:
            continue
        kind = "movie" if oid in mv else "series"
        res.append({
            "kind": kind,
            "movieId": oid,
            **m
        })
        if len(res) >= topN:
            break
    return res


# === routes ===
@app.get("/healthz")
def healthz():
    return {
        "ok": True,
        "users": len(users),
        "items": len(items),
        "model_ready": MODEL_READY,
        "db": DB_NAME
    }

@app.get("/recommend/user/{uid}")
def recommend(uid: str, n: int = Query(8, ge=1, le=50)):
    if not MODEL_READY:
        raise HTTPException(status_code=503, detail="Model not ready")

    # Cold start or unknown user in factor map → trending theo category (nếu có)
    if uid not in user_index:
        pref = _user_profile_categories(uid)
        items_out = _trending_filtered(pref, topN=n)
        return {"userId": uid, "items": items_out, "cold_start": True}

    uidx = user_index[uid]
    uvec = U[uidx]
    scores = V @ uvec  # (num_items,)

    # Mask watched
    watched_keys = set()
    if PLAYBACK_COL in db.list_collection_names():
        cur = db[PLAYBACK_COL].find(
            {"userId": _as_oid(uid)},
            {"movieId": 1, "seasonNumber": 1, "episodeNumber": 1}
        )
        for w in cur:
            mid = w.get("movieId")
            if not mid:
                continue
            is_series = (w.get("seasonNumber") is not None) or (w.get("episodeNumber") is not None)
            kind = "series" if is_series else "movie"
            watched_keys.add(f"{kind}:{str(mid)}")

    for key in watched_keys:
        idx = item_index.get(key)
        if idx is not None:
            scores[idx] = -1e9

    # User category preferences (lowercase set)
    pref = _user_profile_categories(uid)

    # Lấy nhiều ứng viên rồi lọc theo category
    top_take = min(max(n * 5, n), scores.shape[0])
    idx = np.argpartition(-scores, range(top_take))[:top_take]
    idx = idx[np.argsort(-scores[idx])]

    keys = [items[i] for i in idx]
    meta = _fetch_items(keys)

    result = []
    for i in idx:
        key = items[i]
        kind, oid = _split_item_key(key)
        m = meta.get(key)
        if not m:
            continue
        c = (m.get("category") or "").strip().lower()
        if pref and c not in pref:
            continue
        result.append({
            "kind": kind,
            "movieId": oid,
            **m
        })
        if len(result) >= n:
            break

    # Fallback: nếu không đủ (hoặc pref rỗng) → trending theo pref (có thể rỗng → unfiltered)
    if not result:
        result = _trending_filtered(pref, topN=n)

    return {"userId": uid, "items": result}

@app.get("/recommend/similar/{kind}/{oid}")
def similar(kind: str, oid: str, n: int = Query(12, ge=1, le=50)):
    if not MODEL_READY:
        raise HTTPException(status_code=503, detail="Model not ready")
    if kind not in ("movie", "series"):
        raise HTTPException(status_code=400, detail="kind must be 'movie' or 'series'")

    key = f"{kind}:{oid}"
    if key not in item_index:
        return {"itemKey": key, "items": []}

    midx = item_index[key]
    v = V[midx]
    sims = V @ v
    sims[midx] = -1e9

    take = min(n, sims.shape[0] - 1)
    idx = np.argpartition(-sims, range(take))[:take]
    idx = idx[np.argsort(-sims[idx])]

    keys = [items[i] for i in idx]
    meta = _fetch_items(keys)

    out = []
    for i in idx:
        k = items[i]
        k_kind, k_oid = _split_item_key(k)
        m = meta.get(k)
        if not m:
            continue
        out.append({
            "kind": k_kind,
            "movieId": k_oid,
            **m
        })
    return {"itemKey": key, "items": out}
