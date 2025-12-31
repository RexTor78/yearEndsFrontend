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

  let shuffledFamilies = [];
  let currentIndex = 0;
  let esSegundoIntento = false;

  // CARGA DE DATOS
  try {
    const response = await fetch("./families.json");
    const data = await response.json();
    shuffledFamilies = data.families.sort(() => Math.random() - 0.5);
    console.log("Familias cargadas");
  } catch (e) {
    console.error("Error cargando JSON", e);
  }

  // EVENTO CÁMARA (Arreglado para previsualización inmediata)
  cameraInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        preview.src = event.target.result;
        preview.style.display = "block";
        continueBtn.classList.remove("hidden");
        statusMessage.innerText = "✅ Foto capturada.";
        sessionStorage.setItem("selfie", event.target.result);
      };
      reader.readAsDataURL(file);
    }
  });

  continueBtn.onclick = () => {
    statusMessage.innerText = "🧠 Analizando rasgos faciales...";
    setTimeout(showPrediction, 1000);
  };

  // LÓGICA DE PREDICCIÓN
  // 3. PREDICCIÓN Y LÓGICA DE BLOQUEO
  function showPrediction() {
    const family = shuffledFamilies[currentIndex % shuffledFamilies.length];
    
    // Obtenemos el número real de familia que está entrando
    let ordenLlegada = parseInt(localStorage.getItem("contadorLlegada") || "1");

    console.log("Revisando acceso para familia nº:", ordenLlegada);

    // BLOQUEO ÚNICAMENTE PARA LA TERCERA FAMILIA
    if (ordenLlegada === 3) {
      confirmNo.style.display = "none"; // No pueden saltar a otra familia
      confirmYes.innerText = "Solicitar Permiso";
      modalText.innerHTML = `
        <b style="color:red">ACCESO RESTRINGIDO</b><br><br>
        Ustedes son la <b>3ª unidad familiar</b> en llegar. Por protocolo, requieren validación manual del administrador.
      `;
      
      confirmYes.onclick = () => {
        familyModal.classList.add("hidden");
        statusMessage.innerHTML = `
          <div id="statusBanner" style="background: #b91c1c; color: white; padding: 15px; border-radius: 8px; font-weight: bold; text-align: center;">
            ⏳ ESPERANDO APROBACIÓN DEL ADMINISTRADOR...
          </div>`;
        escucharAdmin(family); // Activa Firebase para que tú les abras
      };
    } 
    // PARA TODAS LAS DEMÁS FAMILIAS (1, 2, 4, 5, 6...)
    else {
      confirmNo.style.display = "inline-block";
      confirmYes.innerText = "✅ Sí, somos nosotros";
      confirmNo.innerText = "❌ No";
      modalText.innerHTML = `¿Sois la familia <b>${family.display_name}</b>?`;
      
      confirmYes.onclick = () => procesarConfirmacion(family);
      
      confirmNo.onclick = () => {
        familyModal.classList.add("hidden");
        currentIndex++; // Probar con otra familia aleatoria
        setTimeout(showPrediction, 400);
      };
    }
    familyModal.classList.remove("hidden");
  }

  // PROCESAR SOSPECHOSOS Y CASOS ESPECIALES
  function procesarConfirmacion(family) {
    familyModal.classList.add("hidden");

    // 1. CASO ESPECIAL: ATALAYA
    if (family.id === "CanTallaAtalaya") {
      suspiciousImage.style.display = "none";
      suspiciousText.innerHTML = `Acceso concedido a la villa, pero el sistema ha detectado un integrante de <b>nacionalidad altamente dudosa</b>. Para su seguridad y la de todos, serán vigilados estrictamente.`;
      document.getElementById("excludeBtn").style.display = "none";
      document.getElementById("retryBtn").innerText = "Entendido";
      suspiciousModal.classList.remove("hidden");
      document.getElementById("retryBtn").onclick = () => finalizarTodo(family);
      return;
    }

    // 2. CASO SOSPECHOSO
    // 2. CASO SOSPECHOSO
    const sospechoso = family.members.find(m => m.sospechoso === true);
   if (sospechoso && !esSegundoIntento) {
      suspiciousImage.src = ""; // Limpiamos imagen previa

      // --- NORMALIZADOR DE RUTAS ---
      // 1. Obtenemos el nombre del archivo (ej: "foto.png")
      const nombreArchivo = sospechoso.photo.split('/').pop();
      // 2. Obtenemos el ID de la familia (que coincide con el nombre de tu carpeta)
      const carpetaFamilia = family.id; 
      
      // 3. Construimos la ruta limpia: carpeta_raiz / nombre_familia / archivo
      const rutaCorrecta = `family_photos/${carpetaFamilia}/${nombreArchivo}`;
      
      console.log("Intentando cargar foto desde:", rutaCorrecta);
      suspiciousImage.src = rutaCorrecta;

      // Si por lo que sea falla, intentamos la ruta relativa simple como último recurso
      suspiciousImage.onerror = () => {
          console.error("Fallo ruta 1, reintentando...");
          suspiciousImage.src = "./" + rutaCorrecta;
          suspiciousImage.onerror = null;
      };

      suspiciousImage.onload = () => {
          suspiciousImage.style.display = "block";
          suspiciousImage.style.margin = "0 auto";
      };
      
      suspiciousText.innerHTML = `⚠️ <b>ALERTA DE SEGURIDAD</b><br><br>Integrante no reconocido: <b>${sospechoso.name}</b>.`;
      suspiciousModal.classList.remove("hidden");

      // Botón Reintentar
      document.getElementById("retryBtn").onclick = () => {
          suspiciousModal.classList.add("hidden");
          esSegundoIntento = true; 
          preview.style.display = "none";
          continueBtn.classList.add("hidden");
          cameraInput.value = ""; 
          statusMessage.innerHTML = "<b style='color:yellow'>Repetid la foto sin el sospechoso.</b>";
      };

      // Botón Excluir
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

  // ESCUCHA ACTIVA DE FIREBASE
  function escucharAdmin(family) {
    const approvalRef = ref(db, 'accessControl/adminApproval');
    
    // onValue detecta cambios en tiempo real desde cualquier dispositivo
    onValue(approvalRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.status === "true") {
        // Limpiamos la señal en la nube para que no afecte a otros
        set(ref(db, 'accessControl/adminApproval'), { status: "false" });

        const banner = document.getElementById("statusBanner");
        if (banner) {
          banner.style.background = "#15803d";
          banner.innerText = "✅ ACCESO AUTORIZADO";
        }

        setTimeout(() => {
          procesarConfirmacion(family);
        }, 1500);
      }
    });
  }
});