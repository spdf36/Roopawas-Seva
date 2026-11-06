import { DEPARTMENTS, SCHEME_GROUPS, Scheme } from '@shared/data';
import { useState } from 'react';
import { Switch, View } from 'react-native';
import { ApiError, SchemeInput } from '../../api';
import { useDeleteScheme, useSaveScheme, useSchemes } from '../../api/hooks';
import { FormFooter, ItemActions } from '../../components/ContentForms';
import { Badge, BiField, Btn, Bubble, Card, Loaded, Row, Screen, Select, Txt, useErrorText } from '../../components/ui';
import { useT } from '../../store';
import { C } from '../../theme';

const blank = { hi: '', en: '' };
const EMPTY_SCHEME: SchemeInput = { groupId: 'student', dept: 'education', name: blank, desc: blank, open: true };

/** Adds a scheme, or edits `scheme`. */
function SchemeForm({ scheme, onDone }: { scheme?: Scheme; onDone: () => void }) {
  const { t, tl } = useT();
  const save = useSaveScheme();
  const errorText = useErrorText();
  const [form, setForm] = useState<SchemeInput>(scheme ? { groupId: scheme.groupId, dept: scheme.dept, name: scheme.name, desc: scheme.desc, open: scheme.open } : EMPTY_SCHEME);
  const [done, setDone] = useState('');
  const change = (patch: Partial<SchemeInput>) => { setForm({ ...form, ...patch }); setDone(''); };
  const submit = () => save.mutate({ id: scheme?.id, scheme: form }, {
    onSuccess: () => {
      if (!scheme) { setForm(EMPTY_SCHEME); setDone(t('योजना जुड़ गई। नागरिक अब इसके लिए आवेदन कर सकते हैं।', 'Scheme added. Citizens can now apply for it.')); }
      onDone();
    },
  });

  return (
    <View style={{ gap: 12 }}>
      <Select label={t('वर्ग', 'Group')} required value={form.groupId} options={SCHEME_GROUPS.map((g) => ({ id: g.id, label: tl(g.name) }))} onChange={(groupId) => change({ groupId })} />
      <Select label={t('विभाग', 'Department')} required value={form.dept} options={Object.entries(DEPARTMENTS).map(([id, name]) => ({ id, label: tl(name) }))} onChange={(dept) => change({ dept })} />
      <BiField label={t('योजना का नाम', 'Scheme name')} required value={form.name} onChange={(name) => change({ name })} />
      <BiField label={t('विवरण', 'Description')} required multiline value={form.desc} onChange={(desc) => change({ desc })} />
      <Row>
        <Switch value={form.open} onValueChange={(open) => change({ open })} trackColor={{ true: C.green, false: C.border }} />
        <Txt size={15}>{t('आवेदन के लिए खुली', 'Open for applications')}</Txt>
      </Row>
      <FormFooter
        editing={!!scheme} saving={save.isPending} disabled={!form.name.hi.trim() || !form.desc.hi.trim()} color={C.orange}
        saveLabel={t('योजना जोड़ें', 'Add scheme')} error={save.isError ? errorText(save.error) : undefined} done={done}
        onSave={submit} onCancel={onDone}
      />
    </View>
  );
}

export default function AdminSchemes() {
  const { t, tl } = useT();
  // Staff also get closed schemes.
  const schemes = useSchemes();
  const save = useSaveScheme();
  const remove = useDeleteScheme();
  const errorText = useErrorText();
  const [editId, setEditId] = useState<string>();
  const [adding, setAdding] = useState(false);

  const toggleOpen = ({ id, ...s }: Scheme) => save.mutate({ id, scheme: { ...s, open: !s.open } });
  const removeError = remove.error instanceof ApiError && remove.error.code === 'in_use'
    ? t('इस योजना के लिए नागरिकों ने आवेदन किया है, इसलिए इसे हटाया नहीं जा सकता। इसके बजाय इसे बंद करें।', 'Citizens have applied for this scheme, so it cannot be deleted. Close it instead.')
    : remove.isError ? errorText(remove.error) : undefined;

  return (
    <Screen back icon="bank-outline" title={t('योजना प्रबंधन', 'Scheme Management')} subtitle={t('योजनाएँ जोड़ें, बदलें, बंद करें या हटाएँ', 'Add, edit, close or remove government schemes')}>
      {adding ? (
        <Card style={{ gap: 12 }}>
          <Txt w="b" size={16} color={C.navy}>{t('नई योजना', 'New scheme')}</Txt>
          <SchemeForm onDone={() => {}} />
          <Btn outline color={C.sub} label={t('बंद करें', 'Close')} onPress={() => setAdding(false)} />
        </Card>
      ) : (
        <Btn color={C.orange} icon="plus" label={t('नई योजना जोड़ें', 'Add a new scheme')} onPress={() => setAdding(true)} />
      )}
      <Loaded q={schemes}>
        {(list) => SCHEME_GROUPS.map((g) => {
          const inGroup = list.filter((s) => s.groupId === g.id);
          return (
            <View key={g.id} style={{ gap: 8, marginTop: 4 }}>
              <Row><Bubble v={g} size={32} /><Txt w="b" size={17} style={{ flex: 1 }}>{tl(g.name)}</Txt><Txt size={13} color={C.sub}>{inGroup.length}</Txt></Row>
              {inGroup.length === 0 ? <Txt size={13} color={C.sub}>{t('इस वर्ग में कोई योजना नहीं', 'No schemes in this group')}</Txt> : null}
              {inGroup.map((s) => (
                <Card key={s.id} style={{ gap: 4, opacity: s.open || s.id === editId ? 1 : 0.7, borderColor: s.id === editId ? C.orange : C.border, borderWidth: s.id === editId ? 2 : 1 }}>
                  {s.id === editId ? (
                    <>
                      <Txt w="b" size={16} color={C.orange}>{t('योजना बदलें', 'Edit scheme')}</Txt>
                      <SchemeForm scheme={s} onDone={() => setEditId(undefined)} />
                    </>
                  ) : (
                    <>
                      <Row style={{ alignItems: 'flex-start' }}>
                        <Txt w="b" size={15} style={{ flex: 1 }}>{tl(s.name)}</Txt>
                        {s.open ? <Badge label={t('खुली', 'Open')} color={C.green} soft={C.greenSoft} /> : <Badge label={t('बंद', 'Closed')} color={C.red} soft={C.redSoft} />}
                      </Row>
                      <Txt size={14} color={C.sub}>{tl(s.desc)}</Txt>
                      <Txt w="sb" size={12} color={g.color}>{tl(DEPARTMENTS[s.dept] ?? DEPARTMENTS.panchayat)}</Txt>
                      <ItemActions
                        busy={remove.isPending && remove.variables === s.id} error={remove.variables === s.id ? removeError : undefined}
                        deleteQuestion={t(`“${tl(s.name)}” योजना हटाएँ?`, `Remove the scheme “${tl(s.name)}”?`)}
                        onEdit={() => setEditId(s.id)} onDelete={() => remove.mutate(s.id)}
                      >
                        <Btn
                          small outline color={s.open ? C.amber : C.green} icon={s.open ? 'lock-outline' : 'lock-open-variant-outline'} disabled={save.isPending}
                          label={s.open ? t('बंद करें', 'Close') : t('खोलें', 'Open')} onPress={() => toggleOpen(s)}
                        />
                      </ItemActions>
                    </>
                  )}
                </Card>
              ))}
            </View>
          );
        })}
      </Loaded>
    </Screen>
  );
}
