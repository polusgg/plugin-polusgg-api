import { DataPacket, RpcPacket } from "@nodepolus/framework/src/protocol/packets/gameData";
import { GameDataPacket } from "@nodepolus/framework/src/protocol/packets/root";
import { SnapToPacket } from "../../../packets/rpc/customNetworkTransform";
import { ClickBehaviourEvents } from "../../../events/clickBehaviour";
import { EdgeAlignments } from "../../../types/enums/edgeAlignment";
import { Vector2 } from "@nodepolus/framework/src/types";
import { EntityButton } from "../../../entities";
import Emittery from "emittery";

export type ButtonEvents = ClickBehaviourEvents;

export class Button extends Emittery<ButtonEvents> {
  constructor(
    protected readonly entity: EntityButton,
  ) {
    super();
  }

  getEntity(): EntityButton {
    return this.entity;
  }

  async setPosition(x: number, y: number): Promise<void>;
  async setPosition(position: Exclude<EdgeAlignments, EdgeAlignments.None> | Vector2): Promise<void>;
  async setPosition(arg0: Exclude<EdgeAlignments, EdgeAlignments.None> | Vector2 | number, arg1?: number): Promise<void> {
    let data: DataPacket;

    if (arg0 instanceof Vector2 || arg1 !== undefined) {
      // we are setting the position of the button to a Vec2,
      // because of this: if the button has an EdgeAlignment we
      // want to override this with our Vec2
      if (this.entity.getCustomNetworkTransform().getAlignment() !== EdgeAlignments.None) {
        this.entity.getCustomNetworkTransform().setAlignment(EdgeAlignments.None);
      }

      let position: Vector2;

      if (arg0 instanceof Vector2) {
        position = arg0;
      } else {
        position = new Vector2(arg0, arg1!);
      }

      data = this.entity.getCustomNetworkTransform().setPosition(position).serializeData();
    } else {
      data = this.entity.getCustomNetworkTransform().setAlignment(arg0).serializeData();
    }

    return this.entity.getLobby().findSafeConnection(this.entity.getOwnerId()).writeReliable(new GameDataPacket([data], this.entity.getLobby().getCode()));
  }

  async snapPosition(x: number, y: number): Promise<void>;
  async snapPosition(position: EdgeAlignments | Vector2): Promise<void>;
  async snapPosition(arg0: EdgeAlignments | Vector2 | number, arg1?: number): Promise<void> {
    const connection = this.entity.getLobby().findSafeConnection(this.entity.getOwnerId());

    if (arg0 instanceof Vector2 || arg1 !== undefined) {
      // we are setting the position of the button to a Vec2,
      // because of this: if the button has an EdgeAlignment we
      // want to override this with our Vec2
      if (this.entity.getCustomNetworkTransform().getAlignment() !== EdgeAlignments.None) {
        this.entity.getCustomNetworkTransform().setAlignment(EdgeAlignments.None);
      }

      let position: Vector2;

      if (arg0 instanceof Vector2) {
        position = arg0;
      } else {
        position = new Vector2(arg0, arg1!);
      }

      return connection.writeReliable(new GameDataPacket([
        new RpcPacket(this.entity.getCustomNetworkTransform().getNetId(), new SnapToPacket(position)),
      ], this.entity.getLobby().getCode()));
    }

    const data = this.entity.getCustomNetworkTransform().setAlignment(arg0).serializeData();

    return connection.writeReliable(new GameDataPacket([data], this.entity.getLobby().getCode()));
  }

  getPosition(): Exclude<EdgeAlignments | Vector2, EdgeAlignments.None> {
    const alignment = this.entity.getCustomNetworkTransform().getAlignment();
    const position = this.entity.getCustomNetworkTransform().getPosition();

    return alignment === EdgeAlignments.None ? position : alignment;
  }
}
