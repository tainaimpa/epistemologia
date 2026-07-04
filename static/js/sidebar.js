/* Sidebar collapse/expand + dynamic "Exemplos" legend. */

const sidebar = document.getElementById("sidebar");
const toggleIcon = document.getElementById("toggle-icon");

function toggleSidebar() {
  const collapsed = sidebar.classList.toggle("collapsed");
  toggleIcon.style.transform = collapsed ? "rotate(180deg)" : "rotate(0deg)";

  setTimeout(() => {
    if (window.AppChart) window.AppChart.handleResize(true);
  }, 310);
}

document.getElementById("sidebar-toggle").addEventListener("click", toggleSidebar);

const menuToggle = document.getElementById("menu-toggle");
if (menuToggle) {
  menuToggle.addEventListener("click", toggleSidebar);
}

function buildSidebarExamples() {
  const container = document.getElementById("sb-examples");
  container.innerHTML = "";
  const total = App.activePhils.size;
  if (total === 0) return;

  const shown = new Set();
  const examples = [];
  for (let agree = total; agree >= 0; agree--) {
    const key = `${agree}/${total}`;
    if (shown.has(key)) continue;
    shown.add(key);
    examples.push({ agree, total });
    if (examples.length >= 3) break;
  }
  if (!shown.has(`0/${total}`)) {
    examples[examples.length - 1] = { agree: 0, total };
  }

  examples.forEach(({ agree, total }) => {
    const philList = [...App.activePhils];
    const R = 10;
    const RGAP = 4;
    const outerR = R + RGAP * total;
    const svgSize = (outerR + 3) * 2;

    let rings = "";
    philList.forEach((pk, ri) => {
      const isS = ri < agree;
      const c = isS ? "var(--color-science)" : "var(--color-pseudoscience)";
      const r = R + RGAP * (ri + 1);
      rings += `<circle r="${r}" fill="none" stroke="${c}" stroke-width="2.5" opacity=".85"/>`;
    });

    const allSci  = agree === total;
    const noneSci = agree === 0;
    const coreStroke = allSci ? "var(--color-science)" : noneSci ? "var(--color-pseudoscience)" : "var(--color-divided)";
    const coreFill   = allSci ? "var(--color-science-bg)" : noneSci ? "var(--color-pseudoscience-bg)" : "var(--color-divided-bg)";
    const labelColor = allSci ? "var(--color-science)" : noneSci ? "var(--color-pseudoscience)" : "var(--text-main)";
    const sublabel   = allSci ? "todos concordam" : noneSci ? "ninguém concorda" : "opiniões divididas";

    const row = document.createElement("div");
    row.className = "s-row";
    row.style.gap = "10px";
    row.style.marginBottom = "6px";
    row.innerHTML = `
      <svg width="${svgSize}" height="${svgSize}" viewBox="${-outerR-3} ${-outerR-3} ${svgSize} ${svgSize}" style="flex-shrink:0">
        ${rings}
        <circle r="${R}" fill="${coreFill}" stroke="${coreStroke}" stroke-width="1"/>
      </svg>
      <div>
        <div class="s-desc" style="color:${labelColor}">${agree}/${total} concordam</div>
        <div class="s-sub">${sublabel}</div>
      </div>`;
    container.appendChild(row);
  });
}