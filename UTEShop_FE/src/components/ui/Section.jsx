export default function Section({ title, products, grid }) {
    return (
        <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">{title}</h2>
            <div className={`grid gap-4 ${grid}`}>
                {products.map((p) => (
                    <div key={p.id} className="border rounded-lg p-4 shadow-sm">
                        <img
                            src={p.image}
                            alt={p.name}
                            className="w-full h-48 object-cover rounded-md"
                        />
                        <h3 className="mt-2 font-semibold">{p.name}</h3>
                        <p className="text-blue-600 font-bold">{p.price.toLocaleString()}đ</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
