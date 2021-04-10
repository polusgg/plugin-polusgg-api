import { BaseInnerNetEntity, BaseInnerNetObject } from "@nodepolus/framework/src/protocol/entities/baseEntity";
import { DataPacket, SpawnPacketObject } from "@nodepolus/framework/src/protocol/packets/gameData";
import { InnerCustomNetworkTransform } from "@nodepolus/framework/src/protocol/entities/player";
import { MessageReader, MessageWriter } from "@nodepolus/framework/src/util/hazelMessage";
import { InnerNetObjectType, RpcPacketType } from "@nodepolus/framework/src/types/enums";
import { BaseRpcPacket } from "@nodepolus/framework/src/protocol/packets/rpc";
import { Connection } from "@nodepolus/framework/src/protocol/connection";
import { SnapToPacket } from "../packets/rpc/customNetworkTransform";
import { EdgeAlignments } from "../types/enums/edgeAlignment";
import { Vector2 } from "@nodepolus/framework/src/types";
import { Player } from "@nodepolus/framework/src/player";
import { Attachable } from "../types/attachable";

export class InnerCustomNetworkTransformGeneric extends BaseInnerNetObject {
  constructor(
    protected readonly parent: BaseInnerNetEntity,
    protected alignment: EdgeAlignments = EdgeAlignments.None,
    protected position: Vector2 = Vector2.zero(),
    protected attachedTo: number = -1,
    netId: number = parent.getLobby().getHostInstance().getNextNetId(),
  ) {
    super(InnerNetObjectType.CustomNetworkTransform, parent, netId);
  }

  getPosition(): Vector2 {
    return this.position;
  }

  setPosition(position: Vector2): this {
    this.position = position;

    return this;
  }

  getAlignment(): EdgeAlignments {
    return this.alignment;
  }

  setAlignment(alignment: EdgeAlignments): this {
    this.alignment = alignment;

    return this;
  }

  snapTo(position: Vector2, sendTo?: Connection[]): void {
    this.position = position;
    this.sendRpcPacket(new SnapToPacket(position), sendTo);
  }

  handleRpc(connection: Connection, type: RpcPacketType, packet: BaseRpcPacket, sendTo: Connection[]): void {
    switch (type) {
      case RpcPacketType.SnapTo:
        this.snapTo((packet as SnapToPacket).position, sendTo);
        break;
      default:
        break;
    }
  }

  getParent(): BaseInnerNetEntity {
    return this.parent;
  }

  serializeData(): DataPacket {
    const writer = new MessageWriter().writeByte(this.alignment);

    return new DataPacket(
      this.netId,
      writer.writeVector2(this.position),
    );
  }

  setData(packet: MessageReader | MessageWriter): void {
    const reader = MessageReader.fromRawBytes(packet.getBuffer());

    this.position = reader.readVector2();
    this.attachedTo = reader.readPackedInt32();
  }

  serializeSpawn(): SpawnPacketObject {
    const writer = new MessageWriter().writeByte(this.alignment);

    return new SpawnPacketObject(
      this.netId,
      writer.writeVector2(this.position).writePackedInt32(this.attachedTo),
    );
  }

  clone(): InnerCustomNetworkTransformGeneric {
    return new InnerCustomNetworkTransformGeneric(this.parent, this.alignment, this.position, this.netId);
  }

  setAttachedTo(object: Attachable): this {
    this.attachedTo = this.findOwner(object);

    return this;
  }

  protected findOwner(object: Attachable): number {
    if (object instanceof Player) {
      return object.getEntity().getCustomNetworkTransform().getNetId();
    }

    if (object instanceof BaseInnerNetEntity) {
      return object.getCustomNetworkTransform().getNetId();
    }

    if (object instanceof InnerCustomNetworkTransform || object instanceof InnerCustomNetworkTransformGeneric) {
      return object.getNetId();
    }

    console.log(object);
    throw new Error("Could not find owner of object");
  }
}
