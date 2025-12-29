let totalTime = 7 * 60; // 7 minutos
const timerEl = document.getElementById("timer");

const timerInterval = setInterval(() => {
  totalTime--;
  const min = Math.floor(totalTime / 60);
  const sec = totalTime % 60;
  timerEl.innerText = `⏱️ ${min}:${sec.toString().padStart(2,"0")}`;

  if (totalTime <= 0) {
    clearInterval(timerInterval);
    alert("⏱️ Tiempo agotado. Se pasa a la siguiente fase automáticamente.");
    window.location.href = "trivia.html"; // fase siguiente
  }
}, 1000);
