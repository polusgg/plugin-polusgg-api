import { BaseInnerNetEntity, BaseInnerNetObject } from "../../../../lib/protocol/entities/baseEntity";
import { DataPacket, SpawnPacketObject } from "../../../../lib/protocol/packets/gameData";
import { MessageReader, MessageWriter } from "../../../../lib/util/hazelMessage";

// TODO: Rewrite to not suck ass

export class InnerCooldownBehaviour extends BaseInnerNetObject {
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
      .writeBytes(this.color)
      .writeFloat32(this.maxTimer)
      .writeFloat32(this.currentTime)
      .writeBoolean(this.isCountingDown),
    );
  }

  setData(message: MessageReader | MessageWriter): void {
    const reader = MessageReader.fromRawBytes(message);

    this.color = [...reader.readBytes(4).getBuffer()] as [number, number, number, number];
    this.maxTimer = reader.readFloat32();
    this.currentTime = reader.readFloat32();
    this.isCountingDown = reader.readBoolean();
  }

  serializeSpawn(): SpawnPacketObject {
    return this.serializeData() as unknown as SpawnPacketObject;
  }

  clone(): InnerCooldownBehaviour {
    return new InnerCooldownBehaviour(this.parent, this.maxTimer, this.currentTime, this.color, this.isCountingDown, this.netId);
  }

  getParent(): BaseInnerNetEntity {
    return this.parent;
  }

  handleRpc(connection, type, packet, sendTo) {}
}
