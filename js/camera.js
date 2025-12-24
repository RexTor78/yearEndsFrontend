import { API_URL } from "./config.js";

const photoBtn = document.getElementById("photoBtn");
const cameraInput = document.getElementById("cameraInput");
const preview = document.getElementById("preview");
const continueBtn = document.getElementById("continueBtn");
const statusMessage = document.getElementById("statusMessage");

let capturedFile = null;
let predictions = [];
let currentIndex = 0;

// Abrir cámara
photoBtn.addEventListener("click", () => {
  cameraInput.click();
});

// Foto hecha
cameraInput.addEventListener("change", () => {
  const file = cameraInput.files[0];
  if (!file) return;

  capturedFile = file;

  const reader = new FileReader();
  reader.onload = () => {
    preview.src = reader.result;
    preview.style.display = "block";
    continueBtn.classList.remove("hidden");
  };
  reader.readAsDataURL(file);
});

// Enviar selfie
continueBtn.addEventListener("click", async () => {
  if (!capturedFile) return;

  statusMessage.innerText = "🔍 Verificando identidad familiar...";
  continueBtn.disabled = true;

  const formData = new FormData();
  formData.append("file", capturedFile);

  try {
    const response = await fetch(`${API_URL}/upload`, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw new Error("Error backend");
    }

    const data = await response.json();

    predictions = data.predictions;
    currentIndex = 0;

    sessionStorage.setItem("selfieUrl", data.url);

    askNextFamily();

  } catch (error) {
    console.error(error);
    statusMessage.innerText =
      "❌ Error al conectar con el sistema de acceso.";
    continueBtn.disabled = false;
  }
});

// Preguntar familias una a una
function askNextFamily() {
  if (currentIndex >= predictions.length) {
    statusMessage.innerText =
      "❌ No hemos podido identificar a vuestra familia. Disculpad las molestias.";
    continueBtn.disabled = false;
    return;
  }

  const candidate = predictions[currentIndex];

  const confirmed = confirm(
    `Se ha detectado la familia ${candidate.family}. ¿Es correcto?`
  );

  if (confirmed) {
    sessionStorage.setItem("family", candidate.family);
    sessionStorage.setItem(
      "specialMessage",
      candidate.special_message || ""
    );

    if (candidate.needs_products) {
      window.location.href = "./pages/products.html";
    } else {
      window.location.href = "./pages/trivia.html";
    }
  } else {
    alert(
      "Disculpad el error. Probemos con otra identificación."
    );
    currentIndex++;
    const modal = document.getElementById("familyModal");
const modalText = document.getElementById("modalText");
const confirmYes = document.getElementById("confirmYes");
const confirmNo = document.getElementById("confirmNo");

  }
}
function askNextFamily() {
  if (currentIndex >= predictions.length) {
    statusMessage.innerText =
      "❌ No hemos podido identificar a vuestra familia. Disculpad las molestias.";
    continueBtn.disabled = false;
    return;
  }

  const candidate = predictions[currentIndex];

  modalText.innerText = `Se ha detectado la familia ${candidate.family}. ¿Es correcto?`;
  modal.classList.remove("hidden");

  confirmYes.onclick = () => {
    modal.classList.add("hidden");

    sessionStorage.setItem("family", candidate.family);
    sessionStorage.setItem(
      "specialMessage",
      candidate.special_message || ""
    );

    if (candidate.needs_products) {
      window.location.href = "./pages/products.html";
    } else {
      window.location.href = "./pages/trivia.html";
    }
  };

  confirmNo.onclick = () => {
    modal.classList.add("hidden");

    statusMessage.innerText =
      "🙏 Disculpad el error, probamos con otra identificación...";
    currentIndex++;
    setTimeout(askNextFamily, 800);
  };
}
