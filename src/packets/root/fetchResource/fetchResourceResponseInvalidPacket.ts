import { MessageReader, MessageWriter } from "@nodepolus/framework/src/util/hazelMessage";
import { BaseRootPacket } from "@nodepolus/framework/src/protocol/packets/root";

export class FetchResourceResponseInvalidPacket extends BaseRootPacket {
  constructor() {
    super(0x03);
  }

  static deserialize(reader: MessageReader): FetchResourceResponseInvalidPacket {
    return new FetchResourceResponseInvalidPacket();
  }

  serialize(writer: MessageWriter): void {}

  clone(): FetchResourceResponseInvalidPacket {
    return new FetchResourceResponseInvalidPacket();
  }
}
