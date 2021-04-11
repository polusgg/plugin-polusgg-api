import { Connection } from "@nodepolus/framework/src/protocol/connection";
import { BaseInnerNetEntity, BaseInnerNetObject } from "@nodepolus/framework/src/protocol/entities/baseEntity";
import { DataPacket, SpawnPacketObject } from "@nodepolus/framework/src/protocol/packets/gameData";
import { BaseRpcPacket } from "@nodepolus/framework/src/protocol/packets/rpc";
import { RpcPacketType } from "@nodepolus/framework/src/types/enums";
import { MessageReader, MessageWriter } from "@nodepolus/framework/src/util/hazelMessage";

// TODO: Rewrite to not suck ass

export class InnerGraphic extends BaseInnerNetObject {
  constructor(
    parent: BaseInnerNetEntity,
    protected resourceId: number,
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

  setAsset(id: number): this {
    this.resourceId = id;

    return this;
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
