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


  try {
    const response = await fetch("./families.json");
    const data = await response.json();
    shuffledFamilies = data.families.sort(() => Math.random() - 0.5);
  } catch (e) { console.error("Error al cargar JSON"); }

// Variable global al inicio del archivo para saber si es el segundo intento
let esSegundoIntento = false;

function procesarConfirmacion(family) {
    familyModal.classList.add("hidden");

    // 1. CASO ESPECIAL: ATALAYA (Prioridad máxima)
    if (family.id === "CanTallaAtalaya") {
        const suspiciousModal = document.getElementById("suspiciousModal");
        const suspiciousImage = document.getElementById("suspiciousImage");
        const suspiciousText = document.getElementById("suspiciousText");
        
        suspiciousImage.style.display = "none"; 
        suspiciousText.innerHTML = `
            <div style="text-align:left; border-left: 4px solid gold; padding-left: 10px;">
                Se les ha concedido acceso a la villa, pero el sistema ha detectado un integrante de <b>nacionalidad altamente dudosa</b>.<br><br>
                Para su seguridad y la de todos, tengan en cuenta que <b>serán vigilados</b>.
            </div>
        `;
        
        document.getElementById("retryBtn").innerText = "Entendido";
        document.getElementById("excludeBtn").style.display = "none"; 

        suspiciousModal.classList.remove("hidden");
        document.getElementById("retryBtn").onclick = () => finalizarTodo(family);
        return;
    }

    // 2. CASO SOSPECHOSO (Si no es Atalaya y no es el segundo intento)
    const sospechoso = family.members.find(m => m.sospechoso === true);
    
    if (sospechoso && !esSegundoIntento) {
        const suspiciousModal = document.getElementById("suspiciousModal");
        const suspiciousImage = document.getElementById("suspiciousImage");
        const suspiciousText = document.getElementById("suspiciousText");

        // CORRECCIÓN: Aseguramos que la ruta de la foto sea correcta
        // Si el JSON dice "family_photos/...", y el HTML está en raíz, la ruta es esa.
        suspiciousImage.src = sospechoso.photo; 
        suspiciousImage.style.display = "block";
        suspiciousImage.style.width = "100%"; // Para que se vea bien
        
        suspiciousText.innerHTML = `⚠️ <b>ALERTA DE SEGURIDAD</b><br><br>Detectado integrante no reconocido: <b>${sospechoso.name}</b>.`;
        
        document.getElementById("retryBtn").innerText = "📸 Repetir Foto";
        document.getElementById("excludeBtn").style.display = "inline-block";
        document.getElementById("excludeBtn").innerText = "❌ Dejar fuera";
        
        suspiciousModal.classList.remove("hidden");

        // BOTÓN REPETIR: Vuelve a la cámara
        document.getElementById("retryBtn").onclick = () => {
            suspiciousModal.classList.add("hidden");
            preview.style.display = "none";
            continueBtn.classList.add("hidden");
            cameraInput.value = ""; // Limpiamos el input para que puedan elegir otra foto
            esSegundoIntento = true; // Marcamos que la próxima vez pase directo
            statusMessage.innerHTML = "<b style='color:yellow'>Repitan la selfie sin el integrante no autorizado.</b>";
        };

        // BOTÓN EXCLUIR: Pasa directo
        document.getElementById("excludeBtn").onclick = () => {
            suspiciousModal.classList.add("hidden");
            finalizarTodo(family);
        };
    } else {
        // 3. CASO LIMPIO O SEGUNDO INTENTO
        if (esSegundoIntento) {
            statusMessage.innerHTML = "<b style='color:green'>Análisis correcto. Todos los integrantes autorizados.</b>";
            setTimeout(() => finalizarTodo(family), 1500);
        } else {
            finalizarTodo(family);
        }
    }
}
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
      reader.readAsDataURL(file);
    }
  });

  continueBtn.onclick = () => {
    statusMessage.innerText = "🧠 Analizando rasgos faciales...";
    setTimeout(showPrediction, 1200);
  };

  function showPrediction() {
    const family = shuffledFamilies[currentIndex % shuffledFamilies.length];
    let ordenLlegada = parseInt(localStorage.getItem("contadorLlegada") || "1");


    if (ordenLlegada === 3) {
      confirmNo.style.display = "none";
      confirmYes.innerText = "Solicitar Permiso";
      modalText.innerHTML = `<b style="color:red">ACCESO RESTRINGIDO</b><br><br>Son la 3ª familia. Esperen aprobación del administrador.`;
      confirmYes.onclick = () => {
        familyModal.classList.add("hidden");
        statusMessage.innerHTML = "<div class='banner-wait'>⏳ Esperando al administrador...</div>";
        escucharAdmin(family);
      };
    } else {

      confirmNo.style.display = "inline-block";
      confirmYes.innerText = "✅ Sí";
      modalText.innerHTML = `¿Sois la familia <b>${family.display_name}</b>?`;

      confirmYes.onclick = () => {
        procesarConfirmacion(family);
      };

      confirmNo.onclick = () => {
        familyModal.classList.add("hidden");
        currentIndex++;
        setTimeout(showPrediction, 500);
      };
    }
    familyModal.classList.remove("hidden");
  }

  function procesarConfirmacion(family) {
    familyModal.classList.add("hidden");

    if (family.id === "CanTallaAtalaya") {
      suspiciousImage.style.display = "none"; // No necesitamos foto aquí
      suspiciousText.innerHTML = `
                <div style="text-align:left; border-left: 4px solid gold; padding-left: 10px;">
                Se les ha concedido acceso a la villa, pero el sistema ha detectado un integrante de <b>nacionalidad altamente dudosa</b>.<br><br>
                Para su seguridad y la de todos, tengan en cuenta que <b>serán vigilados</b>.
                </div>
            `;
      const retryBtn = document.getElementById("retryBtn");
      const excludeBtn = document.getElementById("excludeBtn");

      retryBtn.innerText = "Entendido";
      excludeBtn.classList.add("hidden"); // Ocultamos el botón de excluir para Atalaya

      suspiciousModal.classList.remove("hidden");
      retryBtn.onclick = () => finalizarTodo(family);
      return;
    }

    const sospechoso = family.members.find(m => m.sospechoso === true);
    if (sospechoso) {
      suspiciousImage.src = sospechoso.photo;
      suspiciousImage.style.display = "block";
      suspiciousText.innerHTML = `⚠️ Se a detectado integrante no reconocido. Por favor pueden volver a hacer la foto para su correcta identificacion o dejar al integrante sospechoso fuera. <b>${sospechoso.name}</b>.`;

      document.getElementById("retryBtn").innerText = "📸 Reintentar";
      document.getElementById("excludeBtn").classList.remove("hidden");

      suspiciousModal.classList.remove("hidden");

      document.getElementById("retryBtn").onclick = () => {
        suspiciousModal.classList.add("hidden");
        statusMessage.innerText = "Reintentando análisis...";
        setTimeout(() => finalizarTodo(family), 1500);
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
    const interval = setInterval(() => {
      if (localStorage.getItem("adminApproval") === "true") {
        clearInterval(interval);
        localStorage.removeItem("adminApproval");
        procesarConfirmacion(family); // Al aprobar admin, pasamos por los filtros de Atalaya/Sospechoso
      }
    }, 2000);
  }
});