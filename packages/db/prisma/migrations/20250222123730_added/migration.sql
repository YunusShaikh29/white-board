-- CreateEnum
CREATE TYPE "ShapeType" AS ENUM ('RECT', 'CIRCLE', 'PENCIL', 'LINE', 'ARROW', 'RHOMBUS', 'TEXT');

-- CreateTable
CREATE TABLE "Shape" (
    "id" SERIAL NOT NULL,
    "type" "ShapeType" NOT NULL,
    "roomId" INTEGER NOT NULL,
    "x" DOUBLE PRECISION,
    "y" DOUBLE PRECISION,
    "width" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "centerX" DOUBLE PRECISION,
    "centerY" DOUBLE PRECISION,
    "radius" DOUBLE PRECISION,
    "x1" DOUBLE PRECISION,
    "y1" DOUBLE PRECISION,
    "x2" DOUBLE PRECISION,
    "y2" DOUBLE PRECISION,
    "content" TEXT,
    "points" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Shape_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Shape" ADD CONSTRAINT "Shape_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
