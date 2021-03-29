import { Game } from "@nodepolus/framework/src/api/game";
import { PlayerInstance } from "@nodepolus/framework/src/api/player";
import { TextComponent } from "@nodepolus/framework/src/api/text";
import { Player } from "@nodepolus/framework/src/player";
import { Connection } from "@nodepolus/framework/src/protocol/connection";
import { PlayerRole } from "@nodepolus/framework/src/types/enums";
import { shuffleArrayClone } from "@nodepolus/framework/src/util/shuffle";
import { BaseManager } from "../../baseManager/baseManager";
import { BaseRole } from "../../baseRole";
import { Crewmate } from "../../baseRole/crewmate/crewmate";
import { Impostor } from "../../baseRole/impostor/impostor";
import { DisplayStartGameScreenPacket, OverwriteGameOver } from "../../packets/root";
import { SetRolePacket } from "../../packets/rpc/playerControl";

export type EndGameScreenData = {
  title: string | TextComponent;
  subtitle: string | TextComponent;
  color: [number, number, number, number];
  yourTeam: PlayerInstance[];
  displayQuit?: boolean;
  displayPlayAgain?: boolean;
};

export type StartGameScreenData = {
  title: string | TextComponent;
  subtitle: string | TextComponent;
  color: readonly [number, number, number, number];
};

export type RoleAssignmentData = {
  playerCount: number;
  role: typeof BaseRole;
  startGameScreen?: StartGameScreenData;
};

export class RoleManagerService {
  //@TODO: Setters and getters for defaultEndGameData
  public defaultEndGameData: EndGameScreenData = {
    title: "undefined",
    subtitle: "no data was sent from the server for your end game",
    color: [127, 127, 127, 255],
    yourTeam: [],
    displayQuit: true,
    displayPlayAgain: true,
  };

  async setEndGameData(connection: Connection | undefined, endGameData: EndGameScreenData): Promise<void> {
    connection?.setMeta("pgg.api.endGameData", endGameData);

    return connection?.writeReliable(new OverwriteGameOver(
      endGameData.title.toString(),
      endGameData.subtitle.toString(),
      endGameData.color,
      endGameData.yourTeam.map(player => player.getId()),
      endGameData.displayQuit ?? true,
      endGameData.displayPlayAgain ?? false,
    ));
  }

  endGame(game: Game): void {
    game.getLobby().getConnections().forEach(connection => {
      if (connection.getMeta<EndGameScreenData | undefined>("pgg.api.endGameData") === undefined) {
        this.setEndGameData(connection, this.defaultEndGameData);
      }
    });

    game.getLobby().getHostInstance().endGame(0xff);
  }

  assignRoles(game: Game, assignmentData: RoleAssignmentData[]): void {
    const assignmentArray: { role: typeof BaseRole; startGameScreen?: StartGameScreenData }[] = [];

    for (let i = 0; i < assignmentData.length; i++) {
      const singleAssignmentData = assignmentData[i];

      for (let j = 0; j < singleAssignmentData.playerCount; j++) {
        assignmentArray.push({
          role: singleAssignmentData.role,
          startGameScreen: singleAssignmentData.startGameScreen,
        });
      }
    }

    const managers: typeof BaseManager[] = [];

    shuffleArrayClone(game.getLobby().getPlayers().filter(p => !p.isImpostor())).forEach((player, index) => {
      console.log(player.getName(), player.isImpostor());

      if (index < assignmentArray.length) {
        const role = this.assignRole(player, assignmentArray[index].role, assignmentArray[index].startGameScreen);

        managers.push(role.getManagerType());
      } else {
        const role = this.assignRole(player, Crewmate);

        managers.push(role.getManagerType());
      }
    });

    game.getLobby().getPlayers().filter(p => p.isImpostor()).forEach(player => {
      const role = this.assignRole(player, Impostor);

      managers.push(role.getManagerType());
    });

    const uniqueManagers = [...new Set(managers)];

    for (let i = 0; i < uniqueManagers.length; i++) {
      const manager = new uniqueManagers[i](game.getLobby());

      game.getLobby().setMeta(`pgg.manager.${manager.getId()}`, manager);
    }
  }

  assignRole<T extends typeof BaseRole>(player: PlayerInstance, role: T, startGameScreen?: StartGameScreenData): BaseRole {
    // eslint-disable-next-line new-cap
    const roleInstance = new role(player);

    startGameScreen ||= roleInstance.getAssignmentScreen(player);

    player.setMeta("pgg.api.role", roleInstance);

    const connection = player.getConnection();

    if (connection !== undefined) {
      connection.writeReliable(new DisplayStartGameScreenPacket(
        startGameScreen.title.toString(),
        startGameScreen.subtitle.toString(),
        startGameScreen.color,
        player.getLobby().getPlayers().filter(p => p.getMeta<BaseRole>("pgg.api.role") === roleInstance).map(p => p.getId()),
      ));
    }

    return roleInstance;
  }

  setBaseRole(player: Player, role: PlayerRole): void {
    player.getEntity().getPlayerControl().sendRpcPacket(new SetRolePacket(role), player.getLobby().getConnections());
  }
}
