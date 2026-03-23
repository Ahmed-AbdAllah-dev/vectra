/*
  Warnings:

  - Added the required column `password` to the `Buyer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `Seller` table without a default value. This is not possible if the table is not empty.

*/
-- Step 1: Add nullable column first
ALTER TABLE "Buyer" ADD COLUMN "password" TEXT;
ALTER TABLE "Seller" ADD COLUMN "password" TEXT;

-- Step 2: Set temporary password for existing records
UPDATE "Buyer" SET "password" = 'temp_password_needs_reset_' || id;
UPDATE "Seller" SET "password" = 'temp_password_needs_reset_' || id;

-- Step 3: Now make the column non-nullable
ALTER TABLE "Buyer" ALTER COLUMN "password" SET NOT NULL;
ALTER TABLE "Seller" ALTER COLUMN "password" SET NOT NULL;
