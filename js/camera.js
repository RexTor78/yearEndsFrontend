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
  let lastFamilyData = null;

  // 🔹 Abrir cámara
  photoBtn.addEventListener("click", () => cameraInput.click());

  // 🔹 Al hacer la foto
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

  // 🔹 Enviar al backend
  continueBtn.addEventListener("click", async () => {
    if (!capturedFile) {
      statusMessage.innerText = "⚠️ Por favor, capture una foto primero.";
      return;
    }

    statusMessage.innerText = "🔍 Subiendo foto...";
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
      sessionStorage.setItem("selfieUrl", data.url || "");
      lastFamilyData = data;

      // Mostrar modal de confirmación
      modalText.innerText = `Se ha detectado la familia ${data.family}. ¿Es correcto?`;
      familyModal.classList.remove("hidden");

      // Botón Sí
      confirmYes.onclick = () => {
        familyModal.classList.add("hidden");
        if (lastFamilyData.needs_products) {
          window.location.href = "./pages/products.html";
        } else {
          window.location.href = "./pages/trivia.html";
        }
      };

      // Botón No
      confirmNo.onclick = () => {
        familyModal.classList.add("hidden");
        statusMessage.innerText =
          "❌ Familia no reconocida. Intentaremos con la siguiente.";
        continueBtn.disabled = false;
      };

    } catch (error) {
      console.error(error);
      statusMessage.innerText = "❌ Error al subir la foto. Inténtelo de nuevo.";
      continueBtn.disabled = false;
    }
  });
});
