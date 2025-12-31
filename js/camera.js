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
  let esSegundoIntento = false;

  // 1. CARGA DE DATOS
  try {
    const response = await fetch("./families.json");
    const data = await response.json();
    shuffledFamilies = data.families.sort(() => Math.random() - 0.5);
    console.log("Familias cargadas correctamente");
  } catch (e) { 
    console.error("Error cargando JSON", e); 
  }

  // 2. CAPTURA DE FOTO
  cameraInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        preview.src = event.target.result;
        preview.style.display = "block";
        continueBtn.classList.remove("hidden");
        capturedImage = event.target.result;
      };
      reader.readAsAsDataURL(file);
    }
  });

  continueBtn.onclick = () => {
    statusMessage.innerText = "🧠 Analizando rasgos faciales...";
    setTimeout(showPrediction, 1000);
  };

  // 3. PREDICCIÓN Y LÓGICA DE BLOQUEO
  function showPrediction() {
    const family = shuffledFamilies[currentIndex % shuffledFamilies.length];
    let ordenLlegada = parseInt(localStorage.getItem("contadorLlegada") || "1");

    console.log("Orden de llegada actual:", ordenLlegada);

    if (ordenLlegada === 3) {
      confirmNo.style.display = "none";
      confirmYes.innerText = "Solicitar Permiso";
      modalText.innerHTML = `<b style="color:red">ACCESO RESTRINGIDO</b><br><br>Por favor contacten con el administrador, no hemos conseguido identifiacarles`;
      
      confirmYes.onclick = () => {
        familyModal.classList.add("hidden");
        statusMessage.innerHTML = `
          <div id="statusBanner" style="background: #b91c1c; color: white; padding: 15px; border-radius: 8px; font-weight: bold; text-align: center;">
            ⏳ ESPERANDO APROBACIÓN DEL ADMINISTRADOR...
          </div>`;
        escucharAdmin(family);
      };
    } else {
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

  // 4. PROCESAR SOSPECHOSOS Y ATALAYA
function procesarConfirmacion(family) {
    familyModal.classList.add("hidden");

    // 1. CASO ATALAYA
    if (family.id === "CanTallaAtalaya") {
        suspiciousImage.style.display = "none";
        suspiciousText.innerHTML = `Se les ha concedido acceso a la villa, pero el sistema ha detectado un integrante de <b>nacionalidad altamente dudosa</b>. Por su seguridad y la de todos serán estrictamente vigilados.`;
        document.getElementById("retryBtn").innerText = "Entendido";
        document.getElementById("excludeBtn").style.display = "none";
        suspiciousModal.classList.remove("hidden");
        document.getElementById("retryBtn").onclick = () => finalizarTodo(family);
        return;
    }

    // 2. CASO SOSPECHOSO
    const sospechoso = family.members.find(m => m.sospechoso === true);
    
    if (sospechoso && !esSegundoIntento) {
        // --- AQUÍ ESTÁ EL CAMBIO CLAVE DE LA RUTA ---
        // Forzamos que busque desde la raíz del proyecto
        let rutaLimpia = sospechoso.photo;
        
        // Si la ruta empieza por family_photos, le aseguramos el path correcto
        suspiciousImage.src = window.location.origin + "/" + rutaLimpia;
        
        // Si no funciona origin, probamos ruta relativa clásica
        suspiciousImage.onerror = function() {
            this.src = "./" + rutaLimpia; 
        };

        suspiciousImage.style.display = "block";
        suspiciousText.innerHTML = `⚠️ <b>ALERTA</b>: Integrante no reconocido: <b>${sospechoso.name}</b>.`;
        
        document.getElementById("retryBtn").innerText = "📸 Repetir Foto";
        document.getElementById("excludeBtn").style.display = "inline-block";
        document.getElementById("excludeBtn").innerText = "❌ Dejar fuera";
        
        suspiciousModal.classList.remove("hidden");

        document.getElementById("retryBtn").onclick = () => {
            suspiciousModal.classList.add("hidden");
            esSegundoIntento = true;
            preview.style.display = "none";
            continueBtn.classList.add("hidden");
            statusMessage.innerHTML = "<b style='color:yellow'>Por favor, repitan la foto sin el sospechoso.</b>";
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

    const sospechoso = family.members.find(m => m.sospechoso === true);
    if (sospechoso && !esSegundoIntento) {
      suspiciousImage.src = "./" + sospechoso.photo; 
      suspiciousImage.style.display = "block";
      suspiciousText.innerHTML = `⚠️ <b>ALERTA</b>: Integrante no reconocido: <b>${sospechoso.name}</b>.`;
      document.getElementById("retryBtn").innerText = "📸 Repetir Foto";
      document.getElementById("excludeBtn").style.display = "inline-block";
      suspiciousModal.classList.remove("hidden");

      document.getElementById("retryBtn").onclick = () => {
        suspiciousModal.classList.add("hidden");
        esSegundoIntento = true;
        preview.style.display = "none";
        continueBtn.classList.add("hidden");
        statusMessage.innerHTML = "<b style='color:yellow'>Repetir la selfie para intentar autorizar todos los integrantes.</b>";
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

  // 5. ESCUCHA AL ADMIN (CORREGIDO)
  function escucharAdmin(family) {
    console.log("Iniciando escucha de adminApproval...");
    localStorage.removeItem("adminApproval"); // Resetear por si acaso

    const interval = setInterval(() => {
      if (localStorage.getItem("adminApproval") === "true") {
        console.log("¡Permiso detectado!");
        clearInterval(interval);
        localStorage.removeItem("adminApproval");

        const banner = document.getElementById("statusBanner");
        if (banner) {
          banner.style.background = "#15803d";
          banner.innerText = "✅ PERMISO CONCEDIDO";
        }

        setTimeout(() => {
          procesarConfirmacion(family);
        }, 1500);
      }
    }, 1000); // Revisar cada segundo
  }
});