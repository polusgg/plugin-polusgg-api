import { BaseInnerNetEntity } from "../../../../lib/protocol/entities/baseEntity";
import { GLOBAL_OWNER } from "../../../../lib/util/constants";
import { BodyDirection, BodyState } from "../types/enums";
import { LobbyInstance } from "../../../../lib/api/lobby";
import { SpawnFlag } from "../../../../lib/types/enums";
import { InnerDeadBody } from "../innerNetObjects";

// TODO: Rewrite to not suck ass

export class EntityDeadBody extends BaseInnerNetEntity {
  constructor(
    lobby: LobbyInstance,
    color: [number, number, number, number],
    shadowColor: [number, number, number, number],
    bodyState: BodyState = BodyState.Lying,
    bodyDirection: BodyDirection = BodyDirection.FacingRight,
    deadBodyNetId: number = lobby.getHostInstance().getNextNetId(),
  ) {
    super(0x83, lobby, GLOBAL_OWNER, SpawnFlag.None);

    this.innerNetObjects = [
      new InnerDeadBody(this, color, shadowColor, bodyState, bodyDirection, deadBodyNetId),
    ];
  }

  getDeadBody(): InnerDeadBody {
    return this.getObject(0);
  }

  despawn(): void {
    for (let i = 0; i < this.innerNetObjects.length; i++) {
      this.lobby.despawn(this.innerNetObjects[i]);
    }
  }
}
