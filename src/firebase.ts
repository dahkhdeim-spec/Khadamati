/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, getDocs, collection, query, where, updateDoc, onSnapshot, addDoc, orderBy, limit, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';
import { UserProfile, ServiceRequest, ChatThread, ChatMessage, Complaint, AdBanner, AppNotification } from './types';

// Detect if configuration is standard placeholder or live cloud project
export const isLiveFirebase = firebaseConfig && 
  firebaseConfig.apiKey && 
  !firebaseConfig.apiKey.includes("placeholder") && 
  firebaseConfig.projectId !== "placeholder-project";

let app;
let auth: any = null;
let db: any = null;

if (isLiveFirebase) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    auth = getAuth(app);
    console.log("Firebase initialized successfully with live database mode!");

    // Validate live connection on initial boot
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration or network status.");
        }
      }
    };
    testConnection();
  } catch (error) {
    console.error("Firebase live init error, falling back to simulator:", error);
  }
} else {
  console.log("Khadamaty platform is running in highly responsive client-side simulator mode.");
}

// Ensure clean error wrapping according to the Eight Pillars and constraints
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || 'anonymous-simulator',
      email: auth?.currentUser?.email || 'anonymous-simulator',
    },
    operationType,
    path
  };
  console.error('Firestore Security / Operation Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// INITIAL MOCK DATA SETS FOR SIMULATOR MODE
const INITIAL_PROVIDERS: UserProfile[] = [
  {
    id: "p1",
    name: "شيخنا محمد الأمين",
    email: "cheikhna@khadamaty.mr",
    phone: "46781234",
    role: "provider",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    bio: "كهربائي منازل معتمد خبرة أكثر من 10 سنوات في تركيب وصيانة الشبكات المنزلية بنواكشوط.",
    experience: "10 سنوات خبرة عمل في مشاريع سكنية وصناعية متعددة.",
    category: "الكهرباء",
    rating: 4.9,
    reviewsCount: 18,
    earnings: 24500,
    isVerified: true,
    location: { latitude: 18.0889, longitude: -15.9779, name: "تفرغ زينة، نواكشوط" },
    skills: ["تركيب لوحات التوزيع", "صيانة المكيفات", "كشف التماس الكهرباء", "إضاءة LED الحديثة"]
  },
  {
    id: "p2",
    name: "أحمد فال محمود",
    email: "ahmedfall@khadamaty.mr",
    phone: "36219876",
    role: "provider",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120",
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    bio: "سباك محترف لإصلاح كل تسريبات المياه، تركيب شبكات الصرف الصحي، وصيانة سخانات المياه.",
    experience: "7 سنوات في تمديد شبكات المياه للمباني التجارية والسكنية.",
    category: "السباكة",
    rating: 4.8,
    reviewsCount: 14,
    earnings: 18200,
    isVerified: true,
    location: { latitude: 18.0735, longitude: -15.9582, name: "عرفات، نواكشوط" },
    skills: ["كشف التسربات الإلكتروني", "تركيب فلاتر المياه", "صيانة شبكات الصرف", "تركيب المغاسل والمراحيض"]
  },
  {
    id: "p3",
    name: "آمنة بنت اعل",
    email: "aminata@khadamaty.mr",
    phone: "27885544",
    role: "provider",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120",
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    bio: "مدرّسة خصوصية للرياضيات والفيزياء لمرحلة الإعدادية والشباب الطامحين للمجهود والتقدم.",
    experience: "أستاذة في المدارس الحرة ودروس تقوية لأكثر من 5 أجيال.",
    category: "التدريس الخصوصي",
    rating: 5.0,
    reviewsCount: 22,
    earnings: 32000,
    isVerified: true,
    location: { latitude: 18.0961, longitude: -15.9812, name: "الكسر، نواكشوط" },
    skills: ["شرح مبسط للرياضيات", "تأهيل لامتحانات الباكالوريا", "متابعة فردية", "فيزياء وكيمياء"]
  },
  {
    id: "p4",
    name: "سيد أحمد بلال",
    email: "sidi@khadamaty.mr",
    phone: "41112233",
    role: "provider",
    avatarUrl: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&q=80&w=120",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    bio: "مقاول بناء وترميم، خبرة طويلة في صب الخرسانات وتركيب القرميد والبناء الأسمنتي التقليدي والمعاصر.",
    experience: "15 سنة في قطاع التشييد والترميم والبناء في نواذيبو ونواكشوط.",
    category: "البناء",
    rating: 4.7,
    reviewsCount: 11,
    earnings: 45000,
    isVerified: true,
    location: { latitude: 20.9304, longitude: -17.0343, name: "نواذيبو، الساحل" },
    skills: ["بناء الجدران والطوب", "أعمال اللياسة والترميم", "عزل الأسطح من الرطوبة", "قراءة المخططات الفنية"]
  },
  {
    id: "p5",
    name: "مريم بنت المختار",
    email: "mariem@khadamaty.mr",
    phone: "32320099",
    role: "provider",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120",
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    bio: "مصممة جرافيك وشعارات ومسؤولة تسويق رقمي. أساعد المشاريع في بناء هويتها البصرية الاحترافية بنواكشوط.",
    experience: "4 سنوات عمل مستقل مع كبرى الشركات الموريتانية الناشئة.",
    category: "التصميم والجرافيك",
    rating: 4.9,
    reviewsCount: 9,
    earnings: 12400,
    isVerified: true,
    location: { latitude: 18.1130, longitude: -15.9520, name: "تيارت، نواكشوط" },
    skills: ["شعار وهوية بصرية", "تصاميم السوشيال ميديا", "المطبوعات الفاخرة", "مونتاج فيديو ترويجي"]
  },
  {
    id: "p6",
    name: "دامبا سوغو",
    email: "demba@khadamaty.mr",
    phone: "49998877",
    role: "provider",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120",
    createdAt: new Date().toISOString(),
    bio: "مخترع وصانع برمجيات ومطور مواقع متكاملة (Full-Stack). أطور واجهات عصرية لمختلف الخدمات.",
    experience: "5 سنوات من البرمجة وتصميم متاجر شوبيفاي وتطبيقات الويب الذكية.",
    category: "البرمجة",
    rating: 4.6,
    reviewsCount: 6,
    earnings: 15000,
    isVerified: false,
    location: { latitude: 18.0850, longitude: -15.9750, name: "لكصر، نواكشوط" },
    skills: ["برمجة React & Node.js", "تطوير تطبيقات الجوال", "برمجة متاجر إلكترونية", "دعم فني واستشارات"]
  }
];

const INITIAL_ADS: AdBanner[] = [
  {
    id: "ad1",
    title: "خصم 15% على خدمات التعقيم والتنظيف الشامل بمناسبة حلول الصيف!",
    imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=600",
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "ad2",
    title: "هل تبحث عن خدمات كهرباء آمنة؟ اتصل بأفضل المهنيين المعتمدين بنواكشوط.",
    imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=600",
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

// Seed databases inside localStorage for simulator
const syncLocalData = () => {
  if (!localStorage.getItem("khadamaty_users")) {
    // Save providers to mock users
    const defaultUsersList: UserProfile[] = [
      {
        id: "admin1",
        name: "المدير العام للخدمة",
        email: "dahkhdeim@gmail.com", // Authorized User email from runtime
        phone: "44445555",
        role: "admin",
        avatarUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=120",
        createdAt: new Date().toISOString()
      },
      ...INITIAL_PROVIDERS
    ];
    localStorage.setItem("khadamaty_users", JSON.stringify(defaultUsersList));
  }
  if (!localStorage.getItem("khadamaty_ads")) {
    localStorage.setItem("khadamaty_ads", JSON.stringify(INITIAL_ADS));
  }
  if (!localStorage.getItem("khadamaty_requests")) {
    localStorage.setItem("khadamaty_requests", JSON.stringify([]));
  }
  if (!localStorage.getItem("khadamaty_chats")) {
    localStorage.setItem("khadamaty_chats", JSON.stringify([]));
  }
  if (!localStorage.getItem("khadamaty_messages")) {
    localStorage.setItem("khadamaty_messages", JSON.stringify({}));
  }
  if (!localStorage.getItem("khadamaty_complaints")) {
    localStorage.setItem("khadamaty_complaints", JSON.stringify([
      {
        id: "comp1",
        userId: "customer_guest",
        userName: "العميل محمد",
        title: "تأخر مقدم الخدمة في الحضور",
        description: "لقد حجزت خدمة السباكة ولم يحضر السباك في الموعد المحدد، أرجو المحاسبة والتنفيذ السريع والمحافظة على النزاهة والصدق.",
        status: "pending",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]));
  }
  if (!localStorage.getItem("khadamaty_notifications")) {
    localStorage.setItem("khadamaty_notifications", JSON.stringify([
      {
        id: "notif1",
        userId: "customer_guest",
        title: "مرحباً بك في خدماتي!",
        body: "أهلاً بك في منصة خدماتي في موريتانيا. ابحث عن فني، تصفح، وتحدث معه لتسهيل حياتك اليومية.",
        type: "system",
        isRead: false,
        createdAt: new Date().toISOString()
      }
    ]));
  }
};

// Always run simulation seeder on load
syncLocalData();

// ADAPTER LAYER IMPLEMENTING REAL FIRESTORE VS LIGHTNING SIMULATION
export const dbService = {
  // USERS collection methods
  async getUsers(): Promise<UserProfile[]> {
    if (isLiveFirebase) {
      try {
        let uSnap;
        try {
          uSnap = await getDocs(collection(db, 'users'));
        } catch (readErr) {
          console.log("Listing all users was restricted (non-admin client), querying only verified providers...");
          const q = query(collection(db, 'users'), where('role', '==', 'provider'));
          uSnap = await getDocs(q);
        }
        let list = uSnap.docs.map(d => d.data() as UserProfile);
        if (list.length === 0) {
          console.log("Seeding empty live Firestore database with initial providers & ads...");
          const defaultUsersList: UserProfile[] = [
            {
              id: "admin1",
              name: "المدير العام للخدمة",
              email: "dahkhdeim@gmail.com", // Authorized User email from runtime
              phone: "44445555",
              role: "admin",
              avatarUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=120",
              createdAt: new Date().toISOString()
            },
            ...INITIAL_PROVIDERS
          ];
          try {
            for (let i = 0; i < defaultUsersList.length; i++) {
              const u = defaultUsersList[i];
              await setDoc(doc(db, 'users', u.id), u);
            }
            for (let i = 0; i < INITIAL_ADS.length; i++) {
              const ad = INITIAL_ADS[i];
              await setDoc(doc(db, 'ads', ad.id), ad);
            }
          } catch (writeErr) {
            console.warn("Could not write initial seed data to Firestore (insufficient permissions for non-admin client). Falling back to mock references.", writeErr);
          }
          list = defaultUsersList;
        }
        return list;
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'users');
      }
    }
    return JSON.parse(localStorage.getItem("khadamaty_users") || "[]");
  },

  async getUser(id: string): Promise<UserProfile | null> {
    if (isLiveFirebase) {
      try {
        const dSnap = await getDoc(doc(db, 'users', id));
        return dSnap.exists() ? (dSnap.data() as UserProfile) : null;
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${id}`);
      }
    }
    const all = await this.getUsers();
    return all.find(u => u.id === id) || null;
  },

  async saveUser(user: UserProfile): Promise<void> {
    if (isLiveFirebase) {
      try {
        await setDoc(doc(db, 'users', user.id), user);
        return;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.id}`);
      }
    }
    const all = await this.getUsers();
    const idx = all.findIndex(u => u.id === user.id);
    if (idx >= 0) all[idx] = user;
    else all.push(user);
    localStorage.setItem("khadamaty_users", JSON.stringify(all));
    // Trigger window storage event for reactive rendering
    window.dispatchEvent(new Event('storage'));
  },

  async createUserProfile(authId: string, name: string, phone: string, email: string, role: 'customer' | 'provider' | 'admin', optionalFields?: Partial<UserProfile>): Promise<UserProfile> {
    const defaultUser: UserProfile = {
      id: authId,
      name,
      phone,
      email,
      role,
      avatarUrl: optionalFields?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
      createdAt: new Date().toISOString(),
      ...optionalFields
    };
    if (role === 'provider') {
      defaultUser.rating = 5.0;
      defaultUser.reviewsCount = 0;
      defaultUser.earnings = 0;
      defaultUser.isVerified = false;
    }
    await this.saveUser(defaultUser);
    return defaultUser;
  },

  // REQUESTS collection methods
  async getRequests(): Promise<ServiceRequest[]> {
    if (isLiveFirebase) {
      try {
        const rSnap = await getDocs(collection(db, 'requests'));
        return rSnap.docs.map(d => d.data() as ServiceRequest);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'requests');
      }
    }
    return JSON.parse(localStorage.getItem("khadamaty_requests") || "[]");
  },

  async getRequestsForUser(userId: string, role: 'customer' | 'provider' | 'admin'): Promise<ServiceRequest[]> {
    const all = await this.getRequests();
    if (role === 'admin') return all;
    if (role === 'customer') return all.filter(r => r.customerId === userId);
    return all.filter(r => r.providerId === userId);
  },

  async createRequest(reqData: Omit<ServiceRequest, 'id' | 'createdAt' | 'updatedAt' | 'commission'>): Promise<ServiceRequest> {
    const completeReq: ServiceRequest = {
      ...reqData,
      id: "req_" + Math.random().toString(36).substring(2, 11),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      commission: Math.round(reqData.price * 0.10) // 10% platform commission model
    };

    if (isLiveFirebase) {
      try {
        await setDoc(doc(db, 'requests', completeReq.id), completeReq);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `requests/${completeReq.id}`);
      }
    } else {
      const all = await this.getRequests();
      all.unshift(completeReq);
      localStorage.setItem("khadamaty_requests", JSON.stringify(all));
      
      // Auto generate notification for the provider
      await this.createNotification(completeReq.providerId, "طلب خدمة جديد!", `لديك طلب خدمة جديد "${completeReq.title}" من العميل ${completeReq.customerName}.`, 'request');
      window.dispatchEvent(new Event('storage'));
    }
    return completeReq;
  },

  async updateRequestStatus(requestId: string, status: ServiceRequest['status']): Promise<void> {
    if (isLiveFirebase) {
      try {
        const rRef = doc(db, 'requests', requestId);
        await updateDoc(rRef, { status, updatedAt: new Date().toISOString() });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `requests/${requestId}`);
      }
    } else {
      const all = await this.getRequests();
      const idx = all.findIndex(r => r.id === requestId);
      if (idx >= 0) {
        const oldRequest = all[idx];
        all[idx] = { ...oldRequest, status, updatedAt: new Date().toISOString() };
        localStorage.setItem("khadamaty_requests", JSON.stringify(all));

        // If completed, update provider earnings
        if (status === 'completed') {
          const uAll = await this.getUsers();
          const pIdx = uAll.findIndex(u => u.id === oldRequest.providerId);
          if (pIdx >= 0 && uAll[pIdx].earnings !== undefined) {
            uAll[pIdx].earnings = (uAll[pIdx].earnings || 0) + (oldRequest.price - oldRequest.commission);
            localStorage.setItem("khadamaty_users", JSON.stringify(uAll));
          }
          await this.createNotification(oldRequest.customerId, "اكتملت الخدمة!", `تم إكمال طلب الخدمة الخاص بك من طرف ${oldRequest.providerName}. يرجى تقديم تقييمك الآن المساعد للمنصة.`, 'request');
        } else if (status === 'accepted') {
          await this.createNotification(oldRequest.customerId, "تم قبول طلبك!", `بشرى سارة، وافق مقدم الخدمة ${oldRequest.providerName} على البدء في طلبك.`, 'request');
        } else if (status === 'rejected') {
          await this.createNotification(oldRequest.customerId, "عذراً، الطلب مرفوض", `تم رفض طلبك للأسف من قِبل ${oldRequest.providerName} بسبب انشغاله الآن.`, 'request');
        }

        window.dispatchEvent(new Event('storage'));
      }
    }
  },

  async rateServiceRequest(requestId: string, rating: number, reviewText: string): Promise<void> {
    if (isLiveFirebase) {
      try {
        const rRef = doc(db, 'requests', requestId);
        await updateDoc(rRef, { rating, reviewText, updatedAt: new Date().toISOString() });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `requests/${requestId}`);
      }
    } else {
      const all = await this.getRequests();
      const idx = all.findIndex(r => r.id === requestId);
      if (idx >= 0) {
        const req = all[idx];
        all[idx] = { ...req, rating, reviewText, updatedAt: new Date().toISOString() };
        localStorage.setItem("khadamaty_requests", JSON.stringify(all));

        // Recalculate provider ratings
        const pUsers = await this.getUsers();
        const pIdx = pUsers.findIndex(u => u.id === req.providerId);
        if (pIdx >= 0) {
          const prov = pUsers[pIdx];
          const currReviewsCount = prov.reviewsCount || 0;
          const currRating = prov.rating || 5.0;
          const totalRatingSum = (currRating * currReviewsCount) + rating;
          const newReviewsCount = currReviewsCount + 1;
          const newRating = Math.round((totalRatingSum / newReviewsCount) * 10) / 10;
          
          pUsers[pIdx] = {
            ...prov,
            rating: newRating,
            reviewsCount: newReviewsCount
          };
          localStorage.setItem("khadamaty_users", JSON.stringify(pUsers));
        }

        await this.createNotification(req.providerId, "تقييم جديد لفنيتك!", `لقد قام العميل ${req.customerName} بتقييم خدمتك بـ ${rating} نجوم وكتابة تعليق.`, 'request');
        window.dispatchEvent(new Event('storage'));
      }
    }
  },

  // CHATS threads & messaging
  async getChatsForUser(userId: string): Promise<ChatThread[]> {
    if (isLiveFirebase) {
      try {
        const cSnap = await getDocs(collection(db, 'chats'));
        const allChats = cSnap.docs.map(d => d.data() as ChatThread);
        return allChats.filter(c => c.customerId === userId || c.providerId === userId);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'chats');
      }
    }
    const localChats: ChatThread[] = JSON.parse(localStorage.getItem("khadamaty_chats") || "[]");
    return localChats.filter(c => c.customerId === userId || c.providerId === userId);
  },

  async startChat(customerId: string, providerId: string): Promise<string> {
    const chatRoomId = `${customerId}_${providerId}`;
    const allUsers = await this.getUsers();
    const customer = allUsers.find(u => u.id === customerId);
    const provider = allUsers.find(u => u.id === providerId);

    if (!customer || !provider) {
      throw new Error("Customer or Provider user record not discovered.");
    }

    const newChat: ChatThread = {
      id: chatRoomId,
      customerId,
      customerName: customer.name,
      customerAvatar: customer.avatarUrl,
      providerId,
      providerName: provider.name,
      providerAvatar: provider.avatarUrl,
      lastMessage: "بدأت المحادثة بنجاح لرسم الاتفاق والربط.",
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0
    };

    if (isLiveFirebase) {
      try {
        await setDoc(doc(db, 'chats', chatRoomId), newChat);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `chats/${chatRoomId}`);
      }
    } else {
      const allChats = JSON.parse(localStorage.getItem("khadamaty_chats") || "[]") as ChatThread[];
      const exists = allChats.find(c => c.id === chatRoomId);
      if (!exists) {
        allChats.unshift(newChat);
        localStorage.setItem("khadamaty_chats", JSON.stringify(allChats));
        
        // Initial setup for message mapping
        const allMessages = JSON.parse(localStorage.getItem("khadamaty_messages") || "{}");
        allMessages[chatRoomId] = [];
        localStorage.setItem("khadamaty_messages", JSON.stringify(allMessages));
        window.dispatchEvent(new Event('storage'));
      }
    }
    return chatRoomId;
  },

  async getMessages(chatId: string): Promise<ChatMessage[]> {
    if (isLiveFirebase) {
      try {
        const mSnap = await getDocs(collection(db, 'chats', chatId, 'messages'));
        return mSnap.docs.map(d => d.data() as ChatMessage);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `chats/${chatId}/messages`);
      }
    }
    const allMessages = JSON.parse(localStorage.getItem("khadamaty_messages") || "{}");
    return allMessages[chatId] || [];
  },

  async sendMessage(chatId: string, senderId: string, senderName: string, text: string): Promise<void> {
    const newMessage: ChatMessage = {
      id: "msg_" + Math.random().toString(36).substring(2, 11),
      senderId,
      senderName,
      text,
      timestamp: new Date().toISOString()
    };

    if (isLiveFirebase) {
      try {
        await setDoc(doc(db, 'chats', chatId, 'messages', newMessage.id), newMessage);
        await updateDoc(doc(db, 'chats', chatId), { lastMessage: text, lastMessageTime: new Date().toISOString() });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `chats/${chatId}/messages/${newMessage.id}`);
      }
    } else {
      // Offline local logic
      const allMessages = JSON.parse(localStorage.getItem("khadamaty_messages") || "{}");
      if (!allMessages[chatId]) {
        allMessages[chatId] = [];
      }
      allMessages[chatId].push(newMessage);
      localStorage.setItem("khadamaty_messages", JSON.stringify(allMessages));

      // Update thread last message
      const allChats = JSON.parse(localStorage.getItem("khadamaty_chats") || "[]") as ChatThread[];
      const idx = allChats.findIndex(c => c.id === chatId);
      if (idx >= 0) {
        allChats[idx].lastMessage = text;
        allChats[idx].lastMessageTime = new Date().toISOString();
        localStorage.setItem("khadamaty_chats", JSON.stringify(allChats));

        // Find recipient and send notifications
        const thread = allChats[idx];
        const recipientId = senderId === thread.customerId ? thread.providerId : thread.customerId;
        await this.createNotification(recipientId, `رسالة جديدة من ${senderName}`, text, 'chat');
      }
      window.dispatchEvent(new Event('storage'));
    }
  },

  // ADS systems
  async getAds(): Promise<AdBanner[]> {
    if (isLiveFirebase) {
      try {
        const snap = await getDocs(collection(db, 'ads'));
        let list = snap.docs.map(d => d.data() as AdBanner);
        if (list.length === 0) {
          try {
            for (let i = 0; i < INITIAL_ADS.length; i++) {
              const ad = INITIAL_ADS[i];
              await setDoc(doc(db, 'ads', ad.id), ad);
            }
          } catch (writeErr) {
            console.warn("Could not write initial ads to Firestore (insufficient permissions for non-admin client). Falling back to mock references.", writeErr);
          }
          list = INITIAL_ADS;
        }
        return list;
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'ads');
      }
    }
    return JSON.parse(localStorage.getItem("khadamaty_ads") || "[]");
  },

  async saveAd(ad: AdBanner): Promise<void> {
    if (isLiveFirebase) {
      try {
        await setDoc(doc(db, 'ads', ad.id), ad);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `ads/${ad.id}`);
      }
    } else {
      const all = await this.getAds();
      const idx = all.findIndex(a => a.id === ad.id);
      if (idx >= 0) all[idx] = ad;
      else all.push(ad);
      localStorage.setItem("khadamaty_ads", JSON.stringify(all));
      window.dispatchEvent(new Event('storage'));
    }
  },

  async deleteAd(adId: string): Promise<void> {
    if (isLiveFirebase) {
      try {
        // Simple mock simulation or delete operations block
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `ads/${adId}`);
      }
    } else {
      const all = await this.getAds();
      const filtered = all.filter(a => a.id !== adId);
      localStorage.setItem("khadamaty_ads", JSON.stringify(filtered));
      window.dispatchEvent(new Event('storage'));
    }
  },

  // COMPLAINTS
  async getComplaints(): Promise<Complaint[]> {
    if (isLiveFirebase) {
      try {
        const snap = await getDocs(collection(db, 'complaints'));
        return snap.docs.map(d => d.data() as Complaint);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'complaints');
      }
    }
    return JSON.parse(localStorage.getItem("khadamaty_complaints") || "[]");
  },

  async createComplaint(userId: string, userName: string, title: string, description: string, requestId?: string): Promise<Complaint> {
    const newComp: Complaint = {
      id: "complaint_" + Math.random().toString(36).substring(2, 11),
      userId,
      userName,
      title,
      description,
      requestId,
      status: "pending",
      createdAt: new Date().toISOString()
    };

    if (isLiveFirebase) {
      try {
        await setDoc(doc(db, 'complaints', newComp.id), newComp);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `complaints/${newComp.id}`);
      }
    } else {
      const all = await this.getComplaints();
      all.unshift(newComp);
      localStorage.setItem("khadamaty_complaints", JSON.stringify(all));
      window.dispatchEvent(new Event('storage'));
    }
    return newComp;
  },

  async updateComplaintStatus(complaintId: string, status: Complaint['status']): Promise<void> {
    if (isLiveFirebase) {
      try {
        await updateDoc(doc(db, 'complaints', complaintId), { status });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `complaints/${complaintId}`);
      }
    } else {
      const all = await this.getComplaints();
      const idx = all.findIndex(c => c.id === complaintId);
      if (idx >= 0) {
        all[idx].status = status;
        localStorage.setItem("khadamaty_complaints", JSON.stringify(all));
        window.dispatchEvent(new Event('storage'));
      }
    }
  },

  // NOTIFICATIONS management
  async getNotifications(userId: string): Promise<AppNotification[]> {
    const all: AppNotification[] = JSON.parse(localStorage.getItem("khadamaty_notifications") || "[]");
    return all.filter(n => n.userId === userId);
  },

  async createNotification(userId: string, title: string, body: string, type: AppNotification['type']): Promise<AppNotification> {
    const notif: AppNotification = {
      id: "notif_" + Math.random().toString(36).substring(2, 11),
      userId,
      title,
      body,
      type,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    const all: AppNotification[] = JSON.parse(localStorage.getItem("khadamaty_notifications") || "[]");
    all.unshift(notif);
    localStorage.setItem("khadamaty_notifications", JSON.stringify(all));
    window.dispatchEvent(new Event('storage'));
    return notif;
  },

  async markAllNotificationsRead(userId: string): Promise<void> {
    const all: AppNotification[] = JSON.parse(localStorage.getItem("khadamaty_notifications") || "[]");
    const updated = all.map(n => n.userId === userId ? { ...n, isRead: true } : n);
    localStorage.setItem("khadamaty_notifications", JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
  }
};
