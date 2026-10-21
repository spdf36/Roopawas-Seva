import type { MaterialCommunityIcons } from '@expo/vector-icons';
import { C } from './theme';

export type L = { hi: string; en: string };
export type Icon = keyof typeof MaterialCommunityIcons.glyphMap;
export type Visual = { icon: Icon; color: string; soft: string };

export const l = (hi: string, en: string): L => ({ hi, en });

// ---------- Departments ----------
export const DEPARTMENTS: Record<string, L> = {
  panchayat: l('ग्राम पंचायत', 'Gram Panchayat'),
  phed: l('जलदाय विभाग (PHED)', 'Water Supply Dept (PHED)'),
  power: l('बिजली विभाग', 'Electricity Dept'),
  pwd: l('लोक निर्माण विभाग (PWD)', 'Public Works Dept (PWD)'),
  education: l('शिक्षा विभाग', 'Education Dept'),
  health: l('स्वास्थ्य विभाग', 'Health Dept'),
  social: l('सामाजिक न्याय विभाग', 'Social Justice Dept'),
  agri: l('कृषि विभाग', 'Agriculture Dept'),
  skill: l('कौशल एवं रोजगार विभाग', 'Skill & Employment Dept'),
};

// ---------- Complaint categories ----------
export type Category = Visual & { id: string; name: L; dept: string };

export const CATEGORIES: Category[] = [
  { id: 'water', name: l('पानी', 'Water'), dept: 'phed', icon: 'water', color: C.blue, soft: C.blueSoft },
  { id: 'light', name: l('स्ट्रीट लाइट / बिजली', 'Street Light / Electricity'), dept: 'power', icon: 'lightbulb-on-outline', color: C.green, soft: C.greenSoft },
  { id: 'road', name: l('सड़क', 'Road'), dept: 'pwd', icon: 'road-variant', color: C.orange, soft: C.orangeSoft },
  { id: 'clean', name: l('सफाई / स्वच्छता', 'Sanitation'), dept: 'panchayat', icon: 'trash-can-outline', color: C.teal, soft: C.tealSoft },
  { id: 'school', name: l('स्कूल', 'School'), dept: 'education', icon: 'school-outline', color: C.purple, soft: C.purpleSoft },
  { id: 'health', name: l('स्वास्थ्य', 'Health'), dept: 'health', icon: 'medical-bag', color: C.red, soft: C.redSoft },
  { id: 'other', name: l('अन्य', 'Other'), dept: 'panchayat', icon: 'dots-horizontal-circle-outline', color: C.sub, soft: '#EDF1F6' },
];

// ---------- Schemes ----------
export type Scheme = { id: string; name: L; desc: L; dept: string };
export type SchemeGroup = Visual & { id: string; name: L; occupation: string; schemes: Scheme[] };

export const SCHEME_GROUPS: SchemeGroup[] = [
  {
    id: 'student', name: l('छात्र', 'Students'), occupation: 'student',
    icon: 'school', color: C.blue, soft: C.blueSoft,
    schemes: [
      { id: 'scholarship', name: l('छात्रवृत्ति योजना', 'Scholarship Scheme'), dept: 'education', desc: l('कक्षा 9 से स्नातक तक के विद्यार्थियों के लिए वार्षिक छात्रवृत्ति।', 'Annual scholarship for students from class 9 to graduation.') },
      { id: 'coaching', name: l('कोचिंग / प्रतियोगी परीक्षाएं', 'Coaching / Competitive Exams'), dept: 'education', desc: l('प्रतियोगी परीक्षाओं की तैयारी के लिए निःशुल्क कोचिंग सहायता।', 'Free coaching support for competitive exam preparation.') },
      { id: 'digital', name: l('डिजिटल शिक्षा', 'Digital Education'), dept: 'education', desc: l('टैबलेट, इंटरनेट और ऑनलाइन कक्षाओं की सुविधा।', 'Tablets, internet access and online classes.') },
    ],
  },
  {
    id: 'farmer', name: l('किसान', 'Farmers'), occupation: 'farmer',
    icon: 'sprout', color: C.green, soft: C.greenSoft,
    schemes: [
      { id: 'agri-subsidy', name: l('कृषि अनुदान', 'Agriculture Subsidy'), dept: 'agri', desc: l('बीज, खाद और कृषि यंत्रों पर अनुदान।', 'Subsidy on seeds, fertiliser and farm equipment.') },
      { id: 'irrigation', name: l('सिंचाई / जल संरक्षण', 'Irrigation / Water Conservation'), dept: 'agri', desc: l('ड्रिप सिंचाई, फार्म पॉन्ड और जल संरक्षण कार्यों के लिए सहायता।', 'Support for drip irrigation, farm ponds and water conservation.') },
      { id: 'crop-insurance', name: l('फसल बीमा', 'Crop Insurance'), dept: 'agri', desc: l('प्राकृतिक आपदा से फसल नुकसान पर बीमा सुरक्षा।', 'Insurance cover for crop loss due to natural calamities.') },
    ],
  },
  {
    id: 'women', name: l('महिला', 'Women'), occupation: 'homemaker',
    icon: 'face-woman', color: C.orange, soft: C.orangeSoft,
    schemes: [
      { id: 'shg', name: l('स्वयं सहायता समूह', 'Self Help Groups'), dept: 'panchayat', desc: l('समूह बनाकर बचत और कम ब्याज पर ऋण की सुविधा।', 'Group savings and low-interest loans.') },
      { id: 'enterprise', name: l('उद्यमिता / ट्रेनिंग', 'Entrepreneurship / Training'), dept: 'skill', desc: l('सिलाई, डेयरी और लघु उद्योग के लिए प्रशिक्षण।', 'Training for tailoring, dairy and small enterprises.') },
      { id: 'nutrition', name: l('पोषण व स्वास्थ्य', 'Nutrition & Health'), dept: 'health', desc: l('गर्भवती महिलाओं और बच्चों के लिए पोषण सहायता।', 'Nutrition support for expecting mothers and children.') },
    ],
  },
  {
    id: 'senior', name: l('वरिष्ठ नागरिक', 'Senior Citizens'), occupation: 'senior',
    icon: 'human-cane', color: C.navy, soft: C.blueSoft,
    schemes: [
      { id: 'pension', name: l('पेंशन योजना', 'Pension Scheme'), dept: 'social', desc: l('60 वर्ष से अधिक आयु के नागरिकों के लिए मासिक पेंशन।', 'Monthly pension for citizens above 60 years.') },
      { id: 'senior-health', name: l('स्वास्थ्य सुविधा', 'Health Care'), dept: 'health', desc: l('निःशुल्क जांच, दवा और स्वास्थ्य शिविर।', 'Free check-ups, medicines and health camps.') },
    ],
  },
  {
    id: 'jobseeker', name: l('नौकरी चाहने वाले', 'Job Seekers'), occupation: 'jobseeker',
    icon: 'briefcase-account', color: C.red, soft: C.redSoft,
    schemes: [
      { id: 'skill-dev', name: l('कौशल विकास', 'Skill Development'), dept: 'skill', desc: l('निःशुल्क कौशल प्रशिक्षण और प्रमाण पत्र।', 'Free skill training with certification.') },
      { id: 'job-info', name: l('रोजगार सूचना', 'Employment Information'), dept: 'skill', desc: l('नई भर्तियों और रोजगार मेलों की जानकारी।', 'Updates on new vacancies and job fairs.') },
    ],
  },
];

export const findScheme = (schemeId: string) => {
  for (const g of SCHEME_GROUPS) {
    const s = g.schemes.find((x) => x.id === schemeId);
    if (s) return { group: g, scheme: s };
  }
  return undefined;
};

// ---------- Registration options ----------
export const AGE_GROUPS: { id: string; name: L }[] = [
  { id: '18-25', name: l('18 – 25 वर्ष', '18 – 25 years') },
  { id: '26-40', name: l('26 – 40 वर्ष', '26 – 40 years') },
  { id: '41-60', name: l('41 – 60 वर्ष', '41 – 60 years') },
  { id: '60+', name: l('60 वर्ष से अधिक', 'Above 60 years') },
];

export const WARDS: { id: string; name: L }[] = [1, 2, 3, 4, 5, 6].map((n) => ({
  id: `w${n}`,
  name: l(`रूपावास – वार्ड ${n}`, `Roopawas – Ward ${n}`),
}));

export const OCCUPATIONS: { id: string; name: L }[] = [
  { id: 'farmer', name: l('किसान', 'Farmer') },
  { id: 'student', name: l('छात्र', 'Student') },
  { id: 'employed', name: l('नौकरीपेशा', 'Employed') },
  { id: 'jobseeker', name: l('नौकरी की तलाश में', 'Job Seeker') },
  { id: 'homemaker', name: l('गृहिणी', 'Homemaker') },
  { id: 'business', name: l('व्यवसाय', 'Business') },
  { id: 'senior', name: l('वरिष्ठ नागरिक', 'Senior Citizen') },
];

// ---------- Requests ----------
export type Status = 'submitted' | 'received' | 'under_review' | 'forwarded' | 'action_taken' | 'resolved' | 'rejected';

export const FLOW: Status[] = ['submitted', 'received', 'under_review', 'forwarded', 'action_taken', 'resolved'];

export const STATUS: Record<Status, { name: L; color: string; soft: string }> = {
  submitted: { name: l('जमा', 'Submitted'), color: C.blue, soft: C.blueSoft },
  received: { name: l('प्राप्त', 'Received'), color: C.blue, soft: C.blueSoft },
  under_review: { name: l('समीक्षाधीन', 'Under Review'), color: C.amber, soft: C.amberSoft },
  forwarded: { name: l('विभाग को भेजा', 'Forwarded'), color: C.orange, soft: C.orangeSoft },
  action_taken: { name: l('कार्रवाई हुई', 'Action Taken'), color: C.teal, soft: C.tealSoft },
  resolved: { name: l('हल', 'Resolved'), color: C.green, soft: C.greenSoft },
  rejected: { name: l('अस्वीकृत', 'Rejected'), color: C.red, soft: C.redSoft },
};

// What each step means to the citizen, mirroring the six-step flow on the board.
export const FLOW_HINT: Record<Status, L> = {
  submitted: l('नागरिक ने अनुरोध भेजा', 'Citizen submitted the request'),
  received: l('पंचायत ने प्राप्त कर जांच की', 'Panchayat received and verified it'),
  under_review: l('पंचायत समिति में समीक्षा', 'Under review by the Panchayat Samiti'),
  forwarded: l('संबंधित विभाग को भेजा गया', 'Forwarded to the concerned department'),
  action_taken: l('विभाग ने कार्रवाई की', 'Department took action'),
  resolved: l('समाधान हुआ, नागरिक को सूचित किया', 'Resolved and citizen notified'),
  rejected: l('अनुरोध अस्वीकृत', 'Request rejected'),
};

export type HistoryEntry = { status: Status; at: number; note?: string };

export type Request = {
  id: string;
  kind: 'complaint' | 'application';
  title: L;
  categoryId?: string; // complaints
  schemeId?: string; // applications
  description: string;
  location: string;
  photo?: string;
  status: Status;
  department: string;
  createdAt: number;
  history: HistoryEntry[];
  citizen: { name: string; mobile: string };
  mine: boolean;
  confirmed?: boolean;
};

export const requestVisual = (r: Request): Visual => {
  if (r.kind === 'application') {
    const found = r.schemeId ? findScheme(r.schemeId) : undefined;
    return found?.group ?? { icon: 'file-document-outline', color: C.blue, soft: C.blueSoft };
  }
  return CATEGORIES.find((c) => c.id === r.categoryId) ?? CATEGORIES[CATEGORIES.length - 1];
};

export const statusLabel = (r: Request): L =>
  r.status === 'resolved' && r.kind === 'application' ? l('पूर्ण', 'Completed') : STATUS[r.status].name;

const DAY = 86400000;
const d = (y: number, m: number, day: number) => new Date(y, m - 1, day, 10, 30).getTime();

function seed(
  r: Omit<Request, 'history' | 'status' | 'location'> & { location?: string },
  upTo: Status,
): Request {
  const steps = FLOW.slice(0, FLOW.indexOf(upTo) + 1);
  return {
    location: 'रूपावास',
    ...r,
    status: upTo,
    history: steps.map((status, i) => ({ status, at: r.createdAt + i * DAY })),
  };
}

const DEMO = { name: 'रामलाल शर्मा', mobile: '9876543210' };

export const SEED_REQUESTS: Request[] = [
  seed({ id: 'RP-2026-00127', kind: 'complaint', mine: true, citizen: DEMO, categoryId: 'water', department: 'phed', title: l('पानी की समस्या', 'Water Problem'), description: 'गांव के चौक पर पानी की टंकी से पानी नहीं आ रहा है।', location: 'रूपावास, मुख्य चौक', createdAt: d(2026, 9, 12) }, 'under_review'),
  seed({ id: 'RP-2026-00125', kind: 'complaint', mine: false, citizen: { name: 'भंवरलाल जाट', mobile: '9829011223' }, categoryId: 'road', department: 'pwd', title: l('सड़क पर गड्ढे', 'Potholes on Road'), description: 'स्कूल वाली सड़क पर बड़े गड्ढे हो गए हैं, बारिश में पानी भर जाता है।', location: 'रूपावास, स्कूल रोड', createdAt: d(2026, 9, 10) }, 'forwarded'),
  seed({ id: 'RP-2026-00121', kind: 'complaint', mine: false, citizen: { name: 'सीता देवी', mobile: '9414055667' }, categoryId: 'clean', department: 'panchayat', title: l('नाली की सफाई', 'Drain Cleaning'), description: 'वार्ड 3 की नाली जाम है, गंदा पानी सड़क पर बह रहा है।', location: 'रूपावास, वार्ड 3', createdAt: d(2026, 9, 8) }, 'action_taken'),
  seed({ id: 'RP-2026-00118', kind: 'complaint', mine: true, citizen: DEMO, categoryId: 'light', department: 'power', title: l('स्ट्रीट लाइट', 'Street Light'), description: 'मंदिर के पास की स्ट्रीट लाइट एक सप्ताह से बंद है।', location: 'रूपावास, मंदिर चौक', createdAt: d(2026, 9, 5) }, 'resolved'),
  seed({ id: 'RP-2026-00115', kind: 'complaint', mine: false, citizen: { name: 'मोहन मीणा', mobile: '9887733445' }, categoryId: 'school', department: 'education', title: l('स्कूल में पेयजल', 'Drinking Water at School'), description: 'सरकारी स्कूल में पीने के पानी की टंकी खराब है।', location: 'रा. उ. मा. विद्यालय, रूपावास', createdAt: d(2026, 9, 4) }, 'received'),
  seed({ id: 'RP-2026-00110', kind: 'application', mine: false, citizen: { name: 'किशन गुर्जर', mobile: '9660122334' }, schemeId: 'agri-subsidy', department: 'agri', title: l('कृषि अनुदान', 'Agriculture Subsidy'), description: 'कृषि अनुदान योजना के लिए आवेदन।', createdAt: d(2026, 9, 3) }, 'under_review'),
  seed({ id: 'RP-2026-00102', kind: 'application', mine: true, citizen: DEMO, schemeId: 'pension', department: 'social', title: l('पेंशन सहायता', 'Pension Assistance'), description: 'पेंशन योजना के लिए आवेदन।', createdAt: d(2026, 9, 1) }, 'submitted'),
  seed({ id: 'RP-2026-00098', kind: 'application', mine: true, citizen: DEMO, schemeId: 'scholarship', department: 'education', title: l('छात्रवृत्ति', 'Scholarship'), description: 'छात्रवृत्ति योजना के लिए आवेदन।', createdAt: d(2026, 8, 28) }, 'resolved'),
];

export const FIRST_NEW_SEQ = 128;

// ---------- Notices ----------
export type NoticeTag = 'govt' | 'panchayat' | 'health';
export type Notice = Visual & { id: string; tag: NoticeTag; title: L; body: L; source: L };

export const NOTICE_TAGS: { id: NoticeTag; name: L }[] = [
  { id: 'govt', name: l('सरकारी', 'Government') },
  { id: 'panchayat', name: l('पंचायत', 'Panchayat') },
  { id: 'health', name: l('स्वास्थ्य', 'Health') },
];

export const TAG_VISUAL: Record<NoticeTag, Visual> = {
  govt: { icon: 'bank', color: C.blue, soft: C.blueSoft },
  panchayat: { icon: 'account-group', color: C.orange, soft: C.orangeSoft },
  health: { icon: 'medical-bag', color: C.red, soft: C.redSoft },
};

export const SEED_NOTICES: Notice[] = [
  { id: 'n1', tag: 'govt', icon: 'human-handsup', color: C.blue, soft: C.blueSoft, title: l('मुख्यमंत्री युवा संबल योजना', 'Mukhyamantri Yuva Sambal Yojana'), body: l('आवेदन की अंतिम तिथि – 30 सितंबर 2026', 'Last date to apply – 30 September 2026'), source: l('राजस्थान सरकार', 'Government of Rajasthan') },
  { id: 'n2', tag: 'govt', icon: 'sprout', color: C.green, soft: C.greenSoft, title: l('कृषि विभाग की नई योजना', 'New Scheme from Agriculture Dept'), body: l('किसानों के लिए अनुदान की जानकारी', 'Subsidy information for farmers'), source: l('कृषि विभाग', 'Agriculture Dept') },
  { id: 'n3', tag: 'health', icon: 'medical-bag', color: C.red, soft: C.redSoft, title: l('मुफ्त स्वास्थ्य शिविर', 'Free Health Camp'), body: l('15 सितंबर 2026 – प्राथमिक स्वास्थ्य केंद्र', '15 September 2026 – Primary Health Centre'), source: l('स्वास्थ्य विभाग', 'Health Dept') },
  { id: 'n4', tag: 'panchayat', icon: 'calendar-month', color: C.orange, soft: C.orangeSoft, title: l('ग्राम सभा बैठक', 'Gram Sabha Meeting'), body: l('20 सितंबर 2026, समय: 11 बजे', '20 September 2026, 11 AM'), source: l('ग्राम पंचायत रूपावास', 'Gram Panchayat Roopawas') },
  { id: 'n5', tag: 'panchayat', icon: 'water-alert', color: C.blue, soft: C.blueSoft, title: l('जल आपूर्ति में अस्थायी बाधा', 'Temporary Water Supply Disruption'), body: l('18 सितंबर 2026, सुबह 8–10 बजे', '18 September 2026, 8–10 AM'), source: l('पंचायत सूचना', 'Panchayat Notice') },
];

// ---------- Village dashboard ----------
// Figures recorded before this demo's sample requests; the dashboard adds live counts on top.
export const DASHBOARD_BASE = {
  total: 420,
  resolved: 359,
  inProgress: 44,
  forwarded: 17,
  roads: 3,
  water: 6,
  lightsFixed: 17,
  schemeApplications: 134,
  schoolWorks: 3,
  trees: 250,
};

export const DEVELOPMENT_WORKS: { id: string; name: L; progress: number; budget: string }[] = [
  { id: 'd1', name: l('मुख्य सड़क का सीसी निर्माण', 'CC paving of the main road'), progress: 70, budget: '₹ 18.5 लाख' },
  { id: 'd2', name: l('नई पानी की टंकी (वार्ड 4)', 'New water tank (Ward 4)'), progress: 45, budget: '₹ 12 लाख' },
  { id: 'd3', name: l('सोलर स्ट्रीट लाइट – 40 पोल', 'Solar street lights – 40 poles'), progress: 90, budget: '₹ 6.4 लाख' },
  { id: 'd4', name: l('स्कूल भवन की मरम्मत', 'School building repairs'), progress: 30, budget: '₹ 9 लाख' },
  { id: 'd5', name: l('पौधारोपण अभियान – 500 पेड़', 'Plantation drive – 500 trees'), progress: 50, budget: '₹ 1.2 लाख' },
];

export const SEED_USERS: { name: string; mobile: string; occupation: string; ward: string }[] = [
  { name: 'रामलाल शर्मा', mobile: '9876543210', occupation: 'farmer', ward: 'w1' },
  { name: 'भंवरलाल जाट', mobile: '9829011223', occupation: 'farmer', ward: 'w2' },
  { name: 'सीता देवी', mobile: '9414055667', occupation: 'homemaker', ward: 'w3' },
  { name: 'मोहन मीणा', mobile: '9887733445', occupation: 'employed', ward: 'w5' },
  { name: 'किशन गुर्जर', mobile: '9660122334', occupation: 'farmer', ward: 'w4' },
  { name: 'पूजा कुमारी', mobile: '9785566778', occupation: 'student', ward: 'w2' },
];

export const fmtDate = (ts: number) => {
  const dt = new Date(ts);
  const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][dt.getMonth()];
  return `${String(dt.getDate()).padStart(2, '0')} ${mon} ${dt.getFullYear()}`;
};
