import { BaseInnerNetObject, BaseInnerNetEntity } from "../../../../lib/protocol/entities/types";
import { SpawnInnerNetObject } from "../../../../lib/protocol/packets/gameData/types";
import { InnerNetObjectType } from "../../../../lib/protocol/entities/types/enums";
import { MessageWriter, MessageReader } from "../../../../lib/util/hazelMessage";
import { DataPacket } from "../../../../lib/protocol/packets/gameData";
import { SnapToPacket } from "../../../../lib/protocol/packets/rpc";
import { Connection } from "../../../../lib/protocol/connection";
import { Vector2 } from "../../../../lib/types";

// TODO: Rewrite to not suck ass

export class InnerCustomNetworkTransform extends BaseInnerNetObject {
  constructor(
    netId: number,
    public readonly parent: BaseInnerNetEntity,
    public sequenceId: number,
    public position: Vector2,
    public velocity: Vector2,
  ) {
    super(InnerNetObjectType.CustomNetworkTransform, netId, parent);
  }

  async snapTo(position: Vector2, sendTo: Connection[]): Promise<void> {
    this.position = position;
    this.velocity = new Vector2(0, 0);
    this.sequenceId += 5;

    this.sendRpcPacketTo(sendTo, new SnapToPacket(this.position, this.sequenceId));
  }

  getData(): DataPacket {
    return new DataPacket(
      this.netId,
      new MessageWriter()
        .writeUInt16(this.sequenceId)
        .writeVector2(this.position)
        .writeVector2(this.velocity),
    );
  }

  async setData(packet: MessageReader | MessageWriter): Promise<void> {
    const reader = MessageReader.fromRawBytes(packet.getBuffer());

    this.sequenceId = reader.readUInt16();
    this.position = reader.readVector2();
    this.velocity = reader.readVector2();
  }

  serializeSpawn(): SpawnInnerNetObject {
    return new SpawnInnerNetObject(
      this.netId,
      new MessageWriter()
        .writeUInt16(this.sequenceId)
        .writeVector2(this.position)
        .writeVector2(this.velocity),
    );
  }

  clone(): InnerCustomNetworkTransform {
    return new InnerCustomNetworkTransform(this.netId, this.parent, this.sequenceId, this.position, this.velocity);
  }
}
