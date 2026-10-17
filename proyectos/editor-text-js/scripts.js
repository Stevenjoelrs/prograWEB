const editor = document.getElementById('editor');
const newSlideBtn = document.getElementById('new-slide');
const clearBtn = document.getElementById('clear-btn');
const slideCounter = document.getElementById('slide-counter');
const slidesList = document.getElementById('slides-list');
let slides = [''];
let currentIndex = 0;
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
            slides = parseSlides(getRequest.result.text);
        }
        if (slides.length === 0) {
            slides = [''];
        }
        renderList();
        selectSlide(0);
    };
}

function parseSlides(masterHTML) {
    const container = document.createElement('div');
    container.innerHTML = masterHTML || '';
    const parsed = [];
    let group = document.createElement('div');
    for (const node of Array.from(container.childNodes)) {
        if (node.nodeName === 'HR') {
            parsed.push(group.innerHTML);
            group = document.createElement('div');
        } else {
            group.appendChild(node);
        }
    }
    parsed.push(group.innerHTML);
    return parsed;
}

function serializeSlides() {
    return slides.join('<hr>');
}

function saveContent(text) {
    if (!db) return;
    const transaction = db.transaction(['documents'], 'readwrite');
    transaction.objectStore('documents').put({ id: 1, text });
}

function saveAll() {
    saveContent(serializeSlides());
}

function renderList() {
    slidesList.innerHTML = '';
    slides.forEach((html, i) => {
        const li = document.createElement('li');
        li.dataset.index = String(i);
        if (i === currentIndex) {
            li.classList.add('active');
        }

        const thumb = document.createElement('div');
        thumb.className = 'slide-thumb';
        thumb.innerHTML = html;

        const number = document.createElement('span');
        number.className = 'slide-number';
        number.textContent = String(i + 1);

        li.appendChild(thumb);
        li.appendChild(number);
        slidesList.appendChild(li);
    });
}

function updateThumb(i) {
    const li = slidesList.querySelector(`li[data-index="${i}"]`);
    if (li) {
        li.querySelector('.slide-thumb').innerHTML = slides[i];
    }
}

function updateCounter() {
    slideCounter.textContent = `Diapositiva ${currentIndex + 1} de ${slides.length}`;
}

function selectSlide(i) {
    if (i < 0 || i >= slides.length) return;
    currentIndex = i;
    editor.innerHTML = slides[i];
    for (const li of slidesList.children) {
        li.classList.toggle('active', Number(li.dataset.index) === i);
    }
    updateCounter();
}

function addSlide() {
    slides.splice(currentIndex + 1, 0, '');
    renderList();
    selectSlide(currentIndex + 1);
    saveAll();
    editor.focus();
}

function deleteSlide() {
    if (!confirm('¿Borrar esta diapositiva?')) return;
    if (slides.length === 1) {
        slides = [''];
        currentIndex = 0;
    } else {
        slides.splice(currentIndex, 1);
        if (currentIndex >= slides.length) {
            currentIndex = slides.length - 1;
        }
    }
    renderList();
    selectSlide(currentIndex);
    saveAll();
    editor.focus();
}

slidesList.addEventListener('click', (event) => {
    const li = event.target.closest('li[data-index]');
    if (!li) return;
    selectSlide(Number(li.dataset.index));
});

newSlideBtn.addEventListener('click', addSlide);
clearBtn.addEventListener('click', deleteSlide);

editor.addEventListener('input', () => {
    slides[currentIndex] = editor.innerHTML;
    updateThumb(currentIndex);
    saveAll();
});

renderList();
selectSlide(0);
