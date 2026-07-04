/* D3 bubble chart: one bubble per theory, one ring per active philosopher. */

const vizContainer = document.getElementById("viz-container");
const tooltip      = document.getElementById("tooltip");

let lockedNode = null;
let lockedX = 0;
let lockedY = 0;

window.unlockTooltip = function() {
  lockedNode = null;
  tooltip.style.display = "none";
  tooltip.style.pointerEvents = "none";
  d3.selectAll(".bubble").classed("locked", false);
};

const PAD       = { left: 10, right: 16 };
const RING_GAP_MAX = 4;
const RING_GAP_MIN = 2;
const CORE_R_MAX   = 46;
const CORE_R_MIN   = 20;
const MIN_COL_W    = 92;   // below this per-bubble width, the chart scrolls instead of shrinking further
const RING_W    = 2.5;
const LABEL_FS  = 11;
const LABEL_GAP = 10;
const LABEL_MAX_W = 100;

/* Bubble/ring sizing is recomputed on every render (see updateSizing) so the
   chart shrinks gracefully as the container narrows instead of the fixed-size
   bubbles overlapping each other. */
let coreR     = CORE_R_MAX;
let ringGap   = RING_GAP_MAX;
let svgW      = 0;
let labelMaxW = LABEL_MAX_W;

function updateSizing() {
  const cols  = Math.max(App.theories.length, 1);
  const rings = Math.max(App.activePhils.size, 1);
  svgW = Math.max(W, cols * MIN_COL_W);

  const usable   = svgW - PAD.left - PAD.right;
  const colWidth = usable / cols;
  const maxOuterR = colWidth * 0.42;
  const scale = Math.min(1, maxOuterR / (CORE_R_MAX + RING_GAP_MAX * rings));

  coreR     = Math.max(CORE_R_MIN, CORE_R_MAX * scale);
  ringGap   = Math.max(RING_GAP_MIN, RING_GAP_MAX * scale);
  labelMaxW = Math.max(50, Math.min(LABEL_MAX_W, colWidth - 8));
}

function bottomPad() {
  const rings   = App.activePhils.size;
  const outerR  = coreR + ringGap * rings;
  const lines   = 2;
  return outerR + LABEL_GAP + lines * LABEL_FS * 1.15 + 8;
}

function topPad() {
  const rings  = App.activePhils.size;
  const outerR = coreR + ringGap * rings;
  return outerR + 16;
}

let measureCtx;
function wrapLabel(text, maxWidth, font) {
  if (!measureCtx) measureCtx = document.createElement("canvas").getContext("2d");
  measureCtx.font = font;
  const words = text.split(" ");
  const lines = [];
  let current = "";
  words.forEach(word => {
    const test = current ? `${current} ${word}` : word;
    if (current && measureCtx.measureText(test).width > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  });
  if (current) lines.push(current);
  return lines;
}

let W, H;
function getDims() {
  W = vizContainer.clientWidth;
  H = vizContainer.clientHeight;
  return { W, H };
}
getDims();

const svg = d3.select("#viz-container").append("svg").attr("width", W).attr("height", H);
svg.on("click", function(event) {
  if (event.target.tagName === "rect" || event.target === svg.node()) {
    unlockTooltip();
  }
});
svg.append("rect").attr("class", "bg").attr("width", W).attr("height", H);
svg.append("rect")
  .attr("class", "bg-noise")
  .attr("width", W)
  .attr("height", H)
  .attr("filter", "url(#noiseFilter)")
  .attr("opacity", "1.0")
  .style("mix-blend-mode", "overlay")
  .style("pointer-events", "none");

/* One Font Awesome Free (solid) icon per theory, keyed by theory id (see
   data/loader.py slugify). Each glyph is wrapped in a nested <svg> using its
   native viewBox so it auto-scales/centers into the shared 0-100 icon box;
   fill/stroke are set inline because .btheme-icon defaults to fill:none for
   the old stroke-based icon set. */
const THEORY_ICONS = {
  astrologia: `
    <svg x="0" y="0" width="100" height="100" viewBox="0 0 512 512">
      <path fill="currentColor" stroke="none" d="M256 0C114.6 0 0 114.6 0 256S114.6 512 256 512c68.8 0 131.3-27.2 177.3-71.4 7.3-7 9.4-17.9 5.3-27.1s-13.7-14.9-23.8-14.1c-4.9 .4-9.8 .6-14.8 .6-101.6 0-184-82.4-184-184 0-72.1 41.5-134.6 102.1-164.8 9.1-4.5 14.3-14.3 13.1-24.4S322.6 8.5 312.7 6.3C294.4 2.2 275.4 0 256 0z"/>
    </svg>
  `,
  homeopatia: `
    <svg x="0" y="0" width="100" height="100" viewBox="0 0 512 512">
      <path fill="currentColor" stroke="none" d="M504.3 11.1C493.3-1.6 474.5-3.7 461 6.2L252.3 160 397.3 160 502.6 54.6c11.8-11.8 12.6-30.8 1.6-43.5zM32 192c-17.7 0-32 14.3-32 32s14.3 32 32 32c0 82.5 43.4 147.7 123.9 176.2-11.1 13.9-19.4 30.3-23.9 48.1-4.4 17.1 10.4 31.7 28.1 31.7l192 0c17.7 0 32.4-14.6 28.1-31.7-4.5-17.8-12.8-34.1-23.9-48.1 80.5-28.6 123.9-93.7 123.9-176.2 17.7 0 32-14.3 32-32s-14.3-32-32-32L32 192z"/>
    </svg>
  `,
  psicanalise: `
    <svg x="0" y="0" width="100" height="100" viewBox="0 0 512 512">
      <path fill="currentColor" stroke="none" d="M120 56c0-30.9 25.1-56 56-56l24 0c17.7 0 32 14.3 32 32l0 448c0 17.7-14.3 32-32 32l-32 0c-29.8 0-54.9-20.4-62-48-.7 0-1.3 0-2 0-44.2 0-80-35.8-80-80 0-18 6-34.6 16-48-19.4-14.6-32-37.8-32-64 0-30.9 17.6-57.8 43.2-71.1-7.1-12-11.2-26-11.2-40.9 0-44.2 35.8-80 80-80l0-24zm272 0l0 24c44.2 0 80 35.8 80 80 0 15-4.1 29-11.2 40.9 25.7 13.3 43.2 40.1 43.2 71.1 0 26.2-12.6 49.4-32 64 10 13.4 16 30 16 48 0 44.2-35.8 80-80 80-.7 0-1.3 0-2 0-7.1 27.6-32.2 48-62 48l-32 0c-17.7 0-32-14.3-32-32l0-448c0-17.7 14.3-32 32-32l24 0c30.9 0 56 25.1 56 56z"/>
    </svg>
  `,
  teoria_das_cordas: `
    <svg x="0" y="0" width="100" height="100" viewBox="0 0 512 512">
      <path fill="currentColor" stroke="none" d="M64 96c0-17.7 14.3-32 32-32l160 0c17.7 0 32 14.3 32 32l0 288 96 0 0-128c0-17.7 14.3-32 32-32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-32 0 0 128c0 17.7-14.3 32-32 32l-160 0c-17.7 0-32-14.3-32-32l0-288-96 0 0 128c0 17.7-14.3 32-32 32l-64 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l32 0 0-128z"/>
    </svg>
  `,
  materialismo_historico: `
    <svg x="0" y="0" width="100" height="100" viewBox="0 0 512 512">
      <path fill="currentColor" stroke="none" d="M32 32C14.3 32 0 46.3 0 64L0 432c0 26.5 21.5 48 48 48l416 0c26.5 0 48-21.5 48-48l0-279.8c0-18.2-19.4-29.7-35.4-21.1l-156.6 84.3 0-63.2c0-18.2-19.4-29.7-35.4-21.1L128 215.4 128 64c0-17.7-14.3-32-32-32L32 32z"/>
    </svg>
  `,
  matematica_contemporanea: `
    <svg x="0" y="0" width="100" height="100" viewBox="0 0 576 512">
      <path fill="currentColor" stroke="none" d="M282.6 78.1c8-27.3 33-46.1 61.4-46.1l200 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L344 96 238.7 457c-3.6 12.3-14.1 21.2-26.8 22.8s-25.1-4.6-31.5-15.6L77.6 288 32 288c-17.7 0-32-14.3-32-32s14.3-32 32-32l45.6 0c22.8 0 43.8 12.1 55.3 31.8l65.2 111.8 84.4-289.5zM393.4 233.4c12.5-12.5 32.8-12.5 45.3 0l41.4 41.4 41.4-41.4c12.5-12.5 32.8-12.5 45.3 0s12.5 32.8 0 45.3l-41.4 41.4 41.4 41.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0l-41.4-41.4-41.4 41.4c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l41.4-41.4-41.4-41.4c-12.5-12.5-12.5-32.8 0-45.3z"/>
    </svg>
  `,
  teoria_da_evolucao: `
    <svg x="0" y="0" width="100" height="100" viewBox="0 0 384 512">
      <path fill="currentColor" stroke="none" d="M352 0c17.7 0 32 14.3 32 32 0 57.8-24.4 104.8-57.4 144.5-24.1 28.9-53.8 55.1-83.6 79.5 29.8 24.5 59.5 50.6 83.6 79.5 33 39.6 57.4 86.7 57.4 144.5 0 17.7-14.3 32-32 32s-32-14.3-32-32L64 480c0 17.7-14.3 32-32 32S0 497.7 0 480C0 422.2 24.4 375.2 57.4 335.5 81.5 306.6 111.2 280.5 141 256 111.2 231.5 81.5 205.4 57.4 176.5 24.4 136.8 0 89.8 0 32 0 14.3 14.3 0 32 0S64 14.3 64 32l256 0c0-17.7 14.3-32 32-32zM283.5 384l-182.9 0c-8.2 10.5-15.1 21.1-20.6 32l224.2 0c-5.6-10.9-12.5-21.5-20.6-32zM238 336c-14.3-13-29.8-25.8-46-39-16.2 13.1-31.7 26-46 39l92 0zM100.5 128l182.9 0c8.2-10.5 15.1-21.1 20.6-32L79.9 96c5.6 10.9 12.5 21.5 20.6 32zM146 176c14.3 13 29.8 25.8 46 39 16.2-13.1 31.7-26 46-39l-92 0z"/>
    </svg>
  `,
  teoria_da_relatividade_geral: `
    <svg x="0" y="0" width="100" height="100" viewBox="0 0 448 512">
      <path fill="currentColor" stroke="none" d="M224 398.8c-11.8 5.1-23.4 9.7-34.9 13.5 16.7 33.8 31 35.7 34.9 35.7s18.1-1.9 34.9-35.7c-11.4-3.9-23.1-8.4-34.9-13.5zM414 256c33 45.2 44.3 90.9 23.6 128-20.2 36.3-62.5 49.3-115.2 43.2-22 52.1-55.7 84.8-98.4 84.8s-76.4-32.7-98.4-84.8C72.9 433.3 30.6 420.3 10.4 384-10.3 346.9 1 301.2 34 256 1 210.8-10.3 165.1 10.4 128 30.6 91.7 72.9 78.7 125.6 84.8 147.6 32.7 181.2 0 224 0s76.4 32.7 98.4 84.8c52.7-6.1 95 6.8 115.2 43.2 20.7 37.1 9.4 82.8-23.6 128zm-65.8 67.4c-1.7 14.2-3.9 28-6.7 41.2 31.8 1.4 38.6-8.7 40.2-11.7 2.3-4.2 7-17.9-11.9-48.1-6.8 6.3-14 12.5-21.6 18.6zm-6.7-175.9c2.8 13.1 5 26.9 6.7 41.2 7.6 6.1 14.8 12.3 21.6 18.6 18.9-30.2 14.2-44 11.9-48.1-1.6-2.9-8.4-13-40.2-11.7zM258.9 99.7C242.1 65.9 227.9 64 224 64s-18.1 1.9-34.9 35.7c11.4 3.9 23.1 8.4 34.9 13.5 11.8-5.1 23.4-9.7 34.9-13.5zm-159 88.9c1.7-14.3 3.9-28 6.7-41.2-31.8-1.4-38.6 8.7-40.2 11.7-2.3 4.2-7 17.9 11.9 48.1 6.8-6.3 14-12.5 21.6-18.6zM78.2 304.8c-18.9 30.2-14.2 44-11.9 48.1 1.6 2.9 8.4 13 40.2 11.7-2.8-13.1-5-26.9-6.7-41.2-7.6-6.1-14.8-12.3-21.6-18.6zM304 256a80 80 0 1 0 -160 0 80 80 0 1 0 160 0zm-80-32a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"/>
    </svg>
  `,
};
const DEFAULT_ICON = `
  <circle cx="50" cy="50" r="6" fill="currentColor" stroke="none"/>
  <ellipse cx="50" cy="50" rx="35" ry="14"/>
  <ellipse cx="50" cy="50" rx="35" ry="14" transform="rotate(60 50 50)"/>
  <ellipse cx="50" cy="50" rx="35" ry="14" transform="rotate(120 50 50)"/>
`;

const defs = svg.append("defs");
const noiseFilter = defs.append("filter")
  .attr("id", "noiseFilter");

noiseFilter.append("feTurbulence")
  .attr("type", "fractalNoise")
  .attr("baseFrequency", "0.45")
  .attr("numOctaves", "3")
  .attr("stitchTiles", "stitch");

noiseFilter.append("feColorMatrix")
  .attr("type", "matrix")
  .attr("values", "0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.38 0");

noiseFilter.append("feComposite")
  .attr("operator", "in")
  .attr("in2", "SourceGraphic");

const clipCircle = defs.append("clipPath").attr("id", "bubble-clip")
  .append("circle").attr("r", coreR - 2);

/* Icons are authored in a 0-100 box; this scale+translate centers that
   box on the bubble origin and shrinks it to fit inside the core circle.
   Recomputed per render since coreR shrinks with the container width. */
function iconTransform() {
  const iconScale = (coreR * 1.1) / 100;
  return `scale(${iconScale}) translate(-50,-50)`;
}

const gridG    = svg.append("g");
const bubblesG = svg.append("g");

function yScale() {
  return d3.scaleLinear().domain([0, 1]).range([H - bottomPad(), topPad()]);
}

/* Fraction of active philosophers who mark the theory as science. This must
   land on the same k/total grid as computeGridLines' divider lines, so a
   theory with k agreements sits exactly on its row instead of drifting
   between rows. */
function avgScore(theory) {
  const total = App.activePhils.size;
  if (total === 0) return 0;
  const agree = [...App.activePhils].filter(pk => theory.scores[pk] && theory.scores[pk].is_science).length;
  return agree / total;
}

function computeNodes() {
  getDims();
  const ys     = yScale();
  const usable = svgW - PAD.left - PAD.right;
  const cols   = App.theories.length;
  return App.theories.map((t, i) => {
    const x  = PAD.left + usable * (i + 0.5) / cols;
    const sc = avgScore(t);
    const y  = ys(sc);
    const rings = [...App.activePhils].map(pk => {
      const entry   = t.scores[pk];
      const hasEval = entry && entry.is_science !== null;
      const isS     = hasEval && entry.is_science;
      const phil    = philosopherByKey(pk);
      return {
        philKey:   pk,
        color:     hasEval ? (isS ? "var(--color-science)" : "var(--color-pseudoscience)") : "var(--text-light)",
        isScience: isS,
      };
    });
    return { ...t, x, y, avgScore: sc, rings };
  });
}

function computeGridLines() {
  const total = App.activePhils.size;
  const ys    = yScale();
  const lines = [];
  for (let i = total - 1; i >= 0; i--) {
    lines.push({ upper: i + 1, lower: i, total, y: ys((i + 0.5) / total) });
  }
  return lines;
}

function renderGridLines() {
  const lines = computeGridLines();
  const sel   = gridG.selectAll(".gridline").data(lines, d => d.key);
  const enter = sel.enter().append("g").attr("class", "gridline");
  enter.append("line");
  enter.merge(sel).select("line")
    .attr("x1", PAD.left).attr("x2", svgW - PAD.right)
    .attr("y1", d => d.y).attr("y2", d => d.y);
  sel.exit().remove();
}

function renderStatic() {
  svg.attr("width", svgW).attr("height", H);
  svg.select(".bg").attr("width", svgW).attr("height", H);
  svg.select(".bg-noise").attr("width", svgW).attr("height", H);
  clipCircle.attr("r", coreR - 2);
}

function ringColor(philKey, theoryId) {
  const theory = App.theories.find(t => t.id === theoryId);
  const entry  = theory && theory.scores[philKey];
  if (!entry || entry.is_science === null) return "var(--text-light)";
  return entry.is_science ? "var(--color-science)" : "var(--color-pseudoscience)";
}

function agreeLabel(d) {
  const total = App.activePhils.size;
  const agree = [...App.activePhils].filter(pk => d.scores[pk] && d.scores[pk].is_science).length;
  return `${agree}/${total} concordam que é ciência`;
}

function showTooltip(d, clientX, clientY, isLocked = false) {
  const rect       = vizContainer.getBoundingClientRect();
  const activeList = [...App.activePhils];
  const color      = d.avgScore >= App.threshold ? "var(--color-science)" : "var(--color-pseudoscience)";

  let html = "";
  if (isLocked) {
    html += `<button class="tip-close-btn" aria-label="Fechar" onclick="unlockTooltip()">&times;</button>`;
  }
  html += `<div class="tip-name" style="color:${color}">${d.label}</div>`;
  html += `<div style="font-size:12px;color:${color};margin-bottom:6px;font-weight:600">${agreeLabel(d)}</div>`;

  activeList.forEach(pk => {
    const phil    = philosopherByKey(pk);
    const entry   = d.scores[pk];
    const hasEval = entry && entry.is_science !== null;
    const isS     = hasEval && entry.is_science;
    const c       = hasEval ? (isS ? "var(--color-science)" : "var(--color-pseudoscience)") : "var(--text-muted)";
    const verdict = hasEval ? (isS ? "Ciência" : "Pseudociência") : "Não avaliado";
    const args    = (entry && entry.args) || [];
    html += `<div class="tip-block">
      <div class="tip-phil" style="color:${c}">
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;border:2px solid ${c};margin-right:6px;${!hasEval ? 'background-color:var(--text-muted);' : `background-color:${isS ? 'var(--color-science-bg)' : 'var(--color-pseudoscience-bg)'};`}"></span>
        ${phil.name} — ${verdict}
      </div>
      <ul>${args.map(a => `<li>${a}</li>`).join("")}</ul>
    </div>`;
  });

  tooltip.innerHTML = html;
  tooltip.style.display = "block";
  tooltip.style.pointerEvents = isLocked ? "auto" : "none";

  const tw = tooltip.offsetWidth;
  const th = tooltip.offsetHeight;

  let lft = clientX - rect.left + 18;
  if (lft + tw > rect.width - 8) lft = clientX - rect.left - tw - 18;
  lft = Math.max(8, Math.min(lft, rect.width - tw - 8));

  let top = clientY - rect.top - 20;
  if (top + th > rect.height - 8) top = rect.height - th - 8;
  top = Math.max(8, top);

  tooltip.style.left = (lft + vizContainer.scrollLeft) + "px";
  tooltip.style.top  = top + "px";
}

function renderBubbles(animated) {
  const nodes = computeNodes();
  const dur   = animated ? 800 : 0;
  const ease  = d3.easeCubicInOut;

  const sel = bubblesG.selectAll(".bubble").data(nodes, d => d.id);

  const enter = sel.enter().append("g").attr("class", "bubble")
    .attr("transform", d => `translate(${d.x},${d.y})`)
    .style("cursor", "pointer");

  enter.append("circle").attr("class", "core");
  enter.append("g").attr("clip-path", "url(#bubble-clip)")
    .append("g").attr("class", "btheme-icon");
  enter.append("text").attr("class", "blabel")
    .attr("text-anchor", "middle").attr("dominant-baseline", "hanging");

  enter.on("mousemove", function (event, d) {
    if (lockedNode && lockedNode.id === d.id) return;
    if (lockedNode && lockedNode.id !== d.id) {
      unlockTooltip();
    }
    showTooltip(d, event.clientX, event.clientY, false);
  }).on("mouseleave", function () {
    if (lockedNode) {
      showTooltip(lockedNode, lockedX, lockedY, true);
    } else {
      tooltip.style.display = "none";
      tooltip.style.pointerEvents = "none";
    }
  }).on("click", function (event, d) {
    event.stopPropagation();
    if (lockedNode && lockedNode.id === d.id) {
      unlockTooltip();
    } else {
      d3.selectAll(".bubble").classed("locked", false);
      lockedNode = d;
      lockedX = event.clientX;
      lockedY = event.clientY;
      d3.select(this).classed("locked", true);
      showTooltip(d, event.clientX, event.clientY, true);
    }
  });

  const merged = enter.merge(sel);

  merged.each(function (d) {
    const g        = d3.select(this);
    const philList = [...App.activePhils];

    g.selectAll(".aura-ring").remove();

    philList.forEach((pk, ri) => {
      const r = coreR + ringGap * (ri + 1);
      const c = ringColor(pk, d.id);
      g.insert("circle", ".core")
        .attr("class", "aura-ring")
        .attr("r", r).attr("fill", "none")
        .attr("stroke", c).attr("stroke-width", RING_W)
        .attr("opacity", 0.85);
    });

    g.select(".core").attr("r", coreR);

    g.select(".btheme-icon")
      .attr("transform", iconTransform())
      .html(THEORY_ICONS[d.id] || DEFAULT_ICON);

    const outerR  = coreR + ringGap * philList.length;
    const labelY  = outerR + LABEL_GAP;
    const font    = `600 ${LABEL_FS}px 'Inter', system-ui, sans-serif`;
    const lines   = wrapLabel(d.label, labelMaxW, font);
    
    const label = g.select(".blabel")
      .attr("font-size", LABEL_FS + "px")
      .attr("transform", `translate(0,${labelY})`);
    label.selectAll("tspan").remove();
    lines.forEach((line, i) => {
      label.append("tspan")
        .attr("x", 0)
        .attr("dy", i === 0 ? 0 : LABEL_FS * 1.15)
        .text(line);
    });
  });

  if (animated) {
    merged.transition().duration(dur).ease(ease)
      .attr("transform", d => `translate(${d.x},${d.y})`);
  } else {
    merged.attr("transform", d => `translate(${d.x},${d.y})`);
  }

  sel.exit().remove();
}

function renderAll(animated) {
  unlockTooltip();
  getDims();
  updateSizing();
  renderStatic();
  renderGridLines();
  renderBubbles(animated);
}

function init() {
  if (window.innerWidth <= 768) {
    document.getElementById("sidebar").classList.add("collapsed");
    document.getElementById("toggle-icon").style.transform = "rotate(180deg)";
  }
  renderAll(false);
  buildSidebarExamples();
}

window.addEventListener("resize", () => {
  if (App.theories.length === 0) return;
  renderAll(false);
});

window.AppChart = {
  init,
  handleResize: (animated) => renderAll(!!animated),
  onSelectionChange: () => {
    buildSidebarExamples();
    renderAll(true);
  },
};