/*
  Warnings:

  - You are about to drop the column `profileImage` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Chore" ALTER COLUMN "dueDate" SET DEFAULT (now() + interval '1 day');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "profileImage";
