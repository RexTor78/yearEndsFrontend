const family = localStorage.getItem("familyCandidate");

document.getElementById("title").innerText =
  `¿Son la familia ${family}?`;

document.getElementById("message").innerText =
  "Nuestro sistema de reconocimiento ha identificado a su unidad familiar.";

document.getElementById("yesBtn").onclick = () => {
  window.location.href = "trivia.html";
};

document.getElementById("noBtn").onclick = () => {
  alert("Disculpen las molestias, intentando otra identificación...");
  // En el futuro saltará a la siguiente familia
};
