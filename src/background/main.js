import sortBy from 'lodash.sortby';
import forOwn from 'lodash.forown';
import search from '../search.js';
import activateTab from '../activateTab.js';

let mru = {};

function updateMru(winId) {
    forOwn(mru, (value, key, obj) => {
        obj[key] = value++;
    });
    mru[winId] = 0;
}

browser.windows.onCreated.addListener(win => {
    if (win.type == 'normal') {
        updateMru(win);
    }
});
browser.windows.onFocusChanged.addListener(winId => {
    browser.windows.get(winId)
        .then(win => {
            if (win.type == 'normal') {
                updateMru(win);
            }
        });
});
browser.windows.onRemoved.addListener(win => {
    if (!mru.hasOwnProperty(win.id)) {
        return;
    }
    const mru_val = mru[win.id];
    forOwn(mru, (value, key, obj) => {
        if (key != win.id && value > mru_val) {
            obj[key]--;
        }
    });
    delete mru[win.id];
});

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type == 'get_mru') {
        browser.windows.getAll({ populate: true, windowTypes: ['normal'] })
            .then((windows) => sortBy(windows, (win) => mru[win.id]))
            .then((windows_by_mru) => sendResponse(windows_by_mru));
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
