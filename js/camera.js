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

  function getConfidenceMessage(confidence) {
    if (confidence >= 0.75) {
      return {
        level: "alta",
        icon: "🔐",
        title: "Identificación casi confirmada",
        description: "El sistema tiene una coincidencia muy alta."
      };
    }

    if (confidence >= 0.5) {
      return {
        level: "media",
        icon: "🔍",
        title: "Coincidencia probable",
        description: "La coincidencia es buena, pero requiere confirmación."
      };
    }

    if (confidence >= 0.3) {
      return {
        level: "baja",
        icon: "⚠️",
        title: "Coincidencia débil",
        description: "La coincidencia es baja y podría tratarse de un error."
      };
    }

    return {
      level: "muy-baja",
      icon: "❗",
      title: "Identificación poco fiable",
      description: "La coincidencia es muy baja."
    };
  }


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
      showFamilyConfirmation();
      
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
      const confidenceInfo = getConfidenceMessage(prediction.confidence);
      const percent = Math.round(prediction.confidence * 100);

      modalText.innerText = `
${confidenceInfo.icon} ${confidenceInfo.title}

Familia detectada: ${prediction.family}
Nivel de confianza: ${percent}%

${confidenceInfo.description}

¿Es correcto?
`;
      const modalContent = document.querySelector(".modal-content");
      modalContent.setAttribute("data-confidence", confidenceInfo.level);

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
        window.location.href = "../pages/products.html";
      } else {
        window.location.href = "../pages/trivia.html";
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
