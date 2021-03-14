import { MessageReader, MessageWriter } from "../../../../../../lib/util/hazelMessage";
import { BaseRootPacket } from "../../../../../../lib/protocol/packets/root";
import { DownloadFailureReason } from "../../../types/enums";

export class FetchResourceResponseFailedPacket extends BaseRootPacket {
  constructor(
    public readonly reason: DownloadFailureReason,
  ) {
    super(0x02);
  }

  static deserialize(reader: MessageReader): FetchResourceResponseFailedPacket {
    return new FetchResourceResponseFailedPacket(reader.readPackedUInt32());
  }

  serialize(): MessageWriter {
    return new MessageWriter().writePackedUInt32(this.reason);
  }

  clone(): FetchResourceResponseFailedPacket {
    return new FetchResourceResponseFailedPacket(this.reason);
  }
}
