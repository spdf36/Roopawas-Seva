import { User } from '@shared/api';
import { Baseline, BASELINE_FIELDS, Notice, Request, Scheme, Yojna } from '@shared/data';
import { AccountDoc, NoticeDoc, RequestDoc, SchemeDoc, YojnaDoc } from './models';
import { billUrl, photoUrl } from './photos';

// Turns stored documents into the shared API types. Everything sent to a client goes through here, so
// fields that must never leave the server (the PIN hash, the photo's file name) are left out by design.

/** Drops undefined fields so responses carry only what is set, like the website's mock API. */
const compact = <T extends object>(o: T): T => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;

export const toUser = (a: AccountDoc): User => compact({
  id: a._id.toString(),
  role: a.role,
  name: a.name,
  loginId: a.loginId,
  mobile: a.mobile,
  active: a.active,
  createdAt: a.createdAt.getTime(),
  ageGroup: a.ageGroup,
  ward: a.ward,
  occupation: a.occupation,
  family: a.family,
  designation: a.designation,
});

export const toRequest = (r: RequestDoc): Request => compact({
  id: r._id,
  kind: r.kind,
  title: { hi: r.title.hi, en: r.title.en },
  categoryId: r.categoryId,
  schemeId: r.schemeId,
  groupId: r.groupId,
  description: r.description,
  location: r.location,
  coords: r.coords ? compact({ lat: r.coords.lat, lng: r.coords.lng, accuracy: r.coords.accuracy }) : undefined,
  // A short-lived signed link, never the file name (see photos.ts).
  photo: r.photo ? photoUrl(r._id) : undefined,
  status: r.status,
  department: r.department,
  createdAt: r.createdAt.getTime(),
  history: r.history.map((h) => compact({ status: h.status, at: h.at.getTime(), note: h.note, by: h.by, byId: h.byId })),
  citizen: compact({ name: r.citizen.name, mobile: r.citizen.mobile, ward: r.citizen.ward }),
  confirmed: r.confirmed,
  reopened: r.reopened,
});

export const toNotice = (n: NoticeDoc): Notice => compact({
  id: n._id.toString(),
  tag: n.tag,
  icon: n.icon,
  color: n.color,
  soft: n.soft,
  title: { hi: n.title.hi, en: n.title.en },
  body: { hi: n.body.hi, en: n.body.en },
  source: { hi: n.source.hi, en: n.source.en },
  publishedAt: n.publishedAt.getTime(),
  updatedAt: n.updatedAt?.getTime(),
});

export const toScheme = (s: SchemeDoc): Scheme => ({
  id: s._id,
  groupId: s.groupId,
  name: { hi: s.name.hi, en: s.name.en },
  desc: { hi: s.desc.hi, en: s.desc.en },
  dept: s.dept,
  open: s.open,
});

export const toYojna = (y: YojnaDoc): Yojna => ({
  id: y._id.toString(),
  name: { hi: y.name.hi, en: y.name.en },
  desc: { hi: y.desc?.hi ?? '', en: y.desc?.en ?? '' },
  dept: y.dept,
  status: y.status,
  statusNote: y.statusNote,
  progress: y.progress,
  levels: y.levels.map((lv) => compact({ name: { hi: lv.name.hi, en: lv.name.en }, approvedAt: lv.approvedAt?.getTime() })),
  funds: y.funds.map((f) => ({
    id: f._id.toString(),
    source: f.source,
    sanctioned: f.sanctioned,
    note: f.note,
    instalments: f.instalments.map((i) => ({ id: i._id.toString(), amount: i.amount, date: i.date.getTime(), note: i.note })),
  })),
  expenses: y.expenses.map((e) => compact({
    id: e._id.toString(),
    date: e.date.getTime(),
    purpose: e.purpose,
    amount: e.amount,
    category: e.category,
    fundId: e.fundId,
    bill: e.bill ? billUrl(e.bill) : undefined,
  })),
  createdAt: y.createdAt.getTime(),
  updatedAt: y.updatedAt.getTime(),
});

export const toBaseline = (b: Baseline): Baseline => Object.fromEntries(BASELINE_FIELDS.map(({ id }) => [id, b[id]])) as Baseline;
