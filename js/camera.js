import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  databaseURL: "https://villaaccess-73af4-default-rtdb.europe-west1.firebasedatabase.app/"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

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

  let familiasRestantes = [];
  let currentIndex = 0;
  let esSegundoIntento = false;

  // 1. IMPLEMENTACIÓN: DESCARTE DE FAMILIAS (NO REPETIR)
  try {
    const response = await fetch("./families.json");
    const data = await response.json();
    const yaEntraron = JSON.parse(localStorage.getItem("familiasEnCasa") || "[]");
    // Filtramos para que solo aparezcan las que no están en la Villa
    familiasRestantes = data.families.filter(f => !yaEntraron.includes(f.id));
    familiasRestantes.sort(() => Math.random() - 0.5);
  } catch (e) { console.error("Error JSON", e); }

  // 2. IMPLEMENTACIÓN: PREVISUALIZACIÓN SELFIE (INSTANTÁNEA)
  cameraInput.addEventListener("change", function(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        preview.src = event.target.result;
        preview.style.display = "block";
        continueBtn.classList.remove("hidden");
        continueBtn.style.display = "block";
        statusMessage.innerText = "✅ Foto lista.";
        sessionStorage.setItem("selfie", event.target.result);
      };
      reader.readAsDataURL(file);
    }
  });

  continueBtn.onclick = () => {
    statusMessage.innerText = "🧠 Analizando rasgos faciales...";
    setTimeout(showPrediction, 1500);
  };

  // 3. IMPLEMENTACIÓN: BLOQUEO EXCLUSIVO FAMILIA Nº 3
  function showPrediction() {
    if (familiasRestantes.length === 0) {
      statusMessage.innerHTML = "⚠️ Todas las familias registradas ya están dentro de la Villa.";
      return;
    }

    const family = familiasRestantes[currentIndex % familiasRestantes.length];
    let ordenLlegada = parseInt(localStorage.getItem("contadorLlegada") || "1");

    if (ordenLlegada === 3) {
      confirmNo.style.display = "none";
      confirmYes.innerText = "Solicitar Permiso";
      // Texto original restaurado
      modalText.innerHTML = `<b style="color:red">ACCESO RESTRINGIDO</b><br><br>Por favor contacten con el administrador, no hemos conseguido identificarles`;
      
      confirmYes.onclick = () => {
        familyModal.classList.add("hidden");
        statusMessage.innerHTML = `<div id="statusBanner" style="background: #b91c1c; color: white; padding: 15px; border-radius: 8px; font-weight: bold; text-align: center;">⏳ ESPERANDO APROBACIÓN DEL ADMINISTRADOR...</div>`;
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
        showPrediction();
      };
    }
    familyModal.classList.remove("hidden");
  }

  // 4. IMPLEMENTACIÓN: SOSPECHOSOS Y ATALAYA (RUTAS BLINDADAS)
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

    // CASO SOSPECHOSO (Ruta dinámica basada en carpetas reales)
    const sospechoso = family.members.find(m => m.sospechoso === true);
    if (sospechoso && !esSegundoIntento) {
      const nombreFoto = sospechoso.photo.split('/').pop();
      const rutaCorrecta = `family_photos/${family.id}/${nombreFoto}`;
      
      suspiciousImage.src = rutaCorrecta;
      suspiciousImage.style.display = "block";
      suspiciousText.innerHTML = `⚠️ <b>ALERTA</b>: Integrante no reconocido: <b>${sospechoso.name}</b>.`;
      suspiciousModal.classList.remove("hidden");

      document.getElementById("retryBtn").onclick = () => {
        suspiciousModal.classList.add("hidden");
        esSegundoIntento = true;
        preview.style.display = "none";
        continueBtn.classList.add("hidden");
        cameraInput.value = "";
        statusMessage.innerHTML = "<b style='color:yellow'>Por favor, repitan la foto sin el sospechoso.</b>";
      };

      document.getElementById("excludeBtn").onclick = () => {
        suspiciousModal.classList.add("hidden");
        finalizarTodo(family);
      };
    } else {
      finalizarTodo(family);
    }
  }

  // 5. IMPLEMENTACIÓN: FINALIZAR (SUMAR CONTADOR Y GUARDAR ID)
  function finalizarTodo(family) {
    let orden = parseInt(localStorage.getItem("contadorLlegada") || "1");
    localStorage.setItem("contadorLlegada", (orden + 1).toString());

    const yaEntraron = JSON.parse(localStorage.getItem("familiasEnCasa") || "[]");
    yaEntraron.push(family.id);
    localStorage.setItem("familiasEnCasa", JSON.stringify(yaEntraron));

    sessionStorage.setItem("identifiedFamily", JSON.stringify(family));
    window.location.href = "pages/trivia.html";
  }

  // 6. IMPLEMENTACIÓN: ESCUCHA FIREBASE (NUBE)
  function escucharAdmin(family) {
    onValue(ref(db, 'accessControl/adminApproval'), (snapshot) => {
      const data = snapshot.val();
      if (data && data.status === "true") {
        set(ref(db, 'accessControl/adminApproval'), { status: "false" });
        procesarConfirmacion(family);
      }
    });
  }
});