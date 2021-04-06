import { BaseInnerNetEntity, BaseInnerNetObject } from "@nodepolus/framework/src/protocol/entities/baseEntity";
import { DataPacket, SpawnPacketObject } from "@nodepolus/framework/src/protocol/packets/gameData";
import { BaseRpcPacket } from "@nodepolus/framework/src/protocol/packets/rpc";
import { MessageWriter } from "@nodepolus/framework/src/util/hazelMessage";
import { Connection } from "@nodepolus/framework/src/protocol/connection";
import { RpcPacketType } from "@nodepolus/framework/src/types/enums";
import { EntityPointOfInterest } from "../entities";

export class InnerPointOfInterest extends BaseInnerNetObject {
  constructor(parent: BaseInnerNetEntity, netId: number, protected readonly resourceId: number) {
    super(0x84, parent, netId);
  }

  getResourceId(): number {
    return this.resourceId;
  }

  getParent(): EntityPointOfInterest {
    return this.parent as EntityPointOfInterest;
  }

  clone(): InnerPointOfInterest {
    return new InnerPointOfInterest(this.parent, this.netId, this.resourceId);
  }

  serializeData(): DataPacket {
    return new DataPacket(this.netId, new MessageWriter().writePackedUInt32(this.resourceId));
  }

  serializeSpawn(): SpawnPacketObject {
    return new SpawnPacketObject(this.netId, new MessageWriter().writePackedUInt32(this.resourceId));
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  handleRpc(_connection: Connection, _type: RpcPacketType, _packet: BaseRpcPacket, _sendTo?: Connection[]): void { }
}
