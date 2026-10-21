import { MaterialCommunityIcons as MCI } from '@expo/vector-icons';
import { Image, View } from 'react-native';
import { DEPARTMENTS, FLOW, FLOW_HINT, Icon, Request, STATUS, fmtDate, requestVisual, statusLabel } from '../data';
import { useT } from '../store';
import { C } from '../theme';
import { Badge, Bubble, Card, Txt } from './ui';

/** Summary card plus the six-step status timeline, shared by the citizen and admin views. */
export function RequestDetail({ r, showCitizen }: { r: Request; showCitizen?: boolean }) {
  const { t, tl } = useT();
  const st = STATUS[r.status];
  const rejected = r.status === 'rejected';
  const reached = FLOW.indexOf(r.status);
  // Latest history entry per status, so a step shows the date and note of its most recent update.
  const last = Object.fromEntries(r.history.map((h) => [h.status, h]));
  const steps = rejected ? [...FLOW.filter((s) => last[s]), 'rejected' as const] : FLOW;

  return (
    <>
      <Card style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Bubble v={requestVisual(r)} size={48} />
          <View style={{ flex: 1 }}>
            <Txt w="b" size={18}>{tl(r.title)}</Txt>
            <Txt size={13} color={C.sub}>{r.id}  •  {fmtDate(r.createdAt)}</Txt>
          </View>
          <Badge label={tl(statusLabel(r))} color={st.color} soft={st.soft} />
        </View>
        <Txt>{r.description}</Txt>
        {r.photo ? <Image source={{ uri: r.photo }} style={{ width: '100%', height: 180, borderRadius: 8 }} resizeMode="cover" /> : null}
        <View style={{ gap: 4 }}>
          <Meta icon="map-marker-outline" text={r.location} />
          <Meta icon="office-building-outline" text={tl(DEPARTMENTS[r.department] ?? DEPARTMENTS.panchayat)} />
          {showCitizen && r.citizen.name ? <Meta icon="account-outline" text={`${r.citizen.name}  •  +91 ${r.citizen.mobile}`} /> : null}
        </View>
      </Card>

      <Card>
        <Txt w="b" size={16} color={C.navy} style={{ marginBottom: 8 }}>{t('स्थिति ट्रैकिंग', 'Status Tracking')}</Txt>
        {steps.map((s, i) => {
          const done = s === 'rejected' || rejected || i <= reached;
          const entry = done ? last[s] : undefined;
          const current = s === r.status;
          const color = s === 'rejected' ? C.red : done ? C.green : C.faint;
          return (
            <View key={s} style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ alignItems: 'center', width: 26 }}>
                <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: done ? color : C.card, borderWidth: 2, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
                  {done ? <MCI name={s === 'rejected' ? 'close' : 'check'} size={16} color="#FFFFFF" /> : <Txt w="b" size={12} color={C.faint}>{i + 1}</Txt>}
                </View>
                {i < steps.length - 1 ? <View style={{ flex: 1, width: 2, minHeight: 18, backgroundColor: !rejected && i < reached ? C.green : C.border }} /> : null}
              </View>
              <View style={{ flex: 1, paddingBottom: 12 }}>
                <Txt w={current ? 'b' : 'sb'} size={15} color={done ? C.text : C.faint}>{tl(STATUS[s].name)}</Txt>
                <Txt size={13} color={done ? C.sub : C.faint}>{tl(FLOW_HINT[s])}</Txt>
                {entry ? <Txt size={12} color={C.sub}>{fmtDate(entry.at)}{entry.by ? `  •  ${entry.by}` : ''}</Txt> : null}
                {entry?.note ? (
                  <View style={{ backgroundColor: C.bg, borderRadius: 6, padding: 8, marginTop: 4 }}>
                    <Txt size={13}>{entry.note}</Txt>
                  </View>
                ) : null}
              </View>
            </View>
          );
        })}
      </Card>
    </>
  );
}

function Meta({ icon, text }: { icon: Icon; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <MCI name={icon} size={17} color={C.sub} />
      <Txt size={14} color={C.sub} style={{ flex: 1 }}>{text}</Txt>
    </View>
  );
}
