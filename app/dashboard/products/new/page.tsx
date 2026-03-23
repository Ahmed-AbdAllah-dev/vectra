// app/dashboard/products/new/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Upload,
  X,
  Plus,
  Trash2,
  Package,
  Image as ImageIcon,
  Palette,
  Ruler,
  Layers,
  Check,
  Package2,
  Grid,
} from "lucide-react";

interface ProductImage {
  id: string;
  file: File;
  preview: string;
  isPrimary: boolean;
}

interface Attribute {
  id: number;
  name: string;
  displayName: string;
  type: "COLOR" | "SIZE" | "MATERIAL" | "STYLE" | "PATTERN" | "OTHER";
  values: AttributeValue[];
}

interface AttributeValue {
  id: number;
  value: string;
  displayName: string;
  hexColor?: string;
  attributeId: number;
}

interface SelectedAttribute {
  attributeId: number;
  attributeName: string;
  displayName: string;
  selectedValues: number[];
}

interface Variant {
  tempId: string;
  sku: string;
  currentStock: number;
  priceAdjustment?: number;
  isActive: boolean;
  attributes: {
    attributeId: number;
    valueId: number;
    attributeName: string;
    valueName: string;
    hexColor?: string;
  }[];
  images: ProductImage[];
}

export default function AddProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingAttributes, setLoadingAttributes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Product type
  const [productType, setProductType] = useState<"simple" | "variable">(
    "simple"
  );

  // Basic product info
  const [productInfo, setProductInfo] = useState({
    name: "",
    description: "",
    category: "",
    basePrice: "",
    simpleStock: 0,
  });

  // Product images
  const [productImages, setProductImages] = useState<ProductImage[]>([]);

  // Attributes for variable products
  const [availableAttributes, setAvailableAttributes] = useState<Attribute[]>(
    []
  );
  const [selectedAttributes, setSelectedAttributes] = useState<
    SelectedAttribute[]
  >([]);

  // Variants for variable products
  const [variants, setVariants] = useState<Variant[]>([]);

  // Categories
  const categories = [
    "Books",
    "Clothing",
    "Electronics",
    "Home & Kitchen",
    "Beauty",
    "Sports",
    "Toys",
    "Health",
    "Automotive",
    "Jewelry",
  ];

  // Fetch attributes when product type is variable
  useEffect(() => {
    if (productType === "variable") {
      fetchAttributes();
    }
  }, [productType]);

  const fetchAttributes = async () => {
    setLoadingAttributes(true);
    try {
      const response = await fetch("/api/attributes");
      if (response.ok) {
        const data = await response.json();
        setAvailableAttributes(data.attributes || []);
      } else {
        // If API fails, use some default attributes
        setAvailableAttributes([
          {
            id: 1,
            name: "color",
            displayName: "Color",
            type: "COLOR",
            values: [
              {
                id: 1,
                value: "red",
                displayName: "Red",
                hexColor: "#FF0000",
                attributeId: 1,
              },
              {
                id: 2,
                value: "blue",
                displayName: "Blue",
                hexColor: "#0000FF",
                attributeId: 1,
              },
              {
                id: 3,
                value: "green",
                displayName: "Green",
                hexColor: "#00FF00",
                attributeId: 1,
              },
              {
                id: 4,
                value: "black",
                displayName: "Black",
                hexColor: "#000000",
                attributeId: 1,
              },
              {
                id: 5,
                value: "white",
                displayName: "White",
                hexColor: "#FFFFFF",
                attributeId: 1,
              },
            ],
          },
          {
            id: 2,
            name: "size",
            displayName: "Size",
            type: "SIZE",
            values: [
              { id: 6, value: "xs", displayName: "XS", attributeId: 2 },
              { id: 7, value: "s", displayName: "S", attributeId: 2 },
              { id: 8, value: "m", displayName: "M", attributeId: 2 },
              { id: 9, value: "l", displayName: "L", attributeId: 2 },
              { id: 10, value: "xl", displayName: "XL", attributeId: 2 },
            ],
          },
        ]);
      }
    } catch (error) {
      console.error("Failed to fetch attributes:", error);
      setAvailableAttributes([
        {
          id: 1,
          name: "color",
          displayName: "Color",
          type: "COLOR",
          values: [
            {
              id: 1,
              value: "red",
              displayName: "Red",
              hexColor: "#FF0000",
              attributeId: 1,
            },
            {
              id: 2,
              value: "blue",
              displayName: "Blue",
              hexColor: "#0000FF",
              attributeId: 1,
            },
            {
              id: 3,
              value: "green",
              displayName: "Green",
              hexColor: "#00FF00",
              attributeId: 1,
            },
          ],
        },
      ]);
    } finally {
      setLoadingAttributes(false);
    }
  };

  // Handle product image upload
  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    files.forEach((file, index) => {
      if (!file.type.startsWith("image/")) {
        alert("Please upload only image files");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const newImage: ProductImage = {
          id: `img-${Date.now()}-${index}`,
          file,
          preview: reader.result as string,
          isPrimary: productImages.length === 0 && index === 0,
        };

        setProductImages((prev) => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Set primary product image
  const setPrimaryProductImage = (imageId: string) => {
    setProductImages((prev) =>
      prev.map((img) => ({
        ...img,
        isPrimary: img.id === imageId,
      }))
    );
  };

  // Remove product image
  const removeProductImage = (imageId: string) => {
    const wasPrimary = productImages.find(
      (img) => img.id === imageId
    )?.isPrimary;
    setProductImages((prev) => prev.filter((img) => img.id !== imageId));

    // If we removed the primary image and there are other images, set the first one as primary
    if (wasPrimary && productImages.length > 1) {
      const remainingImages = productImages.filter((img) => img.id !== imageId);
      if (
        remainingImages.length > 0 &&
        !remainingImages.some((img) => img.isPrimary)
      ) {
        setProductImages((prev) =>
          prev.map((img, index) => ({
            ...img,
            isPrimary: index === 0,
          }))
        );
      }
    }
  };

  // Toggle attribute selection
  const toggleAttribute = (attributeId: number) => {
    setSelectedAttributes((prev) => {
      const exists = prev.find((attr) => attr.attributeId === attributeId);
      if (exists) {
        return prev.filter((attr) => attr.attributeId !== attributeId);
      } else {
        const attribute = availableAttributes.find(
          (attr) => attr.id === attributeId
        );
        if (attribute) {
          return [
            ...prev,
            {
              attributeId: attribute.id,
              attributeName: attribute.name,
              displayName: attribute.displayName,
              selectedValues: [],
            },
          ];
        }
        return prev;
      }
    });
  };

  // Toggle attribute value
  const toggleAttributeValue = (attributeId: number, valueId: number) => {
    setSelectedAttributes((prev) =>
      prev.map((attr) => {
        if (attr.attributeId === attributeId) {
          const valueExists = attr.selectedValues.includes(valueId);
          return {
            ...attr,
            selectedValues: valueExists
              ? attr.selectedValues.filter((id) => id !== valueId)
              : [...attr.selectedValues, valueId],
          };
        }
        return attr;
      })
    );
  };

  // Generate variants from selected attributes
  const generateVariants = () => {
    const activeAttributes = selectedAttributes.filter(
      (attr) => attr.selectedValues.length > 0
    );

    if (activeAttributes.length === 0) {
      setError("Please select at least one attribute value");
      return;
    }

    // Generate all combinations
    const combinations = generateCombinations(activeAttributes);

    const newVariants = combinations.map((combo, index) => {
      const attributes = combo.map(({ attributeId, valueId }) => {
        const attribute = activeAttributes.find(
          (attr) => attr.attributeId === attributeId
        );
        const attributeData = availableAttributes.find(
          (attr) => attr.id === attributeId
        );
        const value = attributeData?.values.find((v) => v.id === valueId);

        return {
          attributeId,
          valueId,
          attributeName: attribute?.attributeName || "",
          valueName: value?.displayName || "",
          hexColor: value?.hexColor,
        };
      });

      const variantName = attributes.map((attr) => attr.valueName).join(" - ");

      // Check if variant already exists
      const existingVariant = variants.find(
        (v) =>
          v.attributes.length === attributes.length &&
          v.attributes.every(
            (attr, idx) =>
              attr.attributeId === attributes[idx].attributeId &&
              attr.valueId === attributes[idx].valueId
          )
      );

      if (existingVariant) {
        return existingVariant;
      }

      return {
        tempId: `variant-${Date.now()}-${index}`,
        sku: generateSKU(),
        currentStock: 0,
        priceAdjustment: 0,
        isActive: true,
        attributes,
        images: [],
      };
    });

    setVariants(newVariants);
  };

  // Helper to generate combinations
  const generateCombinations = (attributes: SelectedAttribute[]) => {
    const result: Array<Array<{ attributeId: number; valueId: number }>> = [[]];

    for (const attr of attributes) {
      const temp: typeof result = [];
      for (const res of result) {
        for (const valueId of attr.selectedValues) {
          temp.push([...res, { attributeId: attr.attributeId, valueId }]);
        }
      }
      result.length = 0;
      result.push(...temp);
    }

    return result.filter((arr) => arr.length > 0);
  };

  // Generate SKU
  const generateSKU = () => {
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    return `SKU-${timestamp}-${randomStr}`;
  };

  // Handle variant change
  const handleVariantChange = (
    tempId: string,
    field: keyof Variant,
    value: any
  ) => {
    setVariants((prev) =>
      prev.map((variant) =>
        variant.tempId === tempId ? { ...variant, [field]: value } : variant
      )
    );
  };

  // Remove variant
  const removeVariant = (tempId: string) => {
    setVariants((prev) => prev.filter((v) => v.tempId !== tempId));
  };

  // Handle variant image upload
  const handleVariantImageUpload = (
    variantTempId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);

    files.forEach((file, index) => {
      if (!file.type.startsWith("image/")) {
        alert("Please upload only image files");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const newImage: ProductImage = {
          id: `variant-img-${Date.now()}-${index}`,
          file,
          preview: reader.result as string,
          isPrimary: false,
        };

        setVariants((prev) =>
          prev.map((variant) => {
            if (variant.tempId === variantTempId) {
              const variantImages = [...variant.images, newImage];
              // If this is the first image, set it as primary
              if (variantImages.length === 1) {
                variantImages[0].isPrimary = true;
              }
              return { ...variant, images: variantImages };
            }
            return variant;
          })
        );
      };
      reader.readAsDataURL(file);
    });
  };

  // Set primary variant image
  const setPrimaryVariantImage = (variantTempId: string, imageId: string) => {
    setVariants((prev) =>
      prev.map((variant) => {
        if (variant.tempId === variantTempId) {
          return {
            ...variant,
            images: variant.images.map((img) => ({
              ...img,
              isPrimary: img.id === imageId,
            })),
          };
        }
        return variant;
      })
    );
  };

  // Remove variant image
  const removeVariantImage = (variantTempId: string, imageId: string) => {
    setVariants((prev) =>
      prev.map((variant) => {
        if (variant.tempId === variantTempId) {
          const filteredImages = variant.images.filter(
            (img) => img.id !== imageId
          );
          const wasPrimary = variant.images.find(
            (img) => img.id === imageId
          )?.isPrimary;

          // If we removed the primary image and there are other images, set the first one as primary
          if (
            wasPrimary &&
            filteredImages.length > 0 &&
            !filteredImages.some((img) => img.isPrimary)
          ) {
            filteredImages[0].isPrimary = true;
          }

          return { ...variant, images: filteredImages };
        }
        return variant;
      })
    );
  };

  // Add a single variant manually
  const addSingleVariant = () => {
    const newVariant: Variant = {
      tempId: `manual-${Date.now()}`,
      sku: generateSKU(),
      currentStock: 0,
      isActive: true,
      attributes: [],
      images: [],
    };
    setVariants((prev) => [...prev, newVariant]);
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate form
      if (
        !productInfo.name ||
        !productInfo.category ||
        !productInfo.basePrice
      ) {
        throw new Error(
          "Please fill in all required fields: name, category, and price"
        );
      }

      if (productImages.length === 0) {
        throw new Error("Please upload at least one product image");
      }

      if (productType === "simple" && productInfo.simpleStock < 0) {
        throw new Error("Please enter a valid stock quantity (0 or more)");
      }

      if (productType === "variable" && variants.length === 0) {
        throw new Error("Please generate at least one variant");
      }

      // Validate variants for variable products
      if (productType === "variable") {
        for (const variant of variants) {
          if (!variant.sku.trim()) {
            throw new Error(`All variants must have an SKU`);
          }
          if (variant.currentStock < 0) {
            throw new Error(
              `Variant "${variant.sku}" must have valid stock quantity (0 or more)`
            );
          }
        }

        // Check for duplicate SKUs
        const skus = variants.map((v) => v.sku);
        const uniqueSkus = new Set(skus);
        if (uniqueSkus.size !== skus.length) {
          throw new Error(
            "Duplicate SKUs found. Each variant must have a unique SKU."
          );
        }
      }

      // Prepare form data
      const formDataToSend = new FormData();

      // Add basic product info
      formDataToSend.append("name", productInfo.name);
      formDataToSend.append("description", productInfo.description);
      formDataToSend.append("category", productInfo.category);
      formDataToSend.append("basePrice", productInfo.basePrice);
      formDataToSend.append("productType", productType);

      // Add simple product stock if applicable
      if (productType === "simple") {
        formDataToSend.append(
          "simpleProductStock",
          productInfo.simpleStock.toString()
        );
      }

      // Add variants data for variable products
      if (productType === "variable" && variants.length > 0) {
        const variantsData = variants.map((variant) => ({
          tempId: variant.tempId,
          sku: variant.sku,
          currentStock: variant.currentStock,
          priceAdjustment: variant.priceAdjustment || 0,
          isActive: variant.isActive,
          attributes: variant.attributes.map((attr) => ({
            attributeId: attr.attributeId,
            valueId: attr.valueId,
          })),
        }));
        formDataToSend.append("variants", JSON.stringify(variantsData));
      }

      // Add product images
      productImages.forEach((image, index) => {
        formDataToSend.append("productImages", image.file); // This is the actual file
        formDataToSend.append(
          `productImageMeta_${index}`,
          JSON.stringify({
            isPrimary: image.isPrimary,
            sortOrder: index,
          })
        );
      });
      // Add variant images for variable products

      if (productType === "variable") {
        variants.forEach((variant) => {
          variant.images.forEach((image, index) => {
            formDataToSend.append(
              `variantImages_${variant.tempId}`,
              image.file
            ); // Actual file
            formDataToSend.append(
              `variantImageMeta_${variant.tempId}_${index}`,
              JSON.stringify({
                isPrimary: image.isPrimary,
                sortOrder: index,
              })
            );
          });
        });
      }

      // Submit to API
      const response = await fetch("/api/seller/products", {
        method: "POST",
        body: formDataToSend,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create product");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/products");
      }, 2000);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Reset form when product type changes
  const handleProductTypeChange = (type: "simple" | "variable") => {
    setProductType(type);
    if (type === "simple") {
      // Clear variants and attributes for simple products
      setVariants([]);
      setSelectedAttributes([]);
    }
  };

  if (success) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Package className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-green-800">
                Product Created Successfully!
              </h3>
              <p className="text-green-700">Redirecting to products page...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <button
            onClick={() => router.push("/dashboard/products")}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-gray-600 mt-1">Create a new product listing</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <X className="w-4 h-4 text-red-600" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Product Type Selection */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Product Type</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleProductTypeChange("simple")}
              className={`p-6 rounded-lg border-2 transition-all text-left ${
                productType === "simple"
                  ? "border-black bg-black text-white"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <Package2 className="w-6 h-6" />
                <span className="font-semibold">Simple Product</span>
              </div>
              <p className="text-sm opacity-90">
                A product with no variations (e.g., book, single item)
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleProductTypeChange("variable")}
              className={`p-6 rounded-lg border-2 transition-all text-left ${
                productType === "variable"
                  ? "border-black bg-black text-white"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <Grid className="w-6 h-6" />
                <span className="font-semibold">Variable Product</span>
              </div>
              <p className="text-sm opacity-90">
                A product with variations (e.g., shirt with different
                sizes/colors)
              </p>
            </button>
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Basic Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                value={productInfo.name}
                onChange={(e) =>
                  setProductInfo({ ...productInfo, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Enter product name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Category *
              </label>
              <select
                value={productInfo.category}
                onChange={(e) =>
                  setProductInfo({ ...productInfo, category: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={productInfo.basePrice}
                onChange={(e) =>
                  setProductInfo({ ...productInfo, basePrice: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="0.00"
                required
              />
            </div>

            {productType === "simple" && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  min="0"
                  value={productInfo.simpleStock}
                  onChange={(e) =>
                    setProductInfo({
                      ...productInfo,
                      simpleStock: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="0"
                  required
                />
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Description
              </label>
              <textarea
                value={productInfo.description}
                onChange={(e) =>
                  setProductInfo({
                    ...productInfo,
                    description: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black h-32"
                placeholder="Enter product description"
                rows={4}
              />
            </div>
          </div>
        </div>

        {/* Product Images */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Product Images *
            </h2>
            <div className="text-sm text-gray-600">
              {productImages.length} image
              {productImages.length !== 1 ? "s" : ""} uploaded
            </div>
          </div>

          <div className="mb-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                id="product-image-upload"
                multiple
                accept="image/*"
                onChange={handleProductImageUpload}
                className="hidden"
              />
              <label htmlFor="product-image-upload" className="cursor-pointer">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-700 font-medium mb-1">
                  Upload product images
                </p>
                <p className="text-sm text-gray-500">
                  PNG, JPG, GIF up to 10MB
                </p>
              </label>
            </div>
          </div>

          {productImages.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 mb-4">
                Uploaded Images
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {productImages.map((image) => (
                  <div
                    key={image.id}
                    className={`relative border rounded-lg overflow-hidden ${
                      image.isPrimary
                        ? "border-2 border-black"
                        : "border-gray-200"
                    }`}
                  >
                    <img
                      src={image.preview}
                      alt="Product preview"
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute top-2 right-2 flex space-x-1">
                      <button
                        type="button"
                        onClick={() => setPrimaryProductImage(image.id)}
                        className={`p-1 rounded-full ${
                          image.isPrimary
                            ? "bg-black text-white"
                            : "bg-white text-gray-600 hover:bg-gray-100"
                        }`}
                        title={
                          image.isPrimary ? "Primary image" : "Set as primary"
                        }
                      >
                        <ImageIcon className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeProductImage(image.id)}
                        className="p-1 bg-white text-gray-600 hover:bg-gray-100 rounded-full"
                        title="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {image.isPrimary && (
                      <div className="absolute bottom-2 left-2">
                        <span className="px-2 py-1 bg-black text-white text-xs rounded">
                          Primary
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Attributes Section (only for variable products) */}
        {productType === "variable" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Product Attributes
            </h2>

            {loadingAttributes ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading attributes...</p>
              </div>
            ) : availableAttributes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No attributes available. You can create attributes in the
                dashboard settings.
              </div>
            ) : (
              <div>
                <p className="text-gray-600 mb-4">
                  Select attributes to create variants:
                </p>

                {/* Available Attributes */}
                <div className="mb-8">
                  <h3 className="font-medium text-gray-900 mb-4">
                    Available Attributes
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {availableAttributes.map((attribute) => {
                      const isSelected = selectedAttributes.some(
                        (attr) => attr.attributeId === attribute.id
                      );

                      return (
                        <button
                          key={attribute.id}
                          type="button"
                          onClick={() => toggleAttribute(attribute.id)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                            isSelected
                              ? "border-black bg-black text-white"
                              : "border-gray-300 hover:border-gray-400"
                          }`}
                        >
                          {attribute.type === "COLOR" && (
                            <Palette className="w-4 h-4" />
                          )}
                          {attribute.type === "SIZE" && (
                            <Ruler className="w-4 h-4" />
                          )}
                          {attribute.type === "MATERIAL" && (
                            <Layers className="w-4 h-4" />
                          )}
                          <span>{attribute.displayName}</span>
                          {isSelected && <Check className="w-4 h-4" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Attributes with Values */}
                {selectedAttributes.map((selectedAttr) => {
                  const attribute = availableAttributes.find(
                    (attr) => attr.id === selectedAttr.attributeId
                  );
                  if (!attribute) return null;

                  return (
                    <div key={selectedAttr.attributeId} className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {attribute.type === "COLOR" && (
                            <Palette className="w-4 h-4" />
                          )}
                          {attribute.type === "SIZE" && (
                            <Ruler className="w-4 h-4" />
                          )}
                          {attribute.type === "MATERIAL" && (
                            <Layers className="w-4 h-4" />
                          )}
                          <h3 className="font-medium text-gray-900">
                            {attribute.displayName}
                          </h3>
                          <span className="text-sm text-gray-500">
                            ({selectedAttr.selectedValues.length} selected)
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {attribute.values.map((value) => {
                          const isSelected =
                            selectedAttr.selectedValues.includes(value.id);

                          return (
                            <button
                              key={value.id}
                              type="button"
                              onClick={() =>
                                toggleAttributeValue(
                                  selectedAttr.attributeId,
                                  value.id
                                )
                              }
                              className={`flex items-center gap-2 px-3 py-2 rounded-md border transition-all ${
                                isSelected
                                  ? "border-black bg-black text-white"
                                  : "border-gray-300 hover:border-gray-400"
                              }`}
                            >
                              {value.hexColor && (
                                <div
                                  className="w-4 h-4 rounded-full border border-gray-300"
                                  style={{ backgroundColor: value.hexColor }}
                                ></div>
                              )}
                              <span>{value.displayName}</span>
                              {isSelected && <Check className="w-3 h-3" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Generate Variants Button */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={generateVariants}
                      disabled={
                        selectedAttributes.filter(
                          (attr) => attr.selectedValues.length > 0
                        ).length === 0
                      }
                      className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                      Generate Variants
                    </button>

                    <button
                      type="button"
                      onClick={addSingleVariant}
                      className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Single Variant
                    </button>
                  </div>

                  {selectedAttributes.filter(
                    (attr) => attr.selectedValues.length > 0
                  ).length > 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                      Will create{" "}
                      {selectedAttributes
                        .filter((attr) => attr.selectedValues.length > 0)
                        .reduce(
                          (total, attr) => total * attr.selectedValues.length,
                          1
                        )}{" "}
                      variants
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Variants Section (only for variable products) */}
        {productType === "variable" && variants.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Product Variants ({variants.length})
              </h2>
              <div className="text-sm text-gray-600">
                Total stock:{" "}
                {variants.reduce((total, v) => total + v.currentStock, 0)} units
              </div>
            </div>

            <div className="space-y-6">
              {variants.map((variant) => (
                <div
                  key={variant.tempId}
                  className="border border-gray-200 rounded-lg p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {variant.attributes.length > 0
                          ? variant.attributes
                              .map((attr) => attr.valueName)
                              .join(" - ")
                          : "Custom Variant"}
                      </h3>
                      {variant.attributes.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {variant.attributes.map((attr, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm flex items-center gap-2"
                            >
                              {attr.hexColor && (
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: attr.hexColor }}
                                ></div>
                              )}
                              {attr.attributeName}: {attr.valueName}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVariant(variant.tempId)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Remove variant"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">
                        SKU *
                      </label>
                      <input
                        type="text"
                        value={variant.sku}
                        onChange={(e) =>
                          handleVariantChange(
                            variant.tempId,
                            "sku",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                        placeholder="Enter SKU"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-2">
                        Stock *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={variant.currentStock}
                        onChange={(e) =>
                          handleVariantChange(
                            variant.tempId,
                            "currentStock",
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                        placeholder="0"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-2">
                        Price Adjustment ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={variant.priceAdjustment || ""}
                        onChange={(e) =>
                          handleVariantChange(
                            variant.tempId,
                            "priceAdjustment",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                        placeholder="+/- 0.00"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Final price: $
                        {(
                          parseFloat(productInfo.basePrice || "0") +
                          (variant.priceAdjustment || 0)
                        ).toFixed(2)}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-2">
                        Status
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={variant.isActive}
                          onChange={(e) =>
                            handleVariantChange(
                              variant.tempId,
                              "isActive",
                              e.target.checked
                            )
                          }
                          className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                        />
                        <span className="text-sm text-gray-700">
                          {variant.isActive ? "Active" : "Inactive"}
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Variant Images */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">
                        Variant Images (Optional)
                      </h4>
                      <div>
                        <input
                          type="file"
                          id={`variant-image-upload-${variant.tempId}`}
                          multiple
                          accept="image/*"
                          onChange={(e) =>
                            handleVariantImageUpload(variant.tempId, e)
                          }
                          className="hidden"
                        />
                        <label
                          htmlFor={`variant-image-upload-${variant.tempId}`}
                          className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors cursor-pointer"
                        >
                          Add Images
                        </label>
                      </div>
                    </div>

                    {variant.images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {variant.images.map((image) => (
                          <div
                            key={image.id}
                            className={`relative border rounded-lg overflow-hidden ${
                              image.isPrimary
                                ? "border-2 border-black"
                                : "border-gray-200"
                            }`}
                          >
                            <img
                              src={image.preview}
                              alt="Variant preview"
                              className="w-full h-32 object-cover"
                            />
                            <div className="absolute top-2 right-2 flex space-x-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setPrimaryVariantImage(
                                    variant.tempId,
                                    image.id
                                  )
                                }
                                className={`p-1 rounded-full ${
                                  image.isPrimary
                                    ? "bg-black text-white"
                                    : "bg-white text-gray-600 hover:bg-gray-100"
                                }`}
                              >
                                <ImageIcon className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  removeVariantImage(variant.tempId, image.id)
                                }
                                className="p-1 bg-white text-gray-600 hover:bg-gray-100 rounded-full"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            {image.isPrimary && (
                              <div className="absolute bottom-2 left-2">
                                <span className="px-2 py-1 bg-black text-white text-xs rounded">
                                  Primary
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-6">
          <button
            type="button"
            onClick={() => router.push("/dashboard/products")}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={
                loading || (productType === "variable" && variants.length === 0)
              }
              className="flex items-center px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating Product...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Product
                  {productType === "variable" &&
                    variants.length > 0 &&
                    ` (${variants.length} variants)`}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
