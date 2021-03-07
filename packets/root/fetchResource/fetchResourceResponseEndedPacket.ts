import { MessageReader, MessageWriter } from "../../../../../lib/util/hazelMessage";
import { BaseRootPacket } from "../../../../../lib/protocol/packets/root";
import { BaseResponse } from ".";

export class FetchResourceResponseEndedPacket extends BaseRootPacket implements BaseResponse {
  constructor(
    public readonly didCache: boolean,
  ) {
    super(0x01);
  }

  static deserialize(reader: MessageReader): FetchResourceResponseEndedPacket {
    return new FetchResourceResponseEndedPacket(reader.readBoolean());
  }

  serialize(): MessageWriter {
    return new MessageWriter().writeBoolean(this.didCache);
  }

  clone(): FetchResourceResponseEndedPacket {
    return new FetchResourceResponseEndedPacket(this.didCache);
  }
}
