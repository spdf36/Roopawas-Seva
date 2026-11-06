import { CATEGORIES, Coords, mapLink } from '@shared/data';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Linking, Pressable, View } from 'react-native';
import { useCreateComplaint } from '../api/hooks';
import { Btn, Card, ErrorText, Field, Ico, Row, Screen, Select, Txt, useErrorText } from '../components/ui';
import { pickPhoto } from '../photo';
import { useT } from '../store';
import { C } from '../theme';

export default function Complaint() {
  const { t, tl } = useT();
  const router = useRouter();
  const createComplaint = useCreateComplaint();
  const errorText = useErrorText();

  const [categoryId, setCategoryId] = useState('water');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [coords, setCoords] = useState<Coords>();
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [photo, setPhoto] = useState<string>();
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [error, setError] = useState('');
  const [doneId, setDoneId] = useState<string>();

  const locate = async () => {
    setLocating(true);
    setLocationError('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError(t('स्थान की अनुमति नहीं मिली। फ़ोन की सेटिंग में अनुमति दें, या पता लिखें।', 'Location permission was denied. Allow it in the phone settings, or type the address.'));
        return;
      }
      const { coords: c } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCoords({ lat: Number(c.latitude.toFixed(6)), lng: Number(c.longitude.toFixed(6)), accuracy: c.accuracy ? Math.round(c.accuracy) : undefined });
    } catch {
      setLocationError(t('अभी स्थान नहीं मिल सका। कृपया फिर से प्रयास करें या पता लिखें।', 'Could not get your location right now. Try again or type the address.'));
    } finally {
      setLocating(false);
    }
  };

  const choosePhoto = async () => {
    setPhotoBusy(true);
    setPhotoError('');
    try {
      const picked = await pickPhoto();
      if (picked) setPhoto(picked);
    } catch (e) {
      setPhotoError((e as Error).message === 'unreadable'
        ? t('यह फोटो नहीं खुल सकी। कृपया कोई दूसरी फोटो चुनें।', 'This photo could not be opened. Please choose another one.')
        : t('फोटो बहुत बड़ी है। कृपया कोई दूसरी फोटो चुनें।', 'The photo is too large. Please choose another one.'));
    } finally {
      setPhotoBusy(false);
    }
  };

  const submit = () => {
    if (description.trim().length < 5) return setError(t('कृपया समस्या का विवरण लिखें।', 'Please describe the problem.'));
    if (!location.trim()) return setError(t('कृपया स्थान या पता लिखें।', 'Please enter the place or address.'));
    setError('');
    createComplaint.mutate(
      { categoryId, description: description.trim(), location: location.trim(), coords, photo },
      { onSuccess: (r) => setDoneId(r.id), onError: (e) => setError(errorText(e)) },
    );
  };

  const header = { back: true, icon: 'alert-circle-outline', iconColor: C.red, title: t('मेरी समस्या', 'My Complaint'), subtitle: t('आपकी समस्या दर्ज करें', 'Register your problem') };

  if (doneId) {
    return (
      <Screen {...header}>
        <Card style={{ alignItems: 'center', gap: 10, paddingVertical: 24 }}>
          <Ico name="check-circle" size={64} color={C.green} />
          <Txt w="b" size={19} center>{t('आपकी शिकायत दर्ज हो गई', 'Your complaint has been submitted')}</Txt>
          <Txt color={C.sub} center>{t('आपका शिकायत नंबर', 'Your complaint number')}</Txt>
          <Txt w="xb" size={26} color={C.navy} center>{doneId}</Txt>
          <Txt size={14} color={C.sub} center>
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
      <Card style={{ gap: 14 }}>
        <Select label={t('श्रेणी चुनें', 'Select category')} required value={categoryId} options={CATEGORIES.map((c) => ({ id: c.id, label: tl(c.name) }))} onChange={setCategoryId} />
        <Field
          label={t('समस्या का विवरण', 'Describe the problem')} required multiline value={description}
          onChangeText={(v) => { setDescription(v); setError(''); }}
          placeholder={t('जैसे: गांव के चौक पर पानी की टंकी से पानी नहीं आ रहा है।', 'e.g. No water is coming from the tank at the village square.')}
        />

        <View style={{ gap: 6 }}>
          <Txt w="m" size={14} color={C.sub}>{t('फोटो अपलोड करें (वैकल्पिक)', 'Upload photo (optional)')}</Txt>
          <Row gap={12}>
            {photo ? (
              <Image source={{ uri: photo }} style={{ width: 84, height: 84, borderRadius: 8 }} />
            ) : (
              <View style={{ width: 84, height: 84, borderRadius: 8, borderWidth: 1, borderColor: C.border, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
                <Ico name="image-outline" size={30} color={C.faint} />
              </View>
            )}
            <View style={{ gap: 8 }}>
              <Btn small outline icon="camera-outline" busy={photoBusy} label={photo ? t('फोटो बदलें', 'Change photo') : t('फोटो चुनें', 'Choose photo')} onPress={choosePhoto} />
              {photo ? <Btn small outline color={C.red} icon="close" label={t('हटाएँ', 'Remove')} onPress={() => setPhoto(undefined)} /> : null}
            </View>
          </Row>
          <ErrorText text={photoError} />
        </View>

        <View style={{ gap: 8 }}>
          <Field
            label={t('स्थान / पता', 'Place / address')} required icon="map-marker" value={location}
            placeholder={t('जैसे: रूपावास, मुख्य चौक, मंदिर के पास', 'e.g. Roopawas, main square, near the temple')}
            onChangeText={(v) => { setLocation(v); setError(''); }}
          />
          {coords ? (
            <Row wrap>
              <Pressable onPress={() => Linking.openURL(mapLink(coords))} accessibilityRole="link" style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 }}>
                <Ico name="crosshairs-gps" size={17} color={C.green} />
                <Txt w="sb" size={13} color={C.green}>GPS: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}{coords.accuracy ? ` (±${coords.accuracy} m)` : ''}</Txt>
              </Pressable>
              <Btn small outline color={C.red} label={t('हटाएँ', 'Remove')} onPress={() => setCoords(undefined)} />
            </Row>
          ) : (
            <Btn
              small outline color={C.green} icon="crosshairs-gps" busy={locating} onPress={locate}
              label={locating ? t('स्थान खोजा जा रहा है…', 'Finding your location…') : t('मेरा वर्तमान स्थान जोड़ें (GPS)', 'Add my current location (GPS)')}
            />
          )}
          <ErrorText text={locationError} />
        </View>

        <ErrorText text={error} />
        <Btn label={t('सबमिट करें', 'Submit')} color={C.orange} busy={createComplaint.isPending} onPress={submit} />
      </Card>
    </Screen>
  );
}
