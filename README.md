# Photoflow

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome">
</p>

<p align="center">
  A full-stack photo sharing application built with the MERN stack and Next.js.
</p>

---

## 🚀 Features

*   **User Authentication:** Secure user registration and login with JWT.
*   **Password Management:** Forgot and reset password functionality with OTP.
*   **User Profiles:** View and edit user profiles with a profile picture.
*   **Post Management:** Create, view, like, and comment on posts.
*   **Cloudinary Integration:** Upload and store images on the cloud.
*   **Email Notifications:** Receive email notifications for important events.

---

## 🛠️ Tech Stack

| Category  | Technology                                                                                                                                                                                          |
| :-------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**  | [React.js](https://reactjs.org/), [Next.js](https://nextjs.org/), [Redux Toolkit](https://redux-toolkit.js.org/), [Tailwind CSS](https://tailwindcss.com/), [Shadcn/ui](https://ui.shadcn.com/), [Axios](https://axios-http.com/) |
| **Backend**   | [Node.js](https://nodejs.org/), [Express.js](https://expressjs.com/), [MongoDB](https://www.mongodb.com/), [Mongoose](https://mongoosejs.com/), [JWT](https://jwt.io/), [Cloudinary](https://cloudinary.com/), [Nodemailer](https://nodemailer.com/) |
| **DevOps**    | [Git](https://git-scm.com/), [GitHub](https://github.com), [npm](https://www.npmjs.com/)                                                                                                           |

---

## 📖 Getting Started

<details>
<summary>Click to expand</summary>

### Prerequisites

*   Node.js and npm
*   MongoDB
*   Cloudinary Account
*   Mail Server (e.g., Mailtrap)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/photoflow.git
    cd photoflow
    ```

2.  **Backend Setup:**
    ```bash
    cd backend
    npm install
    ```
    Create a `config.env` file and add the required environment variables (see `config.env.example`).

3.  **Frontend Setup:**
    ```bash
    cd ../frontend
    npm install
    ```
    Create a `.env.local` file and add the required environment variables (see `.env.local.example`).

4.  **Run the application:**
    ```bash
    # In the backend directory
    npm start

    # In the frontend directory
    npm run dev
    ```
</details>

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/your-username/photoflow/issues).

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📝 License

This project is [MIT](https://github.com/your-username/photoflow/blob/main/LICENSE) licensed.