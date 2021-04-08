import { LobbyInstance } from "@nodepolus/framework/src/api/lobby";
import { BaseInnerNetEntity } from "@nodepolus/framework/src/protocol/entities/baseEntity";
import { SpawnFlag } from "@nodepolus/framework/src/types/enums";
import { GLOBAL_OWNER } from "@nodepolus/framework/src/util/constants";
import { InnerVent } from "../innerNetObjects/innerVent";

export class EntityVent extends BaseInnerNetEntity {
  constructor(
    lobby: LobbyInstance,
    ventId: number,
    leftConnection: number,
    rightConnection: number,
    centerConnection: number,
    ventSpriteResourceId: number,
    enterVentAnimationResourceId: number,
    exitVentAnimationResourceId: number,
    ventNetId: number = lobby.getHostInstance().getNextNetId(),
  ) {
    super(0x84, lobby, GLOBAL_OWNER, SpawnFlag.None);

    this.innerNetObjects = [
      new InnerVent(this, ventNetId, ventSpriteResourceId, enterVentAnimationResourceId, exitVentAnimationResourceId, ventId, leftConnection, rightConnection, centerConnection),
    ];
  }

  getVent(): InnerVent {
    return this.getObject(0);
  }

  despawn(): void {
    for (let i = 0; i < this.innerNetObjects.length; i++) {
      this.lobby.despawn(this.innerNetObjects[i]);
    }
  }
}
