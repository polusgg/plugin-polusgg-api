import { BaseRootPacket } from "@nodepolus/framework/src/protocol/packets/root";
import { MessageReader, MessageWriter } from "@nodepolus/framework/src/util/hazelMessage";

export enum GameOptionType {
  NumberValue = 0,
  BooleanValue = 1,
  EnumValue = 2,
}

export type NumberValueJson = {
  value: number;
  step: number;
  lower: number;
  upper: number;
  zeroIsInfinity: boolean;
  suffix: string;
  type: "NUMBER";
};

export type BooleanValueJson = {
  value: boolean;
  type: "BOOLEAN";
};

export type EnumValueJson = {
  index: number;
  options: string[];
  type: "ENUM";
};

export type ValueJson = NumberValueJson | BooleanValueJson | EnumValueJson;

export class NumberValue {
  constructor(
    public value: number,
    public step: number,
    public lower: number,
    public upper: number,
    public zeroIsInfinity: boolean,
    public suffix: string,
  ) {}

  toJson(): NumberValueJson {
    return {
      value: this.value,
      step: this.step,
      lower: this.lower,
      upper: this.upper,
      zeroIsInfinity: this.zeroIsInfinity,
      suffix: this.suffix,
      type: "NUMBER",
    };
  }

  load(v: NumberValueJson): this {
    this.value = v.value;

    if (this.value > this.upper) {
      this.value = this.upper;
    }

    if (this.value < this.lower) {
      this.value = this.lower;
    }

    return this;
  }

  equals(t: NumberValue | BooleanValue | EnumValue): boolean {
    if (t instanceof NumberValue) {
      return t.lower === this.lower && t.upper === this.upper && t.step === this.step && t.suffix === this.suffix && t.zeroIsInfinity === this.zeroIsInfinity && t.value === this.value;
    }

    return false;
  }

  validate(t: NumberValue | BooleanValue | EnumValue): boolean {
    if (!(t instanceof NumberValue)) {
      return false;
    }

    if (t.lower !== this.lower) {
      return false;
    }

    if (t.upper !== this.upper) {
      return false;
    }

    if (t.suffix !== this.suffix) {
      return false;
    }

    if (t.step !== this.step) {
      return false;
    }

    if (t.zeroIsInfinity !== this.zeroIsInfinity) {
      return false;
    }

    if (t.value > this.upper) {
      return false;
    }

    if (t.value < this.lower) {
      return false;
    }

    if (!Number.isInteger(Math.round((t.value / t.step) * 100000) / 100000)) {
      console.log("Due to not being in-step");
      return false;
    }

    return true;
  }
}

export class BooleanValue {
  constructor(
    public value: boolean,
  ) {}

  toJson(): BooleanValueJson {
    return {
      value: this.value,
      type: "BOOLEAN",
    };
  }

  load(v: BooleanValueJson): this {
    this.value = v.value;

    return this;
  }

  equals(t: NumberValue | BooleanValue | EnumValue): boolean {
    if (t instanceof BooleanValue) {
      return t.value === this.value;
    }

    return false;
  }

  validate(t: NumberValue | BooleanValue | EnumValue): boolean {
    if (!(t instanceof BooleanValue)) {
      return false;
    }

    return true;
  }
}

export class EnumValue {
  constructor(
    public index: number,
    public options: string[],
  ) {}

  getSelected(): string {
    return this.options[this.index];
  }

  toJson(): EnumValueJson {
    return {
      index: this.index,
      options: this.options,
      type: "ENUM",
    };
  }

  load(v: EnumValueJson): this {
    const idxOld = this.options.findIndex(opt => opt == v.options[v.index]);

    if (idxOld === -1) {
      // the option was removed;
      return this;
    }

    this.index = idxOld;

    return this;
  }

  equals(t: NumberValue | BooleanValue | EnumValue): boolean {
    if (t instanceof EnumValue) {
      if (t.options.length !== this.options.length) {
        return false;
      }

      if (t.index !== this.index) {
        return false;
      }

      for (let i = 0; i < this.options.length; i++) {
        if (this.options[i] !== t.options[i]) {
          return false;
        }
      }

      return true;
    }

    return false;
  }

  validate(t: NumberValue | BooleanValue | EnumValue): boolean {
    if (!(t instanceof EnumValue)) {
      return false;
    }

    if (t.options.length !== this.options.length) {
      return false;
    }

    if (t.index < 0 || t.index >= this.options.length) {
      return false;
    }

    for (let i = 0; i < this.options.length; i++) {
      if (this.options[i] !== t.options[i]) {
        return false;
      }
    }

    return true;
  }
}

export class SetGameOption extends BaseRootPacket {
  constructor(
    public sequenceId: number,
    public category: string,
    public priority: number,
    public name: string,
    public value: NumberValue | BooleanValue | EnumValue,
  ) {
    super(0x89);
  }

  static deserialize(reader: MessageReader): SetGameOption {
    const sequenceId = reader.readUInt16();
    const category = reader.readString();
    const priority = reader.readUInt16();
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
          reader.readString(),
        );
        break;
      }
      case GameOptionType.BooleanValue:
        value = new BooleanValue(
          reader.readBoolean(),
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
          options,
        );
        break;
      }
      default:
        throw new Error(`Unexpected game option type: ${type}`);
    }

    return new SetGameOption(sequenceId, category, priority, name, value);
  }

  serialize(writer: MessageWriter): void {
    writer.writeUInt16(this.sequenceId);
    writer.writeString(this.category);
    writer.writeUInt16(this.priority);
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
    } else if (this.value instanceof EnumValue || typeof this.value === "object") {
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
    return new SetGameOption(this.sequenceId, this.category, this.priority, this.name, this.value);
  }
}
