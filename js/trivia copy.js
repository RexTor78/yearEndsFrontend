// Recuperamos datos del sessionStorage
const family = sessionStorage.getItem("family");
const selfieUrl = sessionStorage.getItem("selfieUrl");
const productsUrl = sessionStorage.getItem("productsUrl");
const message = sessionStorage.getItem("specialMessage");

// Elementos del DOM
const triviaContainer = document.getElementById("triviaContainer");
const selfieImg = document.getElementById("selfieImg");
const productsImg = document.getElementById("productsImg");
const statusMessage = document.getElementById("triviaStatus");

// Mostrar foto de la familia
if (selfieUrl) {
  selfieImg.src = selfieUrl;
  selfieImg.style.display = "block";
}

// Mostrar foto de productos si existe
if (productsUrl) {
  productsImg.src = productsUrl;
  productsImg.style.display = "block";
}

// Mostrar mensaje especial si existe
if (specialMessage) {
  statusMessage.innerText = specialMessage;
}

// Aquí puedes agregar lógica del trivia, preguntas y respuestas
// usando family para personalizar el flujo
