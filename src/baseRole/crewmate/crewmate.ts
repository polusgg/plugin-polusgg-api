import { PlayerInstance } from "@nodepolus/framework/src/api/player";
import { Palette } from "@nodepolus/framework/src/static";
import { BaseManager } from "../../baseManager/baseManager";
import { StartGameScreenData } from "../../services/roleManager/roleManagerService";
import { BaseRole, RoleAlignment } from "../baseRole";
import { Services } from "../../services";
import { ServiceType } from "../../types/enums";
import { PlayerRole } from "@nodepolus/framework/src/types/enums";

export class CrewmateManager extends BaseManager {
  getId(): string {
    return "crewmate";
  }

  getTypeName(): string {
    return "crewmate";
  }
}

export class Crewmate extends BaseRole {
  protected readonly metadata = {
    name: "crewmate",
    alignment: RoleAlignment.Crewmate,
  };

  constructor(owner: PlayerInstance) {
    super(owner);

    Services.get(ServiceType.RoleManager)
      .setBaseRole(this.owner, PlayerRole.Crewmate);
  }

  getAssignmentScreen(player: PlayerInstance, impostorCount: number): StartGameScreenData {
    return {
      title: "Crewmate",
      subtitle: `There ${(impostorCount != 1 ? "are" : "is")} ${impostorCount} <color=#FF1919FF>impostor${(impostorCount != 1 ? "s" : "")}</color> among us`,
      color: Palette.crewmateBlue(),
    };
  }

  getDescriptionText(): string {
    return `<color=#8cffff>Role: Crewmate
Finish your tasks.</color>`;
  }

  getManagerType(): typeof CrewmateManager {
    return CrewmateManager;
  }
}
