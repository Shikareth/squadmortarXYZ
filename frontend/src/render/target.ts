import { Camera } from "../camera/types"
import { applyTransform, getTranslation, newTranslation, world2heightmap } from "../world/transformations";
import { canvasScaleTransform, drawLine, drawSpreadEllipse, outlineText } from "./canvas";
import { mat4, vec3 } from "gl-matrix";
import { Heightmap } from "../heightmap/types";
import { Target, Transform, Weapon } from "../world/types";
import { Maybe } from "../common/types";
import { getHeight } from "../heightmap/heightmap";
import { angle2groundDistance, calcSpread, distDir, getMortarFiringSolution, solveProjectileFlight, getRocketFiringSolution, FiringSolution, getHellCannonFiringSolution} from "../world/projectilePhysics";
import { HELL_CANNON_100_DAMAGE_RANGE, HELL_CANNON_25_DAMAGE_RANGE, MAPSCALE, MORTAR_100_DAMAGE_RANGE, MORTAR_25_DAMAGE_RANGE, MORTAR_DEVIATION, MORTAR_VELOCITY, US_MIL} from "../world/constants";
import { UserSettings } from "../ui/types";
import { $s5map } from "../elements";
import { TEXT_RED, TEXT_WHITE } from "./constants";
import { canonicalEntitySort } from "../world/world";


function drawMortarGridLine(ctx: CanvasRenderingContext2D, x0: number, y0: number, r0: number, r1: number, dir: number) {
  let phi = dir * Math.PI / 180;
  let [kx, ky] = [Math.sin(phi), -Math.cos(phi)];
  drawLine(ctx, x0 + kx * r0, y0 + ky * r0, x0 + kx * r1, y0 + ky * r1);
}
function drawMortarGridArc(ctx: CanvasRenderingContext2D, x0: number, y0: number, r: number, dir: number) {
  if (r >= 0){
    let alpha = Math.PI / 180;
    let phi = (dir - 90) * Math.PI / 180;
    ctx.beginPath();
    ctx.arc(x0, y0, r, phi - 2 * alpha, phi + 3 * alpha);
    ctx.stroke();
  }
}

const drawSimpleMortarSplash = (ctx: CanvasRenderingContext2D, lineWidthFactor: number): void => {
  ctx.lineWidth = 1 * lineWidthFactor
  ctx.strokeStyle = '#f00';
  ctx.beginPath();
  ctx.arc(0, 0, MORTAR_100_DAMAGE_RANGE, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, MORTAR_25_DAMAGE_RANGE, 0, 2 * Math.PI);
  ctx.stroke();
}

const drawMortarSpread = (ctx: CanvasRenderingContext2D, firingSolution: FiringSolution, lineWidthFactor: number, withSplash: boolean) => {
  ctx.lineWidth = 1 * lineWidthFactor
  ctx.strokeStyle = '#00f';
  drawSpreadEllipse(
    ctx, 
    firingSolution.weaponToTargetVec, 
    firingSolution.horizontalSpread, 
    firingSolution.closeSpread, 
    firingSolution.closeSpread
  )
  if (withSplash){
    ctx.strokeStyle = '#f00';
    drawSpreadEllipse(
      ctx, 
      firingSolution.weaponToTargetVec, 
      firingSolution.horizontalSpread + MORTAR_100_DAMAGE_RANGE, 
      firingSolution.closeSpread + MORTAR_100_DAMAGE_RANGE, 
      firingSolution.closeSpread + MORTAR_100_DAMAGE_RANGE
    )
    drawSpreadEllipse(
      ctx, 
      firingSolution.weaponToTargetVec, 
      firingSolution.horizontalSpread + MORTAR_25_DAMAGE_RANGE, 
      firingSolution.closeSpread + MORTAR_25_DAMAGE_RANGE, 
      firingSolution.closeSpread + MORTAR_25_DAMAGE_RANGE
    )
  }
}

const drawHellCannonSplash = (ctx: CanvasRenderingContext2D, lineWidthFactor: number): void => {
  ctx.lineWidth = 1 * lineWidthFactor
  ctx.strokeStyle = '#f00';
  ctx.beginPath();
  ctx.arc(0, 0, HELL_CANNON_100_DAMAGE_RANGE, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, HELL_CANNON_25_DAMAGE_RANGE, 0, 2 * Math.PI);
  ctx.stroke();
}

const drawHellCannonSpread = (ctx: CanvasRenderingContext2D, firingSolution: FiringSolution, lineWidthFactor: number, withSplash: boolean) => {
  ctx.lineWidth = 1 * lineWidthFactor
  ctx.strokeStyle = '#00f';
  drawSpreadEllipse(
    ctx, 
    firingSolution.weaponToTargetVec, 
    firingSolution.horizontalSpread, 
    firingSolution.closeSpread, 
    firingSolution.closeSpread
  )
  if (withSplash){
    ctx.strokeStyle = '#f00';
    drawSpreadEllipse(
      ctx, 
      firingSolution.weaponToTargetVec, 
      firingSolution.horizontalSpread + HELL_CANNON_100_DAMAGE_RANGE, 
      firingSolution.closeSpread + HELL_CANNON_100_DAMAGE_RANGE, 
      firingSolution.closeSpread + HELL_CANNON_100_DAMAGE_RANGE
    )
    drawSpreadEllipse(
      ctx, 
      firingSolution.weaponToTargetVec, 
      firingSolution.horizontalSpread + HELL_CANNON_25_DAMAGE_RANGE, 
      firingSolution.closeSpread + HELL_CANNON_25_DAMAGE_RANGE, 
      firingSolution.closeSpread + HELL_CANNON_25_DAMAGE_RANGE
    )
  }
}

const drawTargetIcon = (ctx: CanvasRenderingContext2D, camera: Camera, targetTransform: Transform) => {
  ctx.save()
  applyTransform(ctx, targetTransform)
  applyTransform(ctx, canvasScaleTransform(camera))
  
  ctx.beginPath();
  ctx.lineWidth = 3
  ctx.strokeStyle = 'black';
  ctx.arc(0, 0, 4, 0, 2 * Math.PI);
  ctx.stroke();

  ctx.beginPath();
  ctx.lineWidth = 1
  ctx.strokeStyle = 'red';
  ctx.arc(0, 0, 4, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.restore()
}

export const drawTargets = (ctx: CanvasRenderingContext2D, camera:Camera, userSettings: UserSettings, heightmap: Heightmap, weapons: Array<Weapon>, targets: Array<Target>): void => {
  if (userSettings.weaponType === "standardMortar" || userSettings.weaponType === "technicalMortar"){
    targets.forEach((t: Target) => drawMortarTarget(ctx, camera, userSettings, heightmap, weapons, t))
  } else if (userSettings.weaponType === "rocket"){
    targets.forEach((t: Target) => drawRocketPodTarget(ctx, camera, userSettings, heightmap, weapons, t))
  } else if (userSettings.weaponType === "hellCannon"){
    targets.forEach((t: Target) => drawHellCannonTarget(ctx, camera, userSettings, heightmap, weapons, t))
  }
}

/*
      const weaponTranslation = getTranslation(activeWeapon.transform);
      const weaponHeight = getHeight(heightmap, weaponTranslation)
      weaponTranslation[2] = weaponHeight + userSettings.extraWeaponHeight * 100;
*/

const drawTargetGridMortar = (ctx: any, lineWidthFactor: number, weaponTransform: Transform, firingSolution: FiringSolution): void => {
  ctx.save()
  applyTransform(ctx,weaponTransform)
  const gridDir = Math.floor(firingSolution.dir);
  const mil5 = Math.floor(firingSolution.milRounded / 5) * 5;
  ctx.strokeStyle = '#0f0';
  ctx.lineWidth = 1 * lineWidthFactor;

  const arcRadii = [-10, -5, 0, 5, 10, 15].map(
    x => angle2groundDistance((mil5 + x)/US_MIL, firingSolution.startHeightOffset, MORTAR_VELOCITY)
  );
  //console.log("angle", angle,"angle/US_MIL", angle/US_MIL, "mil5", mil5, "ar", arcRadii)
  const [ra, r0, r1, r2, r3, rb] = arcRadii;
  [-2, -1, 0, 1, 2, 3].forEach(
    gridOffset => drawMortarGridLine(ctx, 0, 0, ra, rb, gridDir + gridOffset)
  )
  arcRadii.forEach(
    arcRadius => drawMortarGridArc(ctx, 0, 0, arcRadius, gridDir)
  )
  ctx.restore()
}

const drawMortarTarget = (ctx: any, camera:Camera, userSettings: UserSettings, heightmap: Heightmap, weapons: Array<Weapon>, target: Target) => {
  const canvasSizeFactor = mat4.getScaling(vec3.create(), canvasScaleTransform(camera))[0] // uniform scaling
  canonicalEntitySort(weapons);
  const activeWeapons = weapons.filter((w: Weapon) => w.isActive);
  const allWeaponsIndex: any = {};
  weapons.forEach((w: Weapon, index: number) => {
    if (w.isActive){
      allWeaponsIndex[w.entityId] = index;
    }
  })
  activeWeapons.forEach((weapon: Weapon, activeWeaponIndex: number) => {
    const weaponTranslation = getTranslation(weapon.transform);
    const weaponHeight = getHeight(heightmap, weaponTranslation)
    weaponTranslation[2] = weaponHeight +  weapon.heightOverGround;
    const targetTranslation = getTranslation(target.transform);
    const targetHeight = getHeight(heightmap, targetTranslation)
    targetTranslation[2] = targetHeight;
    const solution = getMortarFiringSolution(weaponTranslation, targetTranslation);
    const lineHeight = userSettings.fontSize * (userSettings.targetCompactMode ? 1 : 1.7)

    if (userSettings.targetGrid){
      // could remove transform param via a ctxMove(translate: vec3)
      drawTargetGridMortar(ctx, canvasSizeFactor, weapon.transform, solution);
    }
    ctx.save()
    applyTransform(ctx, target.transform)
    if (userSettings.targetSpread /* && weapons.length < 2 */){
      //console.log("spread", hSpread, closeSpread, farSpread)
      drawMortarSpread(ctx, solution, canvasSizeFactor, userSettings.targetSplash);
    } else if (userSettings.targetSplash){
      drawSimpleMortarSplash(ctx, canvasSizeFactor);
    }
    // firing solution text
    applyTransform(ctx, canvasScaleTransform(camera))
    const angleValue = userSettings.weaponType === "technicalMortar" ? solution.angle / Math.PI * 180  : solution.milRounded;
    applyTransform(ctx, newTranslation(10, activeWeaponIndex * lineHeight, 0))
    if (userSettings.targetCompactMode){
      let angleText =  "-----"
      const angleValuePrecision = userSettings.weaponType === "technicalMortar" ? 1 : 0
      if (solution.angle && angleValue >= 1000){
        angleText = angleValue.toFixed(angleValuePrecision).toString().substr(1, 4 + angleValuePrecision)
      } else if (solution.angle) {
        angleText = angleValue.toFixed(angleValuePrecision).toString().substr(0, 3 + angleValuePrecision)
      }
      if (activeWeapons.length > 1){
        angleText = (allWeaponsIndex[weapon.entityId] + 1).toString() + ": " + angleText;
      }
      outlineText(ctx, angleText, "middle", TEXT_RED, TEXT_WHITE, userSettings.fontSize, true)
    } else {
      let angleText = solution.angle ? `${(angleValue.toFixed(1))}` : "-----"
      if (activeWeapons.length > 1){
        angleText = (allWeaponsIndex[weapon.entityId] + 1).toString() + ": " + angleText;
      }
   

      outlineText(ctx, angleText, "bottom", TEXT_RED, TEXT_WHITE,  userSettings.fontSize, true)
      const bottomText = userSettings.targetDistance ? `${solution.dir.toFixed(1)}° ${(solution.dist * MAPSCALE).toFixed(0)}m` : `${solution.dir.toFixed(1)}°`
      outlineText(ctx, bottomText, "top", TEXT_RED, TEXT_WHITE, userSettings.fontSize * 2 / 3, true)
    }
    ctx.restore();
  })
  drawTargetIcon(ctx, camera, target.transform);
}

function drawRocketPodTarget(ctx: any, camera:Camera, userSettings: UserSettings, heightmap: Heightmap, weapons: Array<Weapon>, target: Target){
  const canvasSizeFactor = mat4.getScaling(vec3.create(), canvasScaleTransform(camera))[0];
  canonicalEntitySort(weapons);
  const activeWeapons = weapons.filter((w: Weapon) => w.isActive);
  const allWeaponsIndex: any = {};
  weapons.forEach((w: Weapon, index: number) => {
    if (w.isActive){
      allWeaponsIndex[w.entityId] = index;
    }
  })
  activeWeapons.forEach((weapon: Weapon, activeWeaponIndex: number) => {
    const weaponTranslation = getTranslation(weapon.transform);
    const weaponHeight = getHeight(heightmap, weaponTranslation)
    weaponTranslation[2] = weaponHeight + weapon.heightOverGround;
    const targetTranslation = getTranslation(target.transform);
    const targetHeight = getHeight(heightmap, targetTranslation)
    targetTranslation[2] = targetHeight;
    const solution = getRocketFiringSolution(weaponTranslation, targetTranslation);
    const lineHeight = userSettings.fontSize *  1.7;

    ctx.save()
    applyTransform(ctx, target.transform)
    if (userSettings.targetSpread && solution.angle && solution.time) {
      ctx.strokeStyle = '#00f';
      ctx.lineWidth = 1 * canvasSizeFactor;
      drawSpreadEllipse(ctx, vec3.subtract(vec3.create(), weaponTranslation, targetTranslation), solution.horizontalSpread, solution.closeSpread, solution.farSpread)
    }
    // firing solution text
    applyTransform(ctx, canvasScaleTransform(camera))
    applyTransform(ctx, newTranslation(10, activeWeaponIndex * lineHeight, 0))
    
    const mil = solution.angle * US_MIL;
    const degrees = solution.angle * 180 / Math.PI;
    const milCapped = mil < 800 ? 0 : mil;
    const milRounded = Math.round(milCapped*10)/10;
    //drawText(canvasCtx, `${dir.toFixed(1)}\u00B0  ${Math.round(dist*10*MAPSCALE)/10}m`, text_x, text_y, 'bottom');
    if (solution.angle &&solution.time){
      outlineText(ctx, `${activeWeapons.length > 1 ? (allWeaponsIndex[weapon.entityId] + 1).toString() + ": " : ""}${degrees.toFixed(1)}°  ${solution.time.toFixed(1)}s`, "bottom", TEXT_RED, TEXT_WHITE, userSettings.fontSize, true);
    } else {
      outlineText(ctx, `No firing solution`, "bottom", TEXT_RED, TEXT_WHITE, userSettings.fontSize * 2/3, true);
    }
    const bottomText = userSettings.targetDistance ? `${solution.dir.toFixed(1)}° ${(solution.dist * MAPSCALE).toFixed(0)}m` : `${solution.dir.toFixed(1)}°`;
    outlineText(ctx, bottomText, "top", TEXT_RED, TEXT_WHITE, userSettings.fontSize * 2 / 3, true);
    ctx.restore()

    drawTargetIcon(ctx, camera, target.transform);

  })
}

const drawHellCannonTarget = (ctx: any, camera:Camera, userSettings: UserSettings, heightmap: Heightmap, weapons: Array<Weapon>, target: Target) => {
  const canvasSizeFactor = mat4.getScaling(vec3.create(), canvasScaleTransform(camera))[0] // uniform scaling
  canonicalEntitySort(weapons);
  const activeWeapons = weapons.filter((w: Weapon) => w.isActive);
  const allWeaponsIndex: any = {};
  weapons.forEach((w: Weapon, index: number) => {
    if (w.isActive){
      allWeaponsIndex[w.entityId] = index;
    }
  })
  activeWeapons.forEach((weapon: Weapon, activeWeaponIndex: number) => {
    const weaponTranslation = getTranslation(weapon.transform);
    const weaponHeight = getHeight(heightmap, weaponTranslation)
    weaponTranslation[2] = weaponHeight +  weapon.heightOverGround;
    const targetTranslation = getTranslation(target.transform);
    const targetHeight = getHeight(heightmap, targetTranslation)
    targetTranslation[2] = targetHeight;
    const solution = getHellCannonFiringSolution(weaponTranslation, targetTranslation);
    const lineHeight = userSettings.fontSize * (userSettings.targetCompactMode ? 1 : 1.7)

    if (userSettings.targetGrid){
      // could remove transform param via a ctxMove(translate: vec3)
      //drawTargetGridMortar(ctx, canvasSizeFactor, weapon.transform, solution);
    }
    ctx.save()
    applyTransform(ctx, target.transform)
    if (userSettings.targetSpread /* && weapons.length < 2 */){
      //console.log("spread", hSpread, closeSpread, farSpread)
      drawHellCannonSpread(ctx, solution, canvasSizeFactor, userSettings.targetSplash);
    } else if (userSettings.targetSplash){
      drawHellCannonSplash(ctx, canvasSizeFactor);
    }
    // firing solution text
    applyTransform(ctx, canvasScaleTransform(camera))

    
    const angleValue = solution.angle / Math.PI * 180;
    
    applyTransform(ctx, newTranslation(10, activeWeaponIndex * lineHeight, 0))
    if (userSettings.targetCompactMode){
      let angleText =  "-----"
      const angleValuePrecision = 1;
      if (solution.angle && angleValue >= 1000){
        angleText = angleValue.toFixed(angleValuePrecision).toString().substr(1, 4 + angleValuePrecision)
      } else if (solution.angle) {
        angleText = angleValue.toFixed(angleValuePrecision).toString().substr(0, 3 + angleValuePrecision)
      }
      if (activeWeapons.length > 1){
        angleText = (allWeaponsIndex[weapon.entityId] + 1).toString() + ": " + angleText;
      }
      outlineText(ctx, angleText, "middle", TEXT_RED, TEXT_WHITE, userSettings.fontSize, true)
    } else {
      let angleText = solution.angle ? `${(angleValue.toFixed(1))}` : "-----"
      if (activeWeapons.length > 1){
        angleText = (allWeaponsIndex[weapon.entityId] + 1).toString() + ": " + angleText;
      }
      outlineText(ctx, angleText, "bottom", TEXT_RED, TEXT_WHITE,  userSettings.fontSize, true)
      const bottomText = userSettings.targetDistance ? `${solution.dir.toFixed(1)}° ${(solution.dist * MAPSCALE).toFixed(0)}m` : `${solution.dir.toFixed(1)}°`
      outlineText(ctx, bottomText, "top", TEXT_RED, TEXT_WHITE, userSettings.fontSize * 2 / 3, true)
    }
    ctx.restore();
  })
  drawTargetIcon(ctx, camera, target.transform);
}