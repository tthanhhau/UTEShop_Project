#!/usr/bin/env python3
"""
extract_data.py — Trích xuất dữ liệu sản phẩm từ MongoDB cho UTEShop AI Chatbot.
"""
import json, os, sys, re
from datetime import datetime

try:
    from pymongo import MongoClient
except ImportError:
    print("❌ pip install pymongo"); sys.exit(1)

MONGODB_URI = os.getenv("MONGODB_URI",
    "mongodb+srv://holam24062003_db_user:quangho123@cluster0.bpw0vps.mongodb.net/test")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "dataset")

def clean_html(t): return re.sub(r'<[^>]+>', '', t).strip() if t else ""
def norm(t): return re.sub(r'\s+', ' ', t).strip() if t else ""
def fmt_price(p): return f"{int(p):,}đ".replace(",", ".") if p else "0đ"

def extract_data():
    print("🔗 Kết nối MongoDB...")
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=10000)
    client.admin.command('ping')
    db = client.get_default_database()
    if db is None:
        db = client["test"]
    print(f"✅ DB: {db.name}")

    cats = {str(c["_id"]): {"name": c.get("name",""), "description": c.get("description","")}
            for c in db.categories.find({})}
    brands = {str(b["_id"]): {"name": b.get("name",""), "description": b.get("description",""),
              "country": b.get("country",""), "website": b.get("website","")}
              for b in db.brands.find({})}
    
    print(f"📂 {len(cats)} categories, 🏷️ {len(brands)} brands")

    products = []
    for p in db.products.find({"isActive": True}):
        cat = cats.get(str(p.get("category","")), {"name":"Khác","description":""})
        brand = brands.get(str(p.get("brand","")), {"name":"N/A","description":"","country":""})
        sizes = [{"size": s.get("size",""), "stock": s.get("stock",0)} for s in p.get("sizes",[])]
        total_stock = sum(s["stock"] for s in sizes) if sizes else p.get("stock", 0)
        price = p.get("price", 0)
        disc = p.get("discountPercentage", 0)
        dp = round(price * (1 - disc/100)) if disc > 0 else price

        name = clean_html(norm(p.get("name","")))
        if not name: continue
        products.append({
            "id": str(p["_id"]), "name": name,
            "description": clean_html(norm(p.get("description",""))),
            "price": price, "price_formatted": fmt_price(price),
            "discount_percentage": disc,
            "discounted_price": dp, "discounted_price_formatted": fmt_price(dp),
            "category": cat["name"], "brand": brand["name"], "brand_country": brand["country"],
            "sizes": sizes, "available_sizes": [s["size"] for s in sizes if s["stock"]>0],
            "total_stock": total_stock, "in_stock": total_stock > 0,
            "sold_count": p.get("soldCount",0), "view_count": p.get("viewCount",0),
            "images": p.get("images",[])
        })

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    out = {"metadata": {"extracted_at": datetime.now().isoformat(),
           "total_products": len(products), "categories": len(cats), "brands": len(brands)},
           "categories": list(cats.values()), "brands": list(brands.values()), "products": products}
    
    outfile = os.path.join(OUTPUT_DIR, "extracted_products.json")
    with open(outfile, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    
    print(f"✅ {len(products)} sản phẩm → {outfile} ({os.path.getsize(outfile)/1024:.1f}KB)")
    client.close()
    return out

if __name__ == "__main__":
    extract_data()
