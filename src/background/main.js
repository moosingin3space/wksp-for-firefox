import sortBy from 'lodash.sortby';
import search from '../search.js';
import activateTab from '../activateTab.js';

browser.windows.getAll({
    populate: true,
    windowTypes: ['normal']
}).then(windows => {
    let mru = [];
    let mapper = {};

    function initMru(windows) {
        for (let i = 0; i < windows.length; i++) {
            const m = (windows[i].focused ? 0 : 1);
            mru.push(Object.assign({}, {
                mru: m
            }, windows[i]));
            mapper[windows[i].id] = i;
        }
    }

    function updateWindow(winId) {
        return browser.windows.get(winId, { populate: true })
            .then(win => {
                if (!mapper.hasOwnProperty(win.id)) {
                    mapper[win.id] = mru.length;
                    mru.push(Object.assign({}, {
                        mru: 0
                    }, win));
                } else {
                    Object.assign(mru[mapper[win.id]], {}, win);
                }
            });
    }

    function updateAssociatedWindow(tabId) {
        return browser.tabs.get(tabId)
            .then(tab => updateWindow(tab.windowId));
    }

    function updateMru(win) {
        for (let i = 0; i < mru.length; i++) {
            mru[i].mru++;
        }
        if (!mapper.hasOwnProperty(win.id)) {
            mapper[win.id] = mru.length;
            mru.push(Object.assign({}, {
                mru: 0
            }, win));
        }
        mru[mapper[win.id]].mru = 0;
        // TODO maybe use a binary heap?
    }

    browser.windows.onCreated.addListener(win => {
        if (win.type == 'normal') {
            updateMru(win);
        }
    });
    browser.windows.onFocusChanged.addListener(winId => {
        browser.windows.get(winId, { populate: true })
            .then(win => {
                if (win.type == 'normal') {
                    updateMru(win);
                }
            });
    });
    browser.windows.onRemoved.addListener(win => {
        const mru_val = mru[mapper[win.id]];
        mru.splice(mapper[win.id], 1);
        for (let i = 0; i < mru.length; i++) {
            if (mru[i].mru > mru_val) {
                mru[i].mru--;
            }
        }
        delete mapper[win.id];
    });
    browser.tabs.onCreated.addListener(tab => updateWindow(tab.windowId));
    browser.tabs.onUpdated.addListener(tabId => updateAssociatedWindow(tabId));
    browser.tabs.onRemoved.addListener((tabId, removeInfo) => updateWindow(removeInfo.windowId));
    browser.tabs.onMoved.addListener((tabId, moveInfo) => updateWindow(moveInfo.windowId));
    browser.tabs.onAttached.addListener((tabId, attachInfo) => updateWindow(attachInfo.newWindowId));
    browser.tabs.onDetached.addListener((tabId, detachInfo) => updateWindow(detachInfo.oldWindowId));

    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type == 'get_mru') {
            sendResponse(sortBy(mru, ['mru', 'id']));
        }
        return true;
    });

    browser.omnibox.onInputChanged.addListener((input, suggest) => {
        const initial_search = search(mru, input);
        let tabs = [];
        for (let i = 0; i < initial_search.length; i++) {
            Array.prototype.push.apply(tabs, initial_search[i].tabs);
        }
        let results = [];
        for (let i = 0; i < tabs.length; i++) {
            results.push({
                content: `wksp|switch|${tabs[i].id}`,
                description: `Switch to tab: ${tabs[i].title}`
            });
            results.push({
                content: `wksp|teleport|${tabs[i].id}`,
                description: `Teleport tab: ${tabs[i].title}`
            });
        }
        suggest(results);
    });

    browser.omnibox.onInputEntered.addListener((content, disposition) => {
        const [specifier, task, tabId] = content.split('|');
        if (specifier !== 'wksp') {
            return;
        }

        let teleport = false;
        if (task == 'teleport') {
            teleport = true;
        } else if (task != 'switch') {
            console.error('Not sure what to do');
            return;
        }
        activateTab(tabId|0, teleport)
            .then(() => refreshMru());
    });

    initMru(windows);
});
