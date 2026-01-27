// ================================
// SISTEMA DE ROTAS — VARIÁVEIS GLOBAIS
// ================================

let routes = [];
let drawingRoute = false;
let currentRoute = null;
let routeId = 1;


const ROUTE_POINT_DISTANCE = 40; // pixels entre cada bolinha
const PX_PER_QUADRANT = 512;  
const KM_PER_QUADRANT = 25;
const DAYS_PER_QUADRANT = 3;

function distance(a, b) {
    const dx = a.lng - b.lng;
    const dy = a.lat - b.lat;
    return Math.sqrt(dx * dx + dy * dy);
}

function createRouteDot(latLng, map, color) {
    return L.circleMarker(latLng, {
        radius: 8,               // 15% maior que o rastro do navio
        color: color,
        fillColor: color,
        fillOpacity: 0.7,
        weight: 0,
        interactive: false,
        pane: "shadowPane"       // sempre abaixo dos navios
    }).addTo(map);
}
function startRouteDrawing(map) {

    if (drawingRoute) return;

    drawingRoute = true;

    currentRoute = {
        id: routeId++,
        dots: [],
        points: [],
        totalDistance: 0,
        color: getNextRouteColor()
    };

    map.dragging.disable();

}

function stopRouteDrawing(map) {

    if (!drawingRoute) return;

    drawingRoute = false;
    map.dragging.enable();

    finalizeRoute(currentRoute);

    routes.push(currentRoute);
    currentRoute = null;
}
function attachRouteDrawingEvents(map) {

    let lastPoint = null;

    map.on('mousemove', function (e) {

        if (!drawingRoute || !currentRoute) return;

        if (!lastPoint) {
            lastPoint = e.latlng;
            currentRoute.points.push(lastPoint);
            return;
        }

        const dist = distance(lastPoint, e.latlng);

        if (dist < 3) return;

        const dot = createRouteDot(e.latlng, map, currentRoute.color);

        currentRoute.dots.push(dot);
        currentRoute.points.push(e.latlng);

        currentRoute.totalDistance += dist;

        lastPoint = e.latlng;
    });

    map.on('mouseup', function () {
        lastPoint = null;
        stopRouteDrawing(map);
    });
}
let routeColorIndex = 0;

const routeColors = [
    "#f5c542", // dourado
    "#2ecc71", // verde
    "#e67e22", // laranja
    "#9b59b6", // roxo
    "#3498db"  // azul
];

function getNextRouteColor() {
    const c = routeColors[routeColorIndex % routeColors.length];
    routeColorIndex++;
    return c;
}
function finalizeRoute(route) {

    const quadrants = route.totalDistance / PX_PER_QUADRANT;

    const km = quadrants * KM_PER_QUADRANT;
    const days = quadrants * DAYS_PER_QUADRANT;

    route.km = km.toFixed(1);
    route.days = days.toFixed(1);

    updateRoutesPanel();
}
function updateRoutesPanel() {

    const panel = document.getElementById("routes-panel");
    if (!panel) return;

    panel.innerHTML = "";

    routes.forEach(route => {

        const div = document.createElement("div");
        div.className = "route-block";

        div.innerHTML = `
            <div class="route-title" style="color:${route.color}">
                Rota ${route.id}
            </div>
            <div class="route-info">
                ${route.km} km — ${route.days} dias
            </div>
            <button class="route-delete">✖</button>
        `;

        div.querySelector(".route-delete").onclick = () => deleteRoute(route.id);

        panel.appendChild(div);
    });
}
function deleteRoute(id) {

    const index = routes.findIndex(r => r.id === id);
    if (index === -1) return;

    routes[index].dots.forEach(d => d.remove());

    routes.splice(index, 1);

    updateRoutesPanel();
}



function onRouteMouseMove(e) {
    if (!drawingRoute) return;

    addRoutePoint(e.latlng);
}

function addRoutePoint(latlng) {
    const marker = L.circleMarker(latlng, {
        radius: 6,
        color: "#f5c542",
        fillColor: "#f5c542",
        fillOpacity: 0.7,
        weight: 1
    }).addTo(map);

    currentRoute.markers.push(marker);
    currentRoute.points.push(latlng);
}

export {
    startRouteDrawing,
    attachRouteDrawingEvents
};
