import { API_URL } from "./config.js";

const photoBtn = document.getElementById("photoBtn");
const cameraInput = document.getElementById("cameraInput");
const preview = document.getElementById("preview");
const continueBtn = document.getElementById("continueBtn");
const statusMessage = document.getElementById("statusMessage");

let capturedFile = null;

// 🔹 Abrir cámara
photoBtn.addEventListener("click", () => {
  cameraInput.click();
});

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
  };
  reader.readAsDataURL(file);
});

// 🔹 Enviar al backend
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
      throw new Error("Error en backend");
    }

    const data = await response.json();

    // Guardar datos
    sessionStorage.setItem("family", data.family);
    sessionStorage.setItem("requiredProducts", JSON.stringify(data.required_products || []));
    sessionStorage.setItem("specialMessage", data.special_message || "");
    sessionStorage.setItem("selfieUrl", data.url);

    // Confirmación
    const confirmFamily = confirm(
      `Se ha detectado la familia ${data.family}. ¿Es correcto?`
    );

    if (confirmFamily) {
      if (data.needs_products) {
        window.location.href = "./pages/products.html";
      } else {
        window.location.href = "./pages/trivia.html";
      }
    } else {
      statusMessage.innerText =
        "❌ Entendido. Intentaremos con la siguiente familia.";
      continueBtn.disabled = false;
    }

  } catch (error) {
    console.error(error);
    statusMessage.innerText =
      "❌ Error al conectar con el sistema de acceso.";
    continueBtn.disabled = false;
  }
});
