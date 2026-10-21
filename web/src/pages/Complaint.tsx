import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Field, Icon, NeedProfile, PageHead, Select, TextArea, tint } from '../components/ui';
import { CATEGORIES } from '../data';
import { useStore, useT } from '../store';

export function Complaint() {
  const { t, tl } = useT();
  const profile = useStore((s) => s.profile);
  const addComplaint = useStore((s) => s.addComplaint);

  const [categoryId, setCategoryId] = useState('water');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('रूपावास, मुख्य चौक');
  const [photo, setPhoto] = useState<string>();
  const [error, setError] = useState('');
  const [doneId, setDoneId] = useState<string>();

  const submit = () => {
    if (description.trim().length < 5) return setError(t('कृपया समस्या का विवरण लिखें।', 'Please describe the problem.'));
    if (!location.trim()) return setError(t('कृपया स्थान लिखें।', 'Please enter the location.'));
    setDoneId(addComplaint({ categoryId, description: description.trim(), location: location.trim(), photo }));
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
      {!profile ? <NeedProfile /> : (
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
              <label className="btn sm outline" style={{ cursor: 'pointer', color: 'var(--blue)' }}>
                <Icon name="camera-outline" size={17} />{photo ? t('फोटो बदलें', 'Change photo') : t('फोटो चुनें', 'Choose photo')}
                <input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) setPhoto(URL.createObjectURL(f)); }} />
              </label>
              {photo ? <button type="button" className="btn sm outline" style={tint('var(--red)')} onClick={() => setPhoto(undefined)}>{t('हटाएँ', 'Remove')}</button> : null}
            </div>
          </div>
          <Field label={t('स्थान (GPS / पता)', 'Location (GPS / address)')} required icon="map-marker" value={location} onChange={(e) => { setLocation(e.target.value); setError(''); }} />
          {error ? <div className="error">{error}</div> : null}
          <button type="submit" className="btn block" style={tint('var(--orange)')}>{t('सबमिट करें', 'Submit')}</button>
        </form>
      )}
    </div>
  );
}
