/*
  Warnings:

  - You are about to drop the column `downvotes` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `upvotes` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the `ReviewVote` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."ReviewVote" DROP CONSTRAINT "ReviewVote_buyerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ReviewVote" DROP CONSTRAINT "ReviewVote_reviewId_fkey";

-- AlterTable
ALTER TABLE "public"."Review" DROP COLUMN "downvotes",
DROP COLUMN "upvotes";

-- DropTable
DROP TABLE "public"."ReviewVote";
