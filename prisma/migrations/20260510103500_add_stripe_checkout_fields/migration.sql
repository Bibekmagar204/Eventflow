-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELED', 'REFUNDED');

-- AlterTable
ALTER TABLE "Order"
ADD COLUMN "amountCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'usd',
ADD COLUMN "paymentProvider" TEXT,
ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "stripePaymentIntentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_stripePaymentIntentId_key" ON "Order"("stripePaymentIntentId");
