import { BaseInnerNetObject } from "../../../../lib/protocol/entities/types";
import { DataPacket } from "../../../../lib/protocol/packets/gameData";
import { SpawnInnerNetObject } from "../../../../lib/protocol/packets/gameData/types";
import { MessageReader, MessageWriter } from "../../../../lib/util/hazelMessage";
import { DeadBodyEntity } from "../entities/deadBody";

export enum BodyState {
  Standing,
  Falling,
  Lying,
}

export enum BodyDirection {
  FacingLeft  = 0,
  FacingRight = 1,
  // Note: BodyDirections are serialized as booleans, so more than two can not exist. anything after 1 will be cast down to 1
}

export class DeadBodyObject extends BaseInnerNetObject {
  constructor(
    netId: number,
    parent: DeadBodyEntity,
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

  clone(): DeadBodyObject {
    return new DeadBodyObject(this.netId, this.parent, this.bodyState, this.bodyDirection, this.color, this.shadowColor);
  }
}
