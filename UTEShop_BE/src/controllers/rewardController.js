// controllers/rewardController.js
import User from "../models/user.js";
import Voucher from "../models/voucher.js";
import UserVoucher from "../models/userVoucher.js";
import PointTransaction from "../models/PointTransaction.js"; // Import model lịch sử điểm

export const claimReviewReward = async (req, res) => {
  const userId = req.user.id;
  // Frontend sẽ gửi lên: { rewardType: 'VOUCHER', voucherCode: '...' } hoặc { rewardType: 'POINTS', value: 100 }
  const { rewardType, voucherCode, value } = req.body;

  console.log("🎯 claimReviewReward called with full details:");
  console.log("   - userId:", userId);
  console.log("   - rewardType:", rewardType);
  console.log("   - voucherCode:", voucherCode);
  console.log("   - value:", value);
  console.log("   - req.body:", JSON.stringify(req.body, null, 2));
  console.log("   - req.user:", req.user?.email || 'No email');

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (rewardType === "VOUCHER") {
      if (!voucherCode)
        return res.status(400).json({ message: "Mã voucher không hợp lệ." });

      // Tìm voucher
      const voucher = await Voucher.findOne({ code: voucherCode });
      console.log('🔍 Found voucher for claim:', voucher ? voucher.code : 'Not found');

      if (!voucher) {
        return res.status(404).json({ message: "Voucher không tồn tại." });
      }

      console.log('📊 Voucher details:', {
        code: voucher.code,
        claimsCount: voucher.claimsCount || 0,
        maxIssued: voucher.maxIssued,
        isActive: voucher.isActive,
        rewardType: voucher.rewardType
      });

      // Kiểm tra voucher có còn khả dụng để phát hành không
      const currentClaims = voucher.claimsCount || 0;
      if (currentClaims >= voucher.maxIssued) {
        return res.status(400).json({
          message: `Voucher ${voucherCode} đã hết lượt phát hành.`
        });
      }

      // KIỂM TRA SỐ LẦN USER ĐÃ CLAIM VOUCHER NÀY (dùng UserVoucher collection - đáng tin cậy)
      const userClaimCount = await UserVoucher.countDocuments({
        user: userId,
        voucherCode: voucher.code
      });

      const maxAllowed = voucher.maxUsesPerUser || 1;

      console.log(`🔍 Claim validation: ${voucher.code}`);
      console.log(`   - User đã nhận (từ UserVoucher DB): ${userClaimCount}/${maxAllowed} lần`);
      console.log(`   - Có thể nhận thêm: ${userClaimCount < maxAllowed}`);

      if (userClaimCount >= maxAllowed) {
        return res.status(400).json({
          message: `Bạn đã nhận đủ ${maxAllowed} lần voucher ${voucher.code}. Không thể nhận thêm.`,
          userClaims: userClaimCount,
          maxAllowed: maxAllowed
        });
      }

      // Cập nhật voucher.usersUsed array cho tracking
      const userUsedIndex = voucher.usersUsed.findIndex(
        u => u.userId.toString() === userId
      );

      if (userUsedIndex > -1) {
        // User đã từng nhận voucher này
        voucher.usersUsed[userUsedIndex].claimCount = (voucher.usersUsed[userUsedIndex].claimCount || 0) + 1;
      } else {
        // User chưa từng nhận voucher này
        voucher.usersUsed.push({
          userId: userId,
          claimCount: 1,
          useCount: 0
        });
      }

      // 1. Tạo bản ghi UserVoucher (chi tiết)
      console.log("📝 Creating UserVoucher record...");
      let userVoucher;
      try {
        userVoucher = await UserVoucher.create({
          user: userId,
          voucher: voucher._id,
          voucherCode: voucher.code,
          source: "REVIEW"
        });
        console.log("✅ UserVoucher created successfully:", userVoucher._id);
      } catch (userVoucherError) {
        console.error("❌ Error creating UserVoucher:", userVoucherError.message);
        return res.status(500).json({
          message: "Lỗi khi lưu voucher vào tài khoản",
          error: userVoucherError.message
        });
      }

      // 2. Cập nhật User.voucherClaims (tracking nhanh)
      console.log("📈 Updating User.voucherClaims tracking...");
      try {
        const existingClaimIndex = user.voucherClaims.findIndex(
          claim => claim.voucherCode === voucher.code
        );

        if (existingClaimIndex > -1) {
          // Tăng count cho voucher đã có
          user.voucherClaims[existingClaimIndex].claimCount += 1;
          user.voucherClaims[existingClaimIndex].lastClaimed = new Date();
        } else {
          // Thêm voucher mới
          user.voucherClaims.push({
            voucherCode: voucher.code,
            value: voucher.discountValue,
            discountType: voucher.discountType,
            minOrder: voucher.minOrderAmount,
            claimCount: 1,
            lastClaimed: new Date(),
            source: "REVIEW"
          });
        }

        await user.save();
        console.log("✅ User voucherClaims updated successfully");
      } catch (trackingError) {
        console.error("⚠️  Warning: Failed to update user tracking:", trackingError.message);
        // Không return error vì UserVoucher đã lưu thành công
      }

      // Cập nhật số lần voucher được claim
      console.log(`🎯 Before claim: ${voucher.code} claimsCount=${voucher.claimsCount || 0}`);
      voucher.claimsCount = (voucher.claimsCount || 0) + 1;
      await voucher.save();
      console.log(`✅ After claim: ${voucher.code} claimsCount=${voucher.claimsCount}`);

      // Verify the update worked
      const updatedVoucher = await Voucher.findById(voucher._id);
      console.log(`🔍 Verification: ${updatedVoucher.code} claimsCount=${updatedVoucher.claimsCount}`);

      return res
        .status(200)
        .json({
          message: `Bạn đã nhận được voucher ${voucherCode}! Sử dụng ngay tại trang thanh toán.`,
          userVoucher: {
            id: userVoucher._id,
            code: voucher.code,
            claimedAt: userVoucher.claimedAt
          }
        });
    } else if (rewardType === "POINTS") {
      if (!value || value <= 0)
        return res.status(400).json({ message: "Số điểm không hợp lệ." });

      // 1. Cộng điểm vào tài khoản người dùng
      user.loyaltyPoints.balance += value;
      await user.save();

      // 2. Tạo một bản ghi lịch sử giao dịch điểm
      const transaction = new PointTransaction({
        user: userId,
        type: "EARNED",
        points: value,
        description: "Nhận điểm thưởng từ việc đánh giá sản phẩm",
      });
      await transaction.save();

      return res
        .status(200)
        .json({ message: `Bạn đã nhận được ${value} điểm tích lũy!` });
    } else {
      return res
        .status(400)
        .json({ message: "Loại phần thưởng không hợp lệ." });
    }
  } catch (error) {
    console.error("❌ ERROR in claimReviewReward:");
    console.error("   - Message:", error.message);
    console.error("   - Stack:", error.stack);
    console.error("   - Full error:", error);

    const errorMessage = error.message || "Server error";
    res.status(500).json({
      message: `Lỗi khi nhận thưởng: ${errorMessage}`,
      error: errorMessage
    });
  }
};

// @desc    Get user's vouchers
// @route   GET /user/vouchers
// @access  Private
export const getUserVouchers = async (req, res) => {
  try {
    const userId = req.user.id;

    const userVouchers = await UserVoucher.find({ user: userId })
      .populate('voucher')
      .sort({ claimedAt: -1 });

    const availableVouchers = userVouchers.filter(uv => !uv.isUsed);
    const usedVouchers = userVouchers.filter(uv => uv.isUsed);

    res.json({
      success: true,
      data: {
        available: availableVouchers,
        used: usedVouchers,
        total: userVouchers.length
      }
    });
  } catch (error) {
    console.error("Error getting user vouchers:", error);
    res.status(500).json({ message: "Server error" });
  }
};
