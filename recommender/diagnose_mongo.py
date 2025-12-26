import os
from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError, ConfigurationError

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME   = os.getenv("DB_NAME", "movieapp")

print(f"[INFO] MONGO_URL={MONGO_URL}")
print(f"[INFO] DB_NAME={DB_NAME}")

try:
    client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000)
    print("[INFO] server_info:", client.server_info())  # force connection
    db = client[DB_NAME]
    cols = db.list_collection_names()
    print("[INFO] Collections:", cols)
    if "watch_history" not in cols:
        print("[WARN] Collection 'watch_history' không tồn tại trong DB này.")
    else:
        cnt = db.watch_history.estimated_document_count()
        print(f"[INFO] watch_history documents ≈ {cnt}")
except (ServerSelectionTimeoutError, ConfigurationError) as e:
    print("[ERROR] Không kết nối được MongoDB.")
    print(e)
