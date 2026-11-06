import { APPROVAL_LEVEL_PRESETS, ApprovalLevel, DEPARTMENTS, YOJNA_STATUS, YOJNA_STATUSES, Yojna } from '@shared/data';
import { useState } from 'react';
import { View } from 'react-native';
import { YojnaInput } from '../api';
import { useSaveYojna } from '../api/hooks';
import { fromDateText, toDateText } from '../dates';
import { useT } from '../store';
import { C } from '../theme';
import { BiField, Btn, ErrorText, Field, Picks, ProgressBar, Row, Select, Txt, useErrorText } from './ui';

const blank = { hi: '', en: '' };
const EMPTY_YOJNA: YojnaInput = { name: blank, desc: blank, dept: 'panchayat', status: 'proposed', statusNote: '', progress: 0, levels: [] };
const inputOf = (y: Yojna): YojnaInput => ({ name: y.name, desc: y.desc, dept: y.dept, status: y.status, statusNote: y.statusNote, progress: y.progress, levels: y.levels });

/** A level while editing: its approval date is kept as typed text until saving. */
type LevelDraft = { name: ApprovalLevel['name']; date: string };

function LevelsEditor({ levels, onChange }: { levels: LevelDraft[]; onChange: (levels: LevelDraft[]) => void }) {
  const { t, tl } = useT();
  const set = (i: number, patch: Partial<LevelDraft>) => onChange(levels.map((lv, n) => (n === i ? { ...lv, ...patch } : lv)));
  const move = (i: number, by: number) => {
    const next = [...levels];
    [next[i], next[i + by]] = [next[i + by], next[i]];
    onChange(next);
  };
  const unused = APPROVAL_LEVEL_PRESETS.filter((p) => !levels.some((lv) => lv.name.hi === p.hi));

  return (
    <View style={{ gap: 8 }}>
      <Txt w="b" size={14} color={C.sub}>{t('स्वीकृति के स्तर (क्रम से)', 'Approval levels (in order)')}</Txt>
      <Txt size={13} color={C.sub}>
        {t('जिस स्तर से स्वीकृति मिल गई, उसकी तारीख भरें। पहला बिना तारीख वाला स्तर “अभी यहाँ” दिखेगा।', 'Enter the date for each level that has approved. The first level without a date is shown as “now at”.')}
      </Txt>
      {levels.map((lv, i) => (
        <View key={i} style={{ gap: 8, padding: 10, backgroundColor: C.bg, borderRadius: 8 }}>
          <Row>
            <Txt w="b" size={15} style={{ flex: 1 }}>{t(`स्तर ${i + 1}`, `Level ${i + 1}`)}</Txt>
            <Btn small outline icon="arrow-up" label="" disabled={i === 0} onPress={() => move(i, -1)} />
            <Btn small outline icon="arrow-down" label="" disabled={i === levels.length - 1} onPress={() => move(i, 1)} />
            <Btn small outline color={C.red} icon="close" label="" onPress={() => onChange(levels.filter((_, n) => n !== i))} />
          </Row>
          <Field label={t('स्तर (हिंदी)', 'Level (Hindi)')} required value={lv.name.hi} onChangeText={(hi) => set(i, { name: { ...lv.name, hi } })} />
          <Field label={t('स्तर (अंग्रेज़ी, वैकल्पिक)', 'Level (English, optional)')} value={lv.name.en} onChangeText={(en) => set(i, { name: { ...lv.name, en } })} />
          <Field
            label={t('स्वीकृति की तारीख (खाली = अभी नहीं)', 'Approved on (empty = not yet)')} icon="calendar-check" value={lv.date}
            placeholder="DD-MM-YYYY" keyboardType="numbers-and-punctuation" onChangeText={(date) => set(i, { date })}
          />
        </View>
      ))}
      <Row wrap gap={6}>
        {unused.map((p) => <Btn key={p.hi} small outline color={C.teal} icon="plus" label={tl(p)} onPress={() => onChange([...levels, { name: p, date: '' }])} />)}
        <Btn small outline icon="plus" label={t('दूसरा स्तर', 'Other level')} onPress={() => onChange([...levels, { name: blank, date: '' }])} />
      </Row>
    </View>
  );
}

/** Creates a yojna (no `yojna`) or edits its details, status and levels. */
export function YojnaForm({ yojna, onSaved, onCancel }: { yojna?: Yojna; onSaved: (y: Yojna) => void; onCancel?: () => void }) {
  const { t, tl } = useT();
  const save = useSaveYojna();
  const errorText = useErrorText();
  const start = yojna ? inputOf(yojna) : EMPTY_YOJNA;
  const [form, setForm] = useState<Omit<YojnaInput, 'levels'>>(start);
  const [levels, setLevels] = useState<LevelDraft[]>(start.levels.map((lv) => ({ name: lv.name, date: lv.approvedAt ? toDateText(lv.approvedAt) : '' })));
  const [error, setError] = useState('');
  const change = (patch: Partial<YojnaInput>) => { setForm({ ...form, ...patch }); setError(''); };
  const showProgress = form.status === 'active' || form.status === 'completed';

  const submit = () => {
    if (!form.name.hi.trim()) return setError(t('कृपया योजना का नाम (हिंदी) लिखें।', 'Please enter the yojna’s name (Hindi).'));
    if (levels.some((lv) => !lv.name.hi.trim())) return setError(t('हर स्तर का नाम (हिंदी) लिखें या खाली स्तर हटाएँ।', 'Name every level (Hindi) or remove the empty ones.'));
    const parsed: ApprovalLevel[] = [];
    for (const lv of levels) {
      if (!lv.date.trim()) { parsed.push({ name: lv.name }); continue; }
      const at = fromDateText(lv.date);
      if (Number.isNaN(at)) return setError(t(`“${lv.name.hi}” की तारीख DD-MM-YYYY में लिखें (आज या पहले की)।`, `Write the date for “${lv.name.en || lv.name.hi}” as DD-MM-YYYY (today or earlier).`));
      parsed.push({ name: lv.name, approvedAt: at });
    }
    const firstPending = parsed.findIndex((lv) => !lv.approvedAt);
    if (firstPending >= 0 && parsed.slice(firstPending).some((lv) => lv.approvedAt)) {
      return setError(t('कोई स्तर अपने से पहले के स्तरों के बाद ही स्वीकृत हो सकता है।', 'A level can only approve after the levels before it.'));
    }
    save.mutate({ id: yojna?.id, yojna: { ...form, levels: parsed } }, { onSuccess: onSaved, onError: (e) => setError(errorText(e)) });
  };

  const setProgress = (p: number) => change({ progress: Math.max(0, Math.min(100, p)) });

  return (
    <View style={{ gap: 12 }}>
      <Txt w="b" size={16} color={C.navy}>{yojna ? t('विवरण, स्थिति और स्तर बदलें', 'Edit details, status and levels') : t('नई योजना', 'New yojna')}</Txt>
      <BiField label={t('योजना का नाम', 'Yojna name')} required value={form.name} onChange={(name) => change({ name })} placeholder={{ hi: 'जैसे: नई पानी की टंकी (वार्ड 4)', en: 'e.g. New water tank (Ward 4)' }} />
      <BiField label={t('विवरण', 'Description')} multiline value={form.desc} onChange={(desc) => change({ desc })} />
      <Select label={t('विभाग', 'Department')} value={form.dept} options={Object.entries(DEPARTMENTS).map(([id, name]) => ({ id, label: tl(name) }))} onChange={(dept) => change({ dept })} />
      <View style={{ gap: 6 }}>
        <Txt w="m" size={14} color={C.sub}>{t('स्थिति', 'Status')}</Txt>
        <Picks
          value={form.status} options={YOJNA_STATUSES.map((s) => ({ id: s, label: tl(YOJNA_STATUS[s].name), color: YOJNA_STATUS[s].color }))}
          onChange={(s) => change({ status: s, progress: s === 'completed' ? 100 : form.progress })}
        />
        <Txt size={13} color={C.sub}>{tl(YOJNA_STATUS[form.status].hint)}</Txt>
      </View>
      <Field
        label={t('स्थिति पर टिप्पणी (सबको दिखेगी)', 'Status note (shown to everyone)')} value={form.statusNote} maxLength={300}
        placeholder={t('जैसे: ज़िला परिषद से तकनीकी स्वीकृति का इंतज़ार', 'e.g. Awaiting technical approval from the Zila Parishad')}
        onChangeText={(statusNote) => change({ statusNote })}
      />
      {showProgress ? (
        <View style={{ gap: 8 }}>
          <Txt w="m" size={14} color={C.sub}>{t('कार्य प्रगति', 'Work done')}: <Txt w="b" size={14} color={C.text}>{form.progress}%</Txt></Txt>
          <ProgressBar pct={form.progress} color={form.progress >= 80 ? C.green : C.amber} height={10} />
          {form.status === 'completed' ? null : (
            <Row wrap gap={6}>
              <Btn small outline icon="minus" label="5%" onPress={() => setProgress(form.progress - 5)} />
              {[0, 25, 50, 75, 100].map((p) => <Btn key={p} small outline={form.progress !== p} label={`${p}%`} onPress={() => setProgress(p)} />)}
              <Btn small outline icon="plus" label="5%" onPress={() => setProgress(form.progress + 5)} />
            </Row>
          )}
        </View>
      ) : null}
      <LevelsEditor levels={levels} onChange={(next) => { setLevels(next); setError(''); }} />
      <ErrorText text={error} />
      <Btn color={C.orange} icon={yojna ? 'content-save-outline' : 'plus'} label={yojna ? t('बदलाव सेव करें', 'Save changes') : t('योजना जोड़ें', 'Add yojna')} busy={save.isPending} onPress={submit} />
      {onCancel ? <Btn outline color={C.sub} label={t('रद्द करें', 'Cancel')} onPress={onCancel} /> : null}
    </View>
  );
}
