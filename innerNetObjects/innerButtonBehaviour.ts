import { BaseInnerNetEntity, BaseInnerNetObject } from "../../../../lib/protocol/entities/types";
import { SpawnInnerNetObject } from "../../../../lib/protocol/packets/gameData/types";
import { MessageReader, MessageWriter } from "../../../../lib/util/hazelMessage";
import { DataPacket } from "../../../../lib/protocol/packets/gameData";

// TODO: Rewrite to not suck ass

export class InnerButtonBehaviour extends BaseInnerNetObject {
  constructor(
    netId: number,
    parent: BaseInnerNetEntity,
    public maxTimer: number,
    public currentTime: number,
    public isCountingDown: boolean,
    public color: [number, number, number, number],
  ) {
    super(0x83, netId, parent);
  }

  getData(): DataPacket {
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

  serializeSpawn(): SpawnInnerNetObject {
    return this.getData() as SpawnInnerNetObject;
  }

  clone(): InnerButtonBehaviour {
    return new InnerButtonBehaviour(this.netId, this.parent, this.maxTimer, this.currentTime, this.isCountingDown, this.color);
  }
}
