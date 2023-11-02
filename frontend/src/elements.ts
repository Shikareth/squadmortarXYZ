import { SVGBuffer } from "./common/svgBuffer";
import { S5Map } from "./s5/s5map";

export const $tooltip = document.getElementById('dbg');
export const $map_name = document.getElementById('map-name');
export const $canvas = document.getElementById('canvas') as HTMLCanvasElement;
export const $s5canvas = document.getElementById('s5canvas') as HTMLCanvasElement;
export const $s5image = document.getElementById('s5image') as HTMLImageElement;
export const $contourmap_canvas = document.getElementById('contourmap_canvas') as HTMLCanvasElement;


export const $s5map = new S5Map($s5image, $s5canvas);
export const $contourmap =  new SVGBuffer("", $contourmap_canvas);
export const $websocketRef: {ws: WebSocket | null} = {ws: null};