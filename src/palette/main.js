import Palette from './svelte/Palette.html';

Promise.all([
    browser.windows.getAll({
        populate: true,
        windowTypes: ['normal']
    }),
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
