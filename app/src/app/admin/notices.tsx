import { NOTICE_TAGS, Notice, NoticeTag, fmtDate } from '@shared/data';
import { useState } from 'react';
import { View } from 'react-native';
import { NewNotice } from '../../api';
import { useDeleteNotice, useNotices, useSaveNotice } from '../../api/hooks';
import { FormFooter, ItemActions } from '../../components/ContentForms';
import { Badge, BiField, Card, Heading, Loaded, Row, Screen, Select, Txt, useErrorText } from '../../components/ui';
import { useT } from '../../store';
import { C } from '../../theme';

const blank = { hi: '', en: '' };
const EMPTY_NOTICE: NewNotice = { tag: 'panchayat', title: blank, body: blank };

/** Publishes a new notice, or edits `notice`. */
function NoticeForm({ notice, onDone }: { notice?: Notice; onDone: (message: string) => void }) {
  const { t, tl } = useT();
  const save = useSaveNotice();
  const errorText = useErrorText();
  const [form, setForm] = useState<NewNotice>(notice ? { tag: notice.tag, title: notice.title, body: notice.body } : EMPTY_NOTICE);
  const [done, setDone] = useState('');
  const change = (patch: Partial<NewNotice>) => { setForm({ ...form, ...patch }); setDone(''); };
  const submit = () => save.mutate({ id: notice?.id, notice: form }, {
    onSuccess: () => {
      const message = notice ? t('सूचना अपडेट हो गई।', 'Notice updated.') : t('सूचना जारी हो गई। यह नागरिकों को “सूचनाएँ” में दिखेगी।', 'Notice published. Citizens will see it under “Updates”.');
      if (!notice) { setForm(EMPTY_NOTICE); setDone(message); }
      onDone(message);
    },
  });

  return (
    <View style={{ gap: 12 }}>
      <Select label={t('श्रेणी', 'Category')} required value={form.tag} options={NOTICE_TAGS.map((x) => ({ id: x.id, label: tl(x.name) }))} onChange={(v) => change({ tag: v as NoticeTag })} />
      <BiField label={t('शीर्षक', 'Title')} required value={form.title} onChange={(title) => change({ title })} placeholder={{ hi: 'जैसे: ग्राम सभा बैठक', en: 'e.g. Gram Sabha meeting' }} />
      <BiField label={t('विवरण', 'Details')} required multiline value={form.body} onChange={(body) => change({ body })} placeholder={{ hi: 'तारीख, समय और स्थान लिखें', en: 'Add the date, time and place' }} />
      <FormFooter
        editing={!!notice} saving={save.isPending} disabled={!form.title.hi.trim() || !form.body.hi.trim()} color={C.purple}
        saveLabel={t('सूचना जारी करें', 'Publish notice')} error={save.isError ? errorText(save.error) : undefined} done={done}
        onSave={submit} onCancel={() => onDone('')}
      />
    </View>
  );
}

export default function AdminNotices() {
  const { t, tl } = useT();
  const notices = useNotices();
  const remove = useDeleteNotice();
  const errorText = useErrorText();
  const [editId, setEditId] = useState<string>();
  const [updated, setUpdated] = useState<{ id: string; text: string }>();

  return (
    <Screen back icon="bell-outline" title={t('सूचनाएँ / नोटिफिकेशन', 'Notices / Notifications')} subtitle={t('गाँव के लिए सूचना जारी करें, बदलें या हटाएँ', 'Publish, edit or remove notices for the village')}>
      <Card style={{ gap: 12 }}>
        <Txt w="b" size={16} color={C.navy}>{t('नई सूचना', 'New notice')}</Txt>
        <NoticeForm onDone={() => {}} />
      </Card>
      <Loaded q={notices}>
        {(list) => (
          <>
            <Heading>{t('जारी सूचनाएँ', 'Published notices')} ({list.length})</Heading>
            {list.map((n) => (
              <Card key={n.id} style={{ gap: 4, borderColor: n.id === editId ? C.purple : C.border, borderWidth: n.id === editId ? 2 : 1 }}>
                {n.id === editId ? (
                  <>
                    <Txt w="b" size={16} color={C.purple}>{t('सूचना बदलें', 'Edit notice')}</Txt>
                    <NoticeForm notice={n} onDone={(text) => { setEditId(undefined); if (text) setUpdated({ id: n.id, text }); }} />
                  </>
                ) : (
                  <>
                    <Row style={{ alignItems: 'flex-start' }}>
                      <Txt w="b" size={15} style={{ flex: 1 }}>{tl(n.title)}</Txt>
                      <Badge label={tl(NOTICE_TAGS.find((x) => x.id === n.tag)!.name)} color={n.color} soft={n.soft} />
                    </Row>
                    <Txt size={14} color={C.sub}>{tl(n.body)}</Txt>
                    <Txt size={12} color={C.faint}>{t('जारी', 'Published')} {fmtDate(n.publishedAt)}{n.updatedAt ? `  •  ${t('अपडेट', 'updated')} ${fmtDate(n.updatedAt)}` : ''}</Txt>
                    {updated?.id === n.id ? <Txt w="sb" size={13} color={C.green}>{updated.text}</Txt> : null}
                    <ItemActions
                      busy={remove.isPending && remove.variables === n.id} error={remove.isError && remove.variables === n.id ? errorText(remove.error) : undefined}
                      deleteQuestion={t(`“${tl(n.title)}” सूचना हटाएँ?`, `Remove the notice “${tl(n.title)}”?`)}
                      onEdit={() => { setEditId(n.id); setUpdated(undefined); }}
                      onDelete={() => remove.mutate(n.id)}
                    />
                  </>
                )}
              </Card>
            ))}
          </>
        )}
      </Loaded>
    </Screen>
  );
}
