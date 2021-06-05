import sortBy from 'lodash.sortby';
import search from '../search.js';
import activateTab from '../activateTab.js';

let mru = {};

function updateMru(winId) {
    const wins = Object.getOwnPropertyNames(mru);
    for (let i = 0; i < wins.length; i++) {
        mru[wins[i]]++;
    }
    mru[winId] = 0;
}

browser.windows.onCreated.addListener(win => updateMru(win.id));
browser.windows.onFocusChanged.addListener(winId => updateMru(winId));
browser.windows.onRemoved.addListener(winId => {
    if (!mru.hasOwnProperty(winId)) {
        return;
    }
    const mru_val = mru[winId];
    const wins = Object.getOwnPropertyNames(mru);
    for (let i = 0; i < wins.length; i++) {
        if (mru[wins[i]] > mru_val) {
            mru[wins[i]]--;
        }
    }
    delete mru[winId];
});

browser.runtime.onMessage.addListener(async (message, _sender) => {
    if (message.type == 'get_mru') {
        const windows = await browser.windows.getAll({ populate: true, windowTypes: ['normal'] });
        const windowsByMru = sortBy(windows, win => mru[win.id]);
        return windowsByMru;
    }
});

browser.omnibox.onInputChanged.addListener(async (input, suggest) => {
    const windows = await browser.windows.getAll({ populate: true, windowTypes: ['normal'] });
        const initial_search = search(windows, input);
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

browser.omnibox.onInputEntered.addListener((content, _disposition) => {
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
    activateTab(tabId|0, teleport);
});
