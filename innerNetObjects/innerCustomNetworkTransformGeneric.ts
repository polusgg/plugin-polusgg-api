import { BaseInnerNetEntity, BaseInnerNetObject } from "../../../../lib/protocol/entities/baseEntity";
import { InnerNetObjectType, RpcPacketType } from "../../../../lib/types/enums";
import { DataPacket, SpawnPacketObject } from "../../../../lib/protocol/packets/gameData";
import { BaseRpcPacket } from "../../../../lib/protocol/packets/rpc";
import { MessageReader, MessageWriter } from "../../../../lib/util/hazelMessage";
import { Connection } from "../../../../lib/protocol/connection";
import { Vector2 } from "../../../../lib/types";
import { EdgeAlignments } from "../types/enums/edgeAlignment";
import { SnapToPacket } from "../packets/rpc/customNetworkTransform";

export class InnerCustomNetworkTransformGeneric extends BaseInnerNetObject {
  constructor(
    protected readonly parent: BaseInnerNetEntity,
    protected alignment: EdgeAlignments = EdgeAlignments.None,
    protected position: Vector2 = Vector2.zero(),
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

  // todo add get/set methods!!!

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
  }

  serializeSpawn(): SpawnPacketObject {
    const writer = new MessageWriter().writeByte(this.alignment);

    return new SpawnPacketObject(
      this.netId,
      writer.writeVector2(this.position),
    );
  }

  clone(): InnerCustomNetworkTransformGeneric {
    return new InnerCustomNetworkTransformGeneric(this.parent, this.alignment, this.position, this.netId);
  }
}
