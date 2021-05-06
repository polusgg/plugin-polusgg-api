import { LobbyInstance } from "@nodepolus/framework/src/api/lobby";
import { Connection } from "@nodepolus/framework/src/protocol/connection";
import Emittery from "emittery";
import { Services } from "..";
import { DeleteGameOption } from "../../packets/root/deleteGameOption";
import { NumberValue, BooleanValue, EnumValue } from "../../packets/root/setGameOption";
import { ServiceType } from "../../types/enums";
import { GameOption } from "./gameOption";

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

export type SpecializedLobbyOptionsEvents<T extends Record<string, NumberValue | BooleanValue | EnumValue>, A extends Extract<keyof T, string>> = Record<`option.${A}.changed`, GameOption<T[A]>>;

export class LobbyOptions<T extends Record<string, NumberValue | BooleanValue | EnumValue>> extends Emittery<BaseLobbyOptionsEvents & SpecializedLobbyOptionsEvents<T, Extract<keyof T, string>>> {
  protected knownOptions: Set<Extract<keyof T, string>> = new Set();

  constructor(protected readonly lobby: LobbyInstance) {
    super();
  }

  async createOption<K extends Extract<keyof T, string>, V extends T[K]>(category: string, key: K, value: V, priority: number | GameOptionPriority = GameOptionPriority.Normal): Promise<GameOption<V>> {
    const option = new GameOption<V>(this.lobby, category, priority, key, value);

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

    this.knownOptions.forEach(optionName => {
      //@ts-expect-error
      record[optionName] = this.getOption(optionName);
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
      const sid = Services.get(ServiceType.GameOptions).nextSequenceId(this.lobby, connection);

      proms[i] = connection.writeReliable(new DeleteGameOption(sid, key));
    }

    this.knownOptions.delete(key);

    await Promise.all(proms);

    return this;
  }
}
