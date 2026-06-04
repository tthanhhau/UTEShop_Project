#!/usr/bin/env python3
"""
ingest.py — Ingest documents vào ChromaDB cho RAG.
Sử dụng BAAI/bge-m3 embedding model.
"""
import os, glob
try:
    import chromadb
    from chromadb.utils import embedding_functions
except ImportError:
    print("❌ pip install chromadb sentence-transformers"); exit(1)

SCRIPT_DIR = os.path.dirname(__file__)
DOCS_DIR = os.path.join(SCRIPT_DIR, "documents")
CHROMADB_URL = os.getenv("CHROMADB_URL", "http://localhost:8000")
COLLECTION_NAME = os.getenv("CHROMADB_COLLECTION", "uteshop_knowledge")
EMBEDDING_MODEL = "BAAI/bge-m3"

def chunk_text(text, chunk_size=500, overlap=100):
    """Chia text thành chunks nhỏ."""
    lines = text.split("\n")
    chunks, current = [], ""
    for line in lines:
        if len(current) + len(line) > chunk_size and current:
            chunks.append(current.strip())
            # Overlap: giữ lại phần cuối
            words = current.split()
            overlap_words = words[-min(len(words), overlap//5):]
            current = " ".join(overlap_words) + "\n" + line
        else:
            current += "\n" + line
    if current.strip():
        chunks.append(current.strip())
    return chunks

def ingest():
    print("🔗 Connecting to ChromaDB...")
    
    # Thử kết nối HTTP (Docker), fallback sang persistent local
    try:
        client = chromadb.HttpClient(host=CHROMADB_URL.replace("http://","").split(":")[0],
                                     port=int(CHROMADB_URL.split(":")[-1]))
        client.heartbeat()
        print(f"✅ ChromaDB HTTP: {CHROMADB_URL}")
    except Exception:
        persist_dir = os.path.join(SCRIPT_DIR, "..", "chromadb_data")
        os.makedirs(persist_dir, exist_ok=True)
        client = chromadb.PersistentClient(path=persist_dir)
        print(f"✅ ChromaDB Local: {persist_dir}")
    
    # Embedding function
    print(f"📥 Loading embedding model: {EMBEDDING_MODEL}...")
    ef = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name=EMBEDDING_MODEL
    )
    
    # Create/get collection
    collection = client.get_or_create_collection(
        name=COLLECTION_NAME,
        embedding_function=ef,
        metadata={"description": "UTEShop knowledge base for RAG"}
    )
    
    # Load and ingest documents
    md_files = glob.glob(os.path.join(DOCS_DIR, "*.md"))
    print(f"\n📄 Found {len(md_files)} documents")
    
    all_chunks, all_ids, all_metas = [], [], []
    doc_id = 0
    
    for filepath in md_files:
        filename = os.path.basename(filepath)
        print(f"   📖 Processing: {filename}")
        
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        
        chunks = chunk_text(content)
        for i, chunk in enumerate(chunks):
            all_chunks.append(chunk)
            all_ids.append(f"{filename}_{i}")
            all_metas.append({
                "source": filename,
                "chunk_index": i,
                "total_chunks": len(chunks)
            })
            doc_id += 1
    
    # Also ingest product data if available
    products_file = os.path.join(SCRIPT_DIR, "..", "dataset", "extracted_products.json")
    if os.path.exists(products_file):
        import json
        with open(products_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        print(f"   🛍️ Processing: product catalog ({len(data['products'])} products)")
        for p in data["products"]:
            text = (f"Sản phẩm: {p['name']}. Thương hiệu: {p['brand']}. "
                   f"Danh mục: {p['category']}. Giá: {p['price_formatted']}. "
                   f"Giảm giá: {p['discount_percentage']}%. "
                   f"Giá sau giảm: {p['discounted_price_formatted']}. "
                   f"Size có sẵn: {', '.join(p['available_sizes'])}. "
                   f"Tồn kho: {p['total_stock']}. "
                   f"Mô tả: {p['description'][:200]}")
            all_chunks.append(text)
            all_ids.append(f"product_{p['id']}")
            all_metas.append({"source": "product_catalog", "product_id": p["id"],
                            "product_name": p["name"], "brand": p["brand"],
                            "category": p["category"], "price": p["price"]})
    
    # Upsert in batches
    batch_size = 50
    for i in range(0, len(all_chunks), batch_size):
        end = min(i + batch_size, len(all_chunks))
        collection.upsert(
            documents=all_chunks[i:end],
            ids=all_ids[i:end],
            metadatas=all_metas[i:end]
        )
        print(f"   📤 Upserted batch {i//batch_size + 1} ({end}/{len(all_chunks)})")
    
    print(f"\n✅ Ingested {len(all_chunks)} chunks into '{COLLECTION_NAME}'")
    print(f"   Collection size: {collection.count()}")
    
    # Test query
    print("\n🧪 Test query: 'đổi trả sản phẩm'")
    results = collection.query(query_texts=["đổi trả sản phẩm"], n_results=2)
    for doc in results["documents"][0]:
        print(f"   📄 {doc[:100]}...")

if __name__ == "__main__":
    ingest()
