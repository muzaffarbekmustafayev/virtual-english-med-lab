# Virtual Patient English — Ovozli Muloqot va Nutq Tahlili Arxitekturasi

Ushbu hujjat **Virtual Patient English** platformasidagi **Speech-to-Text (STT)**, **Text-to-Speech (TTS)** va ovozli suhbat (Voice Chat) texnologik arxitekturasini yoritadi.

---

## 1. Ovozli Muloqot Tizimining Maqsadi

Tibbiyot va stomatologiya talabalari klinik ingliz tilida faqat yozma emas, balki **og'zaki ravon muloqot qilishlari** muhim hisoblanadi. Ovozli modul talabaning nutqini matnga o'girish, AI-bemorning javoblarini ovozli ijro etish va talaffuzni baholash imkonini beradi.

---

## 2. Ovozli Pipeline Arxitekturasi

```
[Talaba Mikrofoni] ➔ MediaRecorder API (Web Audio)
                          ↓ Audio Blob (.webm / .mp3)
               [Backend API /api/chat/voice]
                          ↓
               OpenAI Whisper / Web Speech API (STT)
                          ↓ Matn
               Gemini AI / GPT-4o Agent (Virtual Bemor)
                          ↓ Matn Javobi
               Text-to-Speech Engine (TTS) ➔ Web Speech Synthesis / OpenAI Audio
                          ↓
               [Frontend Audio Player] (AI Bemor Ovozli Javobi)
```

---

## 3. Texnologik Boshqaruv

### A. Speech-to-Text (Ovozni matnga o'girish)
1. **Boshlang'ich bosqich (Client-side):** Browser Web Speech API (`webkitSpeechRecognition`). Standart Chrome va Edge brauzerlarida bepul va tez ishlaydi.
2. **Kengaytirilgan bosqich (Server-side):** OpenAI Whisper API. Audio faylni (wav, mp3, webm) backendga yuklab, professional tibbiy terminologiyani yuqori aniqlikda matnga o'giradi.

### B. Text-to-Speech (Matnni ovozga o'girish)
1. **Web Speech Synthesis API:** Browser imkoniyati orqali ingliz tilidagi (en-US, en-GB) ovozlar bilan AI bemorning javobini darhol o'qib berish.
2. **OpenAI TTS (`tts-1` model):** Natural, emotsional va realistik bemor ovozlarini generatsiya qilish (masalan, `alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer`).

### C. Talaffuz va Nutq Tahlili (Pronunciation & Fluency Evaluation)
AI Feedback bosqichida talabaning audio yozuvlaridagi pauzalar, bo'g'inlar va so'zlarning to'g'ri aytilishi tahlil qilinadi:
- **Speaking Rate (WPM):** Daqiqadagi so'zlar soni (ideal klinik muloqot: 110-140 WPM).
- **Hesitation Marks:** "Um", "Uh", uzviylikdagi to'xtalishlar soni.
- **Mispronunciation Detection:** Noto'g'ri talaffuz qilingan atamalar ko'rsatkichi.
