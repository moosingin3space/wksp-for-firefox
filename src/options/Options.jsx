import React, { useState, useEffect } from 'react';
import { useMachine } from '@xstate/react';

import { hotkeyMachine, computeAdjustingShortcut } from './hotkeyMachine';

import styles from './options.module.css';
import colors from '../colorSchemes.module.css';
import commonStyles from '../common.module.css';

const KeystrokeCapturer = ({shortcut, onStartAdjusting, onFinishAdjusting}) => {
    const [current, send] = useMachine(hotkeyMachine, {
        context: {
            initialShortcut: shortcut,
            shortcut,
        },
        actions: {
            uiStartAdjusting: (_context, _event) => {
                onStartAdjusting();
            },
            uiChanged: (context, _event) => {
                onFinishAdjusting(context.shortcut);
            },
        }
    });

    const adjusting = current.matches('adjusting');
    let adjustingShortcut;
    if (adjusting) {
        adjustingShortcut = computeAdjustingShortcut(current.context);
    }

    return (
        <>
            <span className="palette-label">Palette Hotkey:</span>
            <div className={`${styles.keystrokeDisplay} ${adjusting ? styles.keystrokeModifying : ''}`} tabIndex={0}
                onClick={() => send({ type: 'SELECT' })}
                onKeyDown={(e) => {
                    e.preventDefault();
                    send({ type: 'KEYSTROKE', key: e.key })
                }}
            >
                {adjusting ? adjustingShortcut : current.context.shortcut}
            </div>
            <button className="browser-style" disabled={!adjusting} onClick={() => send({ type: 'APPLY' })}>
                Apply
            </button>
            <button className="browser-style" disabled={!adjusting} onClick={() => send({ type: 'RESET'})}>
                Reset
            </button>
        </>
    );
};

const Options = () => {
    const [shortcut, setShortcut] = useState(null);
    const [shouldCloseOnClose, setShouldCloseOnClose] = useState(null);
    const [isAdjusting, setAdjusting] = useState(false);
    const changingKeybindSupported = !!browser.commands.update;

    useEffect(() => {
        const fetchData = async () => {
            const [commands, storedOpts] = await Promise.all([
                browser.commands.getAll(),
                browser.storage.local.get({ shouldCloseOnClose: false }),
            ]);
            // TODO how do we handle errors?
            setShortcut(commands[0].shortcut);
            setShouldCloseOnClose(storedOpts.shouldCloseOnClose);
        };
        fetchData();
    }, []);

    return (
        <div className={colors.top}>
            <header className="panel-section panel-section-header">
                <div className={`text-section-header ${commonStyles.heading}`}>
                    Workspaces for Firefox Settings
                </div>
            </header>

            <div className="panel-section panel-section-formElements">
                { shouldCloseOnClose != null ?
                    <div className={`panel-formElements-item ${styles.flexForm}`}>
                        <label htmlFor="shouldCloseOnClose">
                            Close Palette when a tab is closed
                        </label>
                        <input id="shouldCloseOnClose" type="checkbox" checked={shouldCloseOnClose}
                            onChange={(e) => setShouldCloseOnClose(e.target.checked)}
                            />
                    </div>
                    : <span/>
                }
                <div className={`panel-formElements-item ${styles.flexForm}`}>
                    { shortcut ?
                        ( changingKeybindSupported
                            ? <KeystrokeCapturer shortcut={shortcut}
                                onStartAdjusting={() => setAdjusting(true)}
                                onFinishAdjusting={async (shortcut) => {
                                    await browser.commands.update({
                                        name: '_execute_browser_action',
                                        shortcut,
                                    });
                                    setShortcut(shortcut);
                                    setAdjusting(false);
                                }}
                                />
                            : <p>Cannot change the hotkey in Firefox &lt; 60.</p>
                        )
                        : <span/>
                    }
                </div>
                { isAdjusting &&
                    <div className={`panel-formElements-item ${styles.flexForm}`}>
                        <i>
                            Enter the keystroke, then press Apply.
                            Press Reset to switch to the default keybinding.
                            You may toggle the modifier keys while you're editing the keystroke,
                            or press Escape to cancel.
                        </i>
                    </div>
                }
            </div>
        </div>
    );
};
export default Options;
