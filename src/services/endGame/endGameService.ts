import { Game } from "@nodepolus/framework/src/api/game";
import { PlayerInstance } from "@nodepolus/framework/src/api/player";
import { Connection } from "@nodepolus/framework/src/protocol/connection";
// import { GameState } from "@nodepolus/framework/src/types/enums";
import { OverwriteGameOver } from "../../packets/root";
import { WinSoundType } from "../../types/enums/winSound";
import { EndGameScreenData } from "../roleManager/roleManagerService";

type EndGameIntent = {
  endGameData: Map<PlayerInstance, EndGameScreenData>;
  intentName: string;
};

type EndGameExclusion = {
  intentName: string;
};

export class EndGameService {
  //@TODO: Setters and getters for defaultEndGameData
  public defaultEndGameData: EndGameScreenData = {
    title: "Missing",
    subtitle: "End game was not overwritten",
    color: [127, 127, 127, 255],
    yourTeam: [],
    displayQuit: true,
    displayPlayAgain: false,
    winSound: WinSoundType.Disconnect,
  };

  protected intents: Map<Game, EndGameIntent[]> = new Map();
  protected exclusions: Map<Game, EndGameExclusion[]> = new Map();

  async setEndGameData(connection: Connection, endGameData: EndGameScreenData): Promise<void> {
    connection.setMeta("pgg.api.endGameData", endGameData);

    return connection.writeReliable(new OverwriteGameOver(
      endGameData.title.toString(),
      endGameData.subtitle.toString(),
      endGameData.color,
      endGameData.yourTeam.map(player => player.getId()),
      endGameData.displayQuit ?? true,
      endGameData.displayPlayAgain ?? true,
      endGameData.winSound,
    ));
  }

  async endGame(game?: Game): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (game === undefined || game.getLobby() === undefined) {
      return;
    }

    game.getLobby().getConnections().forEach(connection => {
      if (connection.getMeta<EndGameScreenData | undefined>("pgg.api.endGameData") === undefined) {
        this.setEndGameData(connection, this.defaultEndGameData);
      }
    });

    await game.getLobby().getHostInstance().endGame(0x07);
  }

  async registerEndGameIntent(game: Game, endGameIntent: EndGameIntent): Promise<void> {
    if (!this.intents.has(game)) {
      this.intents.set(game, []);
    }

    if (!this.intents.get(game)!.some(item => item.intentName === endGameIntent.intentName)) {
      this.intents.get(game)!.push(endGameIntent);
    }

    await this.recalculateEndGame(game);
  }

  unregisterEndGameIntent(game: Game, endGameIntentName: EndGameIntent["intentName"]): void {
    if (!this.intents.has(game)) {
      this.intents.set(game, []);

      return;
    }

    const index = this.intents.get(game)!.findIndex(intent => intent.intentName === endGameIntentName);

    if (index !== -1) {
      this.intents.get(game)!.splice(index, 1);

      return;
    }

    throw new Error(`Unable to find intent by name ${endGameIntentName}`);
  }

  async registerExclusion(game: Game, exclusion: EndGameExclusion): Promise<void> {
    if (!this.exclusions.has(game)) {
      this.exclusions.set(game, []);
    }

    if (!this.exclusions.get(game)!.some(item => item.intentName === exclusion.intentName)) {
      this.exclusions.get(game)!.push(exclusion);
    }

    await this.recalculateEndGame(game);
  }

  async unregisterExclusion(game: Game, exclusionName: EndGameExclusion["intentName"]): Promise<void> {
    if (!this.exclusions.has(game)) {
      this.exclusions.set(game, []);

      return;
    }

    const index = this.exclusions.get(game)!.findIndex(exclusion => exclusion.intentName === exclusionName);

    if (index !== -1) {
      this.exclusions.get(game)!.splice(index, 1);
    }

    await this.recalculateEndGame(game);
  }

  async recalculateEndGame(game: Game): Promise<void> {
    if (!this.intents.has(game)) {
      return;
    }

    for (let i = 0; i < this.intents.get(game)!.length; i++) {
      const intent = this.intents.get(game)![i];

      if (!this.exclusions.has(game) || !this.exclusions.get(game)!.some(exclusion => exclusion.intentName === intent.intentName)) {
        [...intent.endGameData.entries()].forEach(([player, data]) => {
          if (player.getConnection() !== undefined) {
            this.setEndGameData(player.getSafeConnection(), data);
          }
        });

        await this.endGame(game);

        break;
      }
    }
  }
}
