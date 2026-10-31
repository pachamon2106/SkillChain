-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 04, 2026 at 11:47 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `skillchain`
--

-- --------------------------------------------------------

--
-- Table structure for table `conversation`
--

CREATE TABLE `conversation` (
  `id` int(11) NOT NULL,
  `user1Id` int(11) NOT NULL,
  `user2Id` int(11) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `conversation`
--

INSERT INTO `conversation` (`id`, `user1Id`, `user2Id`, `createdAt`, `updatedAt`) VALUES
(1, 1, 2, '2026-10-04 20:03:55.869', '2026-10-04 20:06:31.145');

-- --------------------------------------------------------

--
-- Table structure for table `enrollment`
--

CREATE TABLE `enrollment` (
  `id` int(11) NOT NULL,
  `skillId` int(11) NOT NULL,
  `studentId` int(11) NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'active',
  `paidAmount` int(11) NOT NULL DEFAULT 0,
  `paymentTxHash` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `enrollment`
--

INSERT INTO `enrollment` (`id`, `skillId`, `studentId`, `status`, `paidAmount`, `paymentTxHash`, `createdAt`, `updatedAt`) VALUES
(1, 3, 2, 'active', 0, NULL, '2026-09-30 00:46:13.647', '2026-09-30 00:46:13.647'),
(2, 2, 2, 'active', 20, '0xefe0ca5bb01479e96c007a5ff3bc7e1c25b8c24a4c06dacd7a2dd0add4fdef80', '2026-09-30 00:50:09.381', '2026-10-04 18:03:21.878');

-- --------------------------------------------------------

--
-- Table structure for table `lesson`
--

CREATE TABLE `lesson` (
  `id` int(11) NOT NULL,
  `skillId` int(11) NOT NULL,
  `title` varchar(191) NOT NULL,
  `content` longtext NOT NULL,
  `videoUrl` varchar(191) DEFAULT NULL,
  `position` int(11) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `lesson`
--

INSERT INTO `lesson` (`id`, `skillId`, `title`, `content`, `videoUrl`, `position`, `createdAt`, `updatedAt`) VALUES
(1, 2, 'CSS คืออะไร', 'CSS ย่อมาจาก Cascading Style Sheets ใช้สำหรับกำหนดรูปแบบและการแสดงผลของ HTML เช่น สี ตัวอักษร ขนาด ระยะห่าง และการจัดวางองค์ประกอบบนหน้าเว็บ', NULL, 1, '2026-10-04 16:42:53.408', '2026-10-04 16:42:53.408'),
(2, 2, 'CSS Selector 2', 'CSS Selector ใช้สำหรับเลือก Element ใน HTML ที่เราต้องการกำหนดรูปแบบ เช่นเลือกด้วยชื่อ Tag, Class และ ID', NULL, 2, '2026-10-04 17:22:11.191', '2026-10-04 17:48:24.038'),
(4, 2, 'css 3', 'wdwadwdwajqdwada', 'https://youtu.be/j4_JBL3BXCQ?si=cRy-MjJXQZ9dBOnW', 3, '2026-10-04 18:03:21.858', '2026-10-04 18:22:26.123');

-- --------------------------------------------------------

--
-- Table structure for table `lessonprogress`
--

CREATE TABLE `lessonprogress` (
  `id` int(11) NOT NULL,
  `lessonId` int(11) NOT NULL,
  `enrollmentId` int(11) NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'not_started',
  `lastViewedAt` datetime(3) DEFAULT NULL,
  `completedAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `lessonprogress`
--

INSERT INTO `lessonprogress` (`id`, `lessonId`, `enrollmentId`, `status`, `lastViewedAt`, `completedAt`, `createdAt`, `updatedAt`) VALUES
(1, 1, 2, 'completed', '2026-10-04 17:16:35.874', '2026-10-04 17:16:35.874', '2026-10-04 17:07:38.730', '2026-10-04 17:16:35.878'),
(2, 2, 2, 'completed', '2026-10-04 18:02:32.741', '2026-10-04 18:02:32.741', '2026-10-04 17:27:40.570', '2026-10-04 18:02:32.744');

-- --------------------------------------------------------

--
-- Table structure for table `message`
--

CREATE TABLE `message` (
  `id` int(11) NOT NULL,
  `conversationId` int(11) NOT NULL,
  `senderId` int(11) NOT NULL,
  `content` text NOT NULL,
  `readAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `message`
--

INSERT INTO `message` (`id`, `conversationId`, `senderId`, `content`, `readAt`, `createdAt`) VALUES
(1, 1, 1, 'สวัสดีครับ', '2026-10-04 20:04:23.406', '2026-10-04 20:04:02.654'),
(2, 1, 2, 'ครับ', '2026-10-04 20:04:38.656', '2026-10-04 20:04:27.453'),
(3, 1, 1, 'ทดสอบระบบครับ', '2026-10-04 20:06:37.964', '2026-10-04 20:06:31.146');

-- --------------------------------------------------------

--
-- Table structure for table `session`
--

CREATE TABLE `session` (
  `id` int(11) NOT NULL,
  `token` varchar(191) NOT NULL,
  `userId` int(11) NOT NULL,
  `expiresAt` datetime(3) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `walletNonce` varchar(191) DEFAULT NULL,
  `walletNonceExpires` datetime(3) DEFAULT NULL,
  `connectedWalletAddress` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `session`
--

INSERT INTO `session` (`id`, `token`, `userId`, `expiresAt`, `createdAt`, `walletNonce`, `walletNonceExpires`, `connectedWalletAddress`) VALUES
(1, '00d6ef372c1405d031bd8bbe2d807e4c2f6859b11ba8f3f855daade79311ba28', 1, '2026-10-05 08:52:52.603', '2026-09-28 08:52:52.615', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `skill`
--

CREATE TABLE `skill` (
  `id` int(11) NOT NULL,
  `title` varchar(191) NOT NULL,
  `description` varchar(191) NOT NULL,
  `price` int(11) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `ownerId` int(11) NOT NULL,
  `payoutAddress` varchar(191) DEFAULT NULL,
  `category` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `skill`
--

INSERT INTO `skill` (`id`, `title`, `description`, `price`, `createdAt`, `ownerId`, `payoutAddress`, `category`) VALUES
(1, 'พื้นฐาน React สำหรับผู้เริ่มต้น', 'เรียนรู้พื้นฐาน React ตั้งแต่ Component, Props, State และการสร้างหน้าเว็บแบบ Interactive', 30, '2026-09-29 23:41:19.675', 1, NULL, NULL),
(2, 'CSS สำหรับผู้เริ่มต้น', 'เรียนรู้ CSS ตั้งแต่การจัดสี ตัวอักษร Box Model และ Layout เบื้องต้น', 20, '2026-09-30 00:33:59.860', 1, '0xda8cd1491c018c7c5b78df2d7504e53925d6c928', NULL),
(3, 'HTML เบื้องต้น', 'เรียนรู้โครงสร้าง HTML สำหรับผู้เริ่มต้น', 0, '2026-09-30 00:45:44.018', 1, NULL, NULL),
(4, 'JavaScript สำหรับผู้เริ่มต้น', 'เรียนรู้พื้นฐาน JavaScript ตั้งแต่ตัวแปร ชนิดข้อมูล เงื่อนไข การวนลูป ฟังก์ชัน และการนำ JavaScript ไปใช้งานร่วมกับเว็บไซต์ เหมาะสำหรับผู้เริ่มต้นที่ยังไม่มีพื้นฐาน', 15, '2026-10-04 19:31:44.666', 1, '0xda8cd1491c018c7c5b78df2d7504e53925d6c928', 'Programming'),
(5, 'ภาษาอังกฤษเพื่อการสื่อสารในชีวิตประจำวัน', 'ฝึกประโยคพื้นฐานสำหรับการทักทาย แนะนำตัว ถามทาง ซื้อของ สั่งอาหาร และการสนทนาในสถานการณ์ที่ใช้บ่อย เหมาะสำหรับผู้เริ่มต้น', 10, '2026-10-04 19:33:25.544', 1, '0xda8cd1491c018c7c5b78df2d7504e53925d6c928', 'ภาษา');

-- --------------------------------------------------------

--
-- Table structure for table `transaction`
--

CREATE TABLE `transaction` (
  `id` int(11) NOT NULL,
  `walletId` int(11) NOT NULL,
  `type` varchar(191) NOT NULL,
  `amount` int(11) NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `id` int(11) NOT NULL,
  `name` varchar(191) DEFAULT NULL,
  `email` varchar(191) NOT NULL,
  `passwordHash` varchar(191) NOT NULL,
  `walletAddress` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `walletId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`id`, `name`, `email`, `passwordHash`, `walletAddress`, `createdAt`, `updatedAt`, `walletId`) VALUES
(1, 'Test User', 'test@example.com', '$2b$12$.vqIATCB4JM1jhLz4f.lm.SiM4FSlES1BSWzkST4E/vXvlXWaRY8C', NULL, '2026-09-28 08:32:23.905', '2026-09-28 09:52:03.935', 1),
(2, 'หมู ปิ้ง', 'mp@gmail.com', '$2b$12$sxSSO.mtVWK8R/Dg75QYBO/GY4fgeUKmgIbqD7z3HlCWCzPzW9QHe', NULL, '2026-09-29 19:10:51.426', '2026-10-04 18:54:05.588', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `wallet`
--

CREATE TABLE `wallet` (
  `id` int(11) NOT NULL,
  `address` varchar(191) NOT NULL,
  `balance` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `wallet`
--

INSERT INTO `wallet` (`id`, `address`, `balance`, `createdAt`, `updatedAt`) VALUES
(1, '0xDa8cd1491c018C7c5B78DF2D7504e53925d6C928', 350, '2026-09-28 08:32:23.734', '2026-09-28 08:32:23.734');

-- --------------------------------------------------------

--
-- Table structure for table `walletdirectory`
--

CREATE TABLE `walletdirectory` (
  `id` int(11) NOT NULL,
  `address` varchar(191) NOT NULL,
  `userId` int(11) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `walletdirectory`
--

INSERT INTO `walletdirectory` (`id`, `address`, `userId`, `createdAt`, `updatedAt`) VALUES
(1, '0x30d1045996b4c0ad1bea2a28afa25296f8754bcf', 2, '2026-09-29 21:08:28.689', '2026-10-04 18:54:05.653'),
(2, '0xda8cd1491c018c7c5b78df2d7504e53925d6c928', 1, '2026-09-29 21:08:43.082', '2026-10-04 19:31:39.193');

-- --------------------------------------------------------

--
-- Table structure for table `_prisma_migrations`
--

CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) NOT NULL,
  `checksum` varchar(64) NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) NOT NULL,
  `logs` text DEFAULT NULL,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `applied_steps_count` int(10) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `_prisma_migrations`
--

INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`) VALUES
('13d9ca74-7f53-4f1d-a137-55cc009e604f', '3dcc2d8cbd7f49abc8a27b85691f44544f4bbdaee6846b6d1ab3514f5b0363f6', '2026-09-30 00:07:36.602', '20260930000729_add_enrollment', NULL, NULL, '2026-09-30 00:07:29.672', 1),
('1c608e32-0ee2-4b2e-8040-7647685646f2', '712ba372a0340d5c1dd4d8a4116517d7f4400a2bc639dd4f8b1e4423beccc459', '2026-09-28 08:28:10.162', '20260928080000_add_wallet_table', NULL, NULL, '2026-09-28 08:28:06.864', 1),
('3c74c2ac-f20c-4dd3-adbb-b302a26bce7e', 'e11ee845a18f7d06c35af2ecfa1b87ccdd633e2cb985e2a7ad95d250fec02af4', '2026-10-04 19:57:21.844', '20261004195712_add_messaging', NULL, NULL, '2026-10-04 19:57:12.717', 1),
('5623abba-b949-4d0f-bb10-6770e2dfef84', '546508a51a717952ce986e579a4426590630b4c85de457c8a3388a50bf794a65', '2026-10-04 18:56:56.362', '20261004185655_add_skill_category', NULL, NULL, '2026-10-04 18:56:55.740', 1),
('59a96611-281b-4763-8879-6139c14b217e', '9abf607096b598736f67782157ccbb3e4610343e8ef1e6a495e27c1033cee496', '2026-09-30 01:02:06.016', '20260930010159_add_lessons_and_progress', NULL, NULL, '2026-09-30 01:01:59.390', 1),
('7e95b88d-fdd5-4562-acce-e8ccccd613cd', 'c72977113352d32e935774606380381759d9e4ba5c3b658360357e434fed8567', '2026-09-29 21:01:21.002', '20260929210119_add_wallet_directory', NULL, NULL, '2026-09-29 21:01:19.259', 1),
('b3c037b5-c263-41f6-bdcf-4282bc7eb9eb', 'ad46cdd8348de3be5fd09e160b7c7c7b77ac9c0b26f5aafdeea439c6c0eb8776', '2026-09-30 00:13:37.863', '20260930001337_add_skill_payout_address', NULL, NULL, '2026-09-30 00:13:37.315', 1),
('bf2996d1-b507-4e34-9aec-dfbc5a450b8f', '95212c7a81d27dd5c3decdf3efea0441d6d63ceba9d3df180a4da550cdff7a2d', '2026-09-28 08:28:32.355', '20260928082830_add_transaction_table', NULL, NULL, '2026-09-28 08:28:30.400', 1),
('ca4666f4-bc5e-458b-9078-685b50696d88', '1a8c6d4f1cac7df927381721c16be0e2f2eb05b41ca9dcd8ce64b23230fdadfd', '2026-09-28 08:28:06.789', '0000_baseline', NULL, NULL, '2026-09-28 08:28:03.516', 1),
('f1caf1de-a09c-48af-8664-2bd0aea007a1', '62a416e2835d05fd3587ce4f3cede9cc61938bc61b63f86e4d5eda5ee4b8d9a3', '2026-09-29 20:12:58.246', '20260929201257_add_session_connected_wallet', NULL, NULL, '2026-09-29 20:12:57.540', 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `conversation`
--
ALTER TABLE `conversation`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Conversation_user1Id_user2Id_key` (`user1Id`,`user2Id`),
  ADD KEY `Conversation_user1Id_idx` (`user1Id`),
  ADD KEY `Conversation_user2Id_idx` (`user2Id`),
  ADD KEY `Conversation_updatedAt_idx` (`updatedAt`);

--
-- Indexes for table `enrollment`
--
ALTER TABLE `enrollment`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Enrollment_skillId_studentId_key` (`skillId`,`studentId`),
  ADD UNIQUE KEY `Enrollment_paymentTxHash_key` (`paymentTxHash`),
  ADD KEY `Enrollment_skillId_idx` (`skillId`),
  ADD KEY `Enrollment_studentId_idx` (`studentId`),
  ADD KEY `Enrollment_status_idx` (`status`);

--
-- Indexes for table `lesson`
--
ALTER TABLE `lesson`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Lesson_skillId_position_key` (`skillId`,`position`),
  ADD KEY `Lesson_skillId_idx` (`skillId`);

--
-- Indexes for table `lessonprogress`
--
ALTER TABLE `lessonprogress`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `LessonProgress_lessonId_enrollmentId_key` (`lessonId`,`enrollmentId`),
  ADD KEY `LessonProgress_lessonId_idx` (`lessonId`),
  ADD KEY `LessonProgress_enrollmentId_idx` (`enrollmentId`),
  ADD KEY `LessonProgress_status_idx` (`status`);

--
-- Indexes for table `message`
--
ALTER TABLE `message`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Message_conversationId_idx` (`conversationId`),
  ADD KEY `Message_conversationId_createdAt_idx` (`conversationId`,`createdAt`),
  ADD KEY `Message_senderId_idx` (`senderId`),
  ADD KEY `Message_readAt_idx` (`readAt`);

--
-- Indexes for table `session`
--
ALTER TABLE `session`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Session_token_key` (`token`),
  ADD KEY `Session_userId_idx` (`userId`),
  ADD KEY `Session_connectedWalletAddress_idx` (`connectedWalletAddress`);

--
-- Indexes for table `skill`
--
ALTER TABLE `skill`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Skill_ownerId_idx` (`ownerId`),
  ADD KEY `Skill_category_idx` (`category`);

--
-- Indexes for table `transaction`
--
ALTER TABLE `transaction`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Transaction_walletId_idx` (`walletId`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `User_email_key` (`email`),
  ADD UNIQUE KEY `User_walletAddress_key` (`walletAddress`),
  ADD KEY `User_walletId_idx` (`walletId`);

--
-- Indexes for table `wallet`
--
ALTER TABLE `wallet`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Wallet_address_key` (`address`);

--
-- Indexes for table `walletdirectory`
--
ALTER TABLE `walletdirectory`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `WalletDirectory_address_key` (`address`),
  ADD KEY `WalletDirectory_userId_idx` (`userId`);

--
-- Indexes for table `_prisma_migrations`
--
ALTER TABLE `_prisma_migrations`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `conversation`
--
ALTER TABLE `conversation`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `enrollment`
--
ALTER TABLE `enrollment`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `lesson`
--
ALTER TABLE `lesson`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `lessonprogress`
--
ALTER TABLE `lessonprogress`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `message`
--
ALTER TABLE `message`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `session`
--
ALTER TABLE `session`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `skill`
--
ALTER TABLE `skill`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `transaction`
--
ALTER TABLE `transaction`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `wallet`
--
ALTER TABLE `wallet`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `walletdirectory`
--
ALTER TABLE `walletdirectory`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `conversation`
--
ALTER TABLE `conversation`
  ADD CONSTRAINT `Conversation_user1Id_fkey` FOREIGN KEY (`user1Id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Conversation_user2Id_fkey` FOREIGN KEY (`user2Id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `enrollment`
--
ALTER TABLE `enrollment`
  ADD CONSTRAINT `Enrollment_skillId_fkey` FOREIGN KEY (`skillId`) REFERENCES `skill` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Enrollment_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `lesson`
--
ALTER TABLE `lesson`
  ADD CONSTRAINT `Lesson_skillId_fkey` FOREIGN KEY (`skillId`) REFERENCES `skill` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `lessonprogress`
--
ALTER TABLE `lessonprogress`
  ADD CONSTRAINT `LessonProgress_enrollmentId_fkey` FOREIGN KEY (`enrollmentId`) REFERENCES `enrollment` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `LessonProgress_lessonId_fkey` FOREIGN KEY (`lessonId`) REFERENCES `lesson` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `message`
--
ALTER TABLE `message`
  ADD CONSTRAINT `Message_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `conversation` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Message_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `session`
--
ALTER TABLE `session`
  ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `skill`
--
ALTER TABLE `skill`
  ADD CONSTRAINT `Skill_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `transaction`
--
ALTER TABLE `transaction`
  ADD CONSTRAINT `Transaction_walletId_fkey` FOREIGN KEY (`walletId`) REFERENCES `wallet` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `user`
--
ALTER TABLE `user`
  ADD CONSTRAINT `User_walletId_fkey` FOREIGN KEY (`walletId`) REFERENCES `wallet` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `walletdirectory`
--
ALTER TABLE `walletdirectory`
  ADD CONSTRAINT `WalletDirectory_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
