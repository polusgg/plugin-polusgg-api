import { BaseInnerNetEntity, BaseInnerNetObject } from "../../../../lib/protocol/entities/baseEntity";
import { InnerNetObjectType, RpcPacketType, TeleportReason } from "../../../../lib/types/enums";
import { DataPacket, SpawnPacketObject } from "../../../../lib/protocol/packets/gameData";
import { BaseRpcPacket, SnapToPacket } from "../../../../lib/protocol/packets/rpc";
import { MessageReader, MessageWriter } from "../../../../lib/util/hazelMessage";
import { GameDataPacket } from "../../../../lib/protocol/packets/root";
import { Connection } from "../../../../lib/protocol/connection";
import { MaxValue } from "../../../../lib/util/constants";
import { Vector2 } from "../../../../lib/types";
import { Lobby } from "../../../../lib/lobby";

export class InnerCustomNetworkTransformGeneric extends BaseInnerNetObject {
  constructor(
    protected readonly parent: BaseInnerNetEntity,
    protected position: Vector2 = Vector2.zero(),
    protected velocity: Vector2 = Vector2.zero(),
    protected sequenceId: number = 5,
    netId: number = parent.getLobby().getHostInstance().getNextNetId(),
  ) {
    super(InnerNetObjectType.CustomNetworkTransform, parent, netId);
  }

  getPosition(): Vector2 {
    return this.position;
  }

  setPosition(position: Vector2): this {
    this.position = position;

    return this;
  }

  getVelocity(): Vector2 {
    return this.velocity;
  }

  setVelocity(velocity: Vector2): this {
    this.velocity = velocity;

    return this;
  }

  walkTo(position: Vector2, velocity: Vector2 = Vector2.zero()): void {
    this.setPosition(position);
    this.setVelocity(velocity);
    this.incrementSequenceId(1);
    (this.parent.getLobby() as Lobby).sendRootGamePacket(new GameDataPacket([
      this.serializeData(),
    ], this.parent.getLobby().getCode()));
  }

  getSequenceId(): number {
    return this.sequenceId;
  }

  async snapTo(position: Vector2, reason: TeleportReason, sendTo?: Connection[]): Promise<void> {
    this.incrementSequenceId(5);
    this.sendRpcPacket(new SnapToPacket(this.position, this.sequenceId), sendTo);
  }

  handleRpc(connection: Connection, type: RpcPacketType, packet: BaseRpcPacket, sendTo: Connection[]): void {
    switch (type) {
      case RpcPacketType.SnapTo:
        this.snapTo((packet as SnapToPacket).position, TeleportReason.Unknown, sendTo);
        break;
      default:
        break;
    }
  }

  getParent(): BaseInnerNetEntity {
    return this.parent;
  }

  serializeData(): DataPacket {
    return new DataPacket(
      this.netId,
      new MessageWriter()
        .writeUInt16(this.sequenceId)
        .writeVector2(this.position)
        .writeVector2(this.velocity),
    );
  }

  setData(packet: MessageReader | MessageWriter): void {
    const reader = MessageReader.fromRawBytes(packet.getBuffer());
    const sequenceId = reader.readUInt16();

    if (!this.isSequenceIdGreater(sequenceId)) {
      return;
    }

    this.sequenceId = sequenceId;
    this.position = reader.readVector2();
    this.velocity = reader.readVector2();
  }

  serializeSpawn(): SpawnPacketObject {
    return new SpawnPacketObject(
      this.netId,
      new MessageWriter()
        .writeUInt16(this.sequenceId)
        .writeVector2(this.position)
        .writeVector2(this.velocity),
    );
  }

  clone(): InnerCustomNetworkTransformGeneric {
    return new InnerCustomNetworkTransformGeneric(this.parent, this.position, this.velocity, this.sequenceId, this.netId);
  }

  protected incrementSequenceId(amount: number): number {
    this.sequenceId = (this.sequenceId + Math.abs(amount)) % (MaxValue.UInt16 + 1);

    return this.sequenceId;
  }

  protected isSequenceIdGreater(sequenceId: number): boolean {
    const max = this.sequenceId + 32767;

    if (this.sequenceId < max) {
      if (sequenceId > this.sequenceId) {
        return sequenceId <= max;
      }

      return false;
    }

    if (sequenceId <= this.sequenceId) {
      return sequenceId <= max;
    }

    return true;
  }
}
