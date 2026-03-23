// app/dashboard/products/edit/[id]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
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
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface ProductImage {
  id: string;
  file?: File;
  preview: string;
  isPrimary: boolean;
  existingUrl?: string;
  existingId?: number;
}

interface Attribute {
  id: number;
  name: string;
  displayName: string;
  type: string;
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
  id: string;
  variantId?: number; // Existing variant ID
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

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Product data
  const [productData, setProductData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
  });
  
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [availableAttributes, setAvailableAttributes] = useState<Attribute[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<SelectedAttribute[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  
  const categories = [
    'Books',
    'Clothing',
    'Electronics',
    'Home & Kitchen',
    'Beauty',
    'Sports',
    'Toys',
    'Health',
    'Automotive',
    'Jewelry'
  ];

  // Fetch product data
  useEffect(() => {
    if (!productId) return;

    // Replace the entire fetchProduct function from line ~150 to ~200 with:

const fetchProduct = async () => {
  setLoading(true);
  setError(null);
  
  try {
    // Fetch product details
    const response = await fetch(`/api/seller/products/${productId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch product');
    }
    
    const product = await response.json();
    
    // Set basic product info
    setProductData({
      name: product.name,
      description: product.description || '',
      category: product.category,
      price: product.price.toString(),
    });
    
    // Set product images
    const images: ProductImage[] = product.images.map((img: any, index: number) => ({
      id: `existing-${img.id}`,
      preview: img.url,
      isPrimary: img.isPrimary,
      existingUrl: img.url,
      existingId: img.id,
    }));
    setProductImages(images);
    
    // Fetch available attributes
    const attrResponse = await fetch('/api/attributes');
    if (attrResponse.ok) {
      const attrData = await attrResponse.json();
      setAvailableAttributes(attrData.attributes || []);
    }
    
    // Process variants
    const productVariants: Variant[] = product.variants.map((variant: any) => ({
      id: variant.id ? `variant-${variant.id}` : `new-${Date.now()}`,
      variantId: variant.id,
      sku: variant.sku,
      currentStock: variant.currentStock,
      priceAdjustment: variant.priceAdjustment || 0,
      isActive: variant.isActive,
      attributes: variant.attributes?.map((attr: any) => ({
        attributeId: attr.attribute.id,
        valueId: attr.value.id,
        attributeName: attr.attribute.name, // Use attr.attribute.name
        valueName: attr.value.displayName,
        hexColor: attr.value.hexColor,
      })) || [],
      images: variant.images?.map((img: any) => ({
        id: `variant-img-${img.id}`,
        preview: img.url,
        isPrimary: img.isPrimary,
        existingUrl: img.url,
        existingId: img.id,
      })) || [],
    }));
    setVariants(productVariants);
    
    // Extract selected attributes from variants
    const allAttributes = new Map<number, Set<number>>();
    productVariants.forEach(variant => {
      variant.attributes.forEach(attr => {
        if (!allAttributes.has(attr.attributeId)) {
          allAttributes.set(attr.attributeId, new Set());
        }
        allAttributes.get(attr.attributeId)?.add(attr.valueId);
      });
    });
    
    const selectedAttrs: SelectedAttribute[] = Array.from(allAttributes.entries()).map(([attrId, valueIds]) => {
      // Try to find the attribute in availableAttributes first
      const attr = availableAttributes.find(a => a.id === attrId);
      // If not found, get it from the first variant
      const variantAttr = productVariants[0]?.attributes.find((a: any) => a.attributeId === attrId);
      
      return {
        attributeId: attrId,
        attributeName: attr?.name || variantAttr?.attributeName || '',
        displayName: attr?.displayName || variantAttr?.attributeName || '',
        selectedValues: Array.from(valueIds),
      };
    });
    setSelectedAttributes(selectedAttrs);
    
  } catch (error: any) {
    console.error('Error fetching product:', error);
    setError(error.message);
  } finally {
    setLoading(false);
  }
};

    fetchProduct();
  }, [productId]);

  // Handle product image upload
  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach((file, index) => {
      if (!file.type.startsWith('image/')) {
        alert('Please upload only image files');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const newImage: ProductImage = {
          id: `img-${Date.now()}-${index}`,
          file,
          preview: reader.result as string,
          isPrimary: productImages.length === 0,
        };
        
        setProductImages(prev => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Set primary product image
  const setPrimaryProductImage = (imageId: string) => {
    setProductImages(prev =>
      prev.map(img => ({
        ...img,
        isPrimary: img.id === imageId
      }))
    );
  };

  // Remove product image
  const removeProductImage = (imageId: string) => {
    setProductImages(prev => prev.filter(img => img.id !== imageId));
    
    // If we removed the primary image and there are other images, set the first one as primary
    const remainingImages = productImages.filter(img => img.id !== imageId);
    if (remainingImages.length > 0 && !remainingImages.some(img => img.isPrimary)) {
      setProductImages(prev =>
        prev.map((img, index) => ({
          ...img,
          isPrimary: index === 0
        }))
      );
    }
  };

  // Toggle attribute selection
  const toggleAttribute = (attributeId: number) => {
    setSelectedAttributes(prev => {
      const exists = prev.find(attr => attr.attributeId === attributeId);
      if (exists) {
        return prev.filter(attr => attr.attributeId !== attributeId);
      } else {
        const attribute = availableAttributes.find(attr => attr.id === attributeId);
        if (attribute) {
          return [...prev, {
            attributeId: attribute.id,
            attributeName: attribute.name,
            displayName: attribute.displayName,
            selectedValues: []
          }];
        }
        return prev;
      }
    });
  };

  // Toggle attribute value
  const toggleAttributeValue = (attributeId: number, valueId: number) => {
    setSelectedAttributes(prev =>
      prev.map(attr => {
        if (attr.attributeId === attributeId) {
          const valueExists = attr.selectedValues.includes(valueId);
          return {
            ...attr,
            selectedValues: valueExists
              ? attr.selectedValues.filter(id => id !== valueId)
              : [...attr.selectedValues, valueId]
          };
        }
        return attr;
      })
    );
  };

  // Generate variants from selected attributes
  const generateVariants = () => {
    const activeAttributes = selectedAttributes.filter(attr => attr.selectedValues.length > 0);
    
    if (activeAttributes.length === 0) {
      setError('Please select at least one attribute value');
      return;
    }

    // Generate all combinations
    const combinations = generateCombinations(activeAttributes);
    
    const newVariants = combinations.map((combo, index) => {
      const attributes = combo.map(({ attributeId, valueId }) => {
        const attribute = activeAttributes.find(attr => attr.attributeId === attributeId);
        const attributeData = availableAttributes.find(attr => attr.id === attributeId);
        const value = attributeData?.values.find(v => v.id === valueId);
        
        return {
          attributeId,
          valueId,
          attributeName: attribute?.attributeName || '',
          valueName: value?.displayName || '',
          hexColor: value?.hexColor
        };
      });

      // Check if variant already exists with same attributes
      const existingVariant = variants.find(v => 
        v.attributes.length === attributes.length &&
        v.attributes.every((attr, idx) => 
          attr.attributeId === attributes[idx].attributeId &&
          attr.valueId === attributes[idx].valueId
        )
      );

      if (existingVariant) {
        return existingVariant;
      }

      return {
        id: `new-variant-${Date.now()}-${index}`,
        sku: generateSKU(),
        currentStock: 0,
        priceAdjustment: 0,
        isActive: true,
        attributes,
        images: []
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
    
    return result.filter(arr => arr.length > 0);
  };

  // Generate SKU
  const generateSKU = () => {
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    return `SKU-${timestamp}-${randomStr}`;
  };

  // Handle variant change
  const handleVariantChange = (id: string, field: keyof Variant, value: any) => {
    setVariants(prev =>
      prev.map(variant =>
        variant.id === id ? { ...variant, [field]: value } : variant
      )
    );
  };

  // Remove variant
  const removeVariant = (id: string) => {
    setVariants(prev => prev.filter(v => v.id !== id));
  };

  // Add a single variant manually
  const addSingleVariant = () => {
    const newVariant: Variant = {
      id: `single-${Date.now()}`,
      sku: generateSKU(),
      currentStock: 0,
      isActive: true,
      attributes: [],
      images: []
    };
    setVariants(prev => [...prev, newVariant]);
  };

  // Handle variant image upload
  const handleVariantImageUpload = (variantId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach((file, index) => {
      if (!file.type.startsWith('image/')) {
        alert('Please upload only image files');
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
        
        setVariants(prev =>
          prev.map(variant => {
            if (variant.id === variantId) {
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
  const setPrimaryVariantImage = (variantId: string, imageId: string) => {
    setVariants(prev =>
      prev.map(variant => {
        if (variant.id === variantId) {
          return {
            ...variant,
            images: variant.images.map(img => ({
              ...img,
              isPrimary: img.id === imageId
            }))
          };
        }
        return variant;
      })
    );
  };

  // Remove variant image
  const removeVariantImage = (variantId: string, imageId: string) => {
    setVariants(prev =>
      prev.map(variant => {
        if (variant.id === variantId) {
          const filteredImages = variant.images.filter(img => img.id !== imageId);
          const wasPrimary = variant.images.find(img => img.id === imageId)?.isPrimary;
          
          // If we removed the primary image and there are other images, set the first one as primary
          if (wasPrimary && filteredImages.length > 0 && !filteredImages.some(img => img.isPrimary)) {
            filteredImages[0].isPrimary = true;
          }
          
          return { ...variant, images: filteredImages };
        }
        return variant;
      })
    );
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Validate form
      if (!productData.name || !productData.category || !productData.price) {
        throw new Error('Please fill in all required fields');
      }

      if (productImages.length === 0) {
        throw new Error('Please upload at least one product image');
      }

      if (variants.length === 0) {
        throw new Error('Please create at least one variant');
      }

      // Validate variants
      for (const variant of variants) {
        if (!variant.sku.trim()) {
          throw new Error(`Variant must have an SKU`);
        }
        if (variant.currentStock < 0) {
          throw new Error(`Variant must have valid stock quantity`);
        }
      }

      // Check for duplicate SKUs
      const skus = variants.map(v => v.sku);
      const uniqueSkus = new Set(skus);
      if (uniqueSkus.size !== skus.length) {
        throw new Error('Duplicate SKUs found. Each variant must have a unique SKU.');
      }

      // Prepare form data
      const formDataToSend = new FormData();
      
      // Add basic product info
      formDataToSend.append('name', productData.name);
      formDataToSend.append('description', productData.description);
      formDataToSend.append('category', productData.category);
      formDataToSend.append('price', productData.price);
      formDataToSend.append('_method', 'PUT'); // For update
      
      // Add variants data
      const variantsData = variants.map(variant => ({
        id: variant.variantId, // Include existing ID for updates
        tempId: variant.id,
        sku: variant.sku,
        currentStock: variant.currentStock,
        priceAdjustment: variant.priceAdjustment,
        isActive: variant.isActive,
        attributes: variant.attributes.map(attr => ({
          attributeId: attr.attributeId,
          valueId: attr.valueId
        }))
      }));
      formDataToSend.append('variants', JSON.stringify(variantsData));

      // Add product images
      productImages.forEach((image, index) => {
        if (image.file) {
          formDataToSend.append('productImages', image.file);
        }
        formDataToSend.append(`productImageMeta_${index}`, JSON.stringify({
          isPrimary: image.isPrimary,
          sortOrder: index,
          existingId: image.existingId
        }));
      });

      // Add variant images
      variants.forEach(variant => {
        variant.images.forEach((image, index) => {
          if (image.file) {
            formDataToSend.append(`variantImages_${variant.id}`, image.file);
          }
          formDataToSend.append(`variantImageMeta_${variant.id}_${index}`, JSON.stringify({
            isPrimary: image.isPrimary,
            sortOrder: index,
            existingId: image.existingId
          }));
        });
      });

      // Submit to API
      const response = await fetch(`/api/seller/products/${productId}`, {
        method: 'PUT',
        body: formDataToSend,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update product');
      }

      // Redirect to product detail page
      router.push(`/dashboard/products/${productId}`);
      router.refresh();
      
    } catch (error: any) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href={`/dashboard/products/${productId}`}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Product
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
          <p className="text-gray-600 mt-1">Update product information</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
            <div>
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                value={productData.name}
                onChange={(e) => setProductData({ ...productData, name: e.target.value })}
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
                value={productData.category}
                onChange={(e) => setProductData({ ...productData, category: e.target.value })}
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
                value={productData.price}
                onChange={(e) => setProductData({ ...productData, price: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="0.00"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Description
              </label>
              <textarea
                value={productData.description}
                onChange={(e) => setProductData({ ...productData, description: e.target.value })}
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
            <h2 className="text-xl font-bold text-gray-900">Product Images *</h2>
            <div className="text-sm text-gray-600">
              {productImages.length} image{productImages.length !== 1 ? 's' : ''} uploaded
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
              <h3 className="font-medium text-gray-900 mb-4">Uploaded Images</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {productImages.map((image) => (
                  <div
                    key={image.id}
                    className={`relative border rounded-lg overflow-hidden ${
                      image.isPrimary ? 'border-2 border-black' : 'border-gray-200'
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
                            ? 'bg-black text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                        title={image.isPrimary ? 'Primary image' : 'Set as primary'}
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

        {/* Attributes Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Product Attributes</h2>
          
          {availableAttributes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No attributes available
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">Select attributes to create variants:</p>
              
              {/* Available Attributes */}
              <div className="mb-8">
                <h3 className="font-medium text-gray-900 mb-4">Available Attributes</h3>
                <div className="flex flex-wrap gap-3">
                  {availableAttributes.map((attribute) => {
                    const isSelected = selectedAttributes.some(attr => attr.attributeId === attribute.id);
                    
                    return (
                      <button
                        key={attribute.id}
                        type="button"
                        onClick={() => toggleAttribute(attribute.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                          isSelected
                            ? 'border-black bg-black text-white'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {attribute.type === 'COLOR' && <Palette className="w-4 h-4" />}
                        {attribute.type === 'SIZE' && <Ruler className="w-4 h-4" />}
                        {attribute.type === 'MATERIAL' && <Layers className="w-4 h-4" />}
                        <span>{attribute.displayName}</span>
                        {isSelected && <Check className="w-4 h-4" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Attributes with Values */}
              {selectedAttributes.map((selectedAttr) => {
                const attribute = availableAttributes.find(attr => attr.id === selectedAttr.attributeId);
                if (!attribute) return null;
                
                return (
                  <div key={selectedAttr.attributeId} className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {attribute.type === 'COLOR' && <Palette className="w-4 h-4" />}
                        {attribute.type === 'SIZE' && <Ruler className="w-4 h-4" />}
                        {attribute.type === 'MATERIAL' && <Layers className="w-4 h-4" />}
                        <h3 className="font-medium text-gray-900">{attribute.displayName}</h3>
                        <span className="text-sm text-gray-500">
                          ({selectedAttr.selectedValues.length} selected)
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {attribute.values.map((value) => {
                        const isSelected = selectedAttr.selectedValues.includes(value.id);
                        
                        return (
                          <button
                            key={value.id}
                            type="button"
                            onClick={() => toggleAttributeValue(selectedAttr.attributeId, value.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-md border transition-all ${
                              isSelected
                                ? 'border-black bg-black text-white'
                                : 'border-gray-300 hover:border-gray-400'
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
                    disabled={selectedAttributes.filter(attr => attr.selectedValues.length > 0).length === 0}
                    className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Regenerate Variants
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
              </div>
            </div>
          )}
        </div>

        {/* Variants Section */}
        {variants.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Product Variants ({variants.length})
              </h2>
              <div className="text-sm text-gray-600">
                Total stock: {variants.reduce((total, v) => total + v.currentStock, 0)} units
              </div>
            </div>

            <div className="space-y-6">
              {variants.map((variant) => (
                <div
                  key={variant.id}
                  className="border border-gray-200 rounded-lg p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {variant.attributes.length > 0
                          ? variant.attributes.map(attr => attr.valueName).join(' - ')
                          : 'Custom Variant'}
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
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariant(variant.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Remove variant"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
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
                          handleVariantChange(variant.id, 'sku', e.target.value)
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
                          handleVariantChange(variant.id, 'currentStock', parseInt(e.target.value) || 0)
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
                        value={variant.priceAdjustment || ''}
                        onChange={(e) =>
                          handleVariantChange(variant.id, 'priceAdjustment', parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                        placeholder="+/- 0.00"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Final price: ${(parseFloat(productData.price || '0') + (variant.priceAdjustment || 0)).toFixed(2)}
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
                            handleVariantChange(variant.id, 'isActive', e.target.checked)
                          }
                          className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                        />
                        <span className="text-sm text-gray-700">
                          {variant.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Variant Images */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">Variant Images (Optional)</h4>
                      <div>
                        <input
                          type="file"
                          id={`variant-image-upload-${variant.id}`}
                          multiple
                          accept="image/*"
                          onChange={(e) => handleVariantImageUpload(variant.id, e)}
                          className="hidden"
                        />
                        <label
                          htmlFor={`variant-image-upload-${variant.id}`}
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
                              image.isPrimary ? 'border-2 border-black' : 'border-gray-200'
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
                                onClick={() => setPrimaryVariantImage(variant.id, image.id)}
                                className={`p-1 rounded-full ${
                                  image.isPrimary
                                    ? 'bg-black text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-100'
                                }`}
                              >
                                <ImageIcon className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeVariantImage(variant.id, image.id)}
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
          <Link
            href={`/dashboard/products/${productId}`}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={saving || variants.length === 0}
              className="flex items-center px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Update Product
                  {variants.length > 0 && ` (${variants.length} variants)`}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}