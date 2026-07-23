// ─────────────────────────────────────────────────────────────────────────────
// FormNavigation.jsx — Service type selection hub.
// Presents a card grid letting the user pick which history entry form to open
// for the current equipment (regNo). All cards navigate to the unified
// ServiceHistoryEntryForm via /service-history-form/:type/:regNo.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect }               from 'react';
import { useNavigate, useParams }  from 'react-router-dom';

import { useHeaderTitle } from '../../Context/HeaderTitleContext';

import BatteryService from '../../assets/images/battery-service.png';
import OilService     from '../../assets/images/oil-service.png';
import NormalService  from '../../assets/images/normal-service.jpg';
import TyreService    from '../../assets/images/tyre-service.jpg';
import MajorWork      from '../../assets/images/major-service.jpg';

import './FormNavigation.css';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ordered list of service type navigation cards.
 * `type` must match a key in ServiceHistoryEntryForm's TYPE_CONFIG.
 *
 * @type {{ title: string, description: string, type: string, image: string }[]}
 */
const NAV_ITEMS = [
  { title: 'Normal Service',  description: 'Manage normal service records',                     type: 'normal',  image: NormalService  },
  { title: 'Oil Service',     description: 'Manage oil service records',                        type: 'oil',     image: OilService     },
  { title: 'Battery Service', description: 'Track battery maintenance and replacements',        type: 'battery', image: BatteryService },
  { title: 'Tyre Service',    description: 'Monitor tyre changes and replacements',             type: 'tyre',    image: TyreService    },
  { title: 'Major Works',     description: 'Complete maintenance or major records and reports', type: 'major',   image: MajorWork      },
];

// ─────────────────────────────────────────────────────────────────────────────
// FormNavigation — Main Component
// ─────────────────────────────────────────────────────────────────────────────

function FormNavigation() {
  const navigate                              = useNavigate();
  const { regNo, complaintId }                = useParams();
  const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();

  // ── Effect: Set header title on mount ─────────────────────────────────────

  useEffect(() => {
    setHeaderTitle('Select the Service Type');
    setHeaderSubtitle(regNo || '');

    return () => { setHeaderTitle(null); setHeaderSubtitle(null); };
  }, [regNo, setHeaderTitle, setHeaderSubtitle]);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="form-nav-container">
      <div className="form-nav-grid">
        {NAV_ITEMS.map((item) => (
          <div
            key={item.type}
            className="form-nav-card"
            onClick={() => navigate(`/service-history-form/${item.type}/${regNo}${complaintId ? `/${complaintId}` : ''}`)}
          >
            <div className="form-nav-card-image-wrapper">
              <img src={item.image} alt={item.title} className="form-nav-card-image" />
            </div>
            <div className="form-nav-card-header">
              <h3 className="form-nav-card-title">{item.title}</h3>
            </div>
            <p className="form-nav-card-description">{item.description}</p>
            <div className="form-nav-card-arrow">→</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FormNavigation;