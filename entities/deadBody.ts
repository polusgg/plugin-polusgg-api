import { LobbyInstance } from "../../../../lib/api/lobby";
import { BaseInnerNetEntity } from "../../../../lib/protocol/entities/types";
import { SpawnFlag } from "../../../../lib/types/enums";
import { GLOBAL_OWNER } from "../../../../lib/util/constants";
import { BodyDirection, BodyState, DeadBodyObject } from "../innerNetObjects/deadBody";

export class DeadBodyEntity extends BaseInnerNetEntity {
  public innerNetObjects: [ DeadBodyObject ];

  get deadBody(): DeadBodyObject {
    return this.innerNetObjects[0];
  }

  constructor(lobby: LobbyInstance, netId: number, bodyState: BodyState, bodyDirection: BodyDirection, color: [number, number, number, number], shadowColor: [number, number, number, number]) {
    super(0x81, lobby, GLOBAL_OWNER, SpawnFlag.None)

    this.innerNetObjects = [
      new DeadBodyObject(netId, this, bodyState, bodyDirection, color, shadowColor),
    ]
  }

  despawn(): void {
    for (let i = 0; i < this.innerNetObjects.length; i++) {
      this.lobby.despawn(this.innerNetObjects[i]);
    }
  }
}
