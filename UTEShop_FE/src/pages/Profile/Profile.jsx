import { useState, useRef } from "react";
import { useDispatch } from "react-redux";
import api from "@/api/axiosConfig";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, MapPin, Edit, Trash2, Plus, Lock, Award } from "lucide-react";
import { useEffect } from "react";
import { updateUserProfile } from "@/features/auth/authSlice";
const TIER_STYLES = {
  // Hạng Đồng
  bronze:
    "bg-orange-200 text-orange-800 border-orange-300 hover:bg-orange-200/80",
  // Hạng Bạc
  silver: "bg-slate-200 text-slate-800 border-slate-300 hover:bg-slate-200/80",
  // Hạng Vàng
  gold: "bg-amber-200 text-amber-800 border-amber-300 hover:bg-amber-200/80",
  // Hạng Bạch Kim
  platinum:
    "bg-violet-200 text-violet-800 border-violet-300 hover:bg-violet-200/80",
  // Mặc định
  default: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100/80",
};

function UserProfile() {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("personal");
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    birthDate: "",
  });
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressValue, setAddressValue] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null); // Tham chiếu đến input ẩn
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Fetch user data from API
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const [userResponse] = await Promise.all([
          api.get("/user/profile"), // Dùng instance 'api'
        ]);

        setUserInfo(userResponse.data);
      } catch (err) {
        // Interceptor cũng có thể xử lý lỗi, ví dụ nếu token hết hạn
        console.error("Lỗi khi fetch profile:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);
  useEffect(() => {
    if (userInfo) {
      let formattedBirthday = "";
      // Chỉ định dạng nếu userInfo.birthDate tồn tại
      if (userInfo.birthDate) {
        // 1. Tạo một đối tượng Date từ dữ liệu của database
        const date = new Date(userInfo.birthDate);
        // 2. Chuyển nó thành chuỗi ISO (YYYY-MM-DDTHH:mm:ss.sssZ)
        // 3. Cắt chuỗi đó để chỉ lấy phần YYYY-MM-DD
        formattedBirthday = date.toISOString().split("T")[0];
      }

      setFormData({
        name: userInfo.name || "",
        email: userInfo.email || "",
        phone: userInfo.phone || "",
        birthDate: formattedBirthday,
      });
      setAddressValue(userInfo.address || "");
    }
  }, [userInfo]); // useEffect này sẽ chạy mỗi khi `userInfo` thay đổi

  //Handle input change
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [id]: value,
    }));
  };
  //Handle update profile
  const handleUpdateProfile = async () => {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert("Email không đúng định dạng!");
      return;
    }

    // Validate phone number (10 digits starting with 0)
    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      alert("Số điện thoại phải có đúng 10 chữ số và bắt đầu bằng số 0!");
      return;
    }

    // Validate birthdate (not in future)
    if (formData.birthDate) {
      const birthDate = new Date(formData.birthDate);
      const today = new Date();
      if (birthDate > today) {
        alert("Ngày sinh không thể là ngày trong tương lai!");
        return;
      }
    }

    setIsUpdating(true); // Báo cho UI biết là đang xử lý
    try {
      const response = await api.put("/user/profile", formData);

      // Cập nhật lại state `userInfo` với dữ liệu mới nhất từ server
      setUserInfo(response.data);

      // Cập nhật Redux store với thông tin mới
      dispatch(updateUserProfile(response.data));

      // Thông báo thành công
      alert("Cập nhật thông tin thành công!");
    } catch (err) {
      console.error("Lỗi khi cập nhật profile:", err);
      // Hiển thị thông báo lỗi cho người dùng
      alert(err.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setIsUpdating(false); // Dù thành công hay thất bại, cũng dừng trạng thái "đang lưu"
    }
  };

  //Handle edit Address click
  const handleEditAddressClick = () => {
    setIsEditingAddress(true);
  };

  const handleCancelEdit = () => {
    setIsEditingAddress(false);
    // Reset lại giá trị input về giá trị gốc từ userInfo
    setAddressValue(userInfo?.address || "");
  };

  //Handle save Address
  const handleSaveAddress = async () => {
    setIsUpdating(true);

    // Payload chỉ chứa trường address
    const payload = { address: addressValue };

    try {
      const response = await api.put("/user/profile", payload);
      setUserInfo(response.data); // Cập nhật lại toàn bộ userInfo

      // Cập nhật Redux store với thông tin mới
      dispatch(updateUserProfile(response.data));

      setIsEditingAddress(false); // Quay lại chế độ hiển thị
      alert("Cập nhật địa chỉ thành công!");
    } catch (err) {
      console.error("Lỗi khi cập nhật địa chỉ:", err);
      alert("Cập nhật địa chỉ thất bại.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Khi người dùng click vào avatar
  const handleAvatarClick = () => {
    // Không cho click khi đang upload
    if (isUploadingAvatar) return;
    fileInputRef.current.click();
  };
  // Sau khi người dùng chọn file
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      return; // Người dùng bấm cancel
    }

    setIsUploadingAvatar(true); // Bắt đầu upload, báo cho UI biết

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      // Gọi API ngay lập tức
      const response = await api.post("/user/avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Cập nhật UI với dữ liệu mới từ server
      setUserInfo(response.data);

      // Cập nhật Redux store với thông tin mới
      dispatch(updateUserProfile(response.data));

      alert("Cập nhật avatar thành công!");
    } catch (err) {
      console.error("Lỗi khi upload avatar:", err);
      alert("Upload avatar thất bại. Vui lòng thử lại.");
    } finally {
      setIsUploadingAvatar(false); // Kết thúc upload
    }
  };

  const handlePasswordInputChange = (e) => {
    const { id, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [id]: value }));
  };

  const validatePassword = (password) => {
    const minLength = 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];
    if (password.length < minLength) {
      errors.push(`Mật khẩu phải có ít nhất ${minLength} ký tự`);
    }
    if (!hasUpperCase) {
      errors.push("Mật khẩu phải chứa ít nhất 1 ký tự in hoa");
    }
    if (!hasNumber) {
      errors.push("Mật khẩu phải chứa ít nhất 1 chữ số");
    }
    if (!hasSpecialChar) {
      errors.push("Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt");
    }

    return errors;
  };

  const handleChangePassword = async () => {
    // 1. Kiểm tra mật khẩu hiện tại không được để trống
    if (!passwordForm.currentPassword) {
      alert("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }

    // 2. Kiểm tra mật khẩu mới có đúng định dạng
    const passwordErrors = validatePassword(passwordForm.newPassword);
    if (passwordErrors.length > 0) {
      alert(passwordErrors.join("\n"));
      return;
    }

    // 3. Kiểm tra mật khẩu mới và xác nhận mật khẩu
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("Mật khẩu mới không khớp. Vui lòng nhập lại.");
      return;
    }

    // 4. Kiểm tra mật khẩu mới không được trùng với mật khẩu cũ
    if (passwordForm.newPassword === passwordForm.currentPassword) {
      alert("Mật khẩu mới không được trùng với mật khẩu hiện tại.");
      return;
    }

    setIsUpdatingPassword(true);

    // 2. Chỉ gửi những dữ liệu cần thiết đến backend
    const payload = {
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    };

    try {
      const response = await api.put("/user/password", payload);
      alert(response.data.message); // Hiển thị thông báo thành công từ server
      // Xóa sạch các trường input sau khi thành công
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      alert(err.response?.data?.message || "Đã có lỗi xảy ra.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl bg-gray-50/30">
      {/* Header with gradient background */}
      <div className="mb-8 bg-gradient-to-r from-white via-gray-50 to-white p-6 rounded-lg shadow-sm backdrop-blur-sm">
        <h1
          className="text-4xl font-bold bg-gradient-to-r from-violet-700 to-indigo-700 bg-clip-text text-transparent mb-2"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          Trang cá nhân
        </h1>
        {/* <p className="text-muted-foreground text-lg italic">
          S'habiller est un mode de vie.
        </p> */}
      </div>

      {/* Profile Overview Card */}
      <Card className="mb-8 bg-gradient-to-b from-white to-gray-50/50 border border-gray-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            {/* === PHẦN AVATAR ĐƠN GIẢN HÓA === */}
            <div className="relative group">
              <Avatar
                className={`h-24 w-24 ring-2 ring-offset-2 ring-violet-400 transition-all duration-300 ${isUploadingAvatar
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer hover:ring-indigo-500 hover:scale-105"
                  }`}
                onClick={handleAvatarClick}
              >
                <AvatarImage
                  // Chỉ cần hiển thị avatar từ DB hoặc ảnh mặc định
                  src={userInfo?.avatarUrl || "/placeholder.svg"}
                  alt={userInfo?.name}
                />
                <AvatarFallback className="text-lg">
                  {userInfo?.name?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* (Tùy chọn) Thêm một spinner khi đang upload */}
              {isUploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-25 rounded-full">
                  <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                hidden
                accept="image/png, image/jpeg"
                onChange={handleFileChange}
                // Reset value để người dùng có thể chọn lại cùng 1 file
                onClick={(e) => (e.target.value = null)}
              />
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-foreground">
                {userInfo?.name}
              </h2>
              <p className="text-muted-foreground">{userInfo?.email}</p>
              <div className="flex items-center gap-3 mt-2">
                <Badge
                  className={`${TIER_STYLES[userInfo?.loyaltyPoints.tier.toLowerCase()] ||
                    TIER_STYLES.default
                    } flex items-center gap-1.5`}
                >
                  <Award className="w-3.5 h-3.5" />
                  {userInfo?.loyaltyPoints.tier}
                </Badge>
                <span className="text-sm font-medium text-foreground">
                  {userInfo?.loyaltyPoints.balance} điểm
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3 p-1 bg-gray-50 rounded-xl">
          <TabsTrigger
            value="personal"
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-violet-700 data-[state=active]:shadow-md transition-all duration-300"
          >
            <User className="h-4 w-4" />
            Thông Tin Cá Nhân
          </TabsTrigger>
          <TabsTrigger
            value="password"
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-violet-700 data-[state=active]:shadow-md transition-all duration-300"
          >
            <Lock className="h-4 w-4" />
            Mật Khẩu
          </TabsTrigger>
          <TabsTrigger
            value="addresses"
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-violet-700 data-[state=active]:shadow-md transition-all duration-300"
          >
            <MapPin className="h-4 w-4" />
            Địa Chỉ
          </TabsTrigger>
        </TabsList>

        {/* Personal Info Tab */}
        <TabsContent value="personal">
          <Card className="border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-b from-white to-gray-50/50">
            <CardHeader className="bg-gradient-to-r from-gray-50/80 to-white border-b border-gray-100">
              <CardTitle className="text-xl text-gray-800">
                Thông Tin Cá Nhân
              </CardTitle>
              <CardDescription className="text-gray-600">
                Thay đổi thông tin cá nhân của bạn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Họ Tên</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                    placeholder="example@domain.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Số Điện Thoại</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => {
                      // Chỉ cho phép nhập số
                      const value = e.target.value.replace(/\D/g, "");
                      // Giới hạn 10 số
                      if (value.length <= 10) {
                        setFormData((prev) => ({ ...prev, phone: value }));
                      }
                    }}
                    placeholder="Nhập số điện thoại 10 chữ số"
                    maxLength={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Ngày Sinh Nhật</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    max={new Date().toISOString().split("T")[0]}
                    onChange={(e) =>
                      setFormData({ ...formData, birthDate: e.target.value })
                    }
                  />
                </div>
              </div>
              <Separator />
              <div className="flex gap-2">
                <Button
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white transition-all duration-300 transform hover:scale-105"
                  disabled={isUpdating}
                  onClick={handleUpdateProfile}
                >
                  {isUpdating ? "Đang lưu..." : "Lưu Thay Đổi"}
                </Button>
                <Button
                  variant="outline"
                  className="border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-300"
                >
                  Hủy
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card className="border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-b from-white to-gray-50/50">
            <CardHeader className="bg-gradient-to-r from-gray-50/80 to-white border-b border-gray-100">
              <CardTitle className="text-xl text-gray-800">
                Đổi Mật Khẩu
              </CardTitle>
              <CardDescription className="text-gray-600">
                Đảm bảo tài khoản của bạn được bảo mật
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Mật Khẩu Hiện Tại</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    placeholder="Enter your current password"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Mật Khẩu Mới</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter your new password"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">
                    Nhập Lại Mật Khẩu Mới
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your new password"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordInputChange}
                  />
                </div>
              </div>
              <div className="bg-gray-50/50 p-4 rounded-lg border border-gray-100">
                <h4 className="font-medium mb-2 text-gray-700">Yêu Cầu:</h4>
                <ul className="text-sm space-y-1">
                  <li
                    className={`flex items-center gap-2 ${passwordForm.newPassword.length >= 6
                      ? "text-green-600"
                      : "text-muted-foreground"
                      }`}
                  >
                    {passwordForm.newPassword.length >= 6 ? "✓" : "•"} Ít nhất 6
                    ký tự
                  </li>
                  <li
                    className={`flex items-center gap-2 ${/[A-Z]/.test(passwordForm.newPassword)
                      ? "text-green-600"
                      : "text-muted-foreground"
                      }`}
                  >
                    {/[A-Z]/.test(passwordForm.newPassword) ? "✓" : "•"} Ít nhất
                    1 ký tự in hoa
                  </li>
                  <li
                    className={`flex items-center gap-2 ${/\d/.test(passwordForm.newPassword)
                      ? "text-green-600"
                      : "text-muted-foreground"
                      }`}
                  >
                    {/\d/.test(passwordForm.newPassword) ? "✓" : "•"} Ít nhất 1
                    chữ số
                  </li>
                  <li
                    className={`flex items-center gap-2 ${/[!@#$%^&*(),.?":{}|<>]/.test(passwordForm.newPassword)
                      ? "text-green-600"
                      : "text-muted-foreground"
                      }`}
                  >
                    {/[!@#$%^&*(),.?":{}|<>]/.test(passwordForm.newPassword)
                      ? "✓"
                      : "•"}{" "}
                    Ít nhất 1 ký tự đặc biệt
                  </li>
                </ul>
              </div>
              <Separator />
              <div className="flex gap-2">
                <Button
                  onClick={handleChangePassword}
                  disabled={isUpdatingPassword}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white transition-all duration-300 transform hover:scale-105"
                >
                  {isUpdatingPassword ? "Đang lưu..." : "Lưu"}
                </Button>
                <Button
                  variant="outline"
                  className="hover:bg-gray-50 transition-all duration-300"
                >
                  Hủy
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Addresses Tab */}
        <TabsContent value="addresses">
          <Card className="border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-b from-white to-gray-50/50">
            <CardHeader className="bg-gradient-to-r from-gray-50/80 to-white border-b border-gray-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl text-gray-800">Địa Chỉ</CardTitle>
                <CardDescription className="text-gray-600">
                  Thay đổi địa chỉ nhận hàng của bạn
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {userInfo?.address ? (
                // ---- TRƯỜNG HỢP 1: NGƯỜI DÙNG ĐÃ CÓ ĐỊA CHỈ ----
                <div>
                  {isEditingAddress ? (
                    // Chế độ CHỈNH SỬA
                    <div className="space-y-4">
                      <Label htmlFor="address-input">Địa chỉ</Label>
                      <Input
                        id="address-input"
                        value={addressValue}
                        onChange={(e) => setAddressValue(e.target.value)}
                        placeholder="Nhập địa chỉ của bạn"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSaveAddress}
                          disabled={isUpdating}
                        >
                          {isUpdating ? "Đang lưu..." : "Lưu"}
                        </Button>
                        <Button variant="outline" onClick={handleCancelEdit}>
                          Hủy
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Chế độ HIỂN THỊ
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        {userInfo.address}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEditAddressClick}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                // ---- TRƯỜỢNG HỢP 2: NGƯỜI DÙNG CHƯA CÓ ĐỊA CHỈ ----
                <div>
                  {isEditingAddress ? (
                    // Chế độ THÊM MỚI (giao diện giống hệt chỉnh sửa)
                    <div className="space-y-4">
                      <Label htmlFor="address-input">Địa chỉ</Label>
                      <Input
                        id="address-input"
                        value={addressValue}
                        onChange={(e) => setAddressValue(e.target.value)}
                        placeholder="Nhập địa chỉ của bạn"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSaveAddress}
                          disabled={isUpdating}
                        >
                          {isUpdating ? "Đang lưu..." : "Lưu"}
                        </Button>
                        <Button variant="outline" onClick={handleCancelEdit}>
                          Hủy
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Giao diện "trạng thái trống"
                    <div className="text-center py-8 px-4 border-2 border-dashed rounded-lg">
                      <p className="text-muted-foreground mb-4">
                        Bạn chưa có địa chỉ nào được lưu.
                      </p>
                      <Button
                        onClick={handleEditAddressClick}
                        className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white transition-all duration-300 transform hover:scale-105"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm địa chỉ mới
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default UserProfile;
