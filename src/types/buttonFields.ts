import { Vector2 } from "@polusgg/plugin-polusgg-api/node_modules/@nodepolus/framework/src/types";
import { Asset } from "@polusgg/plugin-polusgg-api/src/assets";
import { EdgeAlignments } from "@polusgg/plugin-polusgg-api/src/types/enums/edgeAlignment";

export type ButtonFields = {
  asset: Asset;
  position: Vector2;
  maxTimer: number;
  currentTime?: number;
  saturated?: boolean;
  color?: [number, number, number, number];
  isCountingDown?: boolean;
  alignment: EdgeAlignments;
}