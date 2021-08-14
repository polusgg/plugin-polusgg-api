import { MessageReader, MessageWriter } from "@nodepolus/framework/src/util/hazelMessage";
import { BaseRootPacket } from "@nodepolus/framework/src/protocol/packets/root";

export class DisableQR extends BaseRootPacket {
  constructor() {
    super(0xFC);
  }

  static deserialize(reader: MessageReader): DisableQR | SetQRContents {
    if (reader.peek(1) === 0x01) {
      return SetQRContents.deserialize(reader);
    }

    reader.readBoolean();

    return new DisableQR();
  }

  serialize(writer: MessageWriter): MessageWriter {
    return writer.writeBoolean(false);
  }

  clone(): DisableQR {
    return new DisableQR();
  }
}

export class SetQRContents extends BaseRootPacket {
  constructor(
    public contents: string,
  ) {
    super(0xFC);
  }

  static deserialize(reader: MessageReader): SetQRContents | DisableQR {
    if (reader.peek(1) === 0x00) {
      return DisableQR.deserialize(reader);
    }

    reader.readBoolean();

    return new SetQRContents(reader.readString());
  }

  serialize(writer: MessageWriter): MessageWriter {
    return writer.writeBoolean(true).writeString(this.contents);
  }

  clone(): SetQRContents {
    return new SetQRContents(this.contents);
  }
}
