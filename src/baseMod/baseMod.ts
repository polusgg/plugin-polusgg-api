import { RoleAssignmentData } from "../services/roleManager/roleManagerService";
import { BasePlugin, PluginMetadata } from "@nodepolus/framework/src/api/plugin";
import { LobbyInstance } from "@nodepolus/framework/src/api/lobby";
import PolusGGApi from "../..";

export class BaseMod extends BasePlugin {
  public static owner: PolusGGApi;

  constructor(
    protected readonly modMetadata: PluginMetadata,
  ) {
    super({
      ...modMetadata,
      name: `Polus.gg Gamemode - ${modMetadata.name}`,
    });

    BaseMod.owner.registerMod(this);
  }

  getMetadata(): PluginMetadata {
    return this.modMetadata;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getRoles(lobby: LobbyInstance): RoleAssignmentData[] { return [] }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getEnabled(lobby: LobbyInstance): boolean { return false }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
  async onEnable(lobby: LobbyInstance): Promise<void> {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
  async onDisable(lobby: LobbyInstance): Promise<void> {}
}
