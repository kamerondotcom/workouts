const csvData = `Date,Location,Workout Type,Duration (min),Active Calories,Total Calories,Avg Heart Rate (bpm),Effort (1-10),Component,Exercise,Notes
2025-10-21,The Yard Gym,Functional Strength,48,374,465,133,7,Component 1,5 Barbell Back Squat,`;

async function testImport() {
  try {
    console.log("🧪 Testing CSV import with screenshot format...");

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
