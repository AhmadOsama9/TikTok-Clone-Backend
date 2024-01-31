const express = require("express");
const passport = require("passport");
const User = require("../db").User;
const Profile = require("../db").Profile;
const jwt = require("jsonwebtoken");

const router = express.Router();

async function handleFacebookCallback(req, res) {
  try {
    const user = req.user;

    const existingUser = await User.findOne({ facebookId: user.id });

    if (existingUser) {
        const token = jwt.sign({ id: existingUser.id }, process.env.JWT_SECRET, { expiresIn: '3d' });
        res.json({ token });
    } else {
        const newUser = new User({ 
            facebookId: user.id, 
            verifiedEmail: true, 
            facebookLoggedIn: true,
            name: user.displayName
        });
        await newUser.save();

        const newProfile = new Profile({ userId: newUser.id });
        await newProfile.save();

        const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, { expiresIn: '3d' });
        res.status(200).json({ token });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * @swagger
 * /api/auth/facebook:
 *   get:
 *     summary: Start facebook OAuth flow
 *     responses:
 *       302:
 *         description: Redirect to facebook's OAuth consent page
 */
router.get(
  "/facebook", 
  passport.authenticate("facebook", { scope: ["profile", "email"] })
);

/**
 * @swagger
 * /api/auth/facebook/callback:
 *   get:
 *     summary: Handle callback from facebook OAuth
 *     responses:
 *       200:
 *         description: Authentication successful, returns a JWT
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: The JWT for the authenticated user
 *       500:
 *         description: An error occurred during authentication
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: The error message
 */
router.get(
  "/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  handleFacebookCallback,
)


module.exports = router;

