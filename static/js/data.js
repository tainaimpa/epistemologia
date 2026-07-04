/* Fetches philosopher + theory data from the Flask backend (/api/data) and
   boots the rest of the app once it's loaded. No data is hardcoded here. */

fetch("/api/data")
  .then(res => res.json())
  .then(payload => {
    App.philosophers = payload.philosophers;
    App.theories     = payload.theories;
    App.threshold    = payload.threshold;

    initPhilButtons(window.AppChart.onSelectionChange);
    window.AppChart.init();
  })
  .catch(err => {
    console.error("Falha ao carregar /api/data:", err);
    document.getElementById("viz-container").innerHTML =
      '<p style="padding:24px;color:var(--text-muted)">Não foi possível carregar os dados. Verifique se o servidor Flask está rodando.</p>';
  });