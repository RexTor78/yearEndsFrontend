// ===============================
// GLOBAL STATE
// ===============================
let families = [];
let remainingFamilies = [];
let confirmedFamily = null;

// ===============================
// LOAD FAMILIES JSON
// ===============================
async function loadFamilies() {
  const res = await fetch("./families.json");
  const data = await res.json();
  families = data.families;
  remainingFamilies = [...families];
}

loadFamilies();

// ===============================
// MAIN ENTRY (cuando hacen la foto)
// ===============================
async function processPhoto() {
  if (remainingFamilies.length === 0) {
    alert("No quedan más familias para evaluar");
    return;
  }

  const predictedFamily = getRandomFamily();
  showFamilyConfirmation(predictedFamily);
}

// ===============================
// RANDOM FAMILY (sin pesos)
// ===============================
function getRandomFamily() {
  const index = Math.floor(Math.random() * remainingFamilies.length);
  return remainingFamilies[index];
}

// ===============================
// FAMILY CONFIRMATION MODAL
// ===============================
function showFamilyConfirmation(family) {
  openConfirmModal({
    title: "Familia detectada",
    text: `¿Es correcta la ${family.display_name}?`,
    onYes: () => {
      confirmedFamily = family;
      handleFamilyConfirmed(family);
    },
    onNo: () => {
      remainingFamilies = remainingFamilies.filter(f => f.id !== family.id);
      closeModal();
      setTimeout(processPhoto, 800);
    }
  });
}

// ===============================
// AFTER FAMILY CONFIRMED
// ===============================
function handleFamilyConfirmed(family) {
  closeModal();

  if (family.special_message) {
    openInfoModal({
      title: "Aviso de seguridad",
      text: family.special_message[0],
      onContinue: () => handleSuspiciousMember(family)
    });
    return;
  }

  handleSuspiciousMember(family);
}

// ===============================
// SOSPECHOSO FLOW
// ===============================
function handleSuspiciousMember(family) {
  const suspicious = family.members.find(m => m.sospechoso === true);

  if (!suspicious) {
    grantAccess();
    return;
  }

  openSuspiciousModal({
    image: suspicious.photo,
    text: "No ha sido posible identificar al integrante de la imagen.",
    onRetry: () => {
      closeModal();
      setTimeout(grantAccess, 800);
    },
    onExclude: () => {
      closeModal();
      setTimeout(grantAccess, 800);
    }
  });
}

// ===============================
// FINAL ACCESS
// ===============================
function grantAccess() {
  openInfoModal({
    title: "Acceso concedido",
    text: `Perfecto, se ha validado la ${confirmedFamily.display_name}.`,
    onContinue: () => {
      closeModal();
      console.log("➡️ Pasando a la trivia...");
      window.location.href = "./trivia.html";
    }
  });
}

/* ======================================================
   PLACEHOLDERS → CONECTA AQUÍ TUS MODALES REALES
====================================================== */

function openConfirmModal({ title, text, onYes, onNo }) {
  document.getElementById("modalTitle").innerText = title;
  document.getElementById("modalText").innerText = text;
  document.getElementById("familyModal").classList.remove("hidden");
  document.getElementById("confirmYes").onclick = onYes;
  document.getElementById("confirmNo").onclick = onNo;
}

function openSuspiciousModal({ image, text, onRetry, onExclude }) {
  console.log("SOSPECHOSO:", image, text);
  // conecta tu modal real
  document.getElementById("retryBtn")?.addEventListener("click", onRetry);
  document.getElementById("excludeBtn")?.addEventListener("click", onExclude);
}

function openInfoModal({ title, text, onContinue }) {
  console.log(title, text);
  document.getElementById("continueBtn").onclick = onContinue;
}

function closeModal() {
  document.getElementById("familyModal")?.classList.add("hidden");
  console.log("Modal cerrado");
}

// ===============================
// EVENT LISTENER FOTO
// ===============================
document.getElementById("photoBtn").addEventListener("click", () => {
  document.getElementById("cameraInput").click();
});

document.getElementById("cameraInput").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const preview = document.getElementById("preview");
  preview.src = URL.createObjectURL(file);
  preview.style.display = "block";

  setTimeout(processPhoto, 500);
});
