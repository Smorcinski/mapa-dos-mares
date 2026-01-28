let cannonConesEnabled = false;
let cannonCones = new Map(); // shipId => {left, right}

var xMarkers = [];
var ships = [];

// ids incrementais para identificar navios no painel
var shipIdCounter = 1;

// modo de exclusão pontual (apagar 1 navio / 1 marcador / 1 inimigo)
var deleteMode = false;


var markerIcons = {
    "throne_L" : {
        iconUrl: 'images/markers/throne_marker_l.png',
        iconSize:     [31, 40],
        iconAnchor:   [15, 40],
        popupAnchor:  [0, -40] 
    },

    "throne_S" : {
        iconUrl: 'images/markers/throne_marker_s.png',
        iconSize:     [31, 40],
        iconAnchor:   [15, 40],
        popupAnchor:  [0, -40]
    },

    "cargorun" : {
        iconUrl: 'images/markers/crate_marker.png',
        iconSize:     [31, 40], 
        iconAnchor:   [15, 40], 
        popupAnchor:  [0, -45] 
    },

    "beacon" : {
        iconUrl: 'images/markers/beacon_marker.png', 
        iconSize:     [31, 40], 
        iconAnchor:   [15, 40],
        popupAnchor:  [0, -45] 
    },

    "talltale" : {
        iconUrl: 'images/markers/tt_marker.png', 
        iconSize:     [31, 40], 
        iconAnchor:   [15, 40],
        popupAnchor:  [0, -45] 
    },

    "compass" : {
        iconUrl: 'images/markers/compass.png',   
        iconSize:     [50, 48], 
        iconAnchor:   [25, 24]
    },

    "boat" : {
        iconUrl: 'images/markers/boat_marker.png',
        iconSize:     [50, 59], 
        shadowSize:   [0, 0], 
        iconAnchor:   [25, 29]
    },

    "xmarksspot" : {
        iconUrl: 'images/markers/xmarkthespot_marker.png',
        iconSize:     [40, 52], 
        iconAnchor:   [20, 52]
    }

};



/*
var throne_L_icon = L.icon({
    iconUrl: 'images/markers/throne_marker_l.png',
    shadowUrl: 'images/markers/throne_marker_l.png',
    iconSize:     [31, 40],// size of the icon
    iconAnchor:   [15, 40], // point of the icon which will correspond to marker's location
    popupAnchor:  [0, -40] // point from which the popup should open relative to the iconAnchor
});

var throne_S_icon = L.icon({
    iconUrl: 'images/markers/throne_marker_s.png',
    shadowUrl: 'images/markers/throne_marker_s.png',
    iconSize:     [31, 40],// size of the icon
    iconAnchor:   [15, 40], // point of the icon which will correspond to marker's location
    popupAnchor:  [0, -40] // point from which the popup should open relative to the iconAnchor
});

var cargorun_icon = L.icon({
    iconUrl: 'images/markers/crate_marker.png',
    shadowUrl: 'images/markers/crate_marker.png',

    iconSize:     [31, 40], // size of the icon
    shadowSize:   [0, 0], // size of the shadow
    iconAnchor:   [15, 40], // point of the icon which will correspond to marker's location
    shadowAnchor: [0, 0],  // the same for the shadow
    popupAnchor:  [0, -45] // point from which the popup should open relative to the iconAnchor
});



var beacon_icon = L.icon({
    iconUrl: 'images/markers/beacon_marker.png',
    shadowUrl: 'images/markers/beacon_marker.png',

    iconSize:     [31, 40], // size of the icon
    shadowSize:   [0, 0], // size of the shadow
    iconAnchor:   [15, 40], // point of the icon which will correspond to marker's location
    shadowAnchor: [0, 0],  // the same for the shadow
    popupAnchor:  [-20, -45] // point from which the popup should open relative to the iconAnchor
});

var compass_marker = L.icon({
    iconUrl: 'images/markers/compass.png',
    shadowUrl: 'images/markers/compass.png',
    
    iconSize:     [50, 48], // size of the icon
    shadowSize:   [0, 0], // size of the shadow
    iconAnchor:   [25, 24], // point of the icon which will correspond to marker's location
    shadowAnchor: [0, 0],  // the same for the shadow
    popupAnchor:  [0, 0] // point from which the popup should open relative to the iconAnchor
});



var boatMarker = L.icon({
    iconUrl: 'images/markers/boat_marker.png',
    shadowUrl: 'images/markers/boat_marker.png',
    
    iconSize:     [50, 59], // size of the icon
    shadowSize:   [0, 0], // size of the shadow
    iconAnchor:   [25, 29], // point of the icon which will correspond to marker's location
    shadowAnchor: [0, 0],  // the same for the shadow
    popupAnchor:  [0, 0] // point from which the popup should open relative to the iconAnchor
});


var xmarksspot = L.icon({
    iconUrl: 'images/markers/xmarkthespot_marker.png',
    shadowUrl: 'images/markers/xmarkthespot_marker.png',
    
    iconSize:     [40, 52], // size of the icon
    shadowSize:   [0, 0], // size of the shadow
    iconAnchor:   [20, 52], // point of the icon which will correspond to marker's location
    shadowAnchor: [0, 0],  // the same for the shadow
    popupAnchor:  [0, 0] // point from which the popup should open relative to the iconAnchor
});
*/

function updateVisionCircle(ship, level, map) {

    if (ship._visionCircle) {
        map.removeLayer(ship._visionCircle);
        ship._visionCircle = null;
    }

    if (!level || level <= 0) return;

    // 0,7 quadrante por nível (Convés=0,7; Mastro=1,4; Luneta=2,1)
    // reduzido para 70% do tamanho atual
    const mult = ship && ship._sizeMultiplier ? ship._sizeMultiplier : 1;
    const radiusUnits = level * 0.7 * 8 * 0.7 * mult;

    ship._visionCircle = L.circle(ship.getLatLng(), {
        radius: radiusUnits,
        color: "white",
        fillColor: "white",
        fillOpacity: 0.2,
        weight: 1,
        interactive: false,
        pane: "shadowPane"
    }).addTo(map);
}


function createShip(latLng, map, angle = 0, isEnemy = false, options = {}) {
    const createPanel = options.createPanel !== false;
    const registerShip = options.registerShip !== false;
    const idOverride = (typeof options.idOverride !== "undefined") ? options.idOverride : null;

    const ship = L.marker(latLng, {
        icon: boatMarker,
        draggable: false
    }).addTo(map);

    // guarda metadados no próprio marker
    ship._angle = angle;
    ship._isEnemy = isEnemy;
    ship._id = (idOverride !== null ? idOverride : shipIdCounter++);
    ship._name = isEnemy ? `Inimigo ${ship._id}` : `Navio ${ship._id}`;
    ship._shipType = "bergantim";
    ship._sizeMultiplier = 1;
    ship._visionLevel = 0;
    ship._fogRadius = 0.7 * 8 * 0.7 * ship._sizeMultiplier; // mesmo tamanho do "Convés" (nível 1) atual

    if (isEnemy && ship._icon) {
        ship._icon.classList.add("enemy-ship");
    }

    applyRotation(ship);
    enableShipControls(ship, map);

    if (createPanel) {
        createShipPanel(ship, map);
    }

    if (registerShip) {
        ships.push(ship);
    }

    // aplica escala do ícone no zoom atual
    if (map) updateShipsIconScale(map);

    // descobre fog ao nascer
    if (typeof window.fogClearAt === "function") {
        window.fogClearAt(ship.getLatLng(), ship._fogRadius);
    }

    return ship;
}

function addEnemyFromContext(e, map) {
    return createShip(e.latlng, map, 0, true);
}

var boatMarker = L.icon({
    iconUrl: 'images/markers/bergantim_marker.png',
    iconSize:     [47, 90],
    iconAnchor:   [13, 40]
});

const SHIP_TYPES = {
    bote: { url: 'images/markers/bote_marker.png', size: [33.5, 40], anchor: [10, 20], mult: 0.4 },
    chalupa: { url: 'images/markers/chalupa_marker.png', size: [36.2, 60], anchor: [11, 26], mult: 0.7 },
    bergantim: { url: 'images/markers/bergantim_marker.png', size: [47.2, 90], anchor: [13, 40], mult: 1.0 },
    galeao: { url: 'images/markers/galeao_marker.png', size: [57.4, 140], anchor: [17, 62], mult: 1.2 }
};

function getShipIconForZoom(ship, leafletZoom, leafletMaxZoom = 7) {
    const cfg = (ship && ship._iconCfg) ? ship._iconCfg : SHIP_TYPES.bergantim;
    const stepsOut = Math.max(0, leafletMaxZoom - leafletZoom);
    const scale = 1 / Math.pow(2, stepsOut);

    const w = Math.max(1, Math.round(cfg.size[0] * scale));
    const h = Math.max(1, Math.round(cfg.size[1] * scale));
    const ax = Math.max(0, Math.round(cfg.anchor[0] * scale));
    const ay = Math.max(0, Math.round(cfg.anchor[1] * scale));

    return L.icon({
        iconUrl: cfg.url,
        iconSize: [w, h],
        iconAnchor: [ax, ay]
    });
}

function updateShipsIconScale(map) {
    const z = map.getZoom();
    const maxZ = (typeof map.getMaxZoom === "function" ? map.getMaxZoom() : 7) || 7;

    ships.forEach((ship) => {
        if (!ship) return;
        ship.setIcon(getShipIconForZoom(ship, z, maxZ));
        if (ship._isEnemy && ship._icon) ship._icon.classList.add("enemy-ship");
        applyRotation(ship);
    });
}

function setShipType(ship, type, map) {
    const cfg = SHIP_TYPES[type] || SHIP_TYPES.bergantim;
    ship._shipType = type in SHIP_TYPES ? type : "bergantim";
    ship._iconCfg = cfg;
    ship._sizeMultiplier = cfg.mult || 1;
    ship._fogRadius = 0.7 * 8 * 0.7 * ship._sizeMultiplier;

    if (map) {
        // atualiza ícone e escalas
        updateShipsIconScale(map);
        if (ship._visionLevel) updateVisionCircle(ship, ship._visionLevel, map);
        if (ship._cannonsEnabled) updateCannonCones(ship, map);
    }
}

function setShipName(ship, name) {
    const n = (name || "").trim();
    ship._name = n || ship._name;
    if (ship._panelEl) {
        const h = ship._panelEl.querySelector("h4");
        if (h) h.textContent = ship._name;
    }
}

function setShipCannonsEnabled(ship, enabled, map) {
    ship._cannonsEnabled = !!enabled;
    if (!map) return;
    if (ship._cannonsEnabled) updateCannonCones(ship, map);
    else removeCannonCones(ship);
}

function setShipVisionLevel(ship, level, map) {
    ship._visionLevel = level || 0;
    if (!map) return;
    updateVisionCircle(ship, ship._visionLevel, map);
}


var xmarksspot = L.icon({
    iconUrl: 'images/markers/xmarkthespot_marker.png',
    shadowUrl: 'images/markers/xmarkthespot_marker.png',
    
    iconSize:     [40, 52], // size of the icon
    shadowSize:   [0, 0], // size of the shadow
    iconAnchor:   [20, 52], // point of the icon which will correspond to marker's location
    shadowAnchor: [0, 0],  // the same for the shadow
    popupAnchor:  [0, 0] // point from which the popup should open relative to the iconAnchor
});


function createShipPanel(ship, map) {

    const panel = document.getElementById("ships-panel");
    if (!panel) return;

    const block = document.createElement("div");
    block.className = "ship-block " + (ship._isEnemy ? "enemy" : "ally");

    const title = document.createElement("h4");
    title.textContent = ship._name || (ship._isEnemy ? `Inimigo ${ship._id}` : `Navio ${ship._id}`);
    title.contentEditable = "true";
    title.spellcheck = false;
    title.onblur = () => setShipName(ship, title.textContent);
    block.appendChild(title);

    // tipo de navio
    const typeLabel = document.createElement("label");
    typeLabel.appendChild(document.createTextNode("Tipo"));
    block.appendChild(typeLabel);
    const typeSelect = document.createElement("select");
    typeSelect.innerHTML = `
        <option value="bote">Bote</option>
        <option value="chalupa">Chalupa</option>
        <option value="bergantim" selected>Bergantim</option>
        <option value="galeao">Galeão</option>
    `;
    typeSelect.value = ship._shipType || "bergantim";
    typeSelect.onchange = () => setShipType(ship, typeSelect.value, map);
    block.appendChild(typeSelect);

    // checkbox de canhões (para todos)
    const cannonsLabel = document.createElement("label");
    const cannonsInput = document.createElement("input");
    cannonsInput.type = "checkbox";
    cannonsInput.checked = false;
    cannonsLabel.appendChild(cannonsInput);
    cannonsLabel.appendChild(document.createTextNode("Alcance dos Canhões"));
    block.appendChild(cannonsLabel);

    cannonsInput.onchange = () => setShipCannonsEnabled(ship, cannonsInput.checked, map);

    // visão só para navios aliados
    if (!ship._isEnemy) {
        const deckLabel = document.createElement("label");
        const deckInput = document.createElement("input");
        deckInput.type = "checkbox";
        deckLabel.appendChild(deckInput);
        deckLabel.appendChild(document.createTextNode("Convés"));
        block.appendChild(deckLabel);

        const mastLabel = document.createElement("label");
        const mastInput = document.createElement("input");
        mastInput.type = "checkbox";
        mastLabel.appendChild(mastInput);
        mastLabel.appendChild(document.createTextNode("Mastro"));
        block.appendChild(mastLabel);

        const scopeLabel = document.createElement("label");
        const scopeInput = document.createElement("input");
        scopeInput.type = "checkbox";
        scopeLabel.appendChild(scopeInput);
        scopeLabel.appendChild(document.createTextNode("Luneta"));
        block.appendChild(scopeLabel);

        function syncVision() {
            let level = 0;
            if (deckInput.checked) level += 1;
            if (mastInput.checked) level += 1;
            if (scopeInput.checked) level += 1;
            setShipVisionLevel(ship, level, map);
        }

        deckInput.onchange = () => {
            if (!deckInput.checked) {
                mastInput.checked = false;
                scopeInput.checked = false;
            }
            syncVision();
        };

        mastInput.onchange = () => {
            if (mastInput.checked && !deckInput.checked) {
                deckInput.checked = true;
            }
            syncVision();
        };

        scopeInput.onchange = () => {
            if (scopeInput.checked && !deckInput.checked) {
                deckInput.checked = true;
            }
            syncVision();
        };

        ship._visionControls = { deckInput, mastInput, scopeInput };
    }

    // botão remover (extra, além dos modos de delete já existentes)
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remover navio";
    removeBtn.onclick = () => {
        removeShip(ship, map);
    };
    block.appendChild(removeBtn);

    ship._panelEl = block;

    panel.appendChild(block);
}


function removeShip(ship, map) {

    // remove rastro de bolinhas, se existir
    if (ship._trail && Array.isArray(ship._trail)) {
        ship._trail.forEach(dot => map.removeLayer(dot));
        ship._trail = [];
    }

    // remove cones de canhão, se estiverem ativos
    if (cannonCones && ship._id && cannonCones.has(ship._id)) {
        const cones = cannonCones.get(ship._id);
        if (cones.left) cones.left.remove();
        if (cones.right) cones.right.remove();
        cannonCones.delete(ship._id);
    }

    // remove círculos individuais de visão / canhão, se existirem
    if (ship._visionCircle) {
        map.removeLayer(ship._visionCircle);
        ship._visionCircle = null;
    }

    if (ship._cannonCircle) {
        map.removeLayer(ship._cannonCircle);
        ship._cannonCircle = null;
    }

    // remove painel lateral, se existir
    if (ship._panelEl && ship._panelEl.parentNode) {
        ship._panelEl.parentNode.removeChild(ship._panelEl);
        ship._panelEl = null;
    }

    map.removeLayer(ship);
    ships = ships.filter(s => s !== ship);
}


function enableShipControls(ship, map) {
	ship.on('click', function(e) {

        // modo de exclusão pontual: apaga somente este navio/inimigo
        if (deleteMode) {
            removeShip(ship, map);
            deleteMode = false;
            if (typeof window.clearPlacementMessage === 'function') window.clearPlacementMessage();
            return;
        }

	});


    let dragging = false;
    let rotating = false;

    ship.on('mousedown', function(e) {
        if (e.originalEvent.button === 0) {
            dragging = true;
            map.dragging.disable();
        }
    });

    ship.on('contextmenu', function(e) {
        e.originalEvent.preventDefault();
        rotating = true;
        map.dragging.disable();
    });

    map.on('mousemove', function(e) {

        if (dragging) {
			const from = ship.getLatLng();
			const to = e.latlng;

			ship.setLatLng(to);
			const angle = calculateAngle(from, to);
			ship._angle = angle;
			applyRotation(ship);

            if (ship._visionCircle) ship._visionCircle.setLatLng(to);
            if (ship._cannonsEnabled) updateCannonCones(ship, map);
            if (ship._fogRadius && typeof window.fogClearAt === "function") window.fogClearAt(to, ship._fogRadius);

			updateShipTrail(ship, to, map);
		}

        if (rotating) {
            const center = ship.getLatLng();
            const angle = calculateAngle(center, e.latlng);
            ship._angle = angle;
            applyRotation(ship);
            if (ship._cannonsEnabled) updateCannonCones(ship, map);
        }

    });

    map.on('mouseup', function() {
        dragging = false;
        rotating = false;
        map.dragging.enable();
    });
}


function removeCannonCones(ship) {
    if (!cannonCones || !ship._id || !cannonCones.has(ship._id)) return;
    const cones = cannonCones.get(ship._id);
    if (cones && cones.left) cones.left.remove();
    if (cones && cones.right) cones.right.remove();
    cannonCones.delete(ship._id);
}

function destinationPoint(latlng, bearingDeg, dist) {
    const r = bearingDeg * Math.PI / 180;
    return L.latLng(
        latlng.lat + dist * Math.cos(r),
        latlng.lng + dist * Math.sin(r)
    );
}

function updateCannonCones(ship, map) {

    if (!ship._cannonsEnabled) return;

    removeCannonCones(ship);

    const color = ship._isEnemy ? "rgba(255,255,0,0.5)" : "rgba(0,255,0,0.5)";

    const cones = createCannonCones(ship, map, color);

    cannonCones.set(ship._id, cones);
}


function calculateAngle(from, to) {
    const dx = to.lng - from.lng;
    const dy = to.lat - from.lat;

    const rad = Math.atan2(dx, dy);
    return rad * 180 / Math.PI;
}


//NOT USED?
function makeMarker(L, markerData, markerLayer) {

    var loc = markerData.loc;
    var size = markerData.isLarge ? " Large" : " Small";
    var title = markerData.title + size + " Skelton Throne";
    var mkr = markerData.isLarge ? throne_L_icon : throne_S_icon;

    console.log[loc];
    var marker = L.marker(loc, {  
        icon: mkr,
        title: title
    } 
    ).addTo(markerLayer)
    .bindPopup(markerData.desc);
}




function getMarker(markerData, mType) {
    var loc = markerData.loc;
    var mkr, title;

    if (mType == "throne") {
        var size = markerData.isLarge ? " Large" : " Small";
        title = markerData.title + size + " Skelton Throne";
        mkr = markerData.isLarge ? markerIcons["throne_L"] : markerIcons["throne_S"];
    } else if (mType =="cargo") {
        mkr = markerIcons["cargorun"];
        title = markerData.title + " | Cargo Run";
    } else if (mType == "beacon") {
        mkr = markerIcons["beacon"];
        title = markerData.title + " Beacon";
    } else if (mType == "talltale") {
        mkr = markerIcons["talltale"];
        title = markerData.title + " | TallTale";
    }


    var desc = markerData.desc;
    var classes = "markerIcon " + mType + " " + window.websafe(title);

    var marker = new L.Marker(loc, {
		icon: new L.DivIcon({
			className: classes,
            iconAnchor: mkr.iconAnchor,
            iconSize: null,
            popupAnchor: mkr.popupAnchor,
            html: '<img src="' + mkr.iconUrl + '" alt="">'
		})
    });

    var r = {"title" : title,
            "marker" : marker,
            "desc" : desc};

    return r;
}




function addComp(latLng, degs, map) {
    return createShip(latLng, map, degs);
}


function applyRotation(marker) {
    if (!marker || !marker._icon) return;

    const icon = marker._icon;
    icon.style.transformOrigin = "50% 50%";
    icon.style.transform = icon.style.transform.replace(/rotate\(.*?deg\)/, "");
    icon.style.transform += " rotate(" + marker._angle + "deg)";
}

function clearComp(map) {
    ships.forEach(ship => removeShip(ship, map));
    ships = [];
}

function addXmark(latLng, map) {
    var xMark = L.marker(latLng, {icon: xmarksspot, draggable: true}).addTo(map);
    xMark.on('dragend', function (e) {
        console.log('marker dragend event');
        setQstring();
    });

    // exclusão pontual: se estivermos em modo delete, apaga somente este marcador
    xMark.on('click', function(e) {
        if (!deleteMode) return;

        map.removeLayer(xMark);
        xMarkers = xMarkers.filter(m => m !== xMark);
        setQstring();
        deleteMode = false;
        if (typeof window.clearPlacementMessage === 'function') window.clearPlacementMessage();
    });

    xMarkers.push(xMark);
}

function clearXmarks(map) {
    xMarkers.forEach(function(mkr) {
        map.removeLayer(mkr);
    });
    xMarkers = [];
}

// ativado a partir da UI (botão "apagar seleção")
function enableDeleteMode() {
    deleteMode = true;
}

function setQstring() {
    var qS = getXstring();
    updateQueryStringParam("mkrs", qS);
}


function getXstring() {
    var xm = "";
    var one;
    xMarkers.forEach(function(element) {
        one = element.getLatLng().lat + "," + element.getLatLng().lng + ";";
        xm = xm + one; 
    });
    
    xm = window.encodeURIComponent(window.btoa(xm)); // encode a string
    return (xm);
}

function keepRotationOnZoom(map) {
    map.on('zoomend', function () {
        updateShipsIconScale(map);
		ships.forEach(applyRotation);
    });
}

function addShipFromContext(e, map) {
    return createShip(e.latlng, map, 0);
}

function createMainVesselFromContext(e, map) {
    return createShip(e.latlng, map, 0, false, { createPanel: false, idOverride: "MAIN" });
}

function createTrailDot(latLng, map, color) {
    return L.circleMarker(latLng, {
        radius: 5,
        color: color,
        fillColor: color,
        fillOpacity: 0.5,
        weight: 0,
        interactive: false,
        pane: "shadowPane" // garante que fique abaixo do navio
    }).addTo(map);
}

function distance(a, b) {
    const dx = a.lng - b.lng;
    const dy = a.lat - b.lat;
    return Math.sqrt(dx * dx + dy * dy);
}

function updateShipTrail(ship, latlng, map) {

    if (!ship._trail) ship._trail = [];
    if (!ship._lastTrailPos) ship._lastTrailPos = latlng;

    const minDist = 0.6; // controle do espaçamento entre bolinhas (ligeiramente mais próximas)

    if (distance(ship._lastTrailPos, latlng) < minDist) return;

    const color = ship._isEnemy ? "#ff0000" : "#0055ff";

    const dot = createTrailDot(latlng, map, color);

    ship._trail.push(dot);
    ship._lastTrailPos = latlng;

    if (ship._trail.length > 20) {
        const old = ship._trail.shift();
        map.removeLayer(old);
    }
}

function createCannonCones(ship, map, color) {

    const center = ship.getLatLng();
    const angle = ship._angle || 0; // proa do navio (graus)

    // raio = 0,5 quadrante (8 unidades por quadrante, como em routes.js)
    // reduzido para 70% do tamanho atual
    const mult = ship && ship._sizeMultiplier ? ship._sizeMultiplier : 1;
    const radius = 0.5 * 8 * 0.7 * mult;

    // fatia de 45° perpendicular à proa: esquerda = angle-90, direita = angle+90
    function makeSlice(centerAngle) {
        const a1 = (centerAngle - 22.5) * Math.PI / 180;
        const a2 = (centerAngle + 22.5) * Math.PI / 180;
        const p1 = L.latLng(center.lat + radius * Math.cos(a1), center.lng + radius * Math.sin(a1));
        const p2 = L.latLng(center.lat + radius * Math.cos(a2), center.lng + radius * Math.sin(a2));
        return L.polygon([center, p1, p2], {
            color: color,
            fillColor: color,
            fillOpacity: 0.5,
            weight: 1,
            interactive: false,
            pane: "shadowPane"
        }).addTo(map);
    }

    return {
        left: makeSlice(angle - 90),
        right: makeSlice(angle + 90)
    };
}


export {
    makeMarker,
    getMarker,
    xMarkers,
    addXmark,
    addComp,
    clearXmarks,
    clearComp,
	keepRotationOnZoom,
    updateShipsIconScale,
    setQstring,
	addShipFromContext,
	addEnemyFromContext,
    createMainVesselFromContext,
    setShipType,
    setShipName,
    setShipCannonsEnabled,
    setShipVisionLevel,
    enableDeleteMode,
    removeShip
};
