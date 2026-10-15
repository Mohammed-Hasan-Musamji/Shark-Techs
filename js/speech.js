/**
 * ============================================================================
 * J.A.R.V.I.S. VOICE & SPEECH SYNTHESIS ENGINE
 * Web Speech API Interface: SpeechRecognition & SpeechSynthesis
 * ============================================================================
 */

class JarvisSpeechEngine {
    constructor() {
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isListening = false;
        this.availableVoices = [];
        this.selectedVoice = null;
        this.speechRate = 1.0;
        this.speechPitch = 1.0;

        this.initRecognition();
        this.initVoices();
    }

    initRecognition() {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRec) {
            console.warn('SpeechRecognition API is not supported in this browser environment.');
            this.updateFeedback('Speech recognition requires Chrome, Edge, or a Web Speech API browser.');
            return;
        }

        try {
            this.recognition = new SpeechRec();
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';

            this.recognition.onstart = () => {
                this.isListening = true;
                if (window.jarvisVisualizer) window.jarvisVisualizer.setState('listening');
                if (window.jarvisSound) window.jarvisSound.playWakePing();
                
                const micBtn = document.getElementById('btnVoiceToggle');
                if (micBtn) micBtn.classList.add('listening');

                this.updateFeedback('JARVIS is listening... Speak your command.');
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
                    this.updateFeedback(`Heard: "${currentText}"`);
                    const cmdInput = document.getElementById('commandInput');
                    if (cmdInput && interimTranscript) {
                        cmdInput.value = currentText;
                    }
                }

                if (finalTranscript) {
                    const cleanTranscript = finalTranscript.trim();
                    const cmdInput = document.getElementById('commandInput');
                    if (cmdInput) cmdInput.value = cleanTranscript;
                    
                    if (window.jarvisAgent) {
                        window.jarvisAgent.handleCommand(cleanTranscript);
                    }
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
                this.updateFeedback(message);
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
                
                // Prioritize authentic British English voices for JARVIS
                let bestVoiceIndex = 0;
                this.availableVoices.forEach((v, index) => {
                    const opt = document.createElement('option');
                    opt.value = index;
                    opt.textContent = `${v.name} (${v.lang})`;

                    // Match UK / British / Jarvis style
                    const isBritish = v.lang.includes('en-GB') || v.name.toLowerCase().includes('british') || v.name.toLowerCase().includes('daniel');
                    if (isBritish && bestVoiceIndex === 0) {
                        bestVoiceIndex = index;
                    }
                    voiceSelect.appendChild(opt);
                });

                voiceSelect.selectedIndex = bestVoiceIndex;
                this.selectedVoice = this.availableVoices[bestVoiceIndex];
            }
        };

        populate();
        if (this.synthesis.onvoiceschanged !== undefined) {
            this.synthesis.onvoiceschanged = populate;
        }
    }

    toggleListening() {
        if (!this.recognition) {
            this.updateFeedback('Speech recognition is not supported in this browser.');
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
            // Cancel any ongoing speech synthesis first
            if (this.synthesis) {
                this.synthesis.cancel();
            }
            this.recognition.start();
        } catch (e) {
            console.warn('Recognition start caught error:', e);
        }
    }

    stopListening() {
        this.isListening = false;
        const micBtn = document.getElementById('btnVoiceToggle');
        if (micBtn) micBtn.classList.remove('listening');

        if (this.recognition) {
            try {
                this.recognition.stop();
            } catch (e) {}
        }

        if (window.jarvisVisualizer && window.jarvisVisualizer.state === 'listening') {
            window.jarvisVisualizer.setState('standby');
        }
    }

    /**
     * Synthesize Jarvis's spoken vocal response
     */
    speak(text, onComplete) {
        if (!this.synthesis) {
            if (onComplete) onComplete();
            return;
        }

        // Cancel previous utterances
        this.synthesis.cancel();

        // Strip markdown stars or special tags for clean pronunciation
        const cleanText = text.replace(/[*_#`~[\]]/g, '').trim();

        const utterance = new SpeechSynthesisUtterance(cleanText);
        if (this.selectedVoice) {
            utterance.voice = this.selectedVoice;
        }
        utterance.rate = this.speechRate;
        utterance.pitch = this.speechPitch;

        utterance.onstart = () => {
            if (window.jarvisVisualizer) window.jarvisVisualizer.setState('speaking');
            this.updateFeedback(`Transmitting vocal response...`);
        };

        utterance.onend = () => {
            if (window.jarvisVisualizer) window.jarvisVisualizer.setState('standby');
            this.updateFeedback(`Vocal telemetry standing by...`);
            if (onComplete) onComplete();
        };

        utterance.onerror = (e) => {
            console.warn('Speech synthesis error:', e);
            if (window.jarvisVisualizer) window.jarvisVisualizer.setState('standby');
            if (onComplete) onComplete();
        };

        this.synthesis.speak(utterance);
    }

    updateFeedback(msg) {
        const caption = document.getElementById('speechFeedbackText');
        if (caption) {
            caption.textContent = msg;
        }
    }
}

// Global Speech Engine Instance
window.jarvisSpeech = new JarvisSpeechEngine();
