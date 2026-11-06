import { EXPENSE_CATEGORIES, Expense, FUND_SOURCES, Fund, Yojna, fmtRupees, fundReceived } from '@shared/data';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ReactNode, useState } from 'react';
import { Image, View } from 'react-native';
import { ApiError, ExpenseInput, FundInput } from '../../../api';
import {
  useAddInstalment, useDeleteExpense, useDeleteFund, useDeleteInstalment, useDeleteYojna, useSaveExpense, useSaveFund, useYojna,
} from '../../../api/hooks';
import { ApprovalSteps, ExpensesList, FundsList, MoneySummary, YojnaHeader } from '../../../components/Yojna';
import { YojnaForm } from '../../../components/YojnaForm';
import { Btn, Card, ConfirmBtn, ErrorText, Field, Heading, Loaded, OkText, Row, Screen, Select, Txt, useErrorText } from '../../../components/ui';
import { fromDateText, rupees, toDateText, todayText } from '../../../dates';
import { pickPhoto } from '../../../photo';
import { useT } from '../../../store';
import { C } from '../../../theme';

// Staff screen for one yojna: keep its status and approval levels current, and record the funds sanctioned,
// the instalments received and every expense with its bill. Everything here is public.

export default function AdminYojna() {
  const { t } = useT();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const yojna = useYojna(id ?? '');
  return (
    <Screen back icon="hammer-wrench" iconColor={C.orange} title={t('योजना प्रबंधन', 'Manage yojna')}>
      <Btn small outline icon="eye-outline" label={t('सार्वजनिक पेज देखें', 'View public page')} onPress={() => router.push(`/yojnas/${id}`)} style={{ alignSelf: 'flex-start' }} />
      <Loaded q={yojna} notFound={t('यह योजना नहीं मिली।', 'This yojna was not found.')}>{(y) => <ManageYojna y={y} />}</Loaded>
    </Screen>
  );
}

function ManageYojna({ y }: { y: Yojna }) {
  const { t } = useT();
  const router = useRouter();
  const remove = useDeleteYojna();
  const errorText = useErrorText();
  const [editing, setEditing] = useState(false);
  const [done, setDone] = useState('');

  return (
    <>
      {editing ? (
        <Card><YojnaForm yojna={y} onSaved={() => { setEditing(false); setDone(t('योजना अपडेट हो गई।', 'Yojna updated.')); }} onCancel={() => setEditing(false)} /></Card>
      ) : (
        <>
          <YojnaHeader y={y} />
          <Btn outline color={C.orange} icon="pencil" label={t('विवरण, स्थिति और स्तर बदलें', 'Edit details, status and levels')} onPress={() => { setEditing(true); setDone(''); }} />
          <OkText text={done} />
        </>
      )}
      <MoneySummary y={y} />
      <ApprovalSteps y={y} />
      <FundsEditor y={y} />
      <ExpensesEditor y={y} />
      <Card style={{ gap: 8 }}>
        <Txt size={13} color={C.sub}>{t('राशि या खर्च दर्ज होने पर योजना हटाई नहीं जा सकती।', 'A yojna with funds or expenses recorded cannot be removed.')}</Txt>
        <ConfirmBtn
          label={t('योजना हटाएँ', 'Remove yojna')} question={t('यह योजना हटाएँ?', 'Remove this yojna?')} busy={remove.isPending}
          onConfirm={() => remove.mutate(y.id, { onSuccess: () => router.back() })}
        />
        <ErrorText
          text={remove.isError ? (remove.error instanceof ApiError && remove.error.code === 'in_use'
            ? t('इस योजना की राशि या खर्च दर्ज हैं; पहले उन्हें हटाएँ।', 'This yojna has funds or expenses recorded; remove them first.')
            : errorText(remove.error)) : undefined}
        />
      </Card>
    </>
  );
}

// ---------- Funds and instalments ----------

const EMPTY_FUND = { source: 'state', sanctioned: '', note: '' };

/** Adds a fund (no `fund`) or edits one. */
function FundForm({ yojnaId, fund, onDone }: { yojnaId: string; fund?: Fund; onDone: () => void }) {
  const { t, tl } = useT();
  const save = useSaveFund(yojnaId);
  const errorText = useErrorText();
  const [form, setForm] = useState(fund ? { source: fund.source, sanctioned: String(fund.sanctioned), note: fund.note } : EMPTY_FUND);
  const [error, setError] = useState('');
  const received = fund ? fundReceived(fund) : 0;

  const submit = () => {
    const sanctioned = rupees(form.sanctioned);
    if (Number.isNaN(sanctioned)) return setError(t('स्वीकृत राशि पूरे रुपयों में लिखें।', 'Enter the sanctioned amount in whole rupees.'));
    if (sanctioned < received) return setError(t(`स्वीकृत राशि, प्राप्त राशि (${fmtRupees(received)}) से कम नहीं हो सकती।`, `The sanctioned amount cannot be less than what was received (${fmtRupees(received)}).`));
    const input: FundInput = { source: form.source, sanctioned, note: form.note };
    save.mutate({ fundId: fund?.id, fund: input }, { onSuccess: onDone, onError: (e) => setError(errorText(e)) });
  };

  return (
    <View style={{ gap: 10, padding: 12, backgroundColor: C.bg, borderRadius: 8 }}>
      <Txt w="b" size={15}>{fund ? t('राशि का स्रोत बदलें', 'Edit fund') : t('नई स्वीकृत राशि', 'New fund')}</Txt>
      <Select label={t('स्रोत', 'Source')} value={form.source} options={Object.entries(FUND_SOURCES).map(([id, name]) => ({ id, label: tl(name) }))} onChange={(source) => setForm({ ...form, source })} />
      <Field label={t('स्वीकृत राशि (₹)', 'Sanctioned amount (₹)')} required keyboardType="number-pad" value={form.sanctioned} placeholder="1500000" onChangeText={(sanctioned) => { setForm({ ...form, sanctioned }); setError(''); }} />
      <Field label={t('योजना / मद (वैकल्पिक)', 'Scheme / head (optional)')} value={form.note} maxLength={300} placeholder={t('जैसे: जल जीवन मिशन', 'e.g. Jal Jeevan Mission')} onChangeText={(note) => setForm({ ...form, note })} />
      <ErrorText text={error} />
      <Row>
        <Btn small color={C.blue} icon="content-save-outline" label={t('सेव करें', 'Save')} busy={save.isPending} onPress={submit} />
        <Btn small outline color={C.sub} label={t('रद्द करें', 'Cancel')} onPress={onDone} />
      </Row>
    </View>
  );
}

function InstalmentForm({ yojnaId, fund, onDone }: { yojnaId: string; fund: Fund; onDone: () => void }) {
  const { t } = useT();
  const add = useAddInstalment(yojnaId);
  const errorText = useErrorText();
  const [form, setForm] = useState({ amount: '', date: todayText(), note: '' });
  const [error, setError] = useState('');
  const left = fund.sanctioned - fundReceived(fund);

  const submit = () => {
    const amount = rupees(form.amount);
    const date = fromDateText(form.date);
    if (!amount) return setError(t('राशि पूरे रुपयों में लिखें।', 'Enter the amount in whole rupees.'));
    if (Number.isNaN(date)) return setError(t('तारीख DD-MM-YYYY में लिखें (आज या पहले की)।', 'Write the date as DD-MM-YYYY (today or earlier).'));
    if (amount > left) return setError(t(`यह स्वीकृत राशि से अधिक होगा (${fmtRupees(left)} बाकी)। पहले स्वीकृत राशि बढ़ाएँ।`, `That is more than the sanctioned amount (${fmtRupees(left)} left). Increase the sanctioned amount first.`));
    add.mutate({ fundId: fund.id, instalment: { amount, date, note: form.note } }, { onSuccess: onDone, onError: (e) => setError(errorText(e)) });
  };

  return (
    <View style={{ gap: 10, padding: 12, backgroundColor: C.blueSoft, borderRadius: 8 }}>
      <Txt w="b" size={15}>{t('प्राप्त किस्त दर्ज करें', 'Record an instalment received')} <Txt size={13} color={C.sub}>({fmtRupees(left)} {t('बाकी', 'left')})</Txt></Txt>
      <Field label={t('राशि (₹)', 'Amount (₹)')} required keyboardType="number-pad" value={form.amount} onChangeText={(amount) => { setForm({ ...form, amount }); setError(''); }} />
      <Field label={t('प्राप्ति की तारीख', 'Date received')} required icon="calendar" placeholder="DD-MM-YYYY" value={form.date} onChangeText={(date) => { setForm({ ...form, date }); setError(''); }} />
      <Field label={t('टिप्पणी (वैकल्पिक)', 'Note (optional)')} value={form.note} maxLength={300} placeholder={t('जैसे: प्रथम किस्त', 'e.g. First instalment')} onChangeText={(note) => setForm({ ...form, note })} />
      <ErrorText text={error} />
      <Row>
        <Btn small color={C.blue} icon="plus" label={t('किस्त जोड़ें', 'Add instalment')} busy={add.isPending} onPress={submit} />
        <Btn small outline color={C.sub} label={t('रद्द करें', 'Cancel')} onPress={onDone} />
      </Row>
    </View>
  );
}

/** What the funds card is showing a form for. */
type FundEdit = { kind: 'new' } | { kind: 'edit' | 'instalment'; fundId: string } | null;

function FundsEditor({ y }: { y: Yojna }) {
  const { t } = useT();
  const remove = useDeleteFund(y.id);
  const removeInstalment = useDeleteInstalment(y.id);
  const errorText = useErrorText();
  const [open, setOpen] = useState<FundEdit>(null);
  const [done, setDone] = useState('');
  const close = (message = '') => { setOpen(null); setDone(message); };
  const fundOf = (id: string) => y.funds.find((f) => f.id === id)!;

  const actions = (fundId: string): ReactNode => {
    if (open && open.kind !== 'new' && open.fundId === fundId) {
      return open.kind === 'edit'
        ? <FundForm yojnaId={y.id} fund={fundOf(fundId)} onDone={() => close()} />
        : <InstalmentForm yojnaId={y.id} fund={fundOf(fundId)} onDone={() => close()} />;
    }
    return (
      <>
        <Row wrap gap={6}>
          <Btn small outline color={C.blue} icon="bank-transfer-in" label={t('किस्त जोड़ें', 'Add instalment')} onPress={() => { setOpen({ kind: 'instalment', fundId }); setDone(''); }} />
          <Btn small outline icon="pencil" label={t('बदलें', 'Edit')} onPress={() => { setOpen({ kind: 'edit', fundId }); setDone(''); }} />
          <ConfirmBtn
            label={t('हटाएँ', 'Delete')} question={t('यह राशि का स्रोत हटाएँ?', 'Remove this fund?')} busy={remove.isPending && remove.variables === fundId}
            onConfirm={() => remove.mutate(fundId, { onSuccess: () => setDone(t('हटा दिया गया।', 'Removed.')) })}
          />
        </Row>
        {remove.isError && remove.variables === fundId ? (
          <ErrorText
            text={remove.error instanceof ApiError && remove.error.code === 'in_use'
              ? t('इस स्रोत की किस्तें या इससे हुए खर्च दर्ज हैं; पहले उन्हें हटाएँ।', 'Instalments or expenses are recorded against this fund; remove them first.')
              : errorText(remove.error)}
          />
        ) : null}
      </>
    );
  };

  return (
    <Card style={{ gap: 10 }}>
      <Heading>{t('राशि के स्रोत और किस्तें', 'Funds and instalments')}</Heading>
      {open?.kind === 'new' ? <FundForm yojnaId={y.id} onDone={() => close()} /> : (
        <Btn small outline color={C.blue} icon="plus" label={t('नई स्वीकृत राशि', 'New fund')} onPress={() => { setOpen({ kind: 'new' }); setDone(''); }} style={{ alignSelf: 'flex-start' }} />
      )}
      <OkText text={done} />
      <FundsList
        y={y} actions={actions}
        instalmentAction={(fundId, instalmentId) => (
          <Btn small outline color={C.red} icon="close" label="" disabled={removeInstalment.isPending} onPress={() => removeInstalment.mutate({ fundId, instalmentId })} style={{ paddingHorizontal: 6, paddingVertical: 2 }} />
        )}
      />
      <ErrorText text={removeInstalment.isError ? errorText(removeInstalment.error) : undefined} />
    </Card>
  );
}

// ---------- Expenses ----------

/** Adds an expense (no `expense`) or edits one, with its bill photo. */
function ExpenseForm({ y, expense, onDone }: { y: Yojna; expense?: Expense; onDone: (saved: boolean) => void }) {
  const { t, tl } = useT();
  const save = useSaveExpense(y.id);
  const errorText = useErrorText();
  const [form, setForm] = useState({
    date: expense ? toDateText(expense.date) : todayText(),
    purpose: expense?.purpose ?? '',
    amount: expense ? String(expense.amount) : '',
    category: expense?.category ?? 'material',
    fundId: expense?.fundId ?? '',
  });
  // undefined: keep the current bill; null: remove it; a data: URL: the new bill.
  const [bill, setBill] = useState<string | null>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const shownBill = bill === undefined ? expense?.bill : bill;

  const chooseBill = async () => {
    setBusy(true);
    setError('');
    try {
      const picked = await pickPhoto();
      if (picked) setBill(picked);
    } catch {
      setError(t('यह फोटो नहीं खुल सकी या बहुत बड़ी है। कृपया दूसरी फोटो चुनें।', 'This photo could not be opened or is too large. Please choose another.'));
    } finally {
      setBusy(false);
    }
  };

  const submit = () => {
    const amount = rupees(form.amount);
    const date = fromDateText(form.date);
    if (!form.purpose.trim()) return setError(t('लिखें कि किस पर खर्च हुआ।', 'Enter what the money was spent on.'));
    if (!amount) return setError(t('राशि पूरे रुपयों में लिखें।', 'Enter the amount in whole rupees.'));
    if (Number.isNaN(date)) return setError(t('तारीख DD-MM-YYYY में लिखें (आज या पहले की)।', 'Write the date as DD-MM-YYYY (today or earlier).'));
    const input: ExpenseInput = {
      date, purpose: form.purpose, amount, category: form.category,
      ...(form.fundId ? { fundId: form.fundId } : {}), ...(bill !== undefined ? { bill } : {}),
    };
    save.mutate({ expenseId: expense?.id, expense: input }, { onSuccess: () => onDone(true), onError: (e) => setError(errorText(e)) });
  };

  return (
    <View style={{ gap: 10, padding: 12, backgroundColor: C.bg, borderRadius: 8 }}>
      <Txt w="b" size={15}>{expense ? t('खर्च बदलें', 'Edit expense') : t('नया खर्च दर्ज करें', 'Record an expense')}</Txt>
      <Field label={t('किस पर खर्च', 'Spent on')} required value={form.purpose} maxLength={150} placeholder={t('जैसे: सीमेंट – 200 बोरी', 'e.g. Cement – 200 bags')} onChangeText={(purpose) => { setForm({ ...form, purpose }); setError(''); }} />
      <Field label={t('राशि (₹)', 'Amount (₹)')} required keyboardType="number-pad" value={form.amount} onChangeText={(amount) => { setForm({ ...form, amount }); setError(''); }} />
      <Field label={t('तारीख', 'Date')} required icon="calendar" placeholder="DD-MM-YYYY" value={form.date} onChangeText={(date) => { setForm({ ...form, date }); setError(''); }} />
      <Select label={t('श्रेणी', 'Category')} value={form.category} options={Object.entries(EXPENSE_CATEGORIES).map(([id, c]) => ({ id, label: tl(c.name) }))} onChange={(category) => setForm({ ...form, category })} />
      <Select
        label={t('किस निधि से (वैकल्पिक)', 'Paid from (optional)')} value={form.fundId}
        options={[{ id: '', label: t('– नहीं बताया –', '– not given –') }, ...y.funds.map((f) => ({ id: f.id, label: `${tl(FUND_SOURCES[f.source] ?? FUND_SOURCES.other)}${f.note ? ` – ${f.note}` : ''}` }))]}
        onChange={(fundId) => setForm({ ...form, fundId })}
      />
      <View style={{ gap: 6 }}>
        <Txt w="m" size={14} color={C.sub}>{t('बिल / रसीद की फोटो (वैकल्पिक, सबको दिखेगी)', 'Photo of the bill / receipt (optional, shown to everyone)')}</Txt>
        {shownBill ? <Image source={{ uri: shownBill }} style={{ width: 120, height: 120, borderRadius: 8 }} /> : null}
        <Row wrap>
          <Btn small outline color={C.teal} icon="camera-outline" busy={busy} label={shownBill ? t('फोटो बदलें', 'Change photo') : t('फोटो चुनें', 'Choose photo')} onPress={chooseBill} />
          {shownBill ? <Btn small outline color={C.red} icon="close" label={t('फोटो हटाएँ', 'Remove photo')} onPress={() => setBill(expense?.bill ? null : undefined)} /> : null}
        </Row>
      </View>
      <ErrorText text={error} />
      <Row>
        <Btn small color={C.orange} icon="content-save-outline" label={t('सेव करें', 'Save')} busy={save.isPending} disabled={busy} onPress={submit} />
        <Btn small outline color={C.sub} label={t('रद्द करें', 'Cancel')} onPress={() => onDone(false)} />
      </Row>
    </View>
  );
}

function ExpensesEditor({ y }: { y: Yojna }) {
  const { t } = useT();
  const remove = useDeleteExpense(y.id);
  const errorText = useErrorText();
  // 'new', an expense ID being edited, or nothing.
  const [open, setOpen] = useState<string | null>(null);
  const [done, setDone] = useState('');
  const finish = (saved: boolean) => { setOpen(null); setDone(saved ? t('खर्च सेव हो गया।', 'Expense saved.') : ''); };

  return (
    <Card style={{ gap: 10 }}>
      <Heading>{t('खर्च का ब्योरा', 'Expenses')}</Heading>
      {open === 'new' ? <ExpenseForm y={y} onDone={finish} /> : (
        <Btn small outline color={C.orange} icon="plus" label={t('नया खर्च', 'New expense')} onPress={() => { setOpen('new'); setDone(''); }} style={{ alignSelf: 'flex-start' }} />
      )}
      <OkText text={done} />
      <ErrorText text={remove.isError ? errorText(remove.error) : undefined} />
      <ExpensesList
        y={y}
        actions={(expenseId) => open === expenseId ? (
          <ExpenseForm key={expenseId} y={y} expense={y.expenses.find((e) => e.id === expenseId)} onDone={finish} />
        ) : (
          <Row wrap gap={6}>
            <Btn small outline icon="pencil" label={t('बदलें', 'Edit')} onPress={() => { setOpen(expenseId); setDone(''); }} />
            <ConfirmBtn
              label={t('हटाएँ', 'Delete')} question={t('यह खर्च हटाएँ?', 'Remove this expense?')} busy={remove.isPending && remove.variables === expenseId}
              onConfirm={() => remove.mutate(expenseId, { onSuccess: () => setDone(t('हटा दिया गया।', 'Removed.')) })}
            />
          </Row>
        )}
      />
    </Card>
  );
}
