const { GoogleGenAI } = require('@google/genai');
const { Conversation, Module, Message } = require('../models');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Shared with the text/audio chat so every specialty gets the same role-play rules
const { buildPatientSystemInstruction } = require('./gemini.service');

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
