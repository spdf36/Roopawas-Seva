import { BASELINE_FIELDS, Baseline } from '@shared/data';
import { useState } from 'react';
import { useBaseline, useUpdateBaseline } from '../../api/hooks';
import { Btn, Card, ErrorText, Field, Loaded, OkText, Screen, Txt, useErrorText } from '../../components/ui';
import { useT } from '../../store';
import { C } from '../../theme';

/** The recorded figures the public Village Dashboard starts from. */
export default function AdminFigures() {
  const { t } = useT();
  const baseline = useBaseline();
  return (
    <Screen back icon="counter" title={t('गाँव के आँकड़े', 'Village Figures')} subtitle={t('“गाँव की प्रगति” पर दिखने वाले दर्ज आँकड़े', 'Recorded figures shown on the Village Dashboard')}>
      <Loaded q={baseline}>{(b) => <FiguresForm initial={b} />}</Loaded>
    </Screen>
  );
}

function FiguresForm({ initial }: { initial: Baseline }) {
  const { t, tl } = useT();
  const save = useUpdateBaseline();
  const errorText = useErrorText();
  // Kept as text while typing so a field can be empty; checked when saving.
  const [form, setForm] = useState<Record<keyof Baseline, string>>(() => Object.fromEntries(BASELINE_FIELDS.map(({ id }) => [id, String(initial[id])])) as Record<keyof Baseline, string>);
  const [error, setError] = useState('');

  const submit = () => {
    if (BASELINE_FIELDS.some(({ id }) => !/^\d+$/.test(form[id]))) return setError(t('सभी आँकड़े 0 या उससे बड़ी पूर्ण संख्या होने चाहिए।', 'Every figure must be a whole number, 0 or more.'));
    setError('');
    save.mutate(Object.fromEntries(BASELINE_FIELDS.map(({ id }) => [id, Number(form[id])])) as Baseline, { onError: (e) => setError(errorText(e)) });
  };

  return (
    <Card style={{ gap: 12 }}>
      <Txt size={14} color={C.sub}>
        {t(
          'ये आँकड़े इस पोर्टल के बाहर दर्ज कार्य हैं (पोर्टल शुरू होने से पहले या पंचायत कार्यालय में)। सार्वजनिक डैशबोर्ड इनमें पोर्टल पर आए अनुरोधों की गिनती अपने आप जोड़ता है।',
          'These are figures recorded outside this portal (before it started, or at the Panchayat office). The public dashboard adds the requests made on the portal on top of them automatically.',
        )}
      </Txt>
      {BASELINE_FIELDS.map(({ id, name }) => (
        <Field
          key={id} label={tl(name)} required keyboardType="number-pad" value={form[id]}
          onChangeText={(v) => { setForm({ ...form, [id]: v.replace(/\D/g, '').slice(0, 7) }); setError(''); save.reset(); }}
        />
      ))}
      <ErrorText text={error} />
      <Btn icon="content-save-outline" label={t('आँकड़े सेव करें', 'Save figures')} busy={save.isPending} onPress={submit} />
      <OkText text={save.isSuccess ? t('आँकड़े अपडेट हो गए।', 'Figures updated.') : undefined} />
    </Card>
  );
}
