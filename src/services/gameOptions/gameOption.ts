import { LobbyInstance } from "@nodepolus/framework/src/api/lobby";
import { Connection } from "@nodepolus/framework/src/protocol/connection";
import { Services } from "..";
import { NumberValue, BooleanValue, EnumValue, SetGameOption } from "../../packets/root/setGameOption";
import { ServiceType } from "../../types/enums";

export class GameOption<V extends NumberValue | BooleanValue | EnumValue> {
  constructor(protected readonly lobby: LobbyInstance, protected readonly category: string, protected readonly key: string, protected value: V) {}

  async setValue(value: V, sendTo: Connection[] = this.lobby.getConnections()): Promise<void> {
    this.value = value;

    Services.get(ServiceType.GameOptions).getGameOptions(this.getLobby()).emit(`option.${this.getKey()}.changed` as `option.${string}.changed`, this);
    Services.get(ServiceType.GameOptions).getGameOptions(this.getLobby()).emit(`option.*.changed`, this);

    const proms = new Array<Promise<void>>(sendTo.length);

    for (let i = 0; i < sendTo.length; i++) {
      const connection = sendTo[i];
      const sequenceId = Services.get(ServiceType.GameOptions).nextSequenceId(this.getLobby(), connection);

      proms[i] = connection.writeReliable(new SetGameOption(sequenceId, this.category, this.key, value));
    }

    await Promise.all(proms);
  }

  getValue(): V {
    return this.value;
  }

  getCategory(): string {
    return this.category;
  }

  getKey(): string {
    return this.key;
  }

  getLobby(): LobbyInstance {
    return this.lobby;
  }
}
