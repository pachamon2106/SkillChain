-- AlterTable
ALTER TABLE `skill` ADD COLUMN `category` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Skill_category_idx` ON `Skill`(`category`);
