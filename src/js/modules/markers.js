
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
    if(compMark) {
        map.removeLayer(compMark);
    }
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

};
