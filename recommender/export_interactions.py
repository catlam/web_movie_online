# export_interactions.py
# ---------------------------------------------------------
# Export training data (user–item interactions) for ALS model.
# Only use: playback_state + users.likedItems + movies.reviews.rating
# ---------------------------------------------------------

import os, sys, json
from collections import defaultdict
from bson import ObjectId
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

# === ENV ===
MONGO_URL   = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME     = os.getenv("DB_NAME", "Movie-web")
WATCH_COL   = os.getenv("WATCH_COLLECTION", "playback_state")
USERS_COL   = os.getenv("USERS_COLLECTION", "users")
MOVIES_COL  = os.getenv("MOVIES_COLLECTION", "movies")
SERIES_COL  = os.getenv("SERIES_COLLECTION", "series")

print(f"[INFO] MONGO_URL={MONGO_URL}")
print(f"[INFO] DB_NAME={DB_NAME}")
print(f"[INFO] WATCH_COLLECTION={WATCH_COL}")
print(f"[INFO] USERS_COLLECTION={USERS_COL}")
print(f"[INFO] MOVIES_COLLECTION={MOVIES_COL}")
print(f"[INFO] SERIES_COLLECTION={SERIES_COL}")

# === Connect ===
client = MongoClient(MONGO_URL)
db = client[DB_NAME]
cols = set(db.list_collection_names())
print(f"[INFO] Collections found: {sorted(cols)}")

def oid2str(x):
    if isinstance(x, ObjectId): return str(x)
    if isinstance(x, dict) and "$oid" in x: return str(x["$oid"])
    return str(x) if x else None

def to_float(val):
    try:
        if isinstance(val, (int, float)): return float(val)
        if isinstance(val, dict):
            return float(val.get("$numberDouble") or val.get("$numberInt") or 0)
        return float(val)
    except:
        return 0.0

# === Active items ===
active_movies = {str(d["_id"]) for d in db[MOVIES_COL].find({}, {"_id":1})} if MOVIES_COL in cols else set()
active_series = {str(d["_id"]) for d in db[SERIES_COL].find({}, {"_id":1})} if SERIES_COL in cols else set()

def prefix_key(mid: str, is_series: bool) -> str:
    return ("series:" if is_series else "movie:") + mid

if not active_movies and not active_series:
    print("[ERROR] No active movies/series found in DB.")
    sys.exit(1)

# === Accumulators ===
scores = defaultdict(float)
user_seen = set()

# === Weights ===
WATCH_FINISHED      = 3.0
WATCH_HALF_OR_MORE  = 2.0
WATCH_MIN_SIGNAL    = 1.0
LIKE_WEIGHT         = 2.5
RATING_WEIGHT_MULT  = 1.0

# === 1) playback_state ===
if WATCH_COL in cols:
    cnt = 0
    cur = db[WATCH_COL].find(
        {},
        {"userId":1, "movieId":1, "progressPct":1, "finished":1, "seasonNumber":1, "episodeNumber":1}
    )
    for w in cur:
        u = oid2str(w.get("userId"))
        m = oid2str(w.get("movieId"))
        if not u or not m:
            continue

        is_series = (w.get("seasonNumber") is not None) or (w.get("episodeNumber") is not None)
        if is_series:
            if m not in active_series: continue
        else:
            if m not in active_movies: continue

        key = prefix_key(m, is_series)
        p = float(w.get("progressPct", 0) or 0) / 100.0
        s = WATCH_FINISHED if w.get("finished") else (WATCH_HALF_OR_MORE if p >= 0.5 else WATCH_MIN_SIGNAL)
        scores[(u, key)] += s
        user_seen.add(u)
        cnt += 1
    print(f"[INFO] playback_state interactions: {cnt}")
else:
    print(f"[WARN] Missing collection '{WATCH_COL}'")

# === 2) users.likedItems ===
if USERS_COL in cols:
    cnt = 0
    for udoc in db[USERS_COL].find({}, {"_id":1, "likedItems":1}):
        u = str(udoc["_id"])
        arr = udoc.get("likedItems") or []
        for it in arr:
            if not isinstance(it, dict):
                continue
            ref = oid2str(it.get("refId"))
            kind = (it.get("kind") or "").strip()
            if not ref or kind not in ("Movie", "Series"):
                continue
            if kind == "Series":
                if ref not in active_series: continue
                key = prefix_key(ref, True)
            else:
                if ref not in active_movies: continue
                key = prefix_key(ref, False)
            scores[(u, key)] += LIKE_WEIGHT
            user_seen.add(u)
            cnt += 1
    print(f"[INFO] users.likedItems interactions: {cnt}")
else:
    print(f"[WARN] Missing collection '{USERS_COL}'")

# === 3) movies.reviews[].rating ===
if MOVIES_COL in cols:
    rcnt = 0
    for mdoc in db[MOVIES_COL].find({}, {"_id":1, "reviews":1}):
        mid = str(mdoc["_id"])
        if mid not in active_movies:
            continue
        for rv in (mdoc.get("reviews") or []):
            u = oid2str(rv.get("userId"))
            if not u:
                continue
            rating = to_float(rv.get("rating"))
            if rating <= 0:
                continue
            key = prefix_key(mid, False)
            scores[(u, key)] += rating * RATING_WEIGHT_MULT
            user_seen.add(u)
            rcnt += 1
    print(f"[INFO] movies.reviews interactions: {rcnt}")
else:
    print(f"[WARN] Missing collection '{MOVIES_COL}'")

# === Write artifacts ===
if not scores:
    print("[ERROR] No interactions found!")
    sys.exit(1)

users = sorted(user_seen)
items = sorted({k for (_, k) in scores.keys()})

u2i = {u: i for i, u in enumerate(users)}
m2i = {k: i for i, k in enumerate(items)}

os.makedirs("artifacts", exist_ok=True)
with open("artifacts/user_id_map.json", "w", encoding="utf-8") as f:
    json.dump({"users": users}, f, ensure_ascii=False)
with open("artifacts/item_id_map.json", "w", encoding="utf-8") as f:
    json.dump({"items": items}, f, ensure_ascii=False)
with open("artifacts/interactions.csv", "w", encoding="utf-8") as f:
    f.write("user_idx,item_idx,score\n")
    for (u, k), s in scores.items():
        f.write(f"{u2i[u]},{m2i[k]},{s}\n")

print(f"[DONE] Exported users={len(users)} items={len(items)} interactions={len(scores)}")
print("[NEXT] Run: python train_als.py")
