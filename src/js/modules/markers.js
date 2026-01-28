let cannonConesEnabled = false;
let cannonCones = new Map(); // shipId => {left, right}
let visionCircle = null;
let visionLevel = 0; // 0 = nenhum | 1 = convés | 2 = mastro | 3 = luneta

var xMarkers = [];
var ships = [];


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

function updateVisionCircle(ship) {

    if (visionCircle) {
        visionCircle.remove();
        visionCircle = null;
    }

    if (visionLevel === 0) return;

    const radiusUnits = visionLevel * 0.7 * 8;

    visionCircle = L.circle(ship.marker.getLatLng(), {
        radius: radiusUnits,
        color: "white",
        fillColor: "white",
        fillOpacity: 0.2,
        weight: 1,
        interactive: false,
        pane: "shadowPane"
    }).addTo(map);
}


function createShip(latLng, map, angle = 0, isEnemy = false) {

    const ship = L.marker(latLng, {
        icon: boatMarker,
        draggable: false
    }).addTo(map);

    ship._angle = angle;
    ship._isEnemy = isEnemy;

    if (isEnemy) {
        ship._icon.classList.add("enemy-ship");
    }

    applyRotation(ship);
    enableShipControls(ship, map);

    ships.push(ship);

    return ship;
}

function addEnemyFromContext(e, map) {
    createShip(e.latlng, map, 0, true);
}




var boatMarker = L.icon({
    iconUrl: 'images/markers/boat_marker.png',
    iconSize:     [50, 59], // size of the icon
    iconAnchor:   [25, 29]
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


function enableShipControls(ship, map) {
	ship.on('click', function(e) {

		if (e.originalEvent.shiftKey && ship._isEnemy) {

			map.removeLayer(ship);
			ships = ships.filter(s => s !== ship);

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

			updateShipTrail(ship, to, map);
			updateCannonCones(ship);
			updateVisionCircle(playerShip);


		}


        if (rotating) {
            const center = ship.getLatLng();
            const angle = calculateAngle(center, e.latlng);
            ship._angle = angle;
            applyRotation(ship);
        }

    });

    map.on('mouseup', function() {
        dragging = false;
        rotating = false;
        map.dragging.enable();
    });
}


function updateCannonCones(ship) {

    if (!cannonConesEnabled) return;

    removeCannonCones(ship);

    const color = ship.isEnemy ? "rgba(255,255,0,0.5)" : "rgba(0,255,0,0.5)";

    const cones = createCannonCones(ship, map, color);

    cannonCones.set(ship.id, cones);
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
    ships.forEach(ship => map.removeLayer(ship));
    ships = [];
}

function addXmark(latLng, map) {
    var xMark = L.marker(latLng, {icon: xmarksspot, draggable: true}).addTo(map);
    xMark.on('dragend', function (e) {
        console.log('marker dragend event');
        setQstring();
    });
    xMarkers.push(xMark);
}

function clearXmarks(map) {
    xMarkers.forEach(function(mkr) {
        map.removeLayer(mkr);
    });
    xMarkers = [];
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
		ships.forEach(applyRotation);
    });
}

function addShipFromContext(e, map) {
    createShip(e.latlng, map, 0);
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

    const minDist = 1; // controle do espaçamento entre bolinhas

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

    const center = ship.marker.getLatLng();
    const angle = ship.angle; // rotação do navio em graus

    const length = 200;
    const width = 60;

    function makeCone(dir) {

        const baseAngle = angle + (dir * 90);

        const tip = center;

        const far = L.GeometryUtil.destination(
            tip,
            baseAngle,
            length
        );

        const left = L.GeometryUtil.destination(
            far,
            baseAngle + 90,
            width / 2
        );

        const right = L.GeometryUtil.destination(
            far,
            baseAngle - 90,
            width / 2
        );

        return L.polygon([
            tip,
            left,
            right
        ], {
            color: color,
            fillColor: color,
            fillOpacity: 0.5,
            weight: 0,
            interactive: false,
            pane: "shadowPane"
        }).addTo(map);
    }

    return {
        left: makeCone(-1),
        right: makeCone(1)
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
    setQstring,
	addShipFromContext,
	addEnemyFromContext
};
