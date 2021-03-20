import { Connection } from "../../../../lib/protocol/connection";
import { BaseInnerNetEntity, BaseInnerNetObject } from "../../../../lib/protocol/entities/baseEntity";
import { DataPacket, SpawnPacketObject } from "../../../../lib/protocol/packets/gameData";
import { BaseRpcPacket } from "../../../../lib/protocol/packets/rpc";
import { RpcPacketType } from "../../../../lib/types/enums";
import { MessageReader, MessageWriter } from "../../../../lib/util/hazelMessage";

// TODO: Rewrite to not suck ass

export class InnerGraphic extends BaseInnerNetObject {
  constructor(
    parent: BaseInnerNetEntity,
    public resourceId: number,
    netId: number = parent.getLobby().getHostInstance().getNextNetId(),
  ) {
    super(0x80, parent, netId);
  }

  clone(): InnerGraphic {
    return new InnerGraphic(this.parent, this.resourceId, this.netId);
  }

  serializeData(): DataPacket {
    return new DataPacket(
      this.netId,
      new MessageWriter()
        .writePackedUInt32(this.resourceId),
    );
  }

  setData(packet: MessageReader | MessageWriter): void {
    const reader = MessageReader.fromRawBytes(packet);

    this.resourceId = reader.readPackedUInt32();
  }

  serializeSpawn(): SpawnPacketObject {
    return new SpawnPacketObject(
      this.netId,
      new MessageWriter()
        .writePackedUInt32(this.resourceId),
    );
  }

  getParent(): BaseInnerNetEntity {
    return this.parent;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  handleRpc(_connection: Connection, _type: RpcPacketType, _packet: BaseRpcPacket, _sendTo: Connection[]): void {}
}
