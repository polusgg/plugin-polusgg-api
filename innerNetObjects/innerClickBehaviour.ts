import { BaseInnerNetEntity, BaseInnerNetObject } from "../../../../lib/protocol/entities/types";
import { SpawnInnerNetObject } from "../../../../lib/protocol/packets/gameData/types";
import { DataPacket } from "../../../../lib/protocol/packets/gameData";
import { MessageReader } from "../../../../lib/util/hazelMessage";

// TODO: Rewrite to not suck ass

export class InnerClickBehaviour extends BaseInnerNetObject {
  constructor(
    netId: number,
    parent: BaseInnerNetEntity,
  ) {
    super(0x82, netId, parent);
  }

  getData(): DataPacket {
    return new DataPacket(this.netId, new MessageReader());
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setData(): void {}

  serializeSpawn(): SpawnInnerNetObject {
    return this.getData() as SpawnInnerNetObject;
  }

  clone(): InnerClickBehaviour {
    return new InnerClickBehaviour(this.netId, this.parent);
  }
}
