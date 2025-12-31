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

  // 1. CARGA Y FILTRADO DE FAMILIAS
  try {
    const response = await fetch("./families.json");
    const data = await response.json();
    const yaEntraron = JSON.parse(localStorage.getItem("familiasEnCasa") || "[]");
    familiasRestantes = data.families.filter(f => !yaEntraron.includes(f.id));
    familiasRestantes.sort(() => Math.random() - 0.5);
  } catch (e) { console.error("Error JSON", e); }

  // 2. CAPTURA DE FOTO (ARREGLADO: Previsualización instantánea)
  // 2. CAPTURA DE FOTO (Arregla la previsualización que fallaba)
  cameraInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        preview.src = event.target.result;
        preview.style.display = "block"; // Forzamos visibilidad
        continueBtn.classList.remove("hidden");
        statusMessage.innerText = "✅ Foto capturada.";
        sessionStorage.setItem("selfie", event.target.result);
      };
      reader.readAsDataURL(file);
    }
  });

  // 4. PROCESAR SOSPECHOSO (Lógica de ruta blindada)
  function procesarConfirmacion(family) {
    familyModal.classList.add("hidden");
    
    const sospechoso = family.members.find(m => m.sospechoso === true);
    if (sospechoso && !esSegundoIntento) {
      
      // Construimos la ruta ignorando lo que diga el JSON
      const nombreArchivo = sospechoso.photo.split('/').pop();
      const rutaLimpia = `family_photos/${family.id}/${nombreArchivo}`;
      
      // Intentamos cargar desde la raíz del sitio
      const base = window.location.href.substring(0, window.location.href.lastIndexOf("/") + 1);
      suspiciousImage.src = base + rutaLimpia;
      
      suspiciousImage.onload = () => {
          suspiciousImage.style.display = "block"; // Solo se muestra si carga
      };

      suspiciousImage.onerror = () => {
          // Si falla, probamos ruta relativa simple
          suspiciousImage.src = "./" + rutaLimpia;
          suspiciousImage.style.display = "block";
      };

      suspiciousText.innerHTML = `⚠️ <b>ALERTA</b>: No reconocido: ${sospechoso.name}`;
      suspiciousModal.classList.remove("hidden");

      // ... resto de botones retryBtn y excludeBtn igual ...
    } else {
      finalizarTodo(family);
    }
  }

  continueBtn.onclick = () => {
    statusMessage.innerText = "🧠 Analizando rasgos faciales...";
    setTimeout(showPrediction, 1000);
  };

  // 3. PREDICCIÓN (Bloqueo solo en la 3ª)
  function showPrediction() {
    if (familiasRestantes.length === 0) {
      statusMessage.innerText = "⚠️ No hay más familias pendientes.";
      return;
    }
    const family = familiasRestantes[currentIndex % familiasRestantes.length];
    let ordenLlegada = parseInt(localStorage.getItem("contadorLlegada") || "1");

    if (ordenLlegada === 3) {
      confirmNo.style.display = "none";
      confirmYes.innerText = "Solicitar Permiso";
      modalText.innerHTML = `<b>ACCESO RESTRINGIDO</b><br><br>Detectados como: ${family.display_name}.<br>Son la 3ª familia, esperen aprobación manual.`;
      confirmYes.onclick = () => {
        familyModal.classList.add("hidden");
        statusMessage.innerHTML = "<div id='statusBanner' style='background:red; color:white; padding:15px; border-radius:8px;'>⏳ ESPERANDO ADMINISTRADOR...</div>";
        escucharAdmin(family);
      };
    } else {
      confirmNo.style.display = "inline-block";
      confirmYes.innerText = "✅ Sí";
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

  // 4. PROCESAR SOSPECHOSO (RUTA CORREGIDA)
  function procesarConfirmacion(family) {
    familyModal.classList.add("hidden");
    
    if (family.id === "CanTallaAtalaya") {
      suspiciousImage.style.display = "none";
      suspiciousText.innerHTML = "Acceso concedido. Vigilancia activada por nacionalidad dudosa.";
      suspiciousModal.classList.remove("hidden");
      suspiciousImage.classList.add("show-img");
      document.getElementById("retryBtn").onclick = () => finalizarTodo(family);
      return;
    }

    const sospechoso = family.members.find(m => m.sospechoso === true);
    if (sospechoso && !esSegundoIntento) {
      // Limpiamos la ruta del JSON para encontrar la carpeta real
      const nombreFoto = sospechoso.photo.split('/').pop();
      const rutaCorrecta = `family_photos/${family.id}/${nombreFoto}`;
      
      suspiciousImage.src = rutaCorrecta;
      suspiciousImage.onload = () => { 
        suspiciousImage.style.setProperty("display", "block", "important"); 
      };
      
      suspiciousText.innerHTML = `⚠️ <b>ALERTA</b>: No reconocido: ${sospechoso.name}`;
      suspiciousModal.classList.remove("hidden");

      document.getElementById("retryBtn").onclick = () => {
        suspiciousModal.classList.add("hidden");
        esSegundoIntento = true;
        preview.style.display = "none";
        continueBtn.classList.add("hidden");
        cameraInput.value = "";
        statusMessage.innerHTML = "<b>Repetid la foto sin el sospechoso.</b>";
      };
      document.getElementById("excludeBtn").onclick = () => finalizarTodo(family);
    } else {
      finalizarTodo(family);
    }
  }

  // 5. FINALIZAR Y DESCARTAR FAMILIA
  function finalizarTodo(family) {
    let orden = parseInt(localStorage.getItem("contadorLlegada") || "1");
    localStorage.setItem("contadorLlegada", (orden + 1).toString());

    const yaEntraron = JSON.parse(localStorage.getItem("familiasEnCasa") || "[]");
    yaEntraron.push(family.id);
    localStorage.setItem("familiasEnCasa", JSON.stringify(yaEntraron));

    sessionStorage.setItem("identifiedFamily", JSON.stringify(family));
    window.location.href = "pages/trivia.html";
  }

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