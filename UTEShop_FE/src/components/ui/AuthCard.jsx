export default function AuthCard({ title, children }) {
  return (
    <div className="mx-auto mt-24 w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
      <h1 className="mb-6 text-center text-2xl font-semibold">{title}</h1>
      {children}
    </div>
  );
}
