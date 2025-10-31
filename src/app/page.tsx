
import { getProducts } from '@/lib/products';
import { ProductCard } from '@/components/product-card';
import { AdBanner } from '@/components/AdBanner';

export default async function RootPage() {
  const products = await getProducts();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl md:text-4xl font-headline font-bold text-center mb-8 text-foreground/90">
        Our Collection
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      <AdBanner />
    </div>
  );
}
