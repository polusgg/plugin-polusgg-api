import { MessageReader, MessageWriter } from "@nodepolus/framework/src/util/hazelMessage";
import { BaseRootPacket } from "@nodepolus/framework/src/protocol/packets/root";

export class FetchResourceResponseEndedPacket extends BaseRootPacket {
  constructor(
    public readonly didCache: boolean,
  ) {
    super(0x01);
  }

  static deserialize(reader: MessageReader): FetchResourceResponseEndedPacket {
    return new FetchResourceResponseEndedPacket(reader.readBoolean());
  }

  serialize(writer: MessageWriter): void {
    writer.writeBoolean(this.didCache);
  }

  clone(): FetchResourceResponseEndedPacket {
    return new FetchResourceResponseEndedPacket(this.didCache);
  }
}
