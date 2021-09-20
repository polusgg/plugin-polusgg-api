import fs from "fs/promises";
import path from "path";

import { Player } from "@nodepolus/framework/src/player";
import { Vector2 } from "@nodepolus/framework/src/types";
import { Level } from "@nodepolus/framework/src/types/enums";

export interface ColliderLine {
  ax: number;
  ay: number;
  bx: number;
  by: number;
}

export function linesDoIntersect(
  aax: number,
  aay: number,
  abx: number,
  aby: number,
  bax: number,
  bay: number,
  bbx: number,
  bby: number
) {
  const det = (abx - aax) * (bby - bay) - (bbx - bax) * (aby - aay);

  if (det === 0)
    return false;
  
  const lambda = ((bby - bay) * (bbx - aax) + (bax - bbx) * (bby - aay)) / det;
  const gamma = ((aay - aby) * (bbx - aax) + (abx - aax) * (bby - aay)) / det;
  return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
}

export class ColliderService {
  protected baseCollidersPath = path.resolve(__dirname, "./colliders");
  protected cachedMapColliders: Map<Level, ColliderLine[]> = new Map;

  constructor() {}

  async registerCollidersFor(level: Level) {
    const colliderFilename = path.resolve(this.baseCollidersPath, level + ".json");
    const colliderFileData = await fs.readFile(colliderFilename, "utf8");

    const colliderJson = JSON.parse(colliderFileData);
    const colliders: ColliderLine[] = [];
    for (const colliderShape of colliderJson) {
      for (let i = 1; i < colliderShape.length; i++) {
        const shapeLine = colliderShape[i];
        colliders.push({
          ax: colliderShape[i - 1].x,
          ay: colliderShape[i - 1].y,
          bx: shapeLine.x,
          by: shapeLine.y
        });
      }
    }
    this.cachedMapColliders.set(level, colliders);
  }

  async registerAllColliders() {
    const fileNames = await fs.readdir(this.baseCollidersPath);
    for (const fileName of fileNames) {
      const levelId = path.basename(fileName, ".json");
      await this.registerCollidersFor(parseInt(levelId));
    }
  }

  getCollidersForLevel(level: Level) {
    const cachedColliders = this.cachedMapColliders.get(level);

    if (!cachedColliders) {
      throw new Error("Colliders for level " + Level[level] + " not registered.");
    }

    return cachedColliders;
  }

  getNumCollisions(colliders: ColliderLine[], ax: number, ay: number, bx: number, by: number) {
    let numIntersections = 0;

    for (let i = 0; i < colliders.length; i++) {
      const colliderInQuestion = colliders[i];

      if (linesDoIntersect(
        colliderInQuestion.ax,
        colliderInQuestion.ay,
        colliderInQuestion.bx,
        colliderInQuestion.by,
        ax,
        ay,
        bx,
        by
      )) {
        numIntersections++;
      }
    }

    return numIntersections;
  }

  checkCollisionsForLevel(level: Level, a: Vector2, b: Vector2) {
    return this.getNumCollisions(
      this.getCollidersForLevel(level),
      a.getX(),
      a.getY(),
      b.getX(),
      b.getY()
    ) > 0;
  }

  checkCollisionsBetweenPlayers(playerA: Player, playerB: Player) {
    const playerLobby = playerA.getLobby();
    if (playerLobby !== playerB.getLobby())
      return;

    return this.checkCollisionsForLevel(
      playerLobby.getLevel(),
      playerA.getPosition(),
      playerB.getPosition()
    );
  }
}