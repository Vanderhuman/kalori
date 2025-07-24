// Global variables
let workoutData = JSON.parse(localStorage.getItem("workoutData")) || [];
let nutritionData = JSON.parse(localStorage.getItem("nutritionData")) || [];
let goals = JSON.parse(localStorage.getItem("goals")) || [];
let userStats = JSON.parse(localStorage.getItem("userStats")) || {
  totalWorkouts: 0,
  totalCalories: 0,
  currentStreak: 0,
  userLevel: 1,
  xp: 0,
  weeklyCalories: 0,
  monthlyCalories: 0,
  lastWorkoutDate: null,
  achievements: [],
};

let timer = null;
let timerRunning = false;
let timerSeconds = 0;
let hiitTimer = null;
let hiitRunning = false;
let currentHiitPhase = "work";
let currentRound = 1;
let totalRounds = 8;

// Initialize app
document.addEventListener("DOMContentLoaded", function () {
  updateUserStats();
  updateProgressTab();
  updateNutritionTab();
  updateGoalsTab();
  updateSocialTab();
  checkAchievements();

  // Load saved theme
  const savedTheme = localStorage.getItem("theme") || "light";
  document.body.setAttribute("data-theme", savedTheme);
  updateThemeToggle();

  // Initialize all forms
  initializeNutritionForm();
  initializeGoalForm();
  initializeWeeklyPlanForm(); // Make sure this is called
});

// Tab switching
function switchTab(tabId, element) {
  document.querySelectorAll(".tab-content").forEach((tab) => {
    tab.classList.remove("active");
  });
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.remove("active");
  });

  document.getElementById(tabId).classList.add("active");
  element.classList.add("active");

  // Update specific tabs when switched to
  if (tabId === "progress-tab") {
    updateProgressTab();
  } else if (tabId === "nutrition-tab") {
    updateNutritionTab();
  } else if (tabId === "goals-tab") {
    updateGoalsTab();
  } else if (tabId === "social-tab") {
    updateSocialTab();
  }
}

// Theme toggle
function toggleTheme() {
  const currentTheme = document.body.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  document.body.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
  updateThemeToggle();
}

function updateThemeToggle() {
  const themeBtn = document.querySelector(".theme-toggle");
  const isDark = document.body.getAttribute("data-theme") === "dark";
  themeBtn.textContent = isDark ? "☀️" : "🌙";

  const darkModeToggle = document.getElementById("darkModeToggle");
  if (darkModeToggle) darkModeToggle.checked = isDark;
}

// Settings panel
function toggleSettings() {
  const panel = document.getElementById("settingsPanel");
  const overlay = document.getElementById("settingsOverlay");

  panel.classList.toggle("open");
  overlay.classList.toggle("show");
}

// Workout form submission
document
  .getElementById("kaloriForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    const data = Object.fromEntries(formData);

    document.getElementById("loading").style.display = "block";
    document.getElementById("result").style.display = "none";
    document.getElementById("error").style.display = "none";

    try {
      // Calculate calories using the same logic as Motoko backend
      const calories = calculateCalories(
        parseFloat(data.berat),
        parseFloat(data.durasi),
        data.olahraga,
        data.intensitas
      );

      const analysis = await generateAIAnalysis(data, calories);

      displayWorkoutResult(calories, analysis, data);

      // Save workout data
      const workoutEntry = {
        date: new Date().toISOString(),
        calories: calories,
        duration: parseFloat(data.durasi),
        exercise: data.olahraga,
        intensity: data.intensitas,
        weight: parseFloat(data.berat),
        heartRate: data.heartRate ? parseInt(data.heartRate) : null,
        mood: data.mood,
      };

      workoutData.push(workoutEntry);
      updateUserStatsAfterWorkout(calories, parseFloat(data.durasi));
      checkAchievements();
    } catch (error) {
      document.getElementById("loading").style.display = "none";
      document.getElementById("error").style.display = "block";
      document.getElementById("error").textContent =
        "Error analyzing workout: " + error.message;
    }
  });

// Initialize Weekly Plan Form - THIS IS THE FIX
function initializeWeeklyPlanForm() {
  const rencanaForm = document.getElementById("rencanaForm");
  if (rencanaForm) {
    rencanaForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const formData = new FormData(this);
      const data = Object.fromEntries(formData);

      // Show loading
      document.getElementById("loadingRencana").style.display = "block";
      document.getElementById("weeklyPlan").style.display = "none";

      try {
        // Generate AI plan using the same AI analysis system
        const plan = await generateWeeklyPlan(
          parseFloat(data.beratRencana),
          data.tujuan,
          data.level,
          parseFloat(data.waktuTersedia)
        );

        // Display the plan
        displayWeeklyPlan(plan);

        showToast("Weekly plan generated successfully!", "success");
      } catch (error) {
        document.getElementById("loadingRencana").style.display = "none";
        showToast("Error generating plan: " + error.message, "error");
      }
    });
  }
}

// Generate Weekly Plan using AI (simulated)
async function generateWeeklyPlan(berat, tujuan, level, waktuTersedia) {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const planTemplates = {
    weight_loss: {
      beginner: generateWeightLossPlan(berat, waktuTersedia, "beginner"),
      intermediate: generateWeightLossPlan(
        berat,
        waktuTersedia,
        "intermediate"
      ),
      advanced: generateWeightLossPlan(berat, waktuTersedia, "advanced"),
    },
    muscle_gain: {
      beginner: generateMuscleGainPlan(berat, waktuTersedia, "beginner"),
      intermediate: generateMuscleGainPlan(
        berat,
        waktuTersedia,
        "intermediate"
      ),
      advanced: generateMuscleGainPlan(berat, waktuTersedia, "advanced"),
    },
    endurance: {
      beginner: generateEndurancePlan(berat, waktuTersedia, "beginner"),
      intermediate: generateEndurancePlan(berat, waktuTersedia, "intermediate"),
      advanced: generateEndurancePlan(berat, waktuTersedia, "advanced"),
    },
    general_health: {
      beginner: generateGeneralHealthPlan(berat, waktuTersedia, "beginner"),
      intermediate: generateGeneralHealthPlan(
        berat,
        waktuTersedia,
        "intermediate"
      ),
      advanced: generateGeneralHealthPlan(berat, waktuTersedia, "advanced"),
    },
  };

  return (
    planTemplates[tujuan]?.[level] ||
    generateGeneralHealthPlan(berat, waktuTersedia, level)
  );
}

// Generate Weight Loss Plan
function generateWeightLossPlan(berat, waktu, level) {
  const intensityMultiplier =
    level === "beginner" ? 0.7 : level === "intermediate" ? 0.85 : 1.0;
  const baseTime = Math.floor(waktu * intensityMultiplier);

  return `🔥 WEEKLY WEIGHT LOSS PLAN

🎯 Target: Fat Burning & Metabolic Boost
⏱️ Daily Time: ${baseTime} minutes
📊 Level: ${level.charAt(0).toUpperCase() + level.slice(1)}

📅 SENIN - Cardio Foundation
🏃‍♂️ Aktivitas: Lari/Jalan Cepat - ${baseTime} menit
💡 Focus: Zone 2 cardio untuk fat burning
⚠️ Tips: Jaga heart rate 60-70% max HR

📅 SELASA - Strength Circuit  
🏋️‍♂️ Aktivitas: Bodyweight/Light weights - ${Math.floor(baseTime * 0.9)} menit
💡 Focus: Full body compound movements
⚠️ Tips: 3 sets x 12-15 reps, rest 45 detik

📅 RABU - Active Recovery
🧘‍♀️ Aktivitas: Yoga/Stretching - ${Math.floor(baseTime * 0.6)} menit
💡 Focus: Flexibility dan muscle recovery
⚠️ Tips: Fokus pada deep breathing

📅 KAMIS - HIIT Session
⚡ Aktivitas: High Intensity Intervals - ${Math.floor(baseTime * 0.8)} menit
💡 Focus: Maximum calorie burn
⚠️ Tips: 30 detik work, 30 detik rest

📅 JUMAT - Strength Training
💪 Aktivitas: Weight training - ${baseTime} menit
💡 Focus: Build lean muscle mass
⚠️ Tips: Progressive overload setiap minggu

📅 SABTU - Fun Cardio
🚴‍♂️ Aktivitas: Bersepeda/Renang - ${Math.floor(baseTime * 1.1)} menit
💡 Focus: Enjoyable movement
⚠️ Tips: Pilih aktivitas yang kamu suka

📅 MINGGU - Rest Day
😴 Aktivitas: Complete rest atau gentle walk
💡 Focus: Full recovery
⚠️ Tips: Sleep 7-9 jam untuk optimal recovery

🍎 NUTRITION TIPS:
- Deficit kalori 300-500 per hari
- Protein 1.6-2.2g per kg berat badan
- Minum air 35ml per kg berat badan
- Makan 4-5 kali sehari porsi kecil

💡 SUCCESS TIPS:
- Track progress dengan foto dan ukuran
- Consistency beats perfection
- Adjust intensitas based on energy level
- Celebrate small wins every week!`;
}

// Generate Muscle Gain Plan
function generateMuscleGainPlan(berat, waktu, level) {
  const baseTime = Math.floor(waktu);

  return `💪 WEEKLY MUSCLE GAIN PLAN

🎯 Target: Hypertrophy & Strength Building
⏱️ Daily Time: ${baseTime} minutes
📊 Level: ${level.charAt(0).toUpperCase() + level.slice(1)}

📅 SENIN - Upper Body Push
🏋️‍♂️ Aktivitas: Chest, Shoulders, Triceps - ${baseTime} menit
💡 Focus: Push movements, progressive overload
⚠️ Tips: 4 sets x 8-12 reps, rest 2-3 menit

📅 SELASA - Lower Body Power
🦵 Aktivitas: Squats, Lunges, Glutes - ${baseTime} menit
💡 Focus: Compound leg movements
⚠️ Tips: Focus on form, full range of motion

📅 RABU - Upper Body Pull
🎯 Aktivitas: Back, Biceps, Rear delts - ${baseTime} menit
💡 Focus: Pull movements, muscle activation
⚠️ Tips: Mind-muscle connection penting

📅 KAMIS - Active Recovery
🧘‍♂️ Aktivitas: Light cardio/Stretching - ${Math.floor(baseTime * 0.5)} menit
💡 Focus: Blood flow dan recovery
⚠️ Tips: Low intensity, fokus mobility

📅 JUMAT - Full Body Power
⚡ Aktivitas: Compound movements - ${baseTime} menit
💡 Focus: Multi-joint exercises
⚠️ Tips: Deadlifts, squats, overhead press

📅 SABTU - Accessory Work
🎯 Aktivitas: Isolation exercises - ${Math.floor(baseTime * 0.8)} menit
💡 Focus: Weak points dan detail work
⚠️ Tips: Higher reps, perfect form

📅 MINGGU - Complete Rest
😴 Aktivitas: Rest day
💡 Focus: Growth happens during rest
⚠️ Tips: Protein synthesis peaks during sleep

🥩 NUTRITION FOCUS:
- Surplus kalori 300-500 per hari
- Protein 2.0-2.5g per kg berat badan
- Carbs untuk energy pre/post workout
- Healthy fats 25% total kalori

📈 PROGRESSION TIPS:
- Increase weight 2.5-5kg per week
- Track all lifts dalam log book
- Take progress photos weekly
- Measure muscle size monthly`;
}

// Generate Endurance Plan
function generateEndurancePlan(berat, waktu, level) {
  const baseTime = Math.floor(waktu);

  return `⚡ WEEKLY ENDURANCE PLAN

🎯 Target: Cardiovascular Fitness & Stamina
⏱️ Daily Time: ${baseTime} minutes
📊 Level: ${level.charAt(0).toUpperCase() + level.slice(1)}

📅 SENIN - Base Building
🏃‍♂️ Aktivitas: Easy pace run/cycle - ${Math.floor(baseTime * 1.2)} menit
💡 Focus: Aerobic base development
⚠️ Tips: Conversational pace, nose breathing

📅 SELASA - Tempo Training
🎯 Aktivitas: Steady state cardio - ${baseTime} menit
💡 Focus: Lactate threshold improvement
⚠️ Tips: Comfortably hard effort

📅 RABU - Recovery Cardio
🚶‍♂️ Aktivitas: Easy walk/swim - ${Math.floor(baseTime * 0.7)} menit
💡 Focus: Active recovery
⚠️ Tips: Very low intensity

📅 KAMIS - Interval Training
⚡ Aktivitas: High intensity intervals - ${Math.floor(baseTime * 0.9)} menit
💡 Focus: VO2 max improvement
⚠️ Tips: 4 min hard, 3 min easy x 4 rounds

📅 JUMAT - Cross Training
🏊‍♂️ Aktivitas: Alternative cardio - ${baseTime} menit
💡 Focus: Different movement patterns
⚠️ Tips: Cycling, swimming, atau rowing

📅 SABTU - Long Slow Distance
🏃‍♂️ Aktivitas: Extended cardio session - ${Math.floor(baseTime * 1.5)} menit
💡 Focus: Endurance capacity
⚠️ Tips: Steady, sustainable pace

📅 MINGGU - Gentle Movement
🧘‍♀️ Aktivitas: Yoga atau easy walk - ${Math.floor(baseTime * 0.5)} menit
💡 Focus: Recovery dan flexibility
⚠️ Tips: Restorative movements

⚡ ENDURANCE NUTRITION:
- Carbs 5-7g per kg berat badan
- Electrolyte balance penting
- Hydration 500ml per jam exercise
- Post-workout carbs + protein

🏆 PERFORMANCE TIPS:
- Monitor resting heart rate
- Track HRV for recovery
- Progressive volume increase 10% per week
- Mental training sama penting dengan physical`;
}

// Generate General Health Plan
function generateGeneralHealthPlan(berat, waktu, level) {
  const baseTime = Math.floor(waktu);

  return `🌟 WEEKLY GENERAL HEALTH PLAN

🎯 Target: Overall Wellness & Vitality
⏱️ Daily Time: ${baseTime} minutes
📊 Level: ${level.charAt(0).toUpperCase() + level.slice(1)}

📅 SENIN - Movement Monday
🏃‍♂️ Aktivitas: Light cardio pilihan - ${baseTime} menit
💡 Focus: Start week dengan energi positif
⚠️ Tips: Pilih aktivitas yang enjoyable

📅 SELASA - Strength Tuesday
💪 Aktivitas: Bodyweight exercises - ${baseTime} menit
💡 Focus: Functional strength
⚠️ Tips: Push-ups, squats, planks

📅 RABU - Wellness Wednesday
🧘‍♀️ Aktivitas: Yoga atau stretching - ${baseTime} menit
💡 Focus: Flexibility dan stress relief
⚠️ Tips: Deep breathing dan mindfulness

📅 KAMIS - Cardio Thursday
🚴‍♂️ Aktivitas: Moderate cardio - ${baseTime} menit
💡 Focus: Heart health
⚠️ Tips: Maintain steady rhythm

📅 JUMAT - Fun Friday
⚽ Aktivitas: Sport atau dance - ${baseTime} menit
💡 Focus: Enjoyment dan social
⚠️ Tips: Have fun, don't worry about intensity

📅 SABTU - Active Saturday
🥾 Aktivitas: Outdoor activity - ${Math.floor(baseTime * 1.1)} menit
💡 Focus: Nature connection
⚠️ Tips: Hiking, gardening, outdoor games

📅 MINGGU - Restorative Sunday
😌 Aktivitas: Gentle movement - ${Math.floor(baseTime * 0.6)} menit
💡 Focus: Recovery dan preparation
⚠️ Tips: Prepare body dan mind untuk minggu baru

🍎 HOLISTIC HEALTH:
- Balanced nutrition, not restriction
- Sleep 7-9 jam consistently
- Stress management daily
- Social connection important

🌱 WELLNESS TIPS:
- Listen to your body signals
- Progress not perfection
- Find joy in movement
- Celebrate consistency over intensity`;
}

// Display Weekly Plan
function displayWeeklyPlan(plan) {
  document.getElementById("loadingRencana").style.display = "none";
  document.getElementById("weeklyPlan").style.display = "block";
  document.getElementById("weeklyPlan").textContent = plan;
}

// Calculate calories (matching Motoko logic)
function calculateCalories(berat, durasi, olahraga, intensitas) {
  let faktor = 0.07;

  const factors = {
    lari: { ringan: 0.09, sedang: 0.12, berat: 0.16 },
    bersepeda: { ringan: 0.05, sedang: 0.08, berat: 0.12 },
    renang: { ringan: 0.07, sedang: 0.11, berat: 0.15 },
    jalan: { ringan: 0.04, sedang: 0.06, berat: 0.09 },
    yoga: { ringan: 0.03, sedang: 0.05, berat: 0.07 },
    gym: { ringan: 0.06, sedang: 0.09, berat: 0.13 },
    hiit: { ringan: 0.1, sedang: 0.14, berat: 0.18 },
  };

  if (factors[olahraga] && factors[olahraga][intensitas]) {
    faktor = factors[olahraga][intensitas];
  }

  return Math.round(berat * durasi * faktor);
}

// Generate AI analysis (enhanced version)
async function generateAIAnalysis(data, calories) {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const adviceTemplates = {
    lari: {
      ringan:
        "Lari ringan bagus untuk pemula dan recovery. Jaga postur tubuh tegak, landing dengan mid-foot, dan atur napas dengan ritma yang konsisten. Fokus pada durasi daripada kecepatan.",
      sedang:
        "Lari intensitas sedang efektif untuk cardiovascular fitness. Pastikan pemanasan 5-10 menit dan cooldown setelahnya. Jaga pace yang bisa dipertahankan sambil masih bisa berbicara.",
      berat:
        "Lari intensitas tinggi memerlukan persiapan matang. Fokus pada form yang benar, jangan lupakan recovery, dan pastikan hidrasi optimal. Interval training bisa membantu adaptasi.",
    },
    bersepeda: {
      ringan:
        "Bersepeda ringan cocok untuk recovery atau warm-up. Atur posisi sadel yang nyaman dan pastikan postur tidak membungkuk berlebihan.",
      sedang:
        "Bersepeda intensitas sedang bagus untuk endurance. Variasikan terrain untuk tantangan dan gunakan gigi yang sesuai dengan kondisi.",
      berat:
        "Cycling intensitas tinggi melatih power dan speed. Pastikan hidrasi yang cukup dan perhatikan tanda-tanda overheating.",
    },
    renang: {
      ringan:
        "Renang ringan excellent untuk full-body workout tanpa impact. Fokus pada teknik pernapasan dan stroke efficiency.",
      sedang:
        "Renang intensitas sedang melatih kardio dan kekuatan otot. Variasikan gaya renang untuk melatih otot yang berbeda.",
      berat:
        "Renang intensitas tinggi membutuhkan teknik yang solid. Jaga ritme pernapasan dan hindari overexertion di awal.",
    },
    yoga: {
      ringan:
        "Yoga ringan bagus untuk flexibility dan mindfulness. Fokus pada alignment dan pernapasan dalam.",
      sedang:
        "Yoga sedang menggabungkan strength dan flexibility. Dengarkan tubuh dan jangan memaksakan pose.",
      berat:
        "Yoga intensif memerlukan fokus mental dan fisik. Maintain proper form dan jaga konsistensi pernapasan.",
    },
    gym: {
      ringan:
        "Weight training ringan fokus pada form dan muscle activation. Progressive overload adalah kunci.",
      sedang:
        "Gym intensitas sedang bagus untuk strength building. Istirahat antar set 60-90 detik untuk recovery optimal.",
      berat:
        "Heavy lifting memerlukan proper warm-up dan spotting jika perlu. Fokus pada compound movements.",
    },
    hiit: {
      ringan:
        "HIIT ringan bagus untuk pengenalan interval training. Work-to-rest ratio 1:2 cocok untuk pemula.",
      sedang:
        "HIIT sedang efektif untuk fat burning dan cardiovascular improvement. Jaga intensitas konsisten.",
      berat:
        "HIIT intensif membutuhkan recovery yang cukup. Maximum effort saat work phase, complete rest saat recovery.",
    },
  };

  const advice =
    adviceTemplates[data.olahraga]?.[data.intensitas] ||
    "Tetap konsisten dengan latihan dan dengarkan tubuh Anda. Form yang benar lebih penting dari intensitas tinggi.";

  const tips = generateContextualTips(data.olahraga, data.intensitas, calories);

  const motivations = [
    `Luar biasa! ${calories} kalori sudah terbakar hari ini. Setiap langkah mendekatkan kamu ke goal! 💪`,
    `Amazing work! ${calories} kalori closer to your fitness goal! Keep the momentum going! 🔥`,
    `Fantastic effort! ${calories} kalori burned dengan ${data.olahraga}. Your consistency pays off! 🏆`,
    `Great job crushing that ${data.intensitas} ${data.olahraga} session! ${calories} kalori down! 🎯`,
    `You're on fire! ${calories} kalori burned today. Your future self will thank you! ⚡`,
  ];

  const categories = {
    lari: "Cardio Training",
    bersepeda: "Cardio Endurance",
    renang: "Full Body Cardio",
    jalan: "Low Impact Cardio",
    yoga: "Flexibility & Mindfulness",
    gym: "Strength Training",
    hiit: "High Intensity Training",
  };

  return {
    advice: advice,
    tips: tips,
    motivation: motivations[Math.floor(Math.random() * motivations.length)],
    category: categories[data.olahraga] || "General Fitness",
  };
}

// Generate contextual tips based on exercise and intensity
function generateContextualTips(exercise, intensity, calories) {
  const baseTips = [
    "Jaga konsistensi latihan untuk hasil optimal dan pembentukan habit",
    "Hidrasi adalah kunci - minum air sebelum, selama, dan setelah olahraga",
    "Quality sleep 7-9 jam per malam penting untuk muscle recovery",
  ];

  const exerciseSpecificTips = {
    lari: [
      "Ganti sepatu lari setiap 500-800km untuk mencegah cedera",
      "Lakukan dynamic warm-up sebelum lari dan static stretching setelah",
      "Gradually increase mileage - ikuti 10% rule untuk avoid overuse injury",
    ],
    bersepeda: [
      "Adjust bike fit untuk comfort dan efficiency - saddle height penting",
      "Wear appropriate gear termasuk helm dan visibility clothing",
      "Maintain bike regularly - check tire pressure dan brake function",
    ],
    renang: [
      "Focus on technique over speed - efficient stroke menghemat energi",
      "Alternate different strokes untuk balanced muscle development",
      "Use pool equipment seperti kickboard untuk technique improvement",
    ],
    hiit: [
      intensity === "berat"
        ? "HIIT high-intensity butuh 48-72 jam recovery time"
        : "HIIT dapat dilakukan 2-3x per minggu dengan rest day",
      "Monitor heart rate - target 80-95% max HR pada work intervals",
      "Proper warm-up critical untuk HIIT - minimum 10 menit preparation",
    ],
  };

  const intensityTips = {
    ringan: "Intensitas ringan perfect untuk active recovery dan base building",
    sedang: "Intensitas sedang ideal untuk consistent progress dan adaptasi",
    berat: "High intensity requires adequate recovery - listen to your body",
  };

  let tips = [...baseTips];
  if (exerciseSpecificTips[exercise]) {
    tips = tips.concat(exerciseSpecificTips[exercise]);
  }
  tips.push(intensityTips[intensity]);

  // Return 3 random tips
  return tips.sort(() => 0.5 - Math.random()).slice(0, 3);
}

// Display workout result
function displayWorkoutResult(calories, analysis, data) {
  document.getElementById("loading").style.display = "none";
  document.getElementById("result").style.display = "block";

  document.getElementById("calories").textContent = `${calories} kalori`;
  document.getElementById("category").textContent = analysis.category;
  document.getElementById("advice").textContent = analysis.advice;
  document.getElementById("motivation").textContent = analysis.motivation;

  // Display tips
  const tipsContainer = document.getElementById("tips-container");
  tipsContainer.innerHTML = "";
  analysis.tips.forEach((tip, index) => {
    const tipElement = document.createElement("div");
    tipElement.className = "tip-item";
    tipElement.innerHTML = `
      <div class="tip-icon">${index + 1}</div>
      <div>${tip}</div>
    `;
    tipsContainer.appendChild(tipElement);
  });

  // Show exercise demo
  showExerciseDemo(data.olahraga);
}

// Show exercise demo
function showExerciseDemo(exercise) {
  const demo = document.getElementById("exerciseDemo");
  const animation = document.getElementById("demoAnimation");
  const tips = document.getElementById("formTips");

  const exercises = {
    lari: {
      emoji: "🏃‍♂️",
      tips: "Postur tegak, ayunan lengan rileks, pendaratan mid-foot, cadence 170-180 steps/min",
    },
    bersepeda: {
      emoji: "🚴‍♂️",
      tips: "Posisi sadel tepat, grip handlebar ringan, maintain cadence 80-100 RPM",
    },
    renang: {
      emoji: "🏊‍♂️",
      tips: "Head position netral, rotate from core, high elbow catch, bilateral breathing",
    },
    jalan: {
      emoji: "🚶‍♂️",
      tips: "Heel-to-toe gait, arm swing natural, maintain good posture, steady pace",
    },
    yoga: {
      emoji: "🧘‍♀️",
      tips: "Deep breathing, proper alignment, listen to body, hold poses 5-8 breaths",
    },
    gym: {
      emoji: "🏋️‍♂️",
      tips: "Control eccentric phase, full range of motion, breathe properly, progressive overload",
    },
    hiit: {
      emoji: "⚡",
      tips: "Maximum effort work phase, complete rest recovery, maintain form under fatigue",
    },
  };

  if (exercises[exercise]) {
    animation.textContent = exercises[exercise].emoji;
    tips.textContent = exercises[exercise].tips;
    demo.style.display = "block";
  }
}

// Save workout function
function saveWorkout() {
  localStorage.setItem("workoutData", JSON.stringify(workoutData));
  localStorage.setItem("userStats", JSON.stringify(userStats));
  showToast("Workout saved successfully!", "success");
  updateProgressTab();
}

// Share workout function
function shareWorkout() {
  const lastWorkout = workoutData[workoutData.length - 1];
  if (lastWorkout) {
    const shareText = `Just burned ${lastWorkout.calories} calories with ${lastWorkout.duration} minutes of ${lastWorkout.exercise}! 💪 #FitnessGoals #SmartFitnessTracker`;

    if (navigator.share) {
      navigator.share({
        title: "My Workout Achievement",
        text: shareText,
        url: window.location.href,
      });
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(shareText).then(() => {
        showToast("Workout details copied to clipboard!", "success");
      });
    }
  }
}

// Update user stats after workout
function updateUserStatsAfterWorkout(calories, duration) {
  const today = new Date().toDateString();
  const lastWorkoutDate = userStats.lastWorkoutDate;

  userStats.totalWorkouts += 1;
  userStats.totalCalories += calories;
  userStats.weeklyCalories += calories;
  userStats.monthlyCalories += calories;

  // Update streak
  if (lastWorkoutDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastWorkoutDate === yesterday.toDateString()) {
      userStats.currentStreak += 1;
    } else if (lastWorkoutDate !== today) {
      userStats.currentStreak = 1;
    }
    userStats.lastWorkoutDate = today;
  }

  // Update XP and level
  const xpGained = Math.floor(calories / 10) + Math.floor(duration / 5);
  userStats.xp += xpGained;
  userStats.userLevel = Math.floor(userStats.xp / 1000) + 1;

  saveUserStats();
  updateUserStats();
}

// Save user stats to localStorage
function saveUserStats() {
  localStorage.setItem("userStats", JSON.stringify(userStats));
}

// Update user stats display
function updateUserStats() {
  document.getElementById("totalWorkouts").textContent =
    userStats.totalWorkouts;
  document.getElementById("totalCalories").textContent =
    userStats.totalCalories;
  document.getElementById("currentStreak").textContent =
    userStats.currentStreak;
  document.getElementById("userLevel").textContent = userStats.userLevel;
}

// Progress Tab Functions
function updateProgressTab() {
  updateStreakDisplay();
  updateWeeklyStats();
  updateWorkoutHistory();
  updateAchievements();
}

function updateStreakDisplay() {
  const streakElement = document.getElementById("streakDisplay");
  if (streakElement) {
    streakElement.textContent = userStats.currentStreak;
  }
}

function updateWeeklyStats() {
  // Calculate weekly/monthly calories from recent workouts
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let weeklyCalories = 0;
  let monthlyCalories = 0;
  let totalDuration = 0;
  const exerciseCount = {};

  workoutData.forEach((workout) => {
    const workoutDate = new Date(workout.date);
    if (workoutDate >= monthAgo) {
      monthlyCalories += workout.calories;
      totalDuration += workout.duration;

      if (workoutDate >= weekAgo) {
        weeklyCalories += workout.calories;
      }

      exerciseCount[workout.exercise] =
        (exerciseCount[workout.exercise] || 0) + 1;
    }
  });

  const avgDuration =
    workoutData.length > 0 ? Math.round(totalDuration / workoutData.length) : 0;
  const favoriteExercise = Object.keys(exerciseCount).reduce(
    (a, b) => (exerciseCount[a] > exerciseCount[b] ? a : b),
    "-"
  );

  // Update displays
  const weeklyElement = document.getElementById("weeklyCalories");
  const monthlyElement = document.getElementById("monthlyCalories");
  const avgElement = document.getElementById("avgDuration");
  const favoriteElement = document.getElementById("favoriteExercise");

  if (weeklyElement) weeklyElement.textContent = weeklyCalories;
  if (monthlyElement) monthlyElement.textContent = monthlyCalories;
  if (avgElement) avgElement.textContent = avgDuration + "m";
  if (favoriteElement) favoriteElement.textContent = favoriteExercise;
}

function updateWorkoutHistory() {
  const historyContainer = document.getElementById("workoutHistory");
  if (!historyContainer) return;

  historyContainer.innerHTML = "";

  const recentWorkouts = workoutData.slice(-10).reverse();

  recentWorkouts.forEach((workout) => {
    const workoutElement = document.createElement("div");
    workoutElement.className = "goal-item";
    workoutElement.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong>${workout.exercise}</strong> - ${workout.intensity}
          <br><small>${new Date(workout.date).toLocaleDateString()}</small>
        </div>
        <div style="text-align: right;">
          <div style="color: var(--primary-color); font-weight: bold;">${
            workout.calories
          } cal</div>
          <small>${workout.duration}m</small>
        </div>
      </div>
    `;
    historyContainer.appendChild(workoutElement);
  });

  if (recentWorkouts.length === 0) {
    historyContainer.innerHTML =
      '<p style="text-align: center; color: #64748b;">No workout history yet. Start your first workout!</p>';
  }
}

// Achievement system
function checkAchievements() {
  const achievements = [
    {
      id: "first_workout",
      name: "First Steps",
      condition: () => userStats.totalWorkouts >= 1,
    },
    {
      id: "workout_10",
      name: "10 Workouts",
      condition: () => userStats.totalWorkouts >= 10,
    },
    {
      id: "workout_50",
      name: "Half Century",
      condition: () => userStats.totalWorkouts >= 50,
    },
    {
      id: "calories_1000",
      name: "1K Burner",
      condition: () => userStats.totalCalories >= 1000,
    },
    {
      id: "calories_5000",
      name: "5K Crusher",
      condition: () => userStats.totalCalories >= 5000,
    },
    {
      id: "streak_7",
      name: "Week Warrior",
      condition: () => userStats.currentStreak >= 7,
    },
    {
      id: "streak_30",
      name: "Month Master",
      condition: () => userStats.currentStreak >= 30,
    },
    {
      id: "level_5",
      name: "Rising Star",
      condition: () => userStats.userLevel >= 5,
    },
    {
      id: "level_10",
      name: "Fitness Pro",
      condition: () => userStats.userLevel >= 10,
    },
  ];

  achievements.forEach((achievement) => {
    if (
      achievement.condition() &&
      !userStats.achievements.includes(achievement.id)
    ) {
      userStats.achievements.push(achievement.id);
      showToast(`🏆 Achievement Unlocked: ${achievement.name}!`, "success");
    }
  });

  saveUserStats();
}

function updateAchievements() {
  const achievementsContainer = document.getElementById("achievementsList");
  if (!achievementsContainer) return;

  achievementsContainer.innerHTML = "";

  userStats.achievements.forEach((achievementId) => {
    const badge = document.createElement("span");
    badge.className = "achievement-badge";
    badge.textContent = getAchievementName(achievementId);
    achievementsContainer.appendChild(badge);
  });

  if (userStats.achievements.length === 0) {
    achievementsContainer.innerHTML =
      '<p style="text-align: center; color: #64748b;">Complete workouts to unlock achievements!</p>';
  }
}

function getAchievementName(id) {
  const names = {
    first_workout: "🥇 First Steps",
    workout_10: "🔟 10 Workouts",
    workout_50: "💫 Half Century",
    calories_1000: "🔥 1K Burner",
    calories_5000: "⚡ 5K Crusher",
    streak_7: "📅 Week Warrior",
    streak_30: "🗓️ Month Master",
    level_5: "⭐ Rising Star",
    level_10: "🏆 Fitness Pro",
  };
  return names[id] || id;
}

// Nutrition Tab Functions
function initializeNutritionForm() {
  const nutritionForm = document.getElementById("nutritionForm");
  if (nutritionForm) {
    nutritionForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const formData = new FormData(this);
      const data = Object.fromEntries(formData);

      const nutritionEntry = {
        date: new Date().toISOString(),
        caloriesIntake: parseInt(data.caloriesIntake) || 0,
        waterIntake: parseInt(data.waterIntake) || 0,
        protein: parseInt(data.protein) || 0,
        carbs: parseInt(data.carbs) || 0,
        fat: parseInt(data.fat) || 0,
        fiber: parseInt(data.fiber) || 0,
      };

      nutritionData.push(nutritionEntry);
      localStorage.setItem("nutritionData", JSON.stringify(nutritionData));

      updateNutritionTab();
      showToast("Nutrition data logged successfully!", "success");
      this.reset();
    });
  }
}

function updateNutritionTab() {
  updateCalorieBalance();
  updateWaterProgress();
  updateMacroBalance();
}

function updateCalorieBalance() {
  const today = new Date().toDateString();
  const todayNutrition = nutritionData.filter(
    (entry) => new Date(entry.date).toDateString() === today
  );
  const todayWorkouts = workoutData.filter(
    (entry) => new Date(entry.date).toDateString() === today
  );

  const totalIntake = todayNutrition.reduce(
    (sum, entry) => sum + entry.caloriesIntake,
    0
  );
  const totalBurned = todayWorkouts.reduce(
    (sum, entry) => sum + entry.calories,
    0
  );
  const netCalories = totalIntake - totalBurned;

  const intakeElement = document.getElementById("totalIntake");
  const burnedElement = document.getElementById("totalBurned");
  const netElement = document.getElementById("netCalories");

  if (intakeElement) intakeElement.textContent = totalIntake;
  if (burnedElement) burnedElement.textContent = totalBurned;
  if (netElement) {
    netElement.textContent = netCalories;
    netElement.style.color =
      netCalories > 0 ? "var(--warning-color)" : "var(--success-color)";
  }
}

function updateWaterProgress() {
  const today = new Date().toDateString();
  const todayNutrition = nutritionData.filter(
    (entry) => new Date(entry.date).toDateString() === today
  );

  const totalWater = todayNutrition.reduce(
    (sum, entry) => sum + entry.waterIntake,
    0
  );
  const waterGoal = 8; // 8 glasses per day
  const percentage = Math.min((totalWater / waterGoal) * 100, 100);

  const progressFill = document.getElementById("waterProgressFill");
  const currentWater = document.getElementById("currentWater");

  if (progressFill) progressFill.style.width = percentage + "%";
  if (currentWater) currentWater.textContent = totalWater;
}

function updateMacroBalance() {
  const today = new Date().toDateString();
  const todayNutrition = nutritionData.filter(
    (entry) => new Date(entry.date).toDateString() === today
  );

  const totalProtein = todayNutrition.reduce(
    (sum, entry) => sum + entry.protein,
    0
  );
  const totalCarbs = todayNutrition.reduce(
    (sum, entry) => sum + entry.carbs,
    0
  );
  const totalFat = todayNutrition.reduce((sum, entry) => sum + entry.fat, 0);

  const totalMacros = totalProtein + totalCarbs + totalFat;

  if (totalMacros > 0) {
    const proteinPercentage = (totalProtein / totalMacros) * 100;
    const carbsPercentage = (totalCarbs / totalMacros) * 100;
    const fatPercentage = (totalFat / totalMacros) * 100;

    const proteinBar = document.getElementById("proteinBar");
    const carbsBar = document.getElementById("carbsBar");
    const fatBar = document.getElementById("fatBar");

    if (proteinBar) proteinBar.style.width = proteinPercentage + "%";
    if (carbsBar) carbsBar.style.width = carbsPercentage + "%";
    if (fatBar) fatBar.style.width = fatPercentage + "%";
  }
}

// Goals Tab Functions
function initializeGoalForm() {
  const goalForm = document.getElementById("goalForm");
  if (goalForm) {
    goalForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const formData = new FormData(this);
      const data = Object.fromEntries(formData);

      const goalEntry = {
        id: Date.now(), // Unique ID based on current time
        type: data.goalType,
        targetValue: parseFloat(data.targetValue),
        targetDate: data.targetDate,
        description: data.goalDescription,
      };

      goals.push(goalEntry);
      localStorage.setItem("goals", JSON.stringify(goals));

      updateGoalsTab();
      showToast("Goal set successfully!", "success");
      this.reset();
    });
  }
}

// Update goals tab
function updateGoalsTab() {
  const goalListContainer = document.getElementById("activeGoals");
  if (!goalListContainer) return;

  goalListContainer.innerHTML = "";

  if (goals.length === 0) {
    goalListContainer.innerHTML =
      '<p style="text-align: center; color: #64748b;">No goals set. Start by creating a new goal!</p>';
  } else {
    goals.forEach((goal) => {
      const goalElement = document.createElement("div");
      goalElement.className = "goal-item";
      goalElement.innerHTML = `
        <div>
          <strong>${
            goal.type.charAt(0).toUpperCase() + goal.type.slice(1)
          }</strong>
          <br><small>Target: ${goal.targetValue} ${
        goal.type === "weight_loss" ? "kg" : ""
      }</small>
          <br><small>Due: ${goal.targetDate}</small>
        </div>
        <div>
          <button class="btn-small" onclick="editGoal(${goal.id})">Edit</button>
          <button class="btn-small" onclick="deleteGoal(${
            goal.id
          })">Delete</button>
        </div>
      `;
      goalListContainer.appendChild(goalElement);
    });
  }
}

// Edit goal
function editGoal(goalId) {
  const goal = goals.find((goal) => goal.id === goalId);
  if (goal) {
    document.getElementById("goalType").value = goal.type;
    document.getElementById("targetValue").value = goal.targetValue;
    document.getElementById("targetDate").value = goal.targetDate;
    document.getElementById("goalDescription").value = goal.description;
  }
  deleteGoal(goalId);
}

// Delete goal
function deleteGoal(goalId) {
  goals = goals.filter((goal) => goal.id !== goalId);
  localStorage.setItem("goals", JSON.stringify(goals));
  updateGoalsTab();
}

// Social Tab Functions
function updateSocialTab() {
  updateLeaderboard();
  updateChallenges();
}

// Leaderboard Functions
function updateLeaderboard() {
  const leaderboardContainer = document.getElementById("leaderboard");
  if (!leaderboardContainer) return;

  leaderboardContainer.innerHTML = "";

  // This would ideally be fetched from a backend or updated based on user data
  const leaderboardData = [
    { rank: 1, name: "You", score: userStats.xp },
    { rank: 2, name: "Sarah M.", score: 1250 },
    { rank: 3, name: "Mike R.", score: 1180 },
  ];

  leaderboardData.forEach((user) => {
    const leaderboardItem = document.createElement("div");
    leaderboardItem.className = "leaderboard-item";
    leaderboardItem.innerHTML = `
      <div class="rank-badge">${user.rank}</div>
      <div>
        <strong>${user.name}</strong><br>
        <small>${user.score} XP</small>
      </div>
    `;
    leaderboardContainer.appendChild(leaderboardItem);
  });
}

// Challenges Functions
function updateChallenges() {
  const challengesContainer = document.getElementById("challenges");
  if (!challengesContainer) return;

  challengesContainer.innerHTML = "";

  const challenges = [
    {
      name: "Burn 2000 Calories",
      currentProgress: 0,
      target: 2000,
    },
    {
      name: "5-Day Streak",
      currentProgress: userStats.currentStreak,
      target: 5,
    },
  ];

  challenges.forEach((challenge) => {
    const challengeElement = document.createElement("div");
    challengeElement.className = "goal-item";
    challengeElement.innerHTML = `
      <h5>${challenge.name}</h5>
      <div class="goal-progress">
        <div class="progress-bar">
          <div
            class="progress-fill"
            style="width: ${
              (challenge.currentProgress / challenge.target) * 100
            }%"
          ></div>
        </div>
        <p><span>${challenge.currentProgress}</span>/${challenge.target}</p>
      </div>
    `;
    challengesContainer.appendChild(challengeElement);
  });
}

// Share to social media
function shareToSocial(platform) {
  const shareText = `Just completed my fitness goal! 💪 Check out my progress with Smart Fitness Tracker! #FitnessGoals #Workout`;
  const shareUrl = window.location.href;

  let url;
  switch (platform) {
    case "facebook":
      url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        shareUrl
      )}&quote=${encodeURIComponent(shareText)}`;
      break;
    case "twitter":
      url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        shareText
      )}&url=${encodeURIComponent(shareUrl)}`;
      break;
    case "instagram":
      // Instagram doesn't support direct URL sharing, so copy to clipboard
      navigator.clipboard.writeText(shareText + " " + shareUrl).then(() => {
        showToast("Text copied! Open Instagram and paste to share.", "success");
      });
      return;
  }

  if (url) {
    window.open(url, "_blank", "width=600,height=400");
  }
}

// Export data function
function exportData() {
  const allData = {
    workoutData: workoutData,
    nutritionData: nutritionData,
    goals: goals,
    userStats: userStats,
    exportDate: new Date().toISOString(),
  };

  const dataStr = JSON.stringify(allData, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(dataBlob);
  link.download = `fitness-data-${new Date().toISOString().split("T")[0]}.json`;
  link.click();

  showToast("Data exported successfully!", "success");
}

// Clear all data
function clearData() {
  if (
    confirm("Are you sure you want to clear all data? This cannot be undone.")
  ) {
    localStorage.clear();
    location.reload();
  }
}

// Display Toast message
function showToast(message, type) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add(type, "show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// Workout Timer Functions
function startTimer() {
  if (timerRunning) return;

  const minutes = parseInt(document.getElementById("timerMinutes").value) || 25;
  const seconds = parseInt(document.getElementById("timerSeconds").value) || 0;
  timerSeconds = minutes * 60 + seconds;

  timerRunning = true;
  timer = setInterval(updateTimer, 1000);
}

function updateTimer() {
  if (timerSeconds <= 0) {
    clearInterval(timer);
    timerRunning = false;
    document.getElementById("timerDisplay").textContent = "00:00";
    showToast("Timer finished! Great job! 🎉", "success");
    return;
  }

  timerSeconds--;
  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;
  document.getElementById("timerDisplay").textContent = `${String(
    minutes
  ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function pauseTimer() {
  clearInterval(timer);
  timerRunning = false;
}

function stopTimer() {
  clearInterval(timer);
  timerRunning = false;
  timerSeconds = 0;
  document.getElementById("timerDisplay").textContent = "00:00";
}

// HIIT Timer Functions
function startHIIT() {
  if (hiitRunning) return;

  const workTime = parseInt(document.getElementById("workTime").value) || 30;
  const restTime = parseInt(document.getElementById("restTime").value) || 10;
  totalRounds = parseInt(document.getElementById("rounds").value) || 8;

  currentRound = 1;
  currentHiitPhase = "work";
  timerSeconds = workTime;
  hiitRunning = true;

  document.getElementById("hiitStatus").style.display = "block";
  updateHIITDisplay();

  hiitTimer = setInterval(() => {
    if (timerSeconds <= 0) {
      // Switch phase
      if (currentHiitPhase === "work") {
        currentHiitPhase = "rest";
        timerSeconds = restTime;
      } else {
        currentHiitPhase = "work";
        currentRound++;
        timerSeconds = workTime;

        if (currentRound > totalRounds) {
          // HIIT complete
          clearInterval(hiitTimer);
          hiitRunning = false;
          document.getElementById("hiitStatus").style.display = "none";
          showToast("HIIT workout complete! Amazing effort! 🔥", "success");
          return;
        }
      }
    } else {
      timerSeconds--;
    }

    updateHIITDisplay();
  }, 1000);
}

function updateHIITDisplay() {
  document.getElementById("hiitPhase").textContent =
    currentHiitPhase.toUpperCase();

  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;
  document.getElementById("hiitTimer").textContent = `${String(
    minutes
  ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  document.getElementById("currentRound").textContent = currentRound;
  document.getElementById("totalRounds").textContent = totalRounds;
}
