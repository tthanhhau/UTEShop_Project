import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./src/models/product.js";
import Category from "./src/models/category.js";
import Brand from "./src/models/brand.js";

// test
dotenv.config();
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/shop";

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Kết nối MongoDB thành công!");

    // Xóa dữ liệu cũ
    await Product.deleteMany();
    await Category.deleteMany();
    await Brand.deleteMany();
    console.log("🗑️ Đã xoá dữ liệu cũ!");

    // Tạo categories
    const categories = await Category.insertMany([
      {
        name: "Chăm sóc da mặt và tóc",
        description: "Các sản phẩm làm sạch, dưỡng, đặc trị",
      },
      { name: "Trang điểm", description: "Sản phẩm tạo lớp trang điểm" },
      {
        name: "Chăm sóc cơ thể",
        description: "Dưỡng da toàn thân, khử mùi, sữa tắm",
      },
      { name: "Nước hoa", description: "Nước hoa nam, nữ, unisex" },
      { name: "Chăm sóc môi", description: "Son, dưỡng môi, tẩy da chết môi" },
    ]);

    const [face, makeup, body, fragance, lips] = categories;

    // Tạo brands
    const brands = await Brand.insertMany([
      {
        name: "Dior",
        description: "The art of color or Dior, the essence of style",
        logo: "https://picsum.photos/100/100?random=101",
        website: "https://Dior.com",
        country: "USA",
      },
      {
        name: "Chanel",
        description: "Impossible is Nothing - Ba sọc kinh điển",
        logo: "https://picsum.photos/100/100?random=102",
        website: "https://Chanel.com",
        country: "Germany",
      },

      {
        name: "LaRochePosay",
        description: "Fast fashion từ Tây Ban Nha",
        logo: "https://picsum.photos/100/100?random=104",
        website: "https://LaRochePosay.com",
        country: "Spain",
      },
      {
        name: "Lancome",
        description: "Fashion for everyone từ Thụy Điển",
        logo: "https://picsum.photos/100/100?random=105",
        website: "https://Lancome.com",
        country: "Sweden",
      },
      {
        name: "Innisfree",
        description: "Thương hiệu xa xỉ từ Pháp",
        logo: "https://picsum.photos/100/100?random=106",
        website: "https://Innisfree.com",
        country: "France",
      },
    ]);

    const [Dior, Chanel, LaRochePosay, Lancome, Innisfree] = brands;

    // Seed sản phẩm

    const products = [
      // Sản phẩm cho Dior
      {
        name: "Son Dior Matte 999",
        description: "Son môi lì cao cấp với màu sắc bền lâu",
        price: 1200000,
        stock: 50,
        images: [
          "https://cdn.vuahanghieu.com/unsafe/0x900/left/top/smart/filters:quality(90)/https://admin.vuahanghieu.com/upload/product/2025/09/son-li-dior-rouge-dior-couture-color-lipstick-626-mousseline-veil-finish-mau-cam-gach-68d36394c3729-24092025102052.jpg",
          "https://lipstick.vn/wp-content/uploads/2016/11/son-dior-matte-999.png",
          "https://plus.unsplash.com/premium_photo-1661772819014-1fe81103e12b?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=692",
        ],
        category: face._id,
        brand: Dior._id,
        soldCount: Math.floor(Math.random() * 100),
        viewCount: Math.floor(Math.random() * 500),
        discountPercentage: Math.floor(Math.random() * 20),
      },
      {
        name: "Kem nền Dior Forever",
        description: "Kem nền che phủ hoàn hảo, dưỡng da",
        price: 1500000,
        stock: 40,
        images: [
          "https://www.dior.com/dw/image/v2/BGXS_PRD/on/demandware.static/-/Sites-master_dior/default/dwc14e8faf/Y0996398/Y0996398_C023600020_E01_RHC.jpg?sw=1024",
          "https://www.dior.com/dw/image/v2/BGXS_PRD/on/demandware.static/-/Sites-master_dior/default/dwfa4481a1/Y0996398/Y0996398_C023600020_E02_RHC.jpg?sw=1024",
          "https://www.dior.com/dw/image/v2/BGXS_PRD/on/demandware.static/-/Sites-master_dior/default/dw7a575e7a/Y0996398/Y0996398_C023600020_E03_RHC.jpg?sw=1024",
        ],
        category: makeup._id,
        brand: Dior._id,
        soldCount: Math.floor(Math.random() * 100),
        viewCount: Math.floor(Math.random() * 500),
        discountPercentage: Math.floor(Math.random() * 20),
      },
      {
        name: "Sữa dưỡng thể Dior Rose",
        description: "Sữa dưỡng thể hương hoa hồng",
        price: 800000,
        stock: 60,
        images: [
          "https://www.dior.com/dw/image/v2/BGXS_PRD/on/demandware.static/-/Sites-master_dior/default/dw450cd311/Y0996469/Y0996469_C099600567_E01_ZHC.jpg?sw=1920",
        ],
        category: body._id,
        brand: Dior._id,
        soldCount: Math.floor(Math.random() * 100),
        viewCount: Math.floor(Math.random() * 500),
        discountPercentage: Math.floor(Math.random() * 20),
      },
      {
        name: "Purple Oud 250ml",
        description: "Nước hoa nữ quyến rũ, lưu hương lâu",
        price: 2500000,
        stock: 30,
        images: [
          "https://www.dior.com/dw/image/v2/BGXS_PRD/on/demandware.static/-/Sites-master_dior/default/dw7e1d0d89/Y0786427/Y0786427_F078628709_E01_RHC.jpg?sw=1024",
          "https://www.dior.com/dw/image/v2/BGXS_PRD/on/demandware.static/-/Sites-master_dior/default/dwfb297220/Y0786427/Y0786427_F078628709_E02_RHC.jpg?sw=1024",
        ],
        category: fragance._id,
        brand: Dior._id,
        soldCount: Math.floor(Math.random() * 100),
        viewCount: Math.floor(Math.random() * 500),
        discountPercentage: Math.floor(Math.random() * 20),
      },
      {
        name: "Dưỡng môi Dior Addict Glazed Pink",
        description: "Dưỡng môi mềm mịn, có màu nhẹ",
        price: 600000,
        stock: 70,
        images: [
          "https://www.dior.com/dw/image/v2/BGXS_PRD/on/demandware.static/-/Sites-master_dior/default/dw2b83ba7b/Y0000050/Y0000050_E000000588_E01_RHC.jpg?sw=1024",
          "https://www.dior.com/dw/image/v2/BGXS_PRD/on/demandware.static/-/Sites-master_dior/default/dw9d6e7233/Y0000050/Y0000050_E000000588_E02_RHC.jpg?sw=1024",
          "https://www.dior.com/dw/image/v2/BGXS_PRD/on/demandware.static/-/Sites-master_dior/default/dwe8a5b053/Y0000050/Y0000050_E000000588_E03_RHC.jpg?sw=1024",
        ],
        category: lips._id,
        brand: Dior._id,
        soldCount: Math.floor(Math.random() * 100),
        viewCount: Math.floor(Math.random() * 500),
        discountPercentage: Math.floor(Math.random() * 20),
      },

      // Sản phẩm cho Chanel
      {
        name: "Sữa rửa mặt ÉCLAT PREMIER LA MOUSSE",
        description: "Sữa rửa mặt dịu nhẹ cho da nhạy cảm",
        price: 900000,
        stock: 55,
        images: [
          "https://www.chanel.com/images//t_one//w_0.60,h_0.60,c_crop/q_auto:good,f_autoplus,fl_lossy,dpr_1.1/w_1020/5fl-oz--packshot-default-133520-9566410735646.jpg",
          "https://www.chanel.com/images//t_one/t_fnbedito//q_auto:good,f_auto,fl_lossy,dpr_1.1/w_1020/5fl-oz--packshot-alternative-v1-133520-9566410833950.jpg",
          "https://www.chanel.com/images//t_one///q_auto:good,f_auto,fl_lossy,dpr_1.1/w_1020/5fl-oz--basic-texture-133520-9555869794334.jpg",
        ],
        category: face._id,
        brand: Chanel._id,
        soldCount: Math.floor(Math.random() * 100),
        viewCount: Math.floor(Math.random() * 500),
        discountPercentage: Math.floor(Math.random() * 20),
      },
      {
        name: "INIMITABLE EXTRÊME",
        description: "Mascara cong mi, chống lem",
        price: 1100000,
        stock: 45,
        images: [
          "https://www.chanel.com/images//t_one//w_0.43,h_0.43,c_crop/q_auto:good,f_autoplus,fl_lossy,dpr_1.1/w_1020/inimitable-extreme-volume-length-curl-separation-extreme-wear-rinsable-10-noir-pur-0-21oz--packshot-default-195910-9564805201950.jpg",
          "https://www.chanel.com/images//t_one/t_fnbedito//q_auto:good,f_auto,fl_lossy,dpr_1.1/w_1020/inimitable-extreme-volume-length-curl-separation-extreme-wear-rinsable-10-noir-pur-0-21oz--packshot-alternative-v1-195910-9563929346078.jpg",
          "https://www.chanel.com/images//t_one///q_auto:good,f_auto,fl_lossy,dpr_1.1/w_1020/inimitable-extreme-volume-length-curl-separation-extreme-wear-rinsable-10-noir-pur-0-21oz--basic-texture-195910-9542054510622.jpg",
        ],
        category: makeup._id,
        brand: Chanel._id,
        soldCount: Math.floor(Math.random() * 100),
        viewCount: Math.floor(Math.random() * 500),
        discountPercentage: Math.floor(Math.random() * 20),
      },
      {
        name: "SUBLIMAGE LES GRAINS DE VANILLE",
        description: "TẨY TẾ BÀO CHẾT VƯỢT TRỘI: LÀM SẠCH VÀ THANH LỌC",
        price: 700000,
        stock: 65,
        images: [
          "https://www.chanel.com/images//t_one//w_0.43,h_0.43,c_crop/q_auto:good,f_autoplus,fl_lossy,dpr_1.1/w_1020/sublimage-les-grains-de-vanille-purifying-and-radiance-revealing-vanilla-seed-face-scrub-1-7oz--packshot-default-144350-8845083639838.jpg",
          "https://www.chanel.com/images//t_one/t_fnbedito//q_auto:good,f_auto,fl_lossy,dpr_1.1/w_1020/sublimage-les-grains-de-vanille-purifying-and-radiance-revealing-vanilla-seed-face-scrub-1-7oz--packshot-alternative-v1-144350-9564206071838.jpg",
          "https://www.chanel.com/images//t_one///q_auto:good,f_auto,fl_lossy,dpr_1.1/w_1020/sublimage-les-grains-de-vanille-purifying-and-radiance-revealing-vanilla-seed-face-scrub-1-7oz--basic-texture-144350-8845083574302.jpg",
        ],
        category: body._id,
        brand: Chanel._id,
        soldCount: Math.floor(Math.random() * 100),
        viewCount: Math.floor(Math.random() * 500),
        discountPercentage: Math.floor(Math.random() * 20),
      },
      {
        name: "COCO MADEMOISELLE",
        description: "Nước hoa cổ điển, hương vanilla",
        price: 2800000,
        stock: 35,
        images: [
          "https://www.chanel.com/images//t_one//w_0.51,h_0.51,c_crop/q_auto:good,f_autoplus,fl_lossy,dpr_1.1/w_1020/coco-mademoiselle-fragrance-primer-3-4fl-oz--packshot-default-116690-9565210509342.jpg",
          "https://www.chanel.com/images//t_one/t_fnbedito//q_auto:good,f_auto,fl_lossy,dpr_1.1/w_1020/coco-mademoiselle-fragrance-primer-3-4fl-oz--packshot-alternative-v1-116690-9565210574878.jpg",
        ],
        category: fragance._id,
        brand: Chanel._id,
        soldCount: Math.floor(Math.random() * 100),
        viewCount: Math.floor(Math.random() * 500),
        discountPercentage: Math.floor(Math.random() * 20),
      },
      {
        name: "LE ROUGE DUO ULTRA TENUE 43 - SENSUAL ROSE",
        description: "Son bóng dưỡng ẩm cao",
        price: 750000,
        stock: 75,
        images: [
          "https://www.chanel.com/images//t_one//w_0.45,h_0.45,c_crop/q_auto:good,f_autoplus,fl_lossy,dpr_1.1/w_1020/le-rouge-duo-ultra-tenue-ultrawear-liquid-lip-colour-43-sensual-rose-0-26fl-oz--packshot-default-175116-9570181054494.jpg",
          "https://www.chanel.com/images//t_one/t_fnbedito//q_auto:good,f_auto,fl_lossy,dpr_1.1/w_1020/le-rouge-duo-ultra-tenue-ultrawear-liquid-lip-colour-43-sensual-rose-0-26fl-oz--packshot-alternative-v1-175116-9570180825118.jpg",
          "https://www.chanel.com/images//t_one///q_auto:good,f_auto,fl_lossy,dpr_1.1/w_1020/le-rouge-duo-ultra-tenue-ultrawear-liquid-lip-colour-43-sensual-rose-0-26fl-oz--basic-texture-175116-9570180988958.jpg",
        ],
        category: lips._id,
        brand: Chanel._id,
        soldCount: Math.floor(Math.random() * 100),
        viewCount: Math.floor(Math.random() * 500),
        discountPercentage: Math.floor(Math.random() * 20),
      },

      // Sản phẩm cho LaRochePosay
      {
        name: "KEM CHỐNG NẮNG PHỔ RỘNG ANTHELIOS XL SPF50+ PA++++",
        description: "Kem chống nắng phổ rộng SPF50",
        price: 500000,
        stock: 80,
        images: [
          "https://www.larocheposay.vn/-/media/project/loreal/brand-sites/lrp/apac/vn/products/anthelios/xl/xl-hero.png",
          "https://www.larocheposay.vn/-/media/project/loreal/brand-sites/lrp/apac/vn/products/anthelios/xl/xl/1.png",
          "https://www.larocheposay.vn/-/media/project/loreal/brand-sites/lrp/apac/vn/products/anthelios/xl/xl/4.png",
          "https://www.larocheposay.vn/-/media/project/loreal/brand-sites/lrp/apac/vn/products/anthelios/xl/xl/5.png",
        ],
        category: face._id,
        brand: LaRochePosay._id,
        soldCount: Math.floor(Math.random() * 100),
        viewCount: Math.floor(Math.random() * 500),
        discountPercentage: Math.floor(Math.random() * 20),
      },
      {
        name: "La Roche-Posay Uvidea XL BB Cream 03 SPF50+ PA++++ - Kem Che Khuyết Điểm Có Chỉ Số Chống Nắng 30ml ",
        description: "Kem nền dưỡng da, che khuyết điểm",
        price: 600000,
        stock: 50,
        images: [
          "https://pos.nvncdn.com/82e158-40396/ps/20190108_X9o6omUhlAoLuWWzcQPwlELn.jpg?v=1676566694",
          "https://plus.unsplash.com/premium_photo-1726837254019-36cba6fef703?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=709",
        ],
        category: makeup._id,
        brand: LaRochePosay._id,
        soldCount: Math.floor(Math.random() * 100),
        viewCount: Math.floor(Math.random() * 500),
        discountPercentage: Math.floor(Math.random() * 20),
      },
      {
        name: "LIPIKAR SYNDET AP+ SỮA TẮM GIÚP LÀM SẠCH DỊU NHẸ, KHÔNG HƯƠNG LIỆU",
        description: "Sữa tắm dưỡng ẩm cho da khô",
        price: 400000,
        stock: 90,
        images: [
          "https://www.larocheposay.vn/-/media/project/loreal/brand-sites/lrp/apac/vn/products/lipikar/lipikar-syndet-ap-plus/eczema-lipikar-syndet-ap/la-roche-posay-productpage-eczema-lipikar-syndet-ap-400ml-3337875537315-front.png",
          "https://www.larocheposay.vn/-/media/project/loreal/brand-sites/lrp/apac/vn/products/lipikar/lipikar-syndet-ap-plus/eczema-lipikar-syndet-ap/la-roche-posay-productpage-eczema-lipikar-syndet-ap-400ml-3337875537315-back.jpg",
          "https://www.larocheposay.vn/-/media/project/loreal/brand-sites/lrp/apac/vn/products/lipikar/lipikar-syndet-ap-plus/eczema-lipikar-syndet-ap/la-roche-posay-productpage-eczema-lipikar-syndet-ap-200ml-3337875537308-front.png",
        ],
        category: body._id,
        brand: LaRochePosay._id,
        soldCount: Math.floor(Math.random() * 100),
        viewCount: Math.floor(Math.random() * 500),
        discountPercentage: Math.floor(Math.random() * 20),
      },
      {
        name: "Xịt chống nắng La Roche-Posay Anthelios Invisible Fresh Mist SPF50 hỗ trợ kiểm soát bã nhờn và mồ hôi (75ml)",
        description:
          "Xịt chống nắng La Roche-Posay Anthelios Invisible Fresh Mist SPF 50+ bảo vệ da trước những tác hại từ ánh nắng và ô nhiễm, kiểm soát bã nhờn và mồ hôi giúp mang đến một cảm giác sạch cho làn da đến 9 tiếng, da giảm bóng nhờn đến 80%. Sản phẩm dạng phun sương mịn, thẩm thấu nhanh. Phù hợp cho da dầu, da nhạy cảm và dễ kích ứng với ánh nắng.",
        price: 350000,
        stock: 100,
        images: [
          "https://cdn.nhathuoclongchau.com.vn/unsafe/768x0/filters:quality(90)/https://cms-prod.s3-sgn09.fptcloud.com/00014218_larocheposay_xit_chong_nang_75ml_m9165700_6225_5c91_large_f9fbc228ca.jpg",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/768x0/filters:quality(90)/https://cms-prod.s3-sgn09.fptcloud.com/00014218_larocheposay_xit_chong_nang_75ml_m9165700_5944_5b18_large_4d3f304650.JPG",
          "https://cdn.nhathuoclongchau.com.vn/unsafe/768x0/filters:quality(90)/https://cms-prod.s3-sgn09.fptcloud.com/00014218_larocheposay_xit_chong_nang_75ml_m9165700_7866_5c91_large_01c1aa096b.png",
        ],
        category: fragance._id, // Có thể điều chỉnh nếu không phù hợp, nhưng tạm dùng
        brand: LaRochePosay._id,
        soldCount: Math.floor(Math.random() * 100),
        viewCount: Math.floor(Math.random() * 500),
        discountPercentage: Math.floor(Math.random() * 20),
      },
      {
        name: "CICAPLAST LEVRES NUÔI DƯỠNG, BẢO VỆ VÀ PHỤC HỒI MÔI KHÔ",
        description: "Dưỡng môi chống nứt nẻ",
        price: 250000,
        stock: 120,
        images: [
          "https://www.larocheposay.vn/-/media/project/loreal/brand-sites/lrp/apac/vn/products/cicaplast/levres-barrier-repairing/damaged/la-roche-posay-productpage-damaged-cicaplast-levres-barrier-repairing-30106659-front.png",
          "https://www.larocheposay.vn/-/media/project/loreal/brand-sites/lrp/apac/vn/products/cicaplast/levres-barrier-repairing/damaged/la-roche-posay-productpage-damaged-cicaplast-levres-barrier-repairing-30106659-back.jpg",
          "https://www.larocheposay.vn/-/media/project/loreal/brand-sites/lrp/apac/vn/products/cicaplast/levres-barrier-repairing/damaged/la-roche-posay-productpage-damaged-cicaplast-levres-barrier-repairing-30106659.jpg",
        ],
        category: lips._id,
        brand: LaRochePosay._id,
        soldCount: Math.floor(Math.random() * 100),
        viewCount: Math.floor(Math.random() * 500),
        discountPercentage: Math.floor(Math.random() * 20),
      },

      // Sản phẩm cho Lancome
      {
        name: "Serum chăm sóc tóc gãy rụng Lancome Genesis Anti Chute Fortifiant 90ml",
        description: "Serum dưỡng da đầu, chống rụng tóc",
        price: 1800000,
        stock: 40,
        images: [
          "https://parisvietnam.vn/wp-content/uploads/2022/05/Serum-ch%C4%83m-s%C3%B3c-t%C3%B3c-g%C3%A3y-r%E1%BB%A5ng-K%C3%A9rastase-Genesis-Anti-Chute-Fortifiant-90ml.jpg",
        ],
        category: face._id, // Có thể là chăm sóc tóc, nhưng dùng face tạm
        brand: Lancome._id,
        soldCount: Math.floor(Math.random() * 100),
        viewCount: Math.floor(Math.random() * 500),
        discountPercentage: Math.floor(Math.random() * 20),
      },
      {
        name: "Face Idole FINECOVER CUSHION N10",
        description: "Phấn phủ trang điểm tự nhiên",
        price: 1300000,
        stock: 50,
        images: [
          "https://www.lancome.vn/dw/image/v2/BFZM_PRD/on/demandware.static/-/Sites-lancome-ng-master-catalog/default/dw68f51b44/images/PACKSHOTS/MAKEUP/face/01181-LAC/01181-LAC-4936968877483-IMAGE1.jpg?sw=1080&sh=1080&sm=cut&sfrm=jpg&q=70",
          "https://www.lancome.vn/dw/image/v2/BFZM_PRD/on/demandware.static/-/Sites-lancome-ng-master-catalog/default/dw300ef1ab/images/PACKSHOTS/MAKEUP/face/01181-LAC/01181-LAC-IMAGE2.jpg?sw=1080&sh=1080&sm=cut&sfrm=jpg&q=70",
          "https://www.lancome.vn/dw/image/v2/BFZM_PRD/on/demandware.static/-/Sites-lancome-ng-master-catalog/default/dw6fe8a0a6/images/PACKSHOTS/MAKEUP/face/01181-LAC/01181-LAC-IMAGE6.jpg?sw=1080&sh=1080&sm=cut&sfrm=jpg&q=70",
        ],
        category: makeup._id,
        brand: Lancome._id,
        soldCount: Math.floor(Math.random() * 100),
        viewCount: Math.floor(Math.random() * 500),
        discountPercentage: Math.floor(Math.random() * 20),
      },
      {
        name: "DƯỠNG CHẤT CHỐNG LÃO HÓA & LÀM SÁNG DA ABSOLUE WHITE AURA",
        description: "Dầu dưỡng cơ thể bóng mịn",
        price: 950000,
        stock: 60,
        images: [
          "https://www.lancome.vn/dw/image/v2/BFZM_PRD/on/demandware.static/-/Sites-lancome-ng-master-catalog/vi_VN/dw070e8025/images/pdp/3614272284579/absolue-white-aura-etui-30ml-01-compo-3614272284579.jpg?sw=1080&sh=1080&sm=cut&sfrm=jpg&q=70",
          "https://www.lancome.vn/dw/image/v2/BFZM_PRD/on/demandware.static/-/Sites-lancome-ng-master-catalog/vi_VN/dwa3dea2d1/images/pdp/TH-LAN-FG-0028/THUMBNAIL%202.jpg?sw=1080&sh=1080&sm=cut&sfrm=jpg&q=70",
        ],
        category: body._id,
        brand: Lancome._id,
        soldCount: Math.floor(Math.random() * 100),
        viewCount: Math.floor(Math.random() * 500),
        discountPercentage: Math.floor(Math.random() * 20),
      },
      {
        name: "NƯỚC HOA LAVIE EST BELLE 75ML",
        description: "Nước hoa nam tính, tươi mát",
        price: 2200000,
        stock: 30,
        images: [
          "https://www.lancome.vn/dw/image/v2/BFZM_PRD/on/demandware.static/-/Sites-lancome-ng-master-catalog/vi_VN/dw4e689069/images/Root_Perfume/00027-LAC/La-Vie-Est-Belle-edp-75ML-3605532612836.jpg?sw=1080&sh=1080&sm=cut&sfrm=jpg&q=70",
          "https://www.lancome.vn/dw/image/v2/BFZM_PRD/on/demandware.static/-/Sites-lancome-ng-master-catalog/vi_VN/dw914eaee8/images/pdp/00027-LAC/20220726_lac-dmi-lveb_edp-alt3_v1.jpg?sw=1080&sh=1080&sm=cut&sfrm=jpg&q=70",
          "https://www.lancome.vn/dw/image/v2/BFZM_PRD/on/demandware.static/-/Sites-lancome-ng-master-catalog/default/dwa8e7fd72/images/PACKSHOTS/FRAGRANCE/LVEB/00027-LAC-La-Vie-est-Belle-Eau-de-Parfum/Lancome-LVEB-La-Vie-est-Belle-Eau-de-Parfum-75_ml-000-3605532612836-alt1.jpg?sw=1080&sh=1080&sm=cut&sfrm=jpg&q=70",
        ],
        category: fragance._id,
        brand: Lancome._id,
        soldCount: Math.floor(Math.random() * 100),
        viewCount: Math.floor(Math.random() * 500),
        discountPercentage: Math.floor(Math.random() * 20),
      },
      {
        name: "SERUM TƯƠI 3 LÕI RÉNERGIE H.C.F TRIPLE 50ML",
        description: "Chống lão hóa, làm đầy nếp nhăn",
        price: 450000,
        stock: 80,
        images: [
          "https://www.lancome.vn/dw/image/v2/BFZM_PRD/on/demandware.static/-/Sites-lancome-ng-master-catalog/vi_VN/dw8ec28045/images/new-packshot/renergie-triple-serum-50ml-3614272860377-anti-aging-serum-lancome-skincare.jpg?sw=1080&sh=1080&sm=cut&sfrm=jpg&q=70",
          "https://www.lancome.vn/dw/image/v2/BFZM_PRD/on/demandware.static/-/Sites-lancome-ng-master-catalog/vi_VN/dwd40c9a04/images/pdp/00564-LAC/renergie-triple-serum-anti-aging-concentrate-ingredients.jpg?sw=1080&sh=1080&sm=cut&sfrm=jpg&q=70",
          "https://www.lancome.vn/dw/image/v2/BFZM_PRD/on/demandware.static/-/Sites-lancome-ng-master-catalog/vi_VN/dwb2079933/images/Serums/00564-LAC/00564-LAC-3614273571258-50_ml-IMAGE4.jpg?sw=1080&sh=1080&sm=cut&sfrm=jpg&q=70",
        ],
        category: lips._id,
        brand: Lancome._id,
        soldCount: Math.floor(Math.random() * 100),
        viewCount: Math.floor(Math.random() * 500),
        discountPercentage: Math.floor(Math.random() * 20),
      },

      // Sản phẩm cho Innisfree
      {
        name: "[COOL MINT CHOCOLATE] Siêu mặt nạ đất sét tro núi lửa phiên bản socola bạc hà INNISFREE Super Volcanic Pore Clay Mask 100mL",
        description:
          "Mặt nạ đất sét lấy cảm hứng từ sô-cô-la bạc hà, chứa tro núi lửa và AHA, giúp làm sạch lỗ chân lông và mang lại cảm giác mát lạnh sảng khoái.",
        price: 300000,
        stock: 100,
        images: [
          "https://www.innisfree.vn/static/upload/product/product/702_ID0101_2.png",
          "https://www.innisfree.vn/static/upload/product/product/702_ID0101_3.png",
          "https://www.innisfree.vn/static/upload/product/product/702_ID0101_4.png",
        ],
        category: face._id,
        brand: Innisfree._id,
        soldCount: Math.floor(Math.random() * 100),
        viewCount: Math.floor(Math.random() * 500),
        discountPercentage: Math.floor(Math.random() * 20),
      },
      {
        name: "Phấn phủ dạng nén làm mờ lỗ chân lông innisfree Pore Blur Pact 12.5 g",
        description:
          "Phấn phủ dạng nén innisfree Pore Blur Pact che phủ lỗ chân lông hoàn hảo, cho lớp nền mịn màng, an toàn cho cả làn da mụn.",
        price: 400000,
        stock: 70,
        images: [
          "https://www.innisfree.vn/static/upload/product/product/252_ID0101_2.png",
          "https://www.innisfree.vn/static/upload/product/product/252_ID0101_3.png",
          "https://www.innisfree.vn/static/upload/product/product/252_ID0101_4.png",
        ],
        category: makeup._id,
        brand: Innisfree._id,
        soldCount: Math.floor(Math.random() * 100),
        viewCount: Math.floor(Math.random() * 500),
        discountPercentage: Math.floor(Math.random() * 20),
      },
      {
        name: "Travel Kit Set - Bộ sản phẩm dưỡng da 3 món -Sữa rửa mặt Bija 20g, Retinol 10ml, Kem dưỡng bija 20ml",
        description:
          "Travel Kit Set - Bộ sản phẩm dưỡng da 3 món -Sữa rửa mặt Bija 20g, Retinol 10ml, Kem dưỡng bija 20ml",
        price: 200000,
        stock: 150,
        images: [
          "https://www.innisfree.vn/static/upload/product/product/687_ID0101_1.png",
          "https://www.innisfree.vn/static/upload/product/product/687_ID0101_2.png",
          "https://www.innisfree.vn/static/upload/product/product/687_ID0101_3.png",
          "https://www.innisfree.vn/static/upload/product/product/687_ID0101_4.png",
        ],
        category: body._id,
        brand: Innisfree._id,
        soldCount: Math.floor(Math.random() * 100),
        viewCount: Math.floor(Math.random() * 500),
        discountPercentage: Math.floor(Math.random() * 20),
      },
      {
        name: "Nước dưỡng da từ hoa lan Innisfree Jeju Orchid Skin 170ml",
        description:
          "Nước dưỡng da giúp dưỡng da khỏe, săn chắc, mềm mại và làm sáng da Innisfree Jeju Orchid Skin Bước đầu tiên trong quá trình chăm sóc da để cung cấp độ ẩm cho da, giúp các bước dưỡng da sau được thẩm thấu tốt hơn Kết cấu tinh chất ẩm mịn Với hoạt chất Orchidelixir 2.0™ có trong hoa lan- loài hoa có sức sống mãnh liệt nở rộ ngay cả trong thời tiết lạnh giá, khắc nghiệt để cung cấp dưỡng chất giúp cải thiện các vấn đề về lão hóa da. Tinh chất dưỡng ẩm chứa Hyaluronic Acid từ đậu xanh Jeju dưỡng ẩm và tăng độ đàn hồi, đem lại làn da tràn đầy sức sống Da căng bóng nhờ dưỡng ẩm sâu Công nghệ mạng lưới Gel giúp tinh chất thấm sâu và bám chặt vào da, tạo nên làn da mịn màng và căng bóng.",
        price: 500000,
        stock: 90,
        images: [
          "https://www.innisfree.vn/static/upload/product/product/665_ID0101_2.png",
        ],
        category: body._id,
        brand: Innisfree._id,
        soldCount: Math.floor(Math.random() * 100),
        viewCount: Math.floor(Math.random() * 500),
        discountPercentage: Math.floor(Math.random() * 20),
      },
      {
        name: "Son lì dạng thỏi mỏng nhẹ INNISFREE Airy Matte Lipstick 3.5g",
        description:
          "Son thỏi dạng lì Airy Matte Lipstick với kết cấu mỏng nhẹ như không, đem lại trải nghiệm lì mịn trên môi. Son lì dạng thỏi với 8 màu son MLBB thời thượng tạo hiệu ứng môi căng mướt và bừng sức sống, mang lại sự tự tin rạng rỡ mỗi ngày.",
        price: 350000,
        stock: 110,
        images: [
          "https://www.innisfree.vn/static/upload/product/product/608_ID0101_2.jpg",
          "https://www.innisfree.vn/static/upload/product/product/608_ID0101_3.jpg",
          "https://www.innisfree.vn/static/upload/product/product/608_ID0101_5.jpg",
        ],
        category: lips._id,
        brand: Innisfree._id,
        soldCount: Math.floor(Math.random() * 100),
        viewCount: Math.floor(Math.random() * 500),
        discountPercentage: Math.floor(Math.random() * 20),
      },

      {
        name: "Kem dưỡng mắt Dior Capture",
        description: "Kem dưỡng mắt - Chống lão hóa - Nếp nhăn, Độ săn chắc, Dấu hiệu mệt mỏi",
        price: 1400000,
        stock: 45,
        images: ["https://www.dior.com/dw/image/v2/BGXS_PRD/on/demandware.static/-/Sites-master_dior/default/dwe2f2ff70/Y0000145/Y0000145_E000000445_E01_RHC.jpg?sw=1024",
          "https://www.dior.com/dw/image/v2/BGXS_PRD/on/demandware.static/-/Sites-master_dior/default/dw8525d4e5/Y0000145/Y0000145_E000000445_E02_RHC.jpg?sw=1024",
          "https://www.dior.com/dw/image/v2/BGXS_PRD/on/demandware.static/-/Sites-master_dior/default/dw304e0960/Y0000145/Y0000145_E000000445_E03_RHC.jpg?sw=1024"
        ],
        category: face._id,
        brand: Dior._id,
        soldCount: Math.floor(Math.random() * 100),
        viewCount: Math.floor(Math.random() * 500),
        discountPercentage: Math.floor(Math.random() * 20),
      },
      {
        name: "Dior Backstage Rosy Glow Stick 001 Pink",
        description: "Phấn má hồng tự nhiên, lâu trôi",
        price: 1000000,
        stock: 55,
        images: ["https://www.dior.com/dw/image/v2/BGXS_PRD/on/demandware.static/-/Sites-master_dior/default/dw3a6216d6/Y0000048/Y0000048_E000000453_E01_RHC.jpg?sw=1024",
          "https://www.dior.com/dw/image/v2/BGXS_PRD/on/demandware.static/-/Sites-master_dior/default/dwccd5a345/Y0000048/Y0000048_E000000453_E02_RHC.jpg?sw=1024",
          "https://www.dior.com/dw/image/v2/BGXS_PRD/on/demandware.static/-/Sites-master_dior/default/dw886238e2/Y0000048/Y0000048_E000000453_E03_RHC.jpg?sw=1024"
        ],
        category: makeup._id,
        brand: Dior._id,
        soldCount: Math.floor(Math.random() * 100),
        viewCount: Math.floor(Math.random() * 500),
        discountPercentage: Math.floor(Math.random() * 20),
      },
      {
        name: "Miss Dior",
        description: "Kem dưỡng tay chống lão hóa",
        price: 650000,
        stock: 65,
        images: ["https://www.dior.com/dw/image/v2/BGXS_PRD/on/demandware.static/-/Sites-master_dior/default/dwb5129570/Y0996058/Y0996058_C099600058_E01_RHC.jpg?sw=1024",
          "https://www.dior.com/dw/image/v2/BGXS_PRD/on/demandware.static/-/Sites-master_dior/default/dw6f3aabf9/Y0996058/Y0996058_C099600058_E02_GHC.jpg?sw=1024"
        ],
        category: body._id,
        brand: Dior._id,
        soldCount: Math.floor(Math.random() * 100),
        viewCount: Math.floor(Math.random() * 500),
        discountPercentage: Math.floor(Math.random() * 20),
      },

      // Sản phẩm thêm cho Chanel
      {
        name: "LE LIFT LOTION",
        description: "NƯỚC CÂN BẰNG GIÚP DA MỊN MÀNG – SĂN CHẮC – CĂNG MỊN",
        price: 850000,
        stock: 60,
        images: ["https://www.chanel.com/images//t_one//w_0.63,h_0.63,c_crop/q_auto:good,f_autoplus,fl_lossy,dpr_1.1/w_1020/le-lift-lotion-smooths-firms-plumps-5fl-oz--packshot-default-141690-8831687327774.jpg",
          "https://www.chanel.com/images//t_one/t_fnbedito//q_auto:good,f_auto,fl_lossy,dpr_1.1/w_1020/le-lift-lotion-smooths-firms-plumps-5fl-oz--packshot-alternative-v1-141690-8850354995230.jpg",
          "https://www.chanel.com/images//t_one///q_auto:good,f_auto,fl_lossy,dpr_1.1/w_1020/le-lift-lotion-smooths-firms-plumps-5fl-oz--basic-texture-141690-8833605074974.jpg"
        ],
        category: face._id,
        brand: Chanel._id,
        soldCount: Math.floor(Math.random() * 100),
        viewCount: Math.floor(Math.random() * 500),
        discountPercentage: Math.floor(Math.random() * 20),
      },
      {
        name: "LE LINER DE CHANEL 514 - ULTRA BRUN",
        description: "BÚT KẺ MẮT NƯỚC LÂU TRÔI",
        price: 950000,
        stock: 50,
        images: ["https://www.chanel.com/images//t_one//w_0.43,h_0.43,c_crop/q_auto:good,f_autoplus,fl_lossy,dpr_1.1/w_1020/le-liner-de-chanel-liquid-eyeliner-high-precision-longwear-514-ultra-brun-0-08fl-oz--packshot-default-187514-9569319747614.jpg",
          "https://www.chanel.com/images//t_one/t_fnbedito//q_auto:good,f_auto,fl_lossy,dpr_1.1/w_1020/le-liner-de-chanel-liquid-eyeliner-high-precision-longwear-514-ultra-brun-0-08fl-oz--packshot-alternative-v1-187514-9561903202334.jpg",
          "https://www.chanel.com/images//t_one///q_auto:good,f_auto,fl_lossy,dpr_1.1/w_1020/le-liner-de-chanel-liquid-eyeliner-high-precision-longwear-514-ultra-brun-0-08fl-oz--basic-texture-187514-9561652723742.jpg"
        ],
        category: makeup._id,
        brand: Chanel._id,
        soldCount: Math.floor(Math.random() * 100),
        viewCount: Math.floor(Math.random() * 500),
        discountPercentage: Math.floor(Math.random() * 20),
      },
      {
        name: "N°5",
        description: "Xịt khử mùi hương sang trọng",
        price: 550000,
        stock: 70,
        images: ["https://www.chanel.com/images//t_one//w_0.58,h_0.58,c_crop/q_auto:good,f_autoplus,fl_lossy,dpr_1.1/w_1020/n-5-the-deodorant-3-4fl-oz--packshot-default-105738-8835353346078.jpg",
          "https://www.chanel.com/images//t_one/t_fnbedito//q_auto:good,f_auto,fl_lossy,dpr_1.1/w_1020/n-5-the-deodorant-3-4fl-oz--packshot-alternative-v1-105738-8850353455134.jpg"
        ],
        category: body._id,
        brand: Chanel._id,
        soldCount: Math.floor(Math.random() * 100),
        viewCount: Math.floor(Math.random() * 500),
        discountPercentage: Math.floor(Math.random() * 20),
      },

      // Sản phẩm thêm cho LaRochePosay
      {
        name: "Kem dưỡng ẩm phục hồi da mặt Toleriane Double Repair",
        description: "Kem dưỡng ẩm Toleriane Double Repair Face Moisturizer được bào chế với các thành phần được bác sĩ da liễu khuyên dùng, bao gồm ceramide-3, niacinamide, glycerin và nước khoáng Prebiotic La Roche-Posay. Tác động kép giúp phục hồi hàng rào bảo vệ tự nhiên của da sau 1 giờ và cung cấp độ ẩm lên đến 48 giờ. Kết cấu kem mỏng nhẹ, dễ dàng thẩm thấu vào da, mang lại cảm giác dễ chịu tức thì. Phù hợp với mọi loại da, kể cả da nhạy cảm. Kem dưỡng ẩm này giúp phục hồi làn da khỏe mạnh.",
        price: 450000,
        stock: 85,
        images: ["https://www.laroche-posay.us/dw/image/v2/AANG_PRD/on/demandware.static/-/Sites-acd-laroche-posay-master-catalog/default/dw92684c0e/img/3337875545792/1_Toleriane_DblRepairMoisturizer_Tube.jpg?sw=1440&sh=1440&sm=cut&sfrm=jpg&q=70",
          "https://www.laroche-posay.us/dw/image/v2/AANG_PRD/on/demandware.static/-/Sites-acd-laroche-posay-master-catalog/default/dwfd6d5bee/img/tolerianedoublerepair/02_La-Roche-Posay_TolerianeHydrating-Cleanser_refill_ingredient_1500x1500-REV.jpg?sw=1440&sh=1440&sm=cut&sfrm=jpg&q=70",
          "https://www.laroche-posay.us/dw/image/v2/AANG_PRD/on/demandware.static/-/Sites-acd-laroche-posay-master-catalog/default/dwe53c4dc4/img/tolerianedoublerepair/4-LaRochePosay-Product-Toleriane-Toleriane-Double-repair-face-moisturizer-75ml-3337875839969-ATFIngredients-REV-1500x1500%20(7).jpg?sw=1440&sh=1440&sm=cut&sfrm=jpg&q=70"
        ],
        category: face._id,
        brand: LaRochePosay._id,
        soldCount: Math.floor(Math.random() * 100),
        viewCount: Math.floor(Math.random() * 500),
        discountPercentage: Math.floor(Math.random() * 20),
      },
      
      // Sản phẩm thêm cho Lancome
      {
        name: "KEM DƯỠNG RÉNERGIE 300-PEPTIDE 50ML",
        description: "Dầu dưỡng da mặt từ tinh chất tự nhiên",
        price: 1600000,
        stock: 45,
        images: ["https://www.lancome.vn/dw/image/v2/BFZM_PRD/on/demandware.static/-/Sites-lancome-ng-master-catalog/vi_VN/dwfad3f2fe/images/new-packshot/renergie-h.p.n.-300-peptide-cream-50ml-3614273924061-lancome-anti-aging-serum-skincare.jpg?sw=1080&sh=1080&sm=cut&sfrm=jpg&q=70",
          "https://www.lancome.vn/dw/image/v2/BFZM_PRD/on/demandware.static/-/Sites-lancome-ng-master-catalog/vi_VN/dw930c9861/images/pdp/00769-LAC/00769-LAC-main-alt-02.jpg?sw=1080&sh=1080&sm=cut&sfrm=jpg&q=70",
          "https://www.lancome.vn/dw/image/v2/BFZM_PRD/on/demandware.static/-/Sites-lancome-ng-master-catalog/vi_VN/dw8997baa0/images/pdp/00769-LAC/00769-LAC-main-alt-04.jpg?sw=1080&sh=1080&sm=cut&sfrm=jpg&q=70",
          "https://www.lancome.vn/dw/image/v2/BFZM_PRD/on/demandware.static/-/Sites-lancome-ng-master-catalog/vi_VN/dw17dbdaad/images/pdp/00769-LAC/00769-LAC-main-alt-06.jpg?sw=1080&sh=1080&sm=cut&sfrm=jpg&q=70"
        ],
        category: face._id,
        brand: Lancome._id,
        soldCount: Math.floor(Math.random() * 100),
        viewCount: Math.floor(Math.random() * 500),
        discountPercentage: Math.floor(Math.random() * 20),
      },
      {
        name: "PHẤN MÁ HỒNG BLUSH SUBTL 041 Figue Espiegle",
        description: "Phấn bắt sáng cho gương mặt rạng rỡ",
        price: 1200000,
        stock: 55,
        images: ["https://www.lancome.vn/dw/image/v2/BFZM_PRD/on/demandware.static/-/Sites-lancome-ng-master-catalog/default/dw07f1580d/images/PACKSHOTS/MAKEUP/face/00019-LAC-Blush-Subtil/Lancome-Blushes-And-Bronzer-Blush-Subtil-041_Figue_Espiegle-000-3605971967092.jpg?sw=678&sh=678&sm=cut&sfrm=jpg&q=70",
          "https://www.lancome.vn/dw/image/v2/BFZM_PRD/on/demandware.static/-/Sites-lancome-ng-master-catalog/default/dw0bc55462/images/PACKSHOTS/MAKEUP/face/00019-LAC-Blush-Subtil/Lancome-Blushes-And-Bronzer-Blush-Subtil-041_Figue_Espiegle-000-3605971967092-alt3.jpg?sw=678&sh=678&sm=cut&sfrm=jpg&q=70",
          "https://www.lancome.vn/dw/image/v2/BFZM_PRD/on/demandware.static/-/Sites-lancome-ng-master-catalog/default/dw347f7acb/images/PACKSHOTS/MAKEUP/face/00019-LAC-Blush-Subtil/Lancome-Blushes-And-Bronzer-Blush-Subtil-041_Figue_Espiegle-000-3605971967092-alt1.jpg?sw=678&sh=678&sm=cut&sfrm=jpg&q=70"
        ],
        category: makeup._id,
        brand: Lancome._id,
        soldCount: Math.floor(Math.random() * 100),
        viewCount: Math.floor(Math.random() * 500),
        discountPercentage: Math.floor(Math.random() * 20),
      },
      {
        name: "Kem Chống Nắng Có Màu UV Expert BB 2 SPF50",
        description: "Kem chống nắng cho cơ thể",
        price: 800000,
        stock: 65,
        images: ["https://www.lancome.vn/dw/image/v2/BFZM_PRD/on/demandware.static/-/Sites-lancome-ng-master-catalog/default/dw43e878a4/images/Skincare/TH-LAN-FG-0004/UVEX_BB2_TUBE_4935421669009.jpg?sw=1080&sh=1080&sm=cut&sfrm=jpg&q=70",
          "https://www.lancome.vn/dw/image/v2/BFZM_PRD/on/demandware.static/-/Sites-lancome-ng-master-catalog/default/dwfbd4dc4a/images/Skincare/TH-LAN-FG-0004/uv-expert-complete-bb-cream-makeup-2.jpg?sw=1080&sh=1080&sm=cut&sfrm=jpg&q=70"
        ],
        category: body._id,
        brand: Lancome._id,
        soldCount: Math.floor(Math.random() * 100),
        viewCount: Math.floor(Math.random() * 500),
        discountPercentage: Math.floor(Math.random() * 20),
      },

      // Sản phẩm thêm cho Innisfree
      {
        name: "Sữa rửa mặt se khít lỗ chân lông INNISFREE Volcanic Pore BHA Cleansing Foam 250 g",
        description: "Sữa rửa mặt se khít lỗ chân lông INNISFREE Volcanic Pore BHA Cleansing Foam làm sạch sâu, se khít lỗ chân lông và giúp da thư giãn.",
        price: 250000,
        stock: 110,
        images: ["https://www.innisfree.vn/static/upload/product/product/627_ID0101_2.png",
          "https://www.innisfree.vn/static/upload/product/product/627_ID0101_3.jpg",
          "https://www.innisfree.vn/static/upload/product/product/627_ID0101_4.jpg"
        ],
        category: face._id,
        brand: Innisfree._id,
        soldCount: Math.floor(Math.random() * 100),
        viewCount: Math.floor(Math.random() * 500),
        discountPercentage: Math.floor(Math.random() * 20),
      },
      {
        name: "Bút kẻ mắt nước lâu trôi INNISFREE Powerproof Brush Liner 0.6g",
        description: "Kẻ mắt INNISFREE Powerproof Brush Liner với thiết kế đầu cọ thanh mảnh tạo nét vẽ mềm mại, sắc nét, đặc biệt hạn chế trôi khi gặp nước và dầu thừa trên da.",
        price: 350000,
        stock: 80,
        images: ["https://www.innisfree.vn/static/upload/product/product/205_ID0101_2.jpg",
          "https://www.innisfree.vn/static/upload/product/product/205_ID0101_3.jpg",
          "https://www.innisfree.vn/static/upload/product/product/205_ID0101_4.jpg"
        ],
        category: makeup._id,
        brand: Innisfree._id,
        soldCount: Math.floor(Math.random() * 100),
        viewCount: Math.floor(Math.random() * 500),
        discountPercentage: Math.floor(Math.random() * 20),
      },
      {
        name: "Xịt thơm toàn thân innisfree Perfumed Body & Hair Mist 100 mL",
        description: "Xịt thơm cơ thể hương hoa nhẹ nhàng",
        price: 300000,
        stock: 100,
        images: ["https://www.innisfree.vn/static/upload/product/product/170_ID0101_2.jpg",
          "https://www.innisfree.vn/static/upload/product/product/170_ID0101_3.jpg",
          
        ],
        category: body._id,
        brand: Innisfree._id,
        soldCount: Math.floor(Math.random() * 100),
        viewCount: Math.floor(Math.random() * 500),
        discountPercentage: Math.floor(Math.random() * 20),
      },
    ];

    await Product.insertMany(products);
    console.log("✅ Seed dữ liệu sản phẩm và thương hiệu thành công!");
    console.log(
      `📦 Đã tạo ${products.length} sản phẩm từ ${brands.length} thương hiệu`
    );

    process.exit();
  } catch (err) {
    console.error("❌ Lỗi seed dữ liệu:", err);
    process.exit(1);
  }
}

seed();
