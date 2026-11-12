import { useEffect, useMemo, useState } from 'react';
import {
  buildGreatCircleSegments,
  interpolateGreatCircle,
  projectCoordinate,
} from '../lib/routeGeometry.js';

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 500;
const ROUTE_SAMPLE_COUNT = 180;
const COUNTRY_DATA_URL = '/data/worldCountries.json';

function toPath(segments) {
  return segments
    .filter((segment) => segment.length > 1)
    .map((segment) =>
      segment
        .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)},${point.y.toFixed(2)}`)
        .join(' ')
    )
    .join(' ');
}

function geometryToPath(geometry) {
  const polygons =
    geometry.type === 'Polygon'
      ? [geometry.coordinates]
      : geometry.type === 'MultiPolygon'
        ? geometry.coordinates
        : [];

  return polygons
    .flatMap((polygon) =>
      polygon.map((ring) => {
        const points = ring.map(([lng, lat]) => projectCoordinate({ lat, lng }));
        return points
          .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)},${point.y.toFixed(2)}`)
          .join(' ') + ' Z';
      })
    )
    .join(' ');
}

function isValidLocation(location) {
  return (
    Number.isFinite(location?.lat) &&
    Number.isFinite(location?.lng) &&
    location.lat >= -90 &&
    location.lat <= 90 &&
    location.lng >= -180 &&
    location.lng <= 180
  );
}

function getTransportGlyph(shipmentType) {
  if (shipmentType === 'Ocean Freight') {
    return (
      <g fill="currentColor">
        <path d="M-9 1h18l-2.2 5.2H-6.8z" />
        <path d="M-4-5h5v5h-5zM2-3h4v3H2z" />
        <path d="M-9 8c2.2-1.6 4.2-1.6 6.4 0 2.2-1.6 4.2-1.6 6.4 0 1.8-1.2 3.5-1.5 5.2-.8v2c-1.7-.7-3.4-.4-5.2.8-2.2-1.6-4.2-1.6-6.4 0-2.2-1.6-4.2-1.6-6.4 0z" />
      </g>
    );
  }

  if (shipmentType === 'Rail Freight') {
    return (
      <g fill="currentColor">
        <path d="M-6-9h12c1.7 0 3 1.3 3 3v10c0 1.7-1.3 3-3 3H6l3 4H6l-4-4h-4l-4 4h-3l3-4h-1c-1.7 0-3-1.3-3-3V-6c0-1.7 1.3-3 3-3zm-1 4v4h5v-4zm8 0v4h5v-4zM-5 5a1.5 1.5 0 1 0 0 .1zm10 0a1.5 1.5 0 1 0 0 .1z" />
      </g>
    );
  }

  if (shipmentType === 'Road Freight') {
    return (
      <g fill="currentColor">
        <path d="M-10-6h11v10h-11zM1-3h5l4 4v3H1z" />
        <path d="M-7 4a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zm13 0a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z" />
        <path d="M3-1v3h4V1L5-1z" fill="#ffffff" />
      </g>
    );
  }

  return (
    <path
      d="M-11-3.5 0-5l11-6-2 8 5 2v2l-6-1-2 7-2 1-1-8-7-1-3 1v-1l4-2-4-1z"
      fill="currentColor"
    />
  );
}

function getEndpointLabelPosition(point, width, verticalOffset) {
  let x = point.x - width / 2;
  if (x < 12) x = 12;
  if (x + width > MAP_WIDTH - 12) x = MAP_WIDTH - width - 12;

  let y = point.y + verticalOffset;
  if (y < 14) y = point.y + 24;
  if (y > MAP_HEIGHT - 12) y = point.y - 24;

  return { x, y };
}

function Endpoint({ point, label, type, verticalOffset }) {
  const safeLabel = String(label || type)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 34);
  const width = Math.min(Math.max(safeLabel.length * 6.1 + 20, 84), 220);
  const labelPosition = getEndpointLabelPosition(point, width, verticalOffset);
  const color = type === 'Origin' ? '#38b8a7' : '#f0b354';

  return (
    <g className={`route-endpoint route-endpoint-${type.toLowerCase()}`}>
      <title>{`${type}: ${safeLabel}`}</title>
      <circle cx={point.x} cy={point.y} r="9" fill="#102638" stroke="#ffffff" strokeWidth="2" />
      <circle cx={point.x} cy={point.y} r="4" fill={color} />
      <g transform={`translate(${labelPosition.x}, ${labelPosition.y})`}>
        <rect width={width} height="22" rx="6" fill="#0b1c29" fillOpacity="0.94" stroke={color} strokeOpacity="0.8" />
        <text
          x={width / 2}
          y="14.5"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="10"
          fontWeight="600"
          fontFamily="Inter, sans-serif"
        >
          {safeLabel}
        </text>
      </g>
    </g>
  );
}

function Graticule() {
  const latitudes = [-60, -30, 0, 30, 60];
  const longitudes = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150];

  return (
    <g className="world-map-graticule">
      {latitudes.map((lat) => {
        const y = projectCoordinate({ lat, lng: 0 }).y;
        return <line key={`lat-${lat}`} x1="0" x2={MAP_WIDTH} y1={y} y2={y} />;
      })}
      {longitudes.map((lng) => {
        const x = projectCoordinate({ lat: 0, lng }).x;
        return <line key={`lng-${lng}`} x1={x} x2={x} y1="0" y2={MAP_HEIGHT} />;
      })}
    </g>
  );
}

export default function WorldMap({
  origin,
  destination,
  progressFraction,
  progressPercent,
  shipmentType,
  originLabel,
  destinationLabel,
}) {
  const [countryFeatures, setCountryFeatures] = useState(null);
  const [mapError, setMapError] = useState('');
  const countryPaths = useMemo(
    () =>
      (countryFeatures || [])
        .filter((feature) => feature.geometry)
        .map((feature) => ({
          name: feature.properties.name,
          d: geometryToPath(feature.geometry),
        }))
        .filter((feature) => feature.d),
    [countryFeatures]
  );

  useEffect(() => {
    let cancelled = false;

    fetch(COUNTRY_DATA_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Map data request failed (${response.status})`);
        }
        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data.features)) {
          throw new Error('Map data did not contain geographic features');
        }
        if (!cancelled) setCountryFeatures(data.features);
      })
      .catch((error) => {
        if (!cancelled) {
          console.error('Unable to load the route map geography.', error);
          setMapError('Geographic map data could not be loaded. Please try again later.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!isValidLocation(origin) || !isValidLocation(destination)) {
    return (
      <div className="world-map-unavailable" role="status">
        Route map unavailable — origin/destination location could not be resolved.
      </div>
    );
  }

  const fraction = Math.min(Math.max(Number(progressFraction) || 0, 0), 1);
  const percent = Number.isFinite(progressPercent) ? progressPercent : Math.round(fraction * 100);
  const originPoint = projectCoordinate(origin);
  const destinationPoint = projectCoordinate(destination);
  const markerPoint = projectCoordinate(interpolateGreatCircle(origin, destination, fraction));
  const routePath = toPath(
    buildGreatCircleSegments(origin, destination, 1, ROUTE_SAMPLE_COUNT)
  );
  const traveledPath = toPath(
    buildGreatCircleSegments(origin, destination, fraction, ROUTE_SAMPLE_COUNT)
  );
  const endpointsAreClose =
    Math.hypot(originPoint.x - destinationPoint.x, originPoint.y - destinationPoint.y) < 120;
  const originLabelOffset = endpointsAreClose ? 30 : -18;
  const destinationLabelOffset = endpointsAreClose ? -18 : -18;

  if (mapError) {
    return (
      <div className="world-map-unavailable" role="alert">
        {mapError}
      </div>
    );
  }

  if (!countryFeatures) {
    return (
      <div className="world-map-unavailable" role="status">
        Loading geographic map data…
      </div>
    );
  }

  return (
    <div className="world-map-wrapper">
      <div className="world-map-frame">
        <svg
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          className="world-map-svg"
          role="img"
          aria-label={`World map route from ${originLabel} to ${destinationLabel}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="route-map-ocean" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#102d43" />
              <stop offset="100%" stopColor="#0b2134" />
            </linearGradient>
            <clipPath id="route-map-clip">
              <rect width={MAP_WIDTH} height={MAP_HEIGHT} rx="14" />
            </clipPath>
            <filter id="route-marker-shadow" x="-100%" y="-100%" width="300%" height="300%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#061522" floodOpacity="0.65" />
            </filter>
          </defs>

          <g clipPath="url(#route-map-clip)">
            <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#route-map-ocean)" />
            <Graticule />

            <g className="world-map-countries">
              {countryPaths.map((country) => (
                <path key={country.name} d={country.d} fillRule="evenodd">
                  <title>{country.name}</title>
                </path>
              ))}
            </g>

            <path className="route-line-underlay" d={routePath} />
            <path className="route-line" d={routePath} />
            {fraction > 0 && <path className="route-progress-line" d={traveledPath} />}

            <Endpoint
              point={originPoint}
              label={originLabel}
              type="Origin"
              verticalOffset={originLabelOffset}
            />
            <Endpoint
              point={destinationPoint}
              label={destinationLabel}
              type="Destination"
              verticalOffset={destinationLabelOffset}
            />

            <g
              className="shipment-position-marker"
              transform={`translate(${markerPoint.x} ${markerPoint.y})`}
              data-progress-percent={percent}
              aria-label={`Estimated shipment position at ${percent}% of the route, based on admin-set delivery progress; not GPS`}
              filter="url(#route-marker-shadow)"
            >
              <title>{`Estimated shipment position: ${percent}% of route progress; not GPS`}</title>
              <circle r="16" fill="#f3b64f" fillOpacity="0.24" />
              <circle r="11" fill="#f2b24c" stroke="#ffffff" strokeWidth="2.5" />
              <g className="shipment-position-glyph" transform="scale(0.65)">
                {getTransportGlyph(shipmentType)}
              </g>
            </g>
          </g>
        </svg>
      </div>
      <p className="world-map-note">
        Track your product with Global Track Cargo until it gets to its destination.
      </p>
    </div>
  );
}
