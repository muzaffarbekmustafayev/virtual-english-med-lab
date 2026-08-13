# Virtual English Med Lab

A web application designed for medical students to practice and improve their clinical English communication skills through interactions with a Virtual AI Patient.

## Features

- **Interactive Modules**: Step-by-step clinical communication modules tailored for dentistry and medicine.
- **Vocabulary & Phrasebook**: Learn medical terms and essential phrases.
- **Gap Fill Exercises**: Test your understanding of medical phrasing.
- **Virtual AI Patient Chat**: A voice-enabled conversational agent (powered by Gemini AI) that acts as a patient with specific symptoms. Practice your diagnostic and communication skills in real-time.
- **AI Feedback**: Receive detailed feedback on grammar, vocabulary, fluency, pronunciation, and clinical approach after each conversation.
- **Final Challenge & Quiz**: Test your knowledge without hints.

## Technology Stack

### Frontend
- React + Vite
- Tailwind CSS (Responsive Mobile-First Design)
- React Router DOM
- Web Speech API (Speech Recognition & Speech Synthesis)
- Remix Icons

### Backend
- Node.js + Express
- Sequelize ORM (MySQL Database)
- Google Gemini GenAI SDK

## Getting Started

### Prerequisites
- Node.js (v18+)
- MySQL Database
- Google Gemini API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/muzaffarbekmustafayev/virtual-english-med-lab.git
   cd virtual-english-med-lab
   ```

2. **Setup Backend:**
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in the `backend` directory based on the `.env.example`:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=yourpassword
   DB_NAME=virtual_med_lab
   GEMINI_API_KEY=your_gemini_api_key
   ```
   Start the backend server:
   ```bash
   npm run dev
   ```

3. **Setup Frontend:**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

4. **Open in Browser:**
   Navigate to `http://localhost:5173` to view the application.

## License
MIT License
