import { MessageReader, MessageWriter } from "@nodepolus/framework/src/util/hazelMessage";
import { Vector2 } from "@nodepolus/framework/src/types";
import { Palette } from "@nodepolus/framework/src/static";

export class PlayerAnimationKeyframe {
  protected offset: number;
  protected duration: number;
  protected opacity: number;
  protected hatOpacity: number;
  protected petOpacity: number;
  protected skinOpacity: number;
  protected primaryColor: [number, number, number, number] | number[];
  protected secondaryColor: [number, number, number, number] | number[];
  protected tertiaryColor: [number, number, number, number] | number[];
  protected scale: Vector2;
  protected position: Vector2;
  protected angle: number;

  constructor(
    { offset, duration, opacity, hatOpacity, petOpacity, skinOpacity, primaryColor, secondaryColor, tertiaryColor, scale, position, angle }: {
      offset: number;
      duration: number;
      opacity: number;
      hatOpacity?: number;
      petOpacity?: number;
      skinOpacity?: number;
      primaryColor: [number, number, number, number] | number[];
      secondaryColor: [number, number, number, number] | number[];
      tertiaryColor?: [number, number, number, number] | number[];
      scale: Vector2;
      position: Vector2;
      angle: number;
    },
  ) {
    this.offset = offset;
    this.duration = duration;
    this.opacity = opacity;
    this.hatOpacity = hatOpacity ?? opacity;
    this.petOpacity = petOpacity ?? opacity;
    this.skinOpacity = skinOpacity ?? opacity;
    this.primaryColor = primaryColor;
    this.secondaryColor = secondaryColor;
    this.tertiaryColor = tertiaryColor ?? [...Palette.playerVisor()];
    this.scale = scale;
    this.position = position;
    this.angle = angle;
  }

  static deserialize(reader: MessageReader): PlayerAnimationKeyframe {
    return new PlayerAnimationKeyframe({
      offset: reader.readPackedUInt32(),
      duration: reader.readPackedUInt32(),
      opacity: reader.readFloat32(),
      hatOpacity: reader.readFloat32(),
      petOpacity: reader.readFloat32(),
      skinOpacity: reader.readFloat32(),
      primaryColor: [reader.readByte(), reader.readByte(), reader.readByte(), reader.readByte()],
      secondaryColor: [reader.readByte(), reader.readByte(), reader.readByte(), reader.readByte()],
      tertiaryColor: [reader.readByte(), reader.readByte(), reader.readByte(), reader.readByte()],
      scale: reader.readVector2(),
      position: reader.readVector2(),
      angle: reader.readFloat32(),
    });
  }

  serialize(writer: MessageWriter): void {
    writer.writePackedUInt32(this.offset);
    writer.writePackedUInt32(this.duration);
    writer.writeFloat32(this.opacity);
    writer.writeFloat32(this.hatOpacity);
    writer.writeFloat32(this.petOpacity);
    writer.writeFloat32(this.skinOpacity);
    writer.writeBytes(this.primaryColor);
    writer.writeBytes(this.secondaryColor);
    writer.writeBytes(this.tertiaryColor);
    writer.writeVector2(this.scale);
    writer.writeVector2(this.position);
    writer.writeFloat32(this.angle);
  }

  getOffset(): number {
    return this.offset;
  }

  getDuration(): number {
    return this.duration;
  }

  getOpacity(): number {
    return this.opacity;
  }

  getHatOpacity(): number {
    return this.hatOpacity;
  }

  getPetOpacity(): number {
    return this.petOpacity;
  }

  getSkinOpacity(): number {
    return this.skinOpacity;
  }

  getPrimaryColor(): [number, number, number, number] {
    return this.primaryColor as [number, number, number, number];
  }

  getSecondaryColor(): [number, number, number, number] {
    return this.secondaryColor as [number, number, number, number];
  }

  getTertiaryColor(): [number, number, number, number] {
    return this.tertiaryColor as [number, number, number, number];
  }

  getScale(): Vector2 {
    return this.scale;
  }

  getPosition(): Vector2 {
    return this.position;
  }

  getAngle(): number {
    return this.angle;
  }

  setOffset(offset: number): this {
    this.offset = offset;

    return this;
  }

  setDuration(duration: number): this {
    this.duration = duration;

    return this;
  }

  setOpacity(opacity: number): this {
    this.opacity = opacity;

    return this;
  }

  setHatOpacity(opacity: number): this {
    this.hatOpacity = opacity;

    return this;
  }

  setPetOpacity(opacity: number): this {
    this.petOpacity = opacity;

    return this;
  }

  setSkinOpacity(opacity: number): this {
    this.skinOpacity = opacity;

    return this;
  }

  setPrimaryColor(color: [number, number, number, number] | number[]): this {
    this.primaryColor = color;

    return this;
  }

  setSecondaryColor(color: [number, number, number, number] | number[]): this {
    this.secondaryColor = color;

    return this;
  }

  setTertiaryColor(color: [number, number, number, number] | number[]): this {
    this.tertiaryColor = color;

    return this;
  }

  setScale(scale: Vector2): this {
    this.scale = scale;

    return this;
  }

  setPosition(position: Vector2): this {
    this.position = position;

    return this;
  }

  setAngle(angle: number): this {
    this.angle = angle;

    return this;
  }

  clone(): PlayerAnimationKeyframe {
    return new PlayerAnimationKeyframe({
      offset: this.getOffset(),
      angle: this.getAngle(),
      duration: this.getDuration(),
      opacity: this.getOpacity(),
      position: this.getPosition(),
      primaryColor: this.getPrimaryColor(),
      scale: this.getScale(),
      secondaryColor: this.getSecondaryColor(),
      hatOpacity: this.getHatOpacity(),
      petOpacity: this.getPetOpacity(),
      skinOpacity: this.getSkinOpacity(),
      tertiaryColor: this.getTertiaryColor(),
    });
  }
}
