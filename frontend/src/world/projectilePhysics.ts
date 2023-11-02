import { vec3 } from "gl-matrix";
import { $s5map } from "../elements";
import { GRAVITY, HELL_CANNON_DEVIATION, HELL_CANNON_VELOCITY, MORTAR_DEVIATION, MORTAR_VELOCITY, US_MIL } from "./constants";


export function calcAngle(x: number, startHeightOffset: number, v: number, g: number) {
  // https://en.wikipedia.org/wiki/Projectile_motion
  // -> Angle {\displaystyle \theta } \theta required to hit coordinate (x,y)
  const y = - startHeightOffset;
  const d = Math.sqrt(v ** 4 - g * (g * x ** 2 + 2 * y * v ** 2));
  const rad = Math.atan((v ** 2 + d) / (g * x));
  return rad;
}

function calcAngleLow(x: number, startHeightOffset: number, v: number, g: number) {
  // https://en.wikipedia.org/wiki/Projectile_motion
  // -> Angle {\displaystyle \theta } \theta required to hit coordinate (x,y)
  const y = - startHeightOffset;
  const d = Math.sqrt(v ** 4 - g * (g * x ** 2 + 2 * y * v ** 2));
  const rad = Math.atan((v ** 2 - d) / (g * x));
  return rad;
}

export function solveProjectileFlight(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, velocity: number): [number, number, number] {
  //console.log("calc log", x0, x0, z0, x1, y1, z1, velocity)
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist2d = Math.round(Math.hypot(dx, dy));
  const dir = Math.round((Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360 * 100) /100;
  const angle = calcAngle(dist2d, z0 - z1, velocity, GRAVITY);
  return [angle, dir, dist2d];
}

export function distDir(vec1: vec3, vec2: vec3){
  const dx = vec2[0] - vec1[0];
  const dy = vec2[1] - vec1[1];
  const dist2d = Math.round(Math.hypot(dx, dy));
  const dir = Math.round((Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360 * 100) /100;
  return [dist2d, dir]
}

export function angle2groundDistance(angle: number, startHeightOffset: number, velocity: number): number {
  // distance over ground - for map drawing purposes
  const d = Math.sqrt(velocity ** 2 * Math.sin(angle) ** 2 + 2 * GRAVITY * startHeightOffset);
  if (isNaN(d)){ // cannot reach this height
    return 0;
  } else {
    return velocity * Math.cos(angle) * (velocity * Math.sin(angle) + d)/GRAVITY;
  }
}

export function flightTime(angle: number, startHeightOffset: number, velocity: number): number{
  const heightComponent =
    Math.sqrt(
      (velocity * Math.sin(angle)) ** 2
      + 2 * GRAVITY * startHeightOffset
     );
  return (velocity * Math.sin(angle) + heightComponent ) / GRAVITY
}

export function calcSpread(dist: number, startHeightOffset: number, velocity: number, deviation: number): [number, number, number] {
  const centerAngle = calcAngle(dist, startHeightOffset, velocity, GRAVITY);
  const close = angle2groundDistance(centerAngle + deviation, startHeightOffset, velocity)
  const far = angle2groundDistance(centerAngle - deviation, startHeightOffset, velocity)
  // i'm too lazy for the true horizontal component so i'll approximate it via
  // time of (accurate) flight and max horizontal deviation speed - should be close enough for small deviation angles.
  // ^ essentially linear approximation of angle change
  const horizontalSpeed = Math.sin(deviation) * velocity;
  return [horizontalSpeed * flightTime(centerAngle, startHeightOffset, velocity), dist - close, far - dist];
}

export type FiringSolution = {
  weaponTranslation: vec3,
  targetTranslation: vec3,
  weaponToTargetVec: vec3,
  startHeightOffset: number,
  angle: number,
  dir: number,
  dist: number,
  time: number,
  horizontalSpread: number,
  closeSpread: number,
  farSpread: number,
  mil: number,
  milCapped: number,
  milRounded: number,
}

export const getMortarFiringSolution = (weaponTranslation: vec3, targetTranslation: vec3): FiringSolution  => {
  const startHeightOffset = weaponTranslation[2] - targetTranslation[2];
  const [angle, dir, dist] = solveProjectileFlight(
    weaponTranslation[0], weaponTranslation[1], weaponTranslation[2],
    targetTranslation[0], targetTranslation[1], targetTranslation[2],
    MORTAR_VELOCITY
  );
  const weaponToTargetVec = vec3.subtract(vec3.create(), weaponTranslation, targetTranslation)
  const mil = angle * US_MIL;
  const milCapped = mil < 800 ? 0 : mil;
  const milRounded = Math.floor(milCapped*10) / 10;
  const [horizontalSpread, closeSpread, farSpread] = calcSpread(dist, startHeightOffset, MORTAR_VELOCITY, MORTAR_DEVIATION)
  const time = flightTime(angle, startHeightOffset, MORTAR_VELOCITY)
  return Object.freeze({
    weaponTranslation,
    targetTranslation,
    weaponToTargetVec,
    startHeightOffset,
    angle,
    dir,
    dist,
    time,
    mil,
    milCapped,
    milRounded,
    horizontalSpread,
    closeSpread,
    farSpread,
  })
}

export const getHellCannonFiringSolution = (weaponTranslation: vec3, targetTranslation: vec3): FiringSolution  => {
  const startHeightOffset = weaponTranslation[2] - targetTranslation[2];
  const [angle, dir, dist] = solveProjectileFlight(
    weaponTranslation[0], weaponTranslation[1], weaponTranslation[2],
    targetTranslation[0], targetTranslation[1], targetTranslation[2],
    HELL_CANNON_VELOCITY
  );
  const weaponToTargetVec = vec3.subtract(vec3.create(), weaponTranslation, targetTranslation)
  const mil = angle * US_MIL;
  const milCapped = mil < 800 ? 0 : mil;
  const milRounded = Math.floor(milCapped*10) / 10;
  const [horizontalSpread, closeSpread, farSpread] = calcSpread(dist, startHeightOffset, HELL_CANNON_VELOCITY, HELL_CANNON_DEVIATION)
  const time = flightTime(angle, startHeightOffset, HELL_CANNON_VELOCITY)
  return Object.freeze({
    weaponTranslation,
    targetTranslation,
    weaponToTargetVec,
    startHeightOffset,
    angle,
    dir,
    dist,
    time,
    mil,
    milCapped,
    milRounded,
    horizontalSpread,
    closeSpread,
    farSpread,
  })
}

export const getRocketFiringSolution = (weaponTranslation: vec3, targetTranslation: vec3): FiringSolution  => {
  const table = $s5map;
  const startHeightOffset = weaponTranslation[2] - targetTranslation[2];
  const [dist, dir] = distDir(weaponTranslation, targetTranslation);
  const weaponToTargetVec = vec3.subtract(vec3.create(), weaponTranslation, targetTranslation)
  const angle = table.getAngle(dist, startHeightOffset)
  const time = table.getTime(dist, startHeightOffset)
  const mil = angle * US_MIL;
  const milCapped = mil < 800 ? 0 : mil;
  const milRounded = Math.floor(milCapped*10) / 10;
  const horizontalSpread = table.calcSpreadHorizontal(dist, startHeightOffset)
  let spread = table.calcSpreadVertical(dist, startHeightOffset) // "temp" hack...
  let closeSpread = spread[0];
  let farSpread = spread[1]
  closeSpread = closeSpread != 0 ? closeSpread : dist;
  return Object.freeze({
    weaponTranslation,
    targetTranslation,
    weaponToTargetVec,
    startHeightOffset,
    angle,
    dir,
    dist,
    time,
    mil,
    milCapped,
    milRounded,
    horizontalSpread,
    closeSpread,
    farSpread,
  })
}