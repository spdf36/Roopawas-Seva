import { CATEGORIES, DEPARTMENTS, OVERDUE_DAYS, Request, RequestFilter, WARDS, daysOpen, isClosed } from '@shared/data';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { RequestQuery, RequestSort } from '../../api';
import { useRequests } from '../../api/hooks';
import { Btn, Card, Chips, Empty, Field, Grid, Ico, Loaded, RequestRow, Row, Screen, Select, Txt } from '../../components/ui';
import { useFilterOptions } from '../../filters';
import { useT } from '../../store';
import { C } from '../../theme';

/** Days a request has been open (coloured as it gets old), or how long a closed one took. */
function Age({ r }: { r: Request }) {
  const { t } = useT();
  const days = daysOpen(r);
  if (isClosed(r)) return <Txt size={12} color={C.sub}>{t(`${days} दिन में निपटा`, `closed in ${days} days`)}</Txt>;
  const color = days >= OVERDUE_DAYS ? C.red : days >= 7 ? C.amber : C.sub;
  return (
    <Row gap={4}>
      {days >= OVERDUE_DAYS ? <Ico name="alert" size={14} color={C.red} /> : null}
      <Txt w="b" size={12} color={color}>{t(`${days} दिन से खुला`, `open ${days} days`)}{days >= OVERDUE_DAYS ? t(' – देर हो रही है', ' – overdue') : ''}</Txt>
    </Row>
  );
}

export default function AdminRequests() {
  const { t, tl } = useT();
  const router = useRouter();
  const options = useFilterOptions();
  // A citizen's mobile number can arrive from User management.
  const params = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState<RequestQuery>({ q: params.q, status: 'all', sort: 'newest' });
  const [search, setSearch] = useState(params.q ?? '');
  const [showFilters, setShowFilters] = useState(false);
  const requests = useRequests(query);
  const set = (patch: Partial<RequestQuery>) => setQuery((q) => ({ ...q, ...patch }));

  // The search box updates the query once typing pauses.
  useEffect(() => {
    const timer = setTimeout(() => set({ q: search.trim() || undefined }), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const filtered = !!(query.q || query.category || query.department || query.ward || query.status !== 'all');
  const all = { id: '', label: t('सभी', 'All') };
  const list = requests.data;

  return (
    <Screen back icon="file-document-multiple-outline" title={t('सभी आवेदन', 'All Applications')} subtitle={list ? t(`${list.length} आवेदन`, `${list.length} requests`) : undefined}>
      <Card style={{ gap: 10 }}>
        <Field
          label={t('खोजें', 'Search')} icon="magnify" value={search} onChangeText={setSearch} autoCapitalize="none"
          placeholder={t('आवेदन नंबर, नाम या मोबाइल नंबर', 'Request number, name or mobile number')}
        />
        <Chips value={query.status ?? 'all'} options={options} onChange={(status: RequestFilter) => set({ status })} />
        <Row wrap>
          <Btn small outline icon={showFilters ? 'chevron-up' : 'filter-variant'} label={showFilters ? t('फ़िल्टर छिपाएँ', 'Hide filters') : t('और फ़िल्टर', 'More filters')} onPress={() => setShowFilters(!showFilters)} />
          {filtered ? (
            <Btn small outline color={C.red} icon="filter-remove-outline" label={t('फ़िल्टर हटाएँ', 'Clear filters')} onPress={() => { setSearch(''); setQuery({ status: 'all', sort: query.sort }); }} />
          ) : null}
        </Row>
        {showFilters ? (
          <View style={{ gap: 10 }}>
            <Grid cols={2}>
              {[
                <Select
                  key="c" label={t('श्रेणी', 'Category')} value={query.category ?? ''} onChange={(v) => set({ category: v || undefined })}
                  options={[all, ...CATEGORIES.map((c) => ({ id: c.id, label: tl(c.name) })), { id: 'application', label: t('योजना आवेदन', 'Scheme applications') }]}
                />,
                <Select key="w" label={t('वार्ड', 'Ward')} value={query.ward ?? ''} onChange={(v) => set({ ward: v || undefined })} options={[all, ...WARDS.map((w) => ({ id: w.id, label: tl(w.name) }))]} />,
              ]}
            </Grid>
            <Select
              label={t('विभाग', 'Department')} value={query.department ?? ''} onChange={(v) => set({ department: v || undefined })}
              options={[all, ...Object.entries(DEPARTMENTS).map(([id, name]) => ({ id, label: tl(name) }))]}
            />
            <Select
              label={t('क्रम', 'Sort by')} value={query.sort} onChange={(v) => set({ sort: v as RequestSort })}
              options={[
                { id: 'newest', label: t('नए पहले', 'Newest first') },
                { id: 'oldest', label: t('पुराने पहले', 'Oldest first') },
                { id: 'updated', label: t('हाल में बदले', 'Recently updated') },
              ]}
            />
          </View>
        ) : null}
      </Card>
      <Loaded q={requests}>
        {(rows) => rows.length === 0 ? (
          <Empty icon="clipboard-text-search-outline" text={filtered ? t('इन फ़िल्टर से कोई आवेदन नहीं मिला', 'No requests match these filters') : t('यहाँ कोई आवेदन नहीं है', 'No applications here')} />
        ) : (
          // Dimmed while results for changed filters are loading.
          <View style={{ gap: 10, opacity: requests.isPlaceholderData ? 0.6 : 1 }}>
            {rows.map((r) => (
              <RequestRow
                key={r.id} r={r} showCitizen onPress={() => router.push(`/admin/request/${r.id}`)}
                right={(
                  <>
                    <Txt size={12} color={C.sub} numberOfLines={1}>{tl(DEPARTMENTS[r.department] ?? DEPARTMENTS.panchayat)}{r.citizen.ward ? `  •  ${tl(WARDS.find((w) => w.id === r.citizen.ward)?.name ?? { hi: '', en: '' })}` : ''}</Txt>
                    <Age r={r} />
                  </>
                )}
              />
            ))}
          </View>
        )}
      </Loaded>
    </Screen>
  );
}
