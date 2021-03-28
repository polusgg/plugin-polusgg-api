import { RoleAssignmentData } from "../services/roleManager/roleManagerService";
import { PluginMetadata } from "@nodepolus/framework/src/api/plugin";
import { LobbyInstance } from "@nodepolus/framework/src/api/lobby";
import { TextComponent } from "@nodepolus/framework/src/api/text";
import { BaseRole } from "../baseRole";

export class BaseMod {
  constructor(
    protected readonly modMetadata: PluginMetadata,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getRoles(lobby: LobbyInstance): RoleAssignmentData[] { return [] }
}

/// example mod

export class Jester extends BaseRole {

}

export default class extends BaseMod {
  constructor() {
    super({
      name: "JesterMod",
      version: [1, 0, 0],
    });
  }

  getRoles(_lobby: LobbyInstance): RoleAssignmentData[] {
    return [{
      playerCount: 2,
      role: Jester,
      startGameScreen: {
        title: new TextComponent().setColor(215, 72, 154).add("Jester"),
        subtitle: new TextComponent().add("You are the Jester. Get voted out to win!"),
        color: [215, 72, 154, 255],
      },
    }];
  }
}
