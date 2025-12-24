// camera.js
import { API_URL } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  const photoBtn = document.getElementById("photoBtn");
  const cameraInput = document.getElementById("cameraInput");
  const preview = document.getElementById("preview");
  const continueBtn = document.getElementById("continueBtn");
  const statusMessage = document.getElementById("statusMessage");

  let capturedFile = null;

  // Abrir cámara
  photoBtn.addEventListener("click", () => {
    cameraInput.click();
  });

  // Al hacer la foto
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

  // Enviar al backend
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
      statusMessage.innerText = `✅ Foto subida correctamente: familia detectada - ${data.family || "N/A"}`;

      // Guardar url de selfie
      sessionStorage.setItem("selfieUrl", data.url || "");

      // Aquí dejaremos para más adelante la lógica de confirmación
      continueBtn.disabled = false;

    } catch (error) {
      console.error(error);
      statusMessage.innerText = "❌ Error al subir la foto. Inténtelo de nuevo.";
      continueBtn.disabled = false;
    }
  });
});
