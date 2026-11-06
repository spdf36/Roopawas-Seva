import { DEPARTMENTS, FLOW, FLOW_HINT, Request, STATUS, fmtDate, mapLink, requestVisual } from '@shared/data';
import { useState } from 'react';
import { Image, Linking, Modal, Pressable, View } from 'react-native';
import { useT } from '../store';
import { C } from '../theme';
import { Bubble, Card, Ico, IconName, ReopenedBadge, Row, StatusBadge, Txt } from './ui';

/** The request itself: title, description, photo, place (with its GPS link) and department. */
export function RequestSummary({ r, showCitizen }: { r: Request; showCitizen?: boolean }) {
  const { t, tl } = useT();
  const [zoom, setZoom] = useState(false);
  return (
    <Card style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Bubble v={requestVisual(r)} size={48} />
        <View style={{ flex: 1 }}>
          <Txt w="b" size={18}>{tl(r.title)}</Txt>
          <Txt size={13} color={C.sub}>{r.id}  •  {fmtDate(r.createdAt)}</Txt>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <StatusBadge r={r} />
          <ReopenedBadge r={r} />
        </View>
      </View>
      <Txt>{r.description}</Txt>
      {r.photo ? (
        <Pressable onPress={() => setZoom(true)} accessibilityRole="imagebutton" accessibilityLabel={t('पूरी फोटो देखें', 'View full photo')}>
          <Image source={{ uri: r.photo }} style={{ width: '100%', height: 190, borderRadius: 8, backgroundColor: C.bg }} resizeMode="cover" />
        </Pressable>
      ) : null}
      <View style={{ gap: 4 }}>
        <Meta icon="map-marker-outline" text={r.location} />
        {r.coords ? (
          <Pressable onPress={() => Linking.openURL(mapLink(r.coords!))} accessibilityRole="link">
            <Row gap={8}>
              <Ico name="crosshairs-gps" size={17} color={C.blue} />
              <Txt w="sb" size={14} color={C.blue} style={{ flex: 1 }}>
                {t('नक्शे पर देखें', 'View on map')} ({r.coords.lat.toFixed(5)}, {r.coords.lng.toFixed(5)}{r.coords.accuracy ? ` ±${r.coords.accuracy} m` : ''})
              </Txt>
            </Row>
          </Pressable>
        ) : null}
        <Meta icon="office-building-outline" text={tl(DEPARTMENTS[r.department] ?? DEPARTMENTS.panchayat)} />
        {showCitizen && r.citizen.name ? <Meta icon="account-outline" text={`${r.citizen.name}  •  +91 ${r.citizen.mobile}`} /> : null}
      </View>
      {r.photo ? <PhotoViewer uri={r.photo} visible={zoom} onClose={() => setZoom(false)} /> : null}
    </Card>
  );
}

/** A photo shown full screen; tap anywhere to close. */
export function PhotoViewer({ uri, visible, onClose }: { uri: string; visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 12 }} onPress={onClose}>
        <Image source={{ uri }} style={{ width: '100%', height: '80%' }} resizeMode="contain" />
        <View style={{ position: 'absolute', top: 40, right: 20 }}><Ico name="close" size={32} color="#FFFFFF" /></View>
      </Pressable>
    </Modal>
  );
}

/** The six-step status timeline, shared by the citizen and admin views. */
export function Timeline({ r }: { r: Request }) {
  const { t, tl } = useT();
  const rejected = r.status === 'rejected';
  const reached = FLOW.indexOf(r.status);
  // Latest history entry per status, so a step shows the date and note of its most recent update.
  const last = Object.fromEntries(r.history.map((h) => [h.status, h]));
  const steps = rejected ? [...FLOW.filter((s) => last[s]), 'rejected' as const] : FLOW;

  return (
    <Card>
      <Txt w="b" size={16} color={C.navy} style={{ marginBottom: 8 }}>{t('स्थिति ट्रैकिंग', 'Status Tracking')}</Txt>
      {steps.map((s, i) => {
        const done = rejected || i <= reached;
        const entry = done ? last[s] : undefined;
        const current = s === r.status;
        const color = s === 'rejected' ? C.red : done ? C.green : C.faint;
        return (
          <View key={s} style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ alignItems: 'center', width: 26 }}>
              <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: done ? color : C.card, borderWidth: 2, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
                {done ? <Ico name={s === 'rejected' ? 'close' : 'check'} size={16} color="#FFFFFF" /> : <Txt w="b" size={12} color={C.faint}>{i + 1}</Txt>}
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
  );
}

function Meta({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Ico name={icon} size={17} color={C.sub} />
      <Txt size={14} color={C.sub} style={{ flex: 1 }}>{text}</Txt>
    </View>
  );
}
