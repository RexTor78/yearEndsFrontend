import { API_URL } from "./config.js";

const photoBtn = document.getElementById("productPhotoBtn");
const productInput = document.getElementById("productInput");
const productPreview = document.getElementById("productPreview");
const continueBtn = document.getElementById("productContinueBtn");
const statusMessage = document.getElementById("productStatus");

let productFile = null;

photoBtn.addEventListener("click", () => productInput.click());

productInput.addEventListener("change", () => {
  const file = productInput.files[0];
  if (!file) return;

  productFile = file;
  const reader = new FileReader();
  reader.onload = () => {
    productPreview.src = reader.result;
    productPreview.style.display = "block";
    continueBtn.classList.remove("hidden");
  };
  reader.readAsDataURL(file);
});

continueBtn.addEventListener("click", async () => {
  if (!productFile) return;

  statusMessage.innerText = "🔍 Verificando productos...";
  continueBtn.disabled = true;

  const formData = new FormData();
  formData.append("file", productFile);

  try {
    const response = await fetch(`${API_URL}/upload-products`, {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    // Guardamos URL de Cloudinary
    sessionStorage.setItem("productsUrl", data.url);

    // Simulación de validación
    let valid = Math.random() > 0.3; // 70% chance que sea válido
    if (valid) {
      statusMessage.innerText = "✅ Productos validados. Avanzando a trivia...";
      setTimeout(() => {
        window.location.href = "./pages/trivia.html";
      }, 1500);
    } else {
      statusMessage.innerText = "❌ No se detectan todos los productos. Por favor, repita la foto.";
      continueBtn.disabled = false;
    }

  } catch (error) {
    statusMessage.innerText = "❌ Error al subir la foto de productos.";
    continueBtn.disabled = false;
  }
});
