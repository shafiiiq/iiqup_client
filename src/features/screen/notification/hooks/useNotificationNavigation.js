import { useCallback } from 'react';
import { navigateToScreen } from '@/features/core/platform/navigation/screen.router';
import { useAlert } from '@/shared/context/AlertContext';

export const useNotificationNavigation = () => {
  const { showAlert } = useAlert();

  const handleActionPress = useCallback(
    (action) => {
      const isOpened = navigateToScreen({ screenKey: action.screenKey, documentId: action.documentId });
      if (!isOpened) showAlert('This item cannot be opened on web', 'error', '--color-primary');
    },
    [showAlert]
  );

  return { handleActionPress };
};