import { useEffect, useRef, useState } from 'react';

import A2PaperSkeleton from '@/shared/components/widgets/paper/A2PaperSkeleton';

import { ReportData } from '../../report/components/HireOrderReport';
import { getHireOrderByRef } from '../api/hire.order.form.api';
import { buildHireOrderPreviewViews } from '../helper/hire.order.import.helper';

const EMPTY_SIGNATURE_SLOTS = {};

function HireOrderImportCard({ hireOrder, onSelect }) {
  const cardRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [views, setViews] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const element = cardRef.current;
    if (!element) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '800px' }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return undefined;
    let cancelled = false;
    const load = async () => {
      try {
        const data = await getHireOrderByRef(hireOrder.hireOrderRef);
        if (cancelled) return;
        if (data.success && data.data) setViews(buildHireOrderPreviewViews(data.data));
        else setFailed(true);
      } catch (error) {
        console.error('[HireOrderImportCard] load error:', error);
        if (!cancelled) setFailed(true);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [visible, hireOrder.hireOrderRef]);

  return (
    <div
      ref={cardRef}
      className="features screen hire order import card"
      onClick={() => onSelect(hireOrder.hireOrderRef)}
    >
      <div className="features screen hire order import card-bar">
        <span className="features screen hire order import card-ref">{hireOrder.hireOrderRef}</span>
        <span>{hireOrder.company?.vendor}</span>
        <span className="features screen hire order import card-hint">Click to import</span>
      </div>

      {views ? (
        <>
          <ReportData data={views.original} signatureSlots={EMPTY_SIGNATURE_SLOTS} />
          {views.amended && (
            <>
              <div className="features screen hire order report amendment-divider">===== AMENDED DOCUMENT FOLLOWS =====</div>
              <ReportData data={views.amended} signatureSlots={EMPTY_SIGNATURE_SLOTS} />
            </>
          )}
        </>
      ) : failed ? (
        <div className="features screen hire order import card-error">Failed to load this hire order</div>
      ) : (
        <A2PaperSkeleton />
      )}
    </div>
  );
}

export default HireOrderImportCard;