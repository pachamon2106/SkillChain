-- AlterTable
ALTER TABLE `session` ADD COLUMN `connectedWalletAddress` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Session_connectedWalletAddress_idx` ON `Session`(`connectedWalletAddress`);
