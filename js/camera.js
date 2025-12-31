document.addEventListener("DOMContentLoaded", async () => {
  const cameraInput = document.getElementById("cameraInput");
  const preview = document.getElementById("preview");
  const continueBtn = document.getElementById("continueBtn");
  const statusMessage = document.getElementById("statusMessage");
  const familyModal = document.getElementById("familyModal");
  const suspiciousModal = document.getElementById("suspiciousModal");
  const suspiciousImage = document.getElementById("suspiciousImage");
  
  let shuffledFamilies = [];
  let currentIndex = 0;
  let esSegundoIntento = false;

  try {
    const response = await fetch("./families.json");
    const data = await response.json();
    shuffledFamilies = data.families.sort(() => Math.random() - 0.5);
  } catch (e) { console.error("Error JSON"); }

  cameraInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        preview.src = event.target.result;
        preview.style.display = "block";
        continueBtn.classList.remove("hidden");
      };
      reader.readAsDataURL(file); // Corregido: antes decía readAsAsDataURL
    }
  });

  continueBtn.onclick = () => {
    statusMessage.innerText = "🧠 Analizando...";
    setTimeout(showPrediction, 1000);
  };

  function showPrediction() {
    const family = shuffledFamilies[currentIndex % shuffledFamilies.length];
    let ordenLlegada = parseInt(localStorage.getItem("contadorLlegada") || "1");

    if (ordenLlegada === 3) {
      document.getElementById("confirmNo").style.display = "none";
      document.getElementById("confirmYes").innerText = "Solicitar Permiso";
      document.getElementById("modalText").innerHTML = `<b>ACCESO RESTRINGIDO</b><br><br>No identificados. Contacten con el administrador.`;
      
      document.getElementById("confirmYes").onclick = () => {
        familyModal.classList.add("hidden");
        statusMessage.innerHTML = "<div style='background:red; color:white; padding:10px;'>⏳ ESPERANDO ADMINISTRADOR...</div>";
        escucharAdmin(family);
      };
    } else {
      document.getElementById("confirmNo").style.display = "inline-block";
      document.getElementById("confirmYes").innerText = "✅ Sí";
      document.getElementById("modalText").innerHTML = `¿Sois la familia <b>${family.display_name}</b>?`;
      document.getElementById("confirmYes").onclick = () => procesarConfirmacion(family);
      document.getElementById("confirmNo").onclick = () => {
        familyModal.classList.add("hidden");
        currentIndex++;
        setTimeout(showPrediction, 400);
      };
    }
    familyModal.classList.remove("hidden");
  }

  function procesarConfirmacion(family) {
    familyModal.classList.add("hidden");

    if (family.id === "CanTallaAtalaya") {
      suspiciousImage.style.display = "none";
      document.getElementById("suspiciousText").innerHTML = `Acceso concedido. Detectada nacionalidad dudosa. Serán vigilados.`;
      document.getElementById("excludeBtn").style.display = "none";
      document.getElementById("retryBtn").innerText = "Entendido";
      suspiciousModal.classList.remove("hidden");
      document.getElementById("retryBtn").onclick = () => finalizarTodo(family);
      return;
    }

    const sospechoso = family.members.find(m => m.sospechoso === true);
    if (sospechoso && !esSegundoIntento) {
      // RUTA ABSOLUTA PARA EVITAR PARPADEO
      suspiciousImage.src = window.location.origin + "/" + sospechoso.photo;
      suspiciousImage.style.display = "block";
      document.getElementById("suspiciousText").innerHTML = `⚠️ <b>ALERTA</b>: Integrante no reconocido: ${sospechoso.name}`;
      
      document.getElementById("retryBtn").innerText = "📸 Repetir Foto";
      document.getElementById("excludeBtn").style.display = "inline-block";
      suspiciousModal.classList.remove("hidden");

      document.getElementById("retryBtn").onclick = () => {
        suspiciousModal.classList.add("hidden");
        esSegundoIntento = true;
        preview.style.display = "none";
        continueBtn.classList.add("hidden");
        statusMessage.innerHTML = "<b style='color:yellow'>Repetid la foto sin el sospechoso.</b>";
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
      if (localStorage.getItem("adminApproval") === "true") {
        clearInterval(interval);
        localStorage.removeItem("adminApproval");
        procesarConfirmacion(family);
      }
    }, 1000);
  }
});