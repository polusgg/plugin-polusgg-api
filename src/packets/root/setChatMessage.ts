import { MessageReader, MessageWriter } from "@nodepolus/framework/src/util/hazelMessage";
import { BaseRootPacket } from "@nodepolus/framework/src/protocol/packets/root";

export enum ChatMessageAlign {
    Left,
    Center,
    Right
}

export class SetChatMessagePacket extends BaseRootPacket {
  constructor(
    public messageUuid: string,
    public messageAlign: ChatMessageAlign,
    public messageAuthorTitle: string,
    public messageAuthorAlive: boolean,
    public authorHat: number,
    public authorSkin: number,
    public authorColorR: number,
    public authorColorG: number,
    public authorColorB: number,
    public messageContent: string,
    public fromQuickChat: boolean
  ) {
    super(0x9D);
  }

  static deserialize(reader: MessageReader): SetChatMessagePacket {
    const uuid = `${reader.readBytes(4).getBuffer().toString("hex")}-${reader.readBytes(2).getBuffer().toString("hex")}-${reader.readBytes(2).getBuffer().toString("hex")}-${reader.readBytes(2).getBuffer().toString("hex")}-${reader.readBytes(6).getBuffer().toString("hex")}`;
    return new SetChatMessagePacket(
        uuid,
        reader.readByte(),
        reader.readString(),
        reader.readBoolean(),
        reader.readUInt32(),
        reader.readUInt32(),
        reader.readByte(),
        reader.readByte(),
        reader.readByte(),
        reader.readString(),
        reader.readBoolean()
    );
  }

  serialize(writer: MessageWriter): void {
    const uuidBytes = Buffer.from(this.messageUuid.replace(/-/g, ""), "hex");
    writer.writeBytes(uuidBytes);
    writer.writeByte(this.messageAlign);
    writer.writeString(this.messageAuthorTitle);
    writer.writeBoolean(this.messageAuthorAlive);
    writer.writeUInt32(this.authorHat);
    writer.writeUInt32(this.authorSkin);
    writer.writeByte(this.authorColorR);
    writer.writeByte(this.authorColorG);
    writer.writeByte(this.authorColorB);
    writer.writeString(this.messageContent);
    writer.writeBoolean(this.fromQuickChat);
  }

  clone(): SetChatMessagePacket {
    return new SetChatMessagePacket(
        this.messageUuid,
        this.messageAlign,
        this.messageAuthorTitle,
        this.messageAuthorAlive,
        this.authorHat,
        this.authorSkin,
        this.authorColorR,
        this.authorColorG,
        this.authorColorB,
        this.messageContent,
        this.fromQuickChat
    );
  }
}
