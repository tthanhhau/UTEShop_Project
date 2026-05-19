from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer, util
from PIL import Image
import io
import base64
import numpy as np
import os
from pymongo import MongoClient
from bson import ObjectId

app = Flask(__name__)
CORS(app, origins=["*"])

# Initialize CLIP model
print("🚀 Loading CLIP model...")
CLIP_MODEL_NAME = os.getenv('CLIP_MODEL_NAME', 'uteshop-clip')
#img_model = SentenceTransformer('clip-ViT-B-32')
img_model = None

def get_model():
    global img_model
    if img_model is None:
        print("🚀 Loading CLIP model...")
        img_model = SentenceTransformer(CLIP_MODEL_NAME)
        print("✅ Model loaded successfully")
    return img_model
print("✅ Model loaded successfully")

# MongoDB connection
MONGO_URI = os.getenv('MONGODB_URI') or os.getenv('MONGODBURI')
if not MONGO_URI:
    print("⚠️ MONGODB_URI not set!")
else:
    print("🔗 MongoDB URI configured")

# Initialize MongoDB
client = None
db = None
products_collection = None
embeddings_collection = None

def init_mongodb():
    global client, db, products_collection, embeddings_collection
    if not MONGO_URI:
        return False
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        db = client['test']
        products_collection = db.products
        embeddings_collection = db.product_embeddings
        print("✅ MongoDB connected successfully")
        return True
    except Exception as e:
        print(f"❌ MongoDB connection error: {e}")
        return False

init_mongodb()

def get_product_embeddings():
    """Load cached embeddings from MongoDB"""
    if embeddings_collection is None:
        return None, None, {}
    
    cached = embeddings_collection.find_one({"_id": "all_embeddings_multi"})
    if not cached:
        cached = embeddings_collection.find_one({"_id": "all_embeddings_single"})
    
    if cached and cached.get("embeddings"):
        embeddings = np.array(cached["embeddings"], dtype=np.float32)
        print(f"📦 Loaded {len(embeddings)} cached embeddings")
        return embeddings, cached["product_ids"], cached.get("product_info", {})
    
    return None, None, {}


def fetch_image_from_url(url, timeout=10):
    try:
        import requests

        response = requests.get(url, timeout=timeout)
        response.raise_for_status()
        return Image.open(io.BytesIO(response.content)).convert("RGB")
    except Exception as exc:
        print(f"⚠️  Failed to load image: {url} ({exc})")
        return None


@app.route('/update-embeddings', methods=['POST'])
def update_embeddings():
    if embeddings_collection is None or products_collection is None:
        return jsonify({
            "success": False,
            "error": "Database not connected"
        }), 500

    try:
        products = list(
            products_collection.find(
                {
                    "isActive": True,
                    "images": {"$exists": True, "$ne": []}
                }
            )
        )

        if not products:
            return jsonify({
                "success": False,
                "error": "No products with images found"
            }), 404

        model = get_model()

        embeddings = []
        product_ids = []
        product_info = {}
        skipped = 0

        for product in products:
            product_id = str(product.get("_id"))
            images = product.get("images", [])
            if not images:
                continue

            product_info[product_id] = {
                "name": product.get("name", ""),
                "images": images
            }

            for image_url in images:
                if not image_url:
                    skipped += 1
                    continue

                image = fetch_image_from_url(image_url)
                if image is None:
                    skipped += 1
                    continue

                embedding = model.encode([image], convert_to_numpy=True)[0].astype(np.float32)
                embeddings.append(embedding.tolist())
                product_ids.append(product_id)

        if not embeddings:
            return jsonify({
                "success": False,
                "error": "No valid images to embed"
            }), 500

        payload = {
            "_id": "all_embeddings_multi",
            "embeddings": embeddings,
            "product_ids": product_ids,
            "product_info": product_info,
            "model_name": CLIP_MODEL_NAME,
            "updated_at": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        }

        embeddings_collection.replace_one({"_id": "all_embeddings_multi"}, payload, upsert=True)

        return jsonify({
            "success": True,
            "message": "Embeddings updated",
            "count": len(embeddings),
            "skipped": skipped
        })
    except Exception as exc:
        print(f"❌ Update embeddings error: {exc}")
        import traceback

        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(exc)
        }), 500

@app.route('/', methods=['GET'])
def index():
    return jsonify({
        "service": "UTEShop Image Search",
        "status": "running",
        "version": "1.0.0"
    })

@app.route('/health', methods=['GET'])
def health():
    mongo_ok = False
    try:
        if client is not None:
            client.admin.command('ping')
            mongo_ok = True
    except:
        pass
    
    return jsonify({
        "status": "ok" if mongo_ok else "degraded",
        "mongodb": "connected" if mongo_ok else "disconnected",
        "model": "loaded"
    })

@app.route('/search', methods=['POST'])
def search():
    try:
        import time
        start_time = time.time()
        
        query_image = None
        query_text = None
        
        # Check for file upload
        if 'image' in request.files:
            file = request.files['image']
            if file.filename != '':
                print(f"📸 Received file: {file.filename}")
                query_image = Image.open(file.stream)
                if query_image.mode != 'RGB':
                    query_image = query_image.convert('RGB')
        
        # Check for base64
        if query_image is None:
            json_data = request.get_json(silent=True)
            if json_data and 'image_base64' in json_data:
                print("📸 Received base64 image")
                image_data = json_data['image_base64']
                if ',' in image_data:
                    image_data = image_data.split(',')[1]
                img_bytes = base64.b64decode(image_data)
                query_image = Image.open(io.BytesIO(img_bytes))
                if query_image.mode != 'RGB':
                    query_image = query_image.convert('RGB')
            if json_data and json_data.get('text'):
                query_text = str(json_data.get('text')).strip()

        # Check for text in form data or query args
        if query_text is None:
            query_text = request.form.get('text') or request.args.get('text')
            if query_text:
                query_text = str(query_text).strip()
        
        if query_image is None:
            return jsonify({
                "success": False,
                "error": "No image provided"
            }), 400
        
        print("🔍 Encoding query image...")
        model = get_model()
        query_embedding = model.encode([query_image], convert_to_numpy=True)[0]
        query_embedding = query_embedding.astype(np.float32)
        
        # Get cached embeddings
        img_embeddings, product_ids, product_info = get_product_embeddings()
        
        if img_embeddings is None or len(img_embeddings) == 0:
            return jsonify({
                "success": False,
                "error": "No embeddings available"
            }), 500
        
        print(f"🔍 Comparing with {len(img_embeddings)} products...")
        image_similarities = util.cos_sim(query_embedding, img_embeddings)[0]

        text_similarities = None
        if query_text:
            print("📝 Encoding query text...")
            text_embedding = model.encode([query_text], convert_to_numpy=True)[0]
            text_embedding = text_embedding.astype(np.float32)
            text_similarities = util.cos_sim(text_embedding, img_embeddings)[0]

        # Combine image and text similarities when text is provided
        if text_similarities is not None:
            try:
                image_weight = float(request.args.get('image_weight', 0.7))
            except Exception:
                image_weight = 0.7
            try:
                text_weight = float(request.args.get('text_weight', 0.3))
            except Exception:
                text_weight = 0.3

            total_weight = image_weight + text_weight
            if total_weight <= 0:
                total_weight = 1.0

            similarities = (image_similarities * image_weight + text_similarities * text_weight) / total_weight
        else:
            similarities = image_similarities

        top_k = int(request.args.get('top_k', 10))
        top_indices = similarities.argsort(descending=True)[:min(50, len(similarities))].cpu().numpy()

        # Log top candidates for debugging
        debug_top = min(5, len(top_indices))
        print(f"🔎 Top {debug_top} similarity candidates:")
        for rank, idx in enumerate(top_indices[:debug_top], start=1):
            product_id = product_ids[int(idx)]
            similarity_score = float(similarities[int(idx)])
            name = None
            if product_info and product_info.get(product_id):
                name = product_info[product_id].get("name")
            print(f"  #{rank}: {product_id} | {name or 'unknown'} | {similarity_score:.4f}")
        
        if products_collection is None:
            return jsonify({
                "success": False,
                "error": "Database not connected"
            }), 500
        
        results = []
        seen_products = {}
        for idx in top_indices:
            product_id = product_ids[int(idx)]
            similarity_score = float(similarities[int(idx)])
            
            if similarity_score < 0.3:
                continue
            
            # Deduplicate by product id, keep highest similarity
            if product_id in seen_products:
                if similarity_score <= seen_products[product_id]:
                    continue
            product = products_collection.find_one({"_id": ObjectId(product_id)})
            if product:
                category_info = None
                if product.get("category"):
                    if isinstance(product["category"], ObjectId):
                        cat = db.categories.find_one({"_id": product["category"]})
                        if cat:
                            category_info = {"_id": str(cat["_id"]), "name": cat.get("name", "")}
                    else:
                        category_info = product["category"]
                
                brand_info = None
                if product.get("brand"):
                    if isinstance(product["brand"], ObjectId):
                        brand = db.brands.find_one({"_id": product["brand"]})
                        if brand:
                            brand_info = {
                                "_id": str(brand["_id"]),
                                "name": brand.get("name", ""),
                                "logo": brand.get("logo", "")
                            }
                    else:
                        brand_info = product["brand"]
                
                stock = product.get("stock", 0)
                
                # Process sizes - convert ObjectId to string
                raw_sizes = product.get("sizes", [])
                processed_sizes = []
                for s in raw_sizes:
                    if isinstance(s, dict):
                        processed_sizes.append({
                            "size": s.get("size", ""),
                            "stock": s.get("stock", 0),
                            "_id": str(s.get("_id", "")) if s.get("_id") else ""
                        })
                    else:
                        processed_sizes.append(s)
                
                results.append({
                    "_id": product_id,
                    "productId": product_id,
                    "similarity": similarity_score,
                    "name": product.get("name", ""),
                    "description": product.get("description", ""),
                    "price": product.get("price", 0),
                    "stock": stock,
                    "images": product.get("images", []),
                    "sizes": processed_sizes,
                    "category": category_info or str(product.get("category", "")),
                    "brand": brand_info or str(product.get("brand", "")),
                    "discountPercentage": product.get("discountPercentage", 0),
                    "soldCount": product.get("soldCount", 0),
                    "isActive": product.get("isActive", True),
                    "isInStock": stock > 0
                })
                
                seen_products[product_id] = similarity_score
                if len(results) >= top_k:
                    break
        
        results.sort(key=lambda x: -x["similarity"])
        
        search_time = time.time() - start_time
        print(f"✅ Found {len(results)} results in {search_time:.2f}s")
        
        return jsonify({
            "success": True,
            "results": results,
            "count": len(results),
            "search_time": round(search_time, 2)
        })
    
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 7860))
    print(f"🚀 Starting server on port {port}...")
    app.run(host='0.0.0.0', port=port)
