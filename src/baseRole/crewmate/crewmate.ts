import { PlayerInstance } from "@nodepolus/framework/src/api/player";
import { Palette } from "@nodepolus/framework/src/static";
import { Mutable } from "@nodepolus/framework/src/types";
import { BaseManager } from "../../baseManager/baseManager";
import { Services } from "../../services";
import { StartGameScreenData } from "../../services/roleManager/roleManagerService";
import { ServiceType } from "../../types/enums";
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

  constructor(owner: PlayerInstance) {
    super(owner);

    const endGame = Services.get(ServiceType.EndGame);

    // todo not duplicate code for crewmate wins on sheriff!!!!

    this.catch("player.task.completed", event => event.getPlayer())
      .where(() => this.getAlignment() === RoleAlignment.Crewmate)
      .where(event => event.getPlayer().getLobby().getPlayers()
        .filter(player => player.getMeta<BaseRole | undefined>("pgg.api.role")?.getAlignment() === RoleAlignment.Crewmate)
        .filter(player => player.getTasks().filter(x => !x[1]).length < 1).length == 0,
      )
      .execute(event => endGame.registerEndGameIntent(event.getPlayer().getLobby().getGame()!, {
        endGameData: new Map(event.getPlayer().getLobby().getPlayers()
          .map(player => [player, {
            title: player.isImpostor() ? "Defeat" : "Victory",
            subtitle: "<color=#8CFFFFFF>Crew</color> won by tasks",
            color: Palette.crewmateBlue() as Mutable<[number, number, number, number]>,
            yourTeam: event.getPlayer().getLobby().getPlayers()
              .filter(sus => !sus.isImpostor()),
          }])),
        intentName: "crewmateTasks",
      }));

    // this is going to call this code for every crewmate at least once
    this.catch("meeting.closed", event => event.getGame())
      .where(() => this.getAlignment() === RoleAlignment.Crewmate)
      .where(event => event.getGame().getLobby().getPlayers()
        .filter(player => player.isImpostor() && !player.isDead())
        .length == 0,
      )
      .execute(event => endGame.registerEndGameIntent(event.getGame(), {
        endGameData: new Map(event.getGame().getLobby().getPlayers()
          .map(player => [player, {
            title: player.isImpostor() ? "Defeat" : "Victory",
            subtitle: "<color=#8CFFFFFF>Crewmates</color> voted out the <color=#FF1919FF>Impostors</color>",
            color: Palette.crewmateBlue() as Mutable<[number, number, number, number]>,
            yourTeam: event.getGame().getLobby().getPlayers()
              .filter(sus => !sus.isImpostor()),
          }])),
        intentName: "crewmateVote",
      }));

    this.catch("player.left", event => event.getPlayer())
      .where(event => event.getLobby().getPlayers().filter(player => !player.isImpostor() && player !== event.getPlayer()).length == 0)
      .execute(event => endGame.registerEndGameIntent(event.getPlayer().getLobby().getGame()!, {
        endGameData: new Map(event.getPlayer().getLobby().getPlayers()
          .map(player => [player, {
            title: "Defeat",
            subtitle: "<color=#FF1919FF>Crewmates</color> disconnected",
            color: Palette.impostorRed() as Mutable<[number, number, number, number]>,
            yourTeam: event.getPlayer().getLobby().getPlayers(),
          }])),
        intentName: "crewmateDisconnected",
      }));
  }

  getAssignmentScreen(player: PlayerInstance): StartGameScreenData {
    const impostors = player.getLobby().getPlayers().filter(players => players.isImpostor()).length;

    return {
      title: "Crewmate",
      subtitle: `There ${(impostors > 1 ? "are" : "is")} <color=#FF1919FF>impostor${(impostors > 1 ? "s" : "")}</color> among us`,
      color: Palette.crewmateBlue(),
    };
  }

  getManagerType(): typeof CrewmateManager { return CrewmateManager }
}
