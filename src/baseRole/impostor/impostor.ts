import { PlayerInstance } from "@nodepolus/framework/src/api/player";
import { Player } from "@nodepolus/framework/src/player";
import { Palette } from "@nodepolus/framework/src/static";
import { PlayerRole } from "@nodepolus/framework/src/types/enums";
import { BaseManager } from "../../baseManager/baseManager";
import { Services } from "../../services";
import { StartGameScreenData } from "../../services/roleManager/roleManagerService";
import { ServiceType } from "../../types/enums";
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

  constructor(owner: PlayerInstance) {
    super(owner);

    Services.get(ServiceType.RoleManager).setBaseRole(owner as Player, PlayerRole.Impostor);
  }

  getAssignmentScreen(_player: PlayerInstance): StartGameScreenData {
    return {
      title: `Impostor`,
      subtitle: ``,
      color: Palette.impostorRed(),
    };
  }

  getManagerType(): typeof ImpostorManager { return ImpostorManager }
}
