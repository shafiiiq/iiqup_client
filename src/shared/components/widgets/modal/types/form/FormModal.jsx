import React, { useState } from 'react';
import ModalBase from '../../ModalBase';
import Input from '@/shared/components/widgets/input/Input';
import Button from '@/shared/components/widgets/button/Button';
import { DEFAULT_MODAL_MODE } from '../../modalModes';
import './FormModal.css';

const sharedInputProps = {
  colorScheme: 'primary-1000',
  variant: 'filled',
  height: '57px',
  fontSize: 'xl',
  placeholderColor: 'white-100',
  color: 'white-100',
  inputPaddingInline: '2xl',
  borderColor: 'primary-700',
  textColor: 'white-100',
  borderWidth: '1px',
  fontWeight: '500',
  squircle: '10xl',
};

const FileField = ({ field, value, preview, onChange }) => (
  <div className="shared widget modal form-file-field">
    <div className="shared widget modal form-file-preview" onClick={() => document.getElementById(`form-file-${field.name}`)?.click()}>
      {preview || field.currentPreview ? (
        <img src={preview || field.currentPreview} alt="preview" className="shared widget modal form-file-preview-img" />
      ) : (
        <div className="shared widget modal form-file-placeholder">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
          <span>Click to upload</span>
        </div>
      )}
    </div>
    <input
      id={`form-file-${field.name}`}
      type="file"
      accept={field.accept || 'image/*'}
      style={{ display: 'none' }}
      onChange={(event) => onChange(field.name, event)}
    />
    {(preview || field.currentPreview) && <span className="shared widget modal form-file-name">{value?.name || 'Current file'}</span>}
  </div>
);

const SearchableMultiSelectField = ({ field, value = [] }) => (
  <div className="shared widget modal form-multi-select">
    <div className="shared widget modal form-multi-select-chips">
      {value.map((item, index) => (
        <span key={index} className="shared widget modal form-multi-select-chip">
          {item}
          <button
            type="button"
            className="shared widget modal form-multi-select-remove"
            onClick={() => field.onChange?.(value.filter((_, i) => i !== index))}
          >
            ×
          </button>
        </span>
      ))}
    </div>
    <Input
      type="text"
      placeholder={field.placeholder || 'Search...'}
      onChange={(event) => field.onSearch?.(event.target.value)}
      onFocus={() => field.onSearchFocus?.()}
      onBlur={() => setTimeout(() => field.onSearchBlur?.(), 200)}
      {...sharedInputProps}
    />
    {field.showDropdown && field.dropdownItems?.length > 0 && (
      <div className="shared widget modal form-multi-select-dropdown">
        {field.dropdownItems.slice(0, 10).map((item, index) => (
          <div key={index} className="shared widget modal form-multi-select-option" onClick={() => field.onItemSelect?.(item)}>
            <div className="shared widget modal form-multi-select-option-label">{item.label}</div>
            {item.subtitle && <div className="shared widget modal form-multi-select-option-subtitle">{item.subtitle}</div>}
          </div>
        ))}
        {field.dropdownItems.length > 10 && (
          <div className="shared widget modal form-multi-select-more">+{field.dropdownItems.length - 10} more results...</div>
        )}
      </div>
    )}
  </div>
);

const FormModal = ({
  isOpen,
  onClose,
  mode = DEFAULT_MODAL_MODE,
  title,
  message,
  formFields = [],
  formValues = {},
  onFormChange = () => { },
  onFileChange = () => { },
  fileValues = {},
  buttonText,
  onButtonClick,
  modalWidth,
  modalHeight,
  secondaryButtonText,
  onSecondaryClick,
}) => {
  const [filePreviews, setFilePreviews] = useState({});

  const handleFileChange = (fieldName, event) => {
    const file = event.target.files[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setFilePreviews((prev) => ({ ...prev, [fieldName]: preview }));
    onFileChange(fieldName, file);
  };

  const renderField = (field, index) => {
    switch (field.type) {
      case 'textarea':
        return (
          <Input
            type="textarea"
            value={formValues[field.name] || ''}
            onChange={(event) => onFormChange(field.name, event.target.value)}
            placeholder={field.placeholder}
            rows={field.rows || 3}
            {...sharedInputProps}
          />
        );
      case 'select':
        return (
          <Input
            type="select"
            value={formValues[field.name] || ''}
            onChange={(event) => onFormChange(field.name, event.target.value)}
            placeholder={field.placeholder || 'Select...'}
            options={field.options}
            {...sharedInputProps}
          />
        );
      case 'search-select':
        return (
          <Input
            type="search-select"
            value={formValues[field.name] || ''}
            onChange={(event) => onFormChange(field.name, event.target.value)}
            onFocus={field.onSearchFocus}
            placeholder={field.placeholder || 'Type to search or add new...'}
            options={field.options || []}
            disabled={field.disabled}
            {...sharedInputProps}
          />
        );
      case 'searchable-multi-select':
        return <SearchableMultiSelectField field={field} value={formValues[field.name]} />;
      case 'allow-add-select':
        return (
          <Input
            type="select"
            searchable
            value={formValues[field.name] || ''}
            onChange={(event) => onFormChange(field.name, event.target.value)}
            placeholder={field.placeholder || 'Select...'}
            options={[
              ...(field.options || []).map((option) => ({ label: option, value: option })),
              ...(formValues[field.name] && !(field.options || []).includes(formValues[field.name])
                ? [{ label: `Add "${formValues[field.name]}"`, value: formValues[field.name] }]
                : []),
            ]}
            {...sharedInputProps}
          />
        );
      case 'add-row-button':
        return (
          <div className="shared widget modal form-row-actions">
            <Button
              text={field.label || '+ Add'}
              type="button"
              variant="gradient"
              colorScheme="success-600"
              textColor="white-100"
              font="md"
              width="fit-content"
              height="56px"
              padding="0 20px"
              squircle="6xl"
              onClick={field.onAddRow}
            />
            {field.onRemoveRow && (
              <Button
                type="button"
                iconCenter="close"
                font="md"
                variant="solid"
                colorScheme="error-700"
                textColor="white-100"
                width="56px"
                height="56px"
                padding="0"
                squircle="6xl"
                onClick={field.onRemoveRow}
              />
            )}
          </div>
        );
      case 'file':
        return (
          <FileField
            field={field}
            value={fileValues[field.name]}
            preview={filePreviews[field.name]}
            onChange={handleFileChange}
          />
        );
      default:
        return (
          <Input
            type={field.type || 'text'}
            value={formValues[field.name] || ''}
            onChange={(event) => onFormChange(field.name, event.target.value)}
            placeholder={field.placeholder}
            spellCheck
            {...sharedInputProps}
          />
        );
    }
  };

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      mode={mode}
      type="form"
      title={title}
      showMessage={false}
      buttonText={buttonText}
      onButtonClick={onButtonClick}
      modalWidth={modalWidth}
      modalHeight={modalHeight}
      secondaryButtonText={secondaryButtonText || 'Reset'}
      onSecondaryClick={onSecondaryClick}
    >
      <div className="shared widget modal form-section">
        {message && <p className="shared widget modal message form-message">{message}</p>}
        <div
          className={`shared widget modal form-fields ${formFields.length === 1
            ? 'form-field-single'
            : formFields.length === 2
              ? 'form-field-double'
              : formFields.length === 3
                ? 'form-field-triple'
                : formFields.length >= 4
                  ? 'form-field-quad'
                  : ''
            }`}
        >
          {formFields.map((field, index) => (
            <div key={field.name || index} className={`shared widget modal form-field`}>
              <label className="shared widget modal form-label">
                {field.label}
                {field.required && <span className="shared widget modal form-required">*</span>}
              </label>
              {renderField(field, index)}
              {field.error && <div className="shared widget modal form-field-error">{field.error}</div>}
            </div>
          ))}
        </div>
      </div>
    </ModalBase>
  );
};

export default FormModal;
