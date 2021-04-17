import { BaseRootPacket } from "@nodepolus/framework/src/protocol/packets/root";
import { MessageReader, MessageWriter } from "@nodepolus/framework/src/util/hazelMessage";

export enum GameOptionType {
  NumberValue = 0,
  BooleanValue = 1,
  EnumValue = 2,
}

export abstract class GameOptionValue {
  constructor() {}
}

export class NumberValue extends GameOptionValue {
  constructor(
    public value: number,
    public step: number,
    public lower: number,
    public upper: number,
    public zeroIsInfinity: boolean,
    public suffix: string
  ) {
    super();
  }
};

export class BooleanValue extends GameOptionValue {
  constructor(
    public value: boolean
  ) {
    super();
  }
};

export class EnumValue extends GameOptionValue {
  constructor(
    public index: number,
    public options: string[]
  ) {
    super();
  }
};

export class SetGameOption extends BaseRootPacket {
  constructor(
    public name: string,
    public value: NumberValue | BooleanValue | EnumValue,
  ) {
    super(0x89);
  }

  static deserialize(reader: MessageReader): SetGameOption {
    const name = reader.readString();
    const type = reader.readByte();
    
    let value: NumberValue | BooleanValue | EnumValue;

    switch (type) {
      case GameOptionType.NumberValue: {
        value = new NumberValue(
          reader.readFloat32(),
          reader.readFloat32(),
          reader.readFloat32(),
          reader.readFloat32(),
          reader.readBoolean(),
          reader.readString()
        );
        break;
      }
      case GameOptionType.BooleanValue:
        value = new BooleanValue(
          reader.readBoolean()
        );
        break;
      case GameOptionType.EnumValue: {
        const index = reader.readPackedUInt32();

        const options: string[] = [];

        while (reader.getCursor() < reader.getLength()) {
          options.push(reader.readString());
        }

        value = new EnumValue(
          index,
          options
        );
        break;
      }
      default:
        throw new Error(`Unexpected game option type: ${type}`);
    }

    return new SetGameOption(name, value);
  }

  serialize(writer: MessageWriter): void {
    writer.writeString(this.name);

    if (this.value instanceof NumberValue) {
      const value = this.value as NumberValue;

      writer.writeByte(GameOptionType.NumberValue);
      writer.writeFloat32(value.value);
      writer.writeFloat32(value.step);
      writer.writeFloat32(value.lower);
      writer.writeFloat32(value.upper);
      writer.writeBoolean(value.zeroIsInfinity);
      writer.writeString(value.suffix);

    } else if (this.value instanceof BooleanValue) {
      const value = this.value as BooleanValue;

      writer.writeByte(GameOptionType.BooleanValue);
      writer.writeBoolean(value.value);

    } else if (this.value instanceof EnumValue) {
      const value = this.value as EnumValue;

      writer.writeByte(GameOptionType.EnumValue);
      writer.writePackedUInt32(value.index);
      
      for (let i = 0; i < this.value.options.length; i++) {
        writer.writeString(this.value.options[i]);
      }
      
    } else {
      throw new Error(`Unexpected game option type: ${typeof this.value}`);
    }
  }

  clone(): SetGameOption {
    return new SetGameOption(this.name, this.value);
  }
}
