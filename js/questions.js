let current = 0;
let answers = [];
let questions = [];
let metrics = {};
const family = localStorage.getItem("family");

fetch("data/questions.json")
  .then(res => res.json())
  .then(data => {
    questions = data.filter(q => !q.family || q.family === family);
    showQuestion();
  });

function showQuestion() {
  const q = questions[current];
  document.getElementById("questionText").innerText = q.text;

  const optionsDiv = document.getElementById("options");
  const textArea = document.getElementById("textAnswer");
  const qImg = document.getElementById("questionImage");
  const reactionImg = document.getElementById("reactionImage");

  optionsDiv.innerHTML = "";
  textArea.style.display = "none";
  qImg.style.display = "none";
  reactionImg.style.display = "none";

  if (q.type === "choice" || q.type === "image") {
    q.options.forEach(opt => {
      const btn = document.createElement("button");
      btn.innerText = opt.text;
      btn.onclick = () => answer(opt);
      optionsDiv.appendChild(btn);
    });
  }

  if (q.type === "text") {
    textArea.style.display = "block";
  }

  if (q.image) {
    qImg.src = q.image;
    qImg.style.display = "block";
  }
}

function answer(option) {
  // Guardar métricas
  if (option.tag) metrics[option.tag] = (metrics[option.tag] || 0) + 1;

  // Guardar respuesta
  answers.push({
    questionId: questions[current].id,
    answer: option.text,
    tag: option.tag || null
  });

  // Mostrar mensaje dinámico
  showDynamicMessage(option.message);

  // Mostrar imagen reacción si existe
  const reactionImg = document.getElementById("reactionImage");
  const q = questions[current];
  if (q.reactionImage) {
    reactionImg.src = q.reactionImage;
    reactionImg.style.display = "block";
  }

  setTimeout(() => {
    reactionImg.style.display = "none";
    current++;
    if (current >= questions.length) {
      compareFamilyResponses();
    } else {
      showQuestion();
    }
  }, 2500);
}

function showDynamicMessage(message) {
  const msg = document.getElementById("dynamicMessage");
  msg.innerText = message;
  msg.style.display = "block";
  setTimeout(() => { msg.style.display = "none"; }, 1800);
}

// Función simulada de comparación familiar
function compareFamilyResponses() {
  // Por ejemplo: si hay tags conflictivos, mostrar imagen "uy uy uy"
  const conflict = metrics.rancio > 0 && metrics.fiestero > 0;
  if (conflict) {
    const reactionImg = document.getElementById("reactionImage");
    reactionImg.src = "/assets/reactions/uyuyuy.png";
    reactionImg.style.display = "block";
    setTimeout(() => { reactionImg.style.display = "none"; window.location.href = "trivia.html"; }, 3000);
  } else {
    window.location.href = "trivia.html"; // fase siguiente
  }
}
