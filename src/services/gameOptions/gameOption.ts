import { LobbyInstance } from "@nodepolus/framework/src/api/lobby";
import { SetGameOption } from "../../packets/root/setGameOption";

export class GameOption<V extends boolean | number> {
  constructor(protected readonly lobby: LobbyInstance, protected readonly key: string, protected value: V) {}

  async setValue(value: V): Promise<void> {
    this.value = value;

    await this.lobby.sendRootGamePacket(new SetGameOption(this.key, value), this.lobby.getConnections());
  }

  getValue(): V {
    return this.value;
  }

  getKey(): string {
    return this.key;
  }

  getLobby(): LobbyInstance {
    return this.lobby;
  }
}
