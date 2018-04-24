import Options from './svelte/Options.html';

Promise.all([
    browser.commands.getAll(),
    browser.storage.local.get({shouldCloseOnClose: false})
]).then(([commands, stored_opts]) => {
        const cmd = commands[0];
        const opt = new Options({
            target: document.querySelector('main'),
            data: {
                shortcut: cmd.shortcut,
                shouldCloseOnClose: stored_opts.shouldCloseOnClose
            }
        });
});
