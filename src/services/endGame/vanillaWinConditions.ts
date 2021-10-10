import { Server } from "@nodepolus/framework/src/server";
import { Services } from "../services";
import { ServiceType } from "../../types/enums";
import { BaseRole } from "../../baseRole";
import { RoleAlignment } from "../../baseRole/baseRole";
import { Palette } from "@nodepolus/framework/src/static";
import { Mutable } from "@nodepolus/framework/src/types";
import { WinSoundType } from "../../types/enums/winSound";
import { DeathReason, GameOverReason, GameState } from "@nodepolus/framework/src/types/enums";
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
              title: player.getMeta<BaseRole | undefined>("pgg.api.role")?.getAlignment() === RoleAlignment.Crewmate ? "Victory" : "<color=#FF1919FF>Defeat</color>",
              subtitle: "<color=#8CFFFFFF>Crewmates</color> won by tasks",
              color: Palette.crewmateBlue() as Mutable<[number, number, number, number]>,
              yourTeam: event.getPlayer().getLobby().getPlayers()
                .filter(sus => sus.getMeta<BaseRole | undefined>("pgg.api.role")?.getAlignment() === RoleAlignment.Crewmate),
              winSound: WinSoundType.CrewmateWin,
              hasWon: player.getMeta<BaseRole | undefined>("pgg.api.role")?.getAlignment() === RoleAlignment.Crewmate,
            }])),
          intentName: "crewmateTasks",
        });
      }
    });

    server.on("player.died", event => {
      if (this.shouldEndGameImpostors(event.getPlayer().getLobby()) && event.getReason() === DeathReason.Unknown) {
        endGame.registerEndGameIntent(event.getPlayer().getLobby().getGame()!, {
          endGameData: new Map(event.getPlayer().getLobby().getPlayers()
            .map(player => [player, {
              title: player.isImpostor() ? "Victory" : "<color=#FF1919FF>Defeat</color>",
              subtitle: "<color=#FF1919FF>Impostors</color> won by kills",
              color: Palette.impostorRed() as Mutable<[number, number, number, number]>,
              yourTeam: event.getPlayer()
                .getLobby()
                .getPlayers()
                .filter(sus => sus.isImpostor()),
              winSound: WinSoundType.ImpostorWin,
              hasWon: player.isImpostor(),
            }])),
          intentName: "impostorKill",
        });
      }
    });

    server.on("player.murdered", event => {
      if (event.getKiller().getMeta<BaseRole | undefined>("pgg.api.role")?.getAlignment() === RoleAlignment.Impostor && this.shouldEndGameImpostors(event.getPlayer().getLobby())) {
        endGame.registerEndGameIntent(event.getPlayer().getLobby().getGame()!, {
          endGameData: new Map(event.getPlayer().getLobby().getPlayers()
            .map(player => [player, {
              title: player.isImpostor() ? "Victory" : "<color=#FF1919FF>Defeat</color>",
              subtitle: "<color=#FF1919FF>Impostors</color> won by kills",
              color: Palette.impostorRed() as Mutable<[number, number, number, number]>,
              yourTeam: event.getPlayer()
                .getLobby()
                .getPlayers()
                .filter(sus => sus.isImpostor()),
              winSound: WinSoundType.ImpostorWin,
              hasWon: player.isImpostor(),
            }])),
          intentName: "impostorKill",
        });
      }
    });

    // this is going to call this code for every crewmate at least once
    server.on("meeting.ended", event => {
      if (event.getGame().getLobby().getPlayers()
        .filter(player => player.getMeta<BaseRole | undefined>("pgg.api.role")?.getAlignment() === RoleAlignment.Impostor && !player.getGameDataEntry().isDisconnected() && !(player.isDead() || (player.getMeta<boolean | undefined>("pgg.countAsDead") ?? false)))
        .length == 0) {
        endGame.registerEndGameIntent(event.getGame(), {
          endGameData: new Map(event.getGame().getLobby().getPlayers()
            .map(player => [player, {
              title: player.getMeta<BaseRole | undefined>("pgg.api.role")?.getAlignment() === RoleAlignment.Crewmate ? "Victory" : "<color=#FF1919FF>Defeat</color>",
              subtitle: "<color=#8CFFFFFF>Crewmates</color> voted out the <color=#FF1919FF>Impostors</color>",
              color: Palette.crewmateBlue() as Mutable<[number, number, number, number]>,
              yourTeam: event.getGame().getLobby().getPlayers()
                .filter(sus => sus.getMeta<BaseRole | undefined>("pgg.api.role")?.getAlignment() === RoleAlignment.Crewmate),
              winSound: WinSoundType.CrewmateWin,
              hasWon: player.getMeta<BaseRole | undefined>("pgg.api.role")?.getAlignment() === RoleAlignment.Crewmate,
            }])),
          intentName: "crewmateVote",
        });
      } else if (event.getGame().getLobby().getGameState() === GameState.Started && this.shouldEndGameImpostors(event.getGame().getLobby())) {
        endGame.registerEndGameIntent(event.getGame(), {
          endGameData: new Map(event.getGame()
            .getLobby()
            .getPlayers()
            .map(player => [player, {
              title: player.isImpostor() ? "Victory" : "<color=#FF1919FF>Defeat</color>",
              subtitle: "<color=#FF1919FF>Impostors</color> voted out the <color=#8CFFFFFF>Crewmates</color>",
              color: Palette.impostorRed() as Mutable<[number, number, number, number]>,
              yourTeam: event.getGame().getLobby().getPlayers()
                .filter(sus => sus.isImpostor()),
              winSound: WinSoundType.ImpostorWin,
              hasWon: player.isImpostor(),
            }])),
          intentName: "impostorVote",
        });
      }
    });

    server.on("player.left", event => {
      setTimeout(() => {
        if (event.getLobby().getGameState() !== GameState.Started) {
          // console.log("[VWC] Early exit due to invalid gamestate", GameState[event.getLobby().getGameState()]);

          return;
        }

        if (event.getLobby().getPlayers()
          .filter(x => x.getMeta<BaseRole | undefined>("pgg.api.role")?.getAlignment() === RoleAlignment.Impostor && !x.getGameDataEntry().isDisconnected() && !(x.isDead() || (x.getMeta<boolean | undefined>("pgg.countAsDead") ?? false))).length === 0) {
          endGame.registerEndGameIntent(event.getPlayer().getLobby().getGame()!, {
            endGameData: new Map(event.getPlayer().getLobby().getPlayers()
              .map(player => [player, {
                title: "Victory",
                subtitle: "<color=#FF1919FF>Impostor</color> disconnected",
                color: Palette.crewmateBlue() as Mutable<[number, number, number, number]>,
                yourTeam: event.getLobby().getPlayers()
                  .filter(sus => sus.getMeta<BaseRole | undefined>("pgg.api.role")?.getAlignment() === RoleAlignment.Crewmate),
                winSound: WinSoundType.CrewmateWin,
                hasWon: true,
              }])),
            intentName: "impostorDisconnected",
          });
        } else if (this.shouldEndGameImpostors(event.getLobby())) {
          endGame.registerEndGameIntent(event.getPlayer().getLobby().getGame()!, {
            endGameData: new Map(event.getPlayer().getLobby().getPlayers()
              .map(player => [player, {
                title: player.isImpostor() ? "Victory" : "<color=#FF1919FF>Defeat</color>",
                subtitle: "<color=#8CFFFFFF>Crewmates</color> disconnected",
                color: Palette.impostorRed() as Mutable<[number, number, number, number]>,
                yourTeam: event.getLobby().getPlayers()
                  .filter(sus => sus.getMeta<BaseRole | undefined>("pgg.api.role")?.getAlignment() === RoleAlignment.Impostor),
                winSound: WinSoundType.ImpostorWin,
                hasWon: player.isImpostor(),
              }])),
            intentName: "crewmateDisconnected",
          });
        }

        // console.log("[VWC] PL Fallthrough");
      }, 500);
    });

    server.on("game.ended", event => {
      if (event.getReason() === GameOverReason.ImpostorsBySabotage) {
        endGame.registerEndGameIntent(event.getGame(), {
          endGameData: new Map(event.getGame().getLobby().getPlayers()
            .map(player => [player, {
              title: player.isImpostor() ? "Victory" : "<color=#FF1919FF>Defeat</color>",
              subtitle: "<color=#FF1919FF>Impostors</color> won by sabotage",
              color: Palette.impostorRed() as Mutable<[number, number, number, number]>,
              yourTeam: event.getGame().getLobby().getPlayers()
                .filter(sus => sus.isImpostor()),
              winSound: WinSoundType.ImpostorWin,
              hasWon: player.isImpostor(),
            }])),
          intentName: "impostorSabotage",
        });
      }

      if (event.getReason() === GameOverReason.CrewmatesBySabotage) {
        if (event.getGame().getLobby().getPlayers()
          .filter(p => !p.isDead() && !p.getGameDataEntry().isDisconnected()).length === 0) {
          endGame.registerEndGameIntent(event.getGame(), {
            endGameData: new Map(event.getGame().getLobby().getPlayers()
              .map(player => [player, {
                title: "<color=#FF1919FF>Defeat</color>",
                subtitle: "Everyone died from the sabotage",
                color: Palette.disabledGrey() as Mutable<[number, number, number, number]>,
                yourTeam: [],
                winSound: WinSoundType.Disconnect,
                hasWon: false,
              }])),
            intentName: "nobodySabotage",
          });
        } else {
          endGame.registerEndGameIntent(event.getGame(), {
            endGameData: new Map(event.getGame().getLobby().getPlayers()
              .map(player => [player, {
                title: player.isImpostor() ? "<color=#FF1919FF>Defeat</color>" : "Victory",
                subtitle: "<color=#8CFFFFFF>Crewmates</color> won by sabotage",
                color: Palette.crewmateBlue() as Mutable<[number, number, number, number]>,
                yourTeam: event.getGame().getLobby().getPlayers()
                  .filter(sus => !sus.isImpostor()),
                winSound: WinSoundType.CrewmateWin,
                hasWon: !player.isImpostor(),
              }])),
            intentName: "crewmateSabotage",
          });
        }
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
      if (data.isDisconnected() || data.isDead() || lobby.findPlayerByPlayerId(data.getId())?.getMeta<boolean | undefined>("pgg.countAsDead")) {
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

  static noImpostorsLeft(lobby: LobbyInstance): boolean {
    if (lobby.getGameState() !== GameState.Started) {
      return false;
    }

    const playerData = lobby.getSafeGameData().getGameData().getPlayers();
    let i = 0;

    for (const data of playerData.values()) {
      if (data.isImpostor() && !(data.isDead() || data.isDisconnected() || lobby.findSafePlayerByPlayerId(data.getId()).getMeta<boolean | undefined>("pgg.countAsDead"))) {
        i++;
      }
    }

    return i == 0;
  }
}
