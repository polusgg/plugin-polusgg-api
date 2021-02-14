import { BaseInnerNetEntity, BaseInnerNetObject } from "../../../../../lib/protocol/entities/types";
import { DataPacket } from "../../../../../lib/protocol/packets/gameData";
import { SpawnInnerNetObject } from "../../../../../lib/protocol/packets/gameData/types";
import { MessageReader } from "../../../../../lib/util/hazelMessage";

export class ClickBehaviour extends BaseInnerNetObject {
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

  clone(): ClickBehaviour {
    return new ClickBehaviour(this.netId, this.parent);
  }
}
