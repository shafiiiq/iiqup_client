function ListFilters({ fields, values, onChange, onApply, onReset }) {
  return (
    <div className="fleet maintenance list filters form">
      {fields.map((field) => {
        if (field.visibleWhen && !field.visibleWhen(values)) return null;

        return (
          <div key={field.name} className="fleet maintenance list filters field">
            <label className="fleet maintenance list filters label" htmlFor={`maintenance-filter-${field.name}`}>
              {field.label}
            </label>

            {field.type === 'select' ? (
              <select
                id={`maintenance-filter-${field.name}`}
                className="fleet maintenance list filters select"
                value={values[field.name]}
                onChange={(event) => onChange(field.name, event.target.value)}
              >
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            ) : (
              <input
                id={`maintenance-filter-${field.name}`}
                className="fleet maintenance list filters input"
                type={field.type}
                value={values[field.name] ?? ''}
                onChange={(event) =>
                  onChange(field.name, field.type === 'number' ? Number(event.target.value) : event.target.value)
                }
              />
            )}
          </div>
        );
      })}

      <div className="fleet maintenance list filters actions">
        <button type="button" className="fleet maintenance list filters apply" onClick={onApply}>
          Apply
        </button>
        <button type="button" className="fleet maintenance list filters reset" onClick={onReset}>
          Reset
        </button>
      </div>
    </div>
  );
}

export default ListFilters;