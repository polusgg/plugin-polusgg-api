import { PlayerInstance } from "@nodepolus/framework/src/api/player";
import { Player } from "@nodepolus/framework/src/player";
import { Palette } from "@nodepolus/framework/src/static";
import { Vector2 } from "@nodepolus/framework/src/types";
import { GameState, PlayerRole } from "@nodepolus/framework/src/types/enums";
import { AssetBundle } from "../../assets";
import { BaseManager } from "../../baseManager/baseManager";
import { Services } from "../../services";
import { Button } from "../../services/buttonManager";
import { StartGameScreenData } from "../../services/roleManager/roleManagerService";
import { ServiceType } from "../../types/enums";
import { EdgeAlignments } from "../../types/enums/edgeAlignment";
import { BaseRole, RoleAlignment } from "../baseRole";

export class ImpostorManager extends BaseManager {
  getId(): string { return "impostor" }
  getTypeName(): string { return "impostor" }
}

export class Impostor extends BaseRole {
  protected readonly metadata = {
    name: "impostor",
    alignment: RoleAlignment.Impostor,
  };

  private readonly role: PlayerRole;
  private button: Button | undefined;
  // todo add emittery instance as property instead of using stored callbacks
  private onClicked: (() => void) | undefined;
  private targetPredicate: ((players: PlayerInstance[]) => PlayerInstance) | undefined;
  private readonly range: number;

  constructor(owner: PlayerInstance, role: PlayerRole = PlayerRole.Impostor) {
    super(owner);

    this.role = role;
    this.onClicked = undefined;
    this.targetPredicate = undefined;
    this.range = this.owner.getLobby().getOptions().getKillDistance();

    if (owner.getConnection() !== undefined) {
      Services.get(ServiceType.Resource).load(owner.getConnection()!, AssetBundle.loadSafeFromCache("Global")).then(this.onReadyImpostor.bind(this));
    } else {
      this.onReadyImpostor();
    }
  }

  async onReadyImpostor(): Promise<void> {
    Services.get(ServiceType.RoleManager).setBaseRole(this.owner as Player, this.role);

    this.button = await Services.get(ServiceType.Button).spawnButton(this.owner.getSafeConnection(), {
      asset: AssetBundle.loadSafeFromCache("Global").getSafeAsset("Assets/Mods/OfficialAssets/KillButton.png"),
      maxTimer: this.owner.getLobby().getOptions().getKillCooldown(),
      position: new Vector2(2.1, 0.7),
      alignment: EdgeAlignments.RightBottom,
    });

    this.catch("player.died", event => event.getPlayer()).execute(_ => {
      if (this.button === undefined) {
        return;
      }

      this.button.getEntity().despawn();
      this.button = undefined;
    });

    Services.get(ServiceType.CoroutineManager)
      .beginCoroutine(this.owner, this.coSaturateButton(this.owner, this.button));

    this.button.on("clicked", () => {
      if (this.button === undefined || !this.button.getSaturated()) {
        return;
      }

      const target = this.targetPredicate === undefined
        ? this.button.getTargets(this.range).filter(player => !player.isImpostor())[0] as PlayerInstance | undefined
        : this.targetPredicate(this.button.getTargetsUnfiltered(this.range));

      if (target === undefined) {
        return;
      }

      this.button.reset();

      if (this.onClicked === undefined) {
        this.owner.murder(target);
      } else {
        this.onClicked();
      }
    });
  }

  * coSaturateButton(player: PlayerInstance, button: Button): Generator<void, void, number> {
    if (player.getLobby().getGameState() !== GameState.Started) {
      yield;
    }

    while (true) {
      const target = button.getTarget(this.owner.getLobby().getOptions().getKillDistance());

      const isSaturated = button.getSaturated();

      if ((target === undefined) === isSaturated) {
        button.setSaturated(!isSaturated);
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

  setOnClicked(callback: () => void): void {
    this.onClicked = callback;
  }

  setTargetPredicate(callback: (players: PlayerInstance[]) => PlayerInstance): void {
    this.targetPredicate = callback;
  }

  getAssignmentScreen(_player: PlayerInstance): StartGameScreenData {
    return {
      title: `Impostor`,
      subtitle: ``,
      color: Palette.impostorRed(),
    };
  }

  getManagerType(): typeof ImpostorManager { return ImpostorManager }
}
