export default function activateTab(tab_id, teleport=false) {
    if (teleport) {
        return browser.windows.getCurrent({ windowTypes: ['normal'] })
            .then(win => browser.tabs.move(tab_id, { windowId: win.id, index: -1 }))
            .then(tab => {
                if (tab.id) {
                    return browser.tabs.update(tab.id, { active: true });
                } else {
                    return browser.tabs.update(tab[0].id, { active: true });
                }
            });
    } else {
        return browser.tabs.update(tab_id, { active: true })
            .then(tab => browser.windows.update(tab.windowId, { focused: true }));
    }
}
