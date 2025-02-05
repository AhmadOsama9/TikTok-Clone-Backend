# Restricted TikTok Clone Backend

A robust backend system inspired by TikTok, designed to provide a **secure and efficient** user experience while incorporating content restrictions suitable for a more controlled social environment. Unlike conventional TikTok, this platform is **moderated and refined** to better align with societal values.

## 🚀 Features

### 📹 Video Handling
- **Video Compression**: Automatically compresses videos to **standard quality and bitrates** before storage for optimal performance.
- **Cloud Storage Integration**: Efficient management of video content, thumbnails, and profile images with scalable cloud storage solutions.

### 🎭 User Engagement
- **Reactions & Comments**: Users can react to video comments, enhancing interactivity.
- **Views & Shares**: Tracks and displays view counts and shares.
- **Real-Time Chat**: Enables users to engage in conversations.
- **Gifting System**: Allows users to send virtual gifts.

### 🔍 Content Moderation
- **Pre-Upload Content Checking**: Verifies video content before it is published, ensuring compliance with platform guidelines.
- **Content Reporting**: Users can report inappropriate content for review.

### 🔐 User Authentication
- **OAuth Integration**: Supports Google and Facebook login for seamless authentication.

### 🧠 Smart Algorithm
- **Personalized Video Recommendations**: AI-driven algorithm suggests relevant videos based on user interactions.

## 🛠️ Tech Stack
- **Backend Framework**: Node.js, Express.js
- **Database**: PostgreSQL (Metadata storage)
- **Storage**: Cloud storage for video and image assets
- **Testing**: Jest
- **CI/CD**: GitHub Workflows
- **API Documentation**: Swagger

## 📦 Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/yourusername/restricted-tiktok-backend.git
   cd restricted-tiktok-backend
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Set up environment variables:**
   - Create a `.env` file and configure the necessary environment variables.
4. **Run the server:**
   ```sh
   npm start
   ```
5. **Run tests:**
   ```sh
   npm test
   ```

## 🚀 Deployment
This backend can be deployed using **Render, AWS, or any cloud provider** supporting Node.js applications.