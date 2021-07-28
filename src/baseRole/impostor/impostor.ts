import { PlayerInstance } from "@nodepolus/framework/src/api/player";
import { Palette } from "@nodepolus/framework/src/static";
import { Mutable, Vector2 } from "@nodepolus/framework/src/types";
import { GameState, PlayerRole } from "@nodepolus/framework/src/types/enums";
import { AssetBundle } from "../../assets";
import { BaseManager } from "../../baseManager/baseManager";
import { Services } from "../../services";
import { Button } from "../../services/buttonManager";
import { StartGameScreenData } from "../../services/roleManager/roleManagerService";
import { ServiceType } from "../../types/enums";
import { EdgeAlignments } from "../../types/enums/edgeAlignment";
import { BaseRole, RoleAlignment } from "../baseRole";
import { AllowTaskInteractionPacket } from "../../packets/root/allowTaskInteractionPacket";

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

  constructor(owner: PlayerInstance, role: PlayerRole = PlayerRole.Impostor, private readonly buttonBundle: string = "Global", private readonly buttonAsset: string = "Assets/Mods/OfficialAssets/KillButton.png") {
    super(owner);

    this.role = role;
    this.onClicked = undefined;
    this.targetSelector = undefined;
    this.range = this.owner.getLobby()
      .getOptions()
      .getKillDistance() + 1;

    Services.get(ServiceType.RoleManager)
      .setBaseRole(this.owner, this.role);

    if (owner.getConnection() !== undefined) {
      Services.get(ServiceType.Resource)
        .load(owner.getConnection()!, AssetBundle.loadSafeFromCache(this.buttonBundle))
        .then(this.onReadyImpostor.bind(this));
    } else {
      this.onReadyImpostor();
    }
  }

  async onReadyImpostor(): Promise<void> {
    if (this.getAlignment() !== RoleAlignment.Crewmate) {
      this.owner.getSafeConnection().writeReliable(new AllowTaskInteractionPacket(false));
    }

    this.button = await Services.get(ServiceType.Button)
      .spawnButton(this.owner.getSafeConnection(), {
        asset: AssetBundle.loadSafeFromCache(this.buttonBundle)
          .getSafeAsset(this.buttonAsset),
        maxTimer: this.owner.getLobby()
          .getOptions()
          .getKillCooldown(),
        position: new Vector2(2.1, 0.7),
        alignment: EdgeAlignments.RightBottom,
        currentTime: 15,
      });

    this.catch("meeting.ended", event => event.getGame())
      .execute(() => {
        if (this.button !== undefined) {
          this.button.setCurrentTime(this.button.getMaxTime());
        }
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
    let wasInVent = false;

    while (true) {
      //todo break out on custom predicate
      if (player.isDead() || button.isDestroyed()) {
        const players = this.owner.getLobby()
        .getPlayers()
        .filter(x => x !== this.owner);

        for (let i = 0; i < players.length; i++) {
          animService.clearOutlineFor(players[i], this.owner.getSafeConnection());
        }
        break;
      }

      const target = this.targetSelector === undefined
        ? button.getTargets(this.range)
          .filter(x => !x.isImpostor() && !x.isDead())[0] as PlayerInstance | undefined
        : this.targetSelector(button.getTargets(this.range));

      const isSaturated = button.isSaturated();

      if ((this.owner.getVent() === undefined) === wasInVent) {
        if (!wasInVent) {
          button.setSaturated(false);
        }

        if (!wasInVent) {
          const players = this.owner.getLobby()
            .getPlayers()
            .filter(x => x !== this.owner);

          for (let i = 0; i < players.length; i++) {
            animService.clearOutlineFor(players[i], this.owner.getSafeConnection());
          }
        }

        wasInVent = (this.owner.getVent() !== undefined);

        while (this.owner.getVent() !== undefined) {
          if (player.isDead()) {
            break;
          }

          yield;
        }
        continue;
      }

      if ((target === undefined) === isSaturated) {
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

  getTargetSelector(): ((players: PlayerInstance[]) => PlayerInstance) | undefined {
    return this.targetSelector;
  }

  setTargetSelector(callback: (players: PlayerInstance[]) => PlayerInstance): void {
    this.targetSelector = callback;
  }

  getDescriptionText(): string {
    return `<color=#ff1919>Role: Impostor\nSabotage and kill the crewmates.</color>
Fake Tasks:`;
  }

  getAssignmentScreen(_player: PlayerInstance, _impostorCount: number): StartGameScreenData {
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
