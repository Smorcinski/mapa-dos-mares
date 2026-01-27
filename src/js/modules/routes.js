let routes = [];
let waitingForRouteStart = false;
let drawingRoute = false;
let currentRoute = null;
let routeId = 1;

const DOT_SPACING = 1; // px → bolinha, 10px, bolinha
const UNITS_PER_QUADRANT = 8;
const KM_PER_QUADRANT = 25;
const HOURS_PER_QUADRANT = 3;



const MAX_ROUTES = 3;


function distance(a, b) {
    const dx = a.lng - b.lng;
    const dy = a.lat - b.lat;
    return Math.sqrt(dx * dx + dy * dy);
}

function createRouteDot(latLng, map, color) {
    return L.circleMarker(latLng, {
        radius: 5,
        color: color,
        fillColor: color,
        fillOpacity: 0.7,
        weight: 0,
        interactive: false,
        pane: "shadowPane"
    }).addTo(map);
}

function startRouteDrawing(map) {

    if (routes.length >= MAX_ROUTES) {
        alert("Limite máximo de 3 rotas atingido.");
        return;
    }

    waitingForRouteStart = true;
    drawingRoute = false;

    map.dragging.disable();
}

function stopRouteDrawing(map) {

    if (!drawingRoute || !currentRoute) return;

    drawingRoute = false;
    waitingForRouteStart = false;
    map.dragging.enable();

    finalizeRoute(currentRoute);

    routes.unshift(currentRoute);
    currentRoute = null;

    updateRoutesPanel();
    checkRouteLimit();
}

function attachRouteDrawingEvents(map) {

    let lastPoint = null;
    let dotAccumulator = 0;

    map.on('mousedown', e => {

        if (!waitingForRouteStart || e.originalEvent.button !== 0) return;

        drawingRoute = true;
        waitingForRouteStart = false;

        currentRoute = {
            id: routeId++,
            color: getNextRouteColor(),
            dots: [],
            totalDistance: 0
        };

        lastPoint = e.latlng;
        dotAccumulator = 0;

        currentRoute.dots.push(
            createRouteDot(e.latlng, map, currentRoute.color)
        );
    });

    map.on('mousemove', e => {

        if (!drawingRoute || !lastPoint) return;

        const step = distance(lastPoint, e.latlng);
        currentRoute.totalDistance += step;
        dotAccumulator += step;

        if (dotAccumulator >= DOT_SPACING) {
            currentRoute.dots.push(
                createRouteDot(e.latlng, map, currentRoute.color)
            );
            dotAccumulator = 0;
        }

        lastPoint = e.latlng;
    });

    map.on('mouseup', () => {

        if (!drawingRoute) return;

        lastPoint = null;
        stopRouteDrawing(map);
    });

}


let routeColorIndex = 0;

const routeColors = [
    "#f5c542",
    "#2ecc71",
    "#e67e22",
    "#9b59b6",
    "#3498db"
];

function getNextRouteColor() {
    const c = routeColors[routeColorIndex % routeColors.length];
    routeColorIndex++;
    return c;
}

function hoursToDaysAndHours(totalHours) {

    const total = Math.ceil(totalHours); // sempre arredonda pra cima

    const days = Math.floor(total / 24);
    const hours = total % 24;

    return { days, hours };
}


function finalizeRoute(route) {

    const quadrants = route.totalDistance / UNITS_PER_QUADRANT;

    const km = quadrants * KM_PER_QUADRANT;
    const totalHours = quadrants * HOURS_PER_QUADRANT;

    const time = hoursToDaysAndHours(totalHours);

    route.km = km.toFixed(1);
    route.timeText =
        time.days > 0
            ? `${time.days} dia${time.days > 1 ? "s" : ""} e ${time.hours} hora${time.hours > 1 ? "s" : ""}`
            : `${time.hours} hora${time.hours > 1 ? "s" : ""}`;

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
                ${route.km} km — ${route.timeText}
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
    checkRouteLimit();
}

function checkRouteLimit() {

    const btn = document.getElementById("add-route-btn");
    if (!btn) return;

    if (routes.length >= MAX_ROUTES) {
        btn.disabled = true;
        btn.innerText = "Limite atingido";
    } else {
        btn.disabled = false;
        btn.innerText = "➕ Adicionar Rota";
    }
}


export {
    startRouteDrawing,
    attachRouteDrawingEvents
};
