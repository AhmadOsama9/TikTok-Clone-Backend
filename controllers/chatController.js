const Chat = require("../config/db").Chat;
const Message = require("../config/db").Message;
const sequelize = require("../config/db").sequelize;

const sendMessageUsingChatId = async (req, res) => {
    try {
        const { chatId, message } = req.body;
        const { userId } = req.user;

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
            message,
        });

        return res.status(200).json({ message: "Message sent successfully" });


    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

const sendMessageUsingReceiverId = async (req, res) => {
    const { receiverId, message } = req.body;
    const { userId } = req.user;
  
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
            message,
        }, { transaction });
    
        await transaction.commit();
  
        return res.status(200).json({ message: "Message sent successfully" });
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

module.exports = {
    sendMessageUsingChatId,
    sendMessageUsingReceiverId,
    getMessagesUsingPagination,
    getMessagesBetweenUsers, 
    getUserChats,
}
