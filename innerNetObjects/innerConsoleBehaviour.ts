import { Connection } from "../../../../lib/protocol/connection";
import { BaseInnerNetEntity, BaseInnerNetObject } from "../../../../lib/protocol/entities/baseEntity";
import { DataPacket, SpawnPacketObject } from "../../../../lib/protocol/packets/gameData";
import { BaseRpcPacket } from "../../../../lib/protocol/packets/rpc";
import { RpcPacketType } from "../../../../lib/types/enums";
import { MessageReader, MessageWriter } from "../../../../lib/util/hazelMessage";

// TODO: Rewrite to not suck ass

export class InnerConsoleBehaviour extends BaseInnerNetObject {
  constructor(
    parent: BaseInnerNetEntity,
    public canUse: number[] = [],
    netId: number = parent.getLobby().getHostInstance().getNextNetId(),
  ) {
    super(0x82, parent, netId);
  }

  serializeData(): DataPacket {
    return new DataPacket(this.getNetId(), new MessageWriter().writeBytesAndSize(this.canUse));
  }

  setData(reader: MessageReader): void {
    this.canUse = [...reader.readBytesAndSize().getBuffer()];
  }

  serializeSpawn(): SpawnPacketObject {
    return this.serializeData() as unknown as SpawnPacketObject;
  }

  clone(): InnerConsoleBehaviour {
    return new InnerConsoleBehaviour(this.parent, [...this.canUse], this.netId);
  }

  getParent(): BaseInnerNetEntity {
    return this.parent;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  handleRpc(_connection: Connection, _type: RpcPacketType, _packet: BaseRpcPacket, _sendTo: Connection[]): void { }
}
