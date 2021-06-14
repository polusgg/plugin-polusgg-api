import { Game } from "@nodepolus/framework/src/api/game";
import { PlayerInstance } from "@nodepolus/framework/src/api/player";
import { TextComponent } from "@nodepolus/framework/src/api/text";
import { Player } from "@nodepolus/framework/src/player";
import { Server } from "@nodepolus/framework/src/server";
import { PlayerRole } from "@nodepolus/framework/src/types/enums";
import { shuffleArray, shuffleArrayClone } from "@nodepolus/framework/src/util/shuffle";
import { BaseManager } from "../../baseManager/baseManager";
import { BaseRole } from "../../baseRole";
import { RoleAlignment } from "../../baseRole/baseRole";
import { Crewmate } from "../../baseRole/crewmate/crewmate";
import { Impostor } from "../../baseRole/impostor/impostor";
import { DisplayStartGameScreenPacket } from "../../packets/root";
import { SetRolePacket } from "../../packets/rpc/playerControl";
import { ServiceType } from "../../types/enums";
import { WinSound } from "../../types/enums/winSound";
import { LobbyDefaultOptions } from "../gameOptions/gameOptionsService";
import { Services } from "../services";
import { RoleDestroyedReason } from "../../types/enums/roleDestroyedReason";

export type EndGameScreenData = {
  title: string | TextComponent;
  subtitle: string | TextComponent;
  color: [number, number, number, number];
  winSound: WinSound;
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

declare const server: Server;

export class RoleManagerService {
  constructor() {
    server.on("game.ended", event => {
      event
        .getGame()
        .getLobby()
        .getPlayers()
        .forEach(p => {
          this.onPlayerDespawned(p, RoleDestroyedReason.GameEnded);
        });
    });

    server.on("player.left", event => {
      this.onPlayerDespawned(event.getPlayer(), RoleDestroyedReason.Disconnect);
    });
  }

  onPlayerDespawned(player: PlayerInstance, reason: RoleDestroyedReason): void {
    player.getMeta<BaseRole | undefined>("pgg.api.role")?.onDestroy(reason);
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

    shuffleArray(assignmentArray);

    const players = shuffleArrayClone(game.getLobby().getPlayers());

    if (players.length === 0) {
      return;
    }

    const impostorAlignedRolesFromAssignment = assignmentArray.filter(assignment => assignment.assignWith === RoleAlignment.Impostor);
    const otherAlignedRolesFromAssignment = assignmentArray.filter(assignment => assignment.assignWith !== RoleAlignment.Impostor);

    const impostorAlignedRoles: { role: typeof BaseRole; startGameScreen?: StartGameScreenData }[] = [];
    const otherAlignedRoles: { role: typeof BaseRole; startGameScreen?: StartGameScreenData; assignWith: RoleAlignment }[] = [];

    for (let i = 0; i < options.getOption("Impostor Count").getValue().value; i++) {
      if (i >= impostorAlignedRolesFromAssignment.length) {
        impostorAlignedRoles.push({ role: Impostor });
      } else {
        impostorAlignedRoles.push(impostorAlignedRolesFromAssignment[i]);
      }
    }

    console.log("non-impostor count", players.length - (options.getOption("Impostor Count").getValue().value));

    for (let i = 0; i < players.length - (options.getOption("Impostor Count").getValue().value); i++) {
      if (i >= otherAlignedRolesFromAssignment.length) {
        otherAlignedRoles.push({ role: Crewmate, assignWith: RoleAlignment.Crewmate });
      } else {
        otherAlignedRoles.push(otherAlignedRolesFromAssignment[i]);
      }
    }

    const allRoleAssignments = [...impostorAlignedRoles, ...otherAlignedRoles];

    if (allRoleAssignments.length !== players.length) {
      console.log({ impostorAlignedRoles, otherAlignedRoles });
      throw new Error("Crying rn. The normalized length of all the roles did not match up with the number of players.");
    }

    for (let i = 0; i < allRoleAssignments.length; i++) {
      managers.push(this.assignRole(players[i], allRoleAssignments[i].role, allRoleAssignments[i].startGameScreen).getManagerType());
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

  setBaseRole(player: PlayerInstance, role: PlayerRole): void {
    player.setRole(role);
    player.updateGameData();
    (player as Player).getEntity().getPlayerControl().sendRpcPacket(new SetRolePacket(role), player.getLobby().getConnections());
  }
}
