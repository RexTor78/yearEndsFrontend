// Ejemplo de familias
const families = ["Ingrid", "Alexandra", "Ona", "Aitana"];

// Recuperamos métricas de todas las fases
let allMetrics = {};
families.forEach(fam => {
  const metrics = JSON.parse(localStorage.getItem(`${fam}_metrics`)) || {};
  allMetrics[fam] = metrics;
});

// Crear contenedores de gráficos
const chartsContainer = document.getElementById("familyCharts");

families.forEach(fam => {
  const chartDiv = document.createElement("div");
  chartDiv.classList.add("chartCard");

  const title = document.createElement("h3");
  title.innerText = fam;
  chartDiv.appendChild(title);

  const canvas = document.createElement("canvas");
  canvas.id = `chart_${fam}`;
  chartDiv.appendChild(canvas);

  chartsContainer.appendChild(chartDiv);

  const metrics = allMetrics[fam];
  const labels = Object.keys(metrics);
  const data = Object.values(metrics);

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: `Resultados de ${fam}`,
        data: data,
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true, max: 10 } }
    }
  });
});
const familyCollagesContainer = document.getElementById("familyCollages");

families.forEach(fam => {
  const card = document.createElement("div");
  card.classList.add("familyCard");

  const title = document.createElement("h4");
  title.innerText = fam;
  card.appendChild(title);

  const img = document.createElement("img");
  img.src = `data/photos/collage/${fam}.jpg`; // collage individual
  card.appendChild(img);

  familyCollagesContainer.appendChild(card);
});
