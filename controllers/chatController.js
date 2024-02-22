const Chat = require("../config/db").Chat;
const Message = require("../config/db").Message;
const sequelize = require("../config/db").sequelize;
const { Op } = require("sequelize");
const { getSignedUrl } = require("./profileController");
const User = require("../config/db").User;
const Profile = require("../config/db").Profile;


const sendMessageUsingChatId = async (req, res) => {
    try {
        const { chatId, message, replyTo } = req.body;
        const { userId } = req.user;

        if (replyTo) {
            const replyMessage = await Message.findByPk(replyTo);
            if (!replyMessage)
                return res.status(404).json({ message: "Message not found" });
        }

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

        const newMessage = await Message.create({
            chatId,
            senderId: userId,
            content: message,
            state: 'sent',
            replyTo,
        });

        return res.status(200).json({ messageId: newMessage.id });


    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

const sendMessageUsingReceiverId = async (req, res) => {
    const { receiverId, message, replyTo } = req.body;
    const { userId } = req.user;

    if (replyTo) {
        const replyMessage = await Message.findByPk(replyTo);
        if (!replyMessage)
            return res.status(404).json({ message: "Message not found" });
    }

    if (!receiverId || !message)
        return res.status(400).json({ message: "Invalid request" });

    if (!message || message.trim() === '')
    return res.status(400).json({ message: 'Content is required' });

    if (userId === receiverId)
        return res.status(400).json({ message: "You can't send a message to yourself" });

    const transaction = await sequelize.transaction();
  
    try {
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
  
        const newMessage = await Message.create({
            chatId: chat.id,
            senderId: userId,
            content: message,
            state: 'sent',
            replyTo,
        }, { transaction });
    
        await transaction.commit();
  
        return res.status(200).json({ messageId: newMessage.id });
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
            limit: process.env.MESSAGES_LIMIT || 10,
            order: [["createdAt", "DESC"]],
            attributes: ['id', 'senderId', 'content', 'state', 'reaction', 'replyTo', 'createdAt'],  // Add this line
            include: [{
                model: Message,
                as: 'replyToMessage',
                attributes: ['content'],
            }],
        });

        let updatePromises = messages.map(message => {
            if (message.state === 'sent' && message.senderId !== userId) {
                message.state = 'seen';
                return message.save();
            }
        });

        await Promise.all(updatePromises);

        return res.status(200).json(messages.map(message => ({
            messageId: message.id,
            content: message.content,
            senderId: message.senderId,
            isSeen: message.state === 'seen' ? 0 : 1,
            reaction: message.reaction,
            replyMessageContent: message.replyToMessage ? message.replyToMessage.content : null,
            createdAt: message.createdAt,
        })));
        
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

const getMessagesBetweenUsersUsingPagination = async (req, res) => {
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
            limit: process.env.MESSAGES_LIMIT || 10,
            order: [["createdAt", "DESC"]],
            attributes: ['id', 'senderId', 'content', 'state', 'reaction', 'replyTo', 'createdAt'],  // Add this line
            include: [{
                model: Message,
                as: 'replyToMessage',
                attributes: ['content'],
            }],
        });


        let updatePromises = messages.map(message => {
            if (message.state === 'sent' && message.senderId !== userId) {
                message.state = 'seen';
                return message.save();
            }
        });

        await Promise.all(updatePromises);

        return res.status(200).json(messages.map(message => ({
            messageId: message.id,
            content: message.content,
            senderId: message.senderId,
            isSeen: message.state === 'seen' ? 0 : 1,
            reaction: message.reaction,
            replyMessageContent: message.replyToMessage ? message.replyToMessage.content : null,
            createdAt: message.createdAt,
        })));
        
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

const getUserChats = async (req, res) => {
    try {
        const { userId } = req.user;
        const { offset = 0 } = req.query;

        const chats = await Chat.findAll({
            where: {
                [Op.or]: [
                    { user1Id: userId },
                    { user2Id: userId },
                ],
            },
            include: [
                {
                    model: Message,
                    as: 'messages',
                    limit: 1,
                    order: [['createdAt', 'DESC']],
                    attributes: ['id', 'content', 'createdAt', 'state', 'senderId'],
                },
                {
                    model: User,
                    as: 'user1',
                    attributes: ['id', 'username', 'isVerified'],
                    where: { id: { [Op.ne]: userId } },
                    required: false,
                    include: [
                        {
                            model: Profile,
                            as: 'profile',
                            attributes: ['imageFileName'],
                        },
                    ],
                },
                {
                    model: User,
                    as: 'user2',
                    attributes: ['id', 'username', 'isVerified'],
                    where: { id: { [Op.ne]: userId } },
                    required: false,
                    include: [
                        {
                            model: Profile,
                            as: 'profile',
                            attributes: ['imageFileName'],
                        },
                    ],
                },
            ],
            limit: process.env.CHATS_LIMIT || 10,
            offset: parseInt(offset),
            order: [['updatedAt', 'DESC']],
        });

        for (let chat of chats) {
            if (chat.user1 && chat.user1.id === userId) {
                chat.user1 = null;
            } else if (chat.user2 && chat.user2.id === userId) {
                chat.user2 = null;
            }

            if (chat.user1 && chat.user1.profile && chat.user1.profile.imageFileName) {
                chat.user1.profile.imageFileName = await getSignedUrl(chat.user1.profile.imageFileName);
            }

            if (chat.user2 && chat.user2.profile && chat.user2.profile.imageFileName) {
                chat.user2.profile.imageFileName = await getSignedUrl(chat.user2.profile.imageFileName);
            }
        }

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

        if (reaction < 1 || reaction > 4)
            return res.status(400).json({ message: "Invalid reaction" });

        message.reaction = reaction;
        await message.save();

        return res.status(200).json({ message: "Reaction added successfully" });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

const deleteReaction = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { messageId } = req.query;
        const { userId } = req.user;

        if (!messageId || !chatId) {
            console.log("no messageId being sent");
            return res.status(400).json({ message: "Invalid request" });
        }

        const message = await Message.findByPk(messageId);
        if (!message)
            return res.status(404).json({ message: "Message not found" });

        const chat = await Chat.findByPk(chatId);
        if (!chat || (chat.user1Id !== userId && chat.user2Id !== userId))
            return res.status(403).json({ message: "You are not a participant in this chat" });

        if (message.senderId === userId)
            return res.status(403).json({ message: "You can't delete a react on your own message" });
        
        if (message.reaction == null)
            return res.status(403).json({ message: "No reaction to delete" });

        message.reaction = null;

        await message.save();

        return res.status(200).json({ message: "Reaction deleted successfully" });

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
    getMessagesBetweenUsersUsingPagination, 
    getUserChats,
    addReactionToMessage,
    deleteMessage,
    deleteReaction,
}
