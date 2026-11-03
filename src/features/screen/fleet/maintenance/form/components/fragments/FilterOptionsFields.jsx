import Input from '@/shared/components/widgets/input/Input';
import { OIL_FILTER_OPTIONS, INPUT_PROPS } from '../../constants/maintenance.form.constant';

function FilterOptionsFields({ formData, onChange }) {
  return (
    <div className="fleet maintenance form grid">
      {OIL_FILTER_OPTIONS.map(({ key, label, options }) => (
        <div key={key} className="fleet maintenance form field">
          <Input
            {...INPUT_PROPS}
            type="select"
            id={key}
            name={key}
            value={formData[key]}
            onChange={onChange}
            label={label}
            options={options.map((option) => ({ value: option, label: option }))}
          />
        </div>
      ))}
    </div>
  );
}

export default FilterOptionsFields;