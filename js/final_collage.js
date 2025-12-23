const API = "http://127.0.0.1:8000";
const families = ["Ingrid", "Alexandra", "Ona", "Aitana"];

async function loadGlobalCollage() {
  const res = await fetch(`${API}/all_photos`);
  const data = await res.json();
  const container = document.getElementById("globalCollage");

  data.photos
    .sort(() => Math.random() - 0.5)
    .slice(0, 12)
    .forEach(url => {
      const img = document.createElement("img");
      img.src = API + url;
      container.appendChild(img);
    });
}

async function loadFamilies() {
  const container = document.querySelector(".families");

  for (const fam of families) {
    const card = document.createElement("div");
    card.className = "family-card";

    card.innerHTML = `
      <div class="arrow">⬆️</div>
      <h3>Familia ${fam}</h3>
      <img src="${API}/family_photos/${fam}" style="display:none">
      <canvas id="chart-${fam}" height="200"></canvas>
    `;

    container.appendChild(card);
    loadFamilyChart(fam);
  }
}

async function loadFamilyChart(family) {
  const res = await fetch(`${API}/all_results`);
  const data = await res.json();

  const tags = { cooperativo:0, egoista:0, pasivo:0 };

  data.responses
    .filter(r => r.family === family)
    .forEach(r => {
      if (r.tag) tags[r.tag]++;
    });

  new Chart(document.getElementById(`chart-${family}`), {
    type: 'radar',
    data: {
      labels: Object.keys(tags),
      datasets: [{
        label: family,
        data: Object.values(tags),
        backgroundColor: "rgba(34,197,94,0.3)",
        borderColor: "#22c55e",
        borderWidth: 2
      }]
    },
    options: { scales: { r: { beginAtZero: true } } }
  });
}

loadGlobalCollage();
loadFamilies();
