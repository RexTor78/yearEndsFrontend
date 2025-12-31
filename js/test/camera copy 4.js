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
  const retryBtn = document.getElementById("retryBtn");
  const excludeBtn = document.getElementById("excludeBtn");

  const infoModal = document.getElementById("infoModal");
  const infoTitle = document.getElementById("infoTitle");
  const infoText = document.getElementById("infoText");
  const continueBtnInfo = document.getElementById("continueBtnInfo");

  let families = [];
  let shuffledFamilies = [];
  let currentIndex = 0;
  let confirmedFamily = null;
  let capturedImage = null;

  // Cargar datos del JSON
  try {
    const response = await fetch("families.json");
    const data = await response.json();
    families = data.families;
    shuffledFamilies = shuffleArray([...families]);
  } catch (error) {
    console.error("Error cargando familias:", error);
  }

  // Utilidad para desordenar el array y simular "búsqueda"
  function shuffleArray(array) {
    return array.sort(() => Math.random() - 0.5);
  }

 
cameraInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    

    statusMessage.innerText = "Cargando imagen...";

    reader.onload = (event) => {
   
      preview.src = event.target.result;
 
      preview.style.display = "block"; 
      

      continueBtn.classList.remove("hidden");
      

      statusMessage.innerText = "¡Foto capturada!";
      capturedImage = event.target.result;
    };
    
    reader.readAsDataURL(file);
  }
});


  continueBtn.addEventListener("click", () => {
    if (!capturedImage) {
      statusMessage.innerText = "⚠️ Por favor, haga una foto primero.";
      return;
    }
    sessionStorage.setItem("selfie", capturedImage);
    statusMessage.innerText = "🧠 Analizando identidad...";
    setTimeout(showNextFamily, 1500);
  });


  function showNextFamily() {
    if (currentIndex >= shuffledFamilies.length) {
      statusMessage.innerText = "❌ No hemos podido identificar su familia.";
      return;
    }

    const family = shuffledFamilies[currentIndex];
    modalText.innerHTML = `
      <strong>Resultado del análisis</strong><br><br>
      Creemos que sois la <strong>${family.display_name}</strong><br><br>
      ¿Es correcto?
    `;
    familyModal.classList.remove("hidden");
  }


  confirmYes.onclick = () => {
    confirmedFamily = shuffledFamilies[currentIndex];
    familyModal.classList.add("hidden");
    sessionStorage.setItem("identifiedFamily", JSON.stringify(confirmedFamily));

    if (confirmedFamily.id === "CanTallaAtalaya") {
      showAtalayaMessage();
      return;
    }


    const suspiciousMember = confirmedFamily.members.find(m => m.sospechoso === true);
    if (suspiciousMember) {
      showSuspiciousModal(suspiciousMember);
    } else {
      goToTrivia();
    }
  };

  confirmNo.onclick = () => {
    familyModal.classList.add("hidden");
    currentIndex++;
    showNextFamily();
  };

  function showSuspiciousModal(member) {
    suspiciousImage.src = member.photo;
    suspiciousImage.style.display = "block";
    suspiciousText.innerHTML = `⚠️ <strong>ALERTA DE SEGURIDAD</strong><br><br>
      Se ha detectado a <strong>${member.name}</strong>, marcado como sospechoso en nuestra base de datos.`;
    suspiciousModal.classList.remove("hidden");
  }

  retryBtn.onclick = () => location.reload();
  excludeBtn.onclick = () => goToTrivia();


  function showAtalayaMessage() {
    infoTitle.innerText = "Verificación Especial";
    infoText.innerText = confirmedFamily.special_message[0];
    infoModal.classList.remove("hidden");
  }

  continueBtnInfo.onclick = () => goToTrivia();

  function goToTrivia() {
    window.location.href = "trivia.html";
  }
});