import { PlayerInstance } from "@nodepolus/framework/src/api/player";
import { Palette } from "@nodepolus/framework/src/static";
import { BaseManager } from "../../baseManager/baseManager";
import { StartGameScreenData } from "../../services/roleManager/roleManagerService";
import { BaseRole, RoleAlignment } from "../baseRole";

export class CrewmateManager extends BaseManager {
  getId(): string { return "crewmate" }
  getTypeName(): string { return "crewmate" }
}

export class Crewmate extends BaseRole {
  protected readonly metadata = {
    name: "crewmate",
    alignment: RoleAlignment.Crewmate,
  };

  getAssignmentScreen(_player: PlayerInstance): StartGameScreenData {
    return {
      title: `Crewmate`,
      subtitle: `There is <color=#${Palette.impostorRed().map(e => e.toString(16)).join("")}>Impostors</color among us`,
      color: Palette.crewmateBlue(),
    };
  }

  getManagerType(): typeof CrewmateManager { return CrewmateManager }
}
