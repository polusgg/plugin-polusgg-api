import { BaseInnerNetEntity, BaseInnerNetObject } from "../../../../lib/protocol/entities/types";
import { SpawnInnerNetObject } from "../../../../lib/protocol/packets/gameData/types";
import { MessageReader, MessageWriter } from "../../../../lib/util/hazelMessage";
import { DataPacket } from "../../../../lib/protocol/packets/gameData";

// TODO: Rewrite to not suck ass

export class InnerGraphic extends BaseInnerNetObject {
  constructor(
    netId: number,
    parent: BaseInnerNetEntity,
    public resourceId: number,
    public width: number,
    public height: number,
  ) {
    super(0x80, netId, parent);
  }

  clone(): InnerGraphic {
    return new InnerGraphic(this.netId, this.parent, this.resourceId, this.width, this.height);
  }

  getData(): DataPacket {
    return new DataPacket(
      this.netId,
      new MessageWriter()
        .writePackedUInt32(this.resourceId)
        .writePackedUInt32(this.width)
        .writePackedUInt32(this.height),
    );
  }

  setData(packet: MessageReader | MessageWriter): void {
    const reader = MessageReader.fromRawBytes(packet);

    this.resourceId = reader.readPackedUInt32();
    this.width = reader.readPackedUInt32();
    this.height = reader.readPackedUInt32();
  }

  serializeSpawn(): SpawnInnerNetObject {
    return this.getData() as SpawnInnerNetObject;
  }
}
