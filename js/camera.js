// Dentro de la función showPrediction en camera.js

function showPrediction() {
  const family = shuffledFamilies[currentIndex];

  // SOLO se bloquea si es la TERCERA familia de la lista (índice 2)
  if (currentIndex === 2) {
    modalText.innerHTML = `
      <div style="color: #ff4444; font-weight: bold; font-size: 1.2rem;">⚠️ ACCESO BLOQUEADO</div><br>
      Identificados como: <b>${family.display_name}</b>.<br><br>
      Esta familia tiene el acceso restringido. Se ha solicitado permiso al administrador.
    `;
    confirmYes.innerText = "Solicitar Permiso";
    confirmNo.style.display = "none"; // No pueden saltárselo

    confirmYes.onclick = () => {
      familyModal.classList.add("hidden");
      statusMessage.innerHTML = `
        <div id="adminBanner" style="background: #b91c1c; color: white; padding: 15px; border-radius: 8px; animation: pulse 2s infinite;">
          ⏳ Esperando confirmación del administrador...
        </div>`;
      
      sessionStorage.setItem("identifiedFamily", JSON.stringify(family));
      iniciarEscuchaAdmin();
    };
  } else {
    // Para cualquier otra familia (1ª, 2ª, 4ª, 5ª, 6ª...)
    confirmNo.style.display = "inline-block";
    confirmYes.innerText = "✅ Sí";
    confirmNo.innerText = "❌ No";
    modalText.innerHTML = `¿Sois la familia <b>${family.display_name}</b>?`;

    confirmYes.onclick = () => {
      sessionStorage.setItem("identifiedFamily", JSON.stringify(family));
      window.location.href = "pages/trivia.html";
    };

    confirmNo.onclick = () => {
      familyModal.classList.add("hidden");
      currentIndex++; // Pasa a la siguiente familia
      if (currentIndex >= shuffledFamilies.length) currentIndex = 0; // Bucle infinito de seguridad
      setTimeout(showPrediction, 500);
    };
  }
  familyModal.classList.remove("hidden");
}

function iniciarEscuchaAdmin() {
  const interval = setInterval(() => {
    if (localStorage.getItem("adminApproval") === "true") {
      clearInterval(interval);
      localStorage.removeItem("adminApproval");

      // Banner de éxito antes de redirigir
      const banner = document.getElementById("adminBanner");
      banner.style.background = "#15803d";
      banner.innerText = "✅ PERMISO CONCEDIDO POR EL ADMINISTRADOR";
      
      setTimeout(() => {
        window.location.href = "pages/trivia.html";
      }, 2000);
    }
  }, 2000);
}