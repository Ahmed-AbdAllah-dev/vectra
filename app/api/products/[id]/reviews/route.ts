// app/api/products/[id]/reviews/route.ts

import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import  prisma  from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id);
    
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    // Check if user is authenticated
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'You must be logged in to add a review' },
        { status: 401 }
      );
    }

    // Get buyer information
    const buyer = await prisma.buyer.findUnique({
      where: { email: session.user.email }
    });

    if (!buyer) {
      return NextResponse.json(
        { error: 'Buyer not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const { star, content } = await request.json();

    // Validate input
    if (!star || star < 1 || star > 5) {
      return NextResponse.json(
        { error: 'Star rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Review content is required' },
        { status: 400 }
      );
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: 'Review content must be less than 1000 characters' },
        { status: 400 }
      );
    }

    // Check if user has ordered this product
    const hasOrdered = await prisma.order.findFirst({
      where: {
        buyerId: buyer.id,
        OR: [
          { productId: productId },
          { variant: { productId: productId } }
        ],
        status: 'DELIVERED' // Only allow reviews for delivered orders
      }
    });

    if (!hasOrdered) {
      return NextResponse.json(
        { error: 'You can only review products you have purchased and received' },
        { status: 403 }
      );
    }

    // Check if user has already reviewed this product
    const existingReview = await prisma.review.findFirst({
      where: {
        productId: productId,
        buyerId: buyer.id
      }
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this product' },
        { status: 409 }
      );
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        star,
        content: content.trim(),
        productId,
        buyerId: buyer.id
      },
      include: {
        buyer: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json(review, { status: 201 });

  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
    
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id);
    
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    // Get URL search parameters for pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'createdAt'; // 'createdAt', 'star'
    const sortOrder = searchParams.get('sortOrder') || 'desc'; // 'asc', 'desc'
    const starFilter = searchParams.get('star') ? parseInt(searchParams.get('star')!) : null;

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build where clause for filtering
    const whereClause: any = {
      productId: productId
    };

    if (starFilter && starFilter >= 1 && starFilter <= 5) {
      whereClause.star = starFilter;
    }

    // Build orderBy clause
    let orderBy: any = {};
    if (sortBy === 'star') {
      orderBy.star = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    // Fetch reviews with buyer information
    const [reviews, totalCount, averageRating] = await Promise.all([
      prisma.review.findMany({
        where: whereClause,
        include: {
          buyer: {
            select: {
              id: true,
              name: true,
              // Don't include sensitive information like email or password
            }
          }
        },
        orderBy,
        skip: offset,
        take: limit,
      }),
      
      // Get total count for pagination
      prisma.review.count({
        where: whereClause
      }),
      
      // Calculate average rating
      prisma.review.aggregate({
        where: {
          productId: productId
        },
        _avg: {
          star: true
        },
        _count: {
          star: true
        }
      })
    ]);

    // Calculate rating distribution
    const ratingDistribution = await prisma.review.groupBy({
      by: ['star'],
      where: {
        productId: productId
      },
      _count: {
        star: true
      },
      orderBy: {
        star: 'desc'
      }
    });

    // Transform rating distribution to a more usable format
    const ratingCounts = [5, 4, 3, 2, 1].map(star => {
      const found = ratingDistribution.find(item => item.star === star);
      return found ? found._count.star : 0;
    });

    const response = {
      reviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1,
      },
      statistics: {
        averageRating: averageRating._avg.star || 0,
        totalReviews: averageRating._count.star || 0,
        ratingDistribution: {
          5: ratingCounts[0],
          4: ratingCounts[1],
          3: ratingCounts[2],
          2: ratingCounts[3],
          1: ratingCounts[4],
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching product reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}