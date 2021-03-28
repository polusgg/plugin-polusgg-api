import { RoleAssignmentData } from "../services/roleManager/roleManagerService";
import { PluginMetadata } from "@nodepolus/framework/src/api/plugin";
import { LobbyInstance } from "@nodepolus/framework/src/api/lobby";

export class BaseMod {
  constructor(
    protected readonly modMetadata: PluginMetadata,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getRoles(lobby: LobbyInstance): RoleAssignmentData[] { return [] }
}
