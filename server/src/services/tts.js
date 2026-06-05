import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 使用 Gemini TTS 生成轻柔语音
 */
export async function generateSpeech(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('Gemini API Key 未配置');
  }

  const ai = new GoogleGenAI({ apiKey });

  console.log('🎵 尝试 TTS 模型: gemini-2.5-flash-preview-tts');

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-tts',
    systemInstruction: '你是一个温柔的晚安陪伴者。请用非常轻柔、缓慢、温暖的语气朗读文字，像是在深夜轻声对一个即将入睡的人说话。语速要慢，声音要轻柔，带有关怀和安抚的感觉。',
    contents: text,
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: 'Kore' // 温柔轻柔的女声
          }
        }
      }
    }
  });

  // 提取音频数据
  const candidate = response.candidates?.[0];
  if (!candidate?.content?.parts) {
    throw new Error('未获得音频响应');
  }

  const audioPart = candidate.content.parts.find(
    part => part.inlineData && part.inlineData.mimeType?.startsWith('audio/')
  );

  if (!audioPart) {
    throw new Error('响应中未包含音频数据');
  }

  const mimeType = audioPart.inlineData.mimeType;
  const rawData = Buffer.from(audioPart.inlineData.data, 'base64');

  console.log(`🎵 TTS 成功: ${mimeType}, ${rawData.length} bytes`);

  // 如果是 PCM (audio/L16)，需要包装成 WAV
  if (mimeType.includes('L16') || mimeType.includes('pcm')) {
    // 从 mimeType 中提取采样率，如 "audio/L16;codec=pcm;rate=24000"
    const rateMatch = mimeType.match(/rate=(\d+)/);
    const sampleRate = rateMatch ? parseInt(rateMatch[1]) : 24000;
    const wavBuffer = pcmToWav(rawData, sampleRate, 1, 16);
    return { buffer: wavBuffer, contentType: 'audio/wav' };
  }

  // 其他格式（mp3/ogg等）直接返回
  return { buffer: rawData, contentType: mimeType };
}

/**
 * 将 PCM raw data 包装成 WAV 文件
 */
function pcmToWav(pcmData, sampleRate, numChannels, bitsPerSample) {
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const dataSize = pcmData.length;
  const headerSize = 44;
  const fileSize = headerSize + dataSize;

  const buffer = Buffer.alloc(fileSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(fileSize - 8, 4);
  buffer.write('WAVE', 8);

  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // chunk size
  buffer.writeUInt16LE(1, 20); // PCM format
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  pcmData.copy(buffer, 44);

  return buffer;
}
