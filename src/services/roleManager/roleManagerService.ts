import { Game } from "@nodepolus/framework/src/api/game";
import { PlayerInstance } from "@nodepolus/framework/src/api/player";
import { TextComponent } from "@nodepolus/framework/src/api/text";
import { Player } from "@nodepolus/framework/src/player";
import { Connection } from "@nodepolus/framework/src/protocol/connection";
import { PlayerRole } from "@nodepolus/framework/src/types/enums";
import { shuffleArrayClone } from "@nodepolus/framework/src/util/shuffle";
import { BaseManager } from "../../baseManager/baseManager";
import { BaseRole } from "../../baseRole";
import { RoleAlignment } from "../../baseRole/baseRole";
import { Crewmate } from "../../baseRole/crewmate/crewmate";
import { Impostor } from "../../baseRole/impostor/impostor";
import { DisplayStartGameScreenPacket, OverwriteGameOver } from "../../packets/root";
import { SetRolePacket } from "../../packets/rpc/playerControl";
import { ServiceType } from "../../types/enums";
import { LobbyDefaultOptions } from "../gameOptions/gameOptionsService";
import { Services } from "../services";

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
  assignWith: RoleAlignment;
};

export class RoleManagerService {
  //@TODO: Setters and getters for defaultEndGameData
  public defaultEndGameData: EndGameScreenData = {
    title: "Missing",
    subtitle: "End game was not overwritten",
    color: [127, 127, 127, 255],
    yourTeam: [],
    displayQuit: true,
    displayPlayAgain: true,
  };

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

  assignRoles(game: Game, assignmentData: RoleAssignmentData[]): void {
    const managers: typeof BaseManager[] = [];
    const assignmentArray: { role: typeof BaseRole; startGameScreen?: StartGameScreenData; assignWith: RoleAlignment }[] = [];
    const options = Services.get(ServiceType.GameOptions).getGameOptions<LobbyDefaultOptions>(game.getLobby());

    for (let i = 0; i < assignmentData.length; i++) {
      const singleAssignmentData = assignmentData[i];

      for (let j = 0; j < singleAssignmentData.playerCount; j++) {
        assignmentArray.push({
          role: singleAssignmentData.role,
          startGameScreen: singleAssignmentData.startGameScreen,
          assignWith: singleAssignmentData.assignWith,
        });
      }
    }

    const fixedImpostorAlignedRoles: { role: typeof BaseRole; startGameScreen?: StartGameScreenData; assignWith: RoleAlignment }[] = new Array(options.getOption("Impostor Count").getValue().value).fill(0).map(_ => ({
      role: Impostor,
      assignWith: RoleAlignment.Impostor,
    }));

    const impostorAlignedRoles = assignmentArray.filter(i => i.assignWith === RoleAlignment.Impostor);
    const nonImpostorAlignedRoles = assignmentArray.filter(i => i.assignWith !== RoleAlignment.Impostor).slice(0, game.getLobby().getPlayers().length - fixedImpostorAlignedRoles.length);
    const shuffledImpostors = shuffleArrayClone(game.getLobby().getPlayers().filter(p => p.isImpostor()));
    const shuffledPlayers = shuffleArrayClone(game.getLobby().getPlayers());

    for (let i = 0; i < shuffledImpostors.length; i++) {
      fixedImpostorAlignedRoles[i] = impostorAlignedRoles[i] ?? { role: Impostor, assignWith: RoleAlignment.Impostor };
    }

    shuffleArrayClone(fixedImpostorAlignedRoles).forEach((assignment, index) => {
      const impostor = shuffledImpostors[index];
      const role = this.assignRole(impostor, assignment.role, assignment.startGameScreen);

      managers.push(role.getManagerType());
      shuffledPlayers.splice(shuffledPlayers.indexOf(impostor), 1);
    });

    shuffleArrayClone(nonImpostorAlignedRoles).forEach((assignment, index) => {
      const role = this.assignRole(shuffledPlayers[index], assignment.role, assignment.startGameScreen);

      managers.push(role.getManagerType());
    });

    for (let i = 0; i < shuffledPlayers.length; i++) {
      const player = shuffledPlayers[i];

      if (player.getMeta<BaseRole | undefined>("pgg.api.role") === undefined) {
        const role = this.assignRole(player, Crewmate);

        managers.push(role.getManagerType());
      }
    }

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
        player.getLobby().getPlayers().filter(p => p.getMeta<BaseRole>("pgg.api.role") === roleInstance)
          .map(p => p.getId()),
      ));
    }

    return roleInstance;
  }

  setBaseRole(player: Player, role: PlayerRole): void {
    player.setRole(role);
    player.updateGameData();
    player.getEntity().getPlayerControl().sendRpcPacket(new SetRolePacket(role), player.getLobby().getConnections());
  }
}
