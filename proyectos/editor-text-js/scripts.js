const editor = document.getElementById('editor');
let db;

const request = indexedDB.open('TextEditorDB', 1);

request.onupgradeneeded = (event) => {
    db = event.target.result;
    if (!db.objectStoreNames.contains('documents')) {
        db.createObjectStore('documents', { keyPath: 'id' });
    }
};

request.onsuccess = (event) => {
    db = event.target.result;
    loadContent();
};

function loadContent() {
    const transaction = db.transaction(['documents'], 'readonly');
    const store = transaction.objectStore('documents');
    const getRequest = store.get(1);

    getRequest.onsuccess = () => {
        if (getRequest.result) {
            editor.innerHTML = getRequest.result.text;
        }
    };
}

editor.addEventListener('input', () => {
    if (db) {
        const transaction = db.transaction(['documents'], 'readwrite');
        const store = transaction.objectStore('documents');
        store.put({ id: 1, text: editor.innerHTML });
    }
});