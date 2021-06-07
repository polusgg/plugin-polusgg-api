import { PlayerInstance } from "@nodepolus/framework/src/api/player";
import { Player } from "@nodepolus/framework/src/player";
import { Palette } from "@nodepolus/framework/src/static";
import { Mutable, Vector2 } from "@nodepolus/framework/src/types";
import { GameOverReason, GameState, PlayerRole } from "@nodepolus/framework/src/types/enums";
import { AssetBundle } from "../../assets";
import { BaseManager } from "../../baseManager/baseManager";
import { Services } from "../../services";
import { Button } from "../../services/buttonManager";
import { StartGameScreenData } from "../../services/roleManager/roleManagerService";
import { ServiceType } from "../../types/enums";
import { EdgeAlignments } from "../../types/enums/edgeAlignment";
import { WinSoundType } from "../../types/enums/winSound";
import { BaseRole, RoleAlignment } from "../baseRole";

export class ImpostorManager extends BaseManager {
  getId(): string {
    return "impostor";
  }

  getTypeName(): string {
    return "impostor";
  }
}

// impostors do not play well with reviving at the moment, if there's an event for reviving then that should be handled properly

export class Impostor extends BaseRole {
  protected readonly metadata = {
    name: "impostor",
    alignment: RoleAlignment.Impostor,
  };

  private readonly role: PlayerRole;
  private button: Button | undefined;
  // todo add emittery instance as property instead of using stored callbacks
  private onClicked: ((target: PlayerInstance) => void) | undefined;
  private targetSelector: ((players: PlayerInstance[]) => PlayerInstance) | undefined;
  private readonly range: number;

  constructor(owner: PlayerInstance, role: PlayerRole = PlayerRole.Impostor) {
    super(owner);

    if (this.getAlignment() === RoleAlignment.Impostor) {
      Impostor.setupWinConditions(this);
    }

    this.role = role;
    this.onClicked = undefined;
    this.targetSelector = undefined;
    this.range = this.owner.getLobby()
      .getOptions()
      .getKillDistance() + 1;

    if (owner.getConnection() !== undefined) {
      Services.get(ServiceType.Resource)
        .load(owner.getConnection()!, AssetBundle.loadSafeFromCache("Global"))
        .then(this.onReadyImpostor.bind(this));
    } else {
      this.onReadyImpostor();
    }
  }

  static setupWinConditions(role: BaseRole) {
    const endGame = Services.get(ServiceType.EndGame);

    role.catch("player.murdered", event => event.getPlayer()
      .getLobby())
      .where(() => role.getAlignment() === RoleAlignment.Impostor)
      .where(event => event.getPlayer().getLobby().getPlayers()
        .filter(player => !player.isImpostor() && !player.isDead()).length <= 1)
      .execute(event => endGame.registerEndGameIntent(event.getPlayer().getLobby().getGame()!, {
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
      }));

    role.catch("meeting.ended", event => event.getGame())
      .where(() => role.getAlignment() === RoleAlignment.Impostor)
      .where(event => event.getGame().getLobby().getPlayers()
        .filter(player => !player.isImpostor() && !player.isDead())
        .length <= 1,
      )
      .execute(event => endGame.registerEndGameIntent(event.getGame(), {
        endGameData: new Map(event.getGame()
          .getLobby()
          .getPlayers()
          .map(player => [player, {
            title: player.isImpostor() ? "Victory" : "Defeat",
            subtitle: "<color=#8CFFFFFF>Impostors</color> voted out the <color=#FF1919FF>Crewmates</color>",
            color: Palette.crewmateBlue() as Mutable<[number, number, number, number]>,
            yourTeam: event.getGame().getLobby().getPlayers()
              .filter(sus => !sus.isImpostor()),
            winSound: WinSoundType.ImpostorWin,
          }])),
        intentName: "impostorVote",
      }));

    role.catch("game.ended", event => event.getGame().getLobby())
      .where(event => event.getReason() === GameOverReason.ImpostorsBySabotage)
      .execute(event => {
        endGame.registerEndGameIntent(event.getGame(), {
          endGameData: new Map(event.getGame().getLobby().getPlayers()
            .map(player => [player, {
              title: player.isImpostor() ? "Victory" : "Defeat",
              subtitle: "<color=#8CFFFFFF>Impostors</color> won by sabotage",
              color: Palette.impostorRed() as Mutable<[number, number, number, number]>,
              yourTeam: event.getGame().getLobby().getPlayers()
                .filter(sus => !sus.isImpostor()),
              winSound: WinSoundType.ImpostorWin,
            }])),
          intentName: "impostorSabotage",
        });
      });

    role.catch("player.left", event => event.getLobby())
      .where(event => event.getLobby()
        .getPlayers()
        .filter(player => !player.isImpostor() && player !== event.getPlayer()).length == 0)
      .execute(event => endGame.registerEndGameIntent(event.getPlayer().getLobby().getGame()!, {
        endGameData: new Map(event.getPlayer().getLobby().getPlayers()
          .map(player => [player, {
            title: player.isImpostor() ? "Victory" : "Defeat",
            subtitle: "<color=#FF1919FF>Crewmates</color> disconnected",
            color: Palette.impostorRed() as Mutable<[number, number, number, number]>,
            yourTeam: event.getPlayer().getLobby().getPlayers(),
            winSound: WinSoundType.ImpostorWin,
          }])),
        intentName: "crewmateDisconnected",
      }));
  }

  async onReadyImpostor(): Promise<void> {
    Services.get(ServiceType.RoleManager)
      .setBaseRole(this.owner as Player, this.role);

    this.button = await Services.get(ServiceType.Button)
      .spawnButton(this.owner.getSafeConnection(), {
        asset: AssetBundle.loadSafeFromCache("Global")
          .getSafeAsset("Assets/Mods/OfficialAssets/KillButton.png"),
        maxTimer: this.owner.getLobby()
          .getOptions()
          .getKillCooldown(),
        position: new Vector2(2.1, 0.7),
        alignment: EdgeAlignments.RightBottom,
        currentTime: 15,
      });

    this.catch("player.died", event => event.getPlayer())
      .execute(_ => {
        this.button?.destroy();
      });

    Services.get(ServiceType.CoroutineManager)
      .beginCoroutine(this.owner, this.coSaturateButton(this.owner, this.button));

    this.button.on("clicked", () => {
      if (this.button === undefined || !this.button.isSaturated() || this.button.getCurrentTime() != 0) {
        return;
      }

      const target = this.targetSelector === undefined
        ? this.button.getTargets(this.range)
          .filter(player => !player.isImpostor() && !player.isDead())[0] as PlayerInstance | undefined
        : this.targetSelector(this.button.getTargets(this.range));

      if (target === undefined) {
        return;
      }

      this.button.reset();

      if (this.onClicked === undefined) {
        this.owner.murder(target);
      } else {
        this.onClicked(target);
      }
    });
  }

  * coSaturateButton(player: PlayerInstance, button: Button): Generator<void, void, number> {
    if (player.getLobby()
      .getGameState() !== GameState.Started) {
      yield;
    }

    const animService = Services.get(ServiceType.Animation);
    let outlined = false;
    let lastTarget: PlayerInstance | undefined;

    while (true) {
      //todo break out on custom predicate
      if (player.isDead()) {
        break;
      }

      const target = this.targetSelector === undefined
        ? button.getTargets(this.range)
          .filter(x => !x.isImpostor() && !x.isDead())[0] as PlayerInstance | undefined
        : this.targetSelector(button.getTargets(this.range));

      const isSaturated = button.isSaturated();

      if ((target === undefined || button.getCurrentTime() != 0) === isSaturated) {
        button.setSaturated(!isSaturated);
      }

      if ((target === undefined) === outlined || lastTarget !== target) {
        const players = this.owner.getLobby()
          .getPlayers()
          .filter(x => x !== this.owner);

        for (let i = 0; i < players.length; i++) {
          if (players[i] === target) {
            animService.setOutline(players[i], Palette.impostorRed() as Mutable<[number, number, number, number]>, [this.owner.getSafeConnection()]);
          } else {
            animService.clearOutlineFor(players[i], this.owner.getSafeConnection());
          }
        }

        lastTarget = target;
        outlined = !outlined;
      }
      yield;
    }
  }

  getImpostorButton(): Button | undefined {
    return this.button;
  }

  getPlayerRole(): PlayerRole {
    return this.role;
  }

  setOnClicked(callback: (target: PlayerInstance) => void): void {
    this.onClicked = callback;
  }

  setTargetSelector(callback: (players: PlayerInstance[]) => PlayerInstance): void {
    this.targetSelector = callback;
  }

  getAssignmentScreen(_player: PlayerInstance): StartGameScreenData {
    return {
      title: `Impostor`,
      subtitle: `Kill the <color=#8CFFFFFF>crewmates</color>`,
      color: Palette.impostorRed(),
    };
  }

  getManagerType(): typeof ImpostorManager {
    return ImpostorManager;
  }
}
