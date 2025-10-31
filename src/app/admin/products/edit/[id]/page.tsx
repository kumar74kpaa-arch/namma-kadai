'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDoc, useFirestore, updateDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { ArrowLeft, Loader2, Upload, ServerCrash } from 'lucide-react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const productSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.coerce.number().min(0, 'Price must be a positive number'),
});

type ProductFormValues = z.infer<typeof productSchema>;

type EditProductPageProps = {
  params: { id: string };
};

const CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1/dl2uvxfkz/image/upload';
const CLOUDINARY_UPLOAD_PRESET = 'unsigned_upload';


function EditProductSkeleton() {
    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <div className="flex items-center gap-4 mb-2">
                    <Skeleton className="h-10 w-10" />
                    <div>
                        <Skeleton className="h-6 w-48 mb-2" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="grid gap-6">
                <div className="grid gap-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
                <div className="grid gap-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-20 w-full" /></div>
                <div className="grid gap-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
                <div className="grid gap-2">
                    <Skeleton className="h-4 w-24" />
                    <div className="flex items-center gap-4">
                        <Skeleton className="w-20 h-20 rounded-md" />
                        <Skeleton className="h-10 flex-1" />
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-32" />
                </div>
            </CardContent>
        </Card>
    );
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const { id: productId } = params;
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const productRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'products', productId) : null),
    [firestore, productId]
  );
  const { data: product, isLoading: isProductLoading, error: productError } = useDoc<Product>(productRef);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
  });
  
  useEffect(() => {
    if (product) {
        reset(product);
        setImagePreview(product.imageUrl);
    }
  }, [product, reset]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const onSubmit: SubmitHandler<ProductFormValues> = async (data) => {
    if (!firestore || !product || !productRef) return;

    setIsSubmitting(true);
    let imageUrl = product.imageUrl;

    try {
        // If a new image is selected, upload it to Cloudinary
        if (imageFile) {
            const formData = new FormData();
            formData.append('file', imageFile);
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
            formData.append("folder", "products");
            
            const uploadResponse = await fetch(CLOUDINARY_UPLOAD_URL, {
              method: 'POST',
              body: formData,
            });

            const cloudinaryData = await uploadResponse.json();

            if (!uploadResponse.ok) {
              throw new Error(cloudinaryData.error?.message || 'Image upload failed.');
            }
            
            imageUrl = cloudinaryData.secure_url;
        }

        // Update product in Firestore
        const productToUpdate = { ...data, imageUrl };
        updateDocumentNonBlocking(productRef, productToUpdate);

        toast({
            title: 'Product Updated!',
            description: `${data.name} has been updated successfully.`,
        });

        router.push('/admin/products');

    } catch (error: any) {
        console.error("Error updating product:", error);
        toast({
            variant: 'destructive',
            title: 'Uh oh! Something went wrong.',
            description: error.message || 'Could not update the product. Please try again.',
        });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isProductLoading) {
      return <EditProductSkeleton />;
  }

  if (productError) {
       return (
        <Alert variant="destructive" className="max-w-2xl mx-auto">
            <ServerCrash className="h-4 w-4" />
            <AlertTitle>Error Loading Product</AlertTitle>
            <AlertDescription>
                There was a problem fetching the product data. It might have been deleted, or there's a network issue.
                <div className="mt-4">
                    <Button asChild variant="secondary">
                        <Link href="/admin/products">Go Back to Products</Link>
                    </Button>
                </div>
            </AlertDescription>
        </Alert>
       )
  }

  if (!product) {
      return (
         <Alert variant="destructive" className="max-w-2xl mx-auto">
            <ServerCrash className="h-4 w-4" />
            <AlertTitle>Product Not Found</AlertTitle>
            <AlertDescription>
                The product you are trying to edit does not exist.
                 <div className="mt-4">
                    <Button asChild variant="secondary">
                        <Link href="/admin/products">Go Back to Products</Link>
                    </Button>
                </div>
            </AlertDescription>
        </Alert>
      )
  }


  return (
    <Card className="max-w-2xl mx-auto">
        <CardHeader>
            <div className="flex items-center gap-4 mb-2">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/admin/products">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back to Products</span>
                    </Link>
                </Button>
                <div>
                    <CardTitle>Edit Product</CardTitle>
                    <CardDescription>Update the details for "{product?.name}".</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
                <div className="grid gap-2">
                    <Label htmlFor="name">Product Name</Label>
                    <Input id="name" {...register('name')} />
                    {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" {...register('description')} rows={5} />
                    {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="price">Price (INR)</Label>
                    <Input id="price" type="number" step="0.01" {...register('price')} />
                    {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="image">Product Image</Label>
                     <div className="flex items-center gap-4">
                        {imagePreview ? (
                             <Image src={imagePreview} alt="Product preview" width={80} height={80} className="rounded-md object-cover aspect-square" />
                        ) : (
                            <div className="w-20 h-20 bg-muted rounded-md flex items-center justify-center">
                                <Upload className="h-8 w-8 text-muted-foreground" />
                            </div>
                        )}
                        <Input id="image" type="file" accept="image/png, image/jpeg" onChange={handleImageChange} className="flex-1" />
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/admin/products">Cancel</Link>
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </CardContent>
    </Card>
  );
}
