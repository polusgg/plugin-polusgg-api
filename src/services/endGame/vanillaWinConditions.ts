import { Server } from "@nodepolus/framework/src/server";
import { Services } from "../services";
import { ServiceType } from "../../types/enums";
import { BaseRole } from "../../baseRole";
import { RoleAlignment } from "../../baseRole/baseRole";
import { Palette } from "@nodepolus/framework/src/static";
import { Mutable } from "@nodepolus/framework/src/types";
import { WinSoundType } from "@nodepolus/framework/src/types/enums/polus/polusWinSound";
import { GameOverReason, GameState } from "@nodepolus/framework/src/types/enums";
import { PlayerData } from "@nodepolus/framework/src/protocol/entities/gameData/types";
import { LobbyInstance } from "@nodepolus/framework/src/api/lobby";

// moved win conditions into a separate class to create less events per role creation
export class VanillaWinConditions {
  static setup(server: Server): void {
    const endGame = Services.get(ServiceType.EndGame);

    server.on("player.task.completed", event => {
      if (event.getPlayer().getLobby().getPlayers()
        .filter(player => player.getMeta<BaseRole | undefined>("pgg.api.role")?.getAlignment() === RoleAlignment.Crewmate)
        .filter(player => !player.getLobby().getGameData()?.getGameData()
          .getSafePlayer(player.getId())
          .isDoneWithTasks(),
        ).length == 0) {
        endGame.registerEndGameIntent(event.getPlayer().getLobby().getGame()!, {
          endGameData: new Map(event.getPlayer().getLobby().getPlayers()
            .map(player => [player, {
              title: player.getMeta<BaseRole | undefined>("pgg.api.role")?.getAlignment() === RoleAlignment.Crewmate ? "Victory" : "Defeat",
              subtitle: "<color=#8CFFFFFF>Crewmates</color> won by tasks",
              color: Palette.crewmateBlue() as Mutable<[number, number, number, number]>,
              yourTeam: event.getPlayer().getLobby().getPlayers()
                .filter(sus => sus.getMeta<BaseRole | undefined>("pgg.api.role")?.getAlignment() === RoleAlignment.Crewmate),
              winSound: WinSoundType.CrewmateWin,
            }])),
          intentName: "crewmateTasks",
        });
      }
    });

    server.on("player.murdered", event => {
      if (event.getKiller().getMeta<BaseRole | undefined>("pgg.api.role")?.getAlignment() === RoleAlignment.Impostor && this.shouldEndGameImpostors(event.getPlayer().getLobby())) {
        endGame.registerEndGameIntent(event.getPlayer().getLobby().getGame()!, {
          endGameData: new Map(event.getPlayer().getLobby().getPlayers()
            .map(player => [player, {
              title: player.isImpostor() ? "Victory" : "Defeat",
              subtitle: "<color=#FF1919FF>Impostors</color> won by kills",
              color: Palette.impostorRed() as Mutable<[number, number, number, number]>,
              yourTeam: event.getPlayer()
                .getLobby()
                .getPlayers()
                .filter(sus => sus.isImpostor()),
              winSound: WinSoundType.ImpostorWin,
            }])),
          intentName: "impostorKill",
        });
      }
    });

    // this is going to call this code for every crewmate at least once
    server.on("meeting.ended", event => {
      if (event.getGame().getLobby().getPlayers()
        .filter(player => player.getMeta<BaseRole | undefined>("pgg.api.role")?.getAlignment() === RoleAlignment.Impostor && !player.isDead())
        .length == 0) {
        endGame.registerEndGameIntent(event.getGame(), {
          endGameData: new Map(event.getGame().getLobby().getPlayers()
            .map(player => [player, {
              title: player.getMeta<BaseRole | undefined>("pgg.api.role")?.getAlignment() === RoleAlignment.Crewmate ? "Victory" : "Defeat",
              subtitle: "<color=#8CFFFFFF>Crewmates</color> voted out the <color=#FF1919FF>Impostors</color>",
              color: Palette.crewmateBlue() as Mutable<[number, number, number, number]>,
              yourTeam: event.getGame().getLobby().getPlayers()
                .filter(sus => sus.getMeta<BaseRole | undefined>("pgg.api.role")?.getAlignment() === RoleAlignment.Crewmate),
              winSound: WinSoundType.CrewmateWin,
            }])),
          intentName: "crewmateVote",
        });
      } else if (event.getGame().getLobby().getGameState() === GameState.Started && this.shouldEndGameImpostors(event.getGame().getLobby())) {
        endGame.registerEndGameIntent(event.getGame(), {
          endGameData: new Map(event.getGame()
            .getLobby()
            .getPlayers()
            .map(player => [player, {
              title: player.isImpostor() ? "Victory" : "Defeat",
              subtitle: "<color=#FF1919FF>Impostors</color> voted out the <color=#8CFFFFFF>Crewmates</color>",
              color: Palette.impostorRed() as Mutable<[number, number, number, number]>,
              yourTeam: event.getGame().getLobby().getPlayers()
                .filter(sus => !sus.isImpostor()),
              winSound: WinSoundType.ImpostorWin,
            }])),
          intentName: "impostorVote",
        });
      }
    });

    server.on("player.left", event => {
      if (event.getLobby().getPlayers().filter(x => x.isImpostor()).length === 0) {
        endGame.registerEndGameIntent(event.getPlayer().getLobby().getGame()!, {
          endGameData: new Map(event.getPlayer().getLobby().getPlayers()
            .map(player => [player, {
              title: "Victory",
              subtitle: "<color=#FF1919FF>Impostor</color> disconnected",
              color: Palette.crewmateBlue() as Mutable<[number, number, number, number]>,
              yourTeam: event.getLobby().getPlayers()
                .filter(sus => sus.getMeta<BaseRole | undefined>("pgg.api.role")?.getAlignment() === RoleAlignment.Crewmate),
              winSound: WinSoundType.ImpostorWin,
            }])),
          intentName: "impostorDisconnected",
        });
      } else if (this.shouldEndGameImpostors(event.getLobby())) {
        endGame.registerEndGameIntent(event.getPlayer().getLobby().getGame()!, {
          endGameData: new Map(event.getPlayer().getLobby().getPlayers()
            .map(player => [player, {
              title: player.isImpostor() ? "Victory" : "Defeat",
              subtitle: "<color=#8CFFFFFF>Crewmates</color> disconnected",
              color: Palette.impostorRed() as Mutable<[number, number, number, number]>,
              yourTeam: event.getLobby().getPlayers()
                .filter(sus => sus.getMeta<BaseRole | undefined>("pgg.api.role")?.getAlignment() === RoleAlignment.Impostor),
              winSound: WinSoundType.CrewmateWin,
            }])),
          intentName: "crewmateDisconnected",
        });
      }
    });

    server.on("game.ended", event => {
      if (event.getReason() === GameOverReason.ImpostorsBySabotage) {
        endGame.registerEndGameIntent(event.getGame(), {
          endGameData: new Map(event.getGame().getLobby().getPlayers()
            .map(player => [player, {
              title: player.isImpostor() ? "Victory" : "Defeat",
              subtitle: "<color=#8CFFFFFF>Impostors</color> won by sabotage",
              color: Palette.impostorRed() as Mutable<[number, number, number, number]>,
              yourTeam: event.getGame().getLobby().getPlayers()
                .filter(sus => sus.isImpostor()),
              winSound: WinSoundType.ImpostorWin,
            }])),
          intentName: "impostorSabotage",
        });
      }
    });
  }

  static shouldEndGameImpostors(lobby: LobbyInstance): boolean {
    if (lobby.getGameState() !== GameState.Started) {
      return false;
    }

    const gameData = lobby.getSafeGameData();
    const aliveImpostors: PlayerData[] = [];
    const aliveCrewmates: PlayerData[] = [];
    const playerData = gameData.getGameData().getPlayers();

    for (const [pid, data] of playerData) {
      if (data.isDead() || data.isDisconnected()) {
        continue;
      }

      if (lobby.getPlayers().find(x => x.getId() == pid)?.getMeta<BaseRole | undefined>("pgg.api.role")
        ?.getAlignment() === RoleAlignment.Impostor) {
        aliveImpostors.push(data);
      } else {
        aliveCrewmates.push(data);
      }
    }

    return aliveImpostors.length >= aliveCrewmates.length;
  }
}
