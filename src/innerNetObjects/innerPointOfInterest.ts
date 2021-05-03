import { BaseInnerNetEntity, BaseInnerNetObject } from "@nodepolus/framework/src/protocol/entities/baseEntity";
import { DataPacket, SpawnPacketObject } from "@nodepolus/framework/src/protocol/packets/gameData";
import { BaseRpcPacket } from "@nodepolus/framework/src/protocol/packets/rpc";
import { MessageWriter } from "@nodepolus/framework/src/util/hazelMessage";
import { Connection } from "@nodepolus/framework/src/protocol/connection";
import { RpcPacketType } from "@nodepolus/framework/src/types/enums";
import { EntityPointOfInterest } from "../entities";

export class InnerPointOfInterest extends BaseInnerNetObject {
  constructor(parent: BaseInnerNetEntity, netId: number) {
    super(0x86, parent, netId);
  }

  getParent(): EntityPointOfInterest {
    return this.parent as EntityPointOfInterest;
  }

  clone(): InnerPointOfInterest {
    return new InnerPointOfInterest(this.parent, this.netId);
  }

  serializeData(): DataPacket {
    return new DataPacket(this.netId, new MessageWriter());
  }

  serializeSpawn(): SpawnPacketObject {
    return new SpawnPacketObject(this.netId, new MessageWriter());
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  handleRpc(_connection: Connection, _type: RpcPacketType, _packet: BaseRpcPacket, _sendTo?: Connection[]): void { }
}
