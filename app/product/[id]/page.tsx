// app/product/[id]/page.tsx (Server Component - NO 'use client')
import Link from "next/link";
import ProductPageClient from "./ProductPageClient";
import { Product } from "@/types/product";
import Navbar from "@/app/components/Navbar";

// Function to fetch product from API (Server-side)
async function getProduct(id: string): Promise<Product | null> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000";

    console.log("Fetching product from:", `${baseUrl}/api/products/${id}`);

    const res = await fetch(`${baseUrl}/api/products/${id}`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("API Response status:", res.status, res.statusText);

    if (!res.ok) {
      const errorData = await res.text();
      console.error("API Error Response:", errorData);

      if (res.status === 404) {
        return null;
      }
      throw new Error(
        `Failed to fetch product: ${res.status} ${res.statusText} - ${errorData}`
      );
    }

    const data = await res.json();
    console.log("Product data received:", data);

    // Transform the data to match your Product interface
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      reviews:
        data.reviews?.map((review: any) => ({
          ...review,
          createdAt: new Date(review.createdAt),
        })) || [],
      discounts:
        data.discounts?.map((discount: any) => ({
          ...discount,
          startDate: new Date(discount.startDate),
          endDate: new Date(discount.endDate),
        })) || [],
      variants: data.variants || [],
    };
  } catch (error) {
    console.error("Error fetching product:", error);
    throw error;
  }
}

export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  try {
    const product = await getProduct(params.id);

    if (!product) {
      return (
        <div className="max-w-7xl mx-auto px-4 pb-8 pt-4">
          <div className="mb-8">
            <Navbar />
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Product Not Found
            </h1>
            <p className="text-gray-600">
              The product you're looking for doesn't exist.
            </p>
            <div className="mt-6">
              <Link
                href="/"
                className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    // Pass the product data to the client component

    return (
      <>
        <div className="mb-8">
          <Navbar />
        </div>
        <ProductPageClient product={product} />
      </>
    );
  } catch (error) {
    console.error("Error loading product page:", error);
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Error Loading Product
          </h1>
          <p className="text-gray-600">
            There was an error loading the product. Please try again later.
          </p>
          <div className="mt-6 space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors mr-4"
            >
              Try Again
            </button>
            <a
              href="/"
              className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }
}
