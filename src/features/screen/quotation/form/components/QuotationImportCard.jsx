import { useEffect, useRef, useState } from 'react';

import A2PaperSkeleton from '@/shared/components/widgets/paper/A2PaperSkeleton';

import { ReportData } from '../../report/components/QuotationReport';
import { buildReportViews } from '../../report/helper/quotation.report.helper';
import { DEFAULT_SIGNATURE_FLAGS, DEFAULT_SIGNATURE_STATES } from '../../report/constants/quotation.report.constant';
import { getQuotationByRef } from '../api/quotation.form.api';

function QuotationImportCard({ quotation, onSelect }) {
  const cardRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [views, setViews] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '800px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return undefined;
    let cancelled = false;
    const load = async () => {
      try {
        const data = await getQuotationByRef(quotation.quotationRef);
        if (cancelled) return;
        if (data.success && data.data) setViews(buildReportViews(data.data));
        else setFailed(true);
      } catch (error) {
        console.error('[QuotationImportCard] load error:', error);
        if (!cancelled) setFailed(true);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [visible, quotation.quotationRef]);

  return (
    <div
      ref={cardRef}
      className="features screen quotation import card"
      onClick={() => onSelect(quotation.quotationRef)}
    >
      <div className="features screen quotation import card-bar">
        <span className="features screen quotation import card-ref">{quotation.quotationRef}</span>
        <span>{quotation.company?.vendor}</span>
        <span className="features screen quotation import card-hint">Click to import</span>
      </div>

      {views ? (
        <>
          <ReportData data={views.builtData} signatureFlags={DEFAULT_SIGNATURE_FLAGS} signatureStates={DEFAULT_SIGNATURE_STATES} />
          {views.amendmentData && (
            <>
              <div className="features screen quotation report amendment-divider">===== AMENDED DOCUMENT FOLLOWS =====</div>
              <ReportData data={views.amendmentData} signatureFlags={DEFAULT_SIGNATURE_FLAGS} signatureStates={DEFAULT_SIGNATURE_STATES} />
            </>
          )}
        </>
      ) : failed ? (
        <div className="features screen quotation import card-error">Failed to load this quotation</div>
      ) : (
        <A2PaperSkeleton />
      )}
    </div>
  );
}

export default QuotationImportCard;