document.addEventListener("DOMContentLoaded", async () => {
  const cameraInput = document.getElementById("cameraInput");
  const preview = document.getElementById("preview");
  const continueBtn = document.getElementById("continueBtn");
  const statusMessage = document.getElementById("statusMessage");
  const familyModal = document.getElementById("familyModal");
  const modalText = document.getElementById("modalText");
  const confirmYes = document.getElementById("confirmYes");
  const confirmNo = document.getElementById("confirmNo");

  const suspiciousModal = document.getElementById("suspiciousModal");
  const suspiciousImage = document.getElementById("suspiciousImage");
  const suspiciousText = document.getElementById("suspiciousText");

  let shuffledFamilies = [];
  let currentIndex = 0;
  let capturedImage = null;
  let esSegundoIntento = false; // Control para el reintento de foto sospechosa

  // 1. CARGA DE DATOS
  try {
    const response = await fetch("./families.json");
    const data = await response.json();
    shuffledFamilies = data.families.sort(() => Math.random() - 0.5);
  } catch (e) { 
    console.error("Error al cargar JSON"); 
  }

  // 2. CAPTURA Y PREVISUALIZACIÓN INICIAL
  cameraInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        preview.src = event.target.result;
        preview.style.display = "block";
        continueBtn.classList.remove("hidden");
        capturedImage = event.target.result;
        statusMessage.innerText = esSegundoIntento ? "✅ Nueva foto capturada." : "✅ Foto lista.";
      };
      reader.readAsDataURL(file);
    }
  });

  continueBtn.onclick = () => {
    statusMessage.innerText = "🧠 Analizando rasgos faciales...";
    setTimeout(showPrediction, 1200);
  };

  // 3. PREDICCIÓN Y LÓGICA DE BLOQUEO
  function showPrediction() {
    const family = shuffledFamilies[currentIndex % shuffledFamilies.length];
    let ordenLlegada = parseInt(localStorage.getItem("contadorLlegada") || "1");

    if (ordenLlegada === 3) {
      // Bloqueo 3ª Familia
      confirmNo.style.display = "none";
      confirmYes.innerText = "Solicitar Permiso";
      modalText.innerHTML = `<b style="color:red">ACCESO RESTRINGIDO</b><br><br>Son la 3ª familia en llegar. Esperen aprobación del administrador.`;
      confirmYes.onclick = () => {
        familyModal.classList.add("hidden");
        statusMessage.innerHTML = "<div style='color:orange; font-weight:bold;'>⏳ Esperando al administrador...</div>";
        escucharAdmin(family);
      };
    } else {
      // Flujo Normal
      confirmNo.style.display = "inline-block";
      confirmYes.innerText = "✅ Sí";
      modalText.innerHTML = `¿Sois la familia <b>${family.display_name}</b>?`;
      confirmYes.onclick = () => procesarConfirmacion(family);
      confirmNo.onclick = () => {
        familyModal.classList.add("hidden");
        currentIndex++;
        setTimeout(showPrediction, 500);
      };
    }
    familyModal.classList.remove("hidden");
  }

  // 4. PROCESAR CONFIRMACIÓN (SOSPECHOSOS Y ATALAYA)
  function procesarConfirmacion(family) {
    familyModal.classList.add("hidden");

    // CASO ATALAYA
    if (family.id === "CanTallaAtalaya") {
      suspiciousImage.style.display = "none";
      suspiciousText.innerHTML = `Se les ha concedido acceso a la villa, pero el sistema ha detectado un integrante de <b>nacionalidad altamente dudosa</b>. Serán vigilados.`;
      document.getElementById("retryBtn").innerText = "Entendido";
      document.getElementById("excludeBtn").style.display = "none";
      suspiciousModal.classList.remove("hidden");
      document.getElementById("retryBtn").onclick = () => finalizarTodo(family);
      return;
    }

    // CASO SOSPECHOSO
    const sospechoso = family.members.find(m => m.sospechoso === true);
    
    // Si hay sospechoso y NO es el segundo intento, mostramos modal
    if (sospechoso && !esSegundoIntento) {
      // ASIGNACIÓN DE LA FOTO (Aquí está la corrección de ruta)
      // Como el JS suele estar en /js/ y las fotos en /family_photos/, aseguramos ruta relativa
      suspiciousImage.src = "./" + sospechoso.photo; 
      suspiciousImage.style.display = "block";
      
      suspiciousText.innerHTML = `⚠️ <b>ALERTA</b>: Integrante no reconocido: <b>${sospechoso.name}</b>.`;
      
      document.getElementById("retryBtn").innerText = "📸 Repetir Foto";
      document.getElementById("excludeBtn").style.display = "inline-block";
      document.getElementById("excludeBtn").innerText = "❌ Dejar fuera";
      
      suspiciousModal.classList.remove("hidden");

      // Lógica de Repetir Foto
      document.getElementById("retryBtn").onclick = () => {
        suspiciousModal.classList.add("hidden");
        esSegundoIntento = true;
        // Resetear interfaz para nueva foto
        preview.style.display = "none";
        continueBtn.classList.add("hidden");
        statusMessage.innerHTML = "<b style='color:yellow'>Por favor, repitan la foto sin el sospechoso.</b>";
        // Desplazar scroll al botón de cámara para ayudar al usuario
        window.scrollTo(0, 0);
      };

      document.getElementById("excludeBtn").onclick = () => {
        suspiciousModal.classList.add("hidden");
        finalizarTodo(family);
      };
    } else {
      finalizarTodo(family);
    }
  }

  function finalizarTodo(family) {
    let orden = parseInt(localStorage.getItem("contadorLlegada") || "1");
    localStorage.setItem("contadorLlegada", (orden + 1).toString());
    sessionStorage.setItem("identifiedFamily", JSON.stringify(family));
    window.location.href = "pages/trivia.html";
  }

  function escucharAdmin(family) {
    const interval = setInterval(() => {
      if (localStorage.getItem("adminApproval") === "true") {
        clearInterval(interval);
        localStorage.removeItem("adminApproval");
        procesarConfirmacion(family);
      }
    }, 2000);
  }
});