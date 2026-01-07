"""
Image Search Service using CLIP Model
This service handles image embeddings and similarity search for product images
"""
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
import json
from datetime import datetime
import cv2
import colorsys
from sklearn.cluster import KMeans
import requests

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
    print("✅ Loaded .env file")
except ImportError:
    print("⚠️  python-dotenv not installed, using system environment variables only")

app = Flask(__name__)
CORS(app)

# Initialize CLIP model for images
print("Loading CLIP model for images...")
img_model = SentenceTransformer('clip-ViT-B-32')
print("✅ Image model loaded successfully")

# MongoDB connection - MongoDB Atlas
MONGO_URI = os.getenv('MONGODB_URI', 'mongodb+srv://holam24062003_db_user:quangho123@cluster0.bpw0vps.mongodb.net/uteshop?retryWrites=true&w=majority')
print(f"🔗 MongoDB URI: {MONGO_URI[:50]}...")  # Print first 50 chars for security

# Extract database name from URI
db_name = 'uteshop'  # Default
if '/uteshop' in MONGO_URI:
    db_name = 'uteshop'
elif '/' in MONGO_URI.split('?')[0]:
    db_name = MONGO_URI.split('/')[-1].split('?')[0]

print(f"📦 Using database: {db_name}")

# Connection options for MongoDB Atlas
client = MongoClient(
    MONGO_URI,
    serverSelectionTimeoutMS=5000,  # 5 seconds timeout
    connectTimeoutMS=10000,  # 10 seconds connection timeout
    socketTimeoutMS=45000,  # 45 seconds socket timeout
    retryWrites=True
)
db = client[db_name]
products_collection = db.products
embeddings_collection = db.product_embeddings

# Test connection on startup
try:
    client.admin.command('ping')
    print("✅ MongoDB Atlas connected successfully")
    
    # Test query to check products
    product_count = products_collection.count_documents({})
    print(f"📦 Total products in database: {product_count}")
    
    active_with_images = products_collection.count_documents({
        "isActive": True,
        "images": {"$exists": True, "$ne": []}
    })
    print(f"🎯 Products ready for image search: {active_with_images}")
except Exception as e:
    print(f"⚠️  MongoDB Atlas connection warning: {e}")
    print("   Service will continue, but may fail when accessing database")

# Configuration
ENABLE_COLOR_DETECTION = os.getenv('ENABLE_COLOR_DETECTION', 'false').lower() == 'true'
MIN_SIMILARITY_THRESHOLD = float(os.getenv('MIN_SIMILARITY_THRESHOLD', '0.3'))
ENABLE_MULTI_IMAGE_ENCODING = os.getenv('ENABLE_MULTI_IMAGE_ENCODING', 'true').lower() == 'true'

def extract_dominant_colors_fast(image, k=2):
    """Fast color extraction using reduced sampling"""
    try:
        # Resize image for faster processing
        img_small = image.resize((50, 50))
        img_array = np.array(img_small)
        
        # Sample pixels (every 5th pixel for speed)
        pixels = img_array.reshape(-1, 3)[::5]
        
        # Apply K-means with fewer iterations
        kmeans = KMeans(n_clusters=k, random_state=42, n_init=3, max_iter=10)
        kmeans.fit(pixels)
        
        # Get the dominant colors
        colors = kmeans.cluster_centers_
        
        # Convert to RGB and normalize
        dominant_colors = []
        for color in colors:
            rgb = color.astype(int)
            # Convert to HSV for better color analysis
            hsv = colorsys.rgb_to_hsv(rgb[0]/255, rgb[1]/255, rgb[2]/255)
            dominant_colors.append({
                'rgb': rgb.tolist(),
                'hsv': hsv,
                'hex': '#{:02x}{:02x}{:02x}'.format(rgb[0], rgb[1], rgb[2])
            })
        
        return dominant_colors
    except Exception as e:
        print(f"Error extracting colors: {e}")
        return []

def detect_color_category(colors):
    """Categorize dominant colors into basic color names"""
    if not colors:
        return "unknown"
    
    # Use the most dominant color (first one)
    main_color = colors[0]['hsv']
    h, s, v = main_color
    
    # Define color ranges in HSV
    if s < 0.1:  # Low saturation = grayscale
        if v < 0.3:
            return "black"
        elif v > 0.7:
            return "white"
        else:
            return "gray"
    else:
        # Colored pixels
        if h < 0.05 or h >= 0.95:
            return "red"
        elif h < 0.15:
            return "orange"
        elif h < 0.25:
            return "yellow"
        elif h < 0.35:
            return "green"
        elif h < 0.55:
            return "cyan"
        elif h < 0.75:
            return "blue"
        elif h < 0.85:
            return "purple"
        else:
            return "pink"

def calculate_color_similarity(colors1, colors2):
    """Calculate color similarity between two sets of colors"""
    if not colors1 or not colors2:
        return 0.0
    
    # Compare main colors
    main1 = colors1[0]['hsv']
    main2 = colors2[0]['hsv']
    
    # Calculate HSV distance
    h_diff = abs(main1[0] - main2[0])
    s_diff = abs(main1[1] - main2[1])
    v_diff = abs(main1[2] - main2[2])
    
    # Normalize hue difference (circular)
    if h_diff > 0.5:
        h_diff = 1 - h_diff
    
    # Weighted distance (hue is most important)
    distance = (h_diff * 0.5 + s_diff * 0.3 + v_diff * 0.2)
    similarity = 1 - distance
    
    return max(0, similarity)

def get_product_embeddings():
    """Load or generate embeddings for all product images with multi-image support"""
    # Check if embeddings exist in cache
    cache_key = "all_embeddings_multi" if ENABLE_MULTI_IMAGE_ENCODING else "all_embeddings_single"
    cached_embeddings = embeddings_collection.find_one({"_id": cache_key})
    
    if cached_embeddings and cached_embeddings.get("embeddings"):
        print(f"Loading cached embeddings ({cache_key})...")
        # Convert to numpy array and ensure float32 dtype for consistency
        embeddings_array = np.array(cached_embeddings["embeddings"], dtype=np.float32)
        print(f"✅ Loaded {len(embeddings_array)} cached embeddings (dtype: {embeddings_array.dtype})")
        product_info = cached_embeddings.get("product_info", {})
        return embeddings_array, cached_embeddings["product_ids"], product_info
    
    # Generate embeddings for all products
    print("Generating embeddings for all products...")
    products = list(products_collection.find({"isActive": True, "images": {"$exists": True, "$ne": []}}))
    
    if not products:
        return None, None, {}
    
    embeddings = []
    product_ids = []
    image_urls = []
    product_info = {}
    
    for product in products:
        if product.get("images") and len(product["images"]) > 0:
            product_id = str(product["_id"])
            product_images = product["images"]
            
            if ENABLE_MULTI_IMAGE_ENCODING and len(product_images) > 1:
                # Multi-image encoding: encode all images and average
                print(f"  📸 Multi-image encoding for product {product_id} ({len(product_images)} images)")
                product_embeddings = []
                
                for img_url in product_images[:3]:  # Limit to first 3 images for performance
                    try:
                        response = requests.get(img_url, timeout=10, headers={
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        })
                        response.raise_for_status()
                        
                        img = Image.open(io.BytesIO(response.content))
                        if img.mode != 'RGB':
                            img = img.convert('RGB')
                        
                        # Resize for faster processing
                        img = img.resize((224, 224))
                        product_embeddings.append(img)
                        
                    except Exception as e:
                        print(f"    ⚠️  Failed to load image {img_url}: {e}")
                        continue
                
                if product_embeddings:
                    # Encode all images for this product
                    try:
                        product_emb_array = img_model.encode(product_embeddings, convert_to_numpy=True)
                        # Average embeddings to create a single representation
                        avg_embedding = np.mean(product_emb_array, axis=0)
                        embeddings.append(avg_embedding.astype(np.float32))
                        product_ids.append(product_id)
                        image_urls.append(product_images[0])  # Store first image URL
                        
                        product_info[product_id] = {
                            "image_count": len(product_embeddings),
                            "all_image_urls": product_images[:3],
                            "encoding_method": "multi_image_average"
                        }
                        
                        print(f"    ✅ Multi-image encoded {len(product_embeddings)} images for product {product_id}")
                        
                    except Exception as e:
                        print(f"    ❌ Failed to encode product {product_id}: {e}")
                        continue
            else:
                # Single image encoding (fallback or if multi-image disabled)
                image_url = product_images[0]
                product_ids.append(product_id)
                image_urls.append(image_url)
                
                product_info[product_id] = {
                    "image_count": 1,
                    "all_image_urls": [image_url],
                    "encoding_method": "single_image"
                }
    
    if not embeddings:
        return None, None, {}
    
    # Encode all images in batch for single-image mode
    if not ENABLE_MULTI_IMAGE_ENCODING:
        print(f"Encoding {len(image_urls)} images in batch...")
        try:
            images = []
            valid_product_ids = []
            valid_urls = []
            failed_count = 0
            
            for idx, url in enumerate(image_urls):
                try:
                    print(f"  Downloading image {idx + 1}/{len(image_urls)}: {url[:80]}...")
                    response = requests.get(url, timeout=15, stream=True, headers={
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    })
                    response.raise_for_status()
                    
                    content_type = response.headers.get('content-type', '')
                    if not content_type.startswith('image/'):
                        print(f"  ⚠️  Warning: {url} is not an image (content-type: {content-type})")
                    
                    img = Image.open(io.BytesIO(response.content))
                    if img.mode != 'RGB':
                        img = img.convert('RGB')
                    images.append(img)
                    valid_product_ids.append(product_ids[idx])
                    valid_urls.append(url)
                    print(f"  ✅ Successfully loaded image {idx + 1}")
                except Exception as e:
                    failed_count += 1
                    print(f"  ❌ Error processing image {idx + 1}: {e}")
                    continue
            
            if images:
                img_embeddings = img_model.encode(images, batch_size=32, convert_to_numpy=True, show_progress_bar=True)
                img_embeddings = img_embeddings.astype(np.float32)
                embeddings = img_embeddings
                product_ids = valid_product_ids
                image_urls = valid_urls
                
        except Exception as e:
            print(f"❌ Error encoding images: {e}")
            return None, None, {}
    
    # Convert to numpy array
    embeddings_array = np.array(embeddings, dtype=np.float32)
    print(f"✅ Successfully encoded {len(embeddings_array)} embeddings (dtype: {embeddings_array.dtype})")
    
    # Cache embeddings
    print("💾 Saving embeddings to MongoDB...")
    embeddings_collection.update_one(
        {"_id": cache_key},
        {
            "$set": {
                "embeddings": embeddings_array.tolist(),
                "product_ids": product_ids,
                "image_urls": image_urls,
                "product_info": product_info,
                "updated_at": datetime.now(),
                "encoding_method": "multi_image" if ENABLE_MULTI_IMAGE_ENCODING else "single_image"
            }
        },
        upsert=True
    )
    print("✅ Embeddings saved successfully")
    
    return embeddings_array, product_ids, product_info

@app.route('/', methods=['GET'])
def index():
    return jsonify({
        "service": "Image Search Service",
        "status": "running",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "search": "/search (POST)",
            "update_embeddings": "/update-embeddings (POST)"
        }
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})

@app.route('/search', methods=['POST'])
def search():
    try:
        import time
        start_time = time.time()
        
        query_image = None
        
        # Check for file upload first (multipart/form-data)
        if 'image' in request.files:
            file = request.files['image']
            if file.filename != '':
                query_image = Image.open(file.stream)
                # Convert to RGB if necessary
                if query_image.mode != 'RGB':
                    query_image = query_image.convert('RGB')
        
        # If no file, check for base64 JSON (application/json)
        if query_image is None:
            # Use get_json with silent=True to avoid 415 error if Content-Type is not JSON
            json_data = request.get_json(silent=True)
            if json_data and 'image_base64' in json_data:
                image_data = json_data['image_base64']
                # Remove data URL prefix if present
                if ',' in image_data:
                    image_data = image_data.split(',')[1]
                
                img_bytes = base64.b64decode(image_data)
                query_image = Image.open(io.BytesIO(img_bytes))
                # Convert to RGB if necessary
                if query_image.mode != 'RGB':
                    query_image = query_image.convert('RGB')
        
        # If still no image, return error
        if query_image is None:
            return jsonify({"error": "No image provided. Please send either a file 'image' or JSON with 'image_base64'"}), 400
        
        print(f"🚀 Starting search with color detection: {ENABLE_COLOR_DETECTION}")
        
        # Extract colors from query image only if enabled
        query_colors = []
        query_color_category = "unknown"
        
        if ENABLE_COLOR_DETECTION:
            print("🎨 Extracting colors from query image...")
            query_colors = extract_dominant_colors_fast(query_image)
            query_color_category = detect_color_category(query_colors)
            print(f"🎨 Query image dominant color: {query_color_category}")
        
        # Encode query image
        query_embedding = img_model.encode([query_image], convert_to_numpy=True)[0]
        # Ensure float32 dtype for consistency
        query_embedding = query_embedding.astype(np.float32)
        print(f"🔍 Query embedding dtype: {query_embedding.dtype}, shape: {query_embedding.shape}")
        
        # Get product embeddings
        img_embeddings, product_ids, product_info = get_product_embeddings()
        
        if img_embeddings is None or len(img_embeddings) == 0:
            # Try to generate embeddings automatically
            print("⚠️  No embeddings found, attempting to generate...")
            img_embeddings, product_ids, product_info = get_product_embeddings()
            
            if img_embeddings is None or len(img_embeddings) == 0:
                return jsonify({
                    "error": "No product embeddings available. Please call /update-embeddings endpoint first to generate embeddings for products.",
                    "hint": "POST /update-embeddings to generate embeddings"
                }), 500
        
        # Ensure embeddings have same dtype
        if img_embeddings.dtype != query_embedding.dtype:
            print(f"⚠️  Dtype mismatch: query={query_embedding.dtype}, products={img_embeddings.dtype}, converting...")
            img_embeddings = img_embeddings.astype(query_embedding.dtype)
        
        print(f"🔍 Product embeddings dtype: {img_embeddings.dtype}, shape: {img_embeddings.shape}")
        
        # Calculate similarity
        similarities = util.cos_sim(query_embedding, img_embeddings)[0]
        
        # Get top K results
        top_k = int(request.args.get('top_k', 10))
        # Lấy top 50 để có thể filter tốt hơn (giảm từ 100)
        top_indices = similarities.argsort(descending=True)[:min(50, len(similarities))].cpu().numpy()
        
        # Get product details with full information
        results = []
        in_stock_count = 0
        
        for idx in top_indices:
            product_id = product_ids[int(idx)]
            similarity_score = float(similarities[int(idx)])
            
            # Apply similarity threshold
            if similarity_score < MIN_SIMILARITY_THRESHOLD:
                print(f"🚫 Skipping product {product_id} - similarity too low: {similarity_score:.3f}")
                continue
            
            product = products_collection.find_one({"_id": ObjectId(product_id)})
            if product:
                # Get category and brand details if they are ObjectIds
                category_info = None
                brand_info = None
                
                if product.get("category"):
                    if isinstance(product["category"], ObjectId):
                        category = db.categories.find_one({"_id": product["category"]})
                        if category:
                            category_info = {
                                "_id": str(category["_id"]),
                                "name": category.get("name", "")
                            }
                    else:
                        category_info = product["category"]
                
                if product.get("brand"):
                    if isinstance(product["brand"], ObjectId):
                        brand = db.brands.find_one({"_id": product["brand"]})
                        if brand:
                            brand_info = {
                                "_id": str(brand["_id"]),
                                "name": brand.get("name", ""),
                                "logo": brand.get("logo", ""),
                                "country": brand.get("country", "")
                            }
                    else:
                        brand_info = product["brand"]
                
                stock = product.get("stock", 0)
                is_in_stock = stock > 0
                
                # Extract colors from product image only if color detection is enabled
                product_colors = []
                product_color_category = "unknown"
                color_similarity = 0.0
                
                if ENABLE_COLOR_DETECTION:
                    try:
                        # Use cached product info if available
                        if product_id in product_info and "all_image_urls" in product_info[product_id]:
                            # Use first cached image URL
                            product_image_url = product_info[product_id]["all_image_urls"][0]
                        else:
                            # Fallback to first image
                            product_image_url = product.get("images", [])[0]
                        
                        response = requests.get(product_image_url, timeout=5, headers={
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        })
                        response.raise_for_status()
                        
                        product_img = Image.open(io.BytesIO(response.content))
                        if product_img.mode != 'RGB':
                            product_img = product_img.convert('RGB')
                        
                        product_colors = extract_dominant_colors_fast(product_img)
                        product_color_category = detect_color_category(product_colors)
                        color_similarity = calculate_color_similarity(query_colors, product_colors)
                        
                        print(f"🎨 Product {product_id} color: {product_color_category}, color similarity: {color_similarity:.3f}")
                        
                    except Exception as e:
                        print(f"⚠️  Could not analyze product {product_id} colors: {e}")
                
                # Calculate final score with multi-factor weighting
                if ENABLE_COLOR_DETECTION:
                    # Shape similarity (CLIP): 60%
                    # Color similarity: 30%
                    # Stock availability bonus: 10%
                    shape_score = similarity_score
                    color_score = color_similarity
                    stock_bonus = 0.1 if is_in_stock else 0.0
                    
                    final_score = (shape_score * 0.6) + (color_score * 0.3) + stock_bonus
                    
                    # Apply color matching bonus for same color category
                    if query_color_category == product_color_category and query_color_category != "unknown":
                        final_score += 0.1  # Bonus for same color category
                        print(f"🎯 Color match bonus for product {product_id}: {query_color_category}")
                else:
                    # Simple scoring without color detection
                    final_score = similarity_score + (0.1 if is_in_stock else 0.0)
                
                # Process sizes to convert ObjectId to string
                raw_sizes = product.get("sizes", [])
                processed_sizes = []
                for size_item in raw_sizes:
                    if isinstance(size_item, dict):
                        processed_size = {
                            "size": size_item.get("size", ""),
                            "stock": size_item.get("stock", 0)
                        }
                        # Convert _id if exists
                        if "_id" in size_item:
                            processed_size["_id"] = str(size_item["_id"])
                        processed_sizes.append(processed_size)
                    else:
                        processed_sizes.append(size_item)

                product_data = {
                    "_id": product_id,
                    "productId": product_id,
                    "similarity": similarity_score,
                    "final_score": final_score,
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
                    "viewCount": product.get("viewCount", 0),
                    "isActive": product.get("isActive", True),
                    "isVisible": product.get("isVisible", True),
                    "isInStock": is_in_stock
                }
                
                # Add color info only if enabled
                if ENABLE_COLOR_DETECTION:
                    product_data.update({
                        "color_similarity": color_similarity,
                        "query_color": query_color_category,
                        "product_color": product_color_category
                    })
                
                # Ưu tiên sản phẩm còn hàng
                if is_in_stock:
                    in_stock_count += 1
                    # Thêm vào đầu danh sách nếu còn hàng
                    results.insert(0, product_data)
                else:
                    # Thêm vào cuối nếu hết hàng
                    results.append(product_data)
                
                # Dừng khi đã có đủ số lượng yêu cầu và đã có sản phẩm còn hàng
                if len(results) >= top_k and in_stock_count > 0:
                    break
        
        # Chỉ lấy top_k kết quả, ưu tiên sản phẩm còn hàng
        results = results[:top_k]
        
        # Sắp xếp lại theo final score
        results.sort(key=lambda x: -x.get("final_score", 0))
        
        end_time = time.time()
        search_time = end_time - start_time
        
        print(f"📊 Search results: {len(results)} products ({in_stock_count} in stock)")
        print(f"⏱️  Search completed in {search_time:.2f} seconds")
        
        if ENABLE_COLOR_DETECTION:
            print(f"🎨 Query color category: {query_color_category}")
        
        response_data = {
            "success": True,
            "results": results,
            "count": len(results),
            "search_time": round(search_time, 2),
            "config": {
                "color_detection": ENABLE_COLOR_DETECTION,
                "multi_image_encoding": ENABLE_MULTI_IMAGE_ENCODING,
                "similarity_threshold": MIN_SIMILARITY_THRESHOLD
            }
        }
        
        # Add query info only if color detection is enabled
        if ENABLE_COLOR_DETECTION:
            response_data["query_info"] = {
                "color_category": query_color_category,
                "dominant_colors": query_colors[:2] if query_colors else []
            }
        
        return jsonify(response_data)
    
    except Exception as e:
        print(f"Error in search: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/update-embeddings', methods=['POST'])
def update_embeddings():
    """Force update embeddings for all products"""
    try:
        print("🔄 Starting embeddings update...")
        print(f"🔧 Configuration: Multi-image encoding={ENABLE_MULTI_IMAGE_ENCODING}, Color detection={ENABLE_COLOR_DETECTION}")
        
        # Check if there are any products
        print(f"🔍 Checking products in database: {db.name}")
        print(f"🔍 Collection: {products_collection.name}")
        
        total_products = products_collection.count_documents({})
        print(f"📦 Total products in collection: {total_products}")
        
        active_products = products_collection.count_documents({"isActive": True})
        print(f"✅ Active products: {active_products}")
        
        products_with_images = products_collection.count_documents({"images": {"$exists": True, "$ne": []}})
        print(f"🖼️  Products with images: {products_with_images}")
        
        product_count = products_collection.count_documents({"isActive": True, "images": {"$exists": True, "$ne": []}})
        print(f"🎯 Found {product_count} active products with images")
        
        if product_count == 0:
            return jsonify({
                "error": "No active products with images found in database",
                "hint": "Make sure you have products with isActive=true and images array is not empty"
            }), 400
        
        # Clear cache based on encoding method
        cache_key = "all_embeddings_multi" if ENABLE_MULTI_IMAGE_ENCODING else "all_embeddings_single"
        print(f"🗑️  Clearing old embeddings cache: {cache_key}")
        embeddings_collection.delete_one({"_id": cache_key})
        
        # Regenerate
        print("🔄 Generating new embeddings...")
        img_embeddings, product_ids, product_info = get_product_embeddings()
        
        if img_embeddings is not None and len(product_ids) > 0:
            multi_image_count = sum(1 for info in product_info.values() if info.get("encoding_method") == "multi_image_average")
            single_image_count = len(product_ids) - multi_image_count
            
            print(f"✅ Successfully generated embeddings for {len(product_ids)} products")
            print(f"📸 Multi-image encoded: {multi_image_count}, Single-image encoded: {single_image_count}")
            
            return jsonify({
                "success": True,
                "message": f"Updated embeddings for {len(product_ids)} products",
                "count": len(product_ids),
                "encoding_method": "multi_image" if ENABLE_MULTI_IMAGE_ENCODING else "single_image",
                "multi_image_count": multi_image_count,
                "single_image_count": single_image_count,
                "config": {
                    "multi_image_encoding": ENABLE_MULTI_IMAGE_ENCODING,
                    "color_detection": ENABLE_COLOR_DETECTION,
                    "similarity_threshold": MIN_SIMILARITY_THRESHOLD
                }
            })
        else:
            print("❌ Failed to generate embeddings - no valid images found")
            return jsonify({
                "error": "Failed to generate embeddings",
                "details": "No valid product images could be downloaded or encoded. Check image URLs and network connection.",
                "hint": "Make sure product images are accessible via HTTP/HTTPS URLs"
            }), 500
    
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"❌ Error in update_embeddings: {e}")
        print(f"Traceback: {error_trace}")
        return jsonify({
            "error": str(e),
            "type": type(e).__name__
        }), 500

if __name__ == '__main__':
    port = int(os.getenv('IMAGE_SEARCH_PORT', 5002))
    app.run(host='0.0.0.0', port=port, debug=True)

