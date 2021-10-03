import { Game } from "@nodepolus/framework/src/api/game";
import { PlayerInstance } from "@nodepolus/framework/src/api/player";
import { TextComponent } from "@nodepolus/framework/src/api/text";
import { Player } from "@nodepolus/framework/src/player";
import { Server } from "@nodepolus/framework/src/server";
import { GameOverReason, PlayerRole } from "@nodepolus/framework/src/types/enums";
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
import { EmojiService } from "../emojiService/emojiService";

export type EndGameScreenData = {
  title: string | TextComponent;
  subtitle: string | TextComponent;
  color: [number, number, number, number];
  winSound: WinSound;
  yourTeam: PlayerInstance[];
  hasWon: boolean;
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
    server.on("game.ended", async event => {
      if (event.getReason() === 0x07 as GameOverReason) {
        await Promise.all(event
          .getGame()
          .getLobby()
          .getPlayers()
          .map(async p => this.onPlayerDespawned(p, RoleDestroyedReason.GameEnded)));
      }
    });

    server.on("player.left", async event => {
      await this.onPlayerDespawned(event.getPlayer(), RoleDestroyedReason.Disconnect);
    });
  }

  static adjustImpostorCount(playerCount: number): number {
    if (playerCount <= 6) {
      return 1;
    }

    if (playerCount <= 8) {
      return 2;
    }

    return 3;
  }

  async onPlayerDespawned(player: PlayerInstance, reason: RoleDestroyedReason): Promise<void> {
    await player.getMeta<BaseRole | undefined>("pgg.api.role")?.onDestroy(reason);
  }

  getRolesAssigned(game: Game, assignmentData: RoleAssignmentData[]): { players: PlayerInstance[], allRoleAssignments: { role: typeof BaseRole; startGameScreen?: StartGameScreenData }[] }|undefined {
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

    const impostorCount = Math.min(options.getOption("Impostor Count").getValue().value, RoleManagerService.adjustImpostorCount(players.length));

    game.getLobby().getOptions().setImpostorCount(impostorCount);
    (game.getLobby().getPlayers()[0] as Player).getEntity().getPlayerControl().syncSettings(
      game.getLobby().getOptions()
    );

    for (let i = 0; i < impostorCount; i++) {
      if (i >= impostorAlignedRolesFromAssignment.length) {
        impostorAlignedRoles.push({ role: Impostor });
      } else {
        impostorAlignedRoles.push(impostorAlignedRolesFromAssignment[i]);
      }
    }

    for (let i = 0; i < players.length - impostorCount; i++) {
      if (i >= otherAlignedRolesFromAssignment.length) {
        otherAlignedRoles.push({ role: Crewmate, assignWith: RoleAlignment.Crewmate });
      } else {
        otherAlignedRoles.push(otherAlignedRolesFromAssignment[i]);
      }
    }

    const allRoleAssignments = [...otherAlignedRoles, ...impostorAlignedRoles];

    return { players, allRoleAssignments };
  }

  assignRoles(game: Game, assignmentData: RoleAssignmentData[]): void {
    const managers: typeof BaseManager[] = [];
    
    const roleAssignments = this.getRolesAssigned(game, assignmentData);

    if (!roleAssignments)
      return;

    const { players, allRoleAssignments } = roleAssignments;

    // if (allRoleAssignments.length !== players.length) {
    //   console.log({ impostorAlignedRoles, otherAlignedRoles });
    //   throw new Error("Crying rn. The normalized length of all the roles did not match up with the number of players.");
    // }

    const roleInstances: BaseRole[] = new Array(allRoleAssignments.length);

    for (let i = 0; i < allRoleAssignments.length; i++) {
      roleInstances[i] = this.assignRole(players[i], allRoleAssignments[i].role, true);
      managers.push(roleInstances[i].getManagerType());
    }

    for (let i = 0; i < roleInstances.length; i++) {
      this.sendRoleScreen(players[i], roleInstances[i], allRoleAssignments[i].startGameScreen);
    }

    const uniqueManagers = [...new Set(managers)];

    for (let i = 0; i < uniqueManagers.length; i++) {
      const manager = new uniqueManagers[i](game.getLobby());

      game.getLobby().setMeta(`pgg.manager.${manager.getId()}`, manager);
    }

    game.getLobby().getPlayers().forEach(player => {
      const playerPartners: PlayerInstance[] = [];

      game.getLobby().getPlayers().forEach(target => {
        if (player.getMeta<BaseRole>("pgg.api.role").isPartner(target.getMeta<BaseRole>("pgg.api.role"))) {
          playerPartners.push(target);
        }
      });

      if (playerPartners.length > 1) {
        for (let i = 0; i < playerPartners.length; i++) {
          const partner = playerPartners[i];

          Services.get(ServiceType.Name).setFor(
            player.getSafeConnection(),
            partner,
            partner.getName() + EmojiService.static("partner"),
          );
        }
      }
    });
  }

  sendRoleScreen(player: PlayerInstance, instance: BaseRole, startGameScreen?: StartGameScreenData): void {
    startGameScreen ??= instance.getAssignmentScreen(player, player.getLobby().getPlayers().filter(el => el.isImpostor()).length);

    const connection = player.getConnection();

    if (connection !== undefined) {
      connection.writeReliable(new DisplayStartGameScreenPacket(
        startGameScreen.title.toString(),
        startGameScreen.subtitle.toString(),
        startGameScreen.color,
        player.getLobby().getPlayers().filter(p => p.getMeta<BaseRole>("pgg.api.role") === instance)
          .map(p => p.getId()),
      ));
    }
  }

  assignRole<T extends typeof BaseRole>(player: PlayerInstance, role: T, preventRoleScreen: boolean = false): BaseRole {
    // eslint-disable-next-line new-cap
    const roleInstance = new role(player);

    player.setMeta("pgg.api.role", roleInstance);

    if (!preventRoleScreen) {
      this.sendRoleScreen(player, roleInstance);
    }

    return roleInstance;
  }

  setBaseRole(player: PlayerInstance, role: PlayerRole): void {
    player.setRole(role);
    player.updateGameData();
    (player as Player).getEntity().getPlayerControl().sendRpcPacket(new SetRolePacket(role), player.getLobby().getConnections());
  }
}
