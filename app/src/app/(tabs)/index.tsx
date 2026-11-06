import { C as SC } from '@shared/colors';
import { fmtDate, yojnaTotals, fmtRupees } from '@shared/data';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotices, useVillageStats, useYojnas } from '../../api/hooks';
import { Banner, Logo } from '../../components/Art';
import { Btn, Card, Grid, Heading, Ico, IconName, LangToggle, Loaded, Row, StackedBar, Txt } from '../../components/ui';
import { useT, useUser } from '../../store';
import { C } from '../../theme';

// `login`: the tile needs a citizen account; visitors are sent to log in first.
const TILES: { href: string; icon: IconName; color: string; hi: string; en: string; login?: boolean }[] = [
  { href: '/profile', icon: 'account', color: SC.green, hi: 'मेरी जानकारी', en: 'My Profile', login: true },
  { href: '/schemes', icon: 'bank', color: SC.orange, hi: 'योजनाएँ', en: 'Government Schemes' },
  { href: '/complaint', icon: 'bullhorn', color: SC.red, hi: 'मेरी समस्या', en: 'Complaint / Request', login: true },
  { href: '/updates', icon: 'bell-ring', color: SC.purple, hi: 'सूचनाएँ', en: 'Latest Updates' },
  { href: '/requests', icon: 'file-document-outline', color: SC.blue, hi: 'मेरी आवेदनें', en: 'My Applications' },
  { href: '/dashboard', icon: 'home-city', color: SC.teal, hi: 'गाँव की प्रगति', en: 'Village Dashboard' },
];

export default function Home() {
  const { t, tl, lang } = useT();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useUser();
  const stats = useVillageStats();
  const notices = useNotices();
  const yojnas = useYojnas();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.card }} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 24 }}>
      <View style={{ width: '100%', maxWidth: 720, alignSelf: 'center' }}>
        <View>
          <Banner height={170} />
          <View style={{ position: 'absolute', top: 10, right: 12 }}>
            <LangToggle />
          </View>
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Logo size={40} />
              <Txt w="xb" size={24} color={C.navy}>Roopawas Seva</Txt>
            </View>
            <Txt w="sb" size={15} color={C.navy}>रूपावास की डिजिटल सेवा</Txt>
          </View>
        </View>

        <View style={{ padding: 16, gap: 14 }}>
          {user ? (
            <Txt w="sb" size={16} color={C.navy}>{t(`नमस्ते, ${user.name}`, `Namaste, ${user.name}`)}</Txt>
          ) : (
            <Card style={{ backgroundColor: C.blueSoft, borderColor: '#BCD3F5', gap: 8 }}>
              <Txt size={14}>{t('शिकायत और योजना आवेदन के लिए लॉगिन करें। गाँव की जानकारी सबके लिए खुली है।', 'Log in to raise complaints and apply for schemes. Village information is open to everyone.')}</Txt>
              <Row>
                <Btn small color={C.navy} icon="login" label={t('लॉगिन करें', 'Log in')} onPress={() => router.push('/login')} style={{ flex: 1 }} />
                <Btn small outline color={C.green} icon="account-plus-outline" label={t('पंजीकरण करें', 'Register')} onPress={() => router.push('/register')} style={{ flex: 1 }} />
              </Row>
            </Card>
          )}

          <Grid cols={2}>
            {TILES.map((tile) => (
              <Pressable
                key={tile.href}
                onPress={() => router.navigate(tile.login && !user ? '/login' : tile.href)}
                accessibilityRole="button"
                style={({ pressed }) => ({
                  backgroundColor: tile.color, borderRadius: 10, minHeight: 104, paddingVertical: 12, paddingHorizontal: 6,
                  alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.85 : 1,
                })}
              >
                <Ico name={tile.icon} size={32} color="#FFFFFF" />
                {/* Full-width label: a shrink-wrapped Devanagari label can lose its last word on Android. */}
                <Txt w="b" size={18} color="#FFFFFF" center style={{ alignSelf: 'stretch', marginTop: 4 }}>{lang === 'hi' ? tile.hi : tile.en}</Txt>
              </Pressable>
            ))}
          </Grid>

          {/* Village Yojnas: development works and their money, open to everyone. */}
          <Card onPress={() => router.push('/yojnas')} style={{ gap: 8, borderColor: C.orange, backgroundColor: C.orangeSoft }}>
            <Row>
              <Ico name="hammer-wrench" size={28} color={C.orange} />
              <View style={{ flex: 1 }}>
                <Txt w="b" size={17} color={C.text}>{t('ग्राम विकास योजनाएँ', 'Village Yojnas')}</Txt>
                <Txt size={13} color={C.sub}>{t('स्थिति, स्वीकृति, प्राप्त राशि और हर खर्च', 'Status, approvals, money received and every expense')}</Txt>
              </View>
              <Ico name="chevron-right" size={24} color={C.orange} />
            </Row>
            {yojnas.data?.length ? (
              <Row gap={14} wrap>
                <Txt size={13}>{t('योजनाएँ', 'Yojnas')}: <Txt w="b" size={13}>{yojnas.data.length}</Txt></Txt>
                <Txt size={13}>{t('प्राप्त', 'Received')}: <Txt w="b" size={13} color={C.blue}>{fmtRupees(yojnaTotals({ funds: yojnas.data.flatMap((y) => y.funds), expenses: [] }).received)}</Txt></Txt>
                <Txt size={13}>{t('खर्च', 'Spent')}: <Txt w="b" size={13} color={C.orange}>{fmtRupees(yojnaTotals({ funds: [], expenses: yojnas.data.flatMap((y) => y.expenses) }).spent)}</Txt></Txt>
              </Row>
            ) : null}
          </Card>

          <Card style={{ gap: 8 }}>
            <Heading right={<Btn small outline label={t('पूरा देखें', 'View all')} onPress={() => router.push('/dashboard')} />}>
              {t('रूपावास – गाँव की प्रगति', 'Roopawas – Village Progress')}
            </Heading>
            <Loaded q={stats}>
              {(st) => (
                <>
                  <Row gap={6} style={{ alignItems: 'baseline' }}>
                    <Txt w="xb" size={30} color={C.navy}>{st.total}</Txt>
                    <Txt size={14} color={C.sub}>{t('कुल अनुरोध', 'Total requests')}</Txt>
                  </Row>
                  <StackedBar parts={[{ value: st.resolved, color: C.green }, { value: st.inProgress, color: C.amber }, { value: st.forwarded, color: C.orange }]} />
                  <Grid cols={3}>
                    {[
                      [t('निपटाए गए', 'Resolved'), st.resolved, C.green],
                      [t('प्रगति पर', 'In progress'), st.inProgress, C.amber],
                      [t('विभाग को भेजे', 'Sent to dept'), st.forwarded, C.orange],
                    ].map(([label, value, color]) => (
                      <View key={String(label)}>
                        <Txt size={12} color={C.sub}>{label}</Txt>
                        <Txt w="b" size={18} color={String(color)}>{value}</Txt>
                      </View>
                    ))}
                  </Grid>
                </>
              )}
            </Loaded>
          </Card>

          <Card style={{ gap: 10 }}>
            <Heading right={<Btn small outline label={t('सभी', 'All')} onPress={() => router.push('/updates')} />}>
              {t('ताज़ा सूचनाएँ', 'Latest Information')}
            </Heading>
            <Loaded q={notices}>
              {(list) => list.slice(0, 3).map((n) => (
                <Row key={n.id} gap={10} style={{ alignItems: 'flex-start' }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: n.color, alignItems: 'center', justifyContent: 'center' }}>
                    <Ico name={n.icon} size={20} color="#FFFFFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Txt w="b" size={15}>{tl(n.title)}</Txt>
                    <Txt size={13} color={C.sub}>{tl(n.body)}</Txt>
                    <Txt size={12} color={C.faint}>{fmtDate(n.publishedAt)}</Txt>
                  </View>
                </Row>
              ))}
            </Loaded>
          </Card>

          <View style={{ alignItems: 'center', marginTop: 4 }}>
            <View style={{ borderBottomWidth: 2, borderBottomColor: C.orange, paddingBottom: 2 }}>
              <Txt w="b" size={17} color={C.orange} center>
                {t('“साथ मिलकर, बेहतर रूपावास”', '“Together, a better Roopawas”')}
              </Txt>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
