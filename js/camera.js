// 1. IMPORTACIONES DE FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  databaseURL: "https://villaaccess-73af4-default-rtdb.europe-west1.firebasedatabase.app/"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

document.addEventListener("DOMContentLoaded", async () => {
  // SELECTORES
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

  // 2. CARGA Y FILTRADO DE FAMILIAS (Para no repetir)
  try {
    const response = await fetch("./families.json");
    const data = await response.json();
    
    // Recuperamos quién ya ha entrado de localStorage
    const yaEntraron = JSON.parse(localStorage.getItem("familiasEnCasa") || "[]");
    
    // Solo mostramos las que no han entrado
    familiasRestantes = data.families.filter(f => !yaEntraron.includes(f.id));
    familiasRestantes.sort(() => Math.random() - 0.5);
    
    console.log("Familias pendientes:", familiasRestantes.length);
  } catch (e) {
    console.error("Error cargando JSON", e);
  }

  // 3. CAPTURA DE FOTO
  cameraInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        preview.src = event.target.result;
        preview.style.display = "block";
        continueBtn.classList.remove("hidden");
        sessionStorage.setItem("selfie", event.target.result);
      };
      reader.readAsDataURL(file);
    }
  });

  continueBtn.onclick = () => {
    statusMessage.innerText = "🧠 Analizando rasgos faciales...";
    setTimeout(showPrediction, 1000);
  };

  // 4. LÓGICA DE PREDICCIÓN CON BLOQUEO EN EL Nº 3
  function showPrediction() {
    if (familiasRestantes.length === 0) {
      statusMessage.innerHTML = "⚠️ Todas las familias ya están dentro.";
      return;
    }

    const family = familiasRestantes[currentIndex % familiasRestantes.length];
    let ordenLlegada = parseInt(localStorage.getItem("contadorLlegada") || "1");

    // BLOQUEO SOLO PARA LA TERCERA FAMILIA
    if (ordenLlegada === 3) {
      confirmNo.style.display = "none";
      confirmYes.innerText = "Solicitar Permiso";
      modalText.innerHTML = `<b>ACCESO RESTRINGIDO</b><br><br>Detectados como: <b>${family.display_name}</b>.<br>Son la 3ª familia en llegar. Esperen aprobación del administrador.`;
      
      confirmYes.onclick = () => {
        familyModal.classList.add("hidden");
        statusMessage.innerHTML = "<div id='statusBanner' style='background:#b91c1c; color:white; padding:15px; border-radius:8px; font-weight:bold; text-align:center;'>⏳ ESPERANDO APROBACIÓN DEL ADMINISTRADOR...</div>";
        escucharAdmin(family);
      };
    } else {
      // FLUJO NORMAL
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

  // 5. PROCESAR SOSPECHOSOS Y RUTAS DE FOTO
  function procesarConfirmacion(family) {
    familyModal.classList.add("hidden");

    if (family.id === "CanTallaAtalaya") {
      suspiciousImage.style.display = "none";
      suspiciousText.innerHTML = `Acceso concedido. Detectada nacionalidad dudosa. Serán vigilados estrictamente.`;
      document.getElementById("excludeBtn").style.display = "none";
      document.getElementById("retryBtn").innerText = "Entendido";
      suspiciousModal.classList.remove("hidden");
      document.getElementById("retryBtn").onclick = () => finalizarTodo(family);
      return;
    }

    const sospechoso = family.members.find(m => m.sospechoso === true);
    if (sospechoso && !esSegundoIntento) {
      // 1. Limpiar cualquier rastro anterior
      suspiciousImage.style.display = "none"; 
      
      // 2. Extraer solo el nombre del archivo (ej: "marcelo.png")
      const nombreFoto = sospechoso.photo.split('/').pop();
      
      // 3. Construir la ruta real que tienes en GitHub
      // Carpeta raíz / carpeta familia / nombre archivo
      const rutaReal = `family_photos/${family.id}/${nombreFoto}`;
      
      console.log("Intentando cargar foto desde:", rutaReal);
      suspiciousImage.src = rutaReal;

      // 4. FORZAR VISIBILIDAD cuando la imagen cargue
      suspiciousImage.onload = function() {
          this.style.display = "block";
      };

      // 5. Si la ruta falla, intentamos una ruta relativa simple
      suspiciousImage.onerror = function() {
          this.src = "./" + rutaReal;
          this.style.display = "block";
          console.error("Error cargando imagen, probando ruta alternativa");
      };

      suspiciousText.innerHTML = `⚠️ <b>ALERTA DE SEGURIDAD</b><br><br>Integrante no reconocido: <b>${sospechoso.name}</b>.`;
      suspiciousModal.classList.remove("hidden");
  }

  // 6. GUARDAR ESTADO Y SALIR
  function finalizarTodo(family) {
    let orden = parseInt(localStorage.getItem("contadorLlegada") || "1");
    localStorage.setItem("contadorLlegada", (orden + 1).toString());

    // Añadir a familias que ya están dentro
    const yaEntraron = JSON.parse(localStorage.getItem("familiasEnCasa") || "[]");
    yaEntraron.push(family.id);
    localStorage.setItem("familiasEnCasa", JSON.stringify(yaEntraron));

    sessionStorage.setItem("identifiedFamily", JSON.stringify(family));
    window.location.href = "pages/trivia.html";
  }

  // 7. ESCUCHA FIREBASE
  function escucharAdmin(family) {
    const approvalRef = ref(db, 'accessControl/adminApproval');
    onValue(approvalRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.status === "true") {
        set(ref(db, 'accessControl/adminApproval'), { status: "false" });
        const banner = document.getElementById("statusBanner");
        if (banner) {
          banner.style.background = "#15803d";
          banner.innerText = "✅ ACCESO AUTORIZADO";
        }
        setTimeout(() => procesarConfirmacion(family), 1500);
      }
    });
  }
});