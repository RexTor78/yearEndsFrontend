document.addEventListener("DOMContentLoaded", async () => {
  // 1. SELECTORES DE ELEMENTOS
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
  let esSegundoIntento = false;

  // 2. CARGA DE DATOS (families.json)
  try {
    const response = await fetch("./families.json");
    const data = await response.json();
    shuffledFamilies = data.families.sort(() => Math.random() - 0.5);
    console.log("Datos cargados correctamente");
  } catch (e) {
    console.error("Error cargando el JSON de familias:", e);
  }

  // 3. EVENTO CÁMARA (CORREGIDO Y TESTEADO)
  cameraInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        preview.src = event.target.result;
        preview.style.display = "block";
        continueBtn.classList.remove("hidden");
        statusMessage.innerText = "✅ Foto recibida correctamente.";
      };
      // Verificación estricta del nombre de la función
      reader.readAsDataURL(file);
    }
  });

  continueBtn.onclick = () => {
    statusMessage.innerText = "🧠 Analizando rasgos faciales...";
    setTimeout(showPrediction, 1000);
  };

  // 4. LÓGICA DE PREDICCIÓN
  function showPrediction() {
    const family = shuffledFamilies[currentIndex % shuffledFamilies.length];
    let ordenLlegada = parseInt(localStorage.getItem("contadorLlegada") || "1");

    if (ordenLlegada === 3) {
      // Bloqueo Administrador
      confirmNo.style.display = "none";
      confirmYes.innerText = "Solicitar Permiso";
      modalText.innerHTML = `<b>ACCESO RESTRINGIDO</b><br><br>No se ha podido identificar la unidad familiar. Por favor, contacten con el administrador.`;
      
      confirmYes.onclick = () => {
        familyModal.classList.add("hidden");
        statusMessage.innerHTML = "<div id='statusBanner' style='background:red; color:white; padding:10px; border-radius:5px;'>⏳ ESPERANDO APROBACIÓN DEL ADMINISTRADOR...</div>";
        escucharAdmin(family);
      };
    } else {
      // Flujo Normal
      confirmNo.style.display = "inline-block";
      confirmYes.innerText = "✅ Sí";
      confirmNo.innerText = "❌ No";
      modalText.innerHTML = `¿Sois la familia <b>${family.display_name}</b>?`;
      
      confirmYes.onclick = () => procesarConfirmacion(family);
      
      confirmNo.onclick = () => {
        familyModal.classList.add("hidden");
        currentIndex++;
        setTimeout(showPrediction, 400);
      };
    }
    familyModal.classList.remove("hidden");
  }

  // 5. PROCESAR CONFIRMACIÓN (ATALAYA Y SOSPECHOSOS)
  function procesarConfirmacion(family) {
    familyModal.classList.add("hidden");

    // Caso Atalaya
    if (family.id === "CanTallaAtalaya") {
      suspiciousImage.style.display = "none";
      suspiciousText.innerHTML = `Acceso concedido. Detectada nacionalidad dudosa. Serán vigilados estrictamente.`;
      document.getElementById("excludeBtn").style.display = "none";
      document.getElementById("retryBtn").innerText = "Entendido";
      suspiciousModal.classList.remove("hidden");
      document.getElementById("retryBtn").onclick = () => finalizarTodo(family);
      return;
    }

    // Caso Sospechoso
    const sospechoso = family.members.find(m => m.sospechoso === true);
    if (sospechoso && !esSegundoIntento) {
      // Ruta blindada para la foto
      suspiciousImage.src = window.location.origin + "/" + sospechoso.photo;
      suspiciousImage.style.display = "block";
      suspiciousText.innerHTML = `⚠️ <b>ALERTA</b>: Integrante no reconocido: ${sospechoso.name}`;
      
      document.getElementById("retryBtn").innerText = "📸 Repetir Foto";
      document.getElementById("excludeBtn").style.display = "inline-block";
      suspiciousModal.classList.remove("hidden");

      document.getElementById("retryBtn").onclick = () => {
        suspiciousModal.classList.add("hidden");
        esSegundoIntento = true;
        preview.style.display = "none";
        continueBtn.classList.add("hidden");
        cameraInput.value = ""; // Limpiamos para que permita volver a disparar la cámara
        statusMessage.innerHTML = "<b style='color:yellow'>Por favor, repitan la foto sin el sospechoso.</b>";
      };
      document.getElementById("excludeBtn").onclick = () => finalizarTodo(family);
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
    localStorage.removeItem("adminApproval"); 
    const interval = setInterval(() => {
        const approval = localStorage.getItem("adminApproval");
        if (approval && approval.startsWith("true")) {
            clearInterval(interval);
            localStorage.removeItem("adminApproval");
            const banner = document.getElementById("statusBanner");
            if (banner) {
                banner.style.background = "#15803d";
                banner.innerText = "✅ PERMISO CONCEDIDO";
            }
            setTimeout(() => { procesarConfirmacion(family); }, 1000);
        }
    }, 800);
  }
});