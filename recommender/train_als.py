# train_als.py
import os
import numpy as np
import pandas as pd
from scipy.sparse import coo_matrix
from implicit.als import AlternatingLeastSquares

path = "artifacts/interactions.csv"
if not os.path.exists(path):
    raise FileNotFoundError(f"Missing {path}. Run export_interactions.py first.")

df = pd.read_csv(path)
print(f"[INFO] Loaded {len(df)} interactions")
num_users = df["user_idx"].nunique()
num_items = df["item_idx"].nunique()
print(f"[INFO] Users={num_users} Items={num_items}")

user_ids = df["user_idx"].astype(int).values
item_ids = df["item_idx"].astype(int).values
scores   = df["score"].astype(float).values

X = coo_matrix((scores, (user_ids, item_ids)))  # (items, users)

factors = min(32, max(8, min(num_users, num_items) - 1))
model = AlternatingLeastSquares(
    factors=factors,
    regularization=0.02,
    iterations=15,
    random_state=42
)

confidence = (X * 15.0).astype("double")
model.fit(confidence)
print("[SUCCESS] ALS trained")

os.makedirs("artifacts", exist_ok=True)
np.savez(
    "artifacts/als_model.npz",
    user_factors=model.user_factors,
    item_factors=model.item_factors
)
print("[INFO] Saved artifacts/als_model.npz")
