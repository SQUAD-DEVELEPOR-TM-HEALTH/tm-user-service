-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `nik` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `dob` DATETIME(3) NULL,
    `gender` VARCHAR(191) NULL,
    `agreement` BOOLEAN NOT NULL DEFAULT false,
    `password` VARCHAR(191) NULL,
    `link_photo` VARCHAR(191) NULL,
    `phone_number` VARCHAR(191) NULL,
    `phone_code` VARCHAR(191) NULL,
    `token_fcm` VARCHAR(191) NULL,
    `google_id` VARCHAR(191) NULL,
    `auth_provider` VARCHAR(191) NULL DEFAULT 'local',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_nik_key`(`nik`),
    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_google_id_key`(`google_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `verifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `otp` VARCHAR(191) NOT NULL,
    `user_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `verifications` ADD CONSTRAINT `verifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
