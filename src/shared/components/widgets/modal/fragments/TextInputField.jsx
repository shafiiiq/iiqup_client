import React from 'react';
import Input from '@/shared/components/widgets/input/Input';

const TextInputField = ({ label, value, onChange, placeholder, maxLength, error, autoFocus = true }) => (
  <div className="shared widget modal input-section">
    {label && <p className="shared widget modal message input-label">{label}</p>}
    <Input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      autoFocus={autoFocus}
      colorScheme="primary-100"
      variant="filled"
      height="57px"
      fontSize="xl"
      placeholderColor="black-100"
      inputPaddingInline="2xl"
      fontWeight="500"
      squircle="10xl"
      fullWidth
    />
    {error && <div className="shared widget modal input-error">{error}</div>}
  </div>
);

export default TextInputField;
