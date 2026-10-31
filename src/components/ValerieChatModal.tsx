import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Sparkles, Bot, User } from 'lucide-react';
import { ChatMessage, AcCircuitParams } from '../types';
import { ValerieMascot } from './ValerieMascot';
import { useLanguage } from '../context/LanguageContext';

interface ValerieChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTopic?: string;
  currentParams?: AcCircuitParams;
}

export const ValerieChatModal: React.FC<ValerieChatModalProps> = ({
  isOpen,
  onClose,
  currentTopic = 'AC Sine Wave & THD Inverter',
  currentParams,
}) => {
  const { language } = useLanguage();

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      sender: 'valerie',
      text:
        language === 'zh'
          ? '哈囉！我是瓦莉莉 💜！有任何關於交流正弦波、總諧波失真 (THD)、SPWM 調變或 LC 濾波器設計的疑問，儘管問我唷！讓我們用定額電力把太空船送往星際！⚡🚀'
          : 'Hi! I am Valerie 💜! Ask me anything about AC sine waves, Total Harmonic Distortion (THD), SPWM, or LC filter tuning! Let’s maximize our fixed power flight range! ⚡🚀',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMsgText = inputText.trim();
    setInputText('');

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: userMsgText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/valerie-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMsgText,
          topic: currentTopic,
          context: currentParams,
          lang: language,
        }),
      });

      const data = await response.json();

      let replyText = '';
      if (response.ok && data.reply) {
        replyText = data.reply;
      } else {
        replyText = getOfflineValerieReply(userMsgText, language);
      }

      const valerieMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'valerie',
        text: replyText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, valerieMsg]);
    } catch {
      const fallbackMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'valerie',
        text: getOfflineValerieReply(userMsgText, language),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const getOfflineValerieReply = (prompt: string, lang: 'zh' | 'en'): string => {
    const lower = prompt.toLowerCase();
    if (lower.includes('thd') || lower.includes('諧波')) {
      return lang === 'zh'
        ? '⚡ 總諧波失真 (THD) 是所有非基頻諧波電壓有效值除以基頻電壓！在太空船推進中，諧波不會產生向前推力，只會產生逆轉力矩和渦流廢熱，因此 THD 越低，太空船用定額電力飛得越遠！目標是降到 5% 以下 (IEEE 519 標準)！'
        : '⚡ Total Harmonic Distortion (THD) is the ratio of harmonic RMS voltage to the fundamental. Harmonics do not produce forward thrust—they produce counter-torques and coil heat! Lower THD maximizes fixed-power range. Aim for < 5% (IEEE 519)!';
    }
    if (lower.includes('filter') || lower.includes('濾波') || lower.includes('lc') || lower.includes('電感') || lower.includes('電容')) {
      return lang === 'zh'
        ? '🔧 LC 低通濾波器截止頻率公式為 f_c = 1 / (2π√(LC))！我們希望 f_c 高於 400Hz 基頻，但遠低於開關頻率 f_sw (例如 10kHz~30kHz)，這樣能強烈衰減 PWM 載波諧波，輸出平滑純正弦波！'
        : '🔧 LC low-pass filter cutoff is f_c = 1 / (2π√(LC))! Place f_c above the 400Hz fundamental but well below switching frequency f_sw to strongly attenuate switching ripple!';
    }
    if (lower.includes('spwm') || lower.includes('pwm') || lower.includes('調變')) {
      return lang === 'zh'
        ? '🌊 SPWM (正弦脈寬調變) 利用三角載波與正弦波比對，把諧波推往高頻開關頻率 (f_sw 附近)，消除低階三次、五次諧波！注意調變指數 m_a 不要超過 1.0，否則過調變會讓波形削頂失真！'
        : '🌊 SPWM pushes harmonics up to high frequencies around f_sw, eliminating low-order 3rd & 5th harmonics! Keep modulation index m_a <= 1.0 to avoid overmodulation clipping!';
    }
    if (lower.includes('方波') || lower.includes('square')) {
      return lang === 'zh'
        ? '📦 原始 180° 方波的 THD 高達 48.3%！它含有大量的 3次、5次、7次諧波，定額電力幾乎有三分之一都被白白燒成廢熱，連月球都到不了！'
        : '📦 Unfiltered square waves have THD ~48.3%! Heavy 3rd, 5th, and 7th harmonics burn over a third of your power into waste heat, stalling before reaching the Moon!';
    }
    return lang === 'zh'
      ? '💜 瓦莉莉收到你的問題了！在交流電力推進中，最核心的目標就是「純淨正弦波驅動」。只要搭配適當的開關頻率與 LC 濾波器，抑制諧波產生，100 kW 定額動力就能帶我們航向南門二星際！'
      : '💜 Valerie got your question! In AC electric propulsion, pure sine wave drive is paramount. With optimal switching frequency and LC filtering, our 100 kW core can propel us all the way to Alpha Centauri!';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-[#05070a]/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-[#0b121e] border border-cyan-500/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[520px]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#0f1827] border-b border-cyan-900/40">
            <div className="flex items-center gap-2.5">
              <ValerieMascot expression="happy" size="sm" />
              <div>
                <h3 className="font-bold text-sm text-cyan-100 flex items-center gap-1.5">
                  <span>{language === 'zh' ? '瓦莉莉 AI 助教' : 'Valerie AI Assistant'}</span>
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                </h3>
                <div className="text-[10px] text-cyan-400 font-mono">
                  {language === 'zh' ? '交流正弦波與 THD 專屬諮詢' : 'AC Sine & THD Specialist'}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 max-w-[85%] ${
                  m.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    m.sender === 'user'
                      ? 'bg-cyan-600 text-slate-950'
                      : 'bg-purple-900/80 border border-purple-400 text-purple-200'
                  }`}
                >
                  {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div
                  className={`p-3 rounded-xl leading-relaxed whitespace-pre-line ${
                    m.sender === 'user'
                      ? 'bg-cyan-600 text-slate-950 font-semibold rounded-tr-none'
                      : 'bg-[#131d2e] border border-cyan-900/50 text-cyan-100 rounded-tl-none'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="self-start flex items-center gap-2 text-cyan-400 text-xs italic bg-[#131d2e] px-3 py-2 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>{language === 'zh' ? '瓦莉莉正在思考計算...' : 'Valerie is computing...'}</span>
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-[#0f1827] border-t border-cyan-900/40 flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={
                language === 'zh'
                  ? '向瓦莉莉提問，例如：如何降低 THD？什麼是 LC 截止頻率？'
                  : 'Ask Valerie, e.g. How to lower THD? What is LC cutoff frequency?'
              }
              className="flex-1 bg-[#060a12] border border-cyan-900/60 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputText.trim()}
              className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 font-bold transition-all cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
