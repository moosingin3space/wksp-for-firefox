import { Machine, assign, send, actions } from 'xstate';

const { pure } = actions;

const KEYS = {
    'ArrowDown': 'Down',
    'ArrowUp': 'Up',
    'ArrowLeft': 'Left',
    'ArrowRight': 'Right',
    ' ': 'Space',
    ',': 'Comma',
    '.': 'Period'
};

export function computeAdjustingShortcut({ adjustingModifier, adjustingShift, adjustingKey }) {
    let adjustingShortcut = [];
    if (adjustingModifier.length > 0) {
        adjustingShortcut.push(adjustingModifier);
    }
    if (adjustingShift) {
        adjustingShortcut.push('Shift');
    }
    if (adjustingKey.length == 0) {
        adjustingShortcut.push('...');
    } else {
        if (KEYS.hasOwnProperty(adjustingKey)) {
            adjustingShortcut.push(KEYS[adjustingKey]);
        } else if (adjustingKey.length == 1) {
            adjustingShortcut.push(adjustingKey.toUpperCase());
        }
    }
    return adjustingShortcut.join('+');
}

const startAdjusting = assign({
    adjustingModifier: (_context, _event) => '',
    adjustingShift: (_context, _event) => false,
    adjustingKey: (_context, _event) => '',
});

const applyShortcut = assign({
    shortcut: (context, _event) => computeAdjustingShortcut(context),
});

const resetShortcut = assign({
    shortcut: (context, _event) => context.initialShortcut,
});

const addNewKey = pure((context, event) => {
    // if escape pressed, we reset
    if (event.key == 'Escape') {
        return send({ type: 'RESET' });
    }

    // analyze modifier
    let adjustingModifier = context.adjustingModifier;
    let adjustingShift = context.adjustingShift;
    let adjustingKey = context.adjustingKey;
    if (event.key == "Control") {
        if (context.adjustingModifier.length == 0) {
            adjustingModifier = 'Ctrl';
        } else {
            adjustingModifier = '';
        }
    } else if (event.key == "Alt") {
        if (context.adjustingModifier.length == 0) {
            adjustingModifier = 'Alt';
        } else {
            adjustingModifier = '';
        }
    } else if (event.key == 'Shift') {
        adjustingShift = !adjustingShift;
    } else {
        adjustingKey = event.key;
    }

    return assign({ adjustingModifier, adjustingShift, adjustingKey });
});

export const hotkeyMachine = Machine({
    id: 'hotkey',
    initial: 'static',
    context: {
        initialShortcut: null,
        shortcut: null,
        adjustingModifier: '',
        adjustingShift: false,
        adjustingKey: '',
    },
    states: {
        static: {
            on: {
                SELECT: 'adjusting'
            }
        },
        adjusting: {
            entry: [startAdjusting, 'uiStartAdjusting'],
            on: {
                KEYSTROKE: {
                    actions: addNewKey,
                },
                APPLY: 'applying',
                RESET: 'resetting',
            }
        },
        applying: {
            always: {
                actions: applyShortcut,
                target: 'uiHandleChange',
            }
        },
        resetting: {
            always: {
                actions: resetShortcut,
                target: 'uiHandleChange',
            }
        },
        uiHandleChange: {
            always: {
                actions: 'uiChanged',
                target: 'static',
            }
        }
    }
});
