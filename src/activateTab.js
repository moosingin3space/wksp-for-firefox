export default async function activateTab(tabId, teleport=false) {
    if (teleport) {
        const win = await browser.windows.getCurrent({ windowTypes: ['normal'] });
        const tab = await browser.tabs.move(tabId, { windowId: win.id, index: -1 });
        if (tab.id) {
            await browser.tabs.update(tab.id, { active: true });
        } else {
            await browser.tabs.update(tab[0].id, { active: true });
        }
    } else {
        const tab = await browser.tabs.update(tabId, { active: true });
        await browser.windows.update(tab.windowId, { focused: true });
    }
}
