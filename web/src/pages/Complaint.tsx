import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCreateComplaint } from '../api/hooks';
import { Field, Icon, PageHead, Select, TextArea, tint, useErrorText } from '../components/ui';
import { CATEGORIES, Coords, mapLink } from '../data';
import { compressPhoto } from '../photo';
import { useT } from '../store';

export function Complaint() {
  const { t, tl } = useT();
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

  const locate = () => {
    if (!navigator.geolocation) return setLocationError(t('यह ब्राउज़र GPS स्थान नहीं दे सकता।', 'This browser cannot share a GPS location.'));
    setLocating(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords: c }) => {
        setCoords({ lat: Number(c.latitude.toFixed(6)), lng: Number(c.longitude.toFixed(6)), accuracy: Math.round(c.accuracy) });
        setLocating(false);
      },
      (e) => {
        setLocating(false);
        setLocationError(e.code === e.PERMISSION_DENIED
          ? t('स्थान की अनुमति नहीं मिली। ब्राउज़र की सेटिंग में अनुमति दें, या पता लिखें।', 'Location permission was denied. Allow it in your browser settings, or type the address.')
          : t('अभी स्थान नहीं मिल सका। कृपया फिर से प्रयास करें या पता लिखें।', 'Could not get your location right now. Try again or type the address.'));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  };

  const pickPhoto = async (file: File) => {
    setPhotoBusy(true);
    setPhotoError('');
    try {
      setPhoto(await compressPhoto(file));
    } catch (e) {
      setPhotoError((e as Error).message === 'unreadable'
        ? t('यह फोटो नहीं खुल सकी। कृपया JPG या PNG फोटो चुनें।', 'This photo could not be opened. Please choose a JPG or PNG photo.')
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

  const head = <PageHead icon="alert-circle-outline" color="var(--red)" title={t('मेरी समस्या', 'My Complaint')} subtitle={t('आपकी समस्या दर्ज करें', 'Register your problem')} />;

  if (doneId) {
    return (
      <div className="container narrow page">
        {head}
        <div className="card center stack" style={{ alignItems: 'center', padding: 30 }}>
          <Icon name="check-circle" size={60} color="var(--green)" />
          <h2>{t('आपकी शिकायत दर्ज हो गई', 'Your complaint has been submitted')}</h2>
          <div>
            <div className="sub">{t('आपका शिकायत नंबर', 'Your complaint number')}</div>
            <div className="big" style={{ fontSize: 26 }}>{doneId}</div>
          </div>
          <p className="small sub">
            {t('पंचायत इसे जांचकर संबंधित विभाग को भेजेगी। स्थिति बदलने पर यहाँ दिखेगी।', 'The Panchayat will verify it and forward it to the concerned department. Status updates will appear here.')}
          </p>
          <div className="row wrap" style={{ justifyContent: 'center' }}>
            <Link to={`/requests/${doneId}`} className="btn"><Icon name="clipboard-text-clock-outline" />{t('स्थिति देखें', 'Track status')}</Link>
            <Link to="/" className="btn outline"><Icon name="home" />{t('होम पर जाएँ', 'Go to Home')}</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container narrow page">
      {head}
      {(
        <form className="card stack" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <Select label={t('श्रेणी चुनें', 'Select category')} required value={categoryId} options={CATEGORIES.map((c) => ({ id: c.id, label: tl(c.name) }))} onChange={setCategoryId} />
          <TextArea
            label={t('समस्या का विवरण', 'Describe the problem')} required value={description}
            onChange={(e) => { setDescription(e.target.value); setError(''); }}
            placeholder={t('जैसे: गांव के चौक पर पानी की टंकी से पानी नहीं आ रहा है।', 'e.g. No water is coming from the tank at the village square.')}
          />
          <div className="field">
            <label>{t('फोटो अपलोड करें (वैकल्पिक)', 'Upload photo (optional)')}</label>
            <div className="row">
              {photo ? <img src={photo} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} /> : (
                <span className="bubble" style={{ width: 80, height: 80, borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <Icon name="image-outline" size={30} color="var(--faint)" />
                </span>
              )}
              <label className="btn sm outline" style={{ cursor: photoBusy ? 'wait' : 'pointer', color: 'var(--blue)' }}>
                <Icon name={photoBusy ? 'loading' : 'camera-outline'} spin={photoBusy} size={17} />{photo ? t('फोटो बदलें', 'Change photo') : t('फोटो चुनें', 'Choose photo')}
                <input
                  type="file" accept="image/*" hidden disabled={photoBusy}
                  onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) pickPhoto(f); }}
                />
              </label>
              {photo ? <button type="button" className="btn sm outline" style={tint('var(--red)')} onClick={() => setPhoto(undefined)}>{t('हटाएँ', 'Remove')}</button> : null}
            </div>
            {photoError ? <div className="error">{photoError}</div> : null}
          </div>
          <div className="field">
            <Field
              label={t('स्थान / पता', 'Place / address')} required icon="map-marker" value={location}
              placeholder={t('जैसे: रूपावास, मुख्य चौक, मंदिर के पास', 'e.g. Roopawas, main square, near the temple')}
              onChange={(e) => { setLocation(e.target.value); setError(''); }}
            />
            <div className="row wrap" style={{ gap: 8 }}>
              {coords ? (
                <>
                  <a className="ok row small" style={{ gap: 4 }} href={mapLink(coords)} target="_blank" rel="noreferrer">
                    <Icon name="crosshairs-gps" size={17} />GPS: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}{coords.accuracy ? ` (±${coords.accuracy} m)` : ''}
                  </a>
                  <button type="button" className="btn sm outline" style={tint('var(--red)')} onClick={() => setCoords(undefined)}>{t('हटाएँ', 'Remove')}</button>
                </>
              ) : (
                <button type="button" className="btn sm outline" style={tint('var(--green)')} disabled={locating} onClick={locate}>
                  <Icon name={locating ? 'loading' : 'crosshairs-gps'} spin={locating} size={17} />
                  {locating ? t('स्थान खोजा जा रहा है…', 'Finding your location…') : t('मेरा वर्तमान स्थान जोड़ें (GPS)', 'Add my current location (GPS)')}
                </button>
              )}
            </div>
            {locationError ? <div className="error">{locationError}</div> : null}
          </div>
          {error ? <div className="error">{error}</div> : null}
          <button type="submit" className="btn block" style={tint('var(--orange)')} disabled={createComplaint.isPending}>
            {createComplaint.isPending ? <Icon name="loading" spin /> : null}{t('सबमिट करें', 'Submit')}
          </button>
        </form>
      )}
    </div>
  );
}
