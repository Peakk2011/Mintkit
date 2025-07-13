/**
 * Mintkit Alert system API (BETA)
 */

let alertContainer = null;
let activeAlerts = new Map();
let alertCounter = 0;
const MAX = 86400000; // Debug
const _REGULAR = 3000;

const ALERT_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
};

function initAlertSystem() {
    createAlertContainer();
}

function createAlertContainer() {
    if (!document.querySelector('.alert-container')) {
        alertContainer = document.createElement('div');
        alertContainer.className = 'alert-container';
        document.body.appendChild(alertContainer);
    } else {
        alertContainer = document.querySelector('.alert-container');
    }
}

/**
 * @param {Object} options 
 * @returns {string}
 */

function showAlert(options = {}) {
    const {
        type = 'info',
        message = '',
        icon = '',
        autoDismiss = true,
        dismissDelay = MAX,
        persistent = false,
        onClose = null
    } = options;

    const alertId = `alert-${++alertCounter}`;
    const alertElement = createAlertElement(alertId, { type, message, icon, persistent });

    alertContainer.appendChild(alertElement);
    activeAlerts.set(alertId, {
        element: alertElement,
        options,
        onClose
    });

    showAlertWithAnimation(alertId);

    if (autoDismiss && !persistent) {
        autoDismissAlert(alertId, dismissDelay);
    }

    return alertId;
}

/**
 * @param {string} alertId 
 * @param {Object} config 
 * @returns {HTMLElement} 
 */

function createAlertElement(alertId, config) {
    const { type, message, icon, persistent } = config;

    const alertElement = document.createElement('div');
    alertElement.id = alertId;
    alertElement.className = `message-container`;

    const closeButton = !persistent ? `
        <button class="close-notification" data-alert-id="${alertId}">
            <i class="fas fa-times"></i>
        </button>
    ` : '';

    alertElement.innerHTML = `
        <div class="message ${type}">
            <div class="notification-content">
                ${icon ? icon : ''}
                <span>${message}</span>
                ${closeButton}
            </div>
        </div>
    `;

    const closeButtonElement = alertElement.querySelector('.close-notification');
    if (closeButtonElement) {
        closeButtonElement.addEventListener('click', (e) => {
            const alertId = e.currentTarget.dataset.alertId;
            closeAlert(alertId);
        });
    }

    return alertElement;
}

/**
 * @param {string} alertId - Alert ID
 */
function showAlertWithAnimation(alertId) {
    const alertData = activeAlerts.get(alertId);
    if (!alertData) return;

    const { element } = alertData;

    const activeAlertCount = activeAlerts.size;
    const topOffset = 30 + (activeAlertCount - 1) * 60;

    requestAnimationFrame(() => {
        element.style.top = `${topOffset}px`;
        element.style.transform = 'translate(-50%, 0px)';
        element.style.opacity = '1';
    });
}

/**
 * @param {string} alertId - Alert ID
 */

function hideAlertWithAnimation(alertId) {
    const alertData = activeAlerts.get(alertId);
    if (!alertData) return;

    const { element } = alertData;

    element.style.transform = 'translate(-50%, -250px)';

    setTimeout(() => {
        removeAlert(alertId);
    }, 800);
}

/**
 * @param {string} alertId - Alert ID
 */

function removeAlert(alertId) {
    const alertData = activeAlerts.get(alertId);
    if (!alertData) return;

    const { element, onClose } = alertData;

    if (element.parentNode) {
        element.parentNode.removeChild(element);
    }

    activeAlerts.delete(alertId);

    if (onClose && typeof onClose === 'function') {
        onClose(alertId);
    }

    repositionAlerts();
}

/**
 * @param {string} alertId - Alert ID
 */

function closeAlert(alertId) {
    hideAlertWithAnimation(alertId);
}

function closeAllAlerts() {
    activeAlerts.forEach((alertData, alertId) => {
        closeAlert(alertId);
    });
}

/**
 * @param {string} alertId 
 * @param {number} delay 
 */

function autoDismissAlert(alertId, delay) {
    setTimeout(() => {
        if (activeAlerts.has(alertId)) {
            closeAlert(alertId);
        }
    }, delay);
}

function repositionAlerts() {
    let index = 0;
    for (const [alertId, alertData] of activeAlerts) {
        const { element } = alertData;
        const topOffset = 30 + index * 60;
        
        element.style.top = `${topOffset}px`;
        index++;
    }
}

function showSuccessAlert(message, options = {}) {
    return showAlert({
        type: 'success',
        message,
        icon: '<i class="fas fa-check-circle"></i>',
        ...options
    });
}

function showErrorAlert(message, options = {}) {
    return showAlert({
        type: 'error',
        message,
        icon: '<i class="fas fa-exclamation-triangle"></i>',
        ...options
    });
}

function showWarningAlert(message, options = {}) {
    return showAlert({
        type: 'warning',
        message,
        icon: '<i class="fas fa-exclamation-circle"></i>',
        ...options
    });
}

function showInfoAlert(message, options = {}) {
    return showAlert({
        type: 'info',
        message,
        icon: '<i class="fas fa-info-circle"></i>',
        ...options
    });
}

function showConfirmAlert(message, onConfirm, onCancel, options = {}) {
    return showAlert({
        type: 'warning',
        message,
        icon: '<i class="fas fa-question-circle"></i>',
        persistent: true,
        autoDismiss: false,
        onClose: () => {
            if (onCancel) onCancel();
        },
        ...options
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAlertSystem);
} else {
    initAlertSystem();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showAlert,
        showSuccessAlert,
        showErrorAlert,
        showWarningAlert,
        showInfoAlert,
        showConfirmAlert,
        closeAlert,
        closeAllAlerts,
        repositionAlerts
    };
} else if (typeof window !== 'undefined') {
    window.showAlert = showAlert;
    window.showSuccessAlert = showSuccessAlert;
    window.showErrorAlert = showErrorAlert;
    window.showWarningAlert = showWarningAlert;
    window.showInfoAlert = showInfoAlert;
    window.showConfirmAlert = showConfirmAlert;
    window.closeAlert = closeAlert;
    window.closeAllAlerts = closeAllAlerts;
    window.repositionAlerts = repositionAlerts;
} 