import Options from './svelte/Options.html';

browser.commands.getAll()
    .then(commands => {
        const cmd = commands[0];
        const opt = new Options({
            target: document.querySelector('main'),
            data: cmd
        });
    });
