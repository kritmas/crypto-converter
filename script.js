// Криптовалюты и их ID для API
const CRYPTO_IDS = {
    USDT: 'tether',
    USDC: 'usd-coin',
    TON: 'the-open-network'
};

// Хранилище курсов
let rates = {
    USDT: 0,
    USDC: 0,
    TON: 0
};

// Загрузка курсов при открытии страницы
document.addEventListener('DOMContentLoaded', () => {
    loadRates(); // Загружаем курсы
    setupEventListeners(); // Настраиваем обработчики
    
    // Автообновление каждые 5 минут
    setInterval(loadRates, 5 * 60 * 1000);
});

function setupEventListeners() {
    const rubInput = document.getElementById('rubAmount');
    const cryptoSelect = document.getElementById('cryptoType');
    const refreshBtn = document.getElementById('refreshBtn');
    
    if (rubInput) rubInput.addEventListener('input', convertCurrency);
    if (cryptoSelect) cryptoSelect.addEventListener('change', convertCurrency);
    if (refreshBtn) refreshBtn.addEventListener('click', () => loadRates(true));
}

// Функция загрузки курсов с CoinGecko API (бесплатно, без ключа)
async function loadRates(showNotification = false) {
    const refreshBtn = document.getElementById('refreshBtn');
    
    if (refreshBtn) {
        refreshBtn.classList.add('loading');
        refreshBtn.textContent = '⏳ Обновление...';
    }
    
    try {
        // Загружаем курсы всех трёх криптовалют
        const response = await fetch(
            'https://api.coingecko.com/api/v3/simple/price?ids=tether,usd-coin,the-open-network&vs_currencies=rub'
        );
        
        const data = await response.json();
        
        // Сохраняем курсы
        rates.USDT = data.tether?.rub || 90;
        rates.USDC = data['usd-coin']?.rub || 90;
        rates.TON = data['the-open-network']?.rub || 520;
        
        // Сохраняем в localStorage для офлайн-режима
        saveRatesToLocalStorage();
        
        if (showNotification) {
            showToast('✅ Курсы обновлены!');
        }
        
        // Обновляем отображение
        updateRateDisplay();
        convertCurrency();
        
    } catch (error) {
        console.error('Ошибка загрузки курсов:', error);
        
        // Пробуем загрузить из localStorage
        const savedRates = loadRatesFromLocalStorage();
        if (savedRates) {
            rates = savedRates;
            showToast('📱 Офлайн-режим: показаны последние курсы');
        } else {
            // Если нет сохранённых курсов, используем примерные значения
            setDefaultRates();
            showToast('⚠️ Нет интернета. Используются примерные курсы');
        }
        
        updateRateDisplay();
        convertCurrency();
    } finally {
        if (refreshBtn) {
            refreshBtn.classList.remove('loading');
            refreshBtn.textContent = '🔄 Обновить курс';
        }
        
        // Обновляем время
        const updateTime = document.getElementById('updateTime');
        if (updateTime) {
            updateTime.textContent = new Date().toLocaleTimeString('ru-RU');
        }
    }
}

// Сохранение курсов в локальное хранилище
function saveRatesToLocalStorage() {
    const data = {
        rates: rates,
        timestamp: Date.now()
    };
    localStorage.setItem('crypto_rates', JSON.stringify(data));
}

// Загрузка курсов из локального хранилища
function loadRatesFromLocalStorage() {
    const saved = localStorage.getItem('crypto_rates');
    if (saved) {
        const data = JSON.parse(saved);
        // Проверяем, не устарели ли курсы (больше часа)
        if (Date.now() - data.timestamp < 60 * 60 * 1000) {
            return data.rates;
        }
    }
    return null;
}

// Установка примерных курсов (если нет интернета)
function setDefaultRates() {
    rates = {
        USDT: 91.50,
        USDC: 91.50,
        TON: 520
    };
}

// Обновление отображения курса
function updateRateDisplay() {
    const cryptoType = document.getElementById('cryptoType');
    const rateElement = document.getElementById('rate');
    const cryptoName = document.getElementById('cryptoName');
    
    if (!cryptoType) return;
    
    const selectedCrypto = cryptoType.value;
    const rate = rates[selectedCrypto];
    
    if (rateElement && rate > 0) {
        rateElement.textContent = rate.toFixed(2);
    }
    
    if (cryptoName) {
        cryptoName.textContent = selectedCrypto;
    }
}

// Конвертация валюты
function convertCurrency() {
    const rubInput = document.getElementById('rubAmount');
    const cryptoType = document.getElementById('cryptoType');
    const cryptoAmountElement = document.getElementById('cryptoAmount');
    const cryptoSymbolElement = document.getElementById('cryptoSymbol');
    
    if (!rubInput || !cryptoType) return;
    
    const rubAmount = parseFloat(rubInput.value);
    const selectedCrypto = cryptoType.value;
    const rate = rates[selectedCrypto];
    
    if (isNaN(rubAmount) || !rate || rate === 0) {
        if (cryptoAmountElement) cryptoAmountElement.textContent = '0';
        if (cryptoSymbolElement) cryptoSymbolElement.textContent = selectedCrypto;
        return;
    }
    
    const cryptoAmount = rubAmount / rate;
    
    if (cryptoAmountElement) {
        cryptoAmountElement.textContent = cryptoAmount.toFixed(8);
        
        // Анимация
        cryptoAmountElement.style.transform = 'scale(1.1)';
        setTimeout(() => {
            cryptoAmountElement.style.transform = 'scale(1)';
        }, 200);
    }
    
    if (cryptoSymbolElement) {
        cryptoSymbolElement.textContent = selectedCrypto;
    }
}

// Всплывающее уведомление
function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 12px 20px;
        border-radius: 25px;
        font-size: 14px;
        z-index: 1000;
        animation: fadeInOut 2s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 2000);
}

// Добавляем CSS анимацию для уведомлений
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translateX(-50%) translateY(20px); }
        15% { opacity: 1; transform: translateX(-50%) translateY(0); }
        85% { opacity: 1; transform: translateX(-50%) translateY(0); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    }
    .loading {
        opacity: 0.6;
        pointer-events: none;
    }
`;
document.head.appendChild(style);