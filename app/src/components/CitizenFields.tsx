import { AGE_GROUPS, L, OCCUPATIONS, WARDS } from '../data';
import { CitizenDetails, useT } from '../store';
import { Field, Select } from './ui';

export type CitizenForm = CitizenDetails;
export const EMPTY_CITIZEN: CitizenForm = { name: '', mobile: '', ageGroup: '', ward: '', occupation: '', family: '' };

/** Returns an error message for the form, or '' when it is complete. */
export function useValidateCitizen() {
  const { t } = useT();
  return (f: CitizenForm, checkMobile: boolean) => {
    if (!f.name.trim() || !f.ageGroup || !f.ward || !f.occupation) return t('कृपया सभी ज़रूरी (*) जानकारी भरें।', 'Please fill in all required (*) fields.');
    if (checkMobile && !/^[6-9]\d{9}$/.test(f.mobile)) return t('कृपया 10 अंकों का सही मोबाइल नंबर डालें।', 'Please enter a valid 10-digit mobile number.');
    return '';
  };
}

/** The citizen detail fields shared by registration and profile editing. */
export function CitizenFields({ form, onChange, mobileEditable }: { form: CitizenForm; onChange: (patch: Partial<CitizenForm>) => void; mobileEditable: boolean }) {
  const { t, tl } = useT();
  const opts = (list: { id: string; name: L }[]) => list.map((o) => ({ id: o.id, label: tl(o.name) }));
  return (
    <>
      <Field label={t('नाम', 'Name')} required icon="account" value={form.name} onChangeText={(name) => onChange({ name })} placeholder={t('जैसे: रामलाल शर्मा', 'e.g. Ramlal Sharma')} />
      <Field
        label={t('मोबाइल नंबर', 'Mobile Number')} required icon="cellphone" value={form.mobile} editable={mobileEditable}
        onChangeText={(v) => onChange({ mobile: v.replace(/\D/g, '').slice(0, 10) })}
        keyboardType="phone-pad" maxLength={10} placeholder="98765 43210"
        style={mobileEditable ? undefined : { backgroundColor: '#EEF2F7', color: '#65738B' }}
      />
      <Select label={t('आयु वर्ग', 'Age Group')} required icon="calendar-account" value={form.ageGroup} placeholder={t('चुनें', 'Select')} options={opts(AGE_GROUPS)} onChange={(ageGroup) => onChange({ ageGroup })} />
      <Select label={t('गाँव / वार्ड', 'Village / Ward')} required icon="map-marker" value={form.ward} placeholder={t('चुनें', 'Select')} options={opts(WARDS)} onChange={(ward) => onChange({ ward })} />
      <Select label={t('पेशा / श्रेणी', 'Occupation / Category')} required icon="briefcase-outline" value={form.occupation} placeholder={t('चुनें (किसान, छात्र, नौकरीपेशा आदि)', 'Select (farmer, student, employed…)')} options={opts(OCCUPATIONS)} onChange={(occupation) => onChange({ occupation })} />
      <Field label={t('परिवार के सदस्य (वैकल्पिक)', 'Family Members (optional)')} icon="account-group" value={form.family} onChangeText={(v) => onChange({ family: v.replace(/\D/g, '').slice(0, 2) })} keyboardType="number-pad" placeholder={t('जोड़ें', 'Add')} />
    </>
  );
}
