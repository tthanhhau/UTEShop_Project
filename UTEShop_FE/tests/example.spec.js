import { test, expect } from "@playwright/test";

test.describe("Trang Đăng nhập", () => {
  // Trước mỗi bài kiểm thử, điều hướng đến trang Đăng nhập
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173/Login");
  });

  test("Có thể nhập vào các trường email và mật khẩu", async ({ page }) => {
    // Nhập văn bản vào trường email
    await page
      .getByPlaceholder("you@example.com")
      .fill("22110401@student.hcmute.edu.vn");
    // Kiểm tra xem giá trị đã được nhập chính xác
    await expect(page.getByPlaceholder("you@example.com")).toHaveValue(
      "22110401@student.hcmute.edu.vn"
    );

    // Nhập văn bản vào trường mật khẩu
    await page.getByPlaceholder("••••••••").fill("1234567");
    // Kiểm tra xem giá trị đã được nhập chính xác
    await expect(page.getByPlaceholder("••••••••")).toHaveValue("1234567");
  });

  test("Đăng nhập thành công và chuyển hướng đến trang chủ", async ({
    page,
  }) => {
    await page
      .getByPlaceholder("you@example.com")
      .fill("22110401@student.hcmute.edu.vn");
    await page.getByPlaceholder("••••••••").fill("1234567");

    // Nhấp vào nút "Đăng nhập"
    await page.getByRole("button", { name: "Đăng nhập" }).first().click();

    await expect(page).toHaveURL("http://localhost:5173/");

  });

  test('Hiển thị thông báo lỗi khi đăng nhập thất bại', async ({ page }) => {
    // Điền thông tin đăng nhập không hợp lệ
    await page.getByPlaceholder('you@example.com').fill('wronguser@example.com');
    await page.getByPlaceholder('••••••••').fill('wrongpassword');

    // Nhấp vào nút "Đăng nhập"
    await page.getByRole('button', { name: 'Đăng nhập' }).first().click();

    // Tìm phần tử chứa thông báo lỗi
    // Dựa trên mã React của bạn, đó là một thẻ <p> với class 'text-red-600'
    const errorMessage = page.locator('p.text-red-600');

    // Chờ và xác minh rằng thông báo lỗi được hiển thị
    await expect(errorMessage).toBeVisible();

    await expect(errorMessage).toHaveText('Sai email hoặc mật khẩu');

    // Xác minh rằng người dùng vẫn ở lại trang đăng nhập
    await expect(page).toHaveURL('http://localhost:5173/Login');
  });

  test("Thêm sản phẩm vào giỏ hàng sau khi đăng nhập", async ({ page }) => {
    await page
      .getByPlaceholder("you@example.com")
      .fill("22110401@student.hcmute.edu.vn");
    await page.getByPlaceholder("••••••••").fill("1234567");

    // Nhấp vào nút "Đăng nhập"
    await page.getByRole("button", { name: "Đăng nhập" }).first().click();
    await expect(page).toHaveURL("http://localhost:5173/");

    await page.goto("http://localhost:5173/products");
    //Thiết lập trình lắng nghe cho alert (phải đặt trước khi click)
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Đã thêm sản phẩm vào giỏ hàng!');
      await dialog.accept();
    });

    const productName = 'Miss Dior'; 
    const productCard = page.locator('.group.bg-white', { hasText: productName });
    await expect(productCard).toBeVisible();
    await productCard.locator('button:has-text("Thêm giỏ")').click();
  });

  test("Thêm sản phẩm vào mục yêu thích sau khi đăng nhập", async ({ page }) => {
    await page
      .getByPlaceholder("you@example.com")
      .fill("22110401@student.hcmute.edu.vn");
    await page.getByPlaceholder("••••••••").fill("1234567");

    // Nhấp vào nút "Đăng nhập"
    await page.getByRole("button", { name: "Đăng nhập" }).first().click();
    await expect(page).toHaveURL("http://localhost:5173/");

    await page.goto("http://localhost:5173/products");
    //Thiết lập trình lắng nghe cho alert (phải đặt trước khi click)
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Đã thêm sản phẩm vào giỏ hàng!');
      await dialog.accept();
    });

    const productName = 'Miss Dior'; 
    const productCard = page.locator('.group.bg-white', { hasText: productName });
    await expect(productCard).toBeVisible();
    const addToFavoritesButton = productCard.getByRole('button', { name: 'Thêm vào yêu thích' });
    await addToFavoritesButton.click();
  });

  
});
