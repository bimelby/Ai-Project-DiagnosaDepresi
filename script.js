// Data pertanyaan dan info tambahan
const questions = [
  {
    title: "Suasana Hati",
    text: "Seberapa sering Anda merasa sedih, putus asa, atau tertekan dalam 2 minggu terakhir?",
    desc: "Skala: 0 = Tidak pernah, 10 = Selalu",
    variable: "mood",
    info: "Pertanyaan ini membantu mengukur intensitas perasaan sedih atau tertekan yang mungkin Anda alami. Cobalah untuk menjawab dengan jujur berdasarkan pengalaman Anda dalam 2 minggu terakhir.",
  },
  {
    title: "Kehilangan Minat",
    text: "Seberapa besar kehilangan minat atau kesenangan Anda terhadap aktivitas yang biasanya Anda nikmati?",
    desc: "Skala: 0 = Tidak ada kehilangan minat, 10 = Kehilangan minat total",
    variable: "interest",
    info: "Kehilangan minat pada aktivitas yang biasanya menyenangkan merupakan gejala umum depresi. Nilai yang lebih tinggi menunjukkan tingkat kehilangan minat yang lebih besar.",
  },
  {
    title: "Tingkat Energi",
    text: "Seberapa sering Anda merasa lelah atau kehilangan energi tanpa alasan yang jelas?",
    desc: "Skala: 0 = Energi normal, 10 = Sangat lelah/tidak ada energi",
    variable: "energy",
    info: "Kelelahan dan kurangnya energi adalah indikator penting dalam menilai tingkat depresi. Pertimbangkan tingkat energi Anda dibandingkan dengan kondisi normal Anda.",
  },
  {
    title: "Gangguan Tidur",
    text: "Seberapa parah gangguan tidur yang Anda alami (sulit tidur, terlalu banyak tidur, atau sering terbangun)?",
    desc: "Skala: 0 = Tidur normal, 10 = Gangguan tidur sangat parah",
    variable: "sleep",
    info: "Perubahan pola tidur sering terjadi pada orang dengan depresi. Ini bisa berupa insomnia (kesulitan tidur) atau hipersomnia (tidur berlebihan).",
  },
  {
    title: "Konsentrasi",
    text: "Seberapa sulit Anda berkonsentrasi, mengingat, atau membuat keputusan?",
    desc: "Skala: 0 = Konsentrasi normal, 10 = Sangat sulit berkonsentrasi",
    variable: "concentration",
    info: "Kesulitan berkonsentrasi atau membuat keputusan adalah gejala kognitif umum pada depresi. Pertimbangkan bagaimana hal ini memengaruhi aktivitas sehari-hari Anda.",
  },
  {
    title: "Perasaan Bersalah",
    text: "Seberapa sering Anda merasa bersalah, tidak berharga, atau menyalahkan diri sendiri?",
    desc: "Skala: 0 = Tidak pernah, 10 = Selalu merasa bersalah/tidak berharga",
    variable: "guilt",
    info: "Perasaan bersalah yang berlebihan atau tidak proporsional serta perasaan tidak berharga adalah indikator penting dalam menilai depresi.",
  },
  {
    title: "Pikiran Tentang Kematian",
    text: "Seberapa sering Anda memikirkan tentang kematian atau menyakiti diri sendiri?",
    desc: "Skala: 0 = Tidak pernah, 10 = Sangat sering/ada rencana",
    variable: "death_thoughts",
    info: "Pertanyaan ini mengukur tingkat keparahan pikiran terkait kematian. Jika Anda memiliki pikiran untuk menyakiti diri sendiri, SEGERA hubungi profesional kesehatan mental atau layanan darurat.",
  },
];

// State aplikasi
let currentQuestion = 0;
let answers = [];

// Fungsi Keanggotaan Fuzzy sesuai Metode Mamdani
class FuzzyMembership {
  // Fungsi keanggotaan trapesium
  static trapezoid(x, a, b, c, d) {
    if (x <= a || x >= d) return 0;
    if (x >= b && x <= c) return 1;
    if (x > a && x < b) return (x - a) / (b - a);
    if (x > c && x < d) return (d - x) / (d - c);
    return 0;
  }

  // Fungsi keanggotaan untuk input (0-10) menggunakan trapesium
  static getInputMembership(value) {
    return {
      rendah: this.trapezoid(value, -1, 0, 2, 4),
      sedang: this.trapezoid(value, 2, 4, 6, 8),
      tinggi: this.trapezoid(value, 6, 8, 10, 11),
    };
  }

  // Fungsi keanggotaan untuk output (0-100) menggunakan trapesium
  static getOutputTrapezoid(z, category) {
    const params = this.getOutputParameters()[category];
    return this.trapezoid(z, params.a, params.b, params.c, params.d);
  }

  // Parameter untuk fungsi keanggotaan output (trapesium)
  static getOutputParameters() {
    return {
      normal: { a: 0, b: 10, c: 20, d: 30 },
      ringan: { a: 20, b: 30, c: 40, d: 60 },
      menengah: { a: 40, b: 55, c: 65, d: 80 },
      berat: { a: 60, b: 75, c: 85, d: 95 },
      beresiko: { a: 85, b: 90, c: 100, d: 100 },
    };
  }
}

// Sistem Fuzzy Mamdani sesuai dengan 4 tahapan
class MamdaniFuzzySystem {
  constructor() {
    this.rules = this.initializeRules();
    this.fuzzificationResults = {};
    this.implicationResults = [];
    this.compositionResults = {};
    this.defuzzificationResult = 0;
  }

  initializeRules() {
    return [
      // Rules untuk Normal (0-2 gejala rendah-sedang)
      {
        id: 1,
        conditions: [
          "rendah",
          "rendah",
          "rendah",
          "rendah",
          "rendah",
          "rendah",
          "rendah",
        ],
        output: "normal",
      },
      {
        id: 2,
        conditions: [
          "sedang",
          "rendah",
          "rendah",
          "rendah",
          "rendah",
          "rendah",
          "rendah",
        ],
        output: "normal",
      },
      {
        id: 3,
        conditions: [
          "rendah",
          "sedang",
          "rendah",
          "rendah",
          "rendah",
          "rendah",
          "rendah",
        ],
        output: "normal",
      },

      // Rules untuk Depresi Ringan (2-3 gejala sedang)
      {
        id: 4,
        conditions: [
          "sedang",
          "sedang",
          "rendah",
          "rendah",
          "rendah",
          "rendah",
          "rendah",
        ],
        output: "ringan",
      },
      {
        id: 5,
        conditions: [
          "sedang",
          "rendah",
          "sedang",
          "rendah",
          "rendah",
          "rendah",
          "rendah",
        ],
        output: "ringan",
      },
      {
        id: 6,
        conditions: [
          "rendah",
          "sedang",
          "sedang",
          "rendah",
          "rendah",
          "rendah",
          "rendah",
        ],
        output: "ringan",
      },
      {
        id: 7,
        conditions: [
          "sedang",
          "sedang",
          "sedang",
          "rendah",
          "rendah",
          "rendah",
          "rendah",
        ],
        output: "ringan",
      },
      {
        id: 8,
        conditions: [
          "tinggi",
          "rendah",
          "rendah",
          "rendah",
          "rendah",
          "rendah",
          "rendah",
        ],
        output: "ringan",
      },

      // Rules untuk Depresi Menengah (3-4 gejala sedang-tinggi)
      {
        id: 9,
        conditions: [
          "sedang",
          "sedang",
          "sedang",
          "sedang",
          "rendah",
          "rendah",
          "rendah",
        ],
        output: "menengah",
      },
      {
        id: 10,
        conditions: [
          "tinggi",
          "sedang",
          "sedang",
          "rendah",
          "rendah",
          "rendah",
          "rendah",
        ],
        output: "menengah",
      },
      {
        id: 11,
        conditions: [
          "sedang",
          "tinggi",
          "sedang",
          "sedang",
          "rendah",
          "rendah",
          "rendah",
        ],
        output: "menengah",
      },
      {
        id: 12,
        conditions: [
          "tinggi",
          "tinggi",
          "rendah",
          "rendah",
          "rendah",
          "rendah",
          "rendah",
        ],
        output: "menengah",
      },
      {
        id: 13,
        conditions: [
          "sedang",
          "sedang",
          "tinggi",
          "sedang",
          "sedang",
          "rendah",
          "rendah",
        ],
        output: "menengah",
      },
      {
        id: 14,
        conditions: [
          "tinggi",
          "sedang",
          "sedang",
          "sedang",
          "sedang",
          "rendah",
          "rendah",
        ],
        output: "menengah",
      },

      // Rules untuk Depresi Berat (4+ gejala tinggi)
      {
        id: 15,
        conditions: [
          "tinggi",
          "tinggi",
          "sedang",
          "sedang",
          "sedang",
          "sedang",
          "rendah",
        ],
        output: "berat",
      },
      {
        id: 16,
        conditions: [
          "tinggi",
          "tinggi",
          "tinggi",
          "sedang",
          "sedang",
          "rendah",
          "rendah",
        ],
        output: "berat",
      },
      {
        id: 17,
        conditions: [
          "sedang",
          "tinggi",
          "tinggi",
          "tinggi",
          "sedang",
          "sedang",
          "rendah",
        ],
        output: "berat",
      },
      {
        id: 18,
        conditions: [
          "tinggi",
          "tinggi",
          "tinggi",
          "tinggi",
          "sedang",
          "sedang",
          "rendah",
        ],
        output: "berat",
      },
      {
        id: 19,
        conditions: [
          "tinggi",
          "tinggi",
          "tinggi",
          "sedang",
          "tinggi",
          "tinggi",
          "rendah",
        ],
        output: "berat",
      },

      // Rules untuk Depresi Berat Beresiko (pikiran kematian tinggi atau semua gejala tinggi)
      {
        id: 20,
        conditions: [
          "tinggi",
          "tinggi",
          "tinggi",
          "tinggi",
          "tinggi",
          "tinggi",
          "sedang",
        ],
        output: "beresiko",
      },
      {
        id: 21,
        conditions: [
          "tinggi",
          "tinggi",
          "tinggi",
          "tinggi",
          "tinggi",
          "tinggi",
          "tinggi",
        ],
        output: "beresiko",
      },
      // Rules khusus untuk pikiran kematian
      {
        id: 22,
        conditions: [
          "sedang",
          "sedang",
          "sedang",
          "sedang",
          "sedang",
          "sedang",
          "tinggi",
        ],
        output: "beresiko",
      },
      {
        id: 23,
        conditions: [
          "tinggi",
          "sedang",
          "sedang",
          "sedang",
          "sedang",
          "sedang",
          "tinggi",
        ],
        output: "beresiko",
      },
      {
        id: 24,
        conditions: [
          "tinggi",
          "tinggi",
          "sedang",
          "sedang",
          "sedang",
          "sedang",
          "tinggi",
        ],
        output: "beresiko",
      },
      {
        id: 25,
        conditions: [
          "tinggi",
          "tinggi",
          "tinggi",
          "sedang",
          "sedang",
          "sedang",
          "tinggi",
        ],
        output: "beresiko",
      },

      // Rules tambahan untuk menangkap kombinasi lainnya
      {
        id: 26,
        conditions: [
          "sedang",
          "sedang",
          "sedang",
          "sedang",
          "sedang",
          "rendah",
          "rendah",
        ],
        output: "ringan",
      },
      {
        id: 27,
        conditions: [
          "tinggi",
          "sedang",
          "tinggi",
          "sedang",
          "sedang",
          "sedang",
          "rendah",
        ],
        output: "menengah",
      },
      {
        id: 28,
        conditions: [
          "sedang",
          "tinggi",
          "tinggi",
          "tinggi",
          "tinggi",
          "sedang",
          "rendah",
        ],
        output: "berat",
      },
    ];
  }

  // Tahap 1: Fuzzifikasi (Fuzzification)
  fuzzification(inputValues) {
    this.fuzzificationResults = {};

    inputValues.forEach((value, index) => {
      const variable = questions[index].variable;
      this.fuzzificationResults[variable] = {
        value: value,
        memberships: FuzzyMembership.getInputMembership(value),
      };
    });

    return this.fuzzificationResults;
  }

  // Tahap 2: Penerapan Fungsi Implikasi (MIN operator)
  implication() {
    this.implicationResults = [];

    this.rules.forEach((rule) => {
      let minMembership = 1.0;
      const ruleEvaluation = {
        ruleId: rule.id,
        conditions: rule.conditions,
        output: rule.output,
        evaluations: [],
        alphaPredikat: 0,
      };

      rule.conditions.forEach((condition, index) => {
        if (condition === "*") {
          ruleEvaluation.evaluations.push({
            variable: questions[index].variable,
            condition: condition,
            membership: 1.0,
          });
          return;
        }

        const variable = questions[index].variable;
        const membership =
          this.fuzzificationResults[variable].memberships[condition] || 0;

        ruleEvaluation.evaluations.push({
          variable: variable,
          condition: condition,
          membership: membership,
        });

        // Operator MIN untuk implikasi
        minMembership = Math.min(minMembership, membership);
      });

      ruleEvaluation.alphaPredikat = minMembership;
      this.implicationResults.push(ruleEvaluation);
    });

    // Sort rules by alpha-predikat value (descending)
    this.implicationResults.sort((a, b) => b.alphaPredikat - a.alphaPredikat);

    return this.implicationResults;
  }

  // Tahap 3: Komposisi Aturan (MAX operator)
  composition() {
    this.compositionResults = {
      normal: 0,
      ringan: 0,
      menengah: 0,
      berat: 0,
      beresiko: 0,
    };

    this.implicationResults.forEach((rule) => {
      if (rule.alphaPredikat > 0) {
        // Operator MAX untuk komposisi
        this.compositionResults[rule.output] = Math.max(
          this.compositionResults[rule.output],
          rule.alphaPredikat
        );
      }
    });

    // Jika tidak ada rule yang aktif, berikan nilai default berdasarkan rata-rata input
    const totalActiveRules = Object.values(this.compositionResults).reduce(
      (sum, val) => sum + val,
      0
    );

    if (totalActiveRules === 0) {
      // Hitung rata-rata semua input untuk menentukan kategori default
      const inputValues = Object.values(this.fuzzificationResults).map(
        (item) => item.value
      );
      const average =
        inputValues.reduce((sum, val) => sum + val, 0) / inputValues.length;

      if (average <= 2) {
        this.compositionResults.normal = 0.5;
      } else if (average <= 4) {
        this.compositionResults.ringan = 0.5;
      } else if (average <= 6) {
        this.compositionResults.menengah = 0.5;
      } else if (average <= 8) {
        this.compositionResults.berat = 0.5;
      } else {
        this.compositionResults.beresiko = 0.5;
      }
    }

    return this.compositionResults;
  }

  // Tahap 4: Defuzzifikasi menggunakan metode Centroid
  // Dalam class MamdaniFuzzySystem, ubah bagian defuzzification:
  defuzzification() {
    const resolution = 0.5;
    const minZ = 0;
    const maxZ = 100;

    let numerator = 0;
    let denominator = 0;

    for (let z = minZ; z <= maxZ; z += resolution) {
      let maxMembership = 0;

      for (const [category, alpha] of Object.entries(this.compositionResults)) {
        if (alpha > 0) {
          // Ganti getOutputTriangle dengan getOutputTrapezoid
          let membership = FuzzyMembership.getOutputTrapezoid(z, category);
          membership = Math.min(membership, alpha);
          maxMembership = Math.max(maxMembership, membership);
        }
      }

      numerator += z * maxMembership * resolution;
      denominator += maxMembership * resolution;
    }

    this.defuzzificationResult = denominator > 0 ? numerator / denominator : 0;

    return {
      score: Math.round(this.defuzzificationResult),
      calculation: {
        numerator: numerator,
        denominator: denominator,
        formula: "z* = ∫ z * μ(z) dz / ∫ μ(z) dz (trapesium membership)",
      },
    };
  }

  // Proses inferensi lengkap sesuai Metode Mamdani
  diagnose(inputValues) {
    // Tahap 1: Fuzzifikasi
    const fuzzResults = this.fuzzification(inputValues);

    // Tahap 2: Implikasi
    const implResults = this.implication();

    // Tahap 3: Komposisi
    const compResults = this.composition();

    // Tahap 4: Defuzzifikasi
    const defuzzResults = this.defuzzification();

    // Tentukan diagnosis berdasarkan membership tertinggi
    let maxMembership = 0;
    let diagnosis = "normal";

    for (const [category, membership] of Object.entries(compResults)) {
      if (membership > maxMembership) {
        maxMembership = membership;
        diagnosis = category;
      }
    }

    // Jika masih normal tapi ada input tinggi, override berdasarkan logika tambahan
    if (diagnosis === "normal") {
      const highInputs = inputValues.filter((val) => val >= 7).length;
      const veryHighInputs = inputValues.filter((val) => val >= 9).length;

      if (veryHighInputs >= 2) {
        diagnosis = "berat";
        maxMembership = 0.7;
      } else if (highInputs >= 3) {
        diagnosis = "menengah";
        maxMembership = 0.6;
      } else if (inputValues.some((val) => val >= 6)) {
        diagnosis = "ringan";
        maxMembership = 0.5;
      }
    }

    // Special case for suicide thoughts (question 7)
    if (inputValues[6] >= 8) {
      diagnosis = "beresiko";
      maxMembership = 0.8;
    }

    return {
      diagnosis,
      score: defuzzResults.score,
      confidence: Math.round(maxMembership * 100),
      fuzzification: fuzzResults,
      implication: implResults.slice(0, 5), // Get only top 5 rules for simplicity
      composition: compResults,
      defuzzification: defuzzResults,
    };
  }
}

// Inisialisasi sistem fuzzy
const fuzzySystem = new MamdaniFuzzySystem();

// Event listeners
document.addEventListener("DOMContentLoaded", () => {
  // Show landing page first
  document.getElementById("landingPage").style.display = "flex";
  document.getElementById("mainContainer").style.display = "none";

  // Start button click handler
  document.getElementById("startBtn").addEventListener("click", () => {
    document.getElementById("landingPage").style.display = "none";
    document.getElementById("mainContainer").style.display = "block";
    updateQuestion();
  });

  document.getElementById("nextBtn").addEventListener("click", nextQuestion);
  document.getElementById("prevBtn").addEventListener("click", prevQuestion);
  document.getElementById("restartBtn").addEventListener("click", restart);
  document.getElementById("printBtn").addEventListener("click", printResult);

  // Slider and input synchronization
  const slider = document.getElementById("answerSlider");
  const input = document.getElementById("answerInput");
  const thumb = document.getElementById("sliderThumb");

  slider.addEventListener("input", () => {
    input.value = slider.value;
    updateSliderThumb(slider.value);
    updateScaleBarHighlight(slider.value);
    validateInput();
  });

  input.addEventListener("input", () => {
    if (!isNaN(input.value) && input.value >= 0 && input.value <= 10) {
      slider.value = input.value;
      updateSliderThumb(input.value);
      updateScaleBarHighlight(input.value);
    }
    validateInput();
  });
});

function getSliderLevelAndColor(value) {
  // 6 levels: blue, green, yellow, orange, red, purple
  if (value <= 1) {
    return { level: 'level-1', color: 'var(--health-blue)' };
  } else if (value <= 3) {
    return { level: 'level-2', color: 'var(--health-green)' };
  } else if (value <= 5) {
    return { level: 'level-3', color: 'var(--health-yellow)' };
  } else if (value <= 7) {
    return { level: 'level-4', color: 'var(--health-orange)' };
  } else if (value <= 9) {
    return { level: 'level-5', color: 'var(--health-red)' };
  } else {
    return { level: 'level-6', color: 'var(--health-purple)' };
  }
}

function updateSliderThumb(value) {
  const thumb = document.getElementById("sliderThumb");
  const slider = document.getElementById("answerSlider");
  const percent = (value / slider.max) * 100;

  // Update thumb position and value
  thumb.style.left = `${percent}%`;
  thumb.textContent = Number.parseFloat(value).toFixed(1);

  // Update thumb color based on value (6 levels)
  const { level, color } = getSliderLevelAndColor(value);
  thumb.style.background = color;
  slider.setAttribute('data-level', level);
}

function updateScaleBarHighlight(value) {
  // Remove all active classes
  document.querySelectorAll('.scale-bar').forEach(bar => bar.classList.remove('active'));
  // 6-level highlight
  const { level } = getSliderLevelAndColor(value);
  document.querySelector(`.scale-bar.${level}`)?.classList.add('active');
}

function validateInput() {
  const input = document.getElementById("answerInput");
  const value = Number.parseFloat(input.value);
  const nextBtn = document.getElementById("nextBtn");

  if (isNaN(value) || value < 0 || value > 10) {
    nextBtn.disabled = true;
    input.style.borderColor = "#dc3545";
  } else {
    nextBtn.disabled = false;
    input.style.borderColor = "#4facfe";
  }
}

function updateQuestion() {
  const question = questions[currentQuestion];
  const questionCircle = document.getElementById("questionCircle");
  const questionCounter = document.getElementById("questionCounter");
  const progressPercent = document.getElementById("progressPercent");

  // Update question content
  questionCircle.textContent = currentQuestion + 1;
  document.getElementById("questionTitle").textContent = question.title;
  document.getElementById("questionText").textContent = question.text;
  document.getElementById("questionDesc").textContent = question.desc;
  document.getElementById("questionInfo").textContent = question.info;

  // Update question counter
  questionCounter.textContent = `Pertanyaan ${currentQuestion + 1} dari ${
    questions.length
  }`;

  // Update progress bar
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  document.getElementById("progress").style.width = progress + "%";
  progressPercent.textContent = `${Math.round(progress)}%`;

  // Update buttons
  document.getElementById("prevBtn").disabled = currentQuestion === 0;
  document.getElementById("nextBtn").textContent =
    currentQuestion === questions.length - 1 ? "Lihat Hasil" : "Selanjutnya";
  document.getElementById("nextBtn").innerHTML =
    currentQuestion === questions.length - 1
      ? 'Lihat Hasil <i class="fas fa-chart-pie"></i>'
      : 'Selanjutnya <i class="fas fa-arrow-right"></i>';

  // Set previous answer if exists
  if (answers[currentQuestion] !== undefined) {
    document.getElementById("answerInput").value = answers[currentQuestion];
    document.getElementById("answerSlider").value = answers[currentQuestion];
    updateSliderThumb(answers[currentQuestion]);
    updateScaleBarHighlight(answers[currentQuestion]);
    validateInput();
  } else {
    document.getElementById("answerInput").value = "";
    document.getElementById("answerSlider").value = 0;
    updateSliderThumb(0);
    updateScaleBarHighlight(0);
    document.getElementById("nextBtn").disabled = true;
  }

  // Add animation class
  const questionCard = document.querySelector(".question-card");
  questionCard.classList.remove("animate");
  void questionCard.offsetWidth; // Trigger reflow
  questionCard.classList.add("animate");

  // Focus on input
  document.getElementById("answerInput").focus();
}

function nextQuestion() {
  const input = document.getElementById("answerInput");
  const value = Number.parseFloat(input.value);

  if (isNaN(value) || value < 0 || value > 10) {
    showAlert("Mohon masukkan nilai antara 0-10");
    return;
  }

  answers[currentQuestion] = value;

  if (currentQuestion < questions.length - 1) {
    currentQuestion++;
    updateQuestion();
  } else {
    showResult();
  }
}

function prevQuestion() {
  if (currentQuestion > 0) {
    currentQuestion--;
    updateQuestion();
  }
}

function showResult() {
  // Set current date for result
  const now = new Date();
  const dateOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  document.getElementById("resultDate").textContent = now.toLocaleDateString(
    "id-ID",
    dateOptions
  );

  // Process with Mamdani fuzzy system
  const result = fuzzySystem.diagnose(answers);

  // Hide question container
  document.getElementById("questionContainer").style.display = "none";

  // Show result container
  document.getElementById("resultContainer").style.display = "block";

  // Update progress to 100%
  document.getElementById("progress").style.width = "100%";
  document.getElementById("progressPercent").textContent = "100%";
  document.getElementById("questionCounter").textContent = "Diagnosa Selesai";

  // Display results
  displayDiagnosis(result);
  displayUserResponses();
  displayMamdaniSteps(result);
}

function displayDiagnosis(result) {
  const diagnosisMap = {
    normal: {
      text: "Normal",
      desc: "Tidak ada gejala signifikan yang mengindikasikan depresi.",
      class: "normal",
      icon: "fa-check-circle",
    },
    ringan: {
      text: "Depresi Ringan",
      desc: "Gejala ringan yang sesekali muncul, namun tidak terlalu mengganggu aktivitas sehari-hari.",
      class: "ringan",
      icon: "fa-info-circle",
    },
    menengah: {
      text: "Depresi Menengah",
      desc: "Gejala jelas terlihat dan mulai mengganggu produktivitas dan kegiatan sosial.",
      class: "menengah",
      icon: "fa-exclamation-circle",
    },
    berat: {
      text: "Depresi Berat",
      desc: "Gangguan fungsi sehari-hari yang signifikan dan membutuhkan intervensi profesional.",
      class: "berat",
      icon: "fa-exclamation-triangle",
    },
    beresiko: {
      text: "Depresi Berat Beresiko",
      desc: "Kondisi serius dengan risiko membahayakan diri, membutuhkan perawatan intensif segera.",
      class: "beresiko",
      icon: "fa-skull",
    },
  };

  const diagnosis = diagnosisMap[result.diagnosis];

  // Update diagnosis badge
  const badge = document.getElementById("diagnosisBadge");
  badge.className = `diagnosis-badge ${diagnosis.class}`;
  badge.innerHTML = `<i class="fas ${diagnosis.icon}"></i>`;

  // Update diagnosis level
  const levelElement = document.getElementById("diagnosisLevel");
  levelElement.textContent = diagnosis.text;
  levelElement.className = diagnosis.class;

  // Update description
  document.getElementById("diagnosisDescription").textContent = diagnosis.desc;

  // Update confidence score
  document.getElementById("confidenceScore").textContent = result.score;

  // Update meter fill
  const meterFill = document.getElementById("meterFill");
  meterFill.style.width = `${result.score}%`;

  // Adjust meter fill color based on diagnosis
  meterFill.className = `meter-fill ${result.diagnosis}`;

  // Display recommendation
  displayRecommendation(result.diagnosis);
}

function displayUserResponses() {
  const responsesContainer = document.getElementById("userResponses");
  let html = "";

  answers.forEach((value, index) => {
    const question = questions[index];

    // Determine severity class based on value
    let severityClass = "normal";
    if (value >= 8) {
      severityClass = "berat";
    } else if (value >= 6) {
      severityClass = "menengah";
    } else if (value >= 4) {
      severityClass = "ringan";
    }

    html += `
              <div class="response-item">
                <h5>${question.title}</h5>
                <p>${question.text}</p>
                <div class="response-value ${severityClass}">${value}</div>
              </div>
            `;
  });

  responsesContainer.innerHTML = html;
}

function displayMamdaniSteps(result) {
  // 1. Fuzzifikasi
  displayFuzzification(result.fuzzification);

  // 2. Implikasi
  displayImplication(result.implication);

  // 3. Komposisi
  displayComposition(result.composition);

  // 4. Defuzzifikasi
  displayDefuzzification(result.defuzzification, result.composition);
}

function displayFuzzification(fuzzResults) {
  let html = '<table class="membership-table">';
  html +=
    "<tr><th>Variabel</th><th>Nilai</th><th>Rendah</th><th>Sedang</th><th>Tinggi</th></tr>";

  for (const [variable, data] of Object.entries(fuzzResults)) {
    const questionTitle =
      questions.find((q) => q.variable === variable)?.title || variable;
    html += `<tr>
              <td>${questionTitle}</td>
              <td>${data.value.toFixed(1)}</td>
              <td>${data.memberships.rendah.toFixed(2)}</td>
              <td>${data.memberships.sedang.toFixed(2)}</td>
              <td>${data.memberships.tinggi.toFixed(2)}</td>
            </tr>`;
  }

  html += "</table>";

  // Add visualization hint
  html += `<p class="step-note">
            <i class="fas fa-info-circle"></i> Nilai dalam tabel menunjukkan derajat keanggotaan input dalam 
            himpunan fuzzy (0 = tidak anggota, 1 = anggota penuh).
          </p>`;

  document.getElementById("fuzzificationResults").innerHTML = html;
}

function displayImplication(implResults) {
  let html = "";

  if (implResults.length === 0) {
    html = "<p>Tidak ada rule yang aktif</p>";
  } else {
    html +=
      "<p>Berikut adalah rule-rule dengan nilai α-predikat tertinggi:</p>";

    implResults.forEach((rule) => {
      if (rule.alphaPredikat > 0) {
        // Create a more readable representation of the rule
        const conditionText = rule.conditions
          .map((condition, index) => {
            const variable = questions[index].title;
            return `${variable} adalah ${condition}`;
          })
          .join(" DAN ");

        html += `<div class="rule-item">
                  <strong>Rule ${rule.ruleId}:</strong><br>
                  JIKA ${conditionText}<br>
                  MAKA tingkat depresi adalah ${rule.output}<br>
                  <strong>α-predikat = ${rule.alphaPredikat.toFixed(2)}</strong>
                </div>`;
      }
    });

    html += `<p class="step-note">
              <i class="fas fa-info-circle"></i> α-predikat adalah nilai minimum dari derajat keanggotaan 
              pada setiap kondisi rule (operator AND menggunakan fungsi MIN).
            </p>`;
  }

  document.getElementById("implicationResults").innerHTML = html;
}

function displayComposition(compResults) {
  let html = '<table class="membership-table">';
  html += "<tr><th>Output</th><th>Nilai Komposisi (MAX)</th></tr>";

  let hasActiveValues = false;
  for (const [category, value] of Object.entries(compResults)) {
    if (value > 0) {
      hasActiveValues = true;
      const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
      html += `<tr>
                <td>${categoryName}</td>
                <td>${value.toFixed(2)}</td>
              </tr>`;
    }
  }

  html += "</table>";

  if (!hasActiveValues) {
    html = "<p>Tidak ada nilai komposisi yang aktif.</p>";
  } else {
    html += `<p class="step-note">
              <i class="fas fa-info-circle"></i> Nilai komposisi adalah nilai maksimum dari 
              α-predikat untuk setiap kategori output (operator OR menggunakan fungsi MAX).
            </p>`;
  }

  document.getElementById("compositionResults").innerHTML = html;
}

function displayDefuzzification(defuzzResults, compResults) {
  // Create a more detailed explanation with formula
  const html = `
            <div class="step-content">
              <p><strong>Metode: Centroid (Center of Mass)</strong></p>
              
              <p>Perhitungan menggunakan integrasi numerik untuk metode centroid:</p>
              <p>Rumus: z* = ∫ z * μ(z) dz / ∫ μ(z) dz</p>
              <p>dimana:</p>
              <ul>
                <li>z = nilai output (0-100)</li>
                <li>μ(z) = derajat keanggotaan z setelah diclip dengan α-predikat</li>
                <li>∫ = integral (dihitung dengan metode numerik)</li>
              </ul>
              
              <p>Hasil Perhitungan:</p>
              <ul>
                <li>Numerator (∫ z * μ(z) dz): ${defuzzResults.calculation.numerator.toFixed(
                  2
                )}</li>
                <li>Denominator (∫ μ(z) dz): ${defuzzResults.calculation.denominator.toFixed(
                  2
                )}</li>
                <li>Hasil Defuzzifikasi: ${defuzzResults.calculation.numerator.toFixed(
                  2
                )} / ${defuzzResults.calculation.denominator.toFixed(2)} = ${
    defuzzResults.score
  }</li>
              </ul>
              
              <p class="step-note">
                <i class="fas fa-info-circle"></i> Nilai defuzzifikasi final menunjukkan tingkat depresi 
                pada skala 0-100. Semakin tinggi nilainya, semakin berat tingkat depresi.
              </p>
            </div>
          `;

  document.getElementById("defuzzificationResults").innerHTML = html;
}

function displayRecommendation(diagnosis) {
  const recommendations = {
    normal: {
      text: "Berdasarkan hasil, Anda tidak menunjukkan gejala depresi yang signifikan. Tetap jaga kesehatan mental Anda dengan:",
      items: [
        "Menjaga pola tidur yang teratur dan cukup (7-8 jam per hari)",
        "Melakukan aktivitas fisik secara rutin",
        "Mengelola stres dengan teknik relaksasi seperti meditasi atau pernapasan dalam",
        "Menjaga hubungan sosial yang sehat dengan orang-orang terdekat",
        "Lakukan aktivitas yang Anda nikmati dan memberi makna",
      ],
    },
    ringan: {
      text: "Anda menunjukkan gejala depresi ringan. Berikut beberapa hal yang dapat Anda lakukan:",
      items: [
        "Bicarakan perasaan Anda dengan teman atau keluarga yang Anda percaya",
        "Tetapkan rutinitas harian yang teratur, termasuk waktu tidur dan bangun yang konsisten",
        "Kurangi konsumsi alkohol dan kafein",
        "Mulai jurnal harian untuk mencatat pikiran dan perasaan Anda",
        "Pertimbangkan untuk berkonsultasi dengan psikolog jika gejala berlanjut lebih dari dua minggu",
      ],
    },
    menengah: {
      text: "Anda menunjukkan gejala depresi tingkat menengah. Disarankan untuk:",
      items: [
        "Segera konsultasikan kondisi Anda dengan profesional kesehatan mental (psikolog/psikiater)",
        "Jangan menyimpan perasaan sendiri, bagi dengan orang terdekat yang Anda percaya",
        "Hindari isolasi sosial dan tetap terhubung dengan orang-orang terdekat",
        "Coba teknik mindfulness atau terapi kognitif perilaku sederhana",
        "Tetap aktif secara fisik meskipun hanya dengan aktivitas ringan",
        "Jaga pola makan sehat dan hindari zat yang dapat memperburuk depresi",
      ],
    },
    berat: {
      text: "Anda menunjukkan gejala depresi berat. Tindakan yang perlu diambil:",
      items: [
        "SEGERA konsultasikan dengan psikiater untuk evaluasi dan penanganan profesional",
        "Pertimbangkan opsi terapi yang tersedia seperti Terapi Kognitif Perilaku (CBT) atau konseling",
        "Diskusikan dengan profesional kesehatan mental tentang kemungkinan pengobatan",
        "Buat rencana keselamatan dengan bantuan profesional kesehatan mental",
        "Minta dukungan dari keluarga atau teman dekat untuk pendampingan",
        "Hubungi layanan kesehatan mental terdekat atau hotline krisis jika dibutuhkan",
      ],
    },
    beresiko: {
      text: "Hasil menunjukkan Anda berada dalam risiko tinggi dan membutuhkan perhatian segera:",
      items: [
        "SEGERA hubungi layanan gawat darurat 119 atau hotline krisis 113",
        "JANGAN tinggal sendirian, hubungi orang terdekat untuk mendampingi",
        "Segera kunjungi Unit Gawat Darurat (UGD) rumah sakit terdekat",
        "Informasikan keluarga atau teman tentang kondisi Anda",
        "Jangan mengonsumsi alkohol atau obat-obatan tanpa pengawasan medis",
        "Prioritaskan keselamatan diri Anda di atas segalanya",
      ],
    },
  };

  const recommendation = recommendations[diagnosis];

  document.getElementById("recommendationText").textContent =
    recommendation.text;

  let itemsHtml = "";
  recommendation.items.forEach((item) => {
    itemsHtml += `
              <div class="recommendation-item">
                <i class="fas fa-check-circle"></i>
                <p>${item}</p>
              </div>
            `;
  });

  document.getElementById("recommendationList").innerHTML = itemsHtml;
}

function restart() {
  currentQuestion = 0;
  answers = [];

  document.getElementById("resultContainer").style.display = "none";
  document.getElementById("questionContainer").style.display = "grid";

  updateQuestion();
}

function printResult() {
  window.print();
}

// FIXED: Accordion functionality
function toggleAccordion(sectionId) {
  const section = document.getElementById(sectionId);
  const accordionItem = section.parentElement;

  // Toggle active class
  accordionItem.classList.toggle("active");

  // Close other accordion items (optional - for single open behavior)
  // Uncomment the lines below if you want only one accordion open at a time
  /*
          const allAccordionItems = document.querySelectorAll('.accordion-item')
          allAccordionItems.forEach(item => {
            if (item !== accordionItem) {
              item.classList.remove('active')
            }
          })
          */
}

// Keyboard navigation
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !document.getElementById("nextBtn").disabled) {
    nextQuestion();
  }
  if (e.key === "ArrowLeft" && !document.getElementById("prevBtn").disabled) {
    prevQuestion();
  }
  if (e.key === "ArrowRight" && !document.getElementById("nextBtn").disabled) {
    nextQuestion();
  }
});

// Show alert
function showAlert(message) {
  alert(message);
  // In a more sophisticated version, this could be a custom modal
}
