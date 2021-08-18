import { LobbyInstance } from "@nodepolus/framework/src/api/lobby";
import { Connection } from "@nodepolus/framework/src/protocol/connection";
import Emittery from "emittery";
import { Services } from "..";
import { DeleteGameOption } from "../../packets/root/deleteGameOption";
import { NumberValue, BooleanValue, EnumValue } from "../../packets/root/setGameOption";
import { ServiceType } from "../../types/enums";
import { GameOption } from "./gameOption";
import { UserResponseStructure } from "@polusgg/module-polusgg-auth-api/src/types/userResponseStructure";

export type BaseLobbyOptionsEvents = {
  "option.*.changed": GameOption<NumberValue | BooleanValue | EnumValue>;
};

export enum GameOptionPriority {
  Highest = 100,
  Higher = 200,
  High = 300,
  Normal = 400,
  Low = 500,
  Lower = 600,
  Lowest = 700,
}

const TARGET_GAME_OPTIONS_VERSION = 1;

export type SpecializedLobbyOptionsEvents<T extends Record<string, NumberValue | BooleanValue | EnumValue>, A extends Extract<keyof T, string>> = Record<`option.${A}.changed`, GameOption<T[A]>>;

export class LobbyOptions<T extends Record<string, NumberValue | BooleanValue | EnumValue>> extends Emittery<BaseLobbyOptionsEvents & SpecializedLobbyOptionsEvents<T, Extract<keyof T, string>>> {
  protected knownOptions: Set<Extract<keyof T, string>> = new Set();

  constructor(protected readonly lobby: LobbyInstance) {
    super();
  }

  async createOption<K extends Extract<keyof T, string>, V extends T[K]>(category: string, key: K, value: V, priority: number | GameOptionPriority = GameOptionPriority.Normal): Promise<GameOption<V>> {
    const option = new GameOption<V>(this.lobby, category, priority, key, value);

    const { options } = (this.lobby.getActingHosts()[0] ?? this.lobby.getCreator()).getMeta<UserResponseStructure>("pgg.auth.self");

    if (options?.gamemode && options.version === TARGET_GAME_OPTIONS_VERSION) {
      if (key !== "Gamemode") {
        //@ts-expect-error
        const relatedOptions = options[(this.getOption("Gamemode").getValue() as EnumValue).getSelected()];

        const match = relatedOptions.find(v => v.key === option.getKey());

        if (match !== undefined && match.value.type === value.toJson().type) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          value.load(match.value as any);
        }
      } else {
        const gamemode = options.gamemode;

        //@ts-expect-error
        value.load(gamemode.value);
      }
    }

    await option.setValue(value);

    this.lobby.setMeta(`pgg.options.${key}`, option);

    this.knownOptions.add(key);

    return option;
  }

  getOption<K extends Extract<keyof T, string>>(key: K): GameOption<T[K]> {
    return this.lobby.getMeta<GameOption<T[K]>>(`pgg.options.${key}`);
  }

  getAllOptions<K extends Extract<keyof T, string>>(): Record<K, GameOption<T[K]>> {
    const record: Partial<Record<K, GameOption<T[K]>>> = {};

    Array.from((this.lobby as unknown as { metadata: Map<string, unknown> }).metadata.keys()).forEach(optionName => {
      if (optionName.startsWith("pgg.options.")) {
        //@ts-expect-error
        record[optionName.split("pgg.options.")[1]] = this.getOption(optionName.split("pgg.options.")[1]);
      }
    });

    return record as Record<K, GameOption<T[K]>>;
  }

  async setOption<K extends Extract<keyof T, string>, V extends T[K]>(key: K, value: V, sendTo: Connection[] = this.lobby.getConnections()): Promise<this> {
    await this.getOption(key).setValue(value, sendTo);

    this.knownOptions.add(key);

    return this;
  }

  async deleteOption<K extends Extract<keyof T, string>>(key: K): Promise<this> {
    const connections = this.lobby.getConnections();

    const proms: Promise<void>[] = new Array(connections.length);

    for (let i = 0; i < connections.length; i++) {
      const connection = connections[i];
      const sid = Services.get(ServiceType.GameOptions).nextSequenceId(connection);

      proms[i] = connection.writeReliable(new DeleteGameOption(sid, key));
    }

    this.lobby.deleteMeta(`pgg.options.${key}`);

    this.knownOptions.delete(key);

    await Promise.all(proms);

    return this;
  }
}
