import { BaseInnerNetEntity, BaseInnerNetObject } from "@nodepolus/framework/src/protocol/entities/baseEntity";
import { DataPacket, SpawnPacketObject } from "@nodepolus/framework/src/protocol/packets/gameData";
import { MessageReader, MessageWriter } from "@nodepolus/framework/src/util/hazelMessage";
import { BaseRpcPacket } from "@nodepolus/framework/src/protocol/packets/rpc";
import { Connection } from "@nodepolus/framework/src/protocol/connection";
import { RpcPacketType } from "@nodepolus/framework/src/types/enums";

export class InnerClickBehaviour extends BaseInnerNetObject {
  constructor(
    parent: BaseInnerNetEntity,
    public maxTimer: number,
    public currentTime: number = 0,
    public color: [number, number, number, number] = [255, 255, 255, 255],
    public isCountingDown: boolean = true,
    netId: number = parent.getLobby().getHostInstance().getNextNetId(),
  ) {
    super(0x83, parent, netId);
  }

  serializeData(): DataPacket {
    return new DataPacket(this.netId, new MessageWriter()
      .writeFloat32(this.maxTimer)
      .writeFloat32(this.currentTime)
      .writeBoolean(this.isCountingDown)
      .writeBytes(this.color),
    );
  }

  setData(message: MessageReader | MessageWriter): void {
    const reader = MessageReader.fromRawBytes(message);

    this.maxTimer = reader.readFloat32();
    this.currentTime = reader.readFloat32();
    this.isCountingDown = reader.readBoolean();
    this.color = [...reader.readBytes(4).getBuffer()] as [number, number, number, number];
  }

  serializeSpawn(): SpawnPacketObject {
    return new SpawnPacketObject(this.netId, new MessageWriter()
      .writeFloat32(this.maxTimer)
      .writeFloat32(this.currentTime)
      .writeBoolean(this.isCountingDown)
      .writeBytes(this.color),
    );
  }

  clone(): InnerClickBehaviour {
    return new InnerClickBehaviour(this.parent, this.maxTimer, this.currentTime, this.color, this.isCountingDown, this.netId);
  }

  getParent(): BaseInnerNetEntity {
    return this.parent;
  }

  handleRpc(_connection: Connection, type: RpcPacketType, _packet: BaseRpcPacket, _sendTo: Connection[]): void {
    switch (type) {
      case 0x86:
        // console.log("!!! [ ICB Use Fired. Figure out an API to interface with this event ] !!!");
        break;
      default:
        break;
    }
  }
}
