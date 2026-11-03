import Button from '@/shared/components/widgets/button/Button';
import Input from '@/shared/components/widgets/input/Input';
import { ROW_INPUT_PROPS, BUTTON_PROPS } from '../../constants/maintenance.form.constant';

function ServiceRowsSection({ rows, showFullService, canManageRows, onRowChange, onAddRow, onRemoveRow }) {
  return (
    <div className="fleet maintenance form section">
      <h3 className="fleet maintenance form section-title">Service Rows</h3>

      <div className="fleet maintenance form rows-table-container">
        <table className="fleet maintenance form rows-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Service Date</th>
              <th>Service Hrs / Km</th>
              <th>Next Service Hrs / Km</th>
              {showFullService && <th>Full Service</th>}
              {canManageRows && <th />}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id}>
                <td>{index + 1}</td>
                <td>
                  <Input {...ROW_INPUT_PROPS} type="date" id={`date-${row.id}`} name="date" value={row.date} onChange={(event) => onRowChange(row.id, 'date', event.target.value)} />
                </td>
                <td>
                  <Input {...ROW_INPUT_PROPS} type="text" id={`serviceHrs-${row.id}`} name="serviceHrs" value={row.serviceHrs} placeholder="e.g. 1000HRS" onChange={(event) => onRowChange(row.id, 'serviceHrs', event.target.value)} />
                </td>
                <td>
                  <Input {...ROW_INPUT_PROPS} type="text" id={`nextServiceHrs-${row.id}`} name="nextServiceHrs" value={row.nextServiceHrs} placeholder="Auto-calculated" onChange={(event) => onRowChange(row.id, 'nextServiceHrs', event.target.value.toUpperCase())} />
                </td>
                {showFullService && (
                  <td>
                    <Input
                      {...ROW_INPUT_PROPS}
                      type="select"
                      id={`fullService-${row.id}`}
                      name="fullService"
                      value={String(row.fullService)}
                      onChange={(event) => onRowChange(row.id, 'fullService', event.target.value === 'true')}
                      options={[{ value: 'false', label: 'No' }, { value: 'true', label: 'Yes' }]}
                    />
                  </td>
                )}
                {canManageRows && (
                  <td>
                    <Button
                      {...BUTTON_PROPS}
                      width="fit-content"
                      componentIconCenter="IconlyDelete"
                      componentIconSize={30}
                      colorScheme="error-700"
                      iconColor="error-200"
                      padding="0"
                      disabled={rows.length === 1}
                      onClick={() => onRemoveRow(row.id)}
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {canManageRows && (
        <div className="fleet maintenance form rows-actions">
          <Button {...BUTTON_PROPS} width="180px" text="Add Row" componentIconLeft="IconlyPlus" componentIconSize="25" iconColor="white-200" colorScheme="success-800" textColor="white-200" onClick={onAddRow} />
        </div>
      )}
    </div>
  );
}

export default ServiceRowsSection;