import { API_URL } from "./config.js";

const response = await fetch(`${API_URL}/upload`, {
  method: "POST",
  body: formData
});


const photoBtn = document.getElementById("photoBtn");
const cameraInput = document.getElementById("cameraInput");
const preview = document.getElementById("preview");
const continueBtn = document.getElementById("continueBtn");
const statusMessage = document.getElementById("statusMessage");

let capturedFile = null;
let detectedFamily = null;

photoBtn.addEventListener("click", () => cameraInput.click());

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

    const data = await response.json();
    detectedFamily = data.family;

    // Guardamos datos
    sessionStorage.setItem("family", data.family);
    sessionStorage.setItem("requiredProducts", JSON.stringify(data.required_products || []));
    sessionStorage.setItem("specialMessage", data.special_message || "");
    sessionStorage.setItem("selfieUrl", data.url);

    // Nuevo: mostrar confirmación
    const userConfirm = confirm(`Se ha detectado la familia ${data.family}. ¿Es correcto?`);
    
    if (userConfirm) {
        // Si es correcto, redirigir según necesidad de productos
        if (data.needs_products) {
            window.location.href = "./pages/products.html";
        } else {
            window.location.href = "./pages/trivia.html";
        }
    } else {
        // Si no es correcto, mostrar mensaje de disculpas
        statusMessage.innerText = "❌ Familia no reconocida. Por favor, intente de nuevo o pruebe con la siguiente familia.";
        continueBtn.disabled = false;
    }

  } catch (error) {
    statusMessage.innerText = "❌ Error al conectar con el sistema de acceso. Inténtelo de nuevo.";
    continueBtn.disabled = false;
  }
});

