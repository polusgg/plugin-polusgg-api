import { GameDataPacket } from "@nodepolus/framework/src/protocol/packets/root";
import { Connection } from "@nodepolus/framework/src/protocol/connection";
import { EdgeAlignments } from "../../types/enums/edgeAlignment";
import { Vector2 } from "@nodepolus/framework/src/types";
import { BodyDirection } from "../../types/enums";
import { EntityDeadBody } from "../../entities";

export class DeadBodyService {
  async spawnFor(forConnection: Connection, { color, shadowColor, position, hasFallen, bodyFacing, alignment, z, attachedTo }: {
    color: [number, number, number, number] | number[];
    shadowColor: [number, number, number, number] | number[];
    position: Vector2;
    hasFallen?: boolean;
    bodyFacing?: BodyDirection;
    alignment?: EdgeAlignments;
    z?: number;
    attachedTo?: number;
  }): Promise<EntityDeadBody> {
    const entity = new EntityDeadBody(forConnection.getSafeLobby(), color as [number, number, number, number], shadowColor as [number, number, number, number], position, hasFallen, bodyFacing, alignment, z, attachedTo);

    await forConnection.writeReliable(new GameDataPacket([entity.serializeSpawn()], entity.getLobby().getCode()));

    return entity;
  }
}
