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

        // Callback hooks for Controller
        this.onSpeechResult = null; // (finalTranscript) => {}
        this.onListeningChange = null; // (isListening) => {}

        this.initRecognition();
        this.initVoices();

        // Subscribe to config changes for rate, pitch & voice index
        this.config.subscribe((key) => {
            if (key === 'voice_preferences_changed' || key === 'reset_defaults') {
                this.applyConfigPreferences();
            }
        });
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
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';

            this.recognition.onstart = () => {
                this.isListening = true;
                this.updateMicButton(true);
                this.setFeedback('JARVIS is listening... Speak your command.');
                if (this.onListeningChange) this.onListeningChange(true);
            };

            this.recognition.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                const currentText = finalTranscript || interimTranscript;
                if (currentText) {
                    this.setFeedback(`Heard: "${currentText}"`);
                    const cmdInput = document.getElementById('commandInput');
                    if (cmdInput && interimTranscript) {
                        cmdInput.value = currentText;
                    }
                }

                if (finalTranscript) {
                    const clean = finalTranscript.trim();
                    const cmdInput = document.getElementById('commandInput');
                    if (cmdInput) cmdInput.value = clean;
                    if (this.onSpeechResult) this.onSpeechResult(clean);
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
                this.stopListening();
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
            this.stopListening();
            return false;
        } else {
            this.startListening();
            return true;
        }
    }

    startListening() {
        if (!this.recognition) return;
        try {
            if (this.synthesis) this.synthesis.cancel();
            this.recognition.start();
        } catch (e) {
            console.warn('Recognition start caught error:', e);
        }
    }

    stopListening() {
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

        if (this.selectedVoice) {
            utterance.voice = this.selectedVoice;
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
