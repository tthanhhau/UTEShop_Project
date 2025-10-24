export default function TextField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full rounded-xl border px-4 py-2 focus:outline-none focus:ring-2 ${error
            ? "border-red-500 focus:ring-red-400"
            : "border-gray-300 focus:ring-gray-400"
          }`}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
