const Chat = require("../config/db").Chat;
const Message = require("../config/db").Message;
const UserStatus = require("../config/db").UserStatus;
const UserAuth = require("../config/db").UserAuth;
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
            const replyMessage = await Message.findByPk(replyTo, {
                attributes: ['id', 'chatId'],
            });
            if (!replyMessage || replyMessage.chatId !== chatId)
                return res.status(404).json({ message: "الرسالة غير موجودة او في محادثة اخري" });
        }

        if (!chatId || !message)
        return res.status(400).json({ message: "Invalid request" });

        if (!message || message.trim() === '')
        return res.status(400).json({ message: 'يجب ان تكتب محتوي في الرسالة' });

        const chat = await Chat.findOne({
            where: {
                id: chatId,
                [Op.or]: [{ user1Id: userId }, { user2Id: userId }],
            },
            attributes: ['id'],
        });

        if (!chat) {
            return res.status(404).json({ message: "المحادثة غير موجودة" });
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
        if (!Number.isInteger(replyTo)) 
            return res.status(400).json({ message: "ادخال خاطئ: يجب ان ترسل رقم الرسالة" });

        const replyMessage = await Message.findByPk(replyTo, {
            attributes: ['id']
        });
        if (!replyMessage)
            return res.status(404).json({ message: "الرسالة غير موجودة" });
    }

    if (!receiverId || !message)
        return res.status(400).json({ message: "كل الخانات يجب ان تكون مكتوبة" });

    if (!message || message.trim() === '')
        return res.status(400).json({ message: 'يجب ان تكتب محتوي في الرسالة' });

    if (userId === receiverId)
        return res.status(400).json({ message: "لا يمكنك ان ترسل رسالة الي نفسك" });

    const transaction = await sequelize.transaction();

    try {
        let [chat] = await Chat.findOrCreate({
            where: {
                [Op.or]: [
                    { user1Id: userId, user2Id: receiverId },
                    { user1Id: receiverId, user2Id: userId }
                ],
            },
            defaults: {
                user1Id: userId,
                user2Id: receiverId
            },
            transaction
        });

        if (replyTo) {
            if (!Number.isInteger(replyTo)) 
                return res.status(400).json({ message: "ادخال خاطئ: يجب ان ترسل رقم الرسالة" });

            const replyMessage = await Message.findByPk(replyTo, {
                attributes: ['id', 'chatId']
            });
            if (!replyMessage || replyMessage.chatId !== chat.id)
                return res.status(404).json({ message: "الرسالة غير موجودة او في محادثة اخري" });
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


const getMessages = async (req, res, chatId, userId) => {
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;

    const chat = await Chat.findOne({
        where: {
            id: chatId,
            [Op.or]: [{ user1Id: userId }, { user2Id: userId }],
        },
        attributes: ['id'],
    });

    if (!chat) {
        return res.status(404).json({ message: "المحادثة غير موجودة" });
    }

    const messages = await Message.findAll({
        where: { chatId },
        offset,
        limit: process.env.MESSAGES_LIMIT || 10,
        order: [["createdAt", "DESC"]],
        attributes: ['id', 'senderId', 'content', 'state', 'reaction', 'replyTo', 'createdAt'],
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

    return messages.map(message => ({
        messageId: message.id,
        content: message.content,
        senderId: message.senderId,
        isSeen: message.state === 'seen' ? 0 : 1,
        reaction: message.reaction,
        replyMessageContent: message.replyToMessage ? message.replyToMessage.content : null,
        createdAt: message.createdAt,
    }));
}

const getMessagesUsingPagination = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { userId } = req.user;

        if (!chatId)
            return res.status(400).json({ message: "Invalid request" });

        const messages = await getMessages(req, res, chatId, userId);

        return res.status(200).json(messages);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

const getMessagesBetweenUsersUsingPagination = async (req, res) => {
    try {
        const { user2Id } = req.params;
        const { userId } = req.user;

        if (!user2Id)
            return res.status(400).json({ message: "Invalid request" });

        const chat = await Chat.findOne({
            where: {
                [Op.or]: [
                    { user1Id: userId, user2Id: user2Id },
                    { user1Id: user2Id, user2Id: userId }
                ],
            },
            attributes: ['id'],
        });

        if (!chat) {
            return res.status(404).json({ message: "المحادثة غير موجودة" });
        }

        const messages = await getMessages(req, res, chat.id, userId);

        return res.status(200).json(messages);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}


const getUserChats = async (req, res) => {
    try {
        const { userId } = req.user;
        const { offset = 0 } = req.query;

        const generateUserInclude = () => ({
            model: User,
            attributes: ['id', 'username', 'email', 'phone', 'referralCode', 'referrals', 'referred'],
            where: { id: { [Op.ne]: userId } },
            required: false,
            include: [
                {
                    model: Profile,
                    as: 'profile',
                    attributes: ['imageFileName', 'bio'],
                },
                {
                    model: UserStatus,
                    as: 'userStatus',
                    attributes: ['isBanned', 'isAdmin', 'isVerified'],
                },
            ],
        });

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
                    ...generateUserInclude(),
                    as: 'user1',
                },
                {
                    ...generateUserInclude(),
                    as: 'user2',
                },
            ],
            limit: process.env.CHATS_LIMIT || 10,
            offset: parseInt(offset),
            order: [['updatedAt', 'DESC']],
            attributes: ['id', 'updatedAt']
        });

        await Promise.all(chats.map(async chat => {
            if (chat.user1 && chat.user1.profile && chat.user1.profile.imageFileName) {
                chat.user1.profile.imageFileName = await getSignedUrl(chat.user1.profile.imageFileName);
            }

            if (chat.user2 && chat.user2.profile && chat.user2.profile.imageFileName) {
                chat.user2.profile.imageFileName = await getSignedUrl(chat.user2.profile.imageFileName);
            }
        }));

        return res.status(200).json(chats);

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

const validateMessageAndChat = async (messageId, chatId, userId) => {
    const message = await Message.findByPk(messageId, {
        attributes: ['id', 'senderId', 'reaction'],
    });
    if (!message)
        throw new Error("Message not found");

    const chat = await Chat.findByPk(chatId, {
        attributes: ['id', 'user1Id', 'user2Id'],
    });
    if (!chat || (chat.user1Id !== userId && chat.user2Id !== userId))
        throw new Error("You are not a participant in this chat");

    return { message, chat };
};

const addReactionToMessage = async (req, res) => {
    try {
        const { messageId, reaction, chatId } = req.body;
        const { userId } = req.user;

        if (!messageId || !reaction) {
            console.log("no messageId or no reaction being sent");
            return res.status(400).json({ message: "Invalid request" });
        }

        const { message, chat } = await validateMessageAndChat(messageId, chatId, userId);

        if (message.senderId === userId)
            return res.status(403).json({ message: "لا يمكنك ان تتفاعل مع رسالتك" });

        if (reaction < 1 || reaction > 4)
            return res.status(400).json({ message: "تفاعل خاطئ" });

        message.reaction = reaction;
        await message.save();

        return res.status(200).json({ message: "تم ارسال التفاعل بنجاح" });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

const deleteReaction = async (req, res) => {
    try {
        const { messageId } = req.query;
        const { chatId } = req.params;
        const { userId } = req.user;

        if (!messageId || !chatId) {
            console.log("no messageId being sent");
            return res.status(400).json({ message: "Invalid request" });
        }

        const { message, chat } = await validateMessageAndChat(messageId, chatId, userId);

        if (message.senderId === userId)
            return res.status(403).json({ message: "لا يمكنك ان تحذف التفاعل مع رسالتك" });
        
        if (message.reaction == null)
            return res.status(403).json({ message: "لا يوجد تفاعل للحذف" });

        message.reaction = null;

        await message.save();

        return res.status(200).json({ message: "تم حذف التفاعل بنجاح" });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { userId } = req.user;

        if (!messageId)
            return res.status(400).json({ message: "Invalid request" });

        const message = await Message.findByPk(messageId, {
            attributes: ['id', 'senderId'],
        });
        if (!message)
            return res.status(404).json({ message: "الرسالة غير موجودة" });

        if (message.senderId !== userId)
            return res.status(403).json({ message: "ليس لديك الصلاحية لحذف الرسالة" });

        await message.destroy();

        return res.status(200).json({ message: "تم حذف الرسالة بنجاح" });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}


const getMessageUsingId = async (req, res) => {
    try {
        const { userId } = req.user;
        const messageId = req.params.messageId;

        if (!messageId)
            return res.status(400).json({ message: "Invalid request" });

        const userStatus = await UserStatus.findByPk(userId, {
            attributes: ['isAdmin'],
        });
        if (!userStatus || !userStatus.isAdmin)
            return res.status(403).json({ message: "ليس لديك الصلاحية للقيام بهذا الفعل" });

        const message = await Message.findByPk(messageId);
        if (!message) {
            return res.status(404).json({ message: 'الرسالة غير موجودة' });
        }
        return res.status(200).json(message);

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
    getMessageUsingId,
}
