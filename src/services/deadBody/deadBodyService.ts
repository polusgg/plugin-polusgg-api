import { GameDataPacket } from "@nodepolus/framework/src/protocol/packets/root";
import { Connection } from "@nodepolus/framework/src/protocol/connection";
import { EdgeAlignments } from "../../types/enums/edgeAlignment";
import { Vector2 } from "@nodepolus/framework/src/types";
import { BodyDirection } from "../../types/enums";
import { EntityDeadBody } from "../../entities";
import { DeadBody } from "./deadBody";
import { LobbyInstance } from "@nodepolus/framework/src/api/lobby";
import { RpcPacket } from "@nodepolus/framework/src/protocol/packets/gameData";
import { ClickPacket } from "../../packets/rpc/clickBehaviour";
import { BaseInnerNetObject } from "@nodepolus/framework/src/protocol/entities/baseEntity";

export class DeadBodyService {
  protected bodyMap: Map<LobbyInstance, Map<number, DeadBody>> = new Map();

  constructor() {
    RpcPacket.registerPacket(0x91, ClickPacket.deserialize, this.handleClickBody.bind(this));
  }

  async spawnFor(forConnection: Connection, { color, shadowColor, position, hasFallen, playerId, bodyFacing, alignment, z, attachedTo }: {
    color: [number, number, number, number] | number[];
    shadowColor: [number, number, number, number] | number[];
    position: Vector2;
    playerId?: number;
    hasFallen?: boolean;
    bodyFacing?: BodyDirection;
    alignment?: EdgeAlignments;
    z?: number;
    attachedTo?: number;
  }): Promise<DeadBody> {
    const entity = new EntityDeadBody(forConnection.getSafeLobby(), color as [number, number, number, number], shadowColor as [number, number, number, number], position, playerId, hasFallen, bodyFacing, alignment, z, attachedTo);

    await forConnection.writeReliable(new GameDataPacket([entity.serializeSpawn()], entity.getLobby().getCode()));

    const body = new DeadBody(entity);

    if (!this.bodyMap.has(forConnection.getLobby()!)) {
      this.bodyMap.set(forConnection.getLobby()!, new Map());
    }

    this.bodyMap.get(forConnection.getLobby()!)!.set(entity.getDeadBody().getNetId(), body);

    return body;
  }

  handleClickBody(connection: Connection, packet: ClickPacket, sender?: BaseInnerNetObject): void {
    if (sender === undefined) {
      return;
    }

    if (sender.getType() as number !== 0x83) {
      return;
    }

    this.bodyMap.get(connection.getLobby()!)!.get(sender.getNetId())!.emit("clicked", { connection, packet });
  }

  spawn(forLobby: LobbyInstance, { color, shadowColor, position, hasFallen, playerId, bodyFacing, alignment, z, attachedTo }: {
    color: [number, number, number, number] | number[];
    shadowColor: [number, number, number, number] | number[];
    position: Vector2;
    playerId?: number;
    hasFallen?: boolean;
    bodyFacing?: BodyDirection;
    alignment?: EdgeAlignments;
    z?: number;
    attachedTo?: number;
  }, sendTo: Connection[] = forLobby.getConnections()): EntityDeadBody {
    const entity = new EntityDeadBody(forLobby, color as [number, number, number, number], shadowColor as [number, number, number, number], position, playerId, hasFallen, bodyFacing, alignment, z, attachedTo);

    forLobby.spawn(entity, sendTo);

    return entity;
  }
}
