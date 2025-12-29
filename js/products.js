// products.js
import { API_URL } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  const productsContainer = document.getElementById("productsContainer");
  const continueBtn = document.getElementById("continueBtn");
  const statusMessage = document.getElementById("statusMessage");

  // Simulación de productos requeridos por la familia
  const family = sessionStorage.getItem("family") || "Familia desconocida";
  const requiredProducts = JSON.parse(sessionStorage.getItem("requiredProducts") || '["Agua", "Vino", "Frutas"]');

  // Renderizamos productos como checkboxes
  requiredProducts.forEach(product => {
    const li = document.createElement("li");
    li.innerHTML = `
      <label>
        <input type="checkbox" value="${product}" />
        ${product}
      </label>
    `;
    productsContainer.appendChild(li);
  });

  // Continuar
  continueBtn.addEventListener("click", () => {
    const checked = Array.from(productsContainer.querySelectorAll("input:checked")).map(i => i.value);

    if (!checked.length) {
      statusMessage.innerText = "⚠️ Seleccione al menos un producto.";
      return;
    }

    sessionStorage.setItem("selectedProducts", JSON.stringify(checked));
    statusMessage.innerText = "✅ Productos guardados, redirigiendo a Trivia...";

    setTimeout(() => {
      window.location.href = "./trivia.html";
    }, 1000);
  });
});
