import { SpawnInnerNetObject } from "../../../../lib/protocol/packets/gameData/types";
import { MessageReader, MessageWriter } from "../../../../lib/util/hazelMessage";
import { BaseInnerNetObject } from "../../../../lib/protocol/entities/types";
import { DataPacket } from "../../../../lib/protocol/packets/gameData";
import { BodyDirection, BodyState } from "../types/enums";
import { EntityDeadBody } from "../entities";

// TODO: Rewrite to not suck ass

export class InnerDeadBody extends BaseInnerNetObject {
  constructor(
    netId: number,
    parent: EntityDeadBody,
    public bodyState: BodyState,
    public bodyDirection: BodyDirection,
    public color: [number, number, number, number],
    public shadowColor: [number, number, number, number],
  ) {
    super(0x81, netId, parent);
  }

  getData(): DataPacket {
    return new DataPacket(
      this.netId,
      new MessageWriter()
        .writeByte(this.bodyState)
        .writeBoolean(!!this.bodyDirection)
        .writeBytes(this.color)
        .writeBytes(this.shadowColor),
    );
  }

  setData(packet: MessageReader | MessageWriter): void {
    const reader = MessageReader.fromRawBytes(packet);

    this.bodyState = reader.readByte();
    this.bodyDirection = reader.readBoolean() ? 1 : 0;
    this.color = [...reader.readBytes(4).getBuffer()] as [number, number, number, number];
    this.shadowColor = [...reader.readBytes(4).getBuffer()] as [number, number, number, number];
  }

  serializeSpawn(): SpawnInnerNetObject {
    return this.getData() as SpawnInnerNetObject;
  }

  clone(): InnerDeadBody {
    return new InnerDeadBody(this.netId, this.parent, this.bodyState, this.bodyDirection, this.color, this.shadowColor);
  }
}
