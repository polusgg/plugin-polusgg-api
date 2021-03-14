import { BaseInnerNetEntity, BaseInnerNetObject } from "../../../../lib/protocol/entities/baseEntity";
import { DataPacket, SpawnPacketObject } from "../../../../lib/protocol/packets/gameData";
import { MessageReader } from "../../../../lib/util/hazelMessage";

// TODO: Rewrite to not suck ass

export class InnerClickBehaviour extends BaseInnerNetObject {
  constructor(
    parent: BaseInnerNetEntity,
    netId: number = parent.getLobby().getHostInstance().getNextNetId(),
  ) {
    super(0x84, parent, netId);
  }

  serializeData(): DataPacket {
    return new DataPacket(this.getNetId(), new MessageReader());
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setData(): void {}

  serializeSpawn() {
    return this.serializeData() as unknown as SpawnPacketObject;
  }

  clone(): InnerClickBehaviour {
    return new InnerClickBehaviour(this.parent, this.netId);
  }

  getParent(): BaseInnerNetEntity {
    return this.parent;
  }

  handleRpc(connection, type, packet, sendTo) {
    switch (type) {
      case 0x8e:
        console.log("!!! [ ICB Use Fired. Figure out an API to interface with this event ] !!!");
        break;
      default:
        break;
    }
  }
}
