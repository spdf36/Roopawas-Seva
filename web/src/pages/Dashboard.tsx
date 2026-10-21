import { useVillageStats } from '../api/hooks';
import { Icon, Loaded, PageHead } from '../components/ui';
import { Icon as IconName } from '../data';
import { useT } from '../store';

export function Dashboard() {
  const { t } = useT();
  const stats = useVillageStats();

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
    </div>
  );
}
