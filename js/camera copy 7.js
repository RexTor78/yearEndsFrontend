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
  let esSegundoIntento = false;

  // 1. CARREGA DE DADES
  try {
    const response = await fetch("./families.json");
    const data = await response.json();
    shuffledFamilies = data.families.sort(() => Math.random() - 0.5);
  } catch (e) { 
    console.error("Error carregant JSON"); 
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
        statusMessage.innerText = "✅ Foto lesta per analitzar.";
      };
      reader.readAsDataURL(file);
    }
  });

  continueBtn.onclick = () => {
    statusMessage.innerText = "🧠 Analitzant trets facials...";
    setTimeout(showPrediction, 1200);
  };

  // 3. PREDICCIÓ I BLOQUEIG 3ª FAMÍLIA
  function showPrediction() {
    const family = shuffledFamilies[currentIndex % shuffledFamilies.length];
    let ordenLlegada = parseInt(localStorage.getItem("contadorLlegada") || "1");

    if (ordenLlegada === 3) {
      // Cas de bloqueig (3ª família)
      confirmNo.style.display = "none";
      confirmYes.innerText = "Sol·licitar Permís";
      modalText.innerHTML = `<b style="color:red">ACCÉS RESTRINGIT</b><br><br>Por favor contacten con el administrador, no hemos conseguido identifiacarles`;
      
      confirmYes.onclick = () => {
        familyModal.classList.add("hidden");
        statusMessage.innerHTML = "<div style='background: #b91c1c; color: white; padding: 10px; border-radius: 5px;'>⏳ Avisant l'administrador... Espereu confirmació a la pantalla.</div>";
        escucharAdmin(family);
      };
    } else {
      // Flux normal
      confirmNo.style.display = "inline-block";
      confirmYes.innerText = "✅ Sí";
      modalText.innerHTML = `¿Sou la família <b>${family.display_name}</b>?`;
      confirmYes.onclick = () => procesarConfirmacion(family);
      confirmNo.onclick = () => {
        familyModal.classList.add("hidden");
        currentIndex++;
        setTimeout(showPrediction, 500);
      };
    }
    familyModal.classList.remove("hidden");
  }

  // 4. LÒGICA DE SOSPETXOSOS I ATALAYA
  function procesarConfirmacion(family) {
    familyModal.classList.add("hidden");

    // CAS ESPECIAL: ATALAYA
    if (family.id === "CanTallaAtalaya") {
      suspiciousImage.style.display = "none";
      suspiciousText.innerHTML = `Se les a concedido acceso a la villa, pero el sistema a detectado un integrante de nacionalidad altamente dudosa. Para su seguridad y la de todos tengan en cuenta que seran vigilados.`;
      const retryBtn = document.getElementById("retryBtn");
      retryBtn.innerText = "Entès";
      document.getElementById("excludeBtn").style.display = "none";
      suspiciousModal.classList.remove("hidden");
      retryBtn.onclick = () => finalizarTodo(family);
      return;
    }

    // CAS SOSPETXÓS
    const sospechoso = family.members.find(m => m.sospechoso === true);
    if (sospechoso && !esSegundoIntento) {
      // Corregim la ruta de la foto per si estàs en una subcarpeta
      suspiciousImage.src = "./" + sospechoso.photo;
      suspiciousImage.style.display = "block";
      suspiciousText.innerHTML = `⚠️ <b>ALERTA</b>: Integrant no reconegut: <b>${sospechoso.name}</b>.`;
      
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

      document.getElementById("excludeBtn").onclick = () => {
        suspiciousModal.classList.add("hidden");
        finalizarTodo(family);
      };
    } else {
      finalizarTodo(family);
    }
  }

  // 5. FINALITZACIÓ I REDIRECCIÓ
  function finalizarTodo(family) {
    let orden = parseInt(localStorage.getItem("contadorLlegada") || "1");
    localStorage.setItem("contadorLlegada", (orden + 1).toString());
    sessionStorage.setItem("identifiedFamily", JSON.stringify(family));
    window.location.href = "pages/trivia.html";
  }

  // 6. ESCULTA DE L'ADMIN (AQUÍ ESTAVA L'ERROR)
  function escucharAdmin(family) {
    // Netegem qualsevol aprovació antiga abans de començar
    localStorage.removeItem("adminApproval");

    const interval = setInterval(() => {
      const approval = localStorage.getItem("adminApproval");
      if (approval === "true") {
        clearInterval(interval);
        localStorage.removeItem("adminApproval"); // Netegem per al següent
        
        statusMessage.innerHTML = "<b style='color:green'>✅ ACCÉS CONCEDIT PER L'ADMINISTRADOR!</b>";
        
        // Després d'aprovar, passem pel filtre d'Atalaya o sospitosos
        setTimeout(() => {
          procesarConfirmacion(family);
        }, 1500);
      }
    }, 1500); // Revisem cada 1.5 segons
  }
});