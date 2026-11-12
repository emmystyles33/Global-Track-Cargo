const MAP_WIDTH = 1000;
const MAP_HEIGHT = 500;
const MAX_MERCATOR_LATITUDE = 85.05112878;
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function toVector({ lat, lng }) {
  const latitude = lat * DEG_TO_RAD;
  const longitude = lng * DEG_TO_RAD;
  const latitudeRadius = Math.cos(latitude);

  return [
    latitudeRadius * Math.cos(longitude),
    latitudeRadius * Math.sin(longitude),
    Math.sin(latitude),
  ];
}

function normalizeVector(vector) {
  const length = Math.hypot(...vector);
  return vector.map((coordinate) => coordinate / length);
}

function vectorToCoordinate([x, y, z]) {
  return {
    lat: Math.asin(clamp(z, -1, 1)) * RAD_TO_DEG,
    lng: Math.atan2(y, x) * RAD_TO_DEG,
  };
}

function mercatorY(latitude) {
  const radians = clamp(latitude, -MAX_MERCATOR_LATITUDE, MAX_MERCATOR_LATITUDE) * DEG_TO_RAD;
  return Math.log(Math.tan(Math.PI / 4 + radians / 2));
}

const MAX_MERCATOR_Y = mercatorY(MAX_MERCATOR_LATITUDE);

export function projectCoordinate({ lat, lng }) {
  return {
    x: ((lng + 180) / 360) * MAP_WIDTH,
    y: ((MAX_MERCATOR_Y - mercatorY(lat)) / (2 * MAX_MERCATOR_Y)) * MAP_HEIGHT,
  };
}

export function interpolateGreatCircle(start, destination, fraction) {
  const progress = clamp(Number.isFinite(fraction) ? fraction : 0, 0, 1);
  if (progress === 0) return { lat: start.lat, lng: start.lng };
  if (progress === 1) return { lat: destination.lat, lng: destination.lng };

  const startVector = toVector(start);
  const endVector = toVector(destination);
  const dot = clamp(
    startVector.reduce((sum, coordinate, index) => sum + coordinate * endVector[index], 0),
    -1,
    1
  );
  const angle = Math.acos(dot);

  if (angle < 1e-10) return { lat: start.lat, lng: start.lng };

  if (Math.PI - angle < 1e-6) {
    const axis = Math.abs(startVector[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
    const tangent = normalizeVector([
      axis[0] - startVector[0] * startVector.reduce((sum, coordinate, index) => sum + coordinate * axis[index], 0),
      axis[1] - startVector[1] * startVector.reduce((sum, coordinate, index) => sum + coordinate * axis[index], 0),
      axis[2] - startVector[2] * startVector.reduce((sum, coordinate, index) => sum + coordinate * axis[index], 0),
    ]);
    const vector = startVector.map(
      (coordinate, index) =>
        coordinate * Math.cos(Math.PI * progress) + tangent[index] * Math.sin(Math.PI * progress)
    );
    return vectorToCoordinate(vector);
  }

  const sinAngle = Math.sin(angle);
  const startWeight = Math.sin((1 - progress) * angle) / sinAngle;
  const endWeight = Math.sin(progress * angle) / sinAngle;
  const vector = startVector.map(
    (coordinate, index) => coordinate * startWeight + endVector[index] * endWeight
  );

  return vectorToCoordinate(normalizeVector(vector));
}

function splitAtAntimeridian(points) {
  if (points.length === 0) return [];

  const segments = [[projectCoordinate(points[0])]];

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const longitudeDifference = current.lng - previous.lng;

    if (Math.abs(longitudeDifference) <= 180) {
      segments[segments.length - 1].push(projectCoordinate(current));
      continue;
    }

    const crossesEastward = longitudeDifference < -180;
    const unwrappedLongitude = current.lng + (crossesEastward ? 360 : -360);
    const unwrappedDifference = unwrappedLongitude - previous.lng;

    if (Math.abs(unwrappedDifference) < 1e-10) {
      segments.push([projectCoordinate(current)]);
      continue;
    }

    const boundaryLongitude = crossesEastward ? 180 : -180;
    const crossingFraction =
      (boundaryLongitude - previous.lng) / unwrappedDifference;
    const crossingLatitude =
      previous.lat + (current.lat - previous.lat) * crossingFraction;
    const boundaryX = crossesEastward ? MAP_WIDTH : 0;
    const oppositeX = crossesEastward ? 0 : MAP_WIDTH;
    const crossingY = projectCoordinate({ lat: crossingLatitude, lng: 0 }).y;

    segments[segments.length - 1].push({ x: boundaryX, y: crossingY });
    segments.push([{ x: oppositeX, y: crossingY }, projectCoordinate(current)]);
  }

  return segments;
}

export function buildGreatCircleSegments(start, destination, fraction = 1, sampleCount = 180) {
  const progress = clamp(Number.isFinite(fraction) ? fraction : 0, 0, 1);
  const steps = Math.max(1, Math.ceil(sampleCount * progress));
  const routePoints = Array.from({ length: steps + 1 }, (_, index) =>
    interpolateGreatCircle(start, destination, (progress * index) / steps)
  );

  return splitAtAntimeridian(routePoints);
}
