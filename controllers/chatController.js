const Chat = require("../config/db").Chat;
const Message = require("../config/db").Message;
const sequelize = require("../config/db").sequelize;
const { Op } = require("sequelize");

const sendMessageUsingChatId = async (req, res) => {
    try {
        const { chatId, message } = req.body;
        const { userId } = req.user;

        if (!chatId || !message)
        return res.status(400).json({ message: "Invalid request" });

        if (!message || message.trim() === '')
        return res.status(400).json({ message: 'Content is required' });

        const chat = await Chat.findOne({
            where: {
                id: chatId,
                [Op.or]: [{ user1Id: userId }, { user2Id: userId }],
            },
        });

        if (!chat) {
            return res.status(404).json({ message: "Chat not found" });
        }

        await Message.create({
            chatId,
            senderId: userId,
            content: message,
        });

        return res.status(200).json({ message: "Message sent successfully" });


    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

const sendMessageUsingReceiverId = async (req, res) => {
    const { receiverId, message } = req.body;
    const { userId } = req.user;

    if (!receiverId || !message)
        return res.status(400).json({ message: "Invalid request" });

    if (!message || message.trim() === '')
    return res.status(400).json({ message: 'Content is required' });

    const transaction = await sequelize.transaction();
  
    try {
    //I think I should also handle the case were the user
    //sends a meeesage through the profile page of the other user
    //or whatever the way that they use it
    //I think I can simply handle that by checking if the chat is already there
    //if the chat is already there then we will add the message to it
    //if the chat is not there then we will create a new chat and add the message to it

        let chat = await Chat.findOne({
            where: {
                [Op.or]: [
                    { user1Id: userId, user2Id: receiverId },
                    { user1Id: receiverId, user2Id: userId }
                ],
            },
        });

        if (!chat) {
            chat = await Chat.create({
                user1Id: userId,
                user2Id: receiverId,
            }, { transaction });
        }
  
        await Message.create({
            chatId: chat.id,
            senderId: userId,
            content: message,
        }, { transaction });
    
        await transaction.commit();
  
        return res.status(200).json({ message: "Message sent successfully", chatId: chat.id });
    } catch (error) {
        await transaction.rollback();
        return res.status(500).json({ error: error.message });
    }
}

const getMessagesUsingPagination = async (req, res) => {
    try {
        const { chatId } = req.params;
        let { offset } = req.query;
        const { userId } = req.user;

        offset = offset || 0;

        console.log("ChatId is: ", chatId);

        if (!chatId)
            return res.status(400).json({ message: "Invalid request" });

        const chat = await Chat.findOne({
            where: {
                id: chatId,
                [Op.or]: [{ user1Id: userId }, { user2Id: userId }],
            },
        });

        if (!chat) {
            return res.status(404).json({ message: "Chat not found" });
        }

        const messages = await Message.findAll({
            where: {
                chatId,
            },
            offset: parseInt(offset),
            limit: 10,
            order: [["createdAt", "DESC"]],
        });

        return res.status(200).json(messages);
        
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

const getMessagesBetweenUsers = async (req, res) => {
    try {
        const { user2Id } = req.params;
        let { offset } = req.query;
        const { userId } = req.user;

        offset = offset || 0;

        if (!user2Id)
            return res.status(400).json({ message: "Invalid request" });

        const chat = await Chat.findOne({
            where: {
                [Op.or]: [
                    { user1Id: userId, user2Id: user2Id },
                    { user1Id: user2Id, user2Id: userId }
                ],
            },
        });

        if (!chat) {
            return res.status(404).json({ message: "Chat not found" });
        }

        const messages = await Message.findAll({
            where: {
                chatId: chat.id,
            },
            offset: parseInt(offset),
            limit: 10,
            order: [["createdAt", "DESC"]],
        });

        return res.status(200).json(messages);
        
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

const getUserChats = async (req, res) => {
    try {
        const { userId } = req.user;

        const chats = await Chat.findAll({
            where: {
                [Op.or]: [{ user1Id: userId }, { user2Id: userId }],
            },
        });

        return res.status(200).json(chats);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

const addReactionToMessage = async (req, res) => {
    try {
        const { messageId, reaction, chatId } = req.body;
        const { userId } = req.user;

        if (!messageId || !reaction) {
            console.log("no messageId or no reaction being sent");
            return res.status(400).json({ message: "Invalid request" });
        }

        const message = await Message.findByPk(messageId);
        if (!message)
            return res.status(404).json({ message: "Message not found" });

        const chat = await Chat.findByPk(chatId);
        if (!chat || (chat.user1Id !== userId && chat.user2Id !== userId))
            return res.status(403).json({ message: "You are not a participant in this chat" });

        if (message.senderId === userId)
            return res.status(403).json({ message: "You can't react to your own message" });

        if (reaction < 0 || reaction > 3)
            return res.status(400).json({ message: "Invalid reaction" });

        message.reaction = reaction;
        await message.save();

        return res.status(200).json({ message: "Reaction added successfully" });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { userId } = req.user;

        const message = await Message.findByPk(messageId);
        if (!message)
            return res.status(404).json({ message: "Message not found" });

        if (message.senderId !== userId)
            return res.status(403).json({ message: "You are not authorized to delete this message" });

        await message.destroy();

        return res.status(200).json({ message: "Message deleted successfully" });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}



module.exports = {
    sendMessageUsingChatId,
    sendMessageUsingReceiverId,
    getMessagesUsingPagination,
    getMessagesBetweenUsers, 
    getUserChats,
    addReactionToMessage,
    deleteMessage
}
