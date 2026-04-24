-- AlterTable
ALTER TABLE "Chore" ALTER COLUMN "dueDate" SET DEFAULT (now() + interval '1 day');

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "action" TEXT,
ADD COLUMN     "actorId" INTEGER,
ADD COLUMN     "entityId" INTEGER,
ADD COLUMN     "entityType" TEXT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "profileImage" SET DEFAULT 'https://avatar.iran.liara.run/public/' || floor(random()*100 + 1)::int;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
