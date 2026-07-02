function getFormattedDate() {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    return `${dd}.${mm}.${today.getFullYear()}`;
}

const systemQuests = [
    { text: "⚔️ [Квест на выносливость] Сделать 30 отжиманий прямо сейчас.", reward: 3 },
    { text: "🧠 [Квест на Интеллект] Почитать книгу или статью по саморазвитию 15 минут.", reward: 2 },
    { text: "💧 [Квест на очищение] Выпить стакан чистой воды и убрать рабочий стол.", reward: 1 },
    { text: "🏃‍♂️ [Разведка территории] Выйти на улицу и прогуляться быстрым шагом 20 минут.", reward: 3 },
    { text: "🧘‍♂️ [Ментальный блок] Провести 5 минут в полной тишине без телефона.", reward: 2 },
    { text: "🎯 [Прорыв] Закрыть свой самый сложный личный квест из списка сегодня.", reward: 3 }
];

// Уровневая система (Макс EXP для каждого ранга)
const RANKS = [
    { name: "🌱 Изгой Школы", maxExp: 15 },
    { name: "⚡ Боец Банды (Работяга)", maxExp: 50 },
    { name: "🔥 Глава Крю (Crew Head)", maxExp: 120 },
    { name: "👑 Легенда 0-го Поколения", maxExp: 9999 }
];

// Элементы DOM
const taskInput = document.getElementById('task-input');
const taskDifficulty = document.getElementById('task-difficulty');
const addBtn = document.getElementById('add-btn');
const taskList = document.getElementById('task-list');
const totalStarsSpan = document.getElementById('total-stars');
const walletStarsSpan = document.getElementById('wallet-stars');
const userRank = document.getElementById('user-rank');
const lvlBarFill = document.getElementById('lvl-bar-fill');
const lvlBarText = document.getElementById('lvl-bar-text');
const systemQuestText = document.getElementById('system-quest-text');
const questRewardText = document.getElementById('quest-reward-text');
const getQuestBtn = document.getElementById('get-quest-btn');
const completeQuestBtn = document.getElementById('complete-quest-btn');
const dayResult = document.getElementById('day-result');
const historyCalendar = document.getElementById('history-calendar');
const inventoryList = document.getElementById('inventory-list');
const systemSound = document.getElementById('system-sound');

// База данных LocalStorage
let lastSavedDate = localStorage.getItem('lastSavedDate') || getFormattedDate();
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let totalStars = parseInt(localStorage.getItem('totalStars')) || 0; // За сегодня
let walletStars = parseInt(localStorage.getItem('walletStars')) || 0; // Кошелек (валюта)
let currentMood = localStorage.getItem('currentMood') || 'Не проверено 😶';
let historyLog = JSON.parse(localStorage.getItem('historyLog')) || [];
let activeSystemQuest = JSON.parse(localStorage.getItem('activeSystemQuest')) || null;
let inventory = JSON.parse(localStorage.getItem('inventory')) || [];

function playSound() {
    systemSound.currentTime = 0;
    systemSound.play().catch(e => console.log("Взаимодействуйте с экраном для звуков"));
}

function checkDayChange() {
    const todayStr = getFormattedDate();
    if (lastSavedDate !== todayStr) {
        if (tasks.length > 0 || totalStars > 0) {
            historyLog.push({ date: lastSavedDate, stars: totalStars, mood: currentMood });
        }
        tasks = [];
        totalStars = 0;
        currentMood = 'Не проверено 😶';
        activeSystemQuest = null;
        lastSavedDate = todayStr;
        localStorage.setItem('lastSavedDate', lastSavedDate);
        localStorage.setItem('currentMood', currentMood);
        localStorage.removeItem('activeSystemQuest');
        saveData();
    }
}

checkDayChange();
updateUI();

addBtn.addEventListener('click', () => {
    const text = taskInput.value.trim();
    if (text === '') return;
    tasks.push({ id: Date.now(), text: text, stars: parseInt(taskDifficulty.value), completed: false });
    saveData();
    updateUI();
    taskInput.value = '';
});

window.generateSystemQuest = function() {
    if (activeSystemQuest) return;
    playSound();
    const randomQuest = systemQuests[Math.floor(Math.random() * systemQuests.length)];
    activeSystemQuest = { ...randomQuest, completed: false };
    localStorage.setItem('activeSystemQuest', JSON.stringify(activeSystemQuest));
    updateUI();
};

window.completeSystemQuest = function() {
    if (!activeSystemQuest || activeSystemQuest.completed) return;
    playSound();
    totalStars += activeSystemQuest.reward;
    walletStars += activeSystemQuest.reward; // Добавляем в кошелек
    activeSystemQuest.completed = true;
    localStorage.setItem('activeSystemQuest', JSON.stringify(activeSystemQuest));
    saveData();
    updateUI();
};

window.toggleTask = function(id) {
    playSound();
    tasks = tasks.map(task => {
        if (task.id === id) {
            task.completed = !task.completed;
            const diff = task.completed ? task.stars : -task.stars;
            totalStars += diff;
            walletStars += diff;
        }
        return task;
    });
    saveData();
    updateUI();
};

window.deleteTask = function(id) {
    const task = tasks.find(t => t.id === id);
    if (task && task.completed) {
        totalStars -= task.stars;
        walletStars -= task.stars;
    }
    tasks = tasks.filter(t => t.id !== id);
    saveData();
    updateUI();
};

// СИСТЕМА ПОКУПКИ В МАГАЗИНЕ
window.buyItem = function(name, price) {
    if (walletStars >= price) {
        playSound();
        walletStars -= price;
        inventory.push(name);
        saveData();
        updateUI();
        alert(`🎰 Успешно куплено: [${name}]! Товар добавлен в твой Инвентарь.`);
    } else {
        alert("❌ Недостаточно EXP! Иди выполняй квесты, слабак!");
    }
};

window.rateDay = function(mood) {
    playSound();
    currentMood = mood;
    localStorage.setItem('currentMood', currentMood);
    dayResult.innerText = `Статус вечера: ${mood}`;
};

function updateUI() {
    // Список задач
    taskList.innerHTML = '';
    tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.innerHTML = `
            <span class="task-text">${task.text} (+${task.stars} EXP)</span>
            <div class="task-buttons">
                <button class="done-btn" onclick="toggleTask(${task.id})">✓</button>
                <button class="delete-btn" onclick="deleteTask(${task.id})">✕</button>
            </div>
        `;
        taskList.appendChild(li);
    });

    // Расчет опыта за месяц (Общий опыт игрока)
    const currentMonthNum = getFormattedDate().split('.')[1];
    const thisMonthHistory = historyLog.filter(e => e.date.split('.')[1] === currentMonthNum);
    const totalMonthStars = thisMonthHistory.reduce((sum, e) => sum + e.stars, 0) + totalStars;

    totalStarsSpan.innerText = totalStars;
    walletStarsSpan.innerText = walletStars;

    // РАСЧЕТ РАНГА И ПОЛОСЫ ПРОГРЕССА
    let currentRank = RANKS[0];
    let prevMaxExp = 0;

    for (let i = 0; i < RANKS.length; i++) {
        if (totalMonthStars >= RANKS[i].maxExp) {
            prevMaxExp = RANKS[i].maxExp;
        } else {
            currentRank = RANKS[i];
            break;
        }
    }

    userRank.innerText = `Ранг: ${currentRank.name}`;
    
    // Заполнение полосы
    if (currentRank.maxExp === 9999) {
        lvlBarFill.style.width = "100%";
        lvlBarText.innerText = "МАКСИМАЛЬНЫЙ УРОВЕНЬ 👑";
    } else {
        const neededExpForCurrentLvl = currentRank.maxExp - prevMaxExp;
        const playerProgressInCurrentLvl = totalMonthStars - prevMaxExp;
        const percentage = (playerProgressInCurrentLvl / neededExpForCurrentLvl) * 100;
        
        lvlBarFill.style.width = `${percentage}%`;
        lvlBarText.innerText = `${totalMonthStars} / ${currentRank.maxExp} EXP`;
    }

    // Отображение Инвентаря
    inventoryList.innerText = inventory.length > 0 ? inventory.join(', ') : "Пуст";

    // Логика Системного Квеста
    if (activeSystemQuest) {
        systemQuestText.innerText = activeSystemQuest.text;
        if (activeSystemQuest.completed) {
            systemQuestText.innerText = `🎉 [ВЫПОЛНЕНО]: ${activeSystemQuest.text}`;
            questRewardText.innerText = "Награда получена!";
            getQuestBtn.classList.add('hidden');
            completeQuestBtn.classList.add('hidden');
        } else {
            questRewardText.innerText = `Награда: +${activeSystemQuest.reward} EXP`;
            getQuestBtn.classList.add('hidden');
            completeQuestBtn.classList.remove('hidden');
        }
    } else {
        systemQuestText.innerText = "Система готова выдать случайное задание на сегодня.";
        questRewardText.innerText = "Награда: +?? EXP";
        getQuestBtn.classList.remove('hidden');
        completeQuestBtn.classList.add('hidden');
    }

    // Рендер истории
    historyCalendar.innerHTML = '';
    [...historyLog].reverse().forEach(entry => {
        const card = document.createElement('div');
        card.className = 'history-card';
        card.innerHTML = `
            <div class="date">${entry.date}</div>
            <div class="stars">+${entry.stars} EXP</div>
            <div class="mood">${entry.mood}</div>
        `;
        historyCalendar.appendChild(card);
    });
}

function saveData() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('totalStars', totalStars);
    localStorage.setItem('walletStars', walletStars);
    localStorage.setItem('historyLog', JSON.stringify(historyLog));
    localStorage.setItem('inventory', JSON.stringify(inventory));
}