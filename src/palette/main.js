import Palette from './svelte/Palette.html';

Promise.all([
    browser.runtime.sendMessage({ type: 'get_mru' }),
    browser.contextualIdentities.query({}),
    browser.storage.local.get({shouldCloseOnClose: false})
]).then(([windows, containers, stored_opts]) => {
    const pal = new Palette({
        target: document.querySelector('main'),
        data: {
            windows,
            containers,
            shouldCloseOnClose: stored_opts.shouldCloseOnClose
        }
    });
});
