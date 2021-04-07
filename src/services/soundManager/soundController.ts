import { Connection } from "@nodepolus/framework/src/protocol/connection";
import { GameDataPacket } from "@nodepolus/framework/src/protocol/packets/root";
import { Vector2 } from "@nodepolus/framework/src/types";
import { EntitySoundSource } from "../../entities/entitySoundSource";
import { SoundType } from "../../types/enums/soundType";

export class SoundController {
  constructor(protected readonly entity: EntitySoundSource, protected readonly owners: Connection[]) {}

  isPaused(): boolean {
    return this.entity.isPaused();
  }

  isPlaying(): boolean {
    return !this.isPaused();
  }

  getSeek(): number {
    return this.entity.getSeek();
  }

  getDuration(): number {
    return this.entity.getDuration();
  }

  getSoundType(): SoundType {
    return this.entity.getSoundType();
  }

  getVolume(): number {
    return this.entity.getVolumeModifier();
  }

  getPitch(): number {
    return this.entity.getPitch();
  }

  getFalloffMultiplier(): number {
    return this.entity.getFalloffMultiplier();
  }

  getFalloffStartingRadius(): number {
    return this.entity.getFalloffStartingRadius();
  }

  isLooping(): boolean {
    return this.entity.isLooping();
  }

  getPosition(): Vector2 {
    return this.entity.getPosition();
  }

  async pause(): Promise<void> {
    this.entity.getSoundSource().setPaused(true);
    await this.sendDataUpdate();
  }

  async play(): Promise<void> {
    this.entity.getSoundSource().setPaused(false);
    await this.sendDataUpdate();
  }

  async seek(position: number): Promise<void> {
    this.entity.getSoundSource().setSeek(position);
    await this.sendDataUpdate();
  }

  async loop(shouldLoop: boolean = true): Promise<void> {
    this.entity.getSoundSource().setLooping(shouldLoop);
    await this.sendDataUpdate();
  }

  async setPitch(pitch: number): Promise<void> {
    this.entity.getSoundSource().setPitch(pitch);
    await this.sendDataUpdate();
  }

  async setFalloff(multiplier: number, startingRadius: number): Promise<void> {
    this.entity.getSoundSource()
      .setSoundFalloffMultiplier(multiplier)
      .setSoundFalloffStartingRadius(startingRadius);

    await this.sendDataUpdate();
  }

  async setVolume(volume: number): Promise<void> {
    this.entity.getSoundSource().setVolumeModifier(volume);
    await this.sendDataUpdate();
  }

  async setPosition(position: Vector2): Promise<void> {
    this.entity.getCustomNetworkTransform().setPosition(position);
    await this.sendDataUpdate();
  }

  private async sendDataUpdate(): Promise<void> {
    await Promise.all(this.owners.map(async connection => connection.writeReliable(new GameDataPacket([
      this.entity.getSoundSource().serializeData(),
      this.entity.getCustomNetworkTransform().serializeData(),
    ], this.entity.getLobby().getCode()))));
  }
}
