import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  databaseURL: "https://villaaccess-73af4-default-rtdb.europe-west1.firebasedatabase.app/"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

document.addEventListener("DOMContentLoaded", async () => {
  // --- SELECTORES ---
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

  // 1. CARGA Y FILTRADO (Evita que familias que ya entraron vuelvan a aparecer)
  try {
    const response = await fetch("./families.json");
    const data = await response.json();
    const yaEntraron = JSON.parse(localStorage.getItem("familiasEnCasa") || "[]");
    
    familiasRestantes = data.families.filter(f => !yaEntraron.includes(f.id));
    familiasRestantes.sort(() => Math.random() - 0.5); // Mezclar
  } catch (e) {
    console.error("Error cargando JSON", e);
  }

  // 2. CAPTURA DE FOTO (Previsualización)
  cameraInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        preview.src = event.target.result;
        preview.style.display = "block";
        continueBtn.style.display = "block";
        continueBtn.classList.remove("hidden");
        statusMessage.innerText = "✅ Foto capturada.";
        sessionStorage.setItem("selfie", event.target.result);
      };
      reader.readAsDataURL(file);
    }
  });

  // 3. ANALIZAR
  continueBtn.onclick = () => {
    statusMessage.innerText = "🧠 Analizando rasgos faciales...";
    setTimeout(ejecutarPrediccion, 1500);
  };

  // 4. LÓGICA DE PREDICCIÓN (Con bloqueo en la familia nº 3)
  function ejecutarPrediccion() {
    if (familiasRestantes.length === 0) {
      statusMessage.innerText = "⚠️ No quedan familias pendientes.";
      return;
    }

    const family = familiasRestantes[currentIndex % familiasRestantes.length];
    let ordenLlegada = parseInt(localStorage.getItem("contadorLlegada") || "1");

    if (ordenLlegada === 3) {
      // Turno 3: Bloqueo de Administrador
      confirmNo.style.display = "none";
      confirmYes.innerText = "Solicitar Permiso";
      modalText.innerHTML = `<b style="color:red">ACCESO RESTRINGIDO</b><br><br>Por favor contacten con el administrador, no hemos conseguido identificarles`;
      
      confirmYes.onclick = () => {
        familyModal.classList.add("hidden");
        statusMessage.innerHTML = "<div style='background:red; color:white; padding:15px; border-radius:8px; font-weight:bold;'>⏳ ESPERANDO APROBACIÓN DEL ADMINISTRADOR...</div>";
        escucharAdmin(family);
      };
    } else {
      // Turno normal (1, 2, 4, 5...)
      confirmNo.style.display = "inline-block";
      confirmYes.innerText = "✅ Sí";
      confirmNo.innerText = "❌ No";
      modalText.innerHTML = `¿Sois la familia <b>${family.display_name}</b>?`;
      
      confirmYes.onclick = () => procesarConfirmacion(family);
      confirmNo.onclick = () => {
        familyModal.classList.add("hidden");
        currentIndex++;
        ejecutarPrediccion();
      };
    }
    familyModal.classList.remove("hidden");
  }

  // 5. PROCESAR SOSPECHOSOS Y ATALAYA
  function procesarConfirmacion(family) {
    familyModal.classList.add("hidden");

    // Caso Atalaya (Texto original)
    if (family.id === "CanTallaAtalaya") {
      suspiciousImage.style.display = "none";
      suspiciousText.innerHTML = `Se les ha concedido acceso a la villa, pero el sistema ha detectado un integrante de <b>nacionalidad altamente dudosa</b>. Serán vigilados.`;
      document.getElementById("excludeBtn").style.display = "none";
      document.getElementById("retryBtn").innerText = "Entendido";
      suspiciousModal.classList.remove("hidden");
      document.getElementById("retryBtn").onclick = () => finalizarTodo(family);
      return;
    }

    // Caso Sospechoso
    const sospechoso = family.members.find(m => m.sospechoso === true);
    if (sospechoso && !esSegundoIntento) {
      const nombreFoto = sospechoso.photo.split('/').pop();
      suspiciousImage.src = `family_photos/${family.id}/${nombreFoto}`;
      suspiciousImage.style.display = "block";
      suspiciousText.innerHTML = `⚠️ <b>ALERTA</b>: Integrante no reconocido: <b>${sospechoso.name}</b>.`;
      suspiciousModal.classList.remove("hidden");

      document.getElementById("retryBtn").onclick = () => {
        suspiciousModal.classList.add("hidden");
        esSegundoIntento = true;
        preview.style.display = "none";
        continueBtn.style.display = "none";
        statusMessage.innerHTML = "<b style='color:yellow'>Por favor, repitan la foto sin el sospechoso.</b>";
        window.scrollTo(0,0);
      };

      document.getElementById("excludeBtn").onclick = () => {
        suspiciousModal.classList.add("hidden");
        finalizarTodo(family);
      };
    } else {
      finalizarTodo(family);
    }
  }

  // 6. FINALIZAR (Suma contador y redirige)
  function finalizarTodo(family) {
    // Contador de llegada
    let orden = parseInt(localStorage.getItem("contadorLlegada") || "1");
    localStorage.setItem("contadorLlegada", (orden + 1).toString());

    // Guardar familia que ya entró
    const yaEntraron = JSON.parse(localStorage.getItem("familiasEnCasa") || "[]");
    yaEntraron.push(family.id);
    localStorage.setItem("familiasEnCasa", JSON.stringify(yaEntraron));

    // Sesión y Redirección
    sessionStorage.setItem("identifiedFamily", JSON.stringify(family));
    window.location.href = "pages/trivia.html";
  }

  // 7. ESCUCHA FIREBASE (Señal del Admin)
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