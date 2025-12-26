# mongo_check.py
import os
from dotenv import load_dotenv
from pymongo import MongoClient
from bson import ObjectId

load_dotenv()
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME   = os.getenv("DB_NAME", "Movie-web")
WATCH_COL = os.getenv("WATCH_COLLECTION", "playback_state")
USER_ID   = os.getenv("TEST_USER_ID", "68fa6149d1ca6f56541a4074") 

def as_oid(x):
    if isinstance(x, ObjectId):
        return x
    try:
        return ObjectId(str(x))
    except Exception:
        return None

client = MongoClient(MONGO_URL)
db = client[DB_NAME]

print(f"============================================================")
print(f"KIỂM TRA USER: {USER_ID}")
print(f"============================================================\n")

# A. Lịch sử xem
print(f"A. Lịch sử xem gần đây (collection: {WATCH_COL})")
print("-" * 80)
watch = list(
    db[WATCH_COL].find(
        {"userId": as_oid(USER_ID)},
        {"movieId": 1, "seasonNumber": 1, "episodeNumber": 1, "lastActionAt": 1}
    ).sort("lastActionAt", -1).limit(10)
)
if not watch:
    print("(Không có dữ liệu)")
else:
    for w in watch:
        mid = w.get("movieId")
        kind = "series" if (w.get("seasonNumber") is not None or w.get("episodeNumber") is not None) else "movie"
        print(f"{kind.upper():7} | {mid}")
        doc = None
        if mid:
            doc = db.movies.find_one({"_id": as_oid(mid)}, {"title": 1, "category": 1}) \
               or db.series.find_one({"_id": as_oid(mid)}, {"title": 1, "category": 1})
        if doc:
            print(f"   └→ {doc.get('title')}")
            print(f"      ⏱ {w.get('lastActionAt')} | Thể loại: {doc.get('category') or '(không có)'}")
        else:
            print("   └→ ❌ Không tìm thấy phim/series này trong DB")

# B. likedItems
print("\nB. Danh sách yêu thích (users.likedItems)")
print("-" * 80)
u = db.users.find_one({"_id": as_oid(USER_ID)}, {"likedItems": 1})
items = u.get("likedItems") if u else []
if not items:
    print("(Không có mục)")
else:
    for it in items:
        rid = it.get("refId")
        kind = (it.get("kind") or "").strip()
        oid = as_oid(rid)
        if not oid or kind not in ("Movie", "Series"):
            print("→ [INVALID] Bản ghi:", it)
            continue
        col = db.movies if kind == "Movie" else db.series
        doc = col.find_one({"_id": oid}, {"title": 1, "category": 1})
        if doc:
            print(f"✓ {kind:6} | {doc.get('title')} | category: {doc.get('category') or '(không có)'}")
        else:
            print(f"→ [STALE] {kind} refId={rid} không còn tồn tại trong DB")
