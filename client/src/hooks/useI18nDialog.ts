import { useTranslation } from 'react-i18next';

export const useI18nDialog = () => {
  const { t } = useTranslation();

  return {
    // Translated alert
    alert: (messageKey: string, options?: any) => {
      alert(t(messageKey, options));
    },

    // Translated confirm
    confirm: (messageKey: string, options?: any): boolean => {
      return confirm(t(messageKey, options));
    },

    // Common dialog messages
    common: {
      confirmDelete: (itemName?: string): boolean => {
        return confirm(t('dialog.confirmDelete', { item: itemName || t('common.item') }));
      },

      confirmSave: (): boolean => {
        return confirm(t('dialog.confirmSave'));
      },

      confirmCancel: (): boolean => {
        return confirm(t('dialog.confirmCancel'));
      },

      confirmReplace: (): boolean => {
        return confirm(t('dialog.confirmReplace'));
      },

      alertFileTooBig: (maxSize: string) => {
        alert(t('dialog.fileTooBig', { maxSize }));
      },

      alertInvalidFile: (allowedTypes: string) => {
        alert(t('dialog.invalidFileType', { allowedTypes }));
      },

      alertUploadInProgress: () => {
        alert(t('dialog.uploadInProgress'));
      },

      alertInvalidFiles: (fileList: string[]) => {
        alert(t('dialog.invalidFiles') + ':\n' + fileList.join('\n'));
      }
    }
  };
};