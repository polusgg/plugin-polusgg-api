import { Lobby } from "@nodepolus/framework/src/lobby";
import { Player } from "@nodepolus/framework/src/player";
import { Palette } from "@nodepolus/framework/src/static";
import { randomUUID } from "crypto";
import { DeleteChatMessagePacket } from "../../packets/root/deleteChatMessage";
import { ChatMessageAlign, SetChatMessagePacket } from "../../packets/root/setChatMessage";

export interface ChatMessageData {
    sender: Player;
    uuid: string;
    message: string;
}

export class ChatService {
    async deleteMessageFor(receiver: Player, uuid: string) {
        receiver.getConnection()?.sendReliable([new DeleteChatMessagePacket(uuid)]);
    }

    async deleteMessagesByPlayer(sender: Player) {
        const messages = this.getMessagesByPlayer(sender);

        const promises: Promise<void>[] = [];
        for (const player of sender.getLobby().getPlayers()) {

            const connection = player.getConnection();
            if (!connection)
                continue;

            const deleteMessage = player.getConnection()?.sendReliable([
                ...messages.map(msg => new DeleteChatMessagePacket(msg.uuid))
            ]);
            
            if (deleteMessage) {
                promises.push(deleteMessage);
            }
        }

        await Promise.all(promises);
    }

    async deleteMessage(lobby: Lobby, uuid: string) {
        const promises: Promise<void>[] = [];
        for (const player of lobby.getPlayers()) {

            const connection = player.getConnection();
            if (!connection)
                continue;

            promises.push(this.deleteMessageFor(player, uuid));
        }
        await Promise.all(promises);
    }

    getMessagesByPlayer(player: Player) {
        const cachedMessages = player.getMeta<ChatMessageData[]|undefined>("pgg.chatMessages");
        const messages = cachedMessages || [];
        if (!cachedMessages) {
            player.setMeta("pgg.chatMessages", messages);
        }
        return messages;
    }

    getAllMessagesInLobby(lobby: Lobby) {
        const messages: ChatMessageData[] = [];
        for (const player of lobby.getPlayers()) {
            messages.push(...this.getMessagesByPlayer(player));
        }
        return messages;
    }

    async createChatMessageFor(receiver: Player, messageUuid: string, align: ChatMessageAlign, sender: Player, message: string, quickChat: boolean) {
        const playerBody = Palette.playerBody(sender.getColor()).light;

        // actually log the chat message here I think
        // unless you want a generalised method which implements
        // all of the parameters in the SetChatMessagePacket
        // instead of abstracting it to a player

        const messages = this.getMessagesByPlayer(sender);
        messages.push({
            uuid: messageUuid,
            sender,
            message
        });
        
        await receiver.getConnection()?.sendReliable([
            new SetChatMessagePacket(
                messageUuid,
                align,
                sender.getName().toString(),
                !sender.isDead(),
                sender.getHat(),
                sender.getSkin(),
                playerBody[0],
                playerBody[1],
                playerBody[2],
                message,
                quickChat
            )
        ]);
    }

    async sendChatFromTo(sender: Player, receiver: Player, message: string, quickChat: boolean) {
        const senderIsDead = sender.getMeta<boolean|undefined>("pgg.countAsDead") || sender.isDead();
        const receiverIsDead = receiver.getMeta<boolean|undefined>("pgg.countAsDead") || receiver.isDead();

        if (senderIsDead && !receiverIsDead) {
            return;
        }

        const messageUuid = randomUUID();

        await this.createChatMessageFor(
            receiver,
            messageUuid,
            sender === receiver ? ChatMessageAlign.Right : ChatMessageAlign.Left,
            sender,
            message,
            quickChat
        );
    }

    async broadcastChatMessageFrom(sender: Player, message: string, quickChat: boolean) {
        const promises: Promise<void>[] = [];
        for (const player of sender.getLobby().getPlayers()) {

            const connection = player.getConnection();
            if (!connection)
                continue;

            promises.push(this.sendChatFromTo(sender, player as Player, message, quickChat));
        }

        await Promise.all(promises);
    }
}