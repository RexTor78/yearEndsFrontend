document.addEventListener("DOMContentLoaded", async () => {
  const photoBtn = document.getElementById("photoBtn");
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
  let secondPhotoForSuspicious = false;


  const response = await fetch("families.json");
  const data = await response.json();
  families = data.families;
  shuffledFamilies = shuffleArray([...families]);

  photoBtn.addEventListener("click", () => cameraInput.click());

  cameraInput.addEventListener("change", () => {
    const file = cameraInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      preview.src = reader.result;
      preview.style.display = "block";
      continueBtn.classList.remove("hidden");
      statusMessage.innerText = "";
      capturedImage = reader.result;
    };
    reader.readAsDataURL(file);
  });

  continueBtn.addEventListener("click", () => {
    if (!capturedImage) {
      statusMessage.innerText = "⚠️ Por favor, haga una foto primero.";
      return;
    }

    sessionStorage.setItem("selfie", capturedImage);

    if (secondPhotoForSuspicious && confirmedFamily) {
      showFinalSuspiciousApproval();
      return;
    }

    statusMessage.innerText = "🧠 Analizando identidad...";
    setTimeout(showNextFamily, 1000);
  });

  function showNextFamily() {
    if (currentIndex >= shuffledFamilies.length) {
      statusMessage.innerText =
        "❌ No hemos podido identificar su familia.";
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

    sessionStorage.setItem(
      "identifiedFamily",
      JSON.stringify(confirmedFamily)
    );

    // Excepción Can Talla L'Atalaya
    if (confirmedFamily.id === "CanTallaAtalaya") {
      showAtalayaMessage();
      return;
    }

    // ¿Tiene sospechoso?
    const suspiciousMember = confirmedFamily.members.find(
      (m) => m.sospec
