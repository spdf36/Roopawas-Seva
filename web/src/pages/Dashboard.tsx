import { Icon as IconName } from '@shared/data';
import { Link } from 'react-router-dom';
import { useVillageStats, useYojnas } from '../api/hooks';
import { Icon, Loaded, PageHead } from '../components/ui';
import { useT } from '../store';
import { YojnaCard, YojnaTotals } from './Yojnas';

export function Dashboard() {
  const { t } = useT();
  const stats = useVillageStats();
  const yojnas = useYojnas();

  const total = (label: string, value: number, color: string) => (
    <div><div className="small sub">{label}</div><b style={{ fontSize: 24, color }}>{value}</b></div>
  );

  return (
    <div className="container page">
      <PageHead icon="home-city-outline" color="var(--green)" title={t('गाँव की प्रगति', 'Village Dashboard')} subtitle={t('रूपावास – गाँव की प्रगति (सार्वजनिक)', 'Roopawas – village progress (public view)')} />
      <Loaded q={stats}>
        {(st) => {
          const tiles: { icon: IconName; color: string; label: string; value: string; unit: string }[] = [
            { icon: 'road-variant', color: 'var(--green)', label: t('सड़कें', 'Roads'), value: String(st.roads), unit: t('अनुरोध', 'requests') },
            { icon: 'water', color: 'var(--blue)', label: t('पेयजल', 'Drinking Water'), value: String(st.water), unit: t('अनुरोध', 'requests') },
            { icon: 'lightbulb-on-outline', color: 'var(--green)', label: t('स्ट्रीट लाइट', 'Street Lights'), value: String(st.lightsFixed), unit: t('हल', 'fixed') },
            { icon: 'trash-can-outline', color: 'var(--green)', label: t('स्वच्छता', 'Sanitation'), value: '✓', unit: t('नियमित', 'regular') },
            { icon: 'school-outline', color: 'var(--green)', label: t('स्कूल', 'School'), value: String(st.schoolWorks), unit: t('सुधार कार्य', 'repair works') },
            { icon: 'tree', color: 'var(--green)', label: t('पेड़ / पौधारोपण', 'Tree Plantation'), value: String(st.trees), unit: t('पेड़', 'trees') },
          ];
          return (
            <div className="stack" style={{ gap: 16 }}>
              <div className="grid g6">
                {tiles.map((x) => (
                  <div className="card stat" key={x.label}>
                    <Icon name={x.icon} size={32} color={x.color} />
                    <b>{x.label}</b>
                    <span className="small sub"><em>{x.value}</em> {x.unit}</span>
                  </div>
                ))}
              </div>
              <div className="split">
                <div className="card">
                  <h3>{t('कुल अनुरोध', 'Total Requests')}</h3>
                  <div className="big">{st.total}</div>
                  <div className="total-bar">
                    <div style={{ flex: st.resolved, background: 'var(--green)' }} />
                    <div style={{ flex: st.inProgress, background: 'var(--amber)' }} />
                    <div style={{ flex: st.forwarded, background: 'var(--orange)' }} />
                  </div>
                  <div className="grid g3">
                    {total(t('निपटाए गए', 'Resolved'), st.resolved, 'var(--green)')}
                    {total(t('प्रगति पर', 'In progress'), st.inProgress, 'var(--amber)')}
                    {total(t('विभाग को भेजे', 'Sent to dept'), st.forwarded, 'var(--orange)')}
                  </div>
                </div>
                <div className="card row">
                  <Icon name="account-group" size={44} color="var(--green)" />
                  <div>
                    <h3>{t('सरकारी योजनाएँ', 'Government Schemes')}</h3>
                    <div className="sub"><b style={{ fontSize: 26, color: 'var(--green)' }}>{st.schemeApplications}</b> {t('आवेदन सहायता', 'applications assisted')}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        }}
      </Loaded>

      <div className="row wrap" style={{ marginTop: 28, marginBottom: 16 }}>
        <h2 className="section-title grow" style={{ margin: 0 }}>{t('ग्राम विकास योजनाएँ', 'Village Yojnas')}</h2>
        <Link to="/yojnas" className="row small" style={{ gap: 4, color: 'var(--blue)', fontWeight: 600 }}>{t('सभी योजनाएँ देखें', 'See all yojnas')}<Icon name="arrow-right" size={18} /></Link>
      </div>
      <Loaded q={yojnas}>
        {(list) => list.length === 0 ? <p className="sub">{t('अभी कोई योजना दर्ज नहीं', 'No yojnas yet')}</p> : (
          <div className="stack" style={{ gap: 16 }}>
            <YojnaTotals list={list} />
            {/* The most recently changed ones; the Yojnas page has them all. */}
            <div className="grid g2 collapse">
              {[...list].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4).map((y) => <YojnaCard key={y.id} y={y} to={`/yojnas/${y.id}`} />)}
            </div>
          </div>
        )}
      </Loaded>
    </div>
  );
}
