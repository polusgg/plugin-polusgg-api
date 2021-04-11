import { BaseInnerNetEntity, BaseInnerNetObject } from "@nodepolus/framework/src/protocol/entities/baseEntity";
import { DataPacket, SpawnPacketObject } from "@nodepolus/framework/src/protocol/packets/gameData";
import { MessageReader, MessageWriter } from "@nodepolus/framework/src/util/hazelMessage";
import { BaseRpcPacket } from "@nodepolus/framework/src/protocol/packets/rpc";
import { Connection } from "@nodepolus/framework/src/protocol/connection";
import { RpcPacketType } from "@nodepolus/framework/src/types/enums";
import { Services } from "../services";
import { ServiceType } from "../types/enums";
import { ClickPacket } from "../packets/rpc/clickBehaviour";

export class InnerClickBehaviour extends BaseInnerNetObject {
  private lastCurrentTimeSet: number;

  constructor(
    parent: BaseInnerNetEntity,
    public maxTimer: number,
    public currentTime: number = 0,
    public color: [number, number, number, number] = [255, 255, 255, 255],
    public isCountingDown: boolean = true,
    netId: number = parent.getLobby().getHostInstance().getNextNetId(),
  ) {
    super(0x83, parent, netId);

    this.lastCurrentTimeSet = Date.now();
  }

  getColor(): [number, number, number, number] {
    return this.color;
  }

  setColor(color: [number, number, number, number]): this {
    this.color = color;

    return this;
  }

  getIsCountingDown(): boolean {
    return this.isCountingDown;
  }

  setIsCountingDown(isCountingDown: boolean): this {
    this.isCountingDown = isCountingDown;

    return this;
  }

  getCurrentTime(): number {
    if (this.isCountingDown) {
      const timeSinceSet = Date.now() - this.lastCurrentTimeSet;

      return Math.max(this.currentTime - timeSinceSet, 0);
    }

    return this.currentTime;
  }

  setCurrentTime(time: number): this {
    this.currentTime = time;

    // this *technically* sets it at the wrong time.
    // if the consumer were to call setCurrentTime();
    // seconds before sending a data update, this
    // would be out of step.
    //
    // TODO: fix above issue

    this.lastCurrentTimeSet = Date.now();

    return this;
  }

  getMaxTimer(): number {
    return this.maxTimer;
  }

  setMaxTimer(maxTimer: number): this {
    this.maxTimer = maxTimer;

    return this;
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

  handleRpc(connection: Connection, type: RpcPacketType, packet: BaseRpcPacket, _sendTo: Connection[]): void {
    switch (type) {
      case 0x86:
        Services.get(ServiceType.Button).findSafeButtonByNetId(this.getLobby(), this.getNetId()).emit("clicked", packet as ClickPacket);
        break;
      default:
        break;
    }
  }
}
