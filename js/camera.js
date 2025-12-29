document.addEventListener("DOMContentLoaded", () => {
  // CONFIGURACIÓN
  // Si usas GitHub Actions, el script de despliegue cambiará "afe756e9b1fd9a31af04e38b654bf59c" por tu clave real.
  // Si prefieres probarlo ya, puedes pegar tu clave directamente aquí entre las comillas.
  const IMGBB_API_KEY = "afe756e9b1fd9a31af04e38b654bf59c"; 

  const photoBtn = document.getElementById("photoBtn");
  const cameraInput = document.getElementById("cameraInput");
  const preview = document.getElementById("preview");
  const continueBtn = document.getElementById("continueBtn");
  const statusMessage = document.getElementById("statusMessage");

  const familyModal = document.getElementById("familyModal");
  const modalText = document.getElementById("modalText");
  const confirmYes = document.getElementById("confirmYes");
  const confirmNo = document.getElementById("confirmNo");

  let capturedFile = null;
  let predictions = [];
  let currentPredictionIndex = 0;

  // =========================
  // 1. ABRIR CÁMARA
  // =========================
  photoBtn.addEventListener("click", () => {
    cameraInput.click();
  });

  // =========================
  // 2. CAPTURA Y VISTA PREVIA
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
  // 3. SUBIDA A IMGBB Y PROCESAMIENTO
  // =========================
  continueBtn.addEventListener("click", async () => {
    if (!capturedFile) {
      statusMessage.innerText = "⚠️ Por favor, capture una foto primero.";
      return;
    }

    statusMessage.innerText = "🚀 Subiendo foto a la nube y analizando...";
    continueBtn.disabled = true;

    try {
      // Preparar envío a ImgBB
      const formData = new FormData();
      formData.append("image", capturedFile);

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error("Error en la subida a ImgBB");
      }

      const imageUrl = data.data.url;

      // GUARDAR URL PARA EL COLLAGE
      let collagePhotos = JSON.parse(localStorage.getItem("collagePhotos") || "[]");
      collagePhotos.push(imageUrl);
      localStorage.setItem("collagePhotos", JSON.stringify(collagePhotos));

      // SIMULACIÓN DE IA (Sustituye esto cuando tengas un backend real)
      predictions = [
        { 
            family: "Familia García", 
            confidence: 0.88, 
            special_message: "¡Bienvenidos a la Villa!", 
            needs_products: false 
        },
        { 
            family: "Familia Rodríguez", 
            confidence: 0.45, 
            special_message: "Es un placer veros.", 
            needs_products: true 
        }
      ];

      currentPredictionIndex = 0;
      showFamilyConfirmation(true);

    } catch (error) {
      console.error(error);
      statusMessage.innerText = "❌ Error al subir la imagen. Verifica la API Key.";
      continueBtn.disabled = false;
    }
  });

  // =========================
  // 4. LÓGICA DEL MODAL
  // =========================
  function getConfidenceMessage(confidence) {
    if (confidence >= 0.75) return { level: "alta", icon: "🔐", title: "Coincidencia alta" };
    if (confidence >= 0.5) return { level: "media", icon: "🔍", title: "Coincidencia probable" };
    return { level: "baja", icon: "⚠️", title: "Coincidencia débil" };
  }

  function showFamilyConfirmation(isFirstTime = false) {
    const prediction = predictions[currentPredictionIndex];

    if (!prediction) {
      familyModal.classList.add("hidden");
      statusMessage.innerText = "❌ No hay más coincidencias disponibles.";
      continueBtn.disabled = false;
      return;
    }

    const info = getConfidenceMessage(prediction.confidence);
    const percent = Math.round(prediction.confidence * 100);

    modalText.innerHTML = `
      <strong>${info.icon} ${info.title}</strong><br><br>
      Familia: ${prediction.family}<br>
      Confianza: ${percent}%<br><br>
      ¿Es correcto?
    `;
    
    familyModal.classList.remove("hidden");
  }

  // Eventos de botones del modal (Definidos una sola vez)
  confirmYes.addEventListener("click", () => {
    const prediction = predictions[currentPredictionIndex];
    sessionStorage.setItem("family", prediction.family);
    sessionStorage.setItem("specialMessage", prediction.special_message || "");

    // Redirección según lógica de negocio
    if (prediction.needs_products) {
      window.location.href = "pages/products.html";
    } else {
      window.location.href = "pages/trivia.html";
    }
  });

  confirmNo.onclick = () => {
    familyModal.classList.add("hidden");
    statusMessage.innerText = "Buscando otra coincidencia...";
    currentPredictionIndex++;
    
    // Pequeño retardo para dar sensación de procesamiento
    setTimeout(() => {
      showFamilyConfirmation();
    }, 1000);
  };

});