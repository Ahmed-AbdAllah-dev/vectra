// prisma/seed-real-products.ts
import { AttributeType, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with real products...');

  // Create sellers
  const sellers = await Promise.all([
    prisma.seller.upsert({
      where: { email: 'nike@store.com' },
      update: {},
      create: {
        email: 'nike@store.com',
        password: 'hashedpassword',
        name: 'Nike Store',
        address: '123 Fashion Ave',
        phone: '+1234567890',
        user: { create: { email: 'nike@store.com', password: 'hashedpassword', role: 'SELLER' } }
      },
    }),
    prisma.seller.upsert({
      where: { email: 'adidas@store.com' },
      update: {},
      create: {
        email: 'adidas@store.com',
        password: 'hashedpassword',
        name: 'Adidas Official',
        address: '456 Sport St',
        phone: '+1234567891',
        user: { create: { email: 'adidas@store.com', password: 'hashedpassword', role: 'SELLER' } }
      },
    }),
    prisma.seller.upsert({
      where: { email: 'uniqlo@store.com' },
      update: {},
      create: {
        email: 'uniqlo@store.com',
        password: 'hashedpassword',
        name: 'Uniqlo',
        address: '789 Style Blvd',
        phone: '+1234567892',
        user: { create: { email: 'uniqlo@store.com', password: 'hashedpassword', role: 'SELLER' } }
      },
    }),
  ]);

  // Create a test buyer
  const buyer = await prisma.buyer.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      password: 'hashedpassword',
      name: 'John Customer',
      address: '123 Customer St',
      phone: '+1234567893',
      user: { create: { email: 'customer@example.com', password: 'hashedpassword', role: 'BUYER' } }
    },
  });

  // Create attributes
  const colorAttr = await prisma.attribute.upsert({
    where: { name: 'color' },
    update: {},
    create: {
      name: 'color',
      displayName: 'Color',
      type: AttributeType.COLOR,
      sortOrder: 1,
    },
  });

  const sizeAttr = await prisma.attribute.upsert({
    where: { name: 'size' },
    update: {},
    create: {
      name: 'size',
      displayName: 'Size',
      type: AttributeType.SIZE,
      sortOrder: 2,
    },
  });

  const materialAttr = await prisma.attribute.upsert({
    where: { name: 'material' },
    update: {},
    create: {
      name: 'material',
      displayName: 'Material',
      type: AttributeType.MATERIAL,
      sortOrder: 3,
    },
  });

  // Create color values
  const colors = await Promise.all([
    prisma.attributeValue.upsert({
      where: { attributeId_value: { attributeId: colorAttr.id, value: 'black' } },
      update: {},
      create: { value: 'black', displayName: 'Black', hexColor: '#000000', attributeId: colorAttr.id, sortOrder: 1 },
    }),
    prisma.attributeValue.upsert({
      where: { attributeId_value: { attributeId: colorAttr.id, value: 'white' } },
      update: {},
      create: { value: 'white', displayName: 'White', hexColor: '#FFFFFF', attributeId: colorAttr.id, sortOrder: 2 },
    }),
    prisma.attributeValue.upsert({
      where: { attributeId_value: { attributeId: colorAttr.id, value: 'navy' } },
      update: {},
      create: { value: 'navy', displayName: 'Navy Blue', hexColor: '#1E3A8A', attributeId: colorAttr.id, sortOrder: 3 },
    }),
    prisma.attributeValue.upsert({
      where: { attributeId_value: { attributeId: colorAttr.id, value: 'gray' } },
      update: {},
      create: { value: 'gray', displayName: 'Gray', hexColor: '#6B7280', attributeId: colorAttr.id, sortOrder: 4 },
    }),
    prisma.attributeValue.upsert({
      where: { attributeId_value: { attributeId: colorAttr.id, value: 'red' } },
      update: {},
      create: { value: 'red', displayName: 'Red', hexColor: '#DC2626', attributeId: colorAttr.id, sortOrder: 5 },
    }),
    prisma.attributeValue.upsert({
      where: { attributeId_value: { attributeId: colorAttr.id, value: 'blue' } },
      update: {},
      create: { value: 'blue', displayName: 'Blue', hexColor: '#2563EB', attributeId: colorAttr.id, sortOrder: 6 },
    }),
  ]);

  // Create size values
  const sizes = await Promise.all([
    prisma.attributeValue.upsert({
      where: { attributeId_value: { attributeId: sizeAttr.id, value: 'xs' } },
      update: {},
      create: { value: 'xs', displayName: 'XS', attributeId: sizeAttr.id, sortOrder: 1 },
    }),
    prisma.attributeValue.upsert({
      where: { attributeId_value: { attributeId: sizeAttr.id, value: 's' } },
      update: {},
      create: { value: 's', displayName: 'S', attributeId: sizeAttr.id, sortOrder: 2 },
    }),
    prisma.attributeValue.upsert({
      where: { attributeId_value: { attributeId: sizeAttr.id, value: 'm' } },
      update: {},
      create: { value: 'm', displayName: 'M', attributeId: sizeAttr.id, sortOrder: 3 },
    }),
    prisma.attributeValue.upsert({
      where: { attributeId_value: { attributeId: sizeAttr.id, value: 'l' } },
      update: {},
      create: { value: 'l', displayName: 'L', attributeId: sizeAttr.id, sortOrder: 4 },
    }),
    prisma.attributeValue.upsert({
      where: { attributeId_value: { attributeId: sizeAttr.id, value: 'xl' } },
      update: {},
      create: { value: 'xl', displayName: 'XL', attributeId: sizeAttr.id, sortOrder: 5 },
    }),
  ]);

  // Create material values
  const materials = await Promise.all([
    prisma.attributeValue.upsert({
      where: { attributeId_value: { attributeId: materialAttr.id, value: 'cotton' } },
      update: {},
      create: { value: 'cotton', displayName: '100% Cotton', attributeId: materialAttr.id, sortOrder: 1 },
    }),
    prisma.attributeValue.upsert({
      where: { attributeId_value: { attributeId: materialAttr.id, value: 'polyester' } },
      update: {},
      create: { value: 'polyester', displayName: 'Polyester', attributeId: materialAttr.id, sortOrder: 2 },
    }),
    prisma.attributeValue.upsert({
      where: { attributeId_value: { attributeId: materialAttr.id, value: 'blend' } },
      update: {},
      create: { value: 'blend', displayName: 'Cotton Blend', attributeId: materialAttr.id, sortOrder: 3 },
    }),
  ]);

  // Helper function to find attribute values
  const findColor = (name: string) => colors.find((c: any) => c.value === name);
  const findSize = (name: string) => sizes.find((s: any) => s.value === name);
  const findMaterial = (name: string) => materials.find((m: any) => m.value === name);

  // Product 1: Nike Air Max T-Shirt
  const nikeProduct = await prisma.product.create({
    data: {
      name: 'Nike Air Max Logo T-Shirt',
      description: 'Stay comfortable and stylish with this classic Nike Air Max t-shirt. Made from premium cotton with the iconic Air Max logo. Perfect for casual wear or light workouts.',
      category: 'Men Fashion',
      price: 35.00,
      sellerId: sellers[0].id,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop',
            altText: 'Nike Air Max T-Shirt - Main View',
            sortOrder: 1,
            isPrimary: true,
            type: 'gallery',
          },
          {
            url: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=500&h=500&fit=crop',
            altText: 'Nike T-Shirt - Side View',
            sortOrder: 2,
            isPrimary: false,
            type: 'gallery',
          },
        ],
      },
      variants: {
        create: [
          {
            sku: 'NIKE-AIRMAX-BLACK-M-COT',
            currentStock: 25,
            soldQuantity: 15,
            weight: 0.2,
            isActive: true,
            images: {
              create: [{
                url: 'https://images.unsplash.com/photo-1503341960582-b45751874cf0?w=500&h=500&fit=crop',
                altText: 'Nike Air Max T-Shirt - Black Medium',
                sortOrder: 1,
                isPrimary: true,
                type: 'variant',
              }],
            },
            attributes: {
              create: [
                { attributeId: colorAttr.id, valueId: findColor('black')!.id },
                { attributeId: sizeAttr.id, valueId: findSize('m')!.id },
                { attributeId: materialAttr.id, valueId: findMaterial('cotton')!.id },
              ],
            },
          },
          {
            sku: 'NIKE-AIRMAX-BLACK-L-COT',
            currentStock: 20,
            soldQuantity: 12,
            weight: 0.22,
            isActive: true,
            images: {
              create: [{
                url: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=500&h=500&fit=crop',
                altText: 'Nike Air Max T-Shirt - Black Large',
                sortOrder: 1,
                isPrimary: true,
                type: 'variant',
              }],
            },
            attributes: {
              create: [
                { attributeId: colorAttr.id, valueId: findColor('black')!.id },
                { attributeId: sizeAttr.id, valueId: findSize('l')!.id },
                { attributeId: materialAttr.id, valueId: findMaterial('cotton')!.id },
              ],
            },
          },
          {
            sku: 'NIKE-AIRMAX-WHITE-M-COT',
            currentStock: 18,
            soldQuantity: 8,
            weight: 0.2,
            isActive: true,
            images: {
              create: [{
                url: 'https://images.unsplash.com/photo-1627225924765-552d49cf47ad?w=500&h=500&fit=crop',
                altText: 'Nike Air Max T-Shirt - White Medium',
                sortOrder: 1,
                isPrimary: true,
                type: 'variant',
              }],
            },
            attributes: {
              create: [
                { attributeId: colorAttr.id, valueId: findColor('white')!.id },
                { attributeId: sizeAttr.id, valueId: findSize('m')!.id },
                { attributeId: materialAttr.id, valueId: findMaterial('cotton')!.id },
              ],
            },
          },
          {
            sku: 'NIKE-AIRMAX-NAVY-L-COT',
            currentStock: 15,
            soldQuantity: 10,
            weight: 0.22,
            isActive: true,
            images: {
              create: [{
                url: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=500&h=500&fit=crop',
                altText: 'Nike Air Max T-Shirt - Navy Large',
                sortOrder: 1,
                isPrimary: true,
                type: 'variant',
              }],
            },
            attributes: {
              create: [
                { attributeId: colorAttr.id, valueId: findColor('navy')!.id },
                { attributeId: sizeAttr.id, valueId: findSize('l')!.id },
                { attributeId: materialAttr.id, valueId: findMaterial('cotton')!.id },
              ],
            },
          },
        ],
      },
    },
  });

  // Product 2: Adidas Three Stripes Hoodie
  const adidasProduct = await prisma.product.create({
    data: {
      name: 'Adidas Three Stripes Hoodie',
      description: 'Classic Adidas hoodie featuring the iconic three stripes design. Made with a comfortable cotton blend for all-day comfort. Perfect for layering or wearing on its own.',
      category: 'Men Fashion',
      price: 65.00,
      sellerId: sellers[1].id,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&h=500&fit=crop',
            altText: 'Adidas Three Stripes Hoodie - Main View',
            sortOrder: 1,
            isPrimary: true,
            type: 'gallery',
          },
        ],
      },
      variants: {
        create: [
          {
            sku: 'ADIDAS-3S-BLACK-M-BLEND',
            currentStock: 12,
            soldQuantity: 18,
            weight: 0.6,
            isActive: true,
            images: {
              create: [{
                url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=500&fit=crop',
                altText: 'Adidas Hoodie - Black Medium',
                sortOrder: 1,
                isPrimary: true,
                type: 'variant',
              }],
            },
            attributes: {
              create: [
                { attributeId: colorAttr.id, valueId: findColor('black')!.id },
                { attributeId: sizeAttr.id, valueId: findSize('m')!.id },
                { attributeId: materialAttr.id, valueId: findMaterial('blend')!.id },
              ],
            },
          },
          {
            sku: 'ADIDAS-3S-GRAY-L-BLEND',
            currentStock: 10,
            soldQuantity: 14,
            weight: 0.65,
            isActive: true,
            images: {
              create: [{
                url: 'https://images.unsplash.com/photo-1554568218-0f1715e72254?w=500&h=500&fit=crop',
                altText: 'Adidas Hoodie - Gray Large',
                sortOrder: 1,
                isPrimary: true,
                type: 'variant',
              }],
            },
            attributes: {
              create: [
                { attributeId: colorAttr.id, valueId: findColor('gray')!.id },
                { attributeId: sizeAttr.id, valueId: findSize('l')!.id },
                { attributeId: materialAttr.id, valueId: findMaterial('blend')!.id },
              ],
            },
          },
          {
            sku: 'ADIDAS-3S-NAVY-XL-BLEND',
            currentStock: 8,
            soldQuantity: 6,
            weight: 0.7,
            isActive: true,
            images: {
              create: [{
                url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=500&h=500&fit=crop',
                altText: 'Adidas Hoodie - Navy XL',
                sortOrder: 1,
                isPrimary: true,
                type: 'variant',
              }],
            },
            attributes: {
              create: [
                { attributeId: colorAttr.id, valueId: findColor('navy')!.id },
                { attributeId: sizeAttr.id, valueId: findSize('xl')!.id },
                { attributeId: materialAttr.id, valueId: findMaterial('blend')!.id },
              ],
            },
          },
        ],
      },
    },
  });

  // Product 3: Uniqlo Heattech Crew Neck Long Sleeve T-Shirt
  const uniqloProduct = await prisma.product.create({
    data: {
      name: 'Uniqlo Heattech Crew Neck Long Sleeve',
      description: 'Revolutionary Heattech technology generates heat from moisture and retains it for incredible warmth. Ultra-soft and comfortable with excellent stretch. Perfect base layer for cold weather.',
      category: 'Men Fashion',
      price: 19.90,
      sellerId: sellers[2].id,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500&h=500&fit=crop',
            altText: 'Uniqlo Heattech Long Sleeve - Main View',
            sortOrder: 1,
            isPrimary: true,
            type: 'gallery',
          },
        ],
      },
      variants: {
        create: [
          {
            sku: 'UNIQLO-HEAT-BLACK-S-POLY',
            currentStock: 30,
            soldQuantity: 25,
            weight: 0.15,
            isActive: true,
            images: {
              create: [{
                url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500&h=500&fit=crop',
                altText: 'Uniqlo Heattech - Black Small',
                sortOrder: 1,
                isPrimary: true,
                type: 'variant',
              }],
            },
            attributes: {
              create: [
                { attributeId: colorAttr.id, valueId: findColor('black')!.id },
                { attributeId: sizeAttr.id, valueId: findSize('s')!.id },
                { attributeId: materialAttr.id, valueId: findMaterial('polyester')!.id },
              ],
            },
          },
          {
            sku: 'UNIQLO-HEAT-WHITE-M-POLY',
            currentStock: 25,
            soldQuantity: 20,
            weight: 0.16,
            isActive: true,
            images: {
              create: [{
                url: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=500&h=500&fit=crop',
                altText: 'Uniqlo Heattech - White Medium',
                sortOrder: 1,
                isPrimary: true,
                type: 'variant',
              }],
            },
            attributes: {
              create: [
                { attributeId: colorAttr.id, valueId: findColor('white')!.id },
                { attributeId: sizeAttr.id, valueId: findSize('m')!.id },
                { attributeId: materialAttr.id, valueId: findMaterial('polyester')!.id },
              ],
            },
          },
          {
            sku: 'UNIQLO-HEAT-GRAY-L-POLY',
            currentStock: 22,
            soldQuantity: 18,
            weight: 0.17,
            isActive: true,
            images: {
              create: [{
                url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500&h=500&fit=crop',
                altText: 'Uniqlo Heattech - Gray Large',
                sortOrder: 1,
                isPrimary: true,
                type: 'variant',
              }],
            },
            attributes: {
              create: [
                { attributeId: colorAttr.id, valueId: findColor('gray')!.id },
                { attributeId: sizeAttr.id, valueId: findSize('l')!.id },
                { attributeId: materialAttr.id, valueId: findMaterial('polyester')!.id },
              ],
            },
          },
          {
            sku: 'UNIQLO-HEAT-NAVY-XL-POLY',
            currentStock: 20,
            soldQuantity: 15,
            weight: 0.18,
            isActive: true,
            images: {
              create: [{
                url: 'https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?w=500&h=500&fit=crop',
                altText: 'Uniqlo Heattech - Navy XL',
                sortOrder: 1,
                isPrimary: true,
                type: 'variant',
              }],
            },
            attributes: {
              create: [
                { attributeId: colorAttr.id, valueId: findColor('navy')!.id },
                { attributeId: sizeAttr.id, valueId: findSize('xl')!.id },
                { attributeId: materialAttr.id, valueId: findMaterial('polyester')!.id },
              ],
            },
          },
        ],
      },
    },
  });

  // Product 4: Classic Denim Jacket
  const denimProduct = await prisma.product.create({
    data: {
      name: 'Classic Blue Denim Jacket',
      description: 'Timeless denim jacket crafted from premium cotton denim. Features classic button closure, chest pockets, and a comfortable regular fit. A wardrobe essential that never goes out of style.',
      category: 'Men Fashion',
      price: 89.99,
      sellerId: sellers[0].id,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500&h=500&fit=crop',
            altText: 'Classic Denim Jacket - Main View',
            sortOrder: 1,
            isPrimary: true,
            type: 'gallery',
          },
          {
            url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500&h=500&fit=crop',
            altText: 'Classic Denim Jacket - Detail View',
            sortOrder: 2,
            isPrimary: false,
            type: 'gallery',
          },
        ],
      },
      variants: {
        create: [
          {
            sku: 'DENIM-CLASSIC-BLUE-M-COT',
            currentStock: 15,
            soldQuantity: 22,
            weight: 0.8,
            isActive: true,
            images: {
              create: [{
                url: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=500&h=500&fit=crop',
                altText: 'Classic Denim Jacket - Blue Medium',
                sortOrder: 1,
                isPrimary: true,
                type: 'variant',
              }],
            },
            attributes: {
              create: [
                { attributeId: colorAttr.id, valueId: findColor('blue')!.id },
                { attributeId: sizeAttr.id, valueId: findSize('m')!.id },
                { attributeId: materialAttr.id, valueId: findMaterial('cotton')!.id },
              ],
            },
          },
          {
            sku: 'DENIM-CLASSIC-BLUE-L-COT',
            currentStock: 12,
            soldQuantity: 18,
            weight: 0.85,
            isActive: true,
            images: {
              create: [{
                url: 'https://images.unsplash.com/photo-1516762689617-e1cfddf819d1?w=500&h=500&fit=crop',
                altText: 'Classic Denim Jacket - Blue Large',
                sortOrder: 1,
                isPrimary: true,
                type: 'variant',
              }],
            },
            attributes: {
              create: [
                { attributeId: colorAttr.id, valueId: findColor('blue')!.id },
                { attributeId: sizeAttr.id, valueId: findSize('l')!.id },
                { attributeId: materialAttr.id, valueId: findMaterial('cotton')!.id },
              ],
            },
          },
        ],
      },
    },
  });

  // Create reviews for products
  const reviewsData = [
    // Nike reviews
    { star: 5, content: 'Love this Nike t-shirt! Great quality and the fit is perfect. Highly recommend!', productId: nikeProduct.id },
    { star: 4, content: 'Good quality shirt, comfortable material. The logo looks great.', productId: nikeProduct.id },
    { star: 5, content: 'Excellent t-shirt. Bought multiple colors. Fast shipping too!', productId: nikeProduct.id },
    
    // Adidas reviews
    { star: 5, content: 'This hoodie is amazing! Super comfortable and warm. Perfect for winter.', productId: adidasProduct.id },
    { star: 4, content: 'Great hoodie, good quality. The three stripes design is classic.', productId: adidasProduct.id },
    
    // Uniqlo reviews
    { star: 5, content: 'Heattech is incredible! Keeps me warm without bulk. Will buy more!', productId: uniqloProduct.id },
    { star: 4, content: 'Great base layer for cold weather. Soft and comfortable.', productId: uniqloProduct.id },
    { star: 5, content: 'Best thermal underwear I have ever owned. Highly recommend!', productId: uniqloProduct.id },
    
    // Denim reviews
    { star: 4, content: 'Classic denim jacket with great quality. Fits as expected.', productId: denimProduct.id },
    { star: 5, content: 'Perfect denim jacket! Great quality and timeless style.', productId: denimProduct.id },
  ];

  await prisma.review.createMany({
    data: reviewsData.map(review => ({ ...review, buyerId: buyer.id })),
  });

  // Create discounts
  await prisma.discount.createMany({
    data: [
      {
        percentage: 20,
        startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        productId: nikeProduct.id,
      },
      {
        percentage: 15,
        startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        productId: uniqloProduct.id,
      },
    ],
  });

  console.log('Database seeded successfully with real products!');
  console.log('Created products:');
  console.log(`- Nike Air Max T-Shirt (ID: ${nikeProduct.id}) - 4 variants`);
  console.log(`- Adidas Three Stripes Hoodie (ID: ${adidasProduct.id}) - 3 variants`);
  console.log(`- Uniqlo Heattech Long Sleeve (ID: ${uniqloProduct.id}) - 4 variants`);
  console.log(`- Classic Denim Jacket (ID: ${denimProduct.id}) - 2 variants`);
  console.log('\nYou can now test the variant functionality with these real products!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });