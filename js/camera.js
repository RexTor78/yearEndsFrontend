// camera.js
import { API_URL } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  const photoBtn = document.getElementById("photoBtn");
  const cameraInput = document.getElementById("cameraInput");
  const preview = document.getElementById("preview");
  const continueBtn = document.getElementById("continueBtn");
  const statusMessage = document.getElementById("statusMessage");

  // Modal de confirmación
  const familyModal = document.getElementById("familyModal");
  const modalText = document.getElementById("modalText");
  const confirmYes = document.getElementById("confirmYes");
  const confirmNo = document.getElementById("confirmNo");

  let capturedFile = null;

  // Predicciones IA
  let predictions = [];
  let currentPredictionIndex = 0;

  // =========================
  // Abrir cámara
  // =========================
  photoBtn.addEventListener("click", () => {
    cameraInput.click();
  });

  // =========================
  // Captura de foto
  // =========================
  cameraInput.addEventListener("change", () => {
    const file = cameraInput.files[0];
    if (!file) return;

    capturedFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      preview.src = reader.result;
      preview.style.display = "block";
      continueBtn.classList.remove("hidden");
      statusMessage.innerText = "";
    };
    reader.readAsDataURL(file);
  });

  // =========================
  // Enviar foto al backend (UNA SOLA VEZ)
  // =========================
  continueBtn.addEventListener("click", async () => {
    if (!capturedFile) {
      statusMessage.innerText = "⚠️ Por favor, capture una foto primero.";
      return;
    }

    statusMessage.innerText = "🔍 Subiendo foto y verificando identidad...";
    continueBtn.disabled = true;

    try {
      const formData = new FormData();
      formData.append("file", capturedFile);

      const response = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error en backend: ${response.status}`);
      }

      const data = await response.json();

      // Guardar selfie
      sessionStorage.setItem("selfieUrl", data.url || "");

      predictions = data.predictions || [];
      currentPredictionIndex = 0;

      if (!predictions.length) {
        statusMessage.innerText =
          "❌ No se ha podido identificar a la familia.";
        continueBtn.disabled = false;
        return;
      }

      showFamilyConfirmation();

    } catch (error) {
      console.error(error);
      statusMessage.innerText =
        "❌ Error al conectar con el sistema de acceso.";
      continueBtn.disabled = false;
    }
  });

  // =========================
  // Mostrar modal con familia actual
  // =========================
  function showFamilyConfirmation(isRetry = false) {
    const prediction = predictions[currentPredictionIndex];

    if (!prediction) {
      familyModal.classList.add("hidden");
      statusMessage.innerText =
        "❌ No hemos podido identificar correctamente a la familia. Disculpen las molestias.";
      continueBtn.disabled = false;
      return;
    }

    if (isRetry) {
      modalText.innerText =
        `🙏 Disculpen el error anterior.\n\n¿Son ustedes la familia ${prediction.family}?`;
    } else {
      modalText.innerText =
        `Se ha detectado la familia ${prediction.family}. ¿Es correcto?`;
    }

    familyModal.classList.remove("hidden");
  }


  // =========================
  // CONFIRMAR FAMILIA
  // =========================
  confirmYes.addEventListener("click", () => {
    const prediction = predictions[currentPredictionIndex];
    familyModal.classList.add("hidden");

    sessionStorage.setItem("family", prediction.family);
    sessionStorage.setItem(
      "specialMessage",
      prediction.special_message || ""
    );

    if (prediction.needs_products) {
      window.location.href = "./pages/products.html";
    } else {
      window.location.href = "./pages/trivia.html";
    }
  });

  // =========================
  // RECHAZAR FAMILIA → SIGUIENTE
  // =========================
  confirmNo.onclick = () => {
    familyModal.classList.add("hidden");

    statusMessage.innerText =
      "🙏 Disculpen las molestias. Permitanme un instante mientras intento verificar sus identidades...";

    currentPredictionIndex++;

    setTimeout(() => {
      showFamilyConfirmation(true);
    }, 1200);
  };

});
