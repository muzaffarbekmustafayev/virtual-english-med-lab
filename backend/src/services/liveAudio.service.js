const { GoogleGenAI } = require('@google/genai');
const { Conversation, Module, Message } = require('../models');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function buildPatientSystemInstruction(scenarioObj) {
  return `
You are a patient visiting a doctor's/dentist's clinic. You speak ONLY English.
Behave realistically as a patient — express emotions (fear, pain, relief).
Stay strictly in character based on the JSON scenario provided below.
Do NOT break character under any circumstances.
Do NOT give medical advice or act as a doctor.

Your specific persona and scenario for this session:
${JSON.stringify(scenarioObj, null, 2)}

IMPORTANT RULES:
- You already have a specific illness and symptoms defined in the scenario above. Do NOT change them.
- DO NOT state what your exact illness is immediately. Instead, describe your symptoms naturally when the doctor asks, and let the doctor diagnose it.
- Answer questions about your symptoms naturally and conversationally, strictly based on the symptoms listed in your scenario.
- Keep responses short and natural (1-3 sentences max).
- Use simple everyday English (not medical jargon).
- At appropriate times, you may ask the doctor questions listed in your "questions_to_ask_doctor".
`.trim();
}

function setupLiveAudioWebSocket(wss) {
  wss.on('connection', (ws) => {
    let geminiLiveSession = null;
    let conversationId = null;
    let currentConversation = null;

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === 'init') {
          conversationId = data.conversationId;
          const moduleId = data.moduleId || 4;

          if (conversationId) {
            currentConversation = await Conversation.findByPk(conversationId);
          }
          
          if (!currentConversation) {
            currentConversation = await Conversation.create({
              student_id: data.studentId || 1,
              module_id: moduleId,
              attempt_type: 'practice',
              status: 'active',
              dynamic_scenario: "{}",
            });
            conversationId = currentConversation.id;
          }

          let scenarioObj = {};
          try {
            scenarioObj = JSON.parse(currentConversation.dynamic_scenario);
          } catch (e) {}

          const systemInstruction = buildPatientSystemInstruction(scenarioObj);

          geminiLiveSession = await ai.live.connect({
            model: 'gemini-2.0-flash-exp',
            config: {
              systemInstruction: { parts: [{ text: systemInstruction }] },
              generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: {
                      voiceName: 'Aoede',
                    }
                  }
                }
              }
            }
          });

          ws.send(JSON.stringify({ type: 'ready', conversationId }));

          // Start listening to Gemini stream
          (async () => {
             for await (const msg of geminiLiveSession) {
                if (msg.serverContent && msg.serverContent.modelTurn) {
                  const content = msg.serverContent.modelTurn;
                  for (const part of content.parts) {
                    if (part.inlineData && part.inlineData.data) {
                      ws.send(JSON.stringify({
                        type: 'audio',
                        data: part.inlineData.data
                      }));
                    }
                    if (part.text) {
                      ws.send(JSON.stringify({
                        type: 'transcript',
                        text: part.text
                      }));
                    }
                  }
                }
             }
          })().catch(err => {
            console.error('Gemini Live session error:', err);
            ws.send(JSON.stringify({ type: 'error', message: 'Gemini disconnected.' }));
          });
        }

        if (data.type === 'audio_chunk' && geminiLiveSession) {
          geminiLiveSession.send({
            realtimeInput: {
              mediaChunks: [{
                mimeType: "audio/pcm;rate=16000",
                data: data.data
              }]
            }
          });
        }
      } catch (e) {
        // May be binary data if frontend sends raw arraybuffer
        console.error('WS Message Error:', e.message);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected from Live Audio WS');
    });
  });
}

module.exports = { setupLiveAudioWebSocket };
