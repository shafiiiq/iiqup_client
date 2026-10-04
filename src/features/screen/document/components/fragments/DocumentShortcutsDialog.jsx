import { useEffect, useState } from 'react';
import Button from '@/shared/components/widgets/button/Button';
import { renderComponentIcon } from '@/shared/components/icons/icon.render';
import { DOCUMENT_TOOLBAR_ICONS, DIALOG_BUTTON_PROPS } from '../../constants/document.constant';
import {
  DEFAULT_DOCUMENT_SHORTCUTS,
  DOCUMENT_SHORTCUT_ACTIONS,
  VIEWER_SHORTCUTS,
  WINDOW_SHORTCUTS,
} from '../../constants/documentShortcut.constant';
import { eventToShortcut, formatShortcut } from '../../helper/documentShortcut.helper';

const ROW_BUTTON_PROPS = {
  ...DIALOG_BUTTON_PROPS,
  width: 'fit-content',
  height: '36px',
  font: 'sm',
  padding: '0 16px',
};

function DocumentShortcutsDialog({ shortcuts, onChange, onReset, onResetAll, onClose }) {
  const [recordingKey, setRecordingKey] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleKeyDown = (event) => {
      event.stopPropagation();
      if (event.key === 'Escape') {
        event.preventDefault();
        if (recordingKey) {
          setRecordingKey(null);
          setMessage('');
        } else {
          onClose();
        }
        return;
      }
      if (!recordingKey) return;
      event.preventDefault();
      const shortcut = eventToShortcut(event);
      if (!shortcut) return;
      const conflictAction = DOCUMENT_SHORTCUT_ACTIONS.find(
        (action) => action.key !== recordingKey && shortcuts[action.key] === shortcut
      );
      if (conflictAction) {
        setMessage(`${formatShortcut(shortcut)} is already used by ${conflictAction.label}`);
        return;
      }
      onChange(recordingKey, shortcut);
      setRecordingKey(null);
      setMessage('');
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [recordingKey, shortcuts, onChange, onClose]);

  const toggleRecording = (actionKey) => {
    setMessage('');
    setRecordingKey((previous) => (previous === actionKey ? null : actionKey));
  };

  return (
    <div className="doc-details-dialog-backdrop" onClick={onClose}>
      <div className="doc-details-dialog doc-shortcuts-dialog" onClick={(event) => event.stopPropagation()}>
        <h3 className="doc-details-dialog-title">Keyboard Shortcuts</h3>
        <p className="doc-shortcuts-hint">Click Change, then press the new key combination. Esc cancels.</p>

        {message && <div className="doc-shortcuts-message">{message}</div>}

        <div className="doc-shortcuts-list">
          {DOCUMENT_SHORTCUT_ACTIONS.map((action) => {
            const isRecording = recordingKey === action.key;
            return (
              <div className="doc-shortcuts-row" key={action.key}>
                <span className="doc-shortcuts-icon">
                  {renderComponentIcon(DOCUMENT_TOOLBAR_ICONS[action.key], 26, 'currentColor')}
                </span>
                <span className="doc-shortcuts-label">{action.label}</span>
                <span className={`doc-shortcuts-keys${isRecording ? ' recording' : ''}`}>
                  {isRecording ? 'Press keys...' : formatShortcut(shortcuts[action.key])}
                </span>
                <Button
                  {...ROW_BUTTON_PROPS}
                  text={isRecording ? 'Cancel' : 'Change'}
                  colorScheme="info-700"
                  onClick={() => toggleRecording(action.key)}
                />
                <Button
                  {...ROW_BUTTON_PROPS}
                  text="Reset"
                  colorScheme="warning-700"
                  disabled={shortcuts[action.key] === DEFAULT_DOCUMENT_SHORTCUTS[action.key]}
                  onClick={() => onReset(action.key)}
                />
              </div>
            );
          })}
        </div>

        <h4 className="doc-shortcuts-section-title">Tabs (fixed)</h4>
        <div className="doc-shortcuts-list">
          {WINDOW_SHORTCUTS.map((item) => (
            <div className="doc-shortcuts-row fixed" key={item.label}>
              <span className="doc-shortcuts-label">{item.label}</span>
              <span className="doc-shortcuts-keys">{item.keys}</span>
            </div>
          ))}
        </div>

        <h4 className="doc-shortcuts-section-title">Viewer (fixed)</h4>
        <div className="doc-shortcuts-list">
          {VIEWER_SHORTCUTS.map((item) => (
            <div className="doc-shortcuts-row fixed" key={item.label}>
              <span className="doc-shortcuts-label">{item.label}</span>
              <span className="doc-shortcuts-keys">{item.keys}</span>
            </div>
          ))}
        </div>

        <div className="doc-details-dialog-actions">
          <Button {...DIALOG_BUTTON_PROPS} text="Reset All" colorScheme="warning-700" onClick={onResetAll} />
          <Button {...DIALOG_BUTTON_PROPS} text="Close" colorScheme="success-700" onClick={onClose} />
        </div>
      </div>
    </div>
  );
}

export default DocumentShortcutsDialog;