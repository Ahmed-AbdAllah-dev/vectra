
import { hash } from 'bcryptjs'

import prisma from "@/lib/prisma";

async function main() {
  console.log('🌱 Starting seed...')

  // Clean up old data
  console.log('Cleaning up old data...')
  // Delete in correct order to avoid foreign key constraints
  await prisma.cartItem.deleteMany()
  await prisma.cart.deleteMany()
  await prisma.order.deleteMany()
  await prisma.shippingAddress.deleteMany()
  await prisma.review.deleteMany()
  await prisma.discount.deleteMany()
  await prisma.variantAttribute.deleteMany()
  await prisma.variantImage.deleteMany()
  await prisma.productVariant.deleteMany()
  await prisma.productImage.deleteMany()
  await prisma.product.deleteMany()
  await prisma.buyer.deleteMany()
  await prisma.seller.deleteMany()
  await prisma.user.deleteMany()
  await prisma.account.deleteMany()
  await prisma.session.deleteMany()
  await prisma.verificationToken.deleteMany()
  await prisma.attributeValue.deleteMany()
  await prisma.attribute.deleteMany()
  
  console.log('✅ Cleaned up old data.')

  // Create attributes for variants
  console.log('Creating attributes...')
  
  const colors = await prisma.attribute.create({
    data: {
      name: 'color',
      displayName: 'Color',
      type: 'COLOR',
      values: {
        create: [
          { value: 'red', displayName: 'Red', hexColor: '#FF0000' },
          { value: 'blue', displayName: 'Blue', hexColor: '#0000FF' },
          { value: 'green', displayName: 'Green', hexColor: '#00FF00' },
          { value: 'black', displayName: 'Black', hexColor: '#000000' },
          { value: 'white', displayName: 'White', hexColor: '#FFFFFF' },
        ]
      }
    },
    include: { values: true }
  })

  const sizes = await prisma.attribute.create({
    data: {
      name: 'size',
      displayName: 'Size',
      type: 'SIZE',
      values: {
        create: [
          { value: 's', displayName: 'Small' },
          { value: 'm', displayName: 'Medium' },
          { value: 'l', displayName: 'Large' },
          { value: 'xl', displayName: 'Extra Large' },
        ]
      }
    },
    include: { values: true }
  })

  // 1. Create admin user and profiles
  console.log('Creating admin user...')
  const adminPassword = await hash('admin123', 10)
  
  // Create User
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: adminPassword,
      name: 'Admin User',
      phone: '+1234567890',
    }
  })

  // Create Buyer profile (with duplicate fields - matching your schema)
  const adminBuyer = await prisma.buyer.create({
    data: {
      email: 'admin@example.com',  // Duplicate of User.email
      password: adminPassword,      // Duplicate of User.password
      name: 'Admin User',           // Duplicate of User.name
      userId: adminUser.id,
    }
  })

  // Create Seller profile (with duplicate fields)
  const adminSeller = await prisma.seller.create({
    data: {
      email: 'admin@example.com',   // Duplicate of User.email
      password: adminPassword,      // Duplicate of User.password
      name: 'Admin User',           // Duplicate of User.name
      userId: adminUser.id,
    }
  })

  console.log('✅ Created admin with both buyer and seller profiles')

  // 2. Create sellers
  console.log('Creating sellers...')
  const sellers = []
  const sellerData = [
    { email: 'tech@store.com', name: 'Tech Store', phone: '+1112223333' },
    { email: 'fashion@store.com', name: 'Fashion Store', phone: '+4445556666' },
    { email: 'home@store.com', name: 'Home Store', phone: '+7778889999' },
  ]

  for (const data of sellerData) {
    const password = await hash('password123', 10)
    
    // Create User
    const sellerUser = await prisma.user.create({
      data: {
        email: data.email,
        password: password,
        name: data.name,
        phone: data.phone,
      }
    })

    // Create Seller profile
    const seller = await prisma.seller.create({
      data: {
        email: data.email,     // Duplicate
        password: password,    // Duplicate
        name: data.name,       // Duplicate
        phone: data.phone,     // Duplicate
        userId: sellerUser.id,
      }
    })
    
    sellers.push(seller)
    console.log(`  Created seller: ${data.name}`)
  }

  // 3. Create buyers
  console.log('Creating buyers...')
  const buyers = []
  const buyerData = [
    { email: 'john@example.com', name: 'John Doe', phone: '+1111111111' },
    { email: 'jane@example.com', name: 'Jane Smith', phone: '+2222222222' },
    { email: 'bob@example.com', name: 'Bob Johnson', phone: '+3333333333' },
    { email: 'alice@example.com', name: 'Alice Brown', phone: '+4444444444' },
  ]

  for (const data of buyerData) {
    const password = await hash('password123', 10)
    
    // Create User
    const buyerUser = await prisma.user.create({
      data: {
        email: data.email,
        password: password,
        name: data.name,
        phone: data.phone,
      }
    })

    // Create Buyer profile
    const buyer = await prisma.buyer.create({
      data: {
        email: data.email,     // Duplicate
        password: password,    // Duplicate
        name: data.name,       // Duplicate
        phone: data.phone,     // Duplicate
        userId: buyerUser.id,
      }
    })
    
    buyers.push(buyer)
    console.log(`  Created buyer: ${data.name}`)
  }

  // 4. Create products for each seller
  console.log('Creating products...')
  const categories = ['Electronics', 'Clothing', 'Home & Kitchen', 'Books', 'Sports', 'Beauty']
  const products = []

  for (const [index, seller] of sellers.entries()) {
    const productCount = 15 // 15 products per seller
    
    for (let i = 1; i <= productCount; i++) {
      const productNum = (index * productCount) + i
      const category = categories[Math.floor(Math.random() * categories.length)]
      const price = parseFloat((Math.random() * 300 + 10).toFixed(2))
      const isBestSeller = Math.random() > 0.7
      
      const product = await prisma.product.create({
        data: {
          name: `${category} Product ${productNum}`,
          description: `High-quality ${category.toLowerCase()} product. Perfect for everyday use.`,
          category,
          price,
          bestSelling: isBestSeller,
          sellerId: seller.id,
          images: {
            create: [
              {
                url: `https://picsum.photos/seed/product${productNum}/400/400`,
                altText: `${category} Product ${productNum}`,
                isPrimary: true,
                sortOrder: 0,
                width: 400,
                height: 400,
                format: 'jpg'
              },
              {
                url: `https://picsum.photos/seed/product${productNum}-2/400/400`,
                altText: `${category} Product ${productNum} - Alternative view`,
                isPrimary: false,
                sortOrder: 1,
                width: 400,
                height: 400,
                format: 'jpg'
              }
            ]
          },
          variants: {
            create: [
              {
                sku: `SKU-${seller.id}-${productNum}-001`,
                currentStock: Math.floor(Math.random() * 100) + 10,
                soldQuantity: Math.floor(Math.random() * 50),
                isActive: true,
                weight: parseFloat((Math.random() * 2).toFixed(2)),
                // Add variant attributes
                attributes: {
                  create: [
                    {
                      attributeId: colors.id,
                      valueId: colors.values[Math.floor(Math.random() * colors.values.length)].id
                    },
                    {
                      attributeId: sizes.id,
                      valueId: sizes.values[Math.floor(Math.random() * sizes.values.length)].id
                    }
                  ]
                }
              },
              {
                sku: `SKU-${seller.id}-${productNum}-002`,
                currentStock: Math.floor(Math.random() * 50) + 5,
                soldQuantity: Math.floor(Math.random() * 30),
                isActive: true,
                weight: parseFloat((Math.random() * 2).toFixed(2)),
                // Add variant attributes
                attributes: {
                  create: [
                    {
                      attributeId: colors.id,
                      valueId: colors.values[Math.floor(Math.random() * colors.values.length)].id
                    },
                    {
                      attributeId: sizes.id,
                      valueId: sizes.values[Math.floor(Math.random() * sizes.values.length)].id
                    }
                  ]
                }
              }
            ]
          }
        }
      })
      
      products.push(product)
      
      // Add discount to 30% of products
      if (Math.random() > 0.7) {
        await prisma.discount.create({
          data: {
            percentage: parseFloat((Math.random() * 30 + 10).toFixed(1)), // 10-40% off
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            productId: product.id
          }
        })
      }
    }
    
    console.log(`  Created ${productCount} products for ${seller.name}`)
  }

  // 5. Create reviews
  console.log('Creating reviews...')
  for (const product of products.slice(0, 20)) { // Add reviews to first 20 products
    const reviewCount = Math.floor(Math.random() * 4) + 1 // 1-4 reviews per product
    
    for (let i = 0; i < reviewCount; i++) {
      const buyer = buyers[Math.floor(Math.random() * buyers.length)]
      
      await prisma.review.create({
        data: {
          star: Math.floor(Math.random() * 3) + 3, // 3-5 stars
          content: [
            'Great product! Very satisfied with my purchase.',
            'Good quality for the price. Would recommend.',
            'Exactly as described. Fast shipping.',
            'Product met my expectations. Works well.',
            'Excellent value. Will buy again.'
          ][Math.floor(Math.random() * 5)],
          productId: product.id,
          buyerId: buyer.id,
        }
      })
    }
  }

  // 6. Create shipping addresses for buyers
  console.log('Creating shipping addresses...')
  for (const buyer of buyers) {
    await prisma.shippingAddress.create({
      data: {
        fullName: buyer.name,
        email: buyer.email,
        phone: buyer.phone || '+1234567890',
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'United States',
        buyerId: buyer.id,
      }
    })
  }

  // 7. Create some orders
  console.log('Creating orders...')
  const orderStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED']
  const paymentMethods = ['CREDIT_CARD', 'PAYPAL', 'PAY_ON_DELIVERY']
  
  for (let i = 0; i < 10; i++) {
    const buyer = buyers[Math.floor(Math.random() * buyers.length)]
    const product = products[Math.floor(Math.random() * products.length)]
    const variant = await prisma.productVariant.findFirst({
      where: { productId: product.id }
    })
    const seller = sellers.find(s => s.id === product.sellerId)
    
    if (seller && variant) {
      const quantity = Math.floor(Math.random() * 3) + 1
      const subtotal = product.price * quantity
      const tax = subtotal * 0.08
      const shipping = 5.99
      const total = subtotal + tax + shipping
      
      await prisma.order.create({
        data: {
          quantity,
          status: orderStatuses[Math.floor(Math.random() * orderStatuses.length)],
          subtotal,
          tax,
          shipping,
          total,
          paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
          buyerId: buyer.id,
          sellerId: seller.id,
          productId: product.id,
          variantId: variant.id,
        }
      })
    }
  }

  // 8. Create some cart items
  console.log('Creating cart items...')
  for (const buyer of buyers.slice(0, 2)) { // Add to first 2 buyers' carts
    const cart = await prisma.cart.create({
      data: {
        buyerId: buyer.id,
      }
    })
    
    // Add 1-3 items to cart
    const cartItemsCount = Math.floor(Math.random() * 3) + 1
    for (let i = 0; i < cartItemsCount; i++) {
      const product = products[Math.floor(Math.random() * products.length)]
      const variant = await prisma.productVariant.findFirst({
        where: { productId: product.id }
      })
      
      if (variant) {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            variantId: variant.id,
            quantity: Math.floor(Math.random() * 2) + 1,
          }
        })
      }
    }
  }

  console.log('\n✅ Seed completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`  Users: ${await prisma.user.count()}`)
  console.log(`  Buyers: ${await prisma.buyer.count()}`)
  console.log(`  Sellers: ${await prisma.seller.count()}`)
  console.log(`  Products: ${await prisma.product.count()}`)
  console.log(`  Product Variants: ${await prisma.productVariant.count()}`)
  console.log(`  Reviews: ${await prisma.review.count()}`)
  console.log(`  Orders: ${await prisma.order.count()}`)
  console.log(`  Cart Items: ${await prisma.cartItem.count()}`)
  
  console.log('\n🔑 Default login credentials:')
  console.log('  Admin User (both buyer & seller):')
  console.log('    Email: admin@example.com')
  console.log('    Password: admin123')
  console.log('\n  Sellers:')
  console.log('    tech@store.com / password123')
  console.log('    fashion@store.com / password123')
  console.log('    home@store.com / password123')
  console.log('\n  Buyers:')
  console.log('    john@example.com / password123')
  console.log('    jane@example.com / password123')
  console.log('    bob@example.com / password123')
  console.log('    alice@example.com / password123')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })