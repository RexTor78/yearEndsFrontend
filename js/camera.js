// 1. IMPORTACIONES (Siempre arriba en archivos tipo módulo)
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

  let shuffledFamilies = [];
  let currentIndex = 0;
  let esSegundoIntento = false;

  // CARGA DE DATOS
  try {
    const response = await fetch("./families.json");
    const data = await response.json();
    shuffledFamilies = data.families.sort(() => Math.random() - 0.5);
  } catch (e) {
    console.error("Error cargando familias:", e);
  }

  cameraInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log("Archivo detectado:", file.name);
      const reader = new FileReader();
      
      reader.onload = (event) => {
        // Asignamos el resultado a la imagen de previsualización
        preview.src = event.target.result;
        preview.style.display = "block"; // Forzamos visibilidad
        
        // Mostramos el botón de continuar
        continueBtn.classList.remove("hidden");
        continueBtn.style.display = "block"; 
        
        statusMessage.innerText = "✅ Foto cargada correctamente.";
        
        // Guardamos en sessionStorage para la celebración final
        sessionStorage.setItem("selfie", event.target.result);
      };

      reader.onerror = (err) => {
        console.error("Error al leer el archivo:", err);
        statusMessage.innerText = "❌ Error al cargar la foto. Inténtalo de nuevo.";
      };

      reader.readAsDataURL(file);
    }
  });

  continueBtn.onclick = () => {
    statusMessage.innerText = "🧠 Analizando rasgos faciales...";
    setTimeout(showPrediction, 1000);
  };

  function showPrediction() {
    const family = shuffledFamilies[currentIndex % shuffledFamilies.length];
    let ordenLlegada = parseInt(localStorage.getItem("contadorLlegada") || "1");

    if (ordenLlegada === 3) {
      confirmNo.style.display = "none";
      confirmYes.innerText = "Solicitar Permiso";
      modalText.innerHTML = `<b>ACCESO RESTRINGIDO</b><br><br>No se ha podido identificar la unidad familiar. Por favor, contacten con el administrador.`;
      
      confirmYes.onclick = () => {
        familyModal.classList.add("hidden");
        statusMessage.innerHTML = "<div id='statusBanner' style='background:red; color:white; padding:10px; border-radius:5px;'>⏳ ESPERANDO APROBACIÓN DESDE LA NUBE...</div>";
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

  function procesarConfirmacion(family) {
    familyModal.classList.add("hidden");
    
    // CASO ATALAYA
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
      suspiciousImage.src = window.location.origin + "/" + sospechoso.photo;
      suspiciousImage.style.display = "block";
      suspiciousText.innerHTML = `⚠️ <b>ALERTA</b>: Integrante no reconocido: ${sospechoso.name}`;
      suspiciousModal.classList.remove("hidden");

      document.getElementById("retryBtn").onclick = () => {
        suspiciousModal.classList.add("hidden");
        esSegundoIntento = true;
        preview.style.display = "none";
        continueBtn.classList.add("hidden");
        cameraInput.value = "";
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

  // FUNCIÓN DE ESCUCHA DESDE FIREBASE
  function escucharAdmin(family) {
    const approvalRef = ref(db, 'accessControl/adminApproval');
    onValue(approvalRef, (snapshot) => {
        const data = snapshot.val();
        if (data && data.status === "true") {
            // Limpiamos la nube para el siguiente uso
            set(ref(db, 'accessControl/adminApproval'), { status: "false" });

            const banner = document.getElementById("statusBanner");
            if (banner) {
                banner.style.background = "#15803d";
                banner.innerText = "✅ PERMISO CONCEDIDO DESDE LA NUBE";
            }
            setTimeout(() => { procesarConfirmacion(family); }, 1500);
        }
    });
  }
});