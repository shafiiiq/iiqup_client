import { renderComponentIcon } from '@/shared/components/icons/icon.render';
import './SignatureSlotContent.css';

const SIGN_ICON_SIZE = 72;
const SIGN_ICON_COLOR = '#7e2828';

const resolveMarkerText = (slot) => {
    if (slot.isContentIntact === false) return 'Modified after signing';
    if (slot.isSigned && slot.isLegacy) return 'Signed';
    if (slot.hasPendingDelegation) return 'Waiting for approval';
    return '';
};

function SignatureSlotContent({ slot, alt, onSign, isSigning = false, imageClassName = '' }) {
    if (!slot) return null;

    const showImage = slot.isSigned && slot.imageUrl && slot.isContentIntact !== false;
    const canAct = !slot.isSigned && onSign && (slot.canSign || slot.canRequestDelegation);

    if (showImage) {
        return (
            <img
                className={imageClassName}
                src={slot.imageUrl}
                alt={alt}
                crossOrigin="anonymous"
                onError={(event) => { event.target.style.display = 'none'; }}
            />
        );
    }

    if (canAct) {
        return (
            <button
                type="button"
                className="shared signature slot button no-print"
                onClick={() => onSign(slot.slotId)}
                disabled={isSigning}
                title={slot.canSign ? 'Sign here' : 'Request permission to sign'}
            >
                {renderComponentIcon('SignaturePenIcon', SIGN_ICON_SIZE, SIGN_ICON_COLOR)}
            </button>
        );
    }

    return <span className="shared signature slot marker">{resolveMarkerText(slot)}</span>;
}

export default SignatureSlotContent;