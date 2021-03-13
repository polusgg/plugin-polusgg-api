import { BaseInnerNetEntity, BaseInnerNetObject } from "../../../../lib/protocol/entities/baseEntity";
import { DataPacket, SpawnPacketObject } from "../../../../lib/protocol/packets/gameData";
import { MessageReader } from "../../../../lib/util/hazelMessage";

// TODO: Rewrite to not suck ass

export class InnerConsoleBehaviour extends BaseInnerNetObject {
  constructor(
    parent: BaseInnerNetEntity,
    netId: number = parent.getLobby().getHostInstance().getNextNetId(),
  ) {
    super(0x82, parent, netId);
  }

  serializeData(): DataPacket {
    return new DataPacket(this.getNetId(), new MessageReader());
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setData(): void { }

  serializeSpawn() {
    return this.serializeData() as unknown as SpawnPacketObject;
  }

  clone(): InnerConsoleBehaviour {
    return new InnerConsoleBehaviour(this.parent, this.netId);
  }

  getParent(): BaseInnerNetEntity {
    return this.parent;
  }

  handleRpc(connection, type, packet, sendTo) { }
}
