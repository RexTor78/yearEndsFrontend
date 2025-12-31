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

  let familiasRestantes = [];
  let currentIndex = 0;

  // 1. CARGA DE FAMILIAS (Versión Original)
  try {
    const response = await fetch("./families.json");
    const data = await response.json();
    familiasRestantes = data.families;
    // Mezclamos un poco para que no siempre salga la misma
    familiasRestantes.sort(() => Math.random() - 0.5);
  } catch (e) {
    console.error("Error cargando el JSON", e);
  }

  // 2. CAPTURA Y PREVISUALIZACIÓN (Tal cual funcionaba antes)
  cameraInput.addEventListener("change", function(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(event) {
        preview.src = event.target.result;
        preview.style.display = "block";
        continueBtn.classList.remove("hidden");
        continueBtn.style.display = "block"; // Aseguramos que se vea
        statusMessage.innerText = "✅ Foto capturada.";
        sessionStorage.setItem("selfie", event.target.result);
      };
      reader.readAsDataURL(file);
    }
  });

  // 3. FLUJO DE PREDICCIÓN (Sin bloqueos)
  continueBtn.onclick = () => {
    statusMessage.innerText = "🧠 Analizando rasgos faciales...";
    // El retraso es solo visual, luego llama a la función
    setTimeout(showPrediction, 1500);
  };

  function showPrediction() {
    if (familiasRestantes.length === 0) return;

    const family = familiasRestantes[currentIndex % familiasRestantes.length];
    let ordenLlegada = parseInt(localStorage.getItem("contadorLlegada") || "1");

    // Lógica del 3º que ya tenías
    if (ordenLlegada === 3) {
      confirmNo.style.display = "none";
      confirmYes.innerText = "Solicitar Permiso";
      modalText.innerHTML = `<b style="color:red">ACCESO RESTRINGIDO</b><br><br>Por favor contacten con el administrador, no hemos conseguido identificarles`;
      
      confirmYes.onclick = () => {
        familyModal.classList.add("hidden");
        statusMessage.innerHTML = `<div style="background: #b91c1c; color: white; padding: 15px; border-radius: 8px; font-weight: bold; text-align: center;">⏳ ESPERANDO APROBACIÓN...</div>`;
        escucharAdmin(family);
      };
    } else {
      confirmNo.style.display = "inline-block";
      confirmYes.innerText = "✅ Sí";
      confirmNo.innerText = "❌ No";
      modalText.innerHTML = `¿Sois la familia <b>${family.display_name}</b>?`;
      
      confirmYes.onclick = () => finalizarTodo(family);
      confirmNo.onclick = () => {
        familyModal.classList.add("hidden");
        currentIndex++;
        showPrediction();
      };
    }
    familyModal.classList.remove("hidden");
  }

  // 4. FINALIZAR Y PASAR A TRIVIA (Lógica estable)
  function finalizarTodo(family) {
    let orden = parseInt(localStorage.getItem("contadorLlegada") || "1");
    localStorage.setItem("contadorLlegada", (orden + 1).toString());

    sessionStorage.setItem("identifiedFamily", JSON.stringify(family));
    window.location.href = "pages/trivia.html";
  }

  // 5. ESCUCHA DE FIREBASE
  function escucharAdmin(family) {
    onValue(ref(db, 'accessControl/adminApproval'), (snapshot) => {
      const data = snapshot.val();
      if (data && data.status === "true") {
        set(ref(db, 'accessControl/adminApproval'), { status: "false" });
        finalizarTodo(family);
      }
    });
  }
});