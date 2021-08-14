import { BaseInnerNetEntity, BaseInnerNetObject } from "@nodepolus/framework/src/protocol/entities/baseEntity";
import { DataPacket, SpawnPacketObject } from "@nodepolus/framework/src/protocol/packets/gameData";
import { MessageReader, MessageWriter } from "@nodepolus/framework/src/util/hazelMessage";
import { BaseRpcPacket } from "@nodepolus/framework/src/protocol/packets/rpc";
import { Connection } from "@nodepolus/framework/src/protocol/connection";
import { RpcPacketType } from "@nodepolus/framework/src/types/enums";
import { Services } from "../services";
import { ServiceType } from "../types/enums";
import { ClickPacket } from "../packets/rpc/clickBehaviour";
import { KeyCode } from "../types/enums/keyCode";

export class InnerClickBehaviour extends BaseInnerNetObject {
  private lastCurrentTimeSet: number;

  constructor(
    parent: BaseInnerNetEntity,
    public maxTimer: number,
    public currentTime: number = 0,
    public saturated: boolean = true,
    public color: [number, number, number, number] = [255, 255, 255, 255],
    public countingDown: boolean = true,
    public keys: KeyCode[] = [],
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

  isSaturated(): boolean {
    return this.saturated;
  }

  setSaturated(saturated: boolean): this {
    this.saturated = saturated;

    return this;
  }

  isCountingDown(): boolean {
    return this.countingDown;
  }

  setIsCountingDown(isCountingDown: boolean): this {
    this.countingDown = isCountingDown;

    return this;
  }

  getCurrentTime(): number {
    if (this.countingDown) {
      const timeSinceSet = (Date.now() - this.lastCurrentTimeSet) / 1000;

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
    const writer = new MessageWriter()
      .writeFloat32(this.maxTimer)
      .writeFloat32(this.getCurrentTime())
      .writeBoolean(this.countingDown)
      .writeBoolean(this.saturated)
      .writeBytes(this.color);

    for (let i = 0; i < this.keys.length; i++) {
      writer.writeUInt16(this.keys[i]);
    }

    return new DataPacket(this.netId, writer);
  }

  setData(message: MessageReader | MessageWriter): void {
    const reader = MessageReader.fromRawBytes(message);

    this.maxTimer = reader.readFloat32();
    this.currentTime = reader.readFloat32();
    this.countingDown = reader.readBoolean();
    this.saturated = reader.readBoolean();
    this.color = [...reader.readBytes(4).getBuffer()] as [number, number, number, number];
    this.keys = [];

    while (reader.hasBytesLeft()) {
      this.keys.push(reader.readUInt16());
    }
  }

  serializeSpawn(): SpawnPacketObject {
    const writer = new MessageWriter()
      .writeFloat32(this.maxTimer)
      .writeFloat32(this.getCurrentTime())
      .writeBoolean(this.countingDown)
      .writeBoolean(this.saturated)
      .writeBytes(this.color);

    for (let i = 0; i < this.keys.length; i++) {
      writer.writeUInt16(this.keys[i]);
    }

    return new SpawnPacketObject(this.netId, writer);
  }

  clone(): InnerClickBehaviour {
    return new InnerClickBehaviour(this.parent, this.maxTimer, this.currentTime, this.saturated, this.color, this.countingDown, this.keys, this.netId);
  }

  getParent(): BaseInnerNetEntity {
    return this.parent;
  }

  handleRpc(connection: Connection, type: RpcPacketType, packet: BaseRpcPacket, _sendTo: Connection[]): void {
    switch (type as number) {
      case 0x86: {
        const button = Services.get(ServiceType.Button).findSafeButtonByNetId(this.getLobby(), this.getNetId());

        if (!button.isDestroyed()) {
          button.emit("clicked", {
            connection,
            packet: packet as ClickPacket,
          });
        }

        break;
      }
      default:
        break;
    }
  }
}
