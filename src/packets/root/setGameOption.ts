import { BaseRootPacket } from "@nodepolus/framework/src/protocol/packets/root";
import { MessageReader, MessageWriter } from "@nodepolus/framework/src/util/hazelMessage";

export type EnumOption = {
  index: number;
  options: string[];
};

export class SetGameOption extends BaseRootPacket {
  constructor(
    public name: string,
    public value: boolean | number | EnumOption,
  ) {
    super(0x89);
  }

  static deserialize(reader: MessageReader): SetGameOption {
    const name = reader.readString();
    const type = reader.readByte();
    let value: boolean | number | EnumOption;

    switch (type) {
      case 0:
        value = reader.readFloat32();
        break;
      case 1:
        value = reader.readBoolean();
        break;
      case 2: {
        const index = reader.readPackedUInt32();
        const options: string[] = [];

        while (reader.getCursor() < reader.getLength()) {
          options.push(reader.readString());
        }

        value = { index, options };
        break;
      }
      default:
        throw new Error(`Unexpected game option type: ${type}`);
    }

    return new SetGameOption(name, value);
  }

  serialize(writer: MessageWriter): void {
    writer.writeString(this.name);

    switch (typeof this.value) {
      case "number":
        writer.writeByte(0);
        writer.writeFloat32(this.value);
        break;
      case "boolean":
        writer.writeByte(1);
        writer.writeBoolean(this.value);
        break;
      case "object":
        writer.writeByte(2);
        writer.writePackedUInt32(this.value.index);

        for (let i = 0; i < this.value.options.length; i++) {
          writer.writeString(this.value.options[i]);
        }
        break;
      default:
        throw new Error(`Unexpected game option type: ${typeof this.value}`);
    }
  }

  clone(): SetGameOption {
    return new SetGameOption(this.name, this.value);
  }
}
