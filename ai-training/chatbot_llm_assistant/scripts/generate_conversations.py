#!/usr/bin/env python3
"""
generate_conversations.py — Sinh dataset hội thoại JSONL cho UTEShop AI.
Tạo 12+ loại conversations từ dữ liệu sản phẩm thực.
"""
import json, os, random, itertools

SCRIPT_DIR = os.path.dirname(__file__)
DATA_FILE = os.path.join(SCRIPT_DIR, "..", "dataset", "extracted_products.json")
OUTPUT_FILE = os.path.join(SCRIPT_DIR, "..", "dataset", "dataset_raw.jsonl")

# ===================== TEMPLATES =====================

SIZE_TEMPLATES = [
    {"input": "Nam cao {h}cm nặng {w}kg mặc áo size gì?",
     "output": "Với chiều cao {h}cm và cân nặng {w}kg, bạn nên mặc size {size}. {tip}"},
    {"input": "Tôi {h} nặng {w}kg, mặc quần size bao nhiêu?",
     "output": "Với số đo {h}cm/{w}kg, bạn phù hợp size {size} cho quần. {tip}"},
    {"input": "Mình cao {h} cân nặng {w} mặc size nào vừa?",
     "output": "Dựa trên chiều cao {h}cm và {w}kg, mình gợi ý size {size} cho bạn. {tip}"},
    {"input": "Cho mình hỏi 1m{h2} {w}kg mặc gì ạ",
     "output": "Bạn cao 1m{h2} nặng {w}kg thì nên chọn size {size}. {tip}"},
    {"input": "Size {size} phù hợp cho người bao nhiêu cân?",
     "output": "Size {size} phù hợp cho người cao khoảng {h}cm, nặng {wmin}-{wmax}kg. {tip}"},
]

SIZE_CHART = [
    (155,165, 45,55, "S", "Nếu thích rộng thoải mái, bạn có thể lên M."),
    (160,170, 55,65, "M", "Size M phù hợp đa số người Việt Nam."),
    (165,175, 60,72, "L", "Nếu bạn thích ôm body hơn thì giữ L, muốn thoải mái thì lên XL."),
    (170,180, 68,80, "XL", "Size XL thoải mái cho dáng người trung bình đến hơi đầy đặn."),
    (175,185, 78,95, "XXL", "Size XXL cho dáng to cao, nếu mập hơn nên thử XXXL."),
]

OUTFIT_TEMPLATES = [
    {"input": "Phối đồ đi chơi cuối tuần mặc gì đẹp?",
     "output": "Đi chơi cuối tuần bạn có thể phối: áo thun oversize + quần short + giày sneaker. Nếu muốn lịch sự hơn: áo polo + quần chinos + giày thể thao trắng. Shop có nhiều mẫu áo thun và quần short đẹp lắm! 😊"},
    {"input": "Đi làm công sở mặc gì phù hợp?",
     "output": "Đi làm công sở bạn nên chọn: áo sơ mi + quần tây slim fit + giày da hoặc sneaker tối màu. Shop có áo sơ mi Zara và quần slim fit rất phù hợp cho văn phòng! 👔"},
    {"input": "Đi date nên mặc gì ạ?",
     "output": "Đi date bạn nên ưu tiên outfit gọn gàng, lịch sự: áo polo hoặc sơ mi + quần chinos + sneaker trắng. Tránh mặc quá casual như áo thun rộng hay quần đùi nhé! 💕"},
    {"input": "Mùa hè nên mặc gì cho mát?",
     "output": "Mùa hè bạn nên chọn: áo thun cotton mỏng hoặc áo linen, quần short hoặc quần vải nhẹ. Chất liệu linen và cotton thoáng khí sẽ giúp bạn mát mẻ hơn. Shop có nhiều áo linen H&M rất thoáng! ☀️"},
    {"input": "Mùa đông cần mặc gì ấm?",
     "output": "Mùa đông bạn nên layer: áo thun bên trong + hoodie/áo khoác bên ngoài + quần jean/jogger. Shop có hoodie Nike, Adidas rất ấm và thời trang! ❄️"},
    {"input": "Phối đồ thể thao đi tập gym",
     "output": "Đi gym nên mặc: áo thun Dri-FIT co giãn + quần short thể thao + giày thể thao. Shop có áo Nike Dri-FIT và quần Jordan rất phù hợp cho việc tập luyện! 💪"},
]

BUDGET_TEMPLATES = [
    {"input": "Có áo nào dưới {max_price}k không?",
     "output": "Shop có nhiều mẫu áo dưới {max_price}k lắm! {products}. Bạn muốn xem thêm không? 😊"},
    {"input": "Muốn mua quần giá rẻ khoảng {max_price}k",
     "output": "Với ngân sách {max_price}k, bạn có thể chọn: {products}. Toàn sản phẩm chất lượng tốt với giá hợp lý! 👍"},
    {"input": "Tìm đồ tầm {min_price}-{max_price}k",
     "output": "Trong khoảng {min_price}-{max_price}k, shop gợi ý: {products}. Nếu muốn xem thêm mẫu khác, bạn cứ nói nhé!"},
]

STOCK_TEMPLATES = [
    {"input": "{product_name} còn hàng không?",
     "output": "{stock_response}"},
    {"input": "{product_name} có size {size} không ạ?",
     "output": "{size_response}"},
    {"input": "Còn size nào cho {product_name}?",
     "output": "Sản phẩm {product_name} hiện còn các size: {available}. Bạn muốn chọn size nào? 😊"},
]

RETURN_POLICY = [
    {"input": "Chính sách đổi trả như thế nào?",
     "output": "UTEShop có chính sách đổi trả trong vòng 7 ngày kể từ khi nhận hàng. Điều kiện: sản phẩm còn nguyên tem/nhãn, chưa qua sử dụng/giặt. Bạn liên hệ CSKH để được hỗ trợ đổi trả nhanh nhất! 📦"},
    {"input": "Mua rồi đổi size được không?",
     "output": "Được ạ! Bạn có thể đổi size trong 7 ngày sau khi nhận hàng, sản phẩm phải còn nguyên nhãn mác. Ship đổi trả miễn phí nếu lỗi từ shop, nếu bạn đổi ý thì phí ship do bạn chịu nhé!"},
    {"input": "Hoàn tiền mất bao lâu?",
     "output": "Sau khi shop nhận lại hàng và xác nhận, tiền sẽ được hoàn trong 3-5 ngày làm việc. Nếu thanh toán qua MoMo/thẻ thì hoàn về tài khoản gốc, COD thì hoàn qua chuyển khoản ngân hàng."},
]

SHIPPING_TEMPLATES = [
    {"input": "Phí ship bao nhiêu?",
     "output": "Phí ship tùy khu vực, thường từ 15.000đ - 40.000đ. Đơn hàng trên 500.000đ được miễn phí ship! Shop giao qua GHTK, thời gian 2-5 ngày tùy khu vực."},
    {"input": "Giao hàng mất bao lâu?",
     "output": "Thời gian giao hàng: nội thành HCM 1-2 ngày, các tỉnh 3-5 ngày. Sau khi đặt hàng, bạn có thể theo dõi đơn qua mã vận đơn trên website."},
    {"input": "Ship tới tỉnh được không?",
     "output": "Có ạ! Shop giao hàng toàn quốc qua GHTK. Thời gian giao tỉnh xa khoảng 3-5 ngày. Bạn cứ đặt hàng, shop sẽ gửi ngay!"},
]

COMPARE_TEMPLATES = [
    {"input": "So sánh {p1} và {p2} cái nào tốt hơn?",
     "output": "So sánh 2 sản phẩm:\n• {p1}: giá {price1}, {brand1}, {desc1}\n• {p2}: giá {price2}, {brand2}, {desc2}\nNếu bạn ưu tiên {compare_point}, mình gợi ý chọn {recommend}! 😊"},
]

GREETING_TEMPLATES = [
    {"input": "Xin chào", "output": "Chào bạn! 👋 Mình là trợ lý AI của UTEShop. Mình có thể giúp bạn tìm kiếm sản phẩm, tư vấn size, phối đồ. Bạn cần gì nào? 😊"},
    {"input": "Hello", "output": "Hello bạn! 👋 Chào mừng đến UTEShop! Mình sẵn sàng hỗ trợ bạn mua sắm. Bạn đang tìm sản phẩm gì? 🛍️"},
    {"input": "Chào shop", "output": "Chào bạn! 😊 UTEShop rất vui được phục vụ. Bạn muốn tìm áo, quần hay phụ kiện gì không?"},
    {"input": "Alo có ai không", "output": "Có mình đây ạ! 👋 Mình là AI trợ lý của UTEShop, hoạt động 24/7. Bạn cần mình hỗ trợ gì?"},
    {"input": "Hey", "output": "Hey bạn! 😄 Chào mừng đến UTEShop. Bạn đang tìm kiếm gì hôm nay?"},
]

THANKS_TEMPLATES = [
    {"input": "Cảm ơn nhé", "output": "Không có gì đâu ạ! 😊 Rất vui được hỗ trợ bạn. Nếu cần gì thêm, cứ nhắn mình nhé! Chúc bạn mua sắm vui vẻ! 💙"},
    {"input": "Thanks", "output": "Cảm ơn bạn đã ghé UTEShop! 💖 Nếu có gì cần hỗ trợ thêm, đừng ngại hỏi mình nhé!"},
    {"input": "Ok cảm ơn shop", "output": "Dạ không có gì ạ! 😄 Chúc bạn một ngày tốt lành. Hẹn gặp lại tại UTEShop!"},
]

MATERIAL_TEMPLATES = [
    {"input": "Áo cotton và polyester khác nhau sao?",
     "output": "Cotton mềm mại, thấm mồ hôi tốt, thoáng khí - phù hợp mặc hàng ngày. Polyester bền hơn, nhanh khô, ít nhăn - phù hợp tập thể thao. Shop có cả 2 loại, bạn ưu tiên thoáng hay bền?"},
    {"input": "Chất liệu linen là gì?",
     "output": "Linen (vải lanh) là chất liệu tự nhiên, rất thoáng mát, phù hợp mùa hè. Ưu: mát, sang trọng. Nhược: dễ nhăn. Shop có nhiều áo sơ mi linen H&M rất đẹp! 🌿"},
    {"input": "Vải Dri-FIT là gì vậy?",
     "output": "Dri-FIT là công nghệ của Nike, giúp thấm hút mồ hôi nhanh và giữ cơ thể luôn khô ráo. Rất phù hợp cho tập gym, chạy bộ hay hoạt động thể thao. Shop có nhiều áo Dri-FIT Nike nè! 💪"},
]

SEARCH_TEMPLATES = [
    {"input": "Tìm {keyword}",
     "output": "Để mình tìm {keyword} cho bạn nhé! Shop có nhiều mẫu {keyword} đẹp từ các thương hiệu Nike, Adidas, Zara, H&M. Bạn có yêu cầu gì về size hay giá không? 🔍"},
    {"input": "Có {keyword} không?",
     "output": "Có ạ! Shop có nhiều mẫu {keyword} lắm. {product_suggestions}. Bạn muốn xem chi tiết sản phẩm nào? 😊"},
    {"input": "Muốn mua {keyword}",
     "output": "Tuyệt vời! {keyword} là lựa chọn rất hay. {product_suggestions}. Bạn thích mẫu nào, nói mình biết nhé!"},
]


def load_products():
    """Load dữ liệu sản phẩm đã extract."""
    if not os.path.exists(DATA_FILE):
        print(f"❌ Chưa có {DATA_FILE}. Chạy extract_data.py trước!")
        return None
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def gen_size_convos(products):
    """Sinh hội thoại tư vấn size."""
    convos = []
    for hmin,hmax, wmin,wmax, size, tip in SIZE_CHART:
        for tmpl in SIZE_TEMPLATES:
            h = random.randint(hmin, hmax)
            w = random.randint(wmin, wmax)
            h2 = str(h - 100)  # 170 -> 70
            inp = tmpl["input"].format(h=h, w=w, h2=h2, size=size, wmin=wmin, wmax=wmax)
            out = tmpl["output"].format(h=h, w=w, h2=h2, size=size, wmin=wmin, wmax=wmax, tip=tip)
            convos.append({"instruction": "Tư vấn size", "input": inp, "output": out})
    return convos


def gen_outfit_convos():
    """Sinh hội thoại tư vấn phối đồ."""
    return [{"instruction": "Tư vấn phối đồ", **t} for t in OUTFIT_TEMPLATES]


def gen_budget_convos(products):
    """Sinh hội thoại tư vấn theo ngân sách."""
    convos = []
    price_ranges = [(100,200), (200,300), (300,500), (500,800), (800,1200)]
    for pmin, pmax in price_ranges:
        matched = [p for p in products if pmin*1000 <= p["discounted_price"] <= pmax*1000]
        if not matched: continue
        sample = random.sample(matched, min(3, len(matched)))
        prod_text = ", ".join([f'{p["name"]} ({p["discounted_price_formatted"]})' for p in sample])
        for tmpl in BUDGET_TEMPLATES:
            inp = tmpl["input"].format(min_price=pmin, max_price=pmax)
            out = tmpl["output"].format(min_price=pmin, max_price=pmax, products=prod_text)
            convos.append({"instruction": "Tư vấn theo ngân sách", "input": inp, "output": out})
    return convos


def gen_stock_convos(products):
    """Sinh hội thoại kiểm tra tồn kho."""
    convos = []
    for p in random.sample(products, min(15, len(products))):
        name = p["name"]
        avail = ", ".join(p["available_sizes"]) if p["available_sizes"] else "Hết hàng"
        stock_resp = (f'Sản phẩm {name} hiện {"còn hàng" if p["in_stock"] else "tạm hết hàng"}. '
                     f'Các size có sẵn: {avail}. Giá: {p["discounted_price_formatted"]}. 😊')
        for tmpl in STOCK_TEMPLATES[:2]:
            if "{size}" in tmpl["input"] and p["available_sizes"]:
                sz = random.choice(p["available_sizes"])
                si = [s for s in p["sizes"] if s["size"]==sz]
                stk = si[0]["stock"] if si else 0
                size_resp = f'{name} còn size {sz} (còn {stk} sản phẩm). Giá: {p["discounted_price_formatted"]}. Bạn muốn đặt luôn không? 🛒'
                convos.append({"instruction": "Kiểm tra tồn kho",
                    "input": tmpl["input"].format(product_name=name, size=sz),
                    "output": size_resp})
            elif "{size}" not in tmpl["input"]:
                convos.append({"instruction": "Kiểm tra tồn kho",
                    "input": tmpl["input"].format(product_name=name),
                    "output": stock_resp})
        # Available sizes query
        convos.append({"instruction": "Kiểm tra tồn kho",
            "input": STOCK_TEMPLATES[2]["input"].format(product_name=name),
            "output": STOCK_TEMPLATES[2]["output"].format(product_name=name, available=avail)})
    return convos


def gen_compare_convos(products):
    """Sinh hội thoại so sánh sản phẩm."""
    convos = []
    by_cat = {}
    for p in products:
        by_cat.setdefault(p["category"], []).append(p)
    
    for cat, prods in by_cat.items():
        if len(prods) < 2: continue
        pairs = list(itertools.combinations(random.sample(prods, min(5, len(prods))), 2))
        for p1, p2 in pairs[:3]:
            cheaper = p1 if p1["discounted_price"] < p2["discounted_price"] else p2
            popular = p1 if p1["sold_count"] > p2["sold_count"] else p2
            convos.append({"instruction": "So sánh sản phẩm",
                "input": f'So sánh {p1["name"]} và {p2["name"]}',
                "output": f'So sánh:\n• {p1["name"]}: {p1["discounted_price_formatted"]} ({p1["brand"]})\n• {p2["name"]}: {p2["discounted_price_formatted"]} ({p2["brand"]})\nNếu ưu tiên giá → chọn {cheaper["name"]}. Nếu ưu tiên bán chạy → chọn {popular["name"]}! 😊'})
    return convos


def gen_search_convos(products):
    """Sinh hội thoại tìm kiếm sản phẩm."""
    convos = []
    keywords = ["áo thun", "áo polo", "áo sơ mi", "quần jean", "quần short", 
                "hoodie", "giày", "áo Nike", "quần Adidas", "đồ Zara", "áo H&M"]
    for kw in keywords:
        matched = [p for p in products if kw.lower().split()[-1] in p["name"].lower() or 
                   kw.lower().split()[-1] in p["brand"].lower() or
                   kw.lower().split()[-1] in p["category"].lower()]
        if not matched: matched = random.sample(products, min(3, len(products)))
        sample = random.sample(matched, min(3, len(matched)))
        sugg = ", ".join([f'{p["name"]} ({p["discounted_price_formatted"]})' for p in sample])
        for tmpl in SEARCH_TEMPLATES:
            convos.append({"instruction": "Tìm kiếm sản phẩm",
                "input": tmpl["input"].format(keyword=kw),
                "output": tmpl["output"].format(keyword=kw, product_suggestions=sugg)})
    return convos


def gen_policy_convos():
    """Sinh hội thoại đổi trả + vận chuyển + greeting + thanks + material."""
    convos = []
    for t in RETURN_POLICY:
        convos.append({"instruction": "Chính sách đổi trả", **t})
    for t in SHIPPING_TEMPLATES:
        convos.append({"instruction": "Thông tin vận chuyển", **t})
    for t in GREETING_TEMPLATES:
        convos.append({"instruction": "Chào hỏi", **t})
    for t in THANKS_TEMPLATES:
        convos.append({"instruction": "Cảm ơn", **t})
    for t in MATERIAL_TEMPLATES:
        convos.append({"instruction": "Tư vấn chất liệu", **t})
    return convos


def gen_product_info_convos(products):
    """Sinh hội thoại hỏi thông tin sản phẩm cụ thể."""
    convos = []
    for p in products:
        # Hỏi giá
        convos.append({"instruction": "Thông tin sản phẩm",
            "input": f'{p["name"]} giá bao nhiêu?',
            "output": f'{p["name"]} có giá {p["price_formatted"]}' +
                     (f', hiện đang giảm {p["discount_percentage"]}% còn {p["discounted_price_formatted"]}' if p["discount_percentage"]>0 else '') +
                     f'. Thương hiệu {p["brand"]}. Bạn muốn đặt mua không? 🛒'})
        # Hỏi mô tả
        desc_short = p["description"][:150] + "..." if len(p["description"])>150 else p["description"]
        convos.append({"instruction": "Thông tin sản phẩm",
            "input": f'Mô tả {p["name"]}',
            "output": f'{p["name"]} - {p["brand"]}: {desc_short} Giá: {p["discounted_price_formatted"]}.'})
    return convos


def generate_all():
    """Pipeline sinh toàn bộ dataset."""
    data = load_products()
    if not data: return
    
    products = data["products"]
    print(f"📦 Loaded {len(products)} sản phẩm")

    all_convos = []
    
    # Sinh từng loại
    generators = [
        ("Tư vấn size", gen_size_convos, (products,)),
        ("Phối đồ", gen_outfit_convos, ()),
        ("Ngân sách", gen_budget_convos, (products,)),
        ("Tồn kho", gen_stock_convos, (products,)),
        ("So sánh", gen_compare_convos, (products,)),
        ("Tìm kiếm", gen_search_convos, (products,)),
        ("Chính sách", gen_policy_convos, ()),
        ("Sản phẩm", gen_product_info_convos, (products,)),
    ]

    for name, fn, args in generators:
        convos = fn(*args)
        all_convos.extend(convos)
        print(f"   ✅ {name}: {len(convos)} mẫu")

    # Shuffle
    random.shuffle(all_convos)
    
    # Export JSONL
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        for c in all_convos:
            f.write(json.dumps(c, ensure_ascii=False) + "\n")
    
    print(f"\n✅ Tổng: {len(all_convos)} mẫu → {OUTPUT_FILE}")
    return all_convos


if __name__ == "__main__":
    generate_all()
