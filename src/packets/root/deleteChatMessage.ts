import { MessageReader, MessageWriter } from "@nodepolus/framework/src/util/hazelMessage";
import { BaseRootPacket } from "@nodepolus/framework/src/protocol/packets/root";

export enum ChatMessageAlign {
    Left,
    Center,
    Right
}

export class DeleteChatMessagePacket extends BaseRootPacket {
  constructor(
    public messageUuid: string
  ) {
    super(0x9E);
  }

  static deserialize(reader: MessageReader): DeleteChatMessagePacket {
    const uuid = `${reader.readBytes(4).getBuffer().toString("hex")}-${reader.readBytes(2).getBuffer().toString("hex")}-${reader.readBytes(2).getBuffer().toString("hex")}-${reader.readBytes(2).getBuffer().toString("hex")}-${reader.readBytes(6).getBuffer().toString("hex")}`;
    return new DeleteChatMessagePacket(uuid);
  }

  serialize(writer: MessageWriter): void {
    const uuidBytes = Buffer.from(this.messageUuid.replace(/-/g, ""), "hex");
    writer.writeBytes(uuidBytes);
  }

  clone(): DeleteChatMessagePacket {
    return new DeleteChatMessagePacket(this.messageUuid);
  }
}