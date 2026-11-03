import Modal from '@/shared/components/widgets/modal/Modal';

const buildSummaryMessage = (summary) => {
  const lines = [`Signed: ${summary.signed}`];
  if (summary.skipped > 0) {
    lines.push(`Skipped (already signed, not your turn, or earlier positions unsigned): ${summary.skipped}`);
  }
  if (summary.failed > 0) lines.push(`Failed: ${summary.failed}`);
  if (summary.needsActivation) lines.push('This browser must be activated again before signing more.');
  return lines.join('\n');
};

function SignAllModals({ flow, entityLabel }) {
  const isPlural = flow.pendingCount !== 1;
  const progressPercent = flow.progress.total > 0 ? Math.round((flow.progress.done / flow.progress.total) * 100) : 0;
  const hasSummaryProblem = Boolean(flow.summary) && (flow.summary.failed > 0 || flow.summary.needsActivation);

  return (
    <>
      <Modal
        isOpen={flow.isConfirmOpen}
        onClose={flow.cancelConfirm}
        type="warning"
        title="Sign All"
        message={`Sign ${flow.pendingCount} ${entityLabel}${isPlural ? 's' : ''} with your signature? This action cannot be undone.`}
        buttonText="Sign All"
        onButtonClick={flow.confirmSignAll}
        secondaryButtonText="Cancel"
        onSecondaryClick={flow.cancelConfirm}
      />

      <Modal
        isOpen={flow.isSigningAll}
        onClose={() => { }}
        type="progress"
        title="Signing..."
        message={`Signed ${flow.progress.done} of ${flow.progress.total}`}
        progress={progressPercent}
        preventClose
      />

      <Modal
        isOpen={Boolean(flow.summary)}
        onClose={flow.closeSummary}
        type={hasSummaryProblem ? 'warning' : 'success'}
        title="Sign All Finished"
        message={flow.summary ? buildSummaryMessage(flow.summary) : ''}
        buttonText="OK"
        onButtonClick={flow.closeSummary}
      />

      <Modal
        isOpen={Boolean(flow.notice)}
        onClose={flow.closeNotice}
        type="warning"
        title={flow.notice?.title || ''}
        message={flow.notice?.message || ''}
        buttonText="OK"
        onButtonClick={flow.closeNotice}
      />
    </>
  );
}

export default SignAllModals;