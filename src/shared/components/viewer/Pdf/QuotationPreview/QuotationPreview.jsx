import './QuotationPreview.css';

function QuotationPreview({ url, mimeType }) {
  return (
    <div className="quotation-preview">
      {mimeType === 'application/pdf' ? (
        <iframe src={url} title="Quotation Reference" className="quotation-preview-frame" />
      ) : (
        <img src={url} alt="Quotation Reference" className="quotation-preview-image" />
      )}
    </div>
  );
}

export default QuotationPreview;