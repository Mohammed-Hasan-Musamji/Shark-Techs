/**
 * ============================================================================
 * J.A.R.V.I.S. DIRECTIVE VIEW (V - MVC)
 * Mission Directives List, Task Item Checkboxes, Deletion & Tactical Scratchpad
 * ============================================================================
 */

class DirectiveView {
    constructor(directiveModel) {
        this.directives = directiveModel;

        this.listEl = document.getElementById('taskList');
        this.counterEl = document.getElementById('taskCount');
        this.notesArea = document.getElementById('notesArea');

        // Callbacks for Controller
        this.onToggleTask = null; // (id) => {}
        this.onDeleteTask = null; // (id) => {}

        // Initial render
        this.renderTasks(this.directives.getTasks());
        this.renderNotes(this.directives.getNotes());

        // Subscribe to DirectiveModel
        this.directives.subscribe((action) => {
            if (action.startsWith('task_') || action === 'tasks_cleared') {
                this.renderTasks(this.directives.getTasks());
            }
            if (action.startsWith('notes_')) {
                this.renderNotes(this.directives.getNotes());
            }
        });
    }

    renderTasks(tasks) {
        if (!this.listEl) return;
        this.listEl.innerHTML = '';

        const pendingCount = tasks.filter(t => !t.completed).length;
        if (this.counterEl) {
            this.counterEl.textContent = `${pendingCount} PENDING`;
        }

        tasks.forEach(t => {
            const li = document.createElement('li');
            li.className = `task-item ${t.completed ? 'completed' : ''}`;
            li.innerHTML = `
                <span class="task-text">${this.escapeHTML(t.text)}</span>
                <button class="task-delete" title="Delete Directive" data-id="${t.id}">&times;</button>
            `;

            li.querySelector('.task-text').addEventListener('click', () => {
                if (this.onToggleTask) this.onToggleTask(t.id);
            });

            li.querySelector('.task-delete').addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.onDeleteTask) this.onDeleteTask(t.id);
            });

            this.listEl.appendChild(li);
        });
    }

    renderNotes(notesText) {
        if (this.notesArea) {
            this.notesArea.value = notesText || '';
        }
    }

    escapeHTML(str) {
        return (str || '').replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }
}
