document.addEventListener('DOMContentLoaded', () => {
    const notesList = document.getElementById('notes-list');
    const noteInput = document.getElementById('note-input');
    const addNoteBtn = document.getElementById('add-note-btn');
    const offlineStatus = document.getElementById('offline-status');

    let notes = JSON.parse(localStorage.getItem('notes')) || [];
    notes = notes.map(note => note.id ? note : {...note, id: Date.now()});

    function updateOnlineStatus() {
        const isOffline = !navigator.onLine;
        offlineStatus.classList.toggle('visible', isOffline);
    }

    function checkRealOfflineStatus() {
        fetch('/ping.json', {
            method: 'GET',
            cache: 'no-store',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                offlineStatus.classList.remove('visible');
                console.log('[✅] Сервер доступен');
            } else {
                throw new Error('Сервер вернул ошибку');
            }
        })
        .catch(error => {
            offlineStatus.classList.add('visible');
            console.warn('[⚠️] Нет связи с сервером:', error.message);
        });
    } 

    updateOnlineStatus();
    checkRealOfflineStatus();

    window.addEventListener('online', () => {
        updateOnlineStatus();
        checkRealOfflineStatus();
    });

    window.addEventListener('offline', () => {
        updateOnlineStatus();
        offlineStatus.classList.add('visible');
    }); 

    function renderNotes() {
        notesList.innerHTML = '';
        notes.forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.className = 'note-item';
            noteElement.innerHTML = `
                <div class="note-text">${note.text}</div>
                <button class="delete-btn" data-id="${note.id}">Удалить</button>
            `;
            notesList.appendChild(noteElement);
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                deleteNote(parseInt(e.target.dataset.id));
            });
        });

        document.querySelectorAll('.note-text').forEach(text => {
            text.addEventListener('click', (e) => {
                editNote(parseInt(e.target.nextElementSibling.dataset.id));
            });
        });
    }

    addNoteBtn.addEventListener('click', () => {
        const text = noteInput.value.trim();
        if (text) {
            notes.push({ id: Date.now(), text });
            noteInput.value = '';
            saveNotes();
            renderNotes();
        }
    });

    function deleteNote(id) {
        notes = notes.filter(note => note.id !== id);
        saveNotes();
        renderNotes();
    }

    function editNote(id) {
        const note = notes.find(note => note.id === id);
        const noteElement = [...notesList.children].find(el => 
            parseInt(el.querySelector('.delete-btn').dataset.id) === id
        );
        
        const input = document.createElement('textarea');
        input.value = note.text;
        input.style.width = '100%';
        input.style.marginBottom = '10px';
        
        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Сохранить';
        saveBtn.className = 'save-btn';
        
        noteElement.innerHTML = '';
        noteElement.append(input, saveBtn);
        
        saveBtn.addEventListener('click', () => {
            note.text = input.value.trim();
            saveNotes();
            renderNotes();
        });
    }

    function saveNotes() {
        localStorage.setItem('notes', JSON.stringify(notes));
    }

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .catch(error => console.log('Ошибка регистрации SW:', error));
    }

    renderNotes();
});