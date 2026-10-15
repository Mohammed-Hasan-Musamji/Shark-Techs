/**
 * ============================================================================
 * J.A.R.V.I.S. MAIN APP CONTROLLER & BOOTSTRAPPER (MVC Orchestrator)
 * Assembles Models, Views, and Controllers into an integrated system architecture
 * ============================================================================
 */

class AppController {
    constructor() {
        this.models = {};
        this.views = {};
        this.controllers = {};

        this.bootstrap();
    }

    bootstrap() {
        console.log('[MVC] Initializing J.A.R.V.I.S. Architecture...');

        // 1. Initialize Models (Data & State)
        this.models.config = new ConfigModel();
        this.models.directives = new DirectiveModel();
        this.models.telemetry = new TelemetryModel();
        this.models.conversation = new ConversationModel();
        this.models.agent = new AgentModel(
            this.models.config,
            this.models.directives,
            this.models.telemetry,
            this.models.conversation
        );

        // 2. Initialize Views (Presentation & DOM)
        this.views.audio = new AudioView(this.models.config);
        this.views.visualizer = new VisualizerView(this.models.config);
        this.views.speech = new SpeechView(this.models.config);
        this.views.hud = new HudView(this.models.config, this.models.telemetry);
        this.views.telemetry = new TelemetryView(this.models.telemetry);
        this.views.conversation = new ConversationView(this.models.conversation);
        this.views.directives = new DirectiveView(this.models.directives);
        this.views.settingsModal = new SettingsModalView(this.models.config);

        // 3. Initialize Controllers (Event Dispatch & Coordination)
        this.controllers.directives = new DirectiveController(
            this.models.directives,
            this.views.directives,
            this.views.audio,
            this.models.telemetry
        );

        this.controllers.telemetry = new TelemetryController(
            this.models.telemetry,
            this.models.config,
            this.views.hud,
            this.views.telemetry,
            this.views.audio
        );

        this.controllers.settings = new SettingsController(
            this.models.config,
            this.views.settingsModal,
            this.views.audio,
            this.models.telemetry
        );

        this.controllers.agent = new AgentController(
            this.models.agent,
            this.models.conversation,
            this.views.conversation,
            this.views.visualizer,
            this.views.speech,
            this.views.audio,
            this.models.telemetry,
            this.models.directives,
            this.models.config
        );

        // 4. Expose clean global namespace for console debugging and compatibility
        window.jarvis = this;
        window.jarvisAgent = this.models.agent;
        window.jarvisSpeech = this.views.speech;
        window.jarvisVisualizer = this.views.visualizer;
        window.jarvisSound = this.views.audio;
        window.jarvisApp = this;

        // 5. System startup telemetry
        this.models.telemetry.appendLog(`[SYSTEM] J.A.R.V.I.S. Mark 85 Core online. Architecture: MVC.`);
        const activeKey = this.models.config.getApiKey();
        if (activeKey) {
            this.models.telemetry.appendLog(`[AI CORE] ${this.models.config.provider.toUpperCase()} LPU connected (${this.models.config.getActiveModel()}).`);
        }

        // 6. Initial Atmospheric Scan
        setTimeout(() => {
            this.models.telemetry.fetchLiveWeather();
        }, 1200);

        console.log('J.A.R.V.I.S. Systems Online and Operational in Full MVC Architecture.');
    }
}
