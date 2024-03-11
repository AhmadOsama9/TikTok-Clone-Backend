const User = require("../config/db").User;
const Transaction = require("../config/db").Transaction;
const { Op } = require('sequelize');
const sequelize = require("../config/db").sequelize;
const rechargeBalance = require("../helper/checkFirebaseForCardCode");



const getBalanceAndTransactions = async (req, res) => {
    try {
        const { userId } = req.user;

        const user = await User.findOne({ 
            where: { id: userId },
            attributes: ['balance']
        });
        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }

        const transactions = await Transaction.findAll({ 
            where: { 
                [Op.or]: [
                    { senderId: userId },
                    { receiverId: userId }
                ]
            },
            include: [
                { model: User, as: 'sender', attributes: ['username'] },
                { model: User, as: 'receiver', attributes: ['username'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        // Change the sign of the amount for sent transactions
        transactions.forEach(transaction => {
            if (transaction.senderId === userId) {
                transaction.amount = -transaction.amount;
            }
        });

        return res.status(200).send({ balance: user.balance, transactions: transactions });

    } catch (error) {
        return res.status(500).send({ error: error.message });
    }
}


//here should I use the update
//instead of the save ?
const addBalance = async (req, res) => { 
    const transaction = await sequelize.transaction();
    try {
        const { userId } = req.user;
        const { cardCode } = req.body;

        if (!cardCode)
            return res.status(400).send({ message: "Card code is required" });

        const user = await User.findOne({ 
            where: { id: userId },
            attributes: ['id', 'balance']
        });
        if (!user)
            return res.status(404).send({ message: "User not found" });

        const balance = await rechargeBalance({ code: cardCode, userId: userId });

        if (!balance)
            return res.status(400).send({ message: "Invalid card code" });

        if (balance < 0 || isNaN(balance))
            return res.status(400).send({ message: "Invalid card code" });

        user.balance += balance;
        await user.save({ transaction });

        await Transaction.create({
            amount: balance,
            receiverId: userId,
        }, { transaction });

        await transaction.commit();

        return res.status(200).send({ message: "Balance added successfully" });

    } catch (error) { 
        await transaction.rollback();
        return res.status(500).send({ error: error.message });
    }
}

const sendGift = async (req, res) => { 
    const t = await sequelize.transaction();
    try {
        const { userId } = req.user;
        const { receiverId, amount } = req.body;

        if (amount <= 0) {
            return res.status(400).send({ message: "Invalid balance" });
        }

        const sender = await User.findOne({ 
            where: { id: userId },
            attributes: ['id', 'balance']
        });
        if (!sender) {
            return res.status(404).send({ message: "User not found" });
        }

        const receiver = await User.findOne({ 
            where: { id: receiverId },
            attributes: ['id', 'balance']
        });
        if (!receiver) {
            return res.status(404).send({ message: "Receiver not found" });
        }

        if (sender.balance < amount) {
            return res.status(400).send({ message: "Insufficient balance" });
        }

        sender.balance -= amount;
        receiver.balance += amount;
        await sender.save({ transaction: t });
        await receiver.save({ transaction: t });

        await Transaction.create({
            amount: amount,
            senderId: sender.id,
            receiverId: receiver.id,
        }, { transaction: t });

        await t.commit();
        return res.status(200).send({ message: "Gift sent successfully" });

    } catch (error) {
        await t.rollback();
        return res.status(500).send({ error: error.message });
    }
}

module.exports = {
    getBalanceAndTransactions,
    addBalance,
    sendGift,
}