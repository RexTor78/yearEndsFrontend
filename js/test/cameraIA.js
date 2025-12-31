import { API_URL } from "../config.js";

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

  // Modal sospechoso
  const suspectModal = document.getElementById("suspectModal");
  const suspectText = document.getElementById("suspectText");
  const suspectYes = document.getElementById("suspectYes");
  const suspectNo = document.getElementById("suspectNo");

  let capturedFile = null;
  let predictions = [];
  let currentPredictionIndex = 0;

  // =========================
  // Abrir cámara
  // =========================
  photoBtn.addEventListener("click", () => {
    cameraInput.click();
  });

  // =========================
  // Redimensionar imagen usando canvas
  // =========================
  async function resizeImage(file, maxWidth = 800, maxHeight = 600) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => (img.src = e.target.result);
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (maxHeight / height) * width;
          height = maxHeight;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => resolve(new File([blob], file.name, { type: "image/jpeg" })),
          "image/jpeg",
          0.7
        );
      };

      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  // =========================
  // Captura de foto
  // =========================
  cameraInput.addEventListener("change", async () => {
    const file = cameraInput.files[0];
    if (!file) return;

    statusMessage.innerText = "📸 Procesando foto...";
    continueBtn.disabled = true;

    try {
      capturedFile = await resizeImage(file);

      const reader = new FileReader();
      reader.onload = () => {
        preview.src = reader.result;
        preview.style.display = "block";
        continueBtn.classList.remove("hidden");
        statusMessage.innerText = "";
        continueBtn.disabled = false;
      };
      reader.readAsDataURL(capturedFile);
    } catch (err) {
      console.error(err);
      statusMessage.innerText = "❌ Error al procesar la foto.";
      continueBtn.disabled = false;
    }
  });

  // =========================
  // Enviar foto al backend
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

      if (!response.ok) throw new Error(`Error en backend: ${response.status}`);

      const data = await response.json();
      sessionStorage.setItem("selfieUrl", data.url || "");
      predictions = data.predictions || [];
      currentPredictionIndex = 0;

      if (!predictions.length) {
        statusMessage.innerText = "❌ No se ha podido identificar a la familia.";
        continueBtn.disabled = false;
        return;
      }

      showFamilyConfirmation();

    } catch (error) {
      console.error(error);
      statusMessage.innerText = "❌ Error al conectar con el sistema de acceso.";
      continueBtn.disabled = false;
    }
  });

  // =========================
  // Mostrar modal de familia
  // =========================
  function showFamilyConfirmation() {
    const prediction = predictions[currentPredictionIndex];
    if (!prediction) {
      familyModal.classList.add("hidden");
      statusMessage.innerText =
        "❌ No hemos podido identificar correctamente a la familia. Disculpen las molestias.";
      continueBtn.disabled = false;
      return;
    }

    let text = `Familia detectada: ${prediction.family}\nNivel de confianza: ${Math.round(prediction.confidence * 100)}%\n¿Es correcto?`;
    if (prediction.special_message) text += `\n\n💬 ${prediction.special_message}`;
    modalText.innerText = text;
    familyModal.classList.remove("hidden");

    confirmYes.onclick = () => {
      familyModal.classList.add("hidden");
      sessionStorage.setItem("family", prediction.family);
      sessionStorage.setItem("specialMessage", prediction.special_message || "");

      if (prediction.sospechoso_member) {
        showSuspectModal(prediction.sospechoso_member, prediction.sospechoso_message);
      } else {
        if (prediction.needs_products) window.location.href = "./pages/products.html";
        else window.location.href = "./pages/trivia.html";
      }
    };

    confirmNo.onclick = () => {
      familyModal.classList.add("hidden");
      statusMessage.innerText = "🙏 Intentando con la siguiente familia...";
      currentPredictionIndex++;
      setTimeout(showFamilyConfirmation, 1000);
    };
  }

  // =========================
  // Modal integrante sospechoso
  // =========================
  function showSuspectModal(name, message) {
    suspectText.innerText = `⚠️ Integrante sospechoso: ${name}\n${message}`;
    suspectModal.classList.remove("hidden");

    suspectYes.onclick = () => {
      suspectModal.classList.add("hidden");
      window.location.href = "./pages/products.html";
    };

    suspectNo.onclick = () => {
      suspectModal.classList.add("hidden");
      statusMessage.innerText = "📸 Por favor, rehaga la foto para incluir correctamente al integrante.";
      continueBtn.disabled = false;
    };
  }
});
