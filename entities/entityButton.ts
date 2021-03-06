import { InnerButtonBehaviour, InnerClickBehaviour, InnerCustomNetworkTransform, InnerGraphic } from "../innerNetObjects";
import { InnerPlayerControl, InnerPlayerPhysics } from "../../../../lib/protocol/entities/player";
import { BaseInnerNetEntity } from "../../../../lib/protocol/entities/types";
import { LobbyInstance } from "../../../../lib/api/lobby";
import { SpawnFlag } from "../../../../lib/types/enums";
import { Vector2 } from "../../../../lib/types";

// TODO: Rewrite to not suck ass

export class EntityButton extends BaseInnerNetEntity {
  public innerNetObjects: [InnerCustomNetworkTransform, InnerGraphic] | [InnerCustomNetworkTransform, InnerGraphic, InnerClickBehaviour] | [InnerCustomNetworkTransform, InnerGraphic, InnerClickBehaviour, InnerButtonBehaviour]

  get customNetworkTransform(): InnerCustomNetworkTransform {
    return this.innerNetObjects[0];
  }

  get graphic(): InnerGraphic {
    return this.innerNetObjects[1];
  }

  get clickBehaviour(): InnerClickBehaviour | undefined {
    return this.innerNetObjects[2];
  }

  get buttonBehaviour(): InnerButtonBehaviour | undefined {
    return this.innerNetObjects[3];
  }

  get playerControl(): InnerPlayerControl {
    throw new Error("NodePolus expects the owner of a customNetworkTransform to be a EntityPlayer. To satisfy this typing, Buttons have a playerControl and playerPhysics. If this error is thrown, it likely means that the customNetworkTransform is not being properly used")
  }

  get playerPhysics(): InnerPlayerPhysics {
    throw new Error("NodePolus expects the owner of a customNetworkTransform to be a EntityPlayer. To satisfy this typing, Buttons have a playerControl and playerPhysics. If this error is thrown, it likely means that the customNetworkTransform is not being properly used")
  }

  constructor(
    lobby: LobbyInstance,
    owner: number,
    customNetworkTransformNetId: number,
    sequenceId: number,
    position: Vector2,
    velocity: Vector2,
    graphicNetId: number,
    graphicResourceId: number,
    graphicWidth: number,
    graphicHeight: number,
    clickBehaviourNetId?: number,
    buttonBehaviourNetId?: number,
    buttonBehaviourMaxTimer?: number,
    buttonBehaviourCurrentTime?: number,
    buttonBehaviourIsCountingDown?: boolean,
    buttonBehaviourColor?: [number, number, number, number]
  ) {
    super(0x80, lobby, owner, SpawnFlag.None);

    if (clickBehaviourNetId === undefined) {
      this.innerNetObjects = [
        new InnerCustomNetworkTransform(customNetworkTransformNetId, this, sequenceId, position, velocity),
        new InnerGraphic(graphicNetId, this, graphicResourceId, graphicWidth, graphicHeight),
      ]
    } else {
      if (buttonBehaviourNetId === undefined) {
        this.innerNetObjects = [
          new InnerCustomNetworkTransform(customNetworkTransformNetId, this, sequenceId, position, velocity),
          new InnerGraphic(graphicNetId, this, graphicResourceId, graphicWidth, graphicHeight),
          new InnerClickBehaviour(clickBehaviourNetId, this),
        ]
      } else {
        this.innerNetObjects = [
          new InnerCustomNetworkTransform(customNetworkTransformNetId, this, sequenceId, position, velocity),
          new InnerGraphic(graphicNetId, this, graphicResourceId, graphicWidth, graphicHeight),
          new InnerClickBehaviour(clickBehaviourNetId, this),
          new InnerButtonBehaviour(buttonBehaviourNetId, this, buttonBehaviourMaxTimer!, buttonBehaviourCurrentTime!, buttonBehaviourIsCountingDown!, buttonBehaviourColor!)
        ]
      }
    }
  }

  despawn(): void {
    for (let index = 0; index < this.innerNetObjects.length; index++) {
      const element = this.innerNetObjects[index];

      if (element !== undefined) {
        this.lobby.despawn(element);
      }
    }
  }
}
