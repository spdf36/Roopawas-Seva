import { MaterialCommunityIcons as MCI } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, View } from 'react-native';
import { Btn, Card, Field, Screen, Select, Txt } from '../components/ui';
import { CATEGORIES } from '../data';
import { useStore, useT } from '../store';
import { C } from '../theme';

export default function Complaint() {
  const { t, tl } = useT();
  const router = useRouter();
  const addComplaint = useStore((s) => s.addComplaint);

  const [categoryId, setCategoryId] = useState('water');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('रूपावास, मुख्य चौक');
  const [photo, setPhoto] = useState<string>();
  const [error, setError] = useState('');
  const [doneId, setDoneId] = useState<string>();

  const pickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.5 });
    if (!res.canceled && res.assets[0]) setPhoto(res.assets[0].uri);
  };

  const submit = () => {
    if (description.trim().length < 5) return setError(t('कृपया समस्या का विवरण लिखें।', 'Please describe the problem.'));
    if (!location.trim()) return setError(t('कृपया स्थान लिखें।', 'Please enter the location.'));
    setDoneId(addComplaint({ categoryId, description: description.trim(), location: location.trim(), photo }));
  };

  const header = { back: true, icon: 'alert-circle-outline' as const, iconColor: C.red, title: t('मेरी समस्या', 'My Complaint'), subtitle: t('आपकी समस्या दर्ज करें', 'Register your problem') };

  if (doneId) {
    return (
      <Screen {...header}>
        <Card style={{ alignItems: 'center', gap: 8, paddingVertical: 24 }}>
          <MCI name="check-circle" size={56} color={C.green} />
          <Txt w="b" size={19} center>{t('आपकी शिकायत दर्ज हो गई', 'Your complaint has been submitted')}</Txt>
          <Txt color={C.sub} center>{t('आपका शिकायत नंबर', 'Your complaint number')}</Txt>
          <Txt w="xb" size={22} color={C.navy}>{doneId}</Txt>
          <Txt size={13} color={C.sub} center>
            {t('पंचायत इसे जांचकर संबंधित विभाग को भेजेगी। स्थिति बदलने पर यहाँ दिखेगी।', 'The Panchayat will verify it and forward it to the concerned department. Status updates will appear here.')}
          </Txt>
        </Card>
        <Btn label={t('स्थिति देखें', 'Track status')} icon="clipboard-text-clock-outline" onPress={() => router.replace(`/request/${doneId}`)} />
        <Btn outline label={t('होम पर जाएँ', 'Go to Home')} icon="home" onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  return (
    <Screen {...header}>
      <Card style={{ gap: 12 }}>
        <Select
          label={t('श्रेणी चुनें', 'Select category')} required value={categoryId} placeholder={t('चुनें', 'Select')}
          options={CATEGORIES.map((c) => ({ id: c.id, label: tl(c.name) }))} onChange={setCategoryId}
        />
        <Field
          label={t('समस्या का विवरण', 'Describe the problem')} required multiline value={description}
          onChangeText={(v) => { setDescription(v); setError(''); }}
          placeholder={t('जैसे: गांव के चौक पर पानी की टंकी से पानी नहीं आ रहा है।', 'e.g. No water is coming from the tank at the village square.')}
        />
        <View style={{ gap: 6 }}>
          <Txt w="m" size={14} color={C.sub}>{t('फोटो अपलोड करें (वैकल्पिक)', 'Upload photo (optional)')}</Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {photo ? (
              <Image source={{ uri: photo }} style={{ width: 72, height: 72, borderRadius: 8 }} />
            ) : (
              <View style={{ width: 72, height: 72, borderRadius: 8, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}>
                <MCI name="image-outline" size={28} color={C.faint} />
              </View>
            )}
            <View style={{ gap: 6, alignItems: 'flex-start' }}>
              <Btn small outline icon="camera-outline" label={photo ? t('फोटो बदलें', 'Change photo') : t('फोटो चुनें', 'Choose photo')} onPress={pickPhoto} />
              {photo ? <Btn small outline color={C.red} icon="close" label={t('हटाएँ', 'Remove')} onPress={() => setPhoto(undefined)} /> : null}
            </View>
          </View>
        </View>
        <Field label={t('स्थान (GPS / पता)', 'Location (GPS / address)')} required icon="map-marker" value={location} onChangeText={(v) => { setLocation(v); setError(''); }} />
        {error ? <Txt w="m" size={14} color={C.red}>{error}</Txt> : null}
        <Btn label={t('सबमिट करें', 'Submit')} color={C.orange} onPress={submit} />
      </Card>
    </Screen>
  );
}
