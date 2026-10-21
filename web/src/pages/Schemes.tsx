import { Link } from 'react-router-dom';
import { useApplyScheme, useRequests, useSchemes } from '../api/hooks';
import { Badge, Bubble, Empty, Icon, Loaded, NeedLogin, PageHead, tint, useErrorText } from '../components/ui';
import { DEPARTMENTS, SCHEME_GROUPS } from '../data';
import { useT, useUser } from '../store';
import { C } from '../theme';

export function Schemes() {
  const { t, tl } = useT();
  const user = useUser();
  const isCitizen = user?.role === 'citizen';
  // Visitors and citizens get open schemes only; staff also see closed ones (marked as such).
  const schemes = useSchemes();
  // Only a citizen has applications of their own to mark as "Applied".
  const requests = useRequests(isCitizen);
  const apply = useApplyScheme();
  const errorText = useErrorText();
  const occupation = user?.occupation;
  // The group matching the citizen's registered occupation is listed first.
  const groups = [...SCHEME_GROUPS].sort((a, b) => Number(b.occupation === occupation) - Number(a.occupation === occupation));
  const applied = (schemeId: string) => requests.data?.find((r) => r.schemeId === schemeId);

  return (
    <div className="container page">
      <PageHead icon="bank-outline" title={t('सरकारी योजनाएँ', 'Government Schemes')} subtitle={t('आपके लिए उपलब्ध संभावित योजनाएं', 'Schemes you may be eligible for')} />
      <div className="stack" style={{ gap: 26 }}>
        {user ? null : <NeedLogin next="/schemes" />}
        {apply.isError ? <div className="error">{errorText(apply.error)}</div> : null}
        <Loaded q={schemes}>
          {(list) => list.length === 0 ? <Empty icon="bank-off-outline" text={t('अभी कोई योजना उपलब्ध नहीं है', 'No schemes are available right now')} /> : groups.map((g) => {
            const inGroup = list.filter((s) => s.groupId === g.id);
            if (inGroup.length === 0) return null;
            return (
              <section key={g.id}>
                <div className="row" style={{ marginBottom: 10 }}>
                  <Bubble v={g} size={40} />
                  <h2 style={{ fontSize: 21 }}>{tl(g.name)}</h2>
                  {g.occupation === occupation ? <Badge label={t('आपके लिए', 'For you')} color={C.green} soft={C.greenSoft} /> : null}
                </div>
                <div className="grid g3">
                  {inGroup.map((sc) => {
                    const existing = applied(sc.id);
                    const applying = apply.isPending && apply.variables === sc.id;
                    return (
                      <div key={sc.id} className="card stack" style={{ gap: 6, opacity: sc.open ? 1 : 0.7 }}>
                        <div className="row">
                          <h3 className="grow" style={{ fontSize: 18 }}>{tl(sc.name)}</h3>
                          {sc.open ? null : <Badge label={t('बंद', 'Closed')} color="var(--red)" soft="#fde5e8" />}
                        </div>
                        <p className="sub grow">{tl(sc.desc)}</p>
                        <div className="tiny" style={{ color: g.color, fontWeight: 600 }}>{tl(DEPARTMENTS[sc.dept] ?? DEPARTMENTS.panchayat)}</div>
                        {existing ? (
                          <Link to={`/requests/${existing.id}`} className="btn sm outline" style={tint('var(--green)')}>
                            <Icon name="check-circle-outline" size={17} />{t('आवेदन किया गया', 'Applied')}  •  {existing.id}
                          </Link>
                        ) : user && !isCitizen ? null : (
                          <button className="btn sm" style={tint(g.color)} disabled={!isCitizen || requests.isPending || apply.isPending} onClick={() => apply.mutate(sc.id)}>
                            <Icon name={applying ? 'loading' : 'send'} spin={applying} size={16} />{t('आवेदन करें', 'Apply')}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </Loaded>
      </div>
    </div>
  );
}
