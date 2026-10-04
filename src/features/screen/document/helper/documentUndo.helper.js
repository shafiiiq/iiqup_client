import {
  trashItems,
  restoreTrashItems,
  moveDocument,
  moveFolder,
  renameDocument,
  renameFolder,
  updateDocumentDates,
  setDocumentRenewalStatus,
} from '../api/document.api';
import { RENEWAL_STATUS } from '../constants/document.constant';
import { runBulkActionsOrThrow } from './document.helper';

export const buildUndoByTrashOperation = ({ label, documentIds, folderIds }) => ({
  label,
  undo: () => trashItems({ documentIds, folderIds }),
  redo: () => restoreTrashItems({ documentIds, folderIds }),
});

export const buildUndoByRestoreOperation = ({ label, documentIds, folderIds }) => ({
  label,
  undo: () => restoreTrashItems({ documentIds, folderIds }),
  redo: () => trashItems({ documentIds, folderIds }),
});

export const buildMoveOperation = ({ label, documentMoves, folderMoves }) => {
  const applyMoves = (targetKey) =>
    runBulkActionsOrThrow([
      ...documentMoves.map(
        (move) => () => moveDocument({ documentId: move.id, folderId: move[targetKey].folderId, area: move[targetKey].area })
      ),
      ...folderMoves.map(
        (move) => () => moveFolder({ folderId: move.id, parentFolderId: move[targetKey].folderId, area: move[targetKey].area })
      ),
    ]);
  return { label, undo: () => applyMoves('from'), redo: () => applyMoves('to') };
};

export const buildRenameOperation = ({ kind, id, previousName, nextName }) => {
  const applyName = (name) =>
    kind === 'folder' ? renameFolder({ folderId: id, name }) : renameDocument({ documentId: id, newFileName: name });
  return {
    label: `Rename "${previousName}"`,
    undo: () => applyName(previousName),
    redo: () => applyName(nextName),
  };
};

export const buildDatesOperation = ({ documentId, label, previousDates, nextDates }) => ({
  label,
  undo: () => updateDocumentDates({ documentId, ...previousDates }),
  redo: () => updateDocumentDates({ documentId, ...nextDates }),
});

export const buildRenewOperation = ({ label, renewedDocumentId, previousDocumentId, previousStatus }) => ({
  label,
  undo: async () => {
    await trashItems({ documentIds: [renewedDocumentId], folderIds: [] });
    await setDocumentRenewalStatus({ documentId: previousDocumentId, renewalStatus: previousStatus });
  },
  redo: async () => {
    await restoreTrashItems({ documentIds: [renewedDocumentId], folderIds: [] });
    await setDocumentRenewalStatus({ documentId: previousDocumentId, renewalStatus: RENEWAL_STATUS.EXPIRED });
  },
});