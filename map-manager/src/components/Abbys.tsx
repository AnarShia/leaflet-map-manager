import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import L, { LatLng, icon } from 'leaflet';
import 'leaflet-draw';

class CustomControl extends L.Control.Draw {
    constructor(options?: L.Control.DrawConstructorOptions) {
        super(options);
        // Add any additional setup or modifications here
    }

    onAdd(map: L.Map): HTMLElement {
        let container = super.onAdd!(map);

        return container;
    }
}

const Toolbar = () => {
    const [markers, setMarkers] = useState<L.Marker[]>([]);
    const [layer, setLayer] = useState<L.Layer | null>(null);
    const map = useMap();

    const icon = L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/565/565375.png',
        iconSize: [25, 25]
    });



    useEffect(() => {
        // Initialize Leaflet.Draw
        const drawControl = new CustomControl({
            position: 'topright',
            draw: {
                polyline: false,
                polygon: {
                    allowIntersection: false, // Restricts shapes to simple polygons
                    drawError: {
                        color: '#e1e100', // Color the shape will turn when intersects
                        message: '<strong>Oh snap!</strong> you can\'t draw that!' // Message that will show when intersect
                    },
                    shapeOptions: {
                        color: '#97009c',
                    },
                    showArea: true,
                    icon: icon

                },
                rectangle: false,
                marker: false,
                circlemarker: false,
            }
        });
        map.addControl(drawControl);
        const polygonDrawControl = drawControl.getContainer()?.getElementsByTagName('a')[0];
        const circleDrawControl = drawControl.getContainer()?.getElementsByTagName('a')[1];

        // set style for draw controls


        // Event listeners for when  drawcontrols are clicked
        const handlePolygonClick = () => {
            removeLayer(layer);
        };

        const handleCircleClick = () => {
            removeLayer(layer);
        };

        polygonDrawControl?.addEventListener('click', handlePolygonClick);
        circleDrawControl?.addEventListener('click', handleCircleClick);


        function calculateArea(layer: L.Layer): number {
            if (layer instanceof L.Polygon) {
                // Assuming the map uses meters as the unit
                return L.GeometryUtil.geodesicArea((layer as L.Polygon).getLatLngs()[0] as L.LatLng[]);
            } else if (layer instanceof L.Circle) {
                const radius = (layer as L.Circle).getRadius();
                return Math.PI * Math.pow(radius, 2);
            } else {
                return 0;
            }
        }

        // Event listener for when a polygon is created
        map.on(L.Draw.Event.CREATED, (event) => {
            const layer = (event as L.DrawEvents.Created).layer

            setLayer(layer);
            if (layer == null) return;

            let center: L.LatLng | null = null;
            if (layer instanceof L.Polygon) {
                center = layer.getBounds().getCenter();
            }
            if (layer instanceof L.Circle) {
                center = layer.getLatLng();
            }
            const area = calculateArea(layer!);
            const marker = L.marker(center!, { icon: L.divIcon({ html: `Area: ${area.toFixed(2)} square meters` }) });
            map.addLayer(layer!);
            if (center) {
                marker.addTo(map);
            }
        });

        // map zoom event in ts
        map.eachLayer((layer) => {
            if (layer instanceof L.Marker) {
                setMarkers([...markers, layer]);
            }
        });

        function removeLayer(layer: L.Layer | null) {
            if (layer) {
                map.removeLayer(layer);
            }
        }
        return () => {
            map.removeControl(drawControl);
            map.off(L.Draw.Event.CREATED);
        };
    }, [map, layer]);

    return <div />;

};
// Map Component
const Abbys = () => {
    return (
        <MapContainer center={[39.76289449274905, 32.848434448242195]} zoom={13} style={{ height: "100vh", width: "100%" }} attributionControl={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Toolbar />
            <LocationMarker />
            <TooltipCircle />
        </MapContainer>
    );
}


// Other Components for reference
function TooltipCircle() {
    const [clickedCount, setClickedCount] = useState(0)
    const [centerMap, setCenterMap] = useState({ "lat": 39.76289449274905, "lng": 32.848434448242195 })
    const map = useMap()
    const eventHandlers = useMemo(
        () => ({
            click() {
                setClickedCount((count) => count + 1);
                setCenterMap(map.getCenter())
            },
        }),
        [map],
    )
    const clickedText =
        clickedCount === 0
            ? 'Click this Circle to change the Tooltip text'
            : `Circle click: ${clickedCount}`
    return (
        <Circle
            center={centerMap}
            eventHandlers={eventHandlers}
            pathOptions={{ fillColor: 'blue' }}
            radius={200 + clickedCount}>
            <Tooltip>{clickedText}</Tooltip>
        </Circle>
    )
}


function LocationMarker() {
    const [position, setPosition] = useState<LatLng | null>(null)
    const map = useMap()
    const icon = L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/565/565375.png',
        iconSize: [25, 25]
    });
    const handleLocationFound = (e: L.LocationEvent) => {
        setPosition(e.latlng)
        map.flyTo(e.latlng, map.getZoom())
    }
    const handleMapClick = () => {
        map.locate()
    }
    useMapEvents({
        click: handleMapClick,
        locationfound: handleLocationFound
    })
    return position === null ? null : (
        <Marker position={position} icon={icon}>
            <Popup>{JSON.stringify(map.getCenter())}</Popup>
        </Marker>
    )
}

export default Abbys;


