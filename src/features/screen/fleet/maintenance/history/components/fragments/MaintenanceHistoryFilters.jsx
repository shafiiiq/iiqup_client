function MaintenanceHistoryFilters({ fields, values, onChange, onApply, onReset }) {
  return (
    <div className="equipment maintenance history filters form">
      {fields.map((field) => {
        if (field.visibleWhen && !field.visibleWhen(values)) return null;

        return (
          <div key={field.name} className="equipment maintenance history filters field">
            <label className="equipment maintenance history filters label" htmlFor={`history-filter-${field.name}`}>
              {field.label}
            </label>

            {field.type === 'select' ? (
              <select
                id={`history-filter-${field.name}`}
                className="equipment maintenance history filters select"
                value={values[field.name]}
                onChange={(event) => onChange(field.name, event.target.value)}
              >
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            ) : (
              <input
                id={`history-filter-${field.name}`}
                className="equipment maintenance history filters input"
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

      <div className="equipment maintenance history filters actions">
        <button type="button" className="equipment maintenance history filters apply" onClick={onApply}>
          Apply
        </button>
        <button type="button" className="equipment maintenance history filters reset" onClick={onReset}>
          Reset
        </button>
      </div>
    </div>
  );
}

export default MaintenanceHistoryFilters;