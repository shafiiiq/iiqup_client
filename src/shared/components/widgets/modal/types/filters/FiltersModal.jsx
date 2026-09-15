import React, { useState } from 'react';
import ModalBase from '../../ModalBase';
import Input from '@/shared/components/widgets/input/Input';
import { DEFAULT_MODAL_MODE } from '../../modalModes';
import './FiltersModal.css';

const sharedInputProps = {
  colorScheme: 'white-100',
  variant: 'filled',
  height: '57px',
  fontSize: 'xl',
  placeholderColor: 'black-100',
  inputPaddingInline: '2xl',
  fontWeight: '500',
  squircle: '10xl',
  fullWidth: true,
};

const CheckboxGroup = ({ group, filterValues, onFilterChange }) => (
  <div className="shared widget modal filter-checkboxes">
    {group.options?.map((option, index) => {
      const optionValue = option.value ?? option;
      const optionLabel = option.label ?? option;
      const isChecked = Array.isArray(filterValues[group.name]) ? filterValues[group.name].includes(optionValue) : false;

      return (
        <label key={index} className="shared widget modal filter-checkbox-label">
          <input
            type="checkbox"
            className="shared widget modal filter-checkbox-input"
            checked={isChecked}
            onChange={(event) => {
              const current = filterValues[group.name] || [];
              const next = event.target.checked ? [...current, optionValue] : current.filter((value) => value !== optionValue);
              onFilterChange(group.name, next);
            }}
          />
          <span className={`shared widget modal filter-checkbox-visual ${isChecked ? 'is-checked' : ''}`}>
            {isChecked && (
              <svg viewBox="0 0 24 24" width="14" height="14" fill="white">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            )}
          </span>
          <span className="shared widget modal filter-checkbox-text">{optionLabel}</span>
        </label>
      );
    })}
  </div>
);

const RadioGroup = ({ group, filterValues, onFilterChange }) => (
  <div className="shared widget modal filter-radios">
    {group.options?.map((option, index) => {
      const optionValue = option.value ?? option;
      const optionLabel = option.label ?? option;
      const isChecked = filterValues[group.name] === optionValue;

      return (
        <label key={index} className="shared widget modal filter-radio-label">
          <input
            type="radio"
            className="shared widget modal filter-radio-input"
            checked={isChecked}
            onChange={() => onFilterChange(group.name, optionValue)}
          />
          <span className={`shared widget modal filter-radio-visual ${isChecked ? 'is-checked' : ''}`}>
            {isChecked && <span className="shared widget modal filter-radio-dot" />}
          </span>
          <span className="shared widget modal filter-radio-text">{optionLabel}</span>
        </label>
      );
    })}
  </div>
);

const SelectGroup = ({ group, filterValues, onFilterChange }) => {
  const [open, setOpen] = useState(false);
  const selectedLabel = filterValues[group.name]
    ? group.options?.find((option) => (option.value ?? option) === filterValues[group.name])?.label ?? filterValues[group.name]
    : 'All';

  return (
    <div className="shared widget modal filter-select-wrapper">
      <div className="shared widget modal filter-select-trigger" onClick={() => setOpen((prev) => !prev)}>
        <span>{selectedLabel}</span>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M7 10l5 5 5-5z" />
        </svg>
      </div>
      {open && (
        <div className="shared widget modal filter-select-dropdown">
          <div
            className="shared widget modal filter-select-option"
            onClick={() => {
              onFilterChange(group.name, '');
              setOpen(false);
            }}
          >
            All
          </div>
          {group.options?.map((option, index) => {
            const optionValue = option.value ?? option;
            const optionLabel = option.label ?? option;
            return (
              <div
                key={index}
                className="shared widget modal filter-select-option"
                onClick={() => {
                  onFilterChange(group.name, optionValue);
                  setOpen(false);
                }}
              >
                {optionLabel}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const DateGroup = ({ group, filterValues, onFilterChange }) => (
  <div className="shared widget modal filter-date-wrapper">
    <Input type="date" value={filterValues[group.name] || ''} onChange={(event) => onFilterChange(group.name, event.target.value)} {...sharedInputProps} />
    <div className="shared widget modal filter-date-icon">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM5 8V6h14v2H5zm2 4h10v2H7v-2z" />
      </svg>
    </div>
  </div>
);

const RangeGroup = ({ group, filterValues, onFilterChange }) => (
  <div className="shared widget modal filter-range">
    <Input
      type="number"
      placeholder="Min"
      value={filterValues[group.name]?.min || ''}
      onChange={(event) => onFilterChange(group.name, { ...filterValues[group.name], min: event.target.value })}
      {...sharedInputProps}
    />
    <span className="shared widget modal filter-range-separator">-</span>
    <Input
      type="number"
      placeholder="Max"
      value={filterValues[group.name]?.max || ''}
      onChange={(event) => onFilterChange(group.name, { ...filterValues[group.name], max: event.target.value })}
      {...sharedInputProps}
    />
  </div>
);

const TextGroup = ({ group, filterValues, onFilterChange }) => (
  <Input
    type="text"
    placeholder={group.placeholder || ''}
    value={filterValues[group.name] || ''}
    onChange={(event) => onFilterChange(group.name, event.target.value)}
    {...sharedInputProps}
  />
);

const GROUP_RENDERERS = {
  checkbox: CheckboxGroup,
  radio: RadioGroup,
  select: SelectGroup,
  date: DateGroup,
  range: RangeGroup,
  text: TextGroup,
};

const FiltersModal = ({
  isOpen,
  onClose,
  mode = DEFAULT_MODAL_MODE,
  title,
  message,
  filterGroups = [],
  filterValues = {},
  onFilterChange = () => {},
  onApplyFilters = () => {},
  onResetFilters,
  buttonText,
  modalWidth,
  modalHeight,
}) => (
  <ModalBase
    isOpen={isOpen}
    onClose={onClose}
    mode={mode}
    type="filters"
    title={title}
    showMessage={false}
    buttonText={buttonText}
    onButtonClick={onApplyFilters}
    renderExtraFooterAction={
      onResetFilters && (
        <button className="shared widget modal cta cta-secondary" onClick={onResetFilters}>
          Reset
        </button>
      )
    }
    modalWidth={modalWidth}
    modalHeight={modalHeight}
  >
    <div className="shared widget modal filters-section">
      {message && <p className="shared widget modal message filters-message">{message}</p>}
      <div className="shared widget modal filters-groups">
        {filterGroups.map((group, index) => {
          const GroupRenderer = GROUP_RENDERERS[group.type];
          if (!GroupRenderer) return null;
          return (
            <div key={group.name || index} className="shared widget modal filter-group">
              <label className="shared widget modal filter-label">{group.label}</label>
              <GroupRenderer group={group} filterValues={filterValues} onFilterChange={onFilterChange} />
            </div>
          );
        })}
      </div>
    </div>
  </ModalBase>
);

export default FiltersModal;
