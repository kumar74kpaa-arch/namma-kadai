import { getProductById } from "@/lib/products";
import { notFound } from "next/navigation";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { AddToCartButton } from "@/components/add-to-cart-button";

type ProductPageProps = {
  params: {
    id: string;
  };
};

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProductById(params.id);

  if (!product) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
        <div className="bg-card p-4 rounded-lg shadow-sm">
          <div className="aspect-square overflow-hidden rounded-md">
            <Image
              src={product.imageUrl}
              alt={product.name}
              width={800}
              height={800}
              className="w-full h-full object-cover"
              data-ai-hint={product.imageHint}
            />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl md:text-4xl font-bold font-headline text-foreground">
            {product.name}
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            {product.description}
          </p>
          <div className="text-3xl font-bold text-primary mt-4">
            {formatPrice(product.price)}
          </div>
          <div className="mt-6">
            <AddToCartButton product={product} />
          </div>
        </div>
      </div>
    </div>
  );
}
