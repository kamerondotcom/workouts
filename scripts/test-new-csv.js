const csvData = `Date,Start Time,End Time,Location,Workout Type,Duration (min),Active Calories,Total Calories,Avg Heart Rate (bpm),Effort (1–10),Station,Exercise,Notes
2025-10-24,5:00 PM,6:00 PM,New Gym,Cardio Training,60,500,600,140,8,Station 1,Running,Cardio workout`;

async function testImport() {
  try {
    console.log("🧪 Testing CSV import with completely new data...");

    const response = await fetch("http://localhost:3000/api/import", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ csvText: csvData }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log("✅ Import successful:", result);
    } else {
      console.log("❌ Import failed:", result);
    }
  } catch (error) {
    console.error("❌ Error testing import:", error);
  }
}

testImport();
