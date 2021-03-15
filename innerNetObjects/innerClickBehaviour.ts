import { Connection } from "../../../../lib/protocol/connection";
import { BaseInnerNetEntity, BaseInnerNetObject } from "../../../../lib/protocol/entities/baseEntity";
import { DataPacket, SpawnPacketObject } from "../../../../lib/protocol/packets/gameData";
import { BaseRpcPacket } from "../../../../lib/protocol/packets/rpc";
import { RpcPacketType } from "../../../../lib/types/enums";
import { MessageReader, MessageWriter } from "../../../../lib/util/hazelMessage";

// TODO: Rewrite to not suck ass

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
    return this.serializeData() as unknown as SpawnPacketObject;
  }

  clone(): InnerClickBehaviour {
    return new InnerClickBehaviour(this.parent, this.maxTimer, this.currentTime, this.color, this.isCountingDown, this.netId);
  }

  getParent(): BaseInnerNetEntity {
    return this.parent;
  }

  handleRpc(_connection: Connection, type: RpcPacketType, _packet: BaseRpcPacket, _sendTo: Connection[]): void {
    switch (type) {
      case 0x8e:
        console.log("!!! [ ICB Use Fired. Figure out an API to interface with this event ] !!!");
        break;
      default:
        break;
    }
  }
}
