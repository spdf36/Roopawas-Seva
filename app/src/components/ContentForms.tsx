import { ReactNode } from 'react';
import { useT } from '../store';
import { C } from '../theme';
import { Btn, ConfirmBtn, ErrorText, OkText, Row } from './ui';

// Shared pieces of the staff content screens (notices, schemes, yojnas).

/** Edit / delete buttons shown on each managed item, with the error of a failed delete below them. */
export function ItemActions({ onEdit, onDelete, deleteQuestion, busy, error, children }: {
  onEdit: () => void; onDelete: () => void; deleteQuestion: string; busy: boolean; error?: string; children?: ReactNode;
}) {
  const { t } = useT();
  return (
    <>
      <Row wrap style={{ marginTop: 4 }}>
        <Btn small outline icon="pencil" label={t('बदलें', 'Edit')} onPress={onEdit} />
        {children}
        <ConfirmBtn label={t('हटाएँ', 'Delete')} question={deleteQuestion} busy={busy} onConfirm={onDelete} />
      </Row>
      <ErrorText text={error} />
    </>
  );
}

/** Save and (while editing) cancel buttons for a content form, with its outcome below. */
export function FormFooter({ editing, saving, disabled, color, saveLabel, error, done, onSave, onCancel }: {
  editing: boolean; saving: boolean; disabled?: boolean; color: string; saveLabel: string; error?: string; done?: string;
  onSave: () => void; onCancel: () => void;
}) {
  const { t } = useT();
  return (
    <>
      <ErrorText text={error} />
      <Btn color={color} icon={editing ? 'content-save-outline' : 'plus'} label={editing ? t('बदलाव सेव करें', 'Save changes') : saveLabel} busy={saving} disabled={disabled} onPress={onSave} />
      {editing ? <Btn outline color={C.sub} label={t('रद्द करें', 'Cancel')} onPress={onCancel} /> : null}
      <OkText text={done} />
    </>
  );
}
