import { Connection } from "@nodepolus/framework/src/protocol/connection";
import { GameDataPacket } from "@nodepolus/framework/src/protocol/packets/root/gameDataPacket";
import { Vector2 } from "@nodepolus/framework/src/types";
import { Services } from "..";
import { AudioAsset } from "../../assets";
import { EntitySoundSource } from "../../entities/entitySoundSource";
import { ServiceType } from "../../types/enums";
import { SoundType } from "../../types/enums/soundType";
import { SoundController } from "./soundController";

export class SoundManagerService {
  async playSound(connection: Connection | Connection[], asset: AudioAsset, { position, soundType, volumeModifier, looping, paused, pitch, soundFalloffMultiplier, soundFalloffStartingRadius, seek }: {
    position: Vector2;
    soundType?: SoundType;
    volumeModifier?: number;
    looping?: boolean;
    paused?: boolean;
    pitch?: number;
    soundFalloffMultiplier?: number;
    soundFalloffStartingRadius?: number;
    seek?: number;
  }): Promise<SoundController> {
    if (Array.isArray(connection)) {
      const entity = new EntitySoundSource(connection[0].getLobby()!, asset.getId(), position, asset.getDurationMs(), soundType, volumeModifier, looping, paused, pitch, soundFalloffMultiplier, soundFalloffStartingRadius, seek);

      for (let i = 0; i < connection.length; i++) {
        if (connection[i].getLobby() !== connection[0].getLobby()) {
          throw new Error("Lobby mismatch for soundManagerService.playSound connection[]");
        }

        await Services.get(ServiceType.Resource).assertLoaded(connection[i], asset);

        await connection[i].writeReliable(new GameDataPacket([
          entity.serializeSpawn(),
        ], connection[i].getLobby()!.getCode()));
      }

      return new SoundController(entity, connection);
    }

    await Services.get(ServiceType.Resource).assertLoaded(connection, asset);

    const entity = new EntitySoundSource(connection.getLobby()!, asset.getId(), position, asset.getDurationMs(), soundType, volumeModifier, looping, paused, pitch, soundFalloffMultiplier, soundFalloffStartingRadius, seek);

    await connection.writeReliable(new GameDataPacket([
      entity.serializeSpawn(),
    ], connection.getLobby()!.getCode()));

    return new SoundController(entity, [connection]);
  }
}
