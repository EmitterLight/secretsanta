// Данные приложения
let participants = [];

// Имя в дательном падеже для фразы «дарит кому?»
// Учитываем типичные окончания (мужские и женские).
function nameToDative(name) {
    if (!name || name.length === 0) return name;
    const n = name.trim();
    if (n.length === 0) return name;
    // -ия → -ии (Мария, Юлия, Лидия)
    if (n.endsWith('ия')) return n.slice(0, -2) + 'ии';
    // -ий → -ию (Дмитрий, Виталий, Евгений)
    if (n.endsWith('ий')) return n.slice(0, -2) + 'ию';
    // -й → -ю (Андрей, Сергей, Николай, Алексей)
    if (n.endsWith('й')) return n.slice(0, -1) + 'ю';
    // -я → -е (Надя, Ваня, Оля, Аня)
    if (n.endsWith('я')) return n.slice(0, -1) + 'е';
    // -а → -е (Саша, Дима, Марина, Наташа, Светлана)
    if (n.endsWith('а')) return n.slice(0, -1) + 'е';
    // -ь → -ю (Игорь, Лев → Льву)
    if (n.endsWith('ь')) return n.slice(0, -1) + 'ю';
    // согласная: + у (Олег, Пётр, Александр, Максим, Иван)
    return n + 'у';
}
let participantNumbers = {};
let pairs = [];
let currentParticipantIndex = 0; // больше не используется для логики, оставлен для совместимости
let takenNumbers = new Set();
let participantOrder = [];
let currentParticipantName = null; // текущий участник, который делает выбор

// Добавление участника
function addParticipant() {
    const input = document.getElementById('name-input');
    const name = input.value.trim();
    const errorDiv = document.getElementById('input-error');
    const errorText = document.getElementById('error-text');

    // Валидация
    if (!name) {
        errorText.textContent = 'Введите имя участника';
        errorDiv.classList.add('show');
        return;
    }

    if (participants.includes(name)) {
        errorText.textContent = 'Участник с таким именем уже добавлен';
        errorDiv.classList.add('show');
        return;
    }

    // Добавление
    participants.push(name);
    input.value = '';
    input.focus();
    errorDiv.classList.remove('show');

    updateParticipantsList();
}

// Обновление списка участников
function updateParticipantsList() {
    const container = document.getElementById('participants-container');
    const list = document.getElementById('participants-list');
    const count = document.getElementById('participants-count');
    const startBtn = document.getElementById('start-distribution-btn');

    if (participants.length === 0) {
        container.classList.add('hidden');
        startBtn.classList.add('hidden');
        return;
    }

    container.classList.remove('hidden');
    count.textContent = participants.length;

    list.innerHTML = participants.map((name, index) => `
        <div class="participant-tag">
            ${name}
            <span class="remove" onclick="removeParticipant(${index})" title="Удалить">×</span>
        </div>
    `).join('');

    // Показываем кнопку начала, если участников >= 4
    if (participants.length >= 4) {
        startBtn.classList.remove('hidden');
    } else {
        startBtn.classList.add('hidden');
    }
}

// Удаление участника
function removeParticipant(index) {
    participants.splice(index, 1);
    updateParticipantsList();
}

// Начать распределение номеров
function startDistribution() {
    if (participants.length < 4) {
        showNotification('Нужно минимум 4 участника!', 'error');
        return;
    }

    if (participants.length % 2 !== 0) {
        showNotification('Нужно чётное количество участников!', 'error');
        return;
    }

    // Случайное распределение номеров
    const numbers = [];
    for (let i = 1; i <= participants.length; i++) {
        numbers.push(i);
    }

    // Перемешиваем (Fisher-Yates)
    for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }

    // Присваиваем номера
    participantNumbers = {};
    participants.forEach((name, index) => {
        participantNumbers[name] = numbers[index];
    });

    // Отображаем
    const grid = document.getElementById('numbers-grid');
    grid.innerHTML = participants.map(name => `
        <div class="number-card">
            <div class="name">${name}</div>
            <div class="number">${participantNumbers[name]}</div>
        </div>
    `).join('');

    // Переходим к следующей секции
    showSection('section-distribution');
}

// Начать формирование пар
function startPairing() {
    // Создаем случайный порядок выбора
    participantOrder = [...participants];
    for (let i = participantOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [participantOrder[i], participantOrder[j]] = [participantOrder[j], participantOrder[i]];
    }

    currentParticipantIndex = 0;
    takenNumbers.clear();
    pairs = [];

    document.getElementById('max-number').textContent = participants.length;
    
    // по умолчанию первым выбирает первый в случайном порядке
    currentParticipantName = participantOrder[0] || null;

    updatePairingInterface();
    showSection('section-pairing');
}

// Обновление интерфейса формирования пар
function updatePairingInterface() {
    // если по каким-то причинам текущий не выбран (например, после сброса),
    // пробуем найти первого участника без пары
    if (!currentParticipantName) {
        const firstWithoutPair = participants.find(
            name => !pairs.some(p => p.from === name)
        );
        currentParticipantName = firstWithoutPair || null;
    }

    const currentName = currentParticipantName;
    
    if (!currentName) {
        // если вообще нет доступных участников (например, игра закончена)
        document.getElementById('current-name').textContent = '—';
        document.getElementById('current-number').textContent = '—';
        return;
    }
    
    document.getElementById('current-name').textContent = currentName;
    document.getElementById('current-number').textContent = participantNumbers[currentName];
    
    // Обновляем список занятых номеров
    const takenDiv = document.getElementById('taken-numbers');
    const takenList = document.getElementById('taken-numbers-list');
    
    if (takenNumbers.size > 0) {
        takenDiv.classList.remove('hidden');
        takenList.innerHTML = Array.from(takenNumbers).sort((a, b) => a - b).map(num => 
            `<span class="taken-number-tag">${num}</span>`
        ).join('');
    } else {
        takenDiv.classList.add('hidden');
    }

    // Фокус на поле ввода
    document.getElementById('pair-input').focus();

    updateParticipantsStatus();
}

// Обновление статуса участников
function updateParticipantsStatus() {
    const container = document.getElementById('participants-status');
    
    container.innerHTML = participants.map(name => {
        const number = participantNumbers[name];
        const isCurrent = currentParticipantName === name;
        const pair = pairs.find(p => p.from === name);
        
        let statusClass = 'waiting';
        let statusText = 'Ожидает выбора';
        let pairInfo = '';
        let indicatorClass = 'waiting';
        
        if (isCurrent) {
            statusClass = 'selecting';
            statusText = 'Сейчас выбирает';
            indicatorClass = 'selecting';
        } else if (pair) {
            statusClass = 'paired';
            statusText = 'Пара сформирована';
            indicatorClass = 'paired';
            const partnerName = Object.keys(participantNumbers).find(
                n => participantNumbers[n] === pair.to
            );
            pairInfo = `<div class="pair-info">🎁 Дарит: ${nameToDative(partnerName)}</div>`;
        }
        
        return `
            <div class="status-card ${statusClass}" data-name="${name}">
                <div class="participant-name">${name}</div>
                <div class="participant-number">№ ${number}</div>
                <div class="status">
                    <span class="status-indicator ${indicatorClass}"></span>
                    ${statusText}
                </div>
                ${pairInfo}
            </div>
        `;
    }).join('');
}

// Сделать выбор пары
function makePair() {
    const input = document.getElementById('pair-input');
    const errorDiv = document.getElementById('pairing-error');
    const errorText = document.getElementById('pairing-error-text');
    const selectedNumber = parseInt(input.value, 10);
    input.value = ''; // всегда очищаем поле после нажатия (и при ошибке, и при успехе)
    
    // проверяем, выбран ли вообще участник
    if (!currentParticipantName) {
        errorText.textContent = 'Сначала выберите участника, кликнув по его карточке.';
        errorDiv.classList.add('show');
        return;
    }

    const currentName = currentParticipantName;
    const currentNumber = participantNumbers[currentName];

    // Проверка: есть ли у участника доступные номера
    const availableNumbers = [];
    for (let i = 1; i <= participants.length; i++) {
        if (i !== currentNumber && !takenNumbers.has(i)) {
            availableNumbers.push(i);
        }
    }
    
    if (availableNumbers.length === 0) {
        errorText.textContent = 'Ошибка: для ' + currentName + ' не осталось доступных номеров! Все номера кроме собственного уже заняты. Начните заново.';
        errorDiv.classList.add('show');
        return;
    }

    // Валидация
    if (!selectedNumber || selectedNumber < 1 || selectedNumber > participants.length) {
        errorText.textContent = `Введите число от 1 до ${participants.length}`;
        errorDiv.classList.add('show');
        return;
    }

    if (selectedNumber === currentNumber) {
        errorText.textContent = 'Нельзя выбрать свой номер!';
        errorDiv.classList.add('show');
        return;
    }

    if (takenNumbers.has(selectedNumber)) {
        errorText.textContent = 'Этот номер уже занят!';
        errorDiv.classList.add('show');
        return;
    }
    
    // Проверка: не приведет ли этот выбор к тупику для оставшихся участников
    const remainingParticipants = participants.filter(name => 
        name !== currentName && !pairs.some(p => p.from === name)
    );
    const simulatedTakenNumbers = new Set([...takenNumbers, selectedNumber]);
    
    for (const remainingName of remainingParticipants) {
        const remainingNumber = participantNumbers[remainingName];
        let hasValidChoice = false;
        
        for (let i = 1; i <= participants.length; i++) {
            if (i !== remainingNumber && !simulatedTakenNumbers.has(i)) {
                hasValidChoice = true;
                break;
            }
        }
        
        if (!hasValidChoice) {
            errorText.textContent = `Нельзя выбрать ${selectedNumber}! Это оставит ${remainingName} без вариантов. Выберите другой номер.`;
            errorDiv.classList.add('show');
            return;
        }
    }

    // Сохраняем пару
    pairs.push({
        from: currentName,
        fromNumber: currentNumber,
        to: selectedNumber
    });
    takenNumbers.add(selectedNumber);

    errorDiv.classList.remove('show');

    // после выбора сбрасываем текущего участника,
    // чтобы следующий был выбран кликом по карточке
    currentParticipantName = null;

    // Проверяем, сколько участников ещё без пары
    const remainingAfter = participants.filter(name => 
        !pairs.some(p => p.from === name)
    );

    if (remainingAfter.length === 1) {
        // Автоматически назначаем последнему участнику оставшийся номер
        const lastParticipantName = remainingAfter[0];
        const lastParticipantNumber = participantNumbers[lastParticipantName];
        
        // Находим последний свободный номер
        let lastAvailableNumber = null;
        for (let i = 1; i <= participants.length; i++) {
            if (i !== lastParticipantNumber && !takenNumbers.has(i)) {
                lastAvailableNumber = i;
                break;
            }
        }
        
        if (lastAvailableNumber !== null) {
            // Автоматически создаем пару для последнего участника
            pairs.push({
                from: lastParticipantName,
                fromNumber: lastParticipantNumber,
                to: lastAvailableNumber
            });
            takenNumbers.add(lastAvailableNumber);
            
            // Показываем уведомление об автоматическом назначении
            showNotification(`${lastParticipantName} автоматически получает номер ${lastAvailableNumber} (последний свободный)`, 'success');
            
            // Переходим к результатам
            createConfetti();
            setTimeout(showResults, 800);
            return;
        }
    }

    // Если все уже с парами – показываем результат
    if (remainingAfter.length === 0) {
        createConfetti();
        setTimeout(showResults, 500);
        return;
    }

    // Просто обновляем интерфейс (ожидание выбора следующего участника кликом)
    updatePairingInterface();
}

// Создать конфетти
function createConfetti() {
    const colors = ['#6366f1', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b'];
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 4000);
        }, i * 30);
    }
}

// Обработка Enter
function handleEnter(event) {
    if (event.key === 'Enter') {
        makePair();
    }
}

// Показать результаты
function showResults() {
    const list = document.getElementById('pairs-list');

    list.innerHTML = pairs.map(pair => {
        const partnerName = Object.keys(participantNumbers).find(
            n => participantNumbers[n] === pair.to
        );
        return `
            <div class="pair-item">
                <div>
                    <span class="pair-names">${pair.from}</span>
                    <span class="pair-arrow">🎁 →</span>
                    <span class="pair-names">${nameToDative(partnerName)}</span>
                </div>
                <span class="pair-numbers">№${pair.fromNumber} → №${pair.to}</span>
            </div>
        `;
    }).join('');

    showSection('section-results');
}

// Копировать результаты
function copyResults() {
    const text = '🎅 Результаты "Тайный Санта":\n\n' +
        pairs.map(pair => {
            const partnerName = Object.keys(participantNumbers).find(
                n => participantNumbers[n] === pair.to
            );
            return `${pair.from} дарит 🎁 ${nameToDative(partnerName)}`;
        }).join('\n');

    navigator.clipboard.writeText(text).then(() => {
        showNotification('Результаты скопированы!', 'success');
    }).catch(err => {
        showNotification('Ошибка копирования', 'error');
    });
}

// Сохранить в файл
function saveToFile() {
    const text = '🎅 Результаты "Тайный Санта"\n' +
        '═'.repeat(40) + '\n\n' +
        pairs.map(pair => {
            const partnerName = Object.keys(participantNumbers).find(
                n => participantNumbers[n] === pair.to
            );
            return `${pair.from} дарит 🎁 ${nameToDative(partnerName)}`;
        }).join('\n') + '\n\n' +
        '═'.repeat(40) + '\n' +
        'Сделано с 💖' + '\n\n';

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tajnaya-cetkin-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification('Файл сохранен!', 'success');
}

// Показать уведомление
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 20px 30px;
        background: ${type === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)'};
        color: white;
        border-radius: 16px;
        font-weight: 600;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideInRight 0.4s ease-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.4s ease-out';
        setTimeout(() => notification.remove(), 400);
    }, 3000);
}

// Начать заново — показать модальное окно подтверждения
function resetAll() {
    const modal = document.getElementById('reset-modal');
    if (modal) {
        modal.classList.add('visible');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', onResetModalKeydown);
    }
}

function closeResetModal() {
    const modal = document.getElementById('reset-modal');
    if (modal) {
        modal.classList.remove('visible');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        document.removeEventListener('keydown', onResetModalKeydown);
    }
}

function onResetModalKeydown(e) {
    if (e.key === 'Escape') closeResetModal();
}

function confirmReset() {
    closeResetModal();
    participants = [];
    participantNumbers = {};
    pairs = [];
    currentParticipantIndex = 0;
    takenNumbers.clear();
    participantOrder = [];
    currentParticipantName = null;

    document.getElementById('name-input').value = '';
    document.getElementById('input-error').classList.remove('show');
    updateParticipantsList();

    showSection('section-input');
}

// Показать секцию
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Инициализация
document.getElementById('name-input').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        addParticipant();
    }
});

// Клик по карточке участника в блоке статуса
document.getElementById('participants-status').addEventListener('click', function(event) {
    const card = event.target.closest('.status-card');
    if (!card) return;

    const name = card.dataset.name;
    if (!name) return;

    const alreadyPaired = pairs.some(p => p.from === name);
    if (alreadyPaired) {
        showNotification(`Для участника ${name} пара уже назначена`, 'error');
        return;
    }

    currentParticipantName = name;
    updatePairingInterface();
});
