import Palette from './svelte/Palette.html';

Promise.all([
    browser.runtime.sendMessage({ type: 'get_mru' }),
    browser.contextualIdentities.query({})
]).then(([windows, containers]) => {
    const pal = new Palette({
        target: document.querySelector('main'),
        data: {
            windows,
            containers
        }
    });
});
