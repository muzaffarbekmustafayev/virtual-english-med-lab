# Virtual Patient English — Ovozli Muloqot va Nutq Tahlili Arxitekturasi

Ushbu hujjat **Virtual Patient English** platformasidagi **Speech-to-Text (STT)**, **Text-to-Speech (TTS)**, **Gemini Live Audio** va ovozli suhbat (Voice Chat) texnologik arxitekturasini yoritadi.

---

## 1. Ovozli Muloqot Tizimining Maqsadi

Tibbiyot va stomatologiya talabalari klinik ingliz tilida faqat yozma emas, balki **og'zaki ravon muloqot qilishlari** muhim hisoblanadi. Ovozli modul talabaning nutqini matnga o'girish, AI-bemorning javoblarini ovozli ijro etish va talaffuzni baholash imkonini beradi.

---

## 2. Ovozli Pipeline Arxitekturasi

### A. Matnli Chat Rejimi (Asosiy)

```
[Talaba Brauzer Klaviaturasi] ➔ Matnli xabar
                    ↓
        [Backend API /api/student/conversations/:id/messages]
                    ↓
        Google Gemini AI (`gemini-2.5-flash`) — Virtual Bemor
                    ↓ Matnli javob
        [Frontend Chat UI Display]
                    ↓ (ixtiyoriy)
        Web Speech Synthesis API (TTS) ➔ [Frontend Speaker]
```

### B. WebSocket Live Audio Rejimi (Real-Time Ovozli Suhbat)

```
[Talaba Mikrofoni] ──(PCM 16kHz)──► [WebSocket Server]
                                          │
                                   [Gemini Live API]
                                   (gemini-2.0-flash-exp)
                                          │
                              ┌───────────┴───────────┐
                              ▼                       ▼
                       [Audio Response]        [Text Transcript]
                              │                       │
                              ▼                       ▼
                    [Frontend Speaker]       [Chat UI Display]
```

### C. Audio Fayl Orqali Chat Rejimi

```
[Talaba Mikrofoni] ➔ MediaRecorder API (Web Audio)
                          ↓ Audio Blob (base64)
               [Backend API /api/student/conversations/:id/voice-message]
                          ↓
               Google Gemini AI (audio qabul qilish + transkript + javob)
                          ↓ Transkript matni + AI bemor javobi
               [Frontend Chat UI Display]
```

---

## 3. Texnologik Boshqaruv

### A. Speech-to-Text (Ovozni matnga o'girish)
1. **Client-side (Browser):** Web Speech API (`webkitSpeechRecognition`). Standart Chrome va Edge brauzerlarida bepul va tez ishlaydi.
2. **Server-side (Gemini Audio):** Gemini AI modeli audio faylni (base64) to'g'ridan-to'g'ri qabul qilib, transkript va AI javobini birga qaytaradi (`getPatientAudioReplyStream` funksiyasi).
3. **Real-time (Gemini Live):** WebSocket orqali `gemini-2.0-flash-exp` modeli real-time audio oqimini qabul qilib, audio va matnli javob qaytaradi.

### B. Text-to-Speech (Matnni ovozga o'girish)
1. **Web Speech Synthesis API:** Browser imkoniyati orqali ingliz tilidagi (en-US, en-GB) ovozlar bilan AI bemorning javobini darhol o'qib berish.
2. **Gemini Live Audio Response:** Gemini Live rejimida AI modelining o'zi audio formatda javob qaytaradi — qo'shimcha TTS kerak emas.

### C. Talaffuz va Nutq Tahlili (Pronunciation & Fluency Evaluation)
AI Feedback bosqichida talabaning audio yozuvlaridagi pauzalar, bo'g'inlar va so'zlarning to'g'ri aytilishi tahlil qilinadi:
- **Speaking Rate (WPM):** Daqiqadagi so'zlar soni (ideal klinik muloqot: 110-140 WPM).
- **Hesitation Marks:** "Um", "Uh", uzviylikdagi to'xtalishlar soni.
- **Mispronunciation Detection:** Noto'g'ri talaffuz qilingan atamalar ko'rsatkichi.
