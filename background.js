// Manage toggle state and handle browser action clicks

const STORAGE_KEY = 'hideRatingsEnabled';

// Initialize state if not set
chrome.storage.local.get([STORAGE_KEY], (result) => {
    if (typeof result[STORAGE_KEY] === 'undefined') {
        chrome.storage.local.set({ [STORAGE_KEY]: true });
    }
});

function broadcastStateToTab(tabId, enabled) {
    if (!tabId) return;
    chrome.tabs.sendMessage(tabId, { type: 'LETTERBOXD_TOGGLE', enabled });
}

function updateIcon(enabled) {
    const path = enabled ? {
        16: 'icons/icon-16.png',
        48: 'icons/icon-48.png',
        128: 'icons/icon-128.png'
    } : {
        16: 'icons/icon-16.png',
        48: 'icons/icon-48.png',
        128: 'icons/icon-128.png'
    };
    // Reuse same icon for now; could add dimmed icon later
    chrome.browserAction.setIcon({ path });
    chrome.browserAction.setTitle({ title: enabled ? 'Masquage activé' : 'Masquage désactivé' });
}

// Update icon on startup based on stored state
chrome.storage.local.get([STORAGE_KEY], (result) => {
    const enabled = result[STORAGE_KEY] !== false; // default true
    updateIcon(enabled);
    updateContextMenu(enabled);
});

// Create context menu
function updateContextMenu(enabled) {
    // Remove existing menu item if it exists
    chrome.contextMenus.removeAll(() => {
        // Create new menu item
        chrome.contextMenus.create({
            id: 'toggle-letterboxd-extension',
            title: enabled ? 'Désactiver le masquage des notes' : 'Activer le masquage des notes',
            contexts: ['page'],
            documentUrlPatterns: ['*://letterboxd.com/*']
        });
    });
}

chrome.browserAction.onClicked.addListener((tab) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
        const current = result[STORAGE_KEY] !== false; // default true
        const next = !current;
        chrome.storage.local.set({ [STORAGE_KEY]: next }, () => {
            updateIcon(next);
            updateContextMenu(next);
            if (tab && tab.id) {
                broadcastStateToTab(tab.id, next);
            }
        });
    });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'toggle-letterboxd-extension') {
        chrome.storage.local.get([STORAGE_KEY], (result) => {
            const current = result[STORAGE_KEY] !== false; // default true
            const next = !current;
            chrome.storage.local.set({ [STORAGE_KEY]: next }, () => {
                updateIcon(next);
                updateContextMenu(next);
                if (tab && tab.id) {
                    broadcastStateToTab(tab.id, next);
                }
            });
        });
    }
});

// Respond to content script asking for current state
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message && message.type === 'LETTERBOXD_GET_STATE') {
        chrome.storage.local.get([STORAGE_KEY], (result) => {
            const enabled = result[STORAGE_KEY] !== false; // default true
            sendResponse({ enabled });
        });
        return true; // async response
    }
});


