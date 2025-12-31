// celebration.js
import { API_URL } from "../config.js";

document.addEventListener("DOMContentLoaded", () => {
  const celebrationInput = document.getElementById("celebrationInput");
  const preview = document.getElementById("preview");
  const submitBtn = document.getElementById("submitBtn");
  const status = document.getElementById("status");

  let selectedFile = null;

  celebrationInput.addEventListener("change", () => {
    const file = celebrationInput.files[0];
    if (!file) return;

    selectedFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      preview.src = reader.result;
      preview.style.display = "block";
    };
    reader.readAsDataURL(file);
  });

  submitBtn.addEventListener("click", async () => {
    if (!selectedFile) {
      status.innerText = "⚠️ Seleccione una foto primero.";
      return;
    }

    status.innerText = "🔍 Subiendo foto de celebración...";
    submitBtn.disabled = true;

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(`${API_URL}/upload-celebration`, {
        method: "POST",
        body: formData
      });

      if (!response.ok) throw new Error(`Error en backend: ${response.status}`);

      const data = await response.json();
      status.innerText = "✅ Foto subida correctamente. ¡Gracias por participar!";
      sessionStorage.setItem("celebrationUrl", data.url || "");

    } catch (error) {
      console.error(error);
      status.innerText = "❌ Error al subir la foto. Inténtelo de nuevo.";
    } finally {
      submitBtn.disabled = false;
    }
  });
});
