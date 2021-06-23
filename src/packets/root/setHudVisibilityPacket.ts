import { MessageReader, MessageWriter } from "@nodepolus/framework/src/util/hazelMessage";
import { BaseRootPacket } from "@nodepolus/framework/src/protocol/packets/root";
import { HudItem } from "../../types/enums/hudItem";

export class SetHudVisibilityPacket extends BaseRootPacket {
  constructor(
    public item: HudItem,
    public enabled: boolean,
  ) {
    super(0x8c);
  }

  static deserialize(reader: MessageReader): SetHudVisibilityPacket {
    return new SetHudVisibilityPacket(reader.readByte(), reader.readBoolean());
  }

  serialize(writer: MessageWriter): MessageWriter {
    return writer.writeByte(this.item).writeBoolean(this.enabled);
  }

  clone(): SetHudVisibilityPacket {
    return new SetHudVisibilityPacket(this.item, this.enabled);
  }
}
