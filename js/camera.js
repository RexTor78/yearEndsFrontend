document.addEventListener("DOMContentLoaded", async () => {
  // Selectores principales
  const cameraInput = document.getElementById("cameraInput");
  const preview = document.getElementById("preview");
  const continueBtn = document.getElementById("continueBtn");
  const statusMessage = document.getElementById("statusMessage");

  // Selectores de Modales
  const familyModal = document.getElementById("familyModal");
  const modalText = document.getElementById("modalText");
  const confirmYes = document.getElementById("confirmYes");
  const confirmNo = document.getElementById("confirmNo");

  let families = [];
  let shuffledFamilies = [];
  let currentIndex = 0;
  let capturedImage = null;

  // 1. CARGA DE DATOS (Aseguramos que ocurra al inicio)
  try {
    const response = await fetch("families.json");
    const data = await response.json();
    families = data.families;
    // Mezclamos las familias aleatoriamente
    shuffledFamilies = families.sort(() => Math.random() - 0.5);
  } catch (error) {
    console.error("Error cargando el JSON:", error);
    statusMessage.innerText = "❌ Error al cargar base de datos.";
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
        capturedImage = event.target.result;
        statusMessage.innerText = "✅ Foto lista.";
      };
      reader.readAsDataURL(file);
    }
  });

  // 3. BOTÓN CONTINUAR (Optimizado para móvil)
  const handleContinue = () => {
    if (!capturedImage) {
      statusMessage.innerText = "⚠️ Por favor, haga una foto primero.";
      return;
    }
    
    // Guardamos la foto para la siguiente pantalla
    sessionStorage.setItem("selfie", capturedImage);
    
    statusMessage.innerText = "🧠 Analizando identidad...";
    
    // Pequeño retardo para simular "procesamiento"
    setTimeout(() => {
      showNextFamily();
    }, 1200);
  };

  continueBtn.addEventListener("click", handleContinue);
  // Añadimos 'touchend' para mejorar respuesta en móviles antiguos
  continueBtn.addEventListener("touchend", (e) => {
    e.preventDefault(); // Evita doble ejecución
    handleContinue();
  });

  // 4. LÓGICA DE PREDICCIÓN DE FAMILIAS
  function showNextFamily() {
    // Si llegamos al final de la lista, mostramos el error
    if (currentIndex >= shuffledFamilies.length) {
      statusMessage.innerText = "❌ No hemos podido identificar su familia definitivamente.";
      return;
    }

    const family = shuffledFamilies[currentIndex];
    
    modalText.innerHTML = `
      <strong>Resultado del análisis:</strong><br><br>
      Parece que sois la:<br>
      <span style="font-size: 1.2em; color: #ffd700;">${family.display_name}</span><br><br>
      ¿Es correcto?
    `;
    
    familyModal.classList.remove("hidden");
  }

  // 5. BOTONES DEL MODAL
  confirmYes.onclick = () => {
    const familyIdentified = shuffledFamilies[currentIndex];
    sessionStorage.setItem("identifiedFamily", JSON.stringify(familyIdentified));
    
    // Redirigir según el tipo de familia
    if (familyIdentified.id === "CanTallaAtalaya") {
        window.location.href = "trivia.html?type=atalaya"; // Podrías manejarlo así
    } else {
        window.location.href = "trivia.html";
    }
  };

  confirmNo.onclick = () => {
    familyModal.classList.add("hidden");
    currentIndex++; // Pasamos a la siguiente familia aleatoria
    statusMessage.innerText = "Buscando otra coincidencia...";
    
    setTimeout(() => {
        showNextFamily();
    }, 800);
  };
});