import { Game } from "@nodepolus/framework/src/api/game";
import { PlayerInstance } from "@nodepolus/framework/src/api/player";
import { Connection } from "@nodepolus/framework/src/protocol/connection";
import { OverwriteGameOver } from "../../packets/root";
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
    displayPlayAgain: true,
  };

  protected intents: Map<Game, EndGameIntent[]> = new Map();
  protected exclusions: Map<Game, EndGameExclusion[]> = new Map();

  async setEndGameData(connection: Connection | undefined, endGameData: EndGameScreenData): Promise<void> {
    connection?.setMeta("pgg.api.endGameData", endGameData);

    console.log(endGameData);

    return connection?.writeReliable(new OverwriteGameOver(
      endGameData.title.toString(),
      endGameData.subtitle.toString(),
      endGameData.color,
      endGameData.yourTeam.map(player => player.getId()),
      endGameData.displayQuit ?? true,
      endGameData.displayPlayAgain ?? true,
    ));
  }

  endGame(game: Game): void {
    game.getLobby().getConnections().forEach(connection => {
      if (connection.getMeta<EndGameScreenData | undefined>("pgg.api.endGameData") === undefined) {
        this.setEndGameData(connection, this.defaultEndGameData);
      }
    });

    game.getLobby().getHostInstance().endGame(0x07);
  }

  registerEndGameIntent(game: Game, endGameIntent: EndGameIntent): void {
    if (!this.intents.has(game)) {
      this.intents.set(game, []);
    }

    if (!this.intents.get(game)!.some(item => item.intentName === endGameIntent.intentName)) {
      this.intents.get(game)!.push(endGameIntent);
    }

    this.recalculateEndGame(game);
  }

  unregisterEndGameIntent(game: Game, endGameIntentName: EndGameIntent["intentName"]): void {
    if (!this.intents.has(game)) {
      this.intents.set(game, []);

      return;
    }

    const index = this.intents.get(game)!.findIndex(intent => intent.intentName === endGameIntentName);

    if (index !== -1) {
      this.intents.get(game)!.splice(index);

      return;
    }

    throw new Error(`Unable to find intent by name ${endGameIntentName}`);
  }

  registerExclusion(game: Game, exclusion: EndGameExclusion): void {
    if (!this.exclusions.has(game)) {
      this.exclusions.set(game, []);
    }

    if (!this.exclusions.get(game)!.some(item => item.intentName === exclusion.intentName)) {
      this.exclusions.get(game)!.push(exclusion);
    }

    this.recalculateEndGame(game);
  }

  unregisterExclusion(game: Game, exclusionName: EndGameExclusion["intentName"]): void {
    if (!this.exclusions.has(game)) {
      this.exclusions.set(game, []);

      return;
    }

    const index = this.exclusions.get(game)!.findIndex(exclusion => exclusion.intentName === exclusionName);

    if (index !== -1) {
      this.exclusions.get(game)!.splice(index);

      return;
    }

    throw new Error(`Unable to find intent by name ${exclusionName}`);
  }

  recalculateEndGame(game: Game): void {
    for (let i = 0; i < this.intents.get(game)!.length; i++) {
      const intent = this.intents.get(game)![i];

      if (!this.exclusions.get(game)!.some(exclusion => exclusion.intentName === intent.intentName)) {
        [...intent.endGameData.entries()].forEach(([player, data]) => {
          if (player.getConnection() !== undefined) {
            this.setEndGameData(player.getConnection(), data);
          }
        });

        this.endGame(game);
      }
    }
  }
}
