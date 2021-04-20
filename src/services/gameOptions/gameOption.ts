import { LobbyInstance } from "@nodepolus/framework/src/api/lobby";
import { Services } from "..";
import { NumberValue, BooleanValue, EnumValue, SetGameOption } from "../../packets/root/setGameOption";
import { ServiceType } from "../../types/enums";

export class GameOption<V extends NumberValue | BooleanValue | EnumValue> {
  constructor(protected readonly lobby: LobbyInstance, protected readonly category: string, protected readonly key: string, protected value: V) {}

  async setValue(value: V): Promise<void> {
    this.value = value;

    Services.get(ServiceType.GameOptions).getGameOptions(this.getLobby()).emit(`option.${this.getKey()}.changed` as `option.${string}.changed`, this);
    Services.get(ServiceType.GameOptions).getGameOptions(this.getLobby()).emit(`option.*.changed`, this);

    await this.lobby.sendRootGamePacket(new SetGameOption(this.category, this.key, value), this.lobby.getConnections());
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
