export default function OtpInput({ value, onChange }) {
  return (
    <input
      value={value}
      onChange={(e) =>
        onChange(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))
      }
      className="w-full border rounded px-3 py-2"
      placeholder="Nhập mã 6 chữ số"
    />
  );
}
