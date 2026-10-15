/**
 * ============================================================================
 * J.A.R.V.I.S. DIRECTIVE MODEL (M - MVC)
 * Manages mission directives (tasks), completions, deletions, and tactical notes
 * ============================================================================
 */

class DirectiveModel {
    constructor() {
        this.subscribers = [];
        this.tasks = [];
        this.notes = localStorage.getItem('jarvis_notes') || '';
        this.loadTasks();
    }

    subscribe(callback) {
        this.subscribers.push(callback);
    }

    notify(action, payload) {
        this.subscribers.forEach(cb => cb(action, payload, this));
    }

    loadTasks() {
        const stored = localStorage.getItem('jarvis_tasks');
        if (stored) {
            try {
                this.tasks = JSON.parse(stored);
            } catch (e) {
                this.tasks = [];
            }
        } else {
            this.tasks = [
                { id: 1, text: 'Review Mark 85 telemetry calibration', completed: false, createdAt: Date.now() - 3600000 },
                { id: 2, text: 'Calibrate Arc Reactor vibranium core', completed: true, createdAt: Date.now() - 7200000 },
                { id: 3, text: 'Verify orbital defense satellite handshake', completed: false, createdAt: Date.now() - 10800000 }
            ];
            this.persistTasks();
        }
    }

    persistTasks() {
        localStorage.setItem('jarvis_tasks', JSON.stringify(this.tasks));
    }

    getTasks() {
        return [...this.tasks];
    }

    getPendingTasks() {
        return this.tasks.filter(t => !t.completed);
    }

    getPendingCount() {
        return this.getPendingTasks().length;
    }

    addTask(text) {
        const cleanText = (text || '').trim();
        if (!cleanText) return null;

        const task = {
            id: Date.now(),
            text: cleanText,
            completed: false,
            createdAt: Date.now()
        };
        this.tasks.unshift(task);
        this.persistTasks();
        this.notify('task_added', task);
        return task;
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.persistTasks();
            this.notify('task_toggled', task);
            return task;
        }
        return null;
    }

    deleteTask(id) {
        const target = this.tasks.find(t => t.id === id);
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.persistTasks();
        this.notify('task_deleted', target);
        return target;
    }

    clearTasks() {
        this.tasks = [];
        this.persistTasks();
        this.notify('tasks_cleared', null);
    }

    getNotes() {
        return this.notes;
    }

    saveNotes(text) {
        this.notes = text || '';
        localStorage.setItem('jarvis_notes', this.notes);
        this.notify('notes_saved', this.notes);
    }

    appendNote(text) {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const entry = `\n[${time}] ${text}`;
        this.notes = (this.notes ? this.notes + entry : entry.trim());
        localStorage.setItem('jarvis_notes', this.notes);
        this.notify('notes_appended', this.notes);
        return this.notes;
    }
}
