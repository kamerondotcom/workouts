-- CreateTable
CREATE TABLE "Workout" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "workoutType" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "activeCalories" INTEGER NOT NULL,
    "totalCalories" INTEGER NOT NULL,
    "avgHeartRate" INTEGER NOT NULL,
    "effort" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutComponent" (
    "id" TEXT NOT NULL,
    "workoutId" TEXT NOT NULL,
    "component" TEXT NOT NULL,
    "exercise" TEXT NOT NULL,
    "notes" TEXT,
    "orderInSession" INTEGER NOT NULL DEFAULT 0,
    "isWeightTracked" BOOLEAN NOT NULL DEFAULT false,
    "weight" DOUBLE PRECISION,
    "reps" INTEGER,
    "sets" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutSet" (
    "id" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "setNumber" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "reps" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutCategory" (
    "workoutId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkoutCategory_pkey" PRIMARY KEY ("workoutId","categoryId")
);

-- CreateIndex
CREATE INDEX "Workout_date_idx" ON "Workout"("date");

-- CreateIndex
CREATE INDEX "Workout_location_idx" ON "Workout"("location");

-- CreateIndex
CREATE INDEX "Workout_workoutType_idx" ON "Workout"("workoutType");

-- CreateIndex
CREATE INDEX "WorkoutComponent_workoutId_idx" ON "WorkoutComponent"("workoutId");

-- CreateIndex
CREATE INDEX "WorkoutComponent_workoutId_orderInSession_idx" ON "WorkoutComponent"("workoutId", "orderInSession");

-- CreateIndex
CREATE INDEX "WorkoutSet_componentId_idx" ON "WorkoutSet"("componentId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutSet_componentId_setNumber_key" ON "WorkoutSet"("componentId", "setNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE INDEX "WorkoutCategory_workoutId_idx" ON "WorkoutCategory"("workoutId");

-- CreateIndex
CREATE INDEX "WorkoutCategory_categoryId_idx" ON "WorkoutCategory"("categoryId");

-- AddForeignKey
ALTER TABLE "WorkoutComponent" ADD CONSTRAINT "WorkoutComponent_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSet" ADD CONSTRAINT "WorkoutSet_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "WorkoutComponent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutCategory" ADD CONSTRAINT "WorkoutCategory_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutCategory" ADD CONSTRAINT "WorkoutCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
