/**
 * ============================================================================
 * J.A.R.V.I.S. SPEECH VIEW (V - MVC)
 * Web Speech Recognition & Speech Synthesis (Authentic British Persona)
 * ============================================================================
 */

class SpeechView {
    constructor(configModel) {
        this.config = configModel;
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isListening = false;
        this.availableVoices = [];
        this.selectedVoice = null;
        this.speechLang = localStorage.getItem('jarvis_speech_lang') || 'en-US';

        // Callback hooks for Controller
        this.onSpeechResult = null; // (finalTranscript) => {}
        this.onListeningChange = null; // (isListening) => {}

        this.initRecognition();
        this.initVoices();
        this.updateLangDisplay();

        // Subscribe to config changes for rate, pitch & voice index
        this.config.subscribe((key) => {
            if (key === 'voice_preferences_changed' || key === 'reset_defaults') {
                this.applyConfigPreferences();
            }
        });
    }

    setLanguage(lang) {
        this.speechLang = lang;
        localStorage.setItem('jarvis_speech_lang', lang);
        if (this.recognition) {
            this.recognition.lang = lang;
        }
        this.updateLangDisplay();
        const langName = lang.startsWith('zh') ? 'Chinese (中文)' : 'English';
        this.setFeedback(`Vocal matrix language set to ${langName}.`);
    }

    toggleLanguage() {
        const next = this.speechLang.startsWith('zh') ? 'en-US' : 'zh-CN';
        this.setLanguage(next);
        return next;
    }

    updateLangDisplay() {
        const langDisplay = document.getElementById('langDisplay');
        if (langDisplay) {
            langDisplay.textContent = this.speechLang.startsWith('zh') ? '中' : 'EN';
        }
    }

    initRecognition() {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRec) {
            console.warn('SpeechRecognition API not supported on this browser.');
            this.setFeedback('Speech recognition requires Chrome, Edge, or a Web Speech API browser.');
            return;
        }

        try {
            this.recognition = new SpeechRec();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = this.speechLang;

            this.accumulatedTranscript = '';
            this.silenceTimer = null;
            this.silenceTimeoutMs = 2500; // Generous 2.5s silence window to prevent cutting off words

            this.recognition.onstart = () => {
                this.isListening = true;
                this.updateMicButton(true);
                this.setFeedback('JARVIS is listening... Speak continuously (2.5s pause buffer).');
                if (this.onListeningChange) this.onListeningChange(true);
            };

            this.recognition.onresult = (event) => {
                let interimTranscript = '';
                let currentSessionFinal = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        currentSessionFinal += ' ' + event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                if (currentSessionFinal) {
                    this.accumulatedTranscript += currentSessionFinal;
                }

                const liveSpoken = (this.accumulatedTranscript + ' ' + interimTranscript).replace(/\s+/g, ' ').trim();
                if (liveSpoken) {
                    this.setFeedback(`Listening: "${liveSpoken}" (will process after pause)`);
                    const cmdInput = document.getElementById('commandInput');
                    if (cmdInput) {
                        cmdInput.value = liveSpoken;
                    }

                    // Reset 2.5-second silence timer on every spoken syllable/word
                    if (this.silenceTimer) {
                        clearTimeout(this.silenceTimer);
                    }
                    this.silenceTimer = setTimeout(() => {
                        this.commitSpeechResult();
                    }, this.silenceTimeoutMs);
                }
            };

            this.recognition.onerror = (event) => {
                console.warn('Speech recognition error:', event.error);
                let message = `Vocal error: ${event.error}`;
                if (event.error === 'not-allowed') {
                    message = 'Microphone permission denied. Please allow microphone access.';
                } else if (event.error === 'no-speech') {
                    message = 'No speech detected. Standing by.';
                }
                this.setFeedback(message);
                this.stopListening();
            };

            this.recognition.onend = () => {
                if (this.isListening) {
                    if (this.accumulatedTranscript.trim()) {
                        this.commitSpeechResult();
                    } else {
                        this.stopListening();
                    }
                }
            };
        } catch (e) {
            console.error('Failed to initialize speech recognition:', e);
        }
    }

    initVoices() {
        if (!this.synthesis) return;

        const populate = () => {
            this.availableVoices = this.synthesis.getVoices();
            const voiceSelect = document.getElementById('voiceSelect');
            if (voiceSelect && this.availableVoices.length > 0) {
                voiceSelect.innerHTML = '';
                let bestVoiceIndex = 0;

                this.availableVoices.forEach((v, index) => {
                    const opt = document.createElement('option');
                    opt.value = index;
                    opt.textContent = `${v.name} (${v.lang})`;

                    // Prioritize British accent for Jarvis
                    const isBritish = v.lang.includes('en-GB') || v.name.toLowerCase().includes('british') || v.name.toLowerCase().includes('daniel');
                    if (isBritish && bestVoiceIndex === 0) {
                        bestVoiceIndex = index;
                    }
                    voiceSelect.appendChild(opt);
                });

                // Check saved index or default
                const chosenIdx = this.config.selectedVoiceIndex || bestVoiceIndex;
                if (this.availableVoices[chosenIdx]) {
                    voiceSelect.selectedIndex = chosenIdx;
                    this.selectedVoice = this.availableVoices[chosenIdx];
                }
            }
        };

        populate();
        if (this.synthesis.onvoiceschanged !== undefined) {
            this.synthesis.onvoiceschanged = populate;
        }
    }

    applyConfigPreferences() {
        const voiceSelect = document.getElementById('voiceSelect');
        if (voiceSelect && this.availableVoices[this.config.selectedVoiceIndex]) {
            voiceSelect.selectedIndex = this.config.selectedVoiceIndex;
            this.selectedVoice = this.availableVoices[this.config.selectedVoiceIndex];
        }
    }

    toggleListening() {
        if (!this.recognition) {
            this.setFeedback('Speech recognition is not supported in this browser.');
            return false;
        }
        if (this.isListening) {
            // If user explicitly clicks mic while listening, process whatever they spoke immediately
            const currentSpoken = this.accumulatedTranscript.trim() || (document.getElementById('commandInput')?.value || '').trim();
            if (currentSpoken) {
                this.commitSpeechResult();
            } else {
                this.stopListening();
            }
            return false;
        } else {
            this.startListening();
            return true;
        }
    }

    startListening() {
        if (!this.recognition) return;
        this.accumulatedTranscript = '';
        if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
            this.silenceTimer = null;
        }
        try {
            if (this.synthesis) this.synthesis.cancel();
            this.recognition.start();
        } catch (e) {
            console.warn('Recognition start caught error:', e);
        }
    }

    commitSpeechResult() {
        if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
            this.silenceTimer = null;
        }

        const cmdInput = document.getElementById('commandInput');
        const finalSpoken = (cmdInput ? cmdInput.value : this.accumulatedTranscript).trim();

        this.accumulatedTranscript = '';
        this.stopListening();

        if (finalSpoken && this.onSpeechResult) {
            this.setFeedback(`Transmitting: "${finalSpoken}"`);
            this.onSpeechResult(finalSpoken);
        }
    }

    stopListening() {
        if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
            this.silenceTimer = null;
        }
        this.isListening = false;
        this.updateMicButton(false);
        if (this.recognition) {
            try { this.recognition.stop(); } catch (e) {}
        }
        if (this.onListeningChange) this.onListeningChange(false);
    }

    updateMicButton(listening) {
        const micBtn = document.getElementById('btnVoiceToggle');
        if (micBtn) {
            micBtn.classList.toggle('listening', listening);
        }
    }

    setFeedback(msg) {
        const caption = document.getElementById('speechFeedbackText');
        if (caption) caption.textContent = msg;
    }

    speak(text, onStart, onEnd) {
        if (!this.synthesis) {
            if (onEnd) onEnd();
            return;
        }

        this.synthesis.cancel();

        // Remove markdown or bracket characters for clean speech
        const cleanText = text.replace(/[*_#`~[\]]/g, '').trim();
        const utterance = new SpeechSynthesisUtterance(cleanText);

        const hasChinese = /[\u4e00-\u9fa5]/.test(cleanText);
        if (hasChinese) {
            // Find a Chinese voice if available
            const zhVoice = this.availableVoices.find(v => 
                (v.lang && v.lang.toLowerCase().includes('zh')) || 
                v.name.includes('Chinese') || 
                v.name.includes('Xiaoxiao') || 
                v.name.includes('Huihui') || 
                v.name.includes('Yaoyao') || 
                v.name.includes('Kangkang')
            );
            if (zhVoice) {
                utterance.voice = zhVoice;
            }
            utterance.lang = 'zh-CN';
        } else if (this.selectedVoice) {
            utterance.voice = this.selectedVoice;
            utterance.lang = this.selectedVoice.lang || 'en-GB';
        }

        utterance.rate = this.config.voiceRate || 1.0;
        utterance.pitch = this.config.voicePitch || 1.0;

        utterance.onstart = () => {
            this.setFeedback('Transmitting vocal response...');
            if (onStart) onStart();
        };

        utterance.onend = () => {
            this.setFeedback('Vocal telemetry standing by...');
            if (onEnd) onEnd();
        };

        utterance.onerror = (e) => {
            console.warn('Speech synthesis error:', e);
            if (onEnd) onEnd();
        };

        this.synthesis.speak(utterance);
    }
}
