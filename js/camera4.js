let familiesData = null;
let currentFamily = null;
let remainingMembers = [];
let currentPrediction = null;

// Cargar JSON
fetch("/families.json")
  .then(res => res.json())
  .then(data => {
    familiesData = data.families;
    startDetection();
  });

function startDetection() {
  // Simula detección tras 2 segundos
  setTimeout(makePrediction, 2000);
}

function makePrediction() {
  if (!currentFamily) {
    currentFamily = familiesData[Math.floor(Math.random() * familiesData.length)];
    remainingMembers = [...currentFamily.members];
  }

  if (remainingMembers.length === 0) {
    alert("No se ha podido identificar ningún miembro.");
    return;
  }

  const index = Math.floor(Math.random() * remainingMembers.length);
  currentPrediction = remainingMembers[index];

  showModal(currentPrediction, currentFamily);
}

function showModal(member, family) {
  const modal = document.getElementById("modal");
  const img = document.getElementById("modal-img");
  const text = document.getElementById("modal-text");

  img.src = member.photo;
  text.innerHTML = `
    <strong>¿Pertenece a:</strong><br>
    ${family.display_name}
  `;

  modal.style.display = "flex";
}

function confirmYes() {
  const modal = document.getElementById("modal");
  modal.style.display = "none";

  if (currentPrediction.sospechoso) {
    showResult(true);
  } else {
    showResult(false);
  }
}

function confirmNo() {
  // eliminar definitivamente
  remainingMembers = remainingMembers.filter(m => m !== currentPrediction);

  const modal = document.getElementById("modal");
  modal.style.display = "none";

  setTimeout(makePrediction, 1500);
}

function showResult(isCorrect) {
  const result = document.getElementById("result");
  const msg = document.getElementById("result-text");

  if (isCorrect) {
    msg.innerHTML = "✅ Identificación confirmada.";

    if (currentFamily.special_message) {
      msg.innerHTML += `<br><br>${currentFamily.special_message[0]}`;
    }

    setTimeout(() => {
      window.location.href = "celebration.html";
    }, 4000);
  } else {
    msg.innerHTML = "❌ Error de identificación.";
  }

  result.style.display = "flex";
}
