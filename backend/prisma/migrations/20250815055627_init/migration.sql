-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED');

-- CreateTable
CREATE TABLE "creators" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "solanaAddress" TEXT NOT NULL,
    "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "totalEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "senderAddress" TEXT NOT NULL,
    "receiverAddress" TEXT NOT NULL,
    "amountSOL" DOUBLE PRECISION NOT NULL,
    "usdValue" DOUBLE PRECISION NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creatorId" TEXT NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "creators_email_key" ON "creators"("email");

-- CreateIndex
CREATE UNIQUE INDEX "creators_solanaAddress_key" ON "creators"("solanaAddress");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_txHash_key" ON "transactions"("txHash");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "creators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
