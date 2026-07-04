/* Shared app state, populated by data.js after fetching /api/data. */
window.App = {
  philosophers: [],  // [{ key, name, full_name, color, criterion, bio, ... }]
  theories: [],      // [{ id, label, since, scores: { philKey: { is_science, args } } }]
  threshold: 0.5,
  activePhils: new Set(),
};