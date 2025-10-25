document.addEventListener("DOMContentLoaded", () => {
  const map = L.map("map").setView([46.8, 7.1], 8);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  const markers = L.markerClusterGroup();

  const lieux = [
    { name: "Skatepark de Montreux", lat: 46.433, lng: 6.910, type: "skatepark" },
    { name: "Skatepark de Lausanne Vidy", lat: 46.523, lng: 6.610, type: "skatepark" },
    { name: "Skatepark de Plainpalais", lat: 46.198, lng: 6.142, type: "skatepark" },
    { name: "Skatepark de Sion", lat: 46.233, lng: 7.360, type: "skatepark" },
    { name: "JF Rideshop", lat: 46.430, lng: 6.911, type: "shop", website: "https://jfrideshop.ch" },
    { name: "Cours RSL — Montreux", lat: 46.433, lng: 6.910, type: "cours" },
    { name: "Cours RSL — Lausanne", lat: 46.523, lng: 6.610, type: "cours" },
    { name: "Cours RSL — Genève", lat: 46.198, lng: 6.142, type: "cours" },
  ];

  lieux.forEach(lieu => {
    const icon = L.divIcon({
      className: "custom-marker",
      html: <div style="background:#222;color:#fff;width:30px;height:30px;display:flex;align-items:center;justify-content:center;border-radius:50%">🛹</div>,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    const popup = `
      <strong>${lieu.name}</strong><br>
      Type: ${lieu.type}<br>
      ${lieu.website ? <a href="${lieu.website}" target="_blank">Visiter le site</a> : ""}
    `;
    markers.addLayer(L.marker([lieu.lat, lieu.lng], { icon }).bindPopup(popup));
  });

  map.addLayer(markers);
});