import * as island_data from './modules/island_data.js';
import * as throne_data from './modules/throne_data.js';
import * as beacon_data from './modules/beacon_data.js';
import * as cargorun_data from './modules/crates_data.js';
import * as places_data from './modules/places_data.js';
import * as tools from './modules/tools.js';
import * as data_out from './modules/data_output.js';
import * as mF from './modules/markers.js';
import * as pList from './modules/place_list.js';
import * as routes from './modules/routes.js';


var layerArray = [];


// TODO: LOCALIZE
//var lang = window.location.pathname.substr(1);
//console.log("language: " + lang);

var islands = island_data.islands;
var thrones = throne_data.thrones;
var beacons = beacon_data.beacons;
var cargoruns = cargorun_data.cargoruns;
var places = places_data.places;

function compare(a, b){
    const nameA = a.title.replace(/the /gi, '').toUpperCase();
    const nameB = b.title.replace(/the /gi, '').toUpperCase();
    if (nameA > nameB) return 1;
    if (nameB > nameA) return -1;
  
    return 0;
  }

islands.sort(compare);
thrones.sort(compare);


//var isOnline = pwa.isOnline;
var isDev = false;

var currentSearchIsland = -1;
var compassDragStart = null;
var compassDragging = false;

// modo de posicionamento via clique no mapa
// valores possíveis: null | 'ship' | 'enemy' | 'marker'
var pendingPlacement = null;

// contador para nomear navios / inimigos nos painéis
var shipCounter = 0;

// referência especial para a embarcação principal (painel dedicado)
var mainVesselShip = null;



//console.log("-- detect isOnline: " + isOnline);

var cdnpath = "";
if (location.hostname != "localhost") {
    cdnpath = "https://cdn.chenzorama.com/";
}

/* 
 * Workaround for 1px lines appearing in some browsers due to fractional transforms
 * and resulting anti-aliasing.
 * https://github.com/Leaflet/Leaflet/issues/3575
 */
(function(){
    var originalInitTile = L.GridLayer.prototype._initTile;
    L.GridLayer.include({
        _initTile: function (tile) {
            originalInitTile.call(this, tile);

            var tileSize = this.getTileSize();

            tile.style.width = tileSize.x + 1 + 'px';
            tile.style.height = tileSize.y + 1 + 'px';
        }
    });
})();


var map = L.map("mapid", {
    maxZoom: 7,
    minZoom: 2,
    crs: L.CRS.Simple,
    attributionControl: false,
    preferCanvas: false,
    maxBoundsViscosity: 1,
    zoomControl: false


}).setView([70, 70], 4);

routes.attachRouteDrawingEvents(map);

L.control.zoom({ position: 'bottomright' }).addTo(map);

// Indicador de zoom (escala 1..6): 1 = mais perto (zoom máximo), 6 = mais distante (zoom mínimo)
const zoomLevelControl = L.control({ position: 'bottomright' });
zoomLevelControl.onAdd = function (map) {
    const div = L.DomUtil.create('div', 'leaflet-control leaflet-control-zoom-level');
    L.DomEvent.disableClickPropagation(div);

    function render() {
        const z = map.getZoom();
        const maxZ = (typeof map.getMaxZoom === "function" ? map.getMaxZoom() : 7) || 7;
        const minZ = (typeof map.getMinZoom === "function" ? map.getMinZoom() : 2) || 2;
        const totalLevels = (maxZ - minZ) + 1; // aqui: 6
        const level = (maxZ - z) + 1; // z=maxZ => 1
        div.innerHTML = `Zoom ${level}/${totalLevels}`;
    }

    render();
    map.on('zoomend', render);
    return div;
};
zoomLevelControl.addTo(map);

mF.keepRotationOnZoom(map);

var height = 25522;
var width = 27444;
var bounds = new L.LatLngBounds(map.unproject([0, height], 7), map.unproject([width, 0], 7));
map.setMaxBounds(bounds, {padding: [600,600]});

//map.fitBounds(bounds, {padding: [600,600]})
var hash = new L.Hash(map);

var layer = L.tileLayer(cdnpath + "images/tiles/v3.6/{z}/{x}/{y}.png", {
    minZoom: 2,
    maxZoom: 7,
    bounds: bounds,
    noWrap: !0,
    tms: !1
}).addTo(map);

// =========================
// FOG OF WAR (Descoberta)
// =========================
map.createPane('fogPane');
map.getPane('fogPane').style.zIndex = 450; // acima do tile, abaixo de markers

var fogLayer = L.layerGroup().addTo(map);
var fogCells = new Map(); // "A1" => L.rectangle
var fogDiscovered = new Set(); // "A1"
var fogCellCenters = new Map(); // "A1" => {lat,lng}

// Tabelas compatíveis com o graticule (L.SimpleGraticule-sot.js)
var LETTER_X = {
    A:0,B:8,C:16,D:24,E:32,F:41,G:49,H:57,I:65,J:73,K:82,L:90,M:98,N:106,O:114,P:123,Q:131,R:139,S:147,T:155,U:164,V:172,W:180,X:188,Y:196,Z:205
};
var NUMBER_Y = {
    1:0,2:-8,3:-16,4:-24,5:-31,6:-39,7:-47,8:-54,9:-62,10:-70,11:-77,12:-85,13:-93,14:-101,15:-108,16:-116,17:-124,18:-131,19:-139,20:-147,21:-154,22:-162,23:-170,24:-178,25:-185,26:-193
};

function normalizeCoord(raw) {
    if (!raw) return null;
    var s = String(raw).trim().toUpperCase();
    var m = s.match(/^([A-Z])\s*(\d{1,2})$/);
    if (!m) return null;
    var letter = m[1];
    var num = parseInt(m[2], 10);
    if (!LETTER_X[letter]) {
        if (letter !== 'A') return null; // A é 0 (falsy)
    }
    if (!NUMBER_Y.hasOwnProperty(num)) return null;
    return letter + String(num);
}

function buildFogGrid() {
    // cria retângulos só dentro de um range razoável (A..Z, 1..26)
    Object.keys(LETTER_X).forEach(function(letter) {
        Object.keys(NUMBER_Y).forEach(function(nStr) {
            var n = parseInt(nStr, 10);
            var key = letter + String(n);
            var x0 = LETTER_X[letter];
            var y0 = NUMBER_Y[n];
            var x1 = x0 + 8;
            var y1 = y0 - 8;
            var rect = L.rectangle([[y0, x0], [y1, x1]], {
                stroke: false,
                fillColor: "#9aa0a6",
                fillOpacity: 0.65,
                interactive: false,
                pane: "fogPane"
            });
            fogCells.set(key, rect);
            fogCellCenters.set(key, { lat: (y0 + y1) / 2, lng: (x0 + x1) / 2 });
            fogLayer.addLayer(rect);
        });
    });
}

function fogSetCellDiscovered(key, discovered) {
    var rect = fogCells.get(key);
    if (!rect) return;
    if (discovered) {
        if (fogDiscovered.has(key)) return;
        fogDiscovered.add(key);
        fogLayer.removeLayer(rect);
    } else {
        if (!fogDiscovered.has(key)) return;
        fogDiscovered.delete(key);
        fogLayer.addLayer(rect);
    }
}

window.fogToggleCell = function(rawCoord, discover) {
    var key = normalizeCoord(rawCoord);
    if (!key) {
        showPopup("Coordenada inválida. Ex: A1, F20");
        return;
    }
    fogSetCellDiscovered(key, !!discover);
};

window.fogClearAt = function(latlng, radius) {
    if (!latlng || !radius) return;
    var r2 = radius * radius;
    fogCellCenters.forEach(function(center, key) {
        if (fogDiscovered.has(key)) return;
        var dx = center.lng - latlng.lng;
        var dy = center.lat - latlng.lat;
        if ((dx * dx + dy * dy) <= r2) {
            fogSetCellDiscovered(key, true);
        }
    });
};

buildFogGrid();




function onMapClick(e) {
    console.log("You clicked the map at " + e.latlng);

    if (pendingPlacement === 'marker') {
        mF.addXmark(e.latlng, map);
        mF.setQstring();
        pendingPlacement = null;
        hidePopup();
        return;
    }

    if (pendingPlacement === 'ship') {
        mF.addShipFromContext({ latlng: e.latlng }, map);
        pendingPlacement = null;
        hidePopup();
        return;
    }

    if (pendingPlacement === 'enemy') {
        mF.addEnemyFromContext({ latlng: e.latlng }, map);
        pendingPlacement = null;
        hidePopup();
        return;
    }

    if (pendingPlacement === 'mainShip') {
        var titleEl = document.getElementById("main-vessel-title");
        var name = titleEl && titleEl.textContent.trim() ? titleEl.textContent.trim() : "Embarcação";

        if (mainVesselShip) {
            mainVesselShip.setLatLng(e.latlng);
            if (!map.hasLayer(mainVesselShip)) mainVesselShip.addTo(map);
        } else {
            mainVesselShip = mF.createMainVesselFromContext({ latlng: e.latlng }, map);
        }

        // habilita opções quando posicionada
        enableMainVesselControls(true);

        updateMainVesselButtons(name, true);

        pendingPlacement = null;
        hidePopup();
        return;
    }
}

map.on('click', onMapClick);

map.on('mousedown', function(e) {
    if (e.originalEvent.button === 2 && e.originalEvent.shiftKey) {
        compassDragging = true;
        compassDragStart = e.latlng;
        map.dragging.disable();
    }
});

map.on('mousemove', function(e) {
    if (!compassDragging || !compassDragStart) return;

    var deg = window.angle360(
        compassDragStart.lat,
        compassDragStart.lng,
        e.latlng.lat,
        e.latlng.lng
    );

    mF.clearComp(map);
    mF.addComp(compassDragStart, deg, map);
});

map.on('mouseup', function(e) {
    if (compassDragging) {
        compassDragging = false;
        compassDragStart = null;
        map.dragging.enable();
    }
});



var markersLayer = new L.LayerGroup();
map.addLayer(markersLayer);

var islandsLayer = new L.LayerGroup();
layerArray.push(['islands', islandsLayer]);
map.addLayer(islandsLayer);

var chickensLayer = new L.LayerGroup();
layerArray.push(['chickens', chickensLayer]);

var snakesLayer = new L.LayerGroup();
layerArray.push(['snakes', snakesLayer]);

var pigsLayer = new L.LayerGroup();
layerArray.push(['pigs', pigsLayer]);




/* customCircleMarker = L.CircleMarker.extend({
    options: { 
       someCustomProperty: 'Custom data!',
       anotherCustomProperty: 'More data!'
    }
 }); */

 //use circlemarker?

var chicken_marker = L.icon({
    iconUrl: 'images/markers/chicken_marker.png',
    shadowUrl: 'images/markers/chicken_marker.png',

    iconSize:     [30, 30], // size of the icon
    shadowSize:   [0, 0], // size of the shadow
    iconAnchor:   [0, 30], // point of the icon which will correspond to marker's location
    shadowAnchor: [0, 0],  // the same for the shadow
    popupAnchor:  [0, 0] // point from which the popup should open relative to the iconAnchor
});


var snake_marker = L.icon({
    iconUrl: 'images/markers/snake_marker.png',
    shadowUrl: 'images/markers/snake_marker.png',

    iconSize:     [30, 30], // size of the icon
    shadowSize:   [0, 0], // size of the shadow
    iconAnchor:   [30, 30], // point of the icon which will correspond to marker's location
    shadowAnchor: [0, 0],  // the same for the shadow
    popupAnchor:  [0, 0] // point from which the popup should open relative to the iconAnchor
});
var pig_marker = L.icon({
    iconUrl: 'images/markers/pig_marker.png',
    shadowUrl: 'images/markers/pig_marker.png',

    iconSize:     [30, 30], // size of the icon
    shadowSize:   [0, 0], // size of the shadow
    iconAnchor:   [30, 0], // point of the icon which will correspond to marker's location
    shadowAnchor: [0, 0],  // the same for the shadow
    popupAnchor:  [0, 0] // point from which the popup should open relative to the iconAnchor
});


//Probably don't need to do this anymore, since it'll take watever params at this point
L.islandCircle = L.Circle.extend({
    options: { 
       name: 'islandName',
       json: {}
    }
 })


 /* ALEXA DATA */
//data_out.alexa_output(islands);
/* ALEXA DATA */

var island_markers = [];
for(var i in islands) {
    var islandName = islands[i].title;
    var cRad = islands[i].radius;

    var classes = "islandClass " + window.websafe(islandName);
    var circle = new L.islandCircle(islands[i].loc, {
        //color: 'red',
        strokeweight: 1,
        opacity: 0,
        color: '#fff',
        fillColor: '#fff',
        fillOpacity: 0,
        radius: cRad,
        className: classes,
        name: islandName,
        title: islandName,
        json: islands[i]
    });

    pList.addPlaceToList("island", islandName, classes, islands[i]);
	
    var textLoc = modifyLoc(islands[i].loc, (cRad + (cRad * 0.1)), (0));
	var islandMarker = new L.Marker(textLoc, {
		icon: new L.DivIcon({
			className: 'title-location',
            iconAnchor:   [0, 0],
            iconSize: null,
			html: '<span class="my-div-span" data-anchor-x="0">'+islands[i].title+'</span>'
		})
    }).addTo(islandsLayer);
    /*
	islandMarker.bindPopup('<div class="lf-popup">'+
							'<img src="images/screenshots/small/'+((typeof islands[i].img != 'undefined')?islands[i].img :'bientot.jpg')+'" />'+
							'<span class="popup-title-island">'+islands[i].title+'</span>'+
							'<span class="popup-type-island">'+islands[i].type+'</span>'+
							'<span class="popup-img-island hiddenDiv">'+((typeof islands[i].img != 'undefined')?islands[i].img :'bientot.jpg')+'</span>'+
							'<span class="popup-hasChickens-island hiddenDiv">'+((islands[i].hasOwnProperty('chickens'))?"O":"N")+'</span>'+
							'<span class="popup-hasPigs-island hiddenDiv">'+((islands[i].hasOwnProperty('pigs'))?"O":"N")+'</span>'+
							'<span class="popup-hasSnakes-island hiddenDiv">'+((islands[i].hasOwnProperty('snakes'))?"O":"N")+'</span>'+
						'</div>', {minWidth: 322});
						
	islandMarker.on('mouseover', function (e) {
		this.openPopup();
	});
	islandMarker.on('mouseout', function (e) {
		this.closePopup();
	});
	islandMarker.on('click', function (e) {
		map.setView(this.getLatLng(), 6);
		
		var modal = document.getElementById('islandModal');
		var img = document.getElementById('islandModalImg');
		var titre = document.getElementById('islandModalTitre');
		var type = document.getElementById('islandModalType');
		var span = document.getElementsByClassName("closeModal")[0];
		
		modal.style.display = "block";
		
		// When the user clicks on <span> (x), close the modal
		span.onclick = function() {
            modal.style.display = "none";
        }
		
		// When the user clicks anywhere outside of the modal, close it
		window.onclick = function(event) {
			if (event.target == modal) {
				modal.style.display = "none";
			}
		}
		img.src = "images/screenshots/medium/" + document.getElementsByClassName("popup-img-island")[0].innerHTML;
		titre.innerHTML = document.getElementsByClassName("popup-title-island")[0].innerHTML;
		type.innerHTML = document.getElementsByClassName("popup-type-island")[0].innerHTML;
		
		$('#islandModalAnimals').html("");
		if(document.getElementsByClassName("popup-hasChickens-island")[0].innerHTML == "O"){
			$('#islandModalAnimals').append('<div class="animal-box"><img src="images/animal-info-box/chicken-icon-small.png" /></div>');
		}
		if(document.getElementsByClassName("popup-hasPigs-island")[0].innerHTML == "O"){
			$('#islandModalAnimals').append('<div class="animal-box"><img src="images/animal-info-box/pig-icon-white.png" height="20" /></div>');
		}
		if(document.getElementsByClassName("popup-hasSnakes-island")[0].innerHTML == "O"){
			$('#islandModalAnimals').append('<div class="animal-box"><img src="images/animal-info-box/snake-icon-white-small.png" /></div>');
		}
		
		this.closePopup();
    });
    */

    markersLayer.addLayer(circle);
    island_markers[i] = circle;
    islands[i].circle = circle;

    circle.on({
        mousedown: function(evt) {
            if (isDev) {
                evt.target.classList.add('pig show');
                map.dragging.disable();
                map.on('mousemove', function(e) {
                    evt.target.setLatLng(e.latlng);
                });
            } else {
                evt.target._path.classList.remove("pig", "show");
                mF.clearComp(map);
                hidePopup();
            }
        },
        mouseup: function (evt) {
            if (isDev) {
                map.removeEventListener('mousemove');
                console.log(evt.target.options.title);
                console.log("[" + evt.latlng.lat + ", " + evt.latlng.lng + "],");
                map.dragging.enable(); //this doesn't seem to work
            }
        }
    });

    if (islands[i].chickens) {

        var chickenLoc = modifyLoc(islands[i].loc, cRad * 0.5, cRad * 0.6);

        var marker = L.marker(chickenLoc, { 
            icon: chicken_marker,
            title: 'chicken'
            //opacity: 0
        } 
        ).addTo(chickensLayer);
        marker.setIcon(chicken_marker);

    }

    if (islands[i].snakes) {

        var snakeLoc = modifyLoc(islands[i].loc, cRad * 0.5, (cRad * 0.6) * -1);

        var marker = L.marker(snakeLoc, { 
            icon: snake_marker,
            title: 'snake' 
            //opacity: 0 
        } 
        ).addTo(snakesLayer);

        
    }

    if (islands[i].pigs) {

        var pigLoc = modifyLoc(islands[i].loc, (cRad * 0.5) * -1, (cRad * 0.6) * -1);

        var marker = L.marker(pigLoc, { 
            icon: pig_marker,
            title: 'pigs'  
            //opacity: 0
        } 
        ).addTo(pigsLayer);

        
    }
}


var lastZoomApplied = null;
map.on('zoomend', function() {
    if (map.getZoom() <3){
        map.removeLayer(islandsLayer);
    }
    else {
		map.addLayer(islandsLayer);
	}
	var tooltip = $('.title-location');
	switch (map.getZoom()) {
		case 5:
            tooltip.css('font-size', 24);
			if(lastZoomApplied != map.getZoom()){
				//adjustIslandsAnchorPointOnZoom(0.18);
			}
			lastZoomApplied = map.getZoom();
            break;
        case 6:
            tooltip.css('font-size', 33);
			if(lastZoomApplied != map.getZoom()){
				//adjustIslandsAnchorPointOnZoom(0.41);
			}
			lastZoomApplied = map.getZoom();
            break;
        case 7:
            tooltip.css('font-size', 63);
			if(lastZoomApplied != map.getZoom()){
				//adjustIslandsAnchorPointOnZoom(1.73);
			}
			lastZoomApplied = map.getZoom();
            break;
        default:
            tooltip.css('font-size', 14);
			if(lastZoomApplied != map.getZoom()){
				//adjustIslandsAnchorPointOnZoom(0);
			}
			lastZoomApplied = 4;
    }
});




/**
 * * ADD BEACONS
 */
var beaconsLayer = new L.LayerGroup();
layerArray.push(['beacons', beaconsLayer]);
map.addLayer(beaconsLayer);

for(var t in beacons) {
    var mkr = mF.getMarker(beacons[t], "beacon");
    mkr.marker.addTo(beaconsLayer)
    .bindPopup(mkr.title);

    pList.addPlaceToList("beacon", mkr.title, "beaconClass " + window.websafe(mkr.title), beacons[t]);
};



/**
 * * ADD CARGO RUN
 */
var cargorunsLayer = new L.LayerGroup();
layerArray.push(['cargoruns', cargorunsLayer]);
map.addLayer(cargorunsLayer);

for(var t in cargoruns) {
    var mkr = mF.getMarker(cargoruns[t], "cargo");
    mkr.marker.addTo(cargorunsLayer)
    .bindPopup(mkr.title);

    pList.addPlaceToList("cargorun", mkr.title, "cargoClass " + window.websafe(mkr.title), cargoruns[t]);
}

/**
 * * ADD THRONES
 */
var thronesLayer = new L.LayerGroup();
layerArray.push(['thrones', thronesLayer]);
map.addLayer(thronesLayer);

for(var t in thrones) {
    var mkr = mF.getMarker(thrones[t], "throne");
    mkr.marker.addTo(thronesLayer)
    .bindPopup(mkr.desc);

    pList.addPlaceToList("throne", mkr.title, "throneClass " + window.websafe(mkr.title), thrones[t]);
};


/**
 * * ADD TALL TALES
 */
var talltalesLayer = new L.LayerGroup();
layerArray.push(['talltales', talltalesLayer]);
map.addLayer(talltalesLayer);
for(var t in places) {
    var mkr = mF.getMarker(places[t], "talltale");
    var popUpHTML = '<div class="lf-popup">'+
    '<h3 class="pop_title">' + mkr.title + '</h3><p>' + mkr.desc + '</p>';
    if (places[t].image) {
        popUpHTML +='<img src="images/screenshots/' + places[t].image + '" class="popup_screenshot js-show-large-screenshot"/>';
    }
    popUpHTML += '</div>';

    mkr.marker.addTo(talltalesLayer)
    //.bindPopup(mkr.desc);
    .bindPopup(popUpHTML, {minWidth: 322});

    pList.addPlaceToList("talltale", mkr.title, "talltaleClass " + window.websafe(mkr.title), places[t]);
}; 






function localData(text, callResponse)
{
    //here can use custom criteria or merge data from multiple layers
    callResponse(islands.concat(cargoruns));
    return {	//called to stop previous requests on map move
        abort: function() {
            console.log('aborted request:'+ text);
        }
    };
}



var toggleMarkers = function(theType, onoff) {
    var theLayer = getLayer(theType);
    //console.log(theType);

    theLayer.eachLayer(function (layer) {
        console.log(layer);
        if (onoff) {
            layer.setOpacity(1);
        } else {
            layer.setOpacity(0);
        }
    });

};

var toggleLayer = function(theType, onoff) {
    var theLayer = getLayer(theType);
    console.log(theType);
    

	if (onoff) {
        if (theType == "thrones") {
            $(".markerIcon.throne").addClass("show");
        } else if (theType == "beacons") {
            $(".markerIcon.beacon").addClass("show");
        } else if (theType == "cargoruns") {
            $(".markerIcon.cargo").addClass("show");
        } else if (theType == "talltales") {
            $(".markerIcon.talltale").addClass("show");
        } else {
            map.addLayer(theLayer);
        }
    }
    else {
        if (theType == "thrones") {
            $(".markerIcon.throne").removeClass("show");
        } else if (theType == "beacons") {
            $(".markerIcon.beacon").removeClass("show");
        } else if (theType == "cargoruns") {
            $(".markerIcon.cargo").removeClass("show");
        } else if (theType == "talltales") {
            $(".markerIcon.talltale").removeClass("show");
        } else {
            map.removeLayer(theLayer);
        }
	} 
};

var getLayer = function(layerName) {
    for (var p=0; p<layerArray.length; p++) {
        if (layerArray[p][0] == layerName) {
            return layerArray[p][1];
        }
    }
};




function findNearestMarker(coords, type) {
    var minDist = 1000,
    markerDist,
    closest = {};

    for(var i in islands) {
        var title = islands[i].title;
        var loc = islands[i].loc;
        markerDist = map.distance(loc, coords);
        if ((markerDist < minDist) && islands[i][type]) {
            minDist = markerDist;
            closest.title = title;
            closest.islandData = islands[i];
        }
    }
    
    closest.bearing = window.angle360(coords.lat,coords.lng,closest.islandData.loc[0],closest.islandData.loc[1]);
    return closest;
};


var customOptions =
{
'maxWidth': '500',
'minWidth': '120',
'className' : 'context_popup'
};


var popup = L.popup(customOptions);

function showPopup(words) {
    $('.floating_dialog').html(words).addClass("show");
}

function hidePopup() {
    $('.floating_dialog').removeClass("show");
}
window.clearPlacementMessage = hidePopup;


//Graticule
var options = {interval: 8.2,
    vinterval: 7.7,
    showOriginLabel: false,
    redraw: 'move'/* ,
    zoomIntervals: [
     {start: 3, end: 6, interval: 5.85} 
 ]*/};
L.simpleGraticule(options).addTo(map); 


map.on('zoomend', function() {
    adjustAlphaNum();
});

map.on('move', function() {
    adjustAlphaNum();
});

map.on('moveend', function() {
    adjustAlphaNum();
});

function adjustAlphaNum() {
    var currentZoom = map.getZoom()
    if (currentZoom >= 4) {
        $(".leaflet-grid-label").addClass("big");
    }
    //console.log(map.getZoom(), map.getCenter());
    //console.log(map.getBounds());
}


function modifyLoc(locArray, newLat, newLong) {
    var newLoc =[locArray[0]+ newLat, locArray[1]+ newLong];
    return newLoc;
}


window.dev = {
    toggleOn: function() {
        console.log("dev");
        $(".islandClass").addClass("show");
        isDev = true;
    }
}



function readXstring() {
    var urlParams = new URLSearchParams(window.location.search);
    var mkrs = window.decodeURIComponent(urlParams.get('mkrs'));

    if (urlParams.get('mkrs') !== null) {
        var decodedData =  window.atob(mkrs); // decode the string
        var marks = decodedData.split(";");
        
        marks.forEach(function(entry) {
            if (entry !== "") {
                mF.addXmark(entry.split(","), map);
            }
        });
    }
}



function getNextIsland(direction) {
    if (direction == "left") {
        currentSearchIsland--;
        if (currentSearchIsland < 0) {
            currentSearchIsland = islands.length - 1;
        }
    } else {
        currentSearchIsland++;
        if (currentSearchIsland >= islands.length) {
            currentSearchIsland = 0;
        }
    }

    if (islands[currentSearchIsland].isFortress || islands[currentSearchIsland].outpost || islands[currentSearchIsland].isSeapost) {
        return (getNextIsland(direction))
    }
    return (islands[currentSearchIsland]);
}

function adjustIslandsAnchorPointOnZoom(anchorXmodifier){
	islandsLayer.getLayers().forEach(function(marker){
		var icon = marker.options.icon;
		var iconAnchor = icon.options.iconAnchor;
		
		var oriAnchorX = $(icon.options.html).data("anchor-x");
		var anchorX = oriAnchorX + (oriAnchorX * anchorXmodifier);
		icon.options.iconAnchor = [anchorX, iconAnchor[1]];
		marker.setIcon(icon);
	});
}

var popUpInt = 0;
$(function() {
	
	const addRouteBtn = document.getElementById("add-route-btn");

		if (addRouteBtn) {
			addRouteBtn.onclick = () => {
				routes.startRouteDrawing(map);
			};
		};

    function getMainVesselName() {
        var titleEl = document.getElementById("main-vessel-title");
        var name = titleEl && titleEl.textContent.trim() ? titleEl.textContent.trim() : "Embarcação";
        return name;
    }

    function updateMainVesselButtons(name, isPositioned) {
        var positionBtn = document.getElementById("main-vessel-position-btn");
        var removeBtn = document.getElementById("main-vessel-remove-btn");
        if (positionBtn) positionBtn.textContent = "Posicionar " + name;
        if (removeBtn) {
            removeBtn.textContent = "Remover " + name;
            removeBtn.disabled = !isPositioned;
        }
    }

    function enableMainVesselControls(enabled) {
        var ids = ["main-vessel-cannons", "main-vessel-deck", "main-vessel-mast", "main-vessel-scope"];
        ids.forEach(function(id) {
            var el = document.getElementById(id);
            if (!el) return;
            el.disabled = !enabled;
            if (!enabled) el.checked = false;
        });
    }

    // Painel de embarcação principal
    (function setupMainVesselPanel() {
        var titleEl = document.getElementById("main-vessel-title");
        var positionBtn = document.getElementById("main-vessel-position-btn");
        var removeBtn = document.getElementById("main-vessel-remove-btn");

        if (!positionBtn) return;

        function refresh() {
            updateMainVesselButtons(getMainVesselName(), !!(mainVesselShip && map.hasLayer(mainVesselShip)));
        }

        enableMainVesselControls(false);
        refresh();

        if (titleEl) {
            titleEl.addEventListener("input", refresh);
            titleEl.addEventListener("blur", refresh);
        }

        positionBtn.addEventListener("click", function() {
            pendingPlacement = 'mainShip';
            showPopup("Clique no mapa para posicionar " + getMainVesselName() + ".");
        });

        if (removeBtn) {
            removeBtn.addEventListener("click", function() {
                if (!mainVesselShip) return;
                if (map.hasLayer(mainVesselShip)) map.removeLayer(mainVesselShip);
                // também limpa visão/cones se estiverem ativos
                mainVesselShip._cannonsEnabled = false;
                enableMainVesselControls(false);
                refresh();
            });
        }
    })();

    // botões da barra lateral – navios, inimigos e marcadores
    $(".js-addShip").click(function() {
        pendingPlacement = 'ship';
        showPopup("Clique no mapa para adicionar um navio.");
    });

    $(".js-addEnemy").click(function() {
        pendingPlacement = 'enemy';
        showPopup("Clique no mapa para adicionar um inimigo.");
    });

    $(".js-addMarker").click(function() {
        pendingPlacement = 'marker';
        showPopup("Clique no mapa para adicionar um marcador.");
    });

    $(".js-clearMarkers").click(function() {
        mF.clearXmarks(map);
        mF.clearComp(map);
        hidePopup();
        mF.setQstring();
    });

    $(".js-deleteOne").click(function() {
        mF.enableDeleteMode();
        showPopup("Clique em um marcador ou navio para apagá-lo.");
    });

    // =========================
    // VENTO (UI)
    // =========================
    (function setupWindPanel() {
        var f1 = document.getElementById("wind-force-1");
        var f2 = document.getElementById("wind-force-2");
        var f3 = document.getElementById("wind-force-3");
        var arrow = document.getElementById("wind-arrow");
        if (!f1 || !f2 || !f3 || !arrow) return;

        function setForce(level) {
            f1.checked = level >= 1;
            f2.checked = level >= 2;
            f3.checked = level >= 3;
            var src = "images/markers/seta1_marker.png";
            if (level === 2) src = "images/markers/seta2_marker.png";
            if (level === 3) src = "images/markers/seta3_marker.png";
            arrow.src = src;
        }

        f1.addEventListener("change", function() { setForce(f1.checked ? 1 : 0); });
        f2.addEventListener("change", function() { setForce(f2.checked ? 2 : (f1.checked ? 1 : 0)); });
        f3.addEventListener("change", function() { setForce(f3.checked ? 3 : (f2.checked ? 2 : (f1.checked ? 1 : 0))); });

        // força padrão: 1
        setForce(1);

        // rotação com clique+arrasto (LMB)
        var rotating = false;
        function onMove(ev) {
            if (!rotating) return;
            var r = arrow.getBoundingClientRect();
            var cx = r.left + r.width / 2;
            var cy = r.top + r.height / 2;
            var dx = ev.clientX - cx;
            var dy = ev.clientY - cy;
            var deg = Math.atan2(dx, -dy) * 180 / Math.PI; // 0 = norte
            arrow.style.transform = "rotate(" + deg + "deg)";
        }
        function onUp() {
            rotating = false;
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
        }
        arrow.addEventListener("mousedown", function(ev) {
            if (ev.button !== 0) return;
            ev.preventDefault();
            rotating = true;
            document.addEventListener("mousemove", onMove);
            document.addEventListener("mouseup", onUp);
        });
    })();

    // =========================
    // DESCOBERTA (FOG)
    // =========================
    (function setupDiscoveryPanel() {
        var input = document.getElementById("discovery-coord");
        var discoverBtn = document.getElementById("discovery-btn");
        var coverBtn = document.getElementById("cover-btn");
        if (!input || !discoverBtn || !coverBtn) return;

        discoverBtn.addEventListener("click", function() {
            if (typeof window.fogToggleCell !== "function") return;
            window.fogToggleCell(input.value, true);
        });
        coverBtn.addEventListener("click", function() {
            if (typeof window.fogToggleCell !== "function") return;
            window.fogToggleCell(input.value, false);
        });
    })();


    pList.buildPlaceList();

    $(".js-showfilters").on("click", function() {
        $(".js-filter_space").toggleClass("open");
    });


    $(".js-toggle-filter").on("change", function() {
        var isChecked = $("input", this).prop('checked');

        if (isChecked) {
            pList.toggleListFilter($(this).data('filter'), true);
        } else {
            pList.toggleListFilter($(this).data('filter'), false);
        }
        
    });

    $(".js-filter-search").on('input propertychange paste', function() {
        pList.applySearchFilter();        
    });

    $(".js-filter-search").keypress(function(e){
        if(e.which == 13){//Enter key pressed
            $(this).click();
            $(".js-placelist.found").first().click();
        } 
    }).keydown(function(e){  
        if(e.which === 40) {
            $(".js-placelist").nextAll(".found:first").focus();
        }
    });

    $(".js-clear-search").on("click", function() {
        $(".js-filter-search").val("");
        pList.applySearchFilter();
    })

    $(".js-placelist").on('click', function() {

        console.log("Showing: " + $(this).data("name"));

        var mData = pList.getMarkerOBJbyIDX($(this).data("idx"));
        if (mData.toggleMarker) {
            var wsName = window.websafe(mData.name);
            $(".markerIcon."+wsName).addClass("show");
            $(".markerIcon."+wsName).click();
        }
        /* map.flyTo(LatLong, radius, {
            animate: true,
            duration: 2 // in seconds
        }); */
        map.setView(mData.LatLong, mData.radius);

    });
    $(".js-placelist").keypress(function(e){
        if(e.which == 13){//Enter key pressed
            $(this).click();
        } 
    });
    $(".js-placelist").keydown(function(e){
        //console.log(e.which);   
        if(e.which === 40) {
            //console.log("direction")
            $(this).nextAll(".found:first").focus();
        } else if (e.which === 38) {
            $(this).prevAll(".found:first").focus();
        }
    });
    $(".js-placelist").on('focus', function() {
        console.log("FOC'D");
        $(".highlight").removeClass("highlight");
        $(this).addClass("highlight");
    });




    

    $(".js-searchforisland").click(function() {
        
        var theIsland = getNextIsland($(this).data("dir"));

        var LatLong = theIsland.loc;
        map.setView(LatLong, 7);
        //map.panTo(LatLong, 7);
        adjustAlphaNum();

        showPopup("Island " + (currentSearchIsland + 1) + " of " + islands.length);
        clearTimeout(popUpInt);
        popUpInt = setTimeout(hidePopup, 3000);
    });


    $(".js-toggleMarkers").click(function() {
        toggleLayer($(this).attr("name"), $(this).is(":checked"));	
    });

    $(".js-fullscreen").click(function() {
        window.toggleFullScreen();
    });

    $(".js-share").click(function() {
        var fullURL = window.location.href;
        navigator.clipboard.writeText(fullURL).then(function() {
            console.log('Async: Copying to clipboard was successful!');
            showPopup("Current Map Location URL Copied To Clipboard!");
            setTimeout(hidePopup, 4000);
        }, function(err) {
            console.error('Async: Could not copy text: ', err);
        });
    });


    /* $(".js-installfiles").click(function() {
        console.log("click install");
        pwa.installer();
    }); */

    $(".js-settings").click(function() {
        console.log("click settings");
        $(".settings").addClass("open");
    });

    $(".js-close-settings").click(function() {
        console.log("click settings");
        $(".settings").removeClass("open");
    });

    readXstring();


    $(".js-open-islandfinder").click(function() {
        $(".js-ifoverlay").addClass("open");
        $(".js-island-list").html(pList.getIslandFinderHTML(islands));

        $(".js-overlay-words").html("<h2>Island Finder</h2><p>Scroll through these images of the islands of Sea Of Thieves and find the one that your treasure is marked on. Click to jump to island in the map</p>");

        $(".js-jumptoisland").click(function() {
            var myIdx = $(this).data('idx');
            $(".js-ifoverlay").removeClass("open");
            var LatLong = islands[myIdx].loc;
            map.setView(LatLong, 7);
            adjustAlphaNum();
        });
    });

    $(".js-close-if-overlay").click(function() {
        $(".js-ifoverlay").removeClass("open");
    });

    $('body').on('click', '.js-show-large-screenshot', function () {
        var myImage = $(this).attr("src");
        var myTitle = $(this).parent().find(".pop_title").text();
        var myWords = $(this).parent().find("p").text();
        console.log(myTitle, myWords);
        //console.log("show " + myImage);

    });



    $('.js-open-searchbar').click(function() {
        $(".sidebar.left").toggleClass("open");
    });

    $('.js-toggle-right-panel').click(function() {
        $(".sidebar.right").toggleClass("closed");
    })


    
});


//expose externally:
window.generateIslandImages = function() {
    data_out.startImageOut(map, islands);
}

window.rsize = function() {
    map.invalidateSize();
}