/**
 * ============================================================================
 * J.A.R.V.I.S. DIRECTIVE CONTROLLER (C - MVC)
 * Coordinates user actions on Mission Directives (tasks) & Tactical Notes
 * ============================================================================
 */

class DirectiveController {
    constructor(directiveModel, directiveView, audioView, telemetryModel) {
        this.directives = directiveModel;
        this.view = directiveView;
        this.audio = audioView;
        this.telemetry = telemetryModel;

        this.initEventListeners();
    }

    initEventListeners() {
        // 1. Task Form Submission
        const taskForm = document.getElementById('taskForm');
        const taskInput = document.getElementById('taskInput');

        if (taskForm && taskInput) {
            taskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const text = taskInput.value.trim();
                if (text) {
                    this.directives.addTask(text);
                    taskInput.value = '';
                    this.audio.playClick();
                    this.telemetry.appendLog(`[DIRECTIVE] Added objective: "${text}"`);
                }
            });
        }

        // 2. View Callbacks for Toggle & Delete
        this.view.onToggleTask = (id) => {
            const task = this.directives.toggleTask(id);
            if (task) {
                this.audio.playClick();
                this.telemetry.appendLog(`[DIRECTIVE] Objective status toggled: "${task.text}" (${task.completed ? 'COMPLETED' : 'PENDING'})`);
            }
        };

        this.view.onDeleteTask = (id) => {
            const removed = this.directives.deleteTask(id);
            if (removed) {
                this.audio.playClick();
                this.telemetry.appendLog(`[DIRECTIVE] Objective deleted: "${removed.text}"`);
            }
        };

        // 3. Tactical Notes Save Button
        const btnSaveNotes = document.getElementById('btnSaveNotes');
        const notesArea = document.getElementById('notesArea');

        if (btnSaveNotes && notesArea) {
            btnSaveNotes.addEventListener('click', () => {
                this.directives.saveNotes(notesArea.value);
                this.audio.playProcessComplete();
                this.telemetry.appendLog('[NOTES] Tactical scratchpad updated and encrypted.');
            });
        }
    }
}
