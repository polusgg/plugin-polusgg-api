import { PlayerInstance } from "@nodepolus/framework/src/api/player";
import { Palette } from "@nodepolus/framework/src/static";
import { BaseManager } from "../../baseManager/baseManager";
import { StartGameScreenData } from "../../services/roleManager/roleManagerService";
import { BaseRole, RoleAlignment } from "../baseRole";

export class ImpostorManager extends BaseManager {
  getId(): string { return "impostor" }
  getTypeName(): string { return "impostor" }
}

export class Impostor extends BaseRole {
  protected readonly metadata = {
    name: "impostor",
    alignment: RoleAlignment.Impostor,
  };

  getAssignmentScreen(_player: PlayerInstance): StartGameScreenData {
    return {
      title: `[${Palette.impostorRed().map(e => e.toString(16)).join("")}]Cringe`,
      subtitle: ``,
      color: Palette.impostorRed(),
    };
  }

  getManagerType(): typeof ImpostorManager { return ImpostorManager }
}
