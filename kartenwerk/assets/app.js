(function () {
  "use strict";

  const DATA_URLS = {
    countries: "assets/data/ne_50m_admin_0_countries.geojson",
  };

  const MAPS = {
    germany: {
      label: "Deutschland",
      bounds: [5.45, 47.1, 15.55, 55.25],
      stage: { width: 760, height: 1000 },
      margin: 28,
      featureFilter: (feature) => feature.properties.ADM0_A3 === "DEU",
    },
    europe: {
      label: "Europa",
      bounds: [-13.5, 34, 41.5, 72],
      stage: { width: 1320, height: 900 },
      margin: 32,
      featureFilter: (feature) => (
        feature.properties.CONTINENT === "Europe"
        || ["TUR", "CYP"].includes(feature.properties.ADM0_A3)
      ),
    },
    africa: {
      label: "Afrika",
      bounds: [-19, -36, 53, 38],
      stage: { width: 900, height: 1000 },
      margin: 30,
      featureFilter: (feature) => feature.properties.CONTINENT === "Africa",
    },
    asia: {
      label: "Asien",
      projection: "natural",
      stage: { width: 1320, height: 900 },
      margin: 32,
      rotate: [-100, 0],
      featureFilter: (feature) => feature.properties.CONTINENT === "Asia",
    },
    "north-america": {
      label: "Nordamerika",
      projection: "natural",
      stage: { width: 1200, height: 900 },
      margin: 32,
      rotate: [100, 0],
      featureFilter: (feature) => feature.properties.CONTINENT === "North America",
    },
    "south-america": {
      label: "Südamerika",
      bounds: [-83, -56, -33, 14],
      stage: { width: 760, height: 1000 },
      margin: 30,
      featureFilter: (feature) => feature.properties.CONTINENT === "South America",
    },
    oceania: {
      label: "Ozeanien",
      bounds: [108, -50, 190, 12],
      stage: { width: 1100, height: 900 },
      margin: 32,
      rotate: [-160, 0],
      featureFilter: (feature) => (
        feature.properties.CONTINENT === "Oceania"
        || ["IDN", "TLS", "MYS", "BRN", "PHL"].includes(feature.properties.ADM0_A3)
      ),
    },
  };

  const GRIDS = {
    1: { columns: 2, rows: 2, label: "2 × 2" },
    2: { columns: 5, rows: 5, label: "5 × 5" },
    3: { columns: 10, rows: 10, label: "10 × 10" },
  };

  const ZOOM = { min: 0.8, max: 5, step: 0.2 };

  const elements = {
    svg: document.querySelector("[data-map-stage]"),
    stageFrame: document.querySelector(".stage-frame"),
    stageBackgrounds: Array.from(document.querySelectorAll("[data-stage-background]")),
    stageClip: document.querySelector("[data-stage-clip]"),
    zoomLayer: document.querySelector("[data-zoom-layer]"),
    countries: document.querySelector("[data-country-layer]"),
    grid: document.querySelector("[data-grid-layer]"),
    marker: document.querySelector("[data-marker-layer]"),
    loading: document.querySelector("[data-stage-loading]"),
    mapButtons: Array.from(document.querySelectorAll("[data-map]")),
    gridButtons: Array.from(document.querySelectorAll("[data-grid]")),
    zoomOut: document.querySelector("[data-zoom-out]"),
    zoomReset: document.querySelector("[data-zoom-reset]"),
    zoomIn: document.querySelector("[data-zoom-in]"),
    zoomValue: document.querySelector("[data-zoom-value]"),
    panReset: document.querySelector("[data-pan-reset]"),
    revealToggle: document.querySelector("[data-reveal-toggle]"),
    gridToggle: document.querySelector("[data-grid-toggle]"),
    placeName: document.querySelector("[data-place-name]"),
    answerCodes: Array.from(document.querySelectorAll("[data-answer-codes] dd")),
    selectedCell: document.querySelector("[data-selected-cell]"),
    exportPngButton: document.querySelector("[data-export-png]"),
    pngSize: document.querySelector("[data-png-size]"),
    actionFeedback: document.querySelector("[data-action-feedback]"),
    customName: document.querySelector("[data-custom-name]"),
    customLat: document.querySelector("[data-custom-lat]"),
    customLon: document.querySelector("[data-custom-lon]"),
    applyCustom: document.querySelector("[data-apply-custom]"),
  };

  const state = {
    map: "germany",
    grid: 1,
    zoom: 1,
    panX: 0,
    panY: 0,
    customPlace: null,
    reveal: false,
    gridVisible: true,
    selectedCell: "",
    countriesData: null,
    projection: null,
  };
  let panGesture = null;
  let suppressGridClick = false;

  function readUrlState() {
    const params = new URLSearchParams(window.location.search);
    if (MAPS[params.get("map")]) state.map = params.get("map");
    if (GRIDS[Number(params.get("grid"))]) state.grid = Number(params.get("grid"));
    if (params.get("raster") === "off") state.gridVisible = false;
    const zoom = Number(params.get("zoom"));
    if (Number.isFinite(zoom) && zoom >= ZOOM.min && zoom <= ZOOM.max) state.zoom = zoom;
    const panX = Number(params.get("panX"));
    const panY = Number(params.get("panY"));
    if (Number.isFinite(panX)) state.panX = panX;
    if (Number.isFinite(panY)) state.panY = panY;
  }

  function getCurrentPlace() {
    return state.customPlace;
  }

  function createBoundsFeature(bounds) {
    const [west, south, east, north] = bounds;
    return {
      type: "Polygon",
      coordinates: [[
        [west, south],
        [west, north],
        [east, north],
        [east, south],
        [west, south],
      ]],
    };
  }

  function getStageSize() {
    return MAPS[state.map].stage;
  }

  function getPngSize() {
    const stage = getStageSize();
    const scale = 3200 / Math.max(stage.width, stage.height);
    return {
      width: Math.round(stage.width * scale),
      height: Math.round(stage.height * scale),
    };
  }

  function clampPan() {
    const { width, height } = getStageSize();
    const maxX = width * Math.max(0, state.zoom - 1) / 2;
    const maxY = height * Math.max(0, state.zoom - 1) / 2;
    state.panX = Math.max(-maxX, Math.min(maxX, state.panX));
    state.panY = Math.max(-maxY, Math.min(maxY, state.panY));
  }

  function updateZoomTransform() {
    const { width, height } = getStageSize();
    elements.zoomLayer.setAttribute(
      "transform",
      `translate(${state.panX} ${state.panY}) translate(${width / 2} ${height / 2}) scale(${state.zoom}) translate(${-width / 2} ${-height / 2})`,
    );
  }

  function updateAxisLabelPositions() {
    const grid = GRIDS[state.grid];
    const { width, height } = getStageSize();
    const cellWidth = width / grid.columns;
    const cellHeight = height / grid.rows;
    const axisLabelSize = Math.max(15, Math.min(28, Math.min(cellWidth, cellHeight) * 0.19));
    const axisInset = Math.max(18, axisLabelSize * 0.9);
    const columnLabelY = (height / 2) + ((axisInset - state.panY - (height / 2)) / state.zoom);
    const rowLabelX = (width / 2) + ((axisInset - state.panX - (width / 2)) / state.zoom);

    elements.grid.querySelectorAll(".grid-axis-label--column").forEach((label) => {
      label.setAttribute("y", String(columnLabelY));
    });
    elements.grid.querySelectorAll(".grid-axis-label--row").forEach((label) => {
      label.setAttribute("x", String(rowLabelX));
    });
  }

  function updateStageGeometry() {
    const stage = getStageSize();
    const png = getPngSize();
    clampPan();

    elements.svg.setAttribute("viewBox", `0 0 ${stage.width} ${stage.height}`);
    elements.stageFrame.style.setProperty("--stage-ratio", String(stage.width / stage.height));
    elements.stageBackgrounds.forEach((background) => {
      background.setAttribute("width", String(stage.width));
      background.setAttribute("height", String(stage.height));
    });
    elements.stageClip.setAttribute("width", String(stage.width));
    elements.stageClip.setAttribute("height", String(stage.height));
    updateZoomTransform();
    elements.pngSize.textContent = `${png.width} × ${png.height}`;
  }

  function createProjection() {
    const mapConfig = MAPS[state.map];
    const { width, height } = getStageSize();
    const extent = [
      [mapConfig.margin, mapConfig.margin],
      [width - mapConfig.margin, height - mapConfig.margin],
    ];

    if (mapConfig.projection === "natural") {
      const land = {
        type: "FeatureCollection",
        features: state.countriesData.features.filter(mapConfig.featureFilter),
      };
      const projection = d3.geoNaturalEarth1();
      if (mapConfig.rotate) projection.rotate(mapConfig.rotate);
      return projection.fitExtent(extent, land);
    }

    const projection = d3.geoMercator();
    if (mapConfig.rotate) projection.rotate(mapConfig.rotate);
    projection.fitExtent(extent, createBoundsFeature(mapConfig.bounds));

    return projection;
  }

  function createSvgElement(name, attributes = {}) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, String(value)));
    return node;
  }

  function clearNode(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function renderGeography() {
    clearNode(elements.countries);
    state.projection = createProjection();
    const path = d3.geoPath(state.projection);
    const mapConfig = MAPS[state.map];
    const land = {
      type: "FeatureCollection",
      features: state.countriesData.features.filter(mapConfig.featureFilter),
    };
    elements.countries.appendChild(createSvgElement("path", {
      class: "country",
      d: path(land) || "",
    }));
  }

  function columnName(index) {
    return String.fromCharCode(65 + index);
  }

  function cellCode(columnIndex, rowIndex) {
    return `${columnName(columnIndex)}${rowIndex + 1}`;
  }

  function renderGrid() {
    clearNode(elements.grid);
    if (!state.gridVisible) return;
    const grid = GRIDS[state.grid];
    const { width, height } = getStageSize();
    const cellWidth = width / grid.columns;
    const cellHeight = height / grid.rows;
    const axisLabelSize = Math.max(15, Math.min(28, Math.min(cellWidth, cellHeight) * 0.19));
    const axisInset = Math.max(18, axisLabelSize * 0.9);
    const columnLabelY = (height / 2) + ((axisInset - state.panY - (height / 2)) / state.zoom);
    const rowLabelX = (width / 2) + ((axisInset - state.panX - (width / 2)) / state.zoom);

    for (let row = 0; row < grid.rows; row += 1) {
      for (let column = 0; column < grid.columns; column += 1) {
        const code = cellCode(column, row);
        const rect = createSvgElement("rect", {
          class: `grid-cell${state.selectedCell === code ? " is-selected" : ""}`,
          x: column * cellWidth,
          y: row * cellHeight,
          width: cellWidth,
          height: cellHeight,
          "data-cell-code": code,
          "aria-label": `Feld ${code}`,
        });
        rect.addEventListener("click", () => {
          if (suppressGridClick) {
            suppressGridClick = false;
            return;
          }
          state.selectedCell = code;
          elements.selectedCell.textContent = code;
          renderGrid();
        });
        elements.grid.appendChild(rect);
      }
    }

    for (let column = 0; column < grid.columns; column += 1) {
      const label = createSvgElement("text", {
        class: "grid-axis-label grid-axis-label--column",
        x: (column + 0.5) * cellWidth,
        y: columnLabelY,
        "font-size": axisLabelSize / state.zoom,
      });
      label.textContent = columnName(column);
      elements.grid.appendChild(label);
    }

    for (let row = 0; row < grid.rows; row += 1) {
      const label = createSvgElement("text", {
        class: "grid-axis-label grid-axis-label--row",
        x: rowLabelX,
        y: (row + 0.5) * cellHeight,
        "font-size": axisLabelSize / state.zoom,
      });
      label.textContent = String(row + 1);
      elements.grid.appendChild(label);
    }
  }

  function getCellForPoint(point, level) {
    if (!point || !GRIDS[level]) return "außerhalb";
    const [x, y] = point;
    const { width, height } = getStageSize();
    if (x < 0 || x >= width || y < 0 || y >= height) return "außerhalb";
    const grid = GRIDS[level];
    const column = Math.min(grid.columns - 1, Math.floor(x / (width / grid.columns)));
    const row = Math.min(grid.rows - 1, Math.floor(y / (height / grid.rows)));
    return cellCode(column, row);
  }

  function renderMarker() {
    clearNode(elements.marker);
    const place = getCurrentPlace();
    if (!place || !state.projection) {
      elements.marker.classList.add("is-hidden");
      return;
    }

    const point = state.projection([place.lon, place.lat]);
    if (!point || point.some((value) => !Number.isFinite(value))) {
      elements.marker.classList.add("is-hidden");
      return;
    }

    const [x, y] = point;
    const labelWidth = Math.max(150, Math.min(330, place.name.length * 17 + 44));
    const labelY = Math.max(48, y - 72);
    const group = createSvgElement("g", { transform: `translate(${x} ${y})` });
    group.append(
      createSvgElement("circle", { class: "marker-ring", r: 34 }),
      createSvgElement("circle", { class: "marker-core", r: 17 }),
      createSvgElement("path", { class: "marker-crosshair", d: "M-46 0H-27M27 0H46M0-46V-27M0 27V46" }),
    );

    const labelGroup = createSvgElement("g", { transform: `translate(0 ${labelY - y})` });
    labelGroup.append(
      createSvgElement("rect", {
        class: "marker-label-bg",
        x: -labelWidth / 2,
        y: -23,
        width: labelWidth,
        height: 46,
        rx: 6,
      }),
    );
    const label = createSvgElement("text", { class: "marker-label", x: 0, y: 1 });
    label.textContent = place.name;
    labelGroup.appendChild(label);
    group.appendChild(labelGroup);
    elements.marker.appendChild(group);
    elements.marker.classList.toggle("is-hidden", !state.reveal);
  }

  function renderAnswers() {
    const place = getCurrentPlace();
    elements.placeName.textContent = place ? place.name : "–";
    if (!place || !state.projection) {
      elements.answerCodes.forEach((node) => { node.textContent = "–"; });
      return;
    }

    const point = state.projection([place.lon, place.lat]);
    [1, 2, 3].forEach((level, index) => {
      elements.answerCodes[index].textContent = getCellForPoint(point, level);
    });
  }

  function updateControls() {
    elements.mapButtons.forEach((button) => {
      const active = button.dataset.map === state.map;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    elements.gridButtons.forEach((button) => {
      const active = Number(button.dataset.grid) === state.grid;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    elements.revealToggle.checked = state.reveal;
    elements.gridToggle.checked = state.gridVisible;
    elements.zoomValue.textContent = `${Math.round(state.zoom * 100)} %`;
    elements.zoomOut.disabled = state.zoom <= ZOOM.min;
    elements.zoomIn.disabled = state.zoom >= ZOOM.max;
    elements.panReset.disabled = state.panX === 0 && state.panY === 0;
    elements.svg.classList.toggle("is-pannable", state.zoom > 1);
  }

  function updateUrl() {
    const params = new URLSearchParams();
    params.set("map", state.map);
    params.set("grid", String(state.grid));
    if (!state.gridVisible) params.set("raster", "off");
    if (state.zoom !== 1) params.set("zoom", String(state.zoom));
    if (state.panX !== 0) params.set("panX", String(Math.round(state.panX * 10) / 10));
    if (state.panY !== 0) params.set("panY", String(Math.round(state.panY * 10) / 10));
    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
  }

  function render() {
    updateStageGeometry();
    updateControls();
    renderGeography();
    renderGrid();
    renderMarker();
    renderAnswers();
    updateUrl();
  }

  function setFeedback(message) {
    elements.actionFeedback.textContent = message;
    window.clearTimeout(setFeedback.timeoutId);
    setFeedback.timeoutId = window.setTimeout(() => {
      elements.actionFeedback.textContent = "";
    }, 3500);
  }

  function sanitizeFilename(value) {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function exportFilename(extension) {
    const place = getCurrentPlace();
    const parts = [
      "schiffe-versenken",
      MAPS[state.map].label,
      state.gridVisible
        ? `raster-${GRIDS[state.grid].columns}x${GRIDS[state.grid].rows}`
        : "ohne-raster",
      state.reveal && place ? place.name : "spielansicht",
    ];
    return `${sanitizeFilename(parts.join("-"))}.${extension}`;
  }

  function cloneSvgWithInlineStyles() {
    const clone = elements.svg.cloneNode(true);
    const sourceNodes = [elements.svg, ...elements.svg.querySelectorAll("*")];
    const cloneNodes = [clone, ...clone.querySelectorAll("*")];
    const properties = [
      "fill",
      "stroke",
      "stroke-width",
      "stroke-dasharray",
      "stroke-linecap",
      "stroke-linejoin",
      "opacity",
      "display",
      "font-family",
      "font-size",
      "font-weight",
      "text-anchor",
      "dominant-baseline",
      "paint-order",
    ];

    sourceNodes.forEach((source, index) => {
      const computed = window.getComputedStyle(source);
      const target = cloneNodes[index];
      const declarations = properties
        .map((property) => `${property}:${computed.getPropertyValue(property)}`)
        .join(";");
      target.setAttribute("style", declarations);
    });

    const { width, height } = getStageSize();
    clone.setAttribute("width", String(width));
    clone.setAttribute("height", String(height));
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    return clone;
  }

  function serializeSvg() {
    const clone = cloneSvgWithInlineStyles();
    return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}`;
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportPng() {
    const svgBlob = new Blob([serializeSvg()], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const png = getPngSize();
      canvas.width = png.width;
      canvas.height = png.height;
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (!blob) {
          setFeedback("PNG konnte nicht erzeugt werden.");
          return;
        }
        downloadBlob(blob, exportFilename("png"));
        setFeedback(`PNG wurde in ${png.width} × ${png.height} exportiert.`);
      }, "image/png");
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      setFeedback("PNG konnte nicht erzeugt werden.");
    };
    image.src = url;
  }

  function setZoom(value) {
    const clamped = Math.min(ZOOM.max, Math.max(ZOOM.min, value));
    state.zoom = Math.round(clamped * 10) / 10;
    render();
  }

  function setPan(x, y, updateHistory = false) {
    state.panX = x;
    state.panY = y;
    clampPan();
    updateZoomTransform();
    updateAxisLabelPositions();
    elements.panReset.disabled = state.panX === 0 && state.panY === 0;
    if (updateHistory) updateUrl();
  }

  function beginPan(event) {
    if (state.zoom <= 1 || (event.pointerType === "mouse" && event.button !== 0)) return;
    panGesture = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      panX: state.panX,
      panY: state.panY,
      moved: false,
    };
    elements.svg.setPointerCapture(event.pointerId);
    elements.svg.classList.add("is-panning");
  }

  function movePan(event) {
    if (!panGesture || event.pointerId !== panGesture.pointerId) return;
    const rect = elements.svg.getBoundingClientRect();
    const stage = getStageSize();
    const deltaX = (event.clientX - panGesture.startX) * (stage.width / rect.width);
    const deltaY = (event.clientY - panGesture.startY) * (stage.height / rect.height);
    if (Math.hypot(deltaX, deltaY) > 4) panGesture.moved = true;
    setPan(panGesture.panX + deltaX, panGesture.panY + deltaY);
    event.preventDefault();
  }

  function finishPan(event) {
    if (!panGesture || event.pointerId !== panGesture.pointerId) return;
    const moved = panGesture.moved;
    panGesture = null;
    elements.svg.classList.remove("is-panning");
    if (elements.svg.hasPointerCapture(event.pointerId)) {
      elements.svg.releasePointerCapture(event.pointerId);
    }
    if (moved) {
      suppressGridClick = true;
      window.setTimeout(() => { suppressGridClick = false; }, 0);
    }
    updateUrl();
  }

  function applyCustomPlace() {
    const name = elements.customName.value.trim() || "Zielpunkt";
    const lat = Number(elements.customLat.value);
    const lon = Number(elements.customLon.value);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setFeedback("Bitte gültige Breiten- und Längengrade eingeben.");
      return;
    }
    state.customPlace = {
      id: "custom",
      name,
      lat,
      lon,
    };
    render();
    setFeedback("Koordinaten wurden übernommen.");
  }

  function bindEvents() {
    elements.mapButtons.forEach((button) => {
      button.addEventListener("click", () => {
        state.map = button.dataset.map;
        state.panX = 0;
        state.panY = 0;
        state.selectedCell = "";
        elements.selectedCell.textContent = "keins";
        render();
      });
    });

    elements.gridButtons.forEach((button) => {
      button.addEventListener("click", () => {
        state.grid = Number(button.dataset.grid);
        state.selectedCell = "";
        elements.selectedCell.textContent = "keins";
        render();
      });
    });

    elements.revealToggle.addEventListener("change", () => {
      state.reveal = elements.revealToggle.checked;
      renderMarker();
    });

    elements.gridToggle.addEventListener("change", () => {
      state.gridVisible = elements.gridToggle.checked;
      render();
    });

    elements.zoomOut.addEventListener("click", () => setZoom(state.zoom - ZOOM.step));
    elements.zoomReset.addEventListener("click", () => setZoom(1));
    elements.zoomIn.addEventListener("click", () => setZoom(state.zoom + ZOOM.step));
    elements.panReset.addEventListener("click", () => setPan(0, 0, true));
    elements.svg.addEventListener("pointerdown", beginPan);
    elements.svg.addEventListener("pointermove", movePan);
    elements.svg.addEventListener("pointerup", finishPan);
    elements.svg.addEventListener("pointercancel", finishPan);
    elements.exportPngButton.addEventListener("click", exportPng);
    elements.applyCustom.addEventListener("click", applyCustomPlace);
  }

  async function loadData() {
    try {
      const countriesResponse = await fetch(DATA_URLS.countries);
      if (!countriesResponse.ok) throw new Error("Kartendaten nicht erreichbar");
      state.countriesData = await countriesResponse.json();
      elements.loading.hidden = true;
      render();
    } catch (error) {
      elements.loading.querySelector("p").textContent = "Kartendaten konnten nicht geladen werden";
    }
  }

  readUrlState();
  bindEvents();
  updateControls();
  loadData();
})();
