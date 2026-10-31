CREATE TABLE `Wallet` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `address` VARCHAR(191) NOT NULL,
    `balance` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Wallet_address_key`(`address`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


ALTER TABLE `User`
ADD COLUMN `walletId` INTEGER NULL;


CREATE INDEX `User_walletId_idx`
ON `User`(`walletId`);


ALTER TABLE `User`
ADD CONSTRAINT `User_walletId_fkey`
FOREIGN KEY (`walletId`)
REFERENCES `Wallet`(`id`)
ON DELETE SET NULL
ON UPDATE CASCADE;