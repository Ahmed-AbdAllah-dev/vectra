import { PrismaClient } from '../app/generated/prisma';
import axios from 'axios';

const prisma = new PrismaClient();

// Function to get random images from Picsum Photos
async function getRandomImage(width: number, height: number): Promise<string> {
  const id = Math.floor(Math.random() * 1000) + 1; // Random ID between 1-1000
  return `https://picsum.photos/id/${id}/${width}/${height}`;
}

// Function to generate completely random image data for a product
async function generateProductImages(productId: number, productName: string) {
  const images = [];

  // Generate random image IDs to ensure different images for each product
  const randomImageIds = Array.from({length: 4}, () => Math.floor(Math.random() * 1000) + 1);

  // Primary image (for product card)
  images.push({
    url: await getRandomImage(400, 400),
    altText: `${productName} - Main Product Image`,
    caption: `Featured image of ${productName}`,
    sortOrder: 0,
    isPrimary: true,
    type: 'thumbnail',
    width: 400,
    height: 400,
    format: 'jpg',
    productId: productId,
  });

  // Gallery images (3 additional images) - all different
  for (let i = 1; i <= 3; i++) {
    images.push({
      url: await getRandomImage(800, 600),
      altText: `${productName} - Gallery Image ${i}`,
      caption: `Gallery view ${i} of ${productName}`,
      sortOrder: i,
      isPrimary: false,
      type: 'gallery',
      width: 800,
      height: 600,
      format: 'jpg',
      productId: productId,
    });
  }

  return images;
}

// Main function to seed images for all products
async function seedProductImages() {
  try {
    console.log('Starting image seeding process...');

    // First, delete ALL existing product images
    console.log('Deleting all existing product images...');
    await prisma.productImage.deleteMany({});
    console.log('All existing images deleted successfully!');

    // Get all products
    const products = await prisma.product.findMany();
    console.log(`Found ${products.length} products to process`);

    for (const product of products) {
      console.log(`Adding images to product: ${product.name}`);

      const productImages = await generateProductImages(product.id, product.name);

      // Create images in database
      for (const imageData of productImages) {
        await prisma.productImage.create({
          data: imageData
        });
      }

      console.log(`Added ${productImages.length} images to product: ${product.name}`);

      // Add a small delay to avoid overwhelming the API and ensure different images
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('Image seeding completed successfully!');
    console.log(`Added images to ${products.length} products`);

  } catch (error) {
    console.error('Error seeding images:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Alternative: Use Unsplash API for more variety (requires API key)
async function getUnsplashImage(width: number, height: number, query: string): Promise<string> {
  const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
  
  if (!UNSPLASH_ACCESS_KEY) {
    return getRandomImage(width, height);
  }

  try {
    const response = await axios.get(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&client_id=${UNSPLASH_ACCESS_KEY}`
    );
    return `${response.data.urls.raw}&w=${width}&h=${height}&fit=crop`;
  } catch (error) {
    console.warn('Unsplash API failed, falling back to Picsum');
    return getRandomImage(width, height);
  }
}

// Run the script
seedProductImages();