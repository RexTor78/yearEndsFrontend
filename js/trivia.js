// trivia.js
document.addEventListener("DOMContentLoaded", () => {
  const questionEl = document.getElementById("question");
  const optionsEl = document.getElementById("options");

  // Trivia de ejemplo
  const questions = [
    {
      question: "¿Cuál es la comida favorita de la familia?",
      options: ["Pizza", "Paella", "Sushi", "Tacos"],
      answer: "Paella"
    },
    {
      question: "¿Cuántos miembros componen la familia?",
      options: ["2", "3", "4", "5"],
      answer: "4"
    },
    {
      question: "¿Qué bebida prefieren en las reuniones?",
      options: ["Agua", "Vino", "Refrescos", "Cerveza"],
      answer: "Vino"
    }
  ];

  let currentQuestionIndex = 0;

  function renderQuestion() {
    const q = questions[currentQuestionIndex];
    questionEl.innerText = q.question;
    optionsEl.innerHTML = "";

    q.options.forEach(opt => {
      const btn = document.createElement("button");
      btn.innerText = opt;
      btn.classList.add("secondary");
      btn.addEventListener("click", () => checkAnswer(opt));
      optionsEl.appendChild(btn);
    });
  }

  function checkAnswer(selected) {
    const q = questions[currentQuestionIndex];
    if (selected === q.answer) {
      currentQuestionIndex++;
      if (currentQuestionIndex >= questions.length) {
        // Fin trivia
        window.location.href = "./celebration.html";
      } else {
        renderQuestion();
      }
    } else {
      alert("❌ Respuesta incorrecta, intente de nuevo.");
    }
  }

  renderQuestion();
  if (currentQuestionIndex >= questions.length) {
    window.location.href = "./celebration.html"; // ← Redirige a celebración
  }

});
