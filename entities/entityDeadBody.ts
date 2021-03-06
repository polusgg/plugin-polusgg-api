import { BaseInnerNetEntity } from "../../../../lib/protocol/entities/types";
import { GLOBAL_OWNER } from "../../../../lib/util/constants";
import { BodyDirection, BodyState } from "../types/enums";
import { LobbyInstance } from "../../../../lib/api/lobby";
import { SpawnFlag } from "../../../../lib/types/enums";
import { InnerDeadBody } from "../innerNetObjects";

// TODO: Rewrite to not suck ass

export class EntityDeadBody extends BaseInnerNetEntity {
  public innerNetObjects: [ InnerDeadBody ];

  get deadBody(): InnerDeadBody {
    return this.innerNetObjects[0];
  }

  constructor(lobby: LobbyInstance, netId: number, bodyState: BodyState, bodyDirection: BodyDirection, color: [number, number, number, number], shadowColor: [number, number, number, number]) {
    super(0x81, lobby, GLOBAL_OWNER, SpawnFlag.None)

    this.innerNetObjects = [
      new InnerDeadBody(netId, this, bodyState, bodyDirection, color, shadowColor),
    ]
  }

  despawn(): void {
    for (let i = 0; i < this.innerNetObjects.length; i++) {
      this.lobby.despawn(this.innerNetObjects[i]);
    }
  }
}
