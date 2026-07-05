// Runtime knowledge base for UTEShop chatbot.
//
// This file is used by the real backend chatbot, not only by offline evaluation.
// Keep answers short, factual, and aligned with current store policies.
// If a policy changes, update this file first so both production answers and
// evaluation expected answers can stay consistent.

export const POLICY_KNOWLEDGE = [
  {
    intent: "policy_shipping",
    category: "shipping",
    keywords: [
      "giao hàng",
      "ship",
      "shipping",
      "vận chuyển",
      "toàn quốc",
      "giao tới",
      "giao về",
      "bao lâu nhận",
      "mấy ngày nhận",
      "phí ship"
    ],
    answer:
      "UTEShop hỗ trợ giao hàng toàn quốc. Thời gian và phí vận chuyển phụ thuộc vào địa chỉ nhận hàng và đơn vị vận chuyển được hiển thị khi đặt hàng."
  },
  {
    intent: "policy_return",
    category: "return_policy",
    keywords: [
      "đổi size",
      "đổi trả",
      "trả hàng",
      "hoàn hàng",
      "đổi hàng",
      "sai size",
      "không vừa",
      "bị lỗi",
      "lỗi sản phẩm"
    ],
    answer:
      "Bạn có thể liên hệ bộ phận hỗ trợ của UTEShop để được hướng dẫn đổi size hoặc đổi trả nếu sản phẩm đáp ứng điều kiện. Vui lòng giữ nguyên tem, nhãn và cung cấp thông tin đơn hàng để được hỗ trợ nhanh hơn."
  },
  {
    intent: "policy_payment",
    category: "payment",
    keywords: [
      "thanh toán",
      "cod",
      "tiền mặt",
      "trả tiền khi nhận",
      "chuyển khoản",
      "ví điện tử",
      "momo",
      "vnpay",
      "phương thức thanh toán"
    ],
    answer:
      "UTEShop hỗ trợ các phương thức thanh toán được hiển thị ở bước đặt hàng. Nếu phương thức thanh toán khi nhận hàng khả dụng cho đơn của bạn, hệ thống sẽ hiển thị để bạn chọn."
  },
  {
    intent: "policy_order_tracking",
    category: "order",
    keywords: [
      "theo dõi đơn",
      "kiểm tra đơn",
      "tra cứu đơn",
      "đơn hàng ở đâu",
      "trạng thái đơn",
      "lịch sử đơn",
      "xem đơn hàng",
      "đơn của tôi"
    ],
    answer:
      "Bạn có thể đăng nhập tài khoản UTEShop và vào mục lịch sử đơn hàng hoặc theo dõi đơn hàng để kiểm tra trạng thái đơn hàng."
  },
  {
    intent: "policy_account",
    category: "account",
    keywords: [
      "tài khoản",
      "đăng nhập",
      "đăng ký",
      "quên mật khẩu",
      "mật khẩu",
      "email",
      "số điện thoại"
    ],
    answer:
      "Bạn có thể đăng nhập hoặc đăng ký tài khoản UTEShop để quản lý đơn hàng, thông tin cá nhân và lịch sử mua sắm. Nếu quên mật khẩu, hãy dùng chức năng khôi phục mật khẩu trên trang đăng nhập."
  }
];

export const OUT_OF_SCOPE_ANSWER =
  "Xin lỗi, tôi chỉ hỗ trợ các vấn đề liên quan đến mua sắm tại UTEShop như sản phẩm, size, đơn hàng, thanh toán, giao hàng và đổi trả.";

export const PRODUCT_INFO_REQUIRED_ANSWER =
  "Bạn vui lòng cung cấp tên sản phẩm, mã sản phẩm, size hoặc màu cần mua để UTEShop kiểm tra thông tin chính xác hơn.";

const normalizeText = (text = "") =>
  text
    .toString()
    .toLowerCase()
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .trim();

export const matchPolicyKnowledge = (message) => {
  const msg = normalizeText(message);

  if (!msg) return null;

  for (const item of POLICY_KNOWLEDGE) {
    if (item.keywords.some((keyword) => msg.includes(normalizeText(keyword)))) {
      return {
        intent: item.intent,
        filters: {
          category: item.category,
          source: "policyKnowledge"
        },
        message: item.answer
      };
    }
  }

  return null;
};

export const isAmbiguousProductInfoQuestion = (message) => {
  const msg = normalizeText(message);

  const productInfoPatterns = [
    /sản phẩm này.*(còn|hết|giá|size|màu|mau|tồn|kho)/i,
    /(còn hàng|hết hàng|còn size|còn màu|giá bao nhiêu|bao nhiêu tiền)/i,
    /(kiểm tra|check).*(tồn kho|còn hàng|sản phẩm)/i
  ];

  const hasSpecificProductInfo =
    /\b(sp|sku|mã)\s*[:#-]?\s*[a-z0-9_-]+/i.test(msg) ||
    /(áo|quần|giày|dép|mũ|nón|túi|balo|hoodie|polo|jean|sneaker)\s+[\p{L}0-9]/iu.test(msg);

  return productInfoPatterns.some((pattern) => pattern.test(msg)) && !hasSpecificProductInfo;
};

export const isOutOfScopeQuestion = (message) => {
  const msg = normalizeText(message);

  const outOfScopePatterns = [
    /lập trình|python|java|javascript|code|thuật toán|bài tập/i,
    /thời tiết|tin tức|bóng đá|chứng khoán|crypto|bitcoin/i,
    /nấu ăn|du lịch|dịch tiếng|dịch sang|viết luận|làm thơ/i,
    /chính trị|tôn giáo|y tế|pháp luật/i
  ];

  const shoppingTerms =
    /(uteshop|shop|sản phẩm|đơn hàng|giao hàng|ship|thanh toán|đổi trả|size|áo|quần|giày|mua|bán)/i;

  return outOfScopePatterns.some((pattern) => pattern.test(msg)) && !shoppingTerms.test(msg);
};