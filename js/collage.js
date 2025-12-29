// Recuperamos todas las fotos guardadas en sessionStorage
const families = ["Ingrid", "Alexandra", "Ona", "Aitana"];
const collageContainer = document.getElementById("collageContainer");

families.forEach(family => {
  const selfieUrl = sessionStorage.getItem(`${family}_selfie`);
  const productsUrl = sessionStorage.getItem(`${family}_products`);

  if (selfieUrl) {
    const img = document.createElement("img");
    img.src = selfieUrl;
    img.alt = `${family} selfie`;
    img.classList.add("collage-selfie");
    collageContainer.appendChild(img);
  }

  if (productsUrl) {
    const img = document.createElement("img");
    img.src = productsUrl;
    img.alt = `${family} products`;
    img.classList.add("collage-products");
    collageContainer.appendChild(img);
  }
});

// Aquí puedes añadir la lógica de gráficas, flechas y posición alrededor del collage central
