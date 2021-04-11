import { MessageReader, MessageWriter } from "@nodepolus/framework/src/util/hazelMessage";
import { BaseRpcPacket } from "@nodepolus/framework/src/protocol/packets/rpc";

export class SetOpacityPacket extends BaseRpcPacket {
  constructor(
    public opacity: number,
  ) {
    super(0x92);
  }

  static deserialize(reader: MessageReader): SetOpacityPacket {
    return new SetOpacityPacket(reader.readByte());
  }

  serialize(writer: MessageWriter): void {
    writer.writeByte(this.opacity);
  }

  clone(): SetOpacityPacket {
    return new SetOpacityPacket(this.opacity);
  }
}
