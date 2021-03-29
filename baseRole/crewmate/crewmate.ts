import { PlayerInstance } from "@nodepolus/framework/src/api/player";
import { Palette } from "@nodepolus/framework/src/static";
import { StartGameScreenData } from "../../services/roleManager/roleManagerService";
import { BaseRole } from "../baseRole";

export class Crewmate extends BaseRole {
  getAssignmentScreen(_player: PlayerInstance): StartGameScreenData {
    return {
      title: `[${Palette.crewmateBlue().map(e => e.toString(16)).join("")}]Crewmate`,
      subtitle: `There is [${Palette.impostorRed().map(e => e.toString(16)).join("")}]Cringe[] among us`,
      color: Palette.crewmateBlue(),
    };
  }
}
