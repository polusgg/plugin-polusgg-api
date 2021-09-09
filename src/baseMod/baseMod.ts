import { RoleAssignmentData } from "../services/roleManager/roleManagerService";
import { BasePlugin, PluginMetadata } from "@nodepolus/framework/src/api/plugin";
import { LobbyInstance } from "@nodepolus/framework/src/api/lobby";
import PolusGGApi from "../..";
import { Services } from "../services";
import { ServiceType } from "../types/enums";
import { EnumValue } from "../packets/root/setGameOption";

export class BaseMod extends BasePlugin {
  public static owner: PolusGGApi;

  constructor(
    protected readonly modMetadata: PluginMetadata,
  ) {
    super({
      ...modMetadata,
    });

    BaseMod.owner.registerMod(this);
  }

  getMetadata(): PluginMetadata {
    return this.modMetadata;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getRoles(lobby: LobbyInstance): RoleAssignmentData[] { return [] }

  getEnabled(lobby: LobbyInstance): boolean {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const option = Services.get(ServiceType.GameOptions).getGameOptions<{ Gamemode: EnumValue }>(lobby).getOption("Gamemode");

    return (option.getValue().getSelected() === this.modMetadata.name);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/require-await
  async onEnable(lobby: LobbyInstance): Promise<void> {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/require-await
  async onDisable(lobby: LobbyInstance): Promise<void> {}
}
