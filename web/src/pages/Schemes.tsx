import { Link } from 'react-router-dom';
import { Badge, Bubble, Icon, NeedLogin, PageHead, tint } from '../components/ui';
import { DEPARTMENTS, SCHEME_GROUPS } from '../data';
import { useStore, useT, useUser } from '../store';
import { C } from '../theme';

export function Schemes() {
  const { t, tl } = useT();
  const user = useUser();
  const isCitizen = user?.role === 'citizen';
  const requests = useStore((s) => s.requests);
  const applyScheme = useStore((s) => s.applyScheme);
  const occupation = user?.occupation;
  // The group matching the citizen's registered occupation is listed first.
  const groups = [...SCHEME_GROUPS].sort((a, b) => Number(b.occupation === occupation) - Number(a.occupation === occupation));
  const applied = (schemeId: string) => requests.find((r) => r.citizen.mobile === user?.mobile && r.schemeId === schemeId);

  return (
    <div className="container page">
      <PageHead icon="bank-outline" title={t('सरकारी योजनाएँ', 'Government Schemes')} subtitle={t('आपके लिए उपलब्ध संभावित योजनाएं', 'Schemes you may be eligible for')} />
      <div className="stack" style={{ gap: 26 }}>
        {user ? null : <NeedLogin next="/schemes" />}
        {groups.map((g) => (
          <section key={g.id}>
            <div className="row" style={{ marginBottom: 10 }}>
              <Bubble v={g} size={40} />
              <h2 style={{ fontSize: 21 }}>{tl(g.name)}</h2>
              {g.occupation === occupation ? <Badge label={t('आपके लिए', 'For you')} color={C.green} soft={C.greenSoft} /> : null}
            </div>
            <div className="grid g3">
              {g.schemes.map((sc) => {
                const existing = applied(sc.id);
                return (
                  <div key={sc.id} className="card stack" style={{ gap: 6 }}>
                    <h3 style={{ fontSize: 18 }}>{tl(sc.name)}</h3>
                    <p className="sub grow">{tl(sc.desc)}</p>
                    <div className="tiny" style={{ color: g.color, fontWeight: 600 }}>{tl(DEPARTMENTS[sc.dept])}</div>
                    {existing ? (
                      <Link to={`/requests/${existing.id}`} className="btn sm outline" style={tint('var(--green)')}>
                        <Icon name="check-circle-outline" size={17} />{t('आवेदन किया गया', 'Applied')}  •  {existing.id}
                      </Link>
                    ) : user && !isCitizen ? null : (
                      <button className="btn sm" style={tint(g.color)} disabled={!isCitizen} onClick={() => applyScheme(sc.id)}>
                        <Icon name="send" size={16} />{t('आवेदन करें', 'Apply')}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
