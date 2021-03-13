import { DataPacket, SpawnPacketObject } from "../../../../lib/protocol/packets/gameData";
import { BaseInnerNetObject } from "../../../../lib/protocol/entities/baseEntity";
import { MessageReader, MessageWriter } from "../../../../lib/util/hazelMessage";
import { BodyDirection, BodyState } from "../types/enums";
import { EntityDeadBody } from "../entities";

// TODO: Rewrite to not suck ass

export class InnerDeadBody extends BaseInnerNetObject {
  constructor(
    parent: EntityDeadBody,
    public color: [number, number, number, number],
    public shadowColor: [number, number, number, number],
    public bodyState: BodyState = BodyState.Lying,
    public bodyDirection: BodyDirection = BodyDirection.FacingRight,
    netId: number = parent.getLobby().getHostInstance().getNextNetId(),
  ) {
    super(0x81, parent, netId);
  }

  serializeData(): DataPacket {
    return new DataPacket(
      this.netId,
      new MessageWriter()
        .writeByte(this.bodyState)
        .writeBoolean(!!this.bodyDirection)
        .writeBytes(this.color)
        .writeBytes(this.shadowColor),
    );
  }

  getParent(): EntityDeadBody {
    return this.parent as EntityDeadBody;
  }

  setData(packet: MessageReader | MessageWriter): void {
    const reader = MessageReader.fromRawBytes(packet);

    this.bodyState = reader.readByte();
    this.bodyDirection = reader.readBoolean() ? 1 : 0;
    this.color = [...reader.readBytes(4).getBuffer()] as [number, number, number, number];
    this.shadowColor = [...reader.readBytes(4).getBuffer()] as [number, number, number, number];
  }

  serializeSpawn() {
    return this.serializeData() as unknown as SpawnPacketObject;
  }

  clone(): InnerDeadBody {
    return new InnerDeadBody(this.getParent(), this.color, this.shadowColor, this.bodyState, this.bodyDirection, this.netId);
  }

  handleRpc(connection, type, packet, sendTo) {}
}
