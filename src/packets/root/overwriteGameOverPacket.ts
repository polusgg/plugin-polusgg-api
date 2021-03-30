import { MessageReader, MessageWriter } from "@nodepolus/framework/src/util/hazelMessage";
import { BaseRootPacket } from "@nodepolus/framework/src/protocol/packets/root";

export class OverwriteGameOver extends BaseRootPacket {
  constructor(
    public readonly titleText: string,
    public readonly subtitleText: string,
    public readonly backgroundColor: [number, number, number, number],
    public readonly yourTeam: number[],
    public readonly displayQuit: boolean,
    public readonly displayPlayAgain: boolean,
  ) {
    super(0x83);
  }

  static deserialize(reader: MessageReader): OverwriteGameOver {
    return new OverwriteGameOver(
      reader.readString(),
      reader.readString(),
      [...reader.readBytes(4).getBuffer()] as [number, number, number, number],
      [...reader.readBytes(reader.getReadableBytesLength() - 2).getBuffer()],
      reader.readBoolean(),
      reader.readBoolean(),
    );
  }

  serialize(writer: MessageWriter): void {
    writer
      .writeString(this.titleText)
      .writeString(this.subtitleText)
      .writeBytes(this.backgroundColor)
      .writeBytes(this.yourTeam)
      .writeBoolean(this.displayQuit)
      .writeBoolean(this.displayPlayAgain);
  }

  clone(): OverwriteGameOver {
    return new OverwriteGameOver(
      this.titleText,
      this.subtitleText,
      this.backgroundColor,
      this.yourTeam,
      this.displayQuit,
      this.displayPlayAgain,
    );
  }
}
