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

  constructor(owner: PlayerInstance) {
    super(owner);

    Services.get(ServiceType.RoleManager).setBaseRole(owner as Player, PlayerRole.Impostor);

    Services.get(ServiceType.Button).spawnButton(this.owner.getSafeConnection(), {
      asset: AssetBundle.loadSafeFromCache("Global").getSafeAsset("Assets/Mods/OfficialAssets/KillButton.png"),
      maxTimer: owner.getLobby().getOptions().getKillCooldown(),
      position: new Vector2(2.1, 0.7),
      alignment: EdgeAlignments.RightBottom,
    }).then(button => {
      this.catch("player.died", event => event.getPlayer()).execute(_ => {
        button.getEntity().despawn();
      });
      Services.get(ServiceType.CoroutineManager)
        .beginCoroutine(this.owner, this.coSaturateButton(this.owner, button));
      button.on("clicked", () => {
        if (!button.getSaturated()) {
          return;
        }

        const target = button.getTargets(this.owner.getLobby().getOptions().getKillDistance())
          .filter(player => !player.isImpostor())[0] as PlayerInstance | undefined;

        if (target === undefined) {
          return;
        }

        button.reset();

        this.owner.murder(target);
      });
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

  getAssignmentScreen(_player: PlayerInstance): StartGameScreenData {
    return {
      title: `Impostor`,
      subtitle: ``,
      color: Palette.impostorRed(),
    };
  }

  getManagerType(): typeof ImpostorManager { return ImpostorManager }
}
