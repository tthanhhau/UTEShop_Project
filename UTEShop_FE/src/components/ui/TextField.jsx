export default function TextField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
      />
    </div>
  );
}
