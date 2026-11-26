import { richHtml } from '@/shared/components/widgets/input/richText';
import { hasMarkup, splitHeaderLabel, decodeHeaderLabelEntities } from '../helper/quotation.header.label.helper';

function QuotationHeaderLabel({ label }) {
  if (hasMarkup(label)) return <span dangerouslySetInnerHTML={richHtml(label)} />;

  return splitHeaderLabel(decodeHeaderLabelEntities(label)).map((line, index, lines) => (
    <span key={index}>
      {line}
      {index < lines.length - 1 && <br />}
    </span>
  ));
}

export default QuotationHeaderLabel;