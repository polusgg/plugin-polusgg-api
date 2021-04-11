import { MessageReader, MessageWriter } from "@nodepolus/framework/src/util/hazelMessage";
import { BaseRpcPacket } from "@nodepolus/framework/src/protocol/packets/rpc";

export class SetOutlinePacket extends BaseRpcPacket {
  constructor(
    public enabled: boolean,
    public color: [number, number, number, number] | number[],
  ) {
    super(0x90);
  }

  static deserialize(reader: MessageReader): SetOutlinePacket {
    return new SetOutlinePacket(reader.readBoolean(), [reader.readByte(), reader.readByte(), reader.readByte(), reader.readByte()]);
  }

  serialize(writer: MessageWriter): void {
    writer.writeBoolean(this.enabled);
    writer.writeBytes(this.color);
  }

  clone(): SetOutlinePacket {
    return new SetOutlinePacket(this.enabled, this.color);
  }
}
