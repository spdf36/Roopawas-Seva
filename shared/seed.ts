/**
 * Sample data for demos and development: loaded by the server’s seed script and by the website’s mock API.
 */
import { C } from './colors';
import {
  Account, Baseline, DAY, DevelopmentWork, FLOW, L, Notice, Request, Role, Scheme, Status, l,
} from './data';

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day, 10, 30).getTime();

// ---------- Schemes ----------
const scheme = (groupId: string, id: string, dept: string, name: L, desc: L): Scheme => ({ id, groupId, dept, name, desc, open: true });

export const SEED_SCHEMES: Scheme[] = [
  scheme('student', 'scholarship', 'education', l('छात्रवृत्ति योजना', 'Scholarship Scheme'), l('कक्षा 9 से स्नातक तक के विद्यार्थियों के लिए वार्षिक छात्रवृत्ति।', 'Annual scholarship for students from class 9 to graduation.')),
  scheme('student', 'coaching', 'education', l('कोचिंग / प्रतियोगी परीक्षाएं', 'Coaching / Competitive Exams'), l('प्रतियोगी परीक्षाओं की तैयारी के लिए निःशुल्क कोचिंग सहायता।', 'Free coaching support for competitive exam preparation.')),
  scheme('student', 'digital', 'education', l('डिजिटल शिक्षा', 'Digital Education'), l('टैबलेट, इंटरनेट और ऑनलाइन कक्षाओं की सुविधा।', 'Tablets, internet access and online classes.')),
  scheme('farmer', 'agri-subsidy', 'agri', l('कृषि अनुदान', 'Agriculture Subsidy'), l('बीज, खाद और कृषि यंत्रों पर अनुदान।', 'Subsidy on seeds, fertiliser and farm equipment.')),
  scheme('farmer', 'irrigation', 'agri', l('सिंचाई / जल संरक्षण', 'Irrigation / Water Conservation'), l('ड्रिप सिंचाई, फार्म पॉन्ड और जल संरक्षण कार्यों के लिए सहायता।', 'Support for drip irrigation, farm ponds and water conservation.')),
  scheme('farmer', 'crop-insurance', 'agri', l('फसल बीमा', 'Crop Insurance'), l('प्राकृतिक आपदा से फसल नुकसान पर बीमा सुरक्षा।', 'Insurance cover for crop loss due to natural calamities.')),
  scheme('women', 'shg', 'panchayat', l('स्वयं सहायता समूह', 'Self Help Groups'), l('समूह बनाकर बचत और कम ब्याज पर ऋण की सुविधा।', 'Group savings and low-interest loans.')),
  scheme('women', 'enterprise', 'skill', l('उद्यमिता / ट्रेनिंग', 'Entrepreneurship / Training'), l('सिलाई, डेयरी और लघु उद्योग के लिए प्रशिक्षण।', 'Training for tailoring, dairy and small enterprises.')),
  scheme('women', 'nutrition', 'health', l('पोषण व स्वास्थ्य', 'Nutrition & Health'), l('गर्भवती महिलाओं और बच्चों के लिए पोषण सहायता।', 'Nutrition support for expecting mothers and children.')),
  scheme('senior', 'pension', 'social', l('पेंशन योजना', 'Pension Scheme'), l('60 वर्ष से अधिक आयु के नागरिकों के लिए मासिक पेंशन।', 'Monthly pension for citizens above 60 years.')),
  scheme('senior', 'senior-health', 'health', l('स्वास्थ्य सुविधा', 'Health Care'), l('निःशुल्क जांच, दवा और स्वास्थ्य शिविर।', 'Free check-ups, medicines and health camps.')),
  scheme('jobseeker', 'skill-dev', 'skill', l('कौशल विकास', 'Skill Development'), l('निःशुल्क कौशल प्रशिक्षण और प्रमाण पत्र।', 'Free skill training with certification.')),
  scheme('jobseeker', 'job-info', 'skill', l('रोजगार सूचना', 'Employment Information'), l('नई भर्तियों और रोजगार मेलों की जानकारी।', 'Updates on new vacancies and job fairs.')),
];

// ---------- Requests ----------
function seed(
  r: Omit<Request, 'history' | 'status' | 'location'> & { location?: string },
  upTo: Status,
): Request {
  const steps = FLOW.slice(0, FLOW.indexOf(upTo) + 1);
  return {
    location: 'रूपावास',
    groupId: SEED_SCHEMES.find((s) => s.id === r.schemeId)?.groupId,
    ...r,
    status: upTo,
    history: steps.map((status, i) => ({ status, at: r.createdAt + i * DAY })),
  };
}

const DEMO = { name: 'रामलाल शर्मा', mobile: '9876543210', ward: 'w1' };

export const SEED_REQUESTS: Request[] = [
  seed({ id: 'RP-2026-00127', kind: 'complaint', citizen: DEMO, categoryId: 'water', department: 'phed', title: l('पानी की समस्या', 'Water Problem'), description: 'गांव के चौक पर पानी की टंकी से पानी नहीं आ रहा है।', location: 'रूपावास, मुख्य चौक', createdAt: d(2026, 9, 12) }, 'under_review'),
  seed({ id: 'RP-2026-00125', kind: 'complaint', citizen: { name: 'भंवरलाल जाट', mobile: '9829011223', ward: 'w2' }, categoryId: 'road', department: 'pwd', title: l('सड़क पर गड्ढे', 'Potholes on Road'), description: 'स्कूल वाली सड़क पर बड़े गड्ढे हो गए हैं, बारिश में पानी भर जाता है।', location: 'रूपावास, स्कूल रोड', createdAt: d(2026, 9, 10) }, 'forwarded'),
  seed({ id: 'RP-2026-00121', kind: 'complaint', citizen: { name: 'सीता देवी', mobile: '9414055667', ward: 'w3' }, categoryId: 'clean', department: 'panchayat', title: l('नाली की सफाई', 'Drain Cleaning'), description: 'वार्ड 3 की नाली जाम है, गंदा पानी सड़क पर बह रहा है।', location: 'रूपावास, वार्ड 3', createdAt: d(2026, 9, 8) }, 'action_taken'),
  seed({ id: 'RP-2026-00118', kind: 'complaint', citizen: DEMO, categoryId: 'light', department: 'power', title: l('स्ट्रीट लाइट', 'Street Light'), description: 'मंदिर के पास की स्ट्रीट लाइट एक सप्ताह से बंद है।', location: 'रूपावास, मंदिर चौक', createdAt: d(2026, 9, 5) }, 'resolved'),
  seed({ id: 'RP-2026-00115', kind: 'complaint', citizen: { name: 'मोहन मीणा', mobile: '9887733445', ward: 'w5' }, categoryId: 'school', department: 'education', title: l('स्कूल में पेयजल', 'Drinking Water at School'), description: 'सरकारी स्कूल में पीने के पानी की टंकी खराब है।', location: 'रा. उ. मा. विद्यालय, रूपावास', createdAt: d(2026, 9, 4) }, 'received'),
  seed({ id: 'RP-2026-00110', kind: 'application', citizen: { name: 'किशन गुर्जर', mobile: '9660122334', ward: 'w4' }, schemeId: 'agri-subsidy', department: 'agri', title: l('कृषि अनुदान', 'Agriculture Subsidy'), description: 'कृषि अनुदान योजना के लिए आवेदन।', createdAt: d(2026, 9, 3) }, 'under_review'),
  seed({ id: 'RP-2026-00102', kind: 'application', citizen: DEMO, schemeId: 'pension', department: 'social', title: l('पेंशन सहायता', 'Pension Assistance'), description: 'पेंशन योजना के लिए आवेदन।', createdAt: d(2026, 9, 1) }, 'submitted'),
  seed({ id: 'RP-2026-00098', kind: 'application', citizen: DEMO, schemeId: 'scholarship', department: 'education', title: l('छात्रवृत्ति', 'Scholarship'), description: 'छात्रवृत्ति योजना के लिए आवेदन।', createdAt: d(2026, 8, 28) }, 'resolved'),
];

export const FIRST_NEW_SEQ = 128;

// ---------- Notices ----------
export const SEED_NOTICES: Notice[] = [
  { id: 'n1', publishedAt: d(2026, 9, 1), tag: 'govt', icon: 'human-handsup', color: C.blue, soft: C.blueSoft, title: l('मुख्यमंत्री युवा संबल योजना', 'Mukhyamantri Yuva Sambal Yojana'), body: l('आवेदन की अंतिम तिथि – 30 सितंबर 2026', 'Last date to apply – 30 September 2026'), source: l('राजस्थान सरकार', 'Government of Rajasthan') },
  { id: 'n2', publishedAt: d(2026, 9, 3), tag: 'govt', icon: 'sprout', color: C.green, soft: C.greenSoft, title: l('कृषि विभाग की नई योजना', 'New Scheme from Agriculture Dept'), body: l('किसानों के लिए अनुदान की जानकारी', 'Subsidy information for farmers'), source: l('कृषि विभाग', 'Agriculture Dept') },
  { id: 'n3', publishedAt: d(2026, 9, 6), tag: 'health', icon: 'medical-bag', color: C.red, soft: C.redSoft, title: l('मुफ्त स्वास्थ्य शिविर', 'Free Health Camp'), body: l('15 सितंबर 2026 – प्राथमिक स्वास्थ्य केंद्र', '15 September 2026 – Primary Health Centre'), source: l('स्वास्थ्य विभाग', 'Health Dept') },
  { id: 'n4', publishedAt: d(2026, 9, 10), tag: 'panchayat', icon: 'calendar-month', color: C.orange, soft: C.orangeSoft, title: l('ग्राम सभा बैठक', 'Gram Sabha Meeting'), body: l('20 सितंबर 2026, समय: 11 बजे', '20 September 2026, 11 AM'), source: l('ग्राम पंचायत रूपावास', 'Gram Panchayat Roopawas') },
  { id: 'n5', publishedAt: d(2026, 9, 15), tag: 'panchayat', icon: 'water-alert', color: C.blue, soft: C.blueSoft, title: l('जल आपूर्ति में अस्थायी बाधा', 'Temporary Water Supply Disruption'), body: l('18 सितंबर 2026, सुबह 8–10 बजे', '18 September 2026, 8–10 AM'), source: l('पंचायत सूचना', 'Panchayat Notice') },
];

// ---------- Village dashboard ----------
export const SEED_BASELINE: Baseline = {
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

export const SEED_WORKS: DevelopmentWork[] = [
  { id: 'd1', name: l('मुख्य सड़क का सीसी निर्माण', 'CC paving of the main road'), progress: 70, budget: '₹ 18.5 लाख' },
  { id: 'd2', name: l('नई पानी की टंकी (वार्ड 4)', 'New water tank (Ward 4)'), progress: 45, budget: '₹ 12 लाख' },
  { id: 'd3', name: l('सोलर स्ट्रीट लाइट – 40 पोल', 'Solar street lights – 40 poles'), progress: 90, budget: '₹ 6.4 लाख' },
  { id: 'd4', name: l('स्कूल भवन की मरम्मत', 'School building repairs'), progress: 30, budget: '₹ 9 लाख' },
  { id: 'd5', name: l('पौधारोपण अभियान – 500 पेड़', 'Plantation drive – 500 trees'), progress: 50, budget: '₹ 1.2 लाख' },
];

// ---------- Accounts ----------
/** Demo-only credentials, listed on the login screen. */
export const DEMO_LOGINS: { role: Role; loginId: string; pin: string }[] = [
  { role: 'citizen', loginId: '9876543210', pin: '1111' },
  { role: 'admin', loginId: 'sarpanch', pin: '1234' },
  { role: 'superadmin', loginId: 'superadmin', pin: '0000' },
];

const SEED_DATE = d(2026, 8, 1);
const citizen = (id: string, name: string, mobile: string, occupation: string, ward: string, ageGroup: string): Account => ({
  id, role: 'citizen', name, loginId: mobile, pin: '1111', mobile, active: true, createdAt: SEED_DATE, occupation, ward, ageGroup, family: '',
});

export const SEED_ACCOUNTS: Account[] = [
  { id: 'u-super', role: 'superadmin', name: 'सुपर एडमिन', loginId: 'superadmin', pin: '0000', mobile: '9414000001', active: true, createdAt: SEED_DATE, designation: 'district' },
  { id: 'u-sarpanch', role: 'admin', name: 'सुरेश कुमार', loginId: 'sarpanch', pin: '1234', mobile: '9414000002', active: true, createdAt: SEED_DATE, designation: 'sarpanch' },
  { id: 'u-sachiv', role: 'admin', name: 'महेश वर्मा', loginId: 'sachiv', pin: '2468', mobile: '9414000003', active: true, createdAt: SEED_DATE, designation: 'secretary' },
  citizen('u-c1', 'रामलाल शर्मा', '9876543210', 'farmer', 'w1', '41-60'),
  citizen('u-c2', 'भंवरलाल जाट', '9829011223', 'farmer', 'w2', '41-60'),
  citizen('u-c3', 'सीता देवी', '9414055667', 'homemaker', 'w3', '26-40'),
  citizen('u-c4', 'मोहन मीणा', '9887733445', 'employed', 'w5', '26-40'),
  citizen('u-c5', 'किशन गुर्जर', '9660122334', 'farmer', 'w4', '41-60'),
  citizen('u-c6', 'पूजा कुमारी', '9785566778', 'student', 'w2', '18-25'),
];
