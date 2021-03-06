import { MessageReader, MessageWriter } from "../../../../../lib/util/hazelMessage";
import { BaseRootPacket } from "../../../../../lib/protocol/packets/root";
import { BaseResponse } from ".";

export class FetchResourceResponseStartedPacket extends BaseRootPacket implements BaseResponse {
  constructor(
    public readonly size: number,
  ) {
    super(0x00);
  }

  static deserialize(reader: MessageReader): FetchResourceResponseStartedPacket {
    return new FetchResourceResponseStartedPacket(reader.readPackedUInt32());
  }

  serialize(): MessageWriter {
    return new MessageWriter().writePackedUInt32(this.size);
  }

  clone(): FetchResourceResponseStartedPacket {
    return new FetchResourceResponseStartedPacket(this.size);
  }
}
