import { BaseInnerNetEntity, BaseInnerNetObject } from "@nodepolus/framework/src/protocol/entities/baseEntity";
import { DataPacket, SpawnPacketObject } from "@nodepolus/framework/src/protocol/packets/gameData";
import { BaseRpcPacket } from "@nodepolus/framework/src/protocol/packets/rpc";
import { MessageWriter } from "@nodepolus/framework/src/util/hazelMessage";
import { Connection } from "@nodepolus/framework/src/protocol/connection";
import { RpcPacketType } from "@nodepolus/framework/src/types/enums";
import { EntityPointOfInterest } from "../entities";

export class InnerLightSource extends BaseInnerNetObject {
  constructor(parent: BaseInnerNetEntity, netId: number, protected radius: number) {
    super(0x85, parent, netId);
  }

  getRadius(): number {
    return this.radius;
  }

  setRadius(radius: number): this {
    this.radius = radius;

    return this;
  }

  getParent(): EntityPointOfInterest {
    return this.parent as EntityPointOfInterest;
  }

  clone(): InnerLightSource {
    return new InnerLightSource(this.parent, this.netId, this.radius);
  }

  serializeData(): DataPacket {
    return new DataPacket(this.netId, new MessageWriter().writeFloat32(this.radius));
  }

  serializeSpawn(): SpawnPacketObject {
    return new SpawnPacketObject(this.netId, new MessageWriter().writeFloat32(this.radius));
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  handleRpc(_connection: Connection, _type: RpcPacketType, _packet: BaseRpcPacket, _sendTo?: Connection[]): void { }
}
