import React from "react";

const TestimonialSection = () => {
  const testimonials = [
    {
      name: "Nguyễn Thị Lan",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
      rating: 5,
      comment: "Sản phẩm chất lượng tuyệt vời, giao hàng nhanh chóng. Tôi rất hài lòng!",
      product: "Son môi L'Oréal"
    },
    {
      name: "Trần Minh Anh",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
      rating: 5,
      comment: "Mỹ phẩm chính hãng, giá cả hợp lý. Sẽ ủng hộ shop lâu dài.",
      product: "Kem dưỡng da"
    },
    {
      name: "Lê Thị Hương",
      image: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop",
      rating: 5,
      comment: "Dịch vụ chăm sóc khách hàng tốt, tư vấn nhiệt tình. Rất đáng tin cậy!",
      product: "Serum Vitamin C"
    }
  ];

  return (
    <div className="py-16 bg-gradient-to-b from-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Khách hàng nói gì về chúng tôi
          </h2>
          <p className="text-gray-600 text-lg">
            Hàng nghìn khách hàng hài lòng đã tin tưởng và sử dụng
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-pink-500 to-purple-500 mx-auto mt-4 rounded-full"></div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg p-8 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              {/* Stars */}
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-5 h-5 text-yellow-400 fill-current"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>

              {/* Comment */}
              <p className="text-gray-700 mb-6 italic">"{testimonial.comment}"</p>

              {/* Product */}
              <p className="text-sm text-purple-600 font-semibold mb-4">
                Sản phẩm: {testimonial.product}
              </p>

              {/* Customer Info */}
              <div className="flex items-center pt-4 border-t border-gray-200">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover mr-4"
                />
                <div>
                  <h4 className="font-bold text-gray-800">{testimonial.name}</h4>
                  <p className="text-sm text-gray-500">Khách hàng</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestimonialSection;

