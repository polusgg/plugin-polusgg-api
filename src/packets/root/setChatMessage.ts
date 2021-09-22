import { MessageReader, MessageWriter } from "@nodepolus/framework/src/util/hazelMessage";
import { BaseRootPacket } from "@nodepolus/framework/src/protocol/packets/root";
import { SendQuickChatPacket } from "@nodepolus/framework/src/protocol/packets/rpc";
import { Color } from "@nodepolus/framework/src/types";

export enum ChatMessageAlign {
    Left,
    Center,
    Right
}

export class SetChatMessagePacket extends BaseRootPacket {
  constructor(
    public uuid: string,
    public alignment: ChatMessageAlign,
    public name: string,
    public dead: boolean,
    public voted: boolean,
    public hat: number,
    public pet: number,
    public skin: number,
    public backColor: Color,
    public bodyColor: Color,
    public pitch: number,
    public messageContent: string | SendQuickChatPacket,
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
        reader.readBoolean(),
        reader.readPackedUInt32(),
        reader.readPackedUInt32(),
        reader.readPackedUInt32(),
        [reader.readByte(), reader.readByte(), reader.readByte(), reader.readByte()],
      [reader.readByte(), reader.readByte(), reader.readByte(), reader.readByte()],
        reader.readFloat32(),
        reader.readBoolean() ? SendQuickChatPacket.deserialize(reader) : reader.readString(),
    );
  }

  serialize(writer: MessageWriter): void {
    const uuidBytes = Buffer.from(this.uuid.replaceAll(/-/g, ""), "hex");
    writer.writeBytes(uuidBytes);
    writer.writeByte(this.alignment);
    writer.writeString(this.name);
    writer.writeBoolean(this.dead);
    writer.writeBoolean(this.voted);
    writer.writePackedUInt32(this.hat);
    writer.writePackedUInt32(this.pet);
    writer.writePackedUInt32(this.skin);
    writer.writeBytes(this.backColor);
    writer.writeBytes(this.bodyColor);
    writer.writeFloat32(this.pitch);
    if (typeof (this.messageContent) !== "string") {
      writer.writeBoolean(true);
      this.messageContent.serialize(writer);
    } else {
      writer.writeBoolean(false);
      writer.writeString(this.messageContent);
    }
  }

  clone(): SetChatMessagePacket {
    return new SetChatMessagePacket(
        this.uuid,
        this.alignment,
        this.name,
        this.dead,
        this.voted,
        this.hat,
        this.pet,
        this.skin,
        this.backColor,
        this.bodyColor,
        this.pitch,
        this.messageContent,
    );
  }
}
