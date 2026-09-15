import React, { useState } from 'react';
import ModalBase from '../../ModalBase';
import Input from '@/shared/components/widgets/input/Input';
import { DEFAULT_MODAL_MODE } from '../../modalModes';
import './SplitModal.css';

const SPLIT_TYPES = [
  { value: 'specific', label: 'Specific Pages (e.g., 1,3,5)', placeholder: 'Enter pages: 1,3,5' },
  { value: 'range', label: 'Page Range (e.g., 1-5,7-10)', placeholder: 'Enter ranges: 1-5,7-10' },
  { value: 'every', label: 'Every N Pages (e.g., 2)', placeholder: 'Enter interval: 2' },
];

const parsePages = (splitType, pageInput) => {
  if (splitType === 'specific') {
    const pages = pageInput
      .split(',')
      .map((page) => parseInt(page.trim(), 10))
      .filter((page) => !Number.isNaN(page) && page > 0);
    if (pages.length === 0) throw new Error('Invalid page numbers');
    return pages;
  }

  if (splitType === 'range') {
    return pageInput.split(',').map((range) => {
      const [start, end] = range.split('-').map((page) => parseInt(page.trim(), 10));
      if (Number.isNaN(start) || Number.isNaN(end) || start < 1 || end < start) {
        throw new Error('Invalid range');
      }
      return [start, end];
    });
  }

  const interval = parseInt(pageInput.trim(), 10);
  if (Number.isNaN(interval) || interval < 1) throw new Error('Invalid interval');
  return [interval];
};

const SplitModal = ({
  isOpen,
  onClose,
  mode = DEFAULT_MODAL_MODE,
  title,
  message,
  buttonText,
  onButtonClick,
  modalWidth,
  modalHeight,
}) => {
  const [splitType, setSplitType] = useState('specific');
  const [pageInput, setPageInput] = useState('');
  const [error, setError] = useState('');

  const activeSplitType = SPLIT_TYPES.find((entry) => entry.value === splitType);

  const selectSplitType = (value) => {
    setSplitType(value);
    setPageInput('');
    setError('');
  };

  const handleSubmit = () => {
    if (!pageInput.trim()) {
      setError('Please enter page numbers');
      return;
    }
    try {
      const pages = parsePages(splitType, pageInput);
      onButtonClick?.({ splitType, pages });
    } catch (parseError) {
      setError(parseError.message || 'Invalid input format');
    }
  };

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      mode={mode}
      type="split"
      title={title}
      showMessage={false}
      buttonText={buttonText}
      onSubmit={handleSubmit}
      modalWidth={modalWidth}
      modalHeight={modalHeight}
    >
      <div className="shared widget modal split-section">
        {message && <p className="shared widget modal message split-message">{message}</p>}

        <div className="shared widget modal split-options">
          {SPLIT_TYPES.map((entry) => (
            <label key={entry.value} className="shared widget modal split-radio-label">
              <input
                type="radio"
                value={entry.value}
                checked={splitType === entry.value}
                onChange={(event) => selectSplitType(event.target.value)}
              />
              <span>{entry.label}</span>
            </label>
          ))}

          <Input
            type="text"
            value={pageInput}
            onChange={(event) => {
              setPageInput(event.target.value);
              setError('');
            }}
            placeholder={activeSplitType?.placeholder}
            colorScheme="white-100"
            variant="filled"
            height="57px"
            fontSize="xl"
            placeholderColor="black-100"
            inputPaddingInline="2xl"
            fontWeight="500"
            squircle="10xl"
            fullWidth
          />

          {error && <div className="shared widget modal split-error">{error}</div>}
        </div>
      </div>
    </ModalBase>
  );
};

export default SplitModal;
