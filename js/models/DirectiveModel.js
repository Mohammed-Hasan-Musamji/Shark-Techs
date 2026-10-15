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
        let needsReset = false;
        if (stored) {
            try {
                this.tasks = JSON.parse(stored);
                const hasStarkLore = Array.isArray(this.tasks) && this.tasks.some(t => 
                    /mark 85|vibranium|arc reactor|orbital defense|iron legion|stark/i.test(t.text || '')
                );
                if (hasStarkLore || !Array.isArray(this.tasks) || this.tasks.length === 0) {
                    needsReset = true;
                }
            } catch (e) {
                needsReset = true;
            }
        } else {
            needsReset = true;
        }

        if (needsReset) {
            this.tasks = [
                { id: 1, text: 'Configure Groq API key in .env or Settings modal', completed: true, createdAt: Date.now() - 3600000 },
                { id: 2, text: 'Verify live weather telemetry for current location', completed: true, createdAt: Date.now() - 7200000 },
                { id: 3, text: 'Prompt Jarvis with openai/gpt-oss-120b for project tasks', completed: false, createdAt: Date.now() - 10800000 },
                { id: 4, text: 'Review real-time CPU and network latency diagnostics', completed: false, createdAt: Date.now() - 14400000 }
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
