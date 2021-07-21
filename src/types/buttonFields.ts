import { Vector2 } from "@nodepolus/framework/src/types";
import { Asset } from "../assets";
import { EdgeAlignments } from "./enums/edgeAlignment";
import { Attachable } from "./attachable";

export type ButtonFields = {
  asset: Asset;
  position: Vector2;
  maxTimer: number;
  currentTime?: number;
  saturated?: boolean;
  color?: [number, number, number, number];
  isCountingDown?: boolean;
  alignment: EdgeAlignments;
  z?: number;
  attachedTo?: Attachable;
};
