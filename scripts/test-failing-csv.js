const csvData = `Date,Start Time,End Time,Location,Workout Type,Duration (min),Active Calories,Total Calories,Avg Heart Rate (bpm),Effort (1–10),Station,Exercise,Notes
2025-10-23,4:37 PM,5:17 PM,Training Mate (Culver City),High Intensity Interval Training (Upper Body – Bondi Burn),40,413,489,134,6,Station 1,Dip Bar Pull-Ups,Upper body pull strength and stability`;

async function testImport() {
  try {
    console.log("🧪 Testing CSV import with failing data...");

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
