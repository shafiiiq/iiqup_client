import { useState } from 'react';
import { MESSAGE_RECORDING_KEY } from '../../constants/notification.composer';
import { useComposerActionMode } from '../../hooks/useComposerActionMode';
import { isMediaField } from '../../utils/notification.distribution.fields';
import ComposerActionButton from './ComposerActionButton';
import ComposerAttachmentStrip from './ComposerAttachmentStrip';
import ComposerDistributionMediaRow from './ComposerDistributionMediaRow';
import ComposerFullTextModal from './ComposerFullTextModal';
import ComposerInputBar from './ComposerInputBar';
import NotificationActiveChip from './NotificationActiveChip';
import NotificationAttachSheet from './NotificationAttachSheet';
import NotificationFeatureDocumentPicker from './NotificationFeatureDocumentPicker';
import NotificationFeatureLinkChips from './NotificationFeatureLinkChips';
import NotificationSuggestionList from './NotificationSuggestionList';

const NotificationComposerPanel = ({ composer }) => {
  const actionMode = useComposerActionMode();
  const [isAttachSheetOpen, setIsAttachSheetOpen] = useState(false);
  const [isFullTextOpen, setIsFullTextOpen] = useState(false);

  if (!composer.isOpen) return null;

  const { activeDistribution } = composer;
  const mediaFields = activeDistribution?.fields.filter(isMediaField) ?? [];
  const isRecordingMessage = composer.recordingFieldKey === MESSAGE_RECORDING_KEY;
  const effectiveMode = activeDistribution ? 'send' : actionMode.mode;

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) composer.submit();
  };

  return (
    <div className="features screen notification composer-overlay">
      <div className="features screen notification composer-backdrop" onClick={composer.close} />
      <div className="features screen notification composer-panel">
        {composer.errorMessage && <span className="features screen notification error-text">{composer.errorMessage}</span>}

        <NotificationSuggestionList
          suggestions={composer.categorySuggestions}
          getKey={(suggestion) => `${suggestion.key}:${suggestion.label}`}
          renderLabel={(suggestion) => (
            <>
              <strong>{suggestion.isNew ? `Create "${suggestion.label}"` : suggestion.label}</strong>
              <span>/{suggestion.isNew ? suggestion.label : suggestion.key}</span>
            </>
          )}
          onSelect={composer.selectCategory}
        />

        <NotificationSuggestionList
          suggestions={composer.distributionSuggestions}
          getKey={(distribution) => distribution.key}
          renderLabel={(distribution) => (
            <>
              <strong>{distribution.label}</strong>
              <span>//{distribution.key}</span>
            </>
          )}
          onSelect={composer.selectDistribution}
        />

        <NotificationSuggestionList
          suggestions={composer.fieldSuggestions}
          getKey={(suggestion) => suggestion.value}
          renderLabel={(suggestion) => <strong>{suggestion.label}</strong>}
          onSelect={composer.selectFieldSuggestion}
        />

        <NotificationSuggestionList
          suggestions={composer.featureSuggestions}
          getKey={(feature) => feature.key}
          renderLabel={(feature) => (
            <>
              <strong>{feature.label}</strong>
              <span>#{feature.key}</span>
            </>
          )}
          onSelect={composer.selectFeature}
        />

        <NotificationFeatureLinkChips links={composer.featureLinks} onRemove={composer.removeFeatureLink} />

        <NotificationSuggestionList
          suggestions={composer.mentionSuggestions}
          getKey={(candidate) => candidate.uniqueCode}
          renderLabel={(candidate) => (
            <>
              <strong>{candidate.name}</strong>
              {candidate.designation && <span>{candidate.designation}</span>}
            </>
          )}
          onSelect={composer.selectMention}
        />

        {composer.categoryLabel && !activeDistribution && (
          <NotificationActiveChip label={`/${composer.categoryLabel}`} onClear={composer.clearCategory} />
        )}

        {activeDistribution && (
          <NotificationActiveChip label={activeDistribution.label} onClear={composer.clearDistribution} />
        )}

        <ComposerDistributionMediaRow composer={composer} mediaFields={mediaFields} />

        <ComposerAttachmentStrip
          files={!activeDistribution || activeDistribution.allowsAttachments ? composer.attachments : []}
          onRemove={composer.removeAttachment}
        />

        <ComposerInputBar
          text={composer.text}
          selection={composer.selection}
          placeholder={
            activeDistribution ? 'Fill the fields' : 'Message... @ mention, /category, #document, //feature'
          }
          isEditable={!composer.isSubmitting}
          showAttach={!activeDistribution || activeDistribution.allowsAttachments}
          ghostLines={composer.distributionGhostLines}
          onChangeText={composer.changeText}
          onSelectionChange={composer.changeSelection}
          onSelectionApplied={composer.clearSelection}
          onKeyDown={handleKeyDown}
          onPressAttach={() => setIsAttachSheetOpen(true)}
          onPressExpand={() => setIsFullTextOpen(true)}
        >
          <ComposerActionButton
            mode={effectiveMode}
            isRecording={isRecordingMessage}
            isSubmitting={composer.isSubmitting}
            onPress={() => (effectiveMode === 'voice' ? composer.toggleMessageRecording() : composer.submit())}
            onLongPress={actionMode.toggleMode}
          />
        </ComposerInputBar>

        <NotificationAttachSheet
          isVisible={isAttachSheetOpen}
          onClose={() => setIsAttachSheetOpen(false)}
          onPickMedia={composer.pickMessageMedia}
          onPickDocument={composer.pickMessageDocument}
        />

        <NotificationFeatureDocumentPicker
          feature={composer.pickerFeature}
          attachedLinks={composer.featureLinks}
          onAttach={composer.attachFeatureLink}
          onClose={composer.closeFeaturePicker}
        />

        <ComposerFullTextModal
          isVisible={isFullTextOpen}
          text={composer.text}
          ghostLines={composer.distributionGhostLines}
          selection={composer.selection}
          onChangeText={composer.changeText}
          onSelectionChange={composer.changeSelection}
          onSelectionApplied={composer.clearSelection}
          onClose={() => setIsFullTextOpen(false)}
        />
      </div>
    </div>
  );
};

export default NotificationComposerPanel;