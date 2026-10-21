import { MaterialCommunityIcons as MCI } from '@expo/vector-icons';
import { useState } from 'react';
import { View } from 'react-native';
import { Badge, Btn, Card, Field, Screen, Select, Txt } from '../../components/ui';
import { DESIGNATIONS, ROLE_NAME, fmtDate } from '../../data';
import { NewAdmin, useStore, useT, useUser } from '../../store';
import { C } from '../../theme';

const EMPTY: NewAdmin = { name: '', loginId: '', pin: '', mobile: '', designation: 'wardpanch' };

/** Superadmin only: create, deactivate and remove admin accounts. */
export default function AdminAccounts() {
  const { t, tl } = useT();
  const me = useUser();
  const accounts = useStore((s) => s.accounts);
  const createAdmin = useStore((s) => s.createAdmin);
  const setAccountActive = useStore((s) => s.setAccountActive);
  const removeAccount = useStore((s) => s.removeAccount);

  const [form, setForm] = useState<NewAdmin>(EMPTY);
  const [error, setError] = useState('');
  const [created, setCreated] = useState('');
  const [confirmRemove, setConfirmRemove] = useState<string>();

  const staff = accounts.filter((a) => a.role !== 'citizen').sort((a, b) => (a.role === b.role ? a.createdAt - b.createdAt : a.role === 'superadmin' ? -1 : 1));
  const set = (patch: Partial<NewAdmin>) => { setForm({ ...form, ...patch }); setError(''); setCreated(''); };

  const submit = () => {
    if (!form.name.trim() || !form.loginId.trim() || !form.designation) return setError(t('कृपया सभी ज़रूरी (*) जानकारी भरें।', 'Please fill in all required (*) fields.'));
    if (!/^[a-zA-Z][a-zA-Z0-9._-]{2,19}$/.test(form.loginId.trim())) return setError(t('यूज़र आईडी 3–20 अक्षर की हो, अक्षर से शुरू हो (a-z, 0-9, . _ -)।', 'User ID must be 3–20 characters and start with a letter (a-z, 0-9, . _ -).'));
    if (!/^[6-9]\d{9}$/.test(form.mobile)) return setError(t('कृपया 10 अंकों का सही मोबाइल नंबर डालें।', 'Please enter a valid 10-digit mobile number.'));
    if (!/^\d{4}$/.test(form.pin)) return setError(t('कृपया 4 अंकों का पिन डालें।', 'Please enter a 4-digit PIN.'));
    if (createAdmin({ ...form, name: form.name.trim(), loginId: form.loginId.trim() }) === 'exists') return setError(t('यह यूज़र आईडी पहले से मौजूद है।', 'This user ID is already taken.'));
    setCreated(t(`एडमिन खाता बन गया। लॉगिन: ${form.loginId.trim().toLowerCase()} / ${form.pin}`, `Admin account created. Login: ${form.loginId.trim().toLowerCase()} / ${form.pin}`));
    setForm(EMPTY);
  };

  return (
    <Screen back icon="shield-account" title={t('एडमिन प्रबंधन', 'Admin Management')} subtitle={t('पंचायत के एडमिन खाते बनाएँ और संभालें', 'Create and manage Panchayat admin accounts')}>
      <Card style={{ gap: 12 }}>
        <Txt w="b" size={16} color={C.navy}>{t('नया एडमिन बनाएँ', 'Create a new admin')}</Txt>
        <Field label={t('नाम', 'Name')} required icon="account" value={form.name} onChangeText={(name) => set({ name })} placeholder={t('जैसे: राधा देवी', 'e.g. Radha Devi')} />
        <Select
          label={t('पद', 'Designation')} required icon="badge-account-horizontal-outline" value={form.designation} placeholder={t('चुनें', 'Select')}
          options={DESIGNATIONS.filter((d) => d.id !== 'district').map((d) => ({ id: d.id, label: tl(d.name) }))} onChange={(designation) => set({ designation })}
        />
        <Field label={t('मोबाइल नंबर', 'Mobile Number')} required icon="cellphone" value={form.mobile} onChangeText={(v) => set({ mobile: v.replace(/\D/g, '').slice(0, 10) })} keyboardType="phone-pad" maxLength={10} placeholder="98765 43210" />
        <Field label={t('यूज़र आईडी (लॉगिन के लिए)', 'User ID (for login)')} required icon="at" value={form.loginId} onChangeText={(loginId) => set({ loginId })} autoCapitalize="none" autoCorrect={false} placeholder={t('जैसे: wardpanch2', 'e.g. wardpanch2')} />
        <Field label={t('पिन (4 अंक)', 'PIN (4 digits)')} required icon="lock-outline" value={form.pin} onChangeText={(v) => set({ pin: v.replace(/\D/g, '').slice(0, 4) })} keyboardType="number-pad" maxLength={4} placeholder="••••" />
        {error ? <Txt w="m" size={14} color={C.red}>{error}</Txt> : null}
        <Btn label={t('एडमिन बनाएँ', 'Create admin')} icon="account-plus" color={C.purple} onPress={submit} />
        {created ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MCI name="check-circle" size={20} color={C.green} />
            <Txt w="sb" size={14} color={C.green} style={{ flex: 1 }}>{created}</Txt>
          </View>
        ) : null}
      </Card>

      <Txt w="b" size={16} color={C.navy}>{t('सभी एडमिन', 'All admins')} ({staff.length})</Txt>
      {staff.map((a) => {
        const self = a.id === me?.id;
        const designation = DESIGNATIONS.find((d) => d.id === a.designation);
        return (
          <Card key={a.id} style={{ gap: 8, opacity: a.active ? 1 : 0.7 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: a.role === 'superadmin' ? C.purpleSoft : C.blueSoft, alignItems: 'center', justifyContent: 'center' }}>
                <MCI name={a.role === 'superadmin' ? 'shield-crown' : 'account-tie'} size={24} color={a.role === 'superadmin' ? C.purple : C.navy} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Txt w="b" size={16}>{a.name}</Txt>
                  {self ? <Badge label={t('आप', 'You')} color={C.green} soft={C.greenSoft} /> : null}
                  {a.active ? null : <Badge label={t('निष्क्रिय', 'Inactive')} color={C.red} soft={C.redSoft} />}
                </View>
                <Txt size={13} color={C.sub}>{designation ? tl(designation.name) : tl(ROLE_NAME[a.role])}  •  {t('लॉगिन', 'Login')}: {a.loginId}</Txt>
                <Txt size={12} color={C.faint}>+91 {a.mobile}  •  {t('बनाया', 'Created')} {fmtDate(a.createdAt)}</Txt>
              </View>
            </View>
            {self || a.role === 'superadmin' ? null : confirmRemove === a.id ? (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Btn small outline color={C.sub} label={t('रद्द करें', 'Cancel')} onPress={() => setConfirmRemove(undefined)} style={{ flex: 1 }} />
                <Btn small color={C.red} label={t('हाँ, हटाएँ', 'Yes, remove')} onPress={() => { removeAccount(a.id); setConfirmRemove(undefined); }} style={{ flex: 1 }} />
              </View>
            ) : (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Btn
                  small outline color={a.active ? C.amber : C.green} icon={a.active ? 'account-off-outline' : 'account-check-outline'}
                  label={a.active ? t('निष्क्रिय करें', 'Deactivate') : t('सक्रिय करें', 'Activate')}
                  onPress={() => setAccountActive(a.id, !a.active)} style={{ flex: 1 }}
                />
                <Btn small outline color={C.red} icon="delete-outline" label={t('हटाएँ', 'Remove')} onPress={() => setConfirmRemove(a.id)} style={{ flex: 1 }} />
              </View>
            )}
          </Card>
        );
      })}
    </Screen>
  );
}
