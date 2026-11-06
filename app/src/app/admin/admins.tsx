import { DESIGNATIONS, ROLE_NAME, fmtDate } from '@shared/data';
import { useState } from 'react';
import { View } from 'react-native';
import { ApiError, NewAdmin } from '../../api';
import { useAccounts, useCreateAdmin, useRemoveAccount, useSetAccountActive } from '../../api/hooks';
import { Badge, Btn, Card, ConfirmBtn, ErrorText, Field, Heading, Ico, Loaded, OkText, Row, Screen, Select, Txt, useErrorText } from '../../components/ui';
import { useT, useUser } from '../../store';
import { C } from '../../theme';

const EMPTY_ADMIN: NewAdmin = { name: '', loginId: '', pin: '', mobile: '', designation: 'wardpanch' };

/** Super admin only: create, deactivate and remove admin accounts. */
export default function AdminAdmins() {
  const { t, tl } = useT();
  const me = useUser();
  const accounts = useAccounts('staff');
  const createAdmin = useCreateAdmin();
  const setActive = useSetAccountActive();
  const remove = useRemoveAccount();
  const errorText = useErrorText();
  const [form, setForm] = useState<NewAdmin>(EMPTY_ADMIN);
  const [error, setError] = useState('');
  const [created, setCreated] = useState('');

  const set = (patch: Partial<NewAdmin>) => { setForm({ ...form, ...patch }); setError(''); setCreated(''); };
  const actionError = setActive.error ?? remove.error;

  const submit = () => {
    if (!form.name.trim() || !form.loginId.trim() || !form.designation) return setError(t('कृपया सभी ज़रूरी (*) जानकारी भरें।', 'Please fill in all required (*) fields.'));
    if (!/^[a-zA-Z][a-zA-Z0-9._-]{2,19}$/.test(form.loginId.trim())) return setError(t('यूज़र आईडी 3–20 अक्षर की हो, अक्षर से शुरू हो (a-z, 0-9, . _ -)।', 'User ID must be 3–20 characters and start with a letter (a-z, 0-9, . _ -).'));
    if (!/^[6-9]\d{9}$/.test(form.mobile)) return setError(t('कृपया 10 अंकों का सही मोबाइल नंबर डालें।', 'Please enter a valid 10-digit mobile number.'));
    if (!/^\d{4}$/.test(form.pin)) return setError(t('कृपया 4 अंकों का पिन डालें।', 'Please enter a 4-digit PIN.'));
    createAdmin.mutate({ ...form, name: form.name.trim(), loginId: form.loginId.trim() }, {
      onSuccess: (admin) => {
        setCreated(t(`एडमिन खाता बन गया। लॉगिन: ${admin.loginId} / ${form.pin}`, `Admin account created. Login: ${admin.loginId} / ${form.pin}`));
        setForm(EMPTY_ADMIN);
      },
      onError: (e) => setError(e instanceof ApiError && e.code === 'exists' ? t('यह यूज़र आईडी पहले से मौजूद है।', 'This user ID is already taken.') : errorText(e)),
    });
  };

  return (
    <Screen back icon="shield-account" title={t('एडमिन प्रबंधन', 'Admin Management')} subtitle={t('पंचायत के एडमिन खाते बनाएँ और संभालें', 'Create and manage Panchayat admin accounts')}>
      <Card style={{ gap: 12 }}>
        <Txt w="b" size={16} color={C.navy}>{t('नया एडमिन बनाएँ', 'Create a new admin')}</Txt>
        <Field label={t('नाम', 'Name')} required icon="account" value={form.name} onChangeText={(name) => set({ name })} placeholder={t('जैसे: राधा देवी', 'e.g. Radha Devi')} />
        <Select
          label={t('पद', 'Designation')} required icon="badge-account-horizontal-outline" value={form.designation}
          options={DESIGNATIONS.filter((d) => d.id !== 'district').map((d) => ({ id: d.id, label: tl(d.name) }))} onChange={(designation) => set({ designation })}
        />
        <Field label={t('मोबाइल नंबर', 'Mobile Number')} required icon="cellphone" value={form.mobile} keyboardType="phone-pad" maxLength={10} placeholder="98765 43210" onChangeText={(v) => set({ mobile: v.replace(/\D/g, '').slice(0, 10) })} />
        <Field label={t('यूज़र आईडी (लॉगिन के लिए)', 'User ID (for login)')} required icon="at" value={form.loginId} autoCapitalize="none" autoCorrect={false} placeholder={t('जैसे: wardpanch2', 'e.g. wardpanch2')} onChangeText={(loginId) => set({ loginId })} />
        <Field label={t('पिन (4 अंक)', 'PIN (4 digits)')} required icon="lock-outline" value={form.pin} keyboardType="number-pad" maxLength={4} placeholder="••••" onChangeText={(v) => set({ pin: v.replace(/\D/g, '').slice(0, 4) })} />
        <ErrorText text={error} />
        <Btn label={t('एडमिन बनाएँ', 'Create admin')} icon="account-plus" color={C.purple} busy={createAdmin.isPending} onPress={submit} />
        <OkText text={created} />
      </Card>

      <ErrorText text={actionError ? errorText(actionError) : undefined} />
      <Loaded q={accounts}>
        {(list) => {
          const staff = [...list].sort((a, b) => (a.role === b.role ? a.createdAt - b.createdAt : a.role === 'superadmin' ? -1 : 1));
          return (
            <>
              <Heading>{t('सभी एडमिन', 'All admins')} ({staff.length})</Heading>
              {staff.map((a) => {
                const self = a.id === me?.id;
                const designation = DESIGNATIONS.find((d) => d.id === a.designation);
                return (
                  <Card key={a.id} style={{ gap: 8, opacity: a.active ? 1 : 0.65 }}>
                    <Row style={{ alignItems: 'flex-start' }} gap={10}>
                      <Ico name={a.role === 'superadmin' ? 'shield-crown' : 'account-tie'} size={28} color={a.role === 'superadmin' ? C.purple : C.navy} />
                      <View style={{ flex: 1 }}>
                        <Row gap={6} wrap>
                          <Txt w="b" size={16}>{a.name}</Txt>
                          {self ? <Badge label={t('आप', 'You')} color={C.green} soft={C.greenSoft} /> : null}
                          {a.active ? null : <Badge label={t('निष्क्रिय', 'Inactive')} color={C.red} soft={C.redSoft} />}
                        </Row>
                        <Txt size={13} color={C.sub}>{designation ? tl(designation.name) : tl(ROLE_NAME[a.role])}  •  {t('लॉगिन', 'Login')}: {a.loginId}</Txt>
                        <Txt size={12} color={C.faint}>+91 {a.mobile}  •  {t('बनाया', 'Created')} {fmtDate(a.createdAt)}</Txt>
                      </View>
                    </Row>
                    {self || a.role === 'superadmin' ? null : (
                      <Row wrap>
                        <Btn
                          small outline color={a.active ? C.amber : C.green} icon={a.active ? 'account-off-outline' : 'account-check-outline'} disabled={setActive.isPending}
                          label={a.active ? t('निष्क्रिय करें', 'Deactivate') : t('सक्रिय करें', 'Activate')} onPress={() => setActive.mutate({ id: a.id, active: !a.active })}
                        />
                        <ConfirmBtn
                          label={t('हटाएँ', 'Remove')} question={t(`${a.name} का खाता हटाएँ?`, `Remove the account of ${a.name}?`)}
                          busy={remove.isPending && remove.variables === a.id} onConfirm={() => remove.mutate(a.id)}
                        />
                      </Row>
                    )}
                  </Card>
                );
              })}
            </>
          );
        }}
      </Loaded>
    </Screen>
  );
}
