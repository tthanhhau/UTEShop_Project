export function otpHtml({ title, code }: { title: string; code: string }) {
    return `
<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:20px;border:1px solid #e0e0e0;border-radius:8px;background-color:#f9f9f9">
  <div style="text-align:center;margin-bottom:20px">
    <h1 style="color:#333;margin-bottom:10px">UTEShop Admin</h1>
    <h2 style="color:#666;font-size:18px">${title}</h2>
  </div>
  
  <div style="background-color:#fff;padding:20px;border-radius:6px;margin:20px 0">
    <p style="font-size:16px;color:#333;margin-bottom:15px">Mã xác thực của bạn:</p>
    <div style="font-size:32px;font-weight:700;letter-spacing:8px;color:#4a90e2;text-align:center;padding:15px;background-color:#f0f8ff;border-radius:4px;border:2px dashed #4a90e2">
      ${code}
    </div>
  </div>
  
  <div style="text-align:center;color:#666;font-size:14px">
    <p>Mã có hiệu lực trong <b>10 phút</b>.</p>
    <p>Nếu không phải bạn yêu cầu, vui lòng bỏ qua email này.</p>
    <p style="margin-top:20px;font-size:12px;color:#999">
      Đây là email tự động, vui lòng không trả lời.
    </p>
  </div>
</div>`;
}

// Hoặc export as default object:
const emailTemplates = {
    otpHtml,
};

export default emailTemplates;