import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Trophy, Home, Megaphone, MessageSquare, 
  Vote, Swords, Coins, Crown, Calendar, 
  ChevronRight, Plus, CheckCircle2, ChevronLeft,
  Settings, Clock, MapPin, X, AlertTriangle, Users, User, Search,
  ShieldAlert, History, ArrowUpCircle, ArrowDownCircle,
  LogOut, UserCircle, KeyRound, BookOpen, GraduationCap, BadgeInfo, Edit3, ImagePlus, Check
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, onSnapshot, doc, 
  setDoc, updateDoc, deleteDoc, getDocs, query
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAi8auHjahGA-AFGWYW-Ig1kaF4FWwu6Cc",
  authDomain: "avalon-593e7.firebaseapp.com",
  projectId: "avalon-593e7",
  storageBucket: "avalon-593e7.firebasestorage.app",
  messagingSenderId: "469158636943",
  appId: "1:469158636943:web:2066f081ee7ce3bd29effa",
  measurementId: "G-DDQL245JG0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const INITIAL_USERS = [
  { id: 'u1', username: 'admin', password: '1234', department: '컴퓨터공학과', year: 3, joinYear: 2026, realName: '김보드', name: '보드마스터', coins: 15000, avatar: 'https://i.pravatar.cc/150?u=u1', role: 'admin' },
  { id: 'u2', username: 'user1', password: '1234', department: '경영학과', year: 2, joinYear: 2026, realName: '이전략', name: '전략의신', coins: 12500, avatar: 'https://i.pravatar.cc/150?u=u2', role: 'user' },
  { id: 'u3', username: 'user2', password: '1234', department: '디자인학과', year: 1, joinYear: 2026, realName: '박주사', name: '주사위요정', coins: 8200, avatar: 'https://i.pravatar.cc/150?u=u3', role: 'user' },
  { id: 'u4', username: 'user3', password: '1234', department: '통계학과', year: 4, joinYear: 2026, realName: '최루미', name: '루미큐브장인', coins: 7500, avatar: 'https://i.pravatar.cc/150?u=u4', role: 'user' },
  { id: 'u5', username: 'user4', password: '1234', department: '건축학과', year: 2, joinYear: 2026, realName: '정카탄', name: '카탄개척자', coins: 4100, avatar: 'https://i.pravatar.cc/150?u=u5', role: 'user' },
];

const INITIAL_TOURNAMENTS = [
  { id: 't1', title: '2026 스프링 챔피언십 (코인 쟁탈전)', description: '최고의 보드게임 전략가들이 모여 코인을 쟁취하는 대규모 토너먼트입니다. 패배를 두려워하지 마세요!', startDate: '2026-05-01', endDate: '2026-05-31', status: 'active', weeklyCoin: 1000, payoutDay: '월' }
];

const INITIAL_MATCHES = [
  { id: 'm1', tId: 't1', type: '1v1', gameTitle: '테라포밍 마스', playerIds: ['u1', 'u2'], bet: 1000, status: 'pending', winners: [], rewardPerWinner: 0 },
  { id: 'm2', tId: 't1', type: 'multi', gameTitle: '아발론', playerIds: ['u1', 'u3', 'u4'], bet: 500, status: 'pending', winners: [], rewardPerWinner: 0 },
  { id: 'm5', tId: 't1', type: '1v1', gameTitle: '카탄', playerIds: ['u1', 'u5'], bet: 600, status: 'completed', winners: ['u1'], rewardPerWinner: 1200 },
];

const WEEK_DAYS = ['월', '화', '수', '목', '금', '토', '일'];

const DEFAULT_LOGO = 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=300&auto=format&fit=crop';

const toLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDisplayYear = (yearNum, joinYear) => {
  const currentYear = new Date().getFullYear();
  const baseYear = joinYear || currentYear;
  const calculatedYear = Number(yearNum) + (currentYear - baseYear);
  return calculatedYear >= 5 ? 'N학년' : `${calculatedYear}학년`;
};

// 이미지 용량 최적화 및 리사이징 엔진 (Firestore 1MB 한계 극복용)
const compressImage = (file, maxSize = 300) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // 비율 유지하며 최대 사이즈로 축소
        if (width > height) {
          if (width > maxSize) { height *= maxSize / width; width = maxSize; }
        } else {
          if (height > maxSize) { width *= maxSize / height; height = maxSize; }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // JPEG 포맷으로 화질 80% 압축 (Base64 텍스트 반환)
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
    };
  });
};

const Card = ({ children, className = '' }) => (
  <div className={`bg-slate-800/60 border border-slate-700/50 backdrop-blur-md rounded-2xl p-5 shadow-xl ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false }) => {
  const baseStyle = "px-4 py-2 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:active:scale-100";
  const variants = {
    primary: "bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-900 hover:shadow-lg hover:shadow-amber-500/30",
    secondary: "bg-slate-700 text-white hover:bg-slate-600",
    outline: "border border-amber-500/50 text-amber-400 hover:bg-amber-500/10",
    danger: "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50"
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

export default function App() {
  const [users, setUsers] = useState([]);
  const [tournaments, setTournaments] = useState(INITIAL_TOURNAMENTS);
  const [matches, setMatches] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [coinHistory, setCoinHistory] = useState([]);
  const [appLogo, setAppLogo] = useState(DEFAULT_LOGO); // 로고 상태

  const [loggedInUserId, setLoggedInUserId] = useState(() => localStorage.getItem('avalon_loggedInUserId') || null);
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('avalon_loggedInUserId'));
  const [rankingAlert, setRankingAlert] = useState('');
  const prevTop3Ref = useRef([]);

  const [authMode, setAuthMode] = useState('login');
  const [authError, setAuthError] = useState('');
  const [loginId, setLoginId] = useState('');
  const [loginPw, setLoginPw] = useState('');
  const [signupData, setSignupData] = useState({ department: '', year: '', realName: '', username: '', password: '', nickname: '' });

  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [profileEditData, setProfileEditData] = useState({ name: '', department: '', year: '', avatar: '' });
  const [isUploading, setIsUploading] = useState(false); // 업로드 로딩 상태

  const [currentView, setCurrentView] = useState('home');
  
  const [currentWeekBaseDate, setCurrentWeekBaseDate] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(today.setDate(diff));
  });
  const [weekOffset, setWeekOffset] = useState(0); 
  const [selectedDateObj, setSelectedDateObj] = useState(new Date());

  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [newScheduleData, setNewScheduleData] = useState({
    title: '새로운 정기 모임',
    date: toLocalDateString(new Date()),
    time: '19:00',
    location: '아발론 동아리방',
    maxAttendees: 11
  });

  const [showTournamentSettings, setShowTournamentSettings] = useState(false);
  const [editTournamentData, setEditTournamentData] = useState(null);
  
  const [gameTitle1v1, setGameTitle1v1] = useState('');
  const [searchOpponent1v1, setSearchOpponent1v1] = useState('');
  const [selectedOpponent1v1, setSelectedOpponent1v1] = useState('');
  const [betAmount1v1, setBetAmount1v1] = useState('');
  const [page1v1, setPage1v1] = useState(1);

  const [gameTitleMulti, setGameTitleMulti] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOpponentsMulti, setSelectedOpponentsMulti] = useState([]);
  const [betAmountMulti, setBetAmountMulti] = useState('');
  const [pageMulti, setPageMulti] = useState(1);
  
  const [resolveMatchData, setResolveMatchData] = useState(null); 
  const [resolveWinners, setResolveWinners] = useState([]);
  
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const clickTimeoutRef = useRef(null);
  const [showAdminCodeModal, setShowAdminCodeModal] = useState(false);
  const [adminCodeInput, setAdminCodeInput] = useState('');
  const [adminTab, setAdminTab] = useState('manage'); 
  const [adminSelectedUser, setAdminSelectedUser] = useState('ALL');
  const [adminCoinAmount, setAdminCoinAmount] = useState('');
  const [adminCoinReason, setAdminCoinReason] = useState('');
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    // 1. App Settings (Global Logo Sync)
    const unsubSettings = onSnapshot(doc(db, "settings", "appInfo"), (snapshot) => {
      if (snapshot.exists()) {
        setAppLogo(snapshot.data().logo || DEFAULT_LOGO);
      } else {
        setDoc(doc(db, "settings", "appInfo"), { logo: DEFAULT_LOGO });
      }
    }, (error) => console.error(error));

    // 2. 유저 정보
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      if (snapshot.empty) {
        INITIAL_USERS.forEach(async (u) => { await setDoc(doc(db, "users", u.id), u); });
      } else {
        setUsers(snapshot.docs.map(doc => doc.data()));
      }
    }, (error) => console.error(error));

    // 3. 대회 현황
    const unsubTournaments = onSnapshot(collection(db, "tournaments"), (snapshot) => {
      if (snapshot.empty) {
        INITIAL_TOURNAMENTS.forEach(async (t) => { await setDoc(doc(db, "tournaments", t.id), t); });
      } else {
        setTournaments(snapshot.docs.map(doc => doc.data()));
      }
    }, (error) => console.error(error));

    // 4. 매치 내역
    const unsubMatches = onSnapshot(collection(db, "matches"), (snapshot) => {
      if (snapshot.empty && users.length > 0) {
        INITIAL_MATCHES.forEach(async (m) => { await setDoc(doc(db, "matches", m.id), m); });
      } else {
        const list = snapshot.docs.map(doc => doc.data());
        setMatches(list.sort((a, b) => b.id.localeCompare(a.id)));
      }
    }, (error) => console.error(error));

    // 5. 모임 일정
    const unsubSchedules = onSnapshot(collection(db, "schedules"), (snapshot) => {
      setSchedules(snapshot.docs.map(doc => doc.data()));
    }, (error) => console.error(error));

    // 6. 코인 장부
    const unsubHistory = onSnapshot(collection(db, "coinHistory"), (snapshot) => {
      const list = snapshot.docs.map(doc => doc.data());
      setCoinHistory(list.sort((a, b) => b.id.localeCompare(a.id)));
    }, (error) => console.error(error));

    return () => {
      unsubSettings(); unsubUsers(); unsubTournaments(); unsubMatches(); unsubSchedules(); unsubHistory();
    };
  }, [users.length]);

  const currentUser = useMemo(() => {
    return users.find(u => u.id === loggedInUserId) || users[0] || { id: '', name: '로딩중', coins: 0, role: 'user', avatar: 'https://i.pravatar.cc/150' };
  }, [users, loggedInUserId]);

  const userMap = useMemo(() => {
    return users.reduce((acc, user) => ({ ...acc, [user.id]: user }), {});
  }, [users]);

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => (b.coins || 0) - (a.coins || 0));
  }, [users]);

  useEffect(() => {
    const currentTop3 = [...users].sort((a, b) => (b.coins || 0) - (a.coins || 0)).slice(0, 3).map(u => u.id);
    if (prevTop3Ref.current.length > 0 && JSON.stringify(prevTop3Ref.current) !== JSON.stringify(currentTop3)) {
      setRankingAlert('🏆 명예의 전당 랭킹이 실시간으로 변동되었습니다!');
      setTimeout(() => setRankingAlert(''), 5000);
    }
    prevTop3Ref.current = currentTop3;
  }, [users]);

  useEffect(() => {
    if (loggedInUserId) localStorage.setItem('avalon_loggedInUserId', loggedInUserId);
    else localStorage.removeItem('avalon_loggedInUserId');
  }, [loggedInUserId]);

  const currentWeekDates = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const date = new Date(currentWeekBaseDate);
      date.setDate(date.getDate() + (weekOffset * 7) + i);
      return date;
    });
  }, [currentWeekBaseDate, weekOffset]);

  useEffect(() => {
    const newDate = new Date(currentWeekBaseDate);
    newDate.setDate(newDate.getDate() + (weekOffset * 7));
    setSelectedDateObj(newDate);
  }, [weekOffset, currentWeekBaseDate]);

  useEffect(() => {
    if (users.length === 0) return;
    const baseDate = new Date(currentWeekBaseDate);
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);
      const dateString = toLocalDateString(date);
      
      if (!schedules.find(s => s.date === dateString && s.isAuto)) {
        const autoSche = {
          id: `auto_${dateString}`, title: '정규 모임', date: dateString, time: '19:00 ~ 23:00',
          location: '아발론 동아리방', attendees: [], maxAttendees: 11, isAuto: true
        };
        setDoc(doc(db, "schedules", autoSche.id), autoSche);
      }
    }
  }, [currentWeekBaseDate, schedules, users.length]);

  const logCoinHistory = async (userId, amount, desc) => {
    if (amount === 0) return;
    const logId = `h_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newLog = { id: logId, userId, amount, desc, date: new Date().toLocaleString('ko-KR') };
    await setDoc(doc(db, "coinHistory", logId), newLog);
  };

  const handleLogin = () => {
    setAuthError('');
    if (!loginId || !loginPw) return setAuthError('아이디와 비밀번호를 모두 입력해주세요.');
    const foundUser = users.find(u => u.username === loginId && u.password === loginPw);
    if (foundUser) {
      setLoggedInUserId(foundUser.id);
      setIsLoggedIn(true);
      setLoginId(''); setLoginPw('');
    } else setAuthError('아이디 또는 비밀번호가 일치하지 않습니다.');
  };

  const handleSignup = async () => {
    setAuthError('');
    const { department, year, realName, username, password, nickname } = signupData;
    if (!department || !year || !realName || !username || !password || !nickname) return setAuthError('모든 항목을 입력해주세요.');
    if (users.find(u => u.username === username)) return setAuthError('이미 존재하는 아이디입니다.');
    
    const newUser = {
      id: `u${Date.now()}`, username, password, department, year: Number(year), joinYear: new Date().getFullYear(),
      realName, name: nickname, coins: 3000, avatar: `https://i.pravatar.cc/150?u=${username}`, role: 'user'
    };
    
    await setDoc(doc(db, "users", newUser.id), newUser);
    setAuthMode('login');
    setSignupData({ department: '', year: '', realName: '', username: '', password: '', nickname: '' });
  };

  const handleLogout = () => { 
    setIsLoggedIn(false); 
    setLoggedInUserId(null); 
    setCurrentView('home'); 
  };

  const openProfileEdit = () => {
    setProfileEditData({ name: currentUser.name, department: currentUser.department, year: currentUser.year, avatar: currentUser.avatar });
    setShowProfileEdit(true);
  };

  // 개인 프로필 사진 첨부 및 압축
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsUploading(true);
      try {
        const compressedBase64 = await compressImage(file, 200); // 프로필은 최대 200px 압축
        setProfileEditData({ ...profileEditData, avatar: compressedBase64 });
      } catch (err) {
        console.error("이미지 처리 실패:", err);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const saveProfileEdit = async () => {
    await updateDoc(doc(db, "users", currentUser.id), {
      name: profileEditData.name,
      department: profileEditData.department,
      year: Number(profileEditData.year),
      avatar: profileEditData.avatar
    });
    setShowProfileEdit(false);
  };

  // 관리자 앱 로고 첨부 및 글로벌 압축 적용
  const handleAppLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsUploading(true);
      try {
        const compressedBase64 = await compressImage(file, 400); // 앱 로고는 최대 400px 압축
        // 전역 Firestore 문서 업데이트
        await setDoc(doc(db, "settings", "appInfo"), { logo: compressedBase64 }, { merge: true });
      } catch (err) {
        console.error("로고 업로드 실패:", err);
      } finally {
        setIsUploading(false);
      }
    }
  };
  
  // 앱 기본 로고로 복구 (관리자)
  const restoreDefaultLogo = async () => {
    await setDoc(doc(db, "settings", "appInfo"), { logo: DEFAULT_LOGO }, { merge: true });
  };

  const handleLogoClick = () => {
    setLogoClicks(prev => {
      const newCount = prev + 1;
      if (newCount >= 10) {
        setShowAdminCodeModal(true);
        return 0;
      }
      return newCount;
    });
    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    clickTimeoutRef.current = setTimeout(() => { setLogoClicks(0); }, 3000);
  };

  const verifyAdminCode = async () => {
    if (adminCodeInput === '1010004055') {
      await updateDoc(doc(db, "users", currentUser.id), { role: 'admin' });
      setShowAdminPanel(true);
      setShowAdminCodeModal(false);
      setAdminCodeInput('');
    } else {
      setAdminCodeInput('');
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete || userToDelete === currentUser.id) return; 
    
    await deleteDoc(doc(db, "users", userToDelete));
    schedules.forEach(async (s) => {
      if (s.attendees.includes(userToDelete)) {
        await updateDoc(doc(db, "schedules", s.id), {
          attendees: s.attendees.filter(id => id !== userToDelete)
        });
      }
    });

    if (adminSelectedUser === userToDelete) setAdminSelectedUser('ALL');
    setUserToDelete(null);
  };

  const handleAdminCoinAdjust = async (isAdd) => {
    const amountNum = Number(adminCoinAmount);
    if (!adminSelectedUser || amountNum <= 0) return;
    const finalAmount = isAdd ? amountNum : -amountNum;
    const desc = adminCoinReason || (isAdd ? '관리자 특별 지급' : '관리자 강제 차감');

    if (adminSelectedUser === 'ALL') {
      users.forEach(async (u) => {
        const nextCoin = Math.max(0, (u.coins || 0) + finalAmount);
        await updateDoc(doc(db, "users", u.id), { coins: nextCoin });
      });
      const logId = `h_${Date.now()}_global`;
      await setDoc(doc(db, "coinHistory", logId), {
        id: logId, userId: 'ALL', amount: finalAmount, desc: `[전체 일괄] ${desc}`, date: new Date().toLocaleString('ko-KR')
      });
    } else {
      const targetUser = userMap[adminSelectedUser];
      if (!targetUser) return;
      const nextCoin = Math.max(0, (targetUser.coins || 0) + finalAmount);
      await updateDoc(doc(db, "users", adminSelectedUser), { coins: nextCoin });
      await logCoinHistory(adminSelectedUser, finalAmount, desc);
    }
    setAdminCoinAmount(''); setAdminCoinReason('');
  };

  const handleCreate1v1Match = async () => {
    const betNum = Number(betAmount1v1);
    if (!gameTitle1v1 || !selectedOpponent1v1 || betNum <= 0) return;
    
    const players = [currentUser.id, selectedOpponent1v1];
    const insufficient = players.find(id => (userMap[id]?.coins || 0) < betNum);
    if (insufficient) {
      setRankingAlert(`❌ ${userMap[insufficient].name}님의 코인이 부족하여 매치를 생성할 수 없습니다.`);
      setTimeout(() => setRankingAlert(''), 3000);
      return;
    }
    
    const matchId = `m${Date.now()}`;
    const newMatch = { id: matchId, tId: tournaments[0].id, type: '1v1', gameTitle: gameTitle1v1, playerIds: players, bet: betNum, status: 'pending', winners: [], rewardPerWinner: 0 };
    
    await setDoc(doc(db, "matches", matchId), newMatch);
    players.forEach(async (id) => {
      const currentCoin = userMap[id]?.coins || 0;
      await updateDoc(doc(db, "users", id), { coins: currentCoin - betNum });
      await logCoinHistory(id, -betNum, `[${gameTitle1v1}] 참가 베팅 선지불`);
    });

    setGameTitle1v1(''); setSelectedOpponent1v1(''); setSearchOpponent1v1(''); setBetAmount1v1('');
    setPage1v1(1); 
  };

  const handleCreateMultiMatch = async () => {
    const betNum = Number(betAmountMulti);
    if (!gameTitleMulti || selectedOpponentsMulti.length === 0 || betNum <= 0) return;
    
    const players = [currentUser.id, ...selectedOpponentsMulti];
    const insufficient = players.find(id => (userMap[id]?.coins || 0) < betNum);
    if (insufficient) {
      setRankingAlert(`❌ ${userMap[insufficient].name}님의 코인이 부족하여 매치를 생성할 수 없습니다.`);
      setTimeout(() => setRankingAlert(''), 3000);
      return;
    }
    
    const matchId = `m${Date.now()}`;
    const newMatch = { id: matchId, tId: tournaments[0].id, type: 'multi', gameTitle: gameTitleMulti, playerIds: players, bet: betNum, status: 'pending', winners: [], rewardPerWinner: 0 };
    
    await setDoc(doc(db, "matches", matchId), newMatch);
    players.forEach(async (id) => {
      const currentCoin = userMap[id]?.coins || 0;
      await updateDoc(doc(db, "users", id), { coins: currentCoin - betNum });
      await logCoinHistory(id, -betNum, `[${gameTitleMulti}] 참가 베팅 선지불`);
    });

    setGameTitleMulti(''); setSelectedOpponentsMulti([]); setSearchQuery(''); setBetAmountMulti('');
    setPageMulti(1);
  };

  const toggleMultiOpponent = (id) => setSelectedOpponentsMulti(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);

  const confirmMatchResolve = async () => {
    if (!resolveMatchData || resolveWinners.length === 0) return;
    const match = resolveMatchData;
    const totalPot = match.bet * match.playerIds.length;
    const rewardPerWinner = Math.floor(totalPot / resolveWinners.length);

    await updateDoc(doc(db, "matches", match.id), {
      status: 'completed',
      winners: resolveWinners,
      rewardPerWinner
    });
    
    resolveWinners.forEach(async (wId) => {
      const currentCoin = userMap[wId]?.coins || 0;
      await updateDoc(doc(db, "users", wId), { coins: currentCoin + rewardPerWinner });
      await logCoinHistory(wId, rewardPerWinner, `[${match.gameTitle}] 승리 배당 보상`);
    });
    
    setResolveMatchData(null); setResolveWinners([]);
  };

  const handleAddSchedule = async () => {
    if (!newScheduleData.title || !newScheduleData.date) return;
    const scheId = `s_${Date.now()}`;
    const newS = {
      ...newScheduleData,
      id: scheId,
      maxAttendees: Number(newScheduleData.maxAttendees) || 11,
      attendees: [],
      isAuto: false
    };
    await setDoc(doc(db, "schedules", scheId), newS);
    setShowAddSchedule(false);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0a0f1c] flex flex-col items-center justify-center p-4 selection:bg-amber-500/30 font-sans relative overflow-hidden">
        <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 p-8 rounded-3xl w-full max-w-md shadow-2xl relative z-10">
          <div className="flex flex-col items-center mb-8">
            <img src={appLogo} alt="Avalon" className="w-24 h-24 rounded-2xl object-cover object-center shadow-lg shadow-amber-500/20 mb-4 bg-slate-900" />
            <h1 className="text-3xl font-black text-white tracking-tight">AVALON</h1>
          </div>
          {authError && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl mb-6 text-center">{authError}</div>}
          
          {authMode === 'login' ? (
            <div className="space-y-4">
              <input type="text" value={loginId} onChange={e => setLoginId(e.target.value)} placeholder="아이디 (admin 또는 user1)" className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-white focus:border-amber-500 outline-none" />
              <input type="password" value={loginPw} onChange={e => setLoginPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="비밀번호 (1234)" className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-white focus:border-amber-500 outline-none" />
              <Button className="w-full py-3 text-lg" onClick={handleLogin}>로그인</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-4">
                <input type="text" placeholder="학과" value={signupData.department} onChange={e => setSignupData({...signupData, department: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-amber-500 outline-none" />
                <input type="number" placeholder="학년" value={signupData.year} onChange={e => setSignupData({...signupData, year: e.target.value})} className="w-1/3 bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-amber-500 outline-none" />
              </div>
              <input type="text" placeholder="본명" value={signupData.realName} onChange={e => setSignupData({...signupData, realName: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-amber-500 outline-none" />
              <input type="text" placeholder="사용할 닉네임" value={signupData.nickname} onChange={e => setSignupData({...signupData, nickname: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-amber-500 outline-none" />
              <input type="text" placeholder="아이디" value={signupData.username} onChange={e => setSignupData({...signupData, username: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-amber-500 outline-none" />
              <input type="password" placeholder="비밀번호" value={signupData.password} onChange={e => setSignupData({...signupData, password: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-amber-500 outline-none" />
              <Button className="w-full py-3" onClick={handleSignup}>회원가입</Button>
            </div>
          )}
          <div className="mt-6 text-center text-slate-400 text-sm">
            {authMode === 'login' ? <span onClick={() => {setAuthMode('signup'); setAuthError('');}} className="cursor-pointer text-amber-400 font-bold">회원가입하기</span> : <span onClick={() => {setAuthMode('login'); setAuthError('');}} className="cursor-pointer text-amber-400 font-bold">로그인하기</span>}
          </div>
        </div>
      </div>
    );
  }

  const NavItem = ({ id, icon: Icon, label }) => {
    const isActive = currentView === id;
    return (
      <button onClick={() => setCurrentView(id)} className={`flex flex-col md:flex-row items-center gap-1 md:gap-3 p-2 md:p-3 rounded-xl transition-all w-full ${isActive ? 'text-amber-400 bg-amber-400/10 font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
        <Icon size={22} className={isActive ? 'drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : ''} />
        <span className="text-xs md:text-base">{label}</span>
      </button>
    );
  };

  const renderHome = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10"><Crown size={120} /></div>
        <div className="relative z-10"><h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500 mb-2">명예의 전당</h1><p className="text-slate-400 text-lg">최고의 보드게임 마스터를 향한 위대한 여정</p></div>
      </div>
      <Card>
        <div className="flex items-center justify-between mb-6"><h2 className="text-xl font-bold text-white flex items-center gap-2"><Trophy className="text-amber-400" /> 종합 코인 랭킹</h2><span className="text-sm text-slate-400">실시간 업데이트</span></div>
        <div className="space-y-3">
          {sortedUsers.map((user, index) => (
            <div key={user.id} className={`flex items-center justify-between p-4 rounded-xl transition-all ${index === 0 ? 'bg-gradient-to-r from-amber-500/20 border border-amber-500/30' : 'bg-slate-800/50 hover:bg-slate-700/50'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 flex items-center justify-center font-bold text-lg rounded-full ${index === 0 ? 'bg-amber-400 text-slate-900 shadow-[0_0_15px_rgba(251,191,36,0.5)]' : index === 1 ? 'bg-slate-300 text-slate-900' : index === 2 ? 'bg-amber-700 text-white' : 'text-slate-500'}`}>{index + 1}</div>
                <img src={user.avatar} className="w-12 h-12 rounded-full border-2 border-slate-700 object-cover bg-slate-900" />
                <div><div className="font-bold text-white flex items-center gap-2">{user.name}{index === 0 && <Crown size={16} className="text-amber-400" />}</div></div>
              </div>
              <div className="flex items-center gap-2 font-mono text-lg font-bold text-amber-400"><Coins size={18} />{(user.coins || 0).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderTournaments = () => {
    const activeTournament = tournaments[0] || INITIAL_TOURNAMENTS[0]; 
    
    const allMatches1v1 = matches.filter(m => m.type === '1v1');
    const total1v1Pages = Math.ceil(allMatches1v1.length / 3);
    const displayedMatches1v1 = allMatches1v1.slice((page1v1 - 1) * 3, page1v1 * 3);

    const allMatchesMulti = matches.filter(m => m.type === 'multi');
    const totalMultiPages = Math.ceil(allMatchesMulti.length / 3);
    const displayedMatchesMulti = allMatchesMulti.slice((pageMulti - 1) * 3, pageMulti * 3);
    
    const searchFilteredUsersMulti = users.filter(u => u.id !== currentUser.id && u.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const searchFilteredUsers1v1 = users.filter(u => u.id !== currentUser.id && u.name.toLowerCase().includes(searchOpponent1v1.toLowerCase()));

    const myActiveMatches = matches.filter(m => m.status === 'pending' && m.playerIds?.includes(currentUser.id));

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/5 border border-amber-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-1/2 -translate-y-1/2 right-4 opacity-20"><Trophy size={100} /></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-amber-500 text-slate-900 text-xs font-bold px-2 py-1 rounded">진행중</span>
                <span className="text-amber-400 font-bold">{activeTournament.title}</span>
              </div>
              <h2 className="text-2xl font-black text-white mb-2">{activeTournament.startDate} ~ {activeTournament.endDate}</h2>
              {activeTournament.description && <p className="text-slate-200 mb-3 text-sm leading-relaxed max-w-xl">{activeTournament.description}</p>}
              <p className="text-slate-400 text-sm font-medium">매주 <span className="font-bold text-amber-400">{activeTournament.payoutDay}요일</span> 모든 유저에게 <span className="font-bold text-amber-400 font-mono">{(activeTournament.weeklyCoin || 0).toLocaleString()}C</span> 지급!</p>
            </div>
            {currentUser.role === 'admin' && (
              <Button variant="outline" className="shrink-0 border-amber-500 text-amber-400 hover:bg-amber-500/20" onClick={() => { setEditTournamentData({ ...activeTournament }); setShowTournamentSettings(true); }}>
                <Settings size={16} /> 대회 기간/설정 관리
              </Button>
            )}
          </div>
        </div>

        {myActiveMatches.length > 0 && (
          <div className="bg-slate-800 border border-amber-500/50 rounded-2xl p-5 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Swords className="text-amber-400" size={20} /> 내가 진행 중인 매치</h3>
            <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
              {myActiveMatches.map(match => (
                <div key={match.id} className="min-w-[200px] bg-slate-900 border border-slate-700 rounded-xl p-3 shrink-0">
                  <div className="text-sm font-bold text-amber-400 mb-1">{match.gameTitle || '미지정 게임'}</div>
                  <div className="text-xs text-slate-400 mb-2">{match.type === '1v1' ? '1대1 결투' : '다인원 매치'} • 총 {match.bet * (match.playerIds?.length || 1)}C</div>
                  <div className="flex -space-x-2">
                    {match.playerIds?.map(id => <img key={id} src={userMap[id]?.avatar} className="w-6 h-6 rounded-full border-2 border-slate-800 object-cover bg-slate-900" title={userMap[id]?.name}/>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-2"><User className="text-amber-400" size={24} /><h2 className="text-2xl font-bold text-white">1대1 결투 매치</h2></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 h-fit bg-slate-800/80">
              <h3 className="text-lg font-bold text-white mb-4">1대1 결투 신청</h3>
              <div className="space-y-4">
                <div><label className="block text-sm text-slate-300 mb-2">게임 제목</label><input type="text" value={gameTitle1v1} onChange={(e) => setGameTitle1v1(e.target.value)} placeholder="게임 이름을 입력하세요" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-amber-500 outline-none" /></div>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">상대방 검색 및 선택</label>
                  <div className="relative mb-3"><input type="text" value={searchOpponent1v1} onChange={e => setSearchOpponent1v1(e.target.value)} placeholder="이름으로 찾기..." className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 pl-9 text-sm text-white focus:border-amber-500 outline-none" /><Search size={16} className="absolute left-3 top-3 text-slate-500" /></div>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                    {searchFilteredUsers1v1.map(u => (
                      <button key={u.id} onClick={() => setSelectedOpponent1v1(u.id)} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs transition-all ${selectedOpponent1v1 === u.id ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-slate-900 border-slate-700 text-slate-400'}`}><img src={u.avatar} className="w-5 h-5 rounded-full object-cover bg-slate-800" />{u.name}</button>
                    ))}
                    {searchFilteredUsers1v1.length === 0 && <div className="text-xs text-slate-500 w-full text-center">검색 결과가 없습니다.</div>}
                  </div>
                </div>
                <div><label className="block text-sm text-slate-300 mb-2">비팅할 코인</label><div className="relative"><input type="number" value={betAmount1v1} onChange={(e) => setBetAmount1v1(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 pl-10 text-white focus:border-amber-500 outline-none" /><Coins size={18} className="absolute left-3 top-3.5 text-amber-500" /></div></div>
                <Button className="w-full mt-2" onClick={handleCreate1v1Match} disabled={!gameTitle1v1 || !selectedOpponent1v1 || !betAmount1v1}><Swords size={18} /> 결투 시작</Button>
              </div>
            </Card>
            
            <Card className="lg:col-span-2 flex flex-col">
              <div className="space-y-3 flex-1">
                {displayedMatches1v1.length === 0 && <div className="text-center text-slate-500 py-10">생성된 매치가 없습니다.</div>}
                {displayedMatches1v1.map(match => renderMatchItem(match))}
              </div>
              {total1v1Pages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-slate-700/50">
                  <button onClick={() => setPage1v1(p => Math.max(1, p - 1))} disabled={page1v1 === 1} className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30"><ChevronLeft size={20}/></button>
                  <span className="text-sm font-bold text-amber-400">{page1v1} <span className="text-slate-500">/ {total1v1Pages}</span></span>
                  <button onClick={() => setPage1v1(p => Math.min(total1v1Pages, p + 1))} disabled={page1v1 === total1v1Pages} className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30"><ChevronRight size={20}/></button>
                </div>
              )}
            </Card>
          </div>
        </div>

        <div className="space-y-4 pt-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-2"><Users className="text-amber-400" size={24} /><h2 className="text-2xl font-bold text-white">다인원 코인 쟁탈전</h2></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 h-fit bg-slate-800/80">
              <h3 className="text-lg font-bold text-white mb-4">다인원 매치 신청</h3>
              <div className="space-y-4">
                <div><label className="block text-sm text-slate-300 mb-2">게임 제목</label><input type="text" value={gameTitleMulti} onChange={(e) => setGameTitleMulti(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-amber-500 outline-none" /></div>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">상대방 검색 및 선택</label>
                  <div className="relative mb-3"><input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 pl-9 text-sm text-white focus:border-amber-500 outline-none" /><Search size={16} className="absolute left-3 top-3 text-slate-500" /></div>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                    {searchFilteredUsersMulti.map(u => (
                      <button key={u.id} onClick={() => toggleMultiOpponent(u.id)} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs transition-all ${selectedOpponentsMulti.includes(u.id) ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-slate-900 border-slate-700 text-slate-400'}`}><img src={u.avatar} className="w-5 h-5 rounded-full object-cover bg-slate-800" />{u.name}</button>
                    ))}
                  </div>
                </div>
                <div><label className="block text-sm text-slate-300 mb-2">1인당 베팅할 코인</label><div className="relative"><input type="number" value={betAmountMulti} onChange={(e) => setBetAmountMulti(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 pl-10 text-white focus:border-amber-500 outline-none" /><Coins size={18} className="absolute left-3 top-3.5 text-amber-500" /></div></div>
                <Button className="w-full mt-2" onClick={handleCreateMultiMatch} disabled={!gameTitleMulti || selectedOpponentsMulti.length === 0 || !betAmountMulti}><Swords size={18} /> 다인원 시작</Button>
              </div>
            </Card>
            <Card className="lg:col-span-2 flex flex-col">
              <div className="space-y-3 flex-1">
                {displayedMatchesMulti.length === 0 && <div className="text-center text-slate-500 py-10">생성된 다인원 매치가 없습니다.</div>}
                {displayedMatchesMulti.map(match => renderMatchItem(match))}
              </div>
              {totalMultiPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-slate-700/50">
                  <button onClick={() => setPageMulti(p => Math.max(1, p - 1))} disabled={pageMulti === 1} className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30"><ChevronLeft size={20}/></button>
                  <span className="text-sm font-bold text-amber-400">{pageMulti} <span className="text-slate-500">/ {totalMultiPages}</span></span>
                  <button onClick={() => setPageMulti(p => Math.min(totalMultiPages, p + 1))} disabled={pageMulti === totalMultiPages} className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30"><ChevronRight size={20}/></button>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    );
  };

  const renderMatchItem = (match) => {
    const isPending = match.status === 'pending';
    const totalPot = match.bet * (match.playerIds?.length || 1);
    return (
      <div key={match.id} className={`bg-slate-900/50 border ${isPending ? 'border-amber-500/20' : 'border-slate-700/50 opacity-80'} rounded-xl p-4 flex flex-col gap-4`}>
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div><h4 className="text-white font-bold text-lg mb-1">{match.gameTitle || '미지정 게임'}</h4><div className="bg-slate-800 text-amber-400 font-mono text-xs px-2 py-1 rounded border border-amber-500/20 inline-flex items-center gap-1"><Trophy size={12} /> 총 상금 {totalPot}C</div></div>
          <div>{!isPending ? <div className="text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg border text-xs font-bold"><CheckCircle2 size={14} className="inline"/> 분배 완료</div> : <Button variant="outline" className="py-1 px-3 text-xs" onClick={() => {setResolveMatchData(match); setResolveWinners([]);}}>승리자 선택</Button>}</div>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          {match.playerIds?.map(id => {
            const player = userMap[id] || { name: '알 수 없음', avatar: 'https://i.pravatar.cc/150?u=unknown' };
            const isWinner = !isPending && match.winners?.includes(id);
            const reward = isWinner ? match.rewardPerWinner : 0;
            return (
              <div key={id} className={`flex flex-col items-center gap-1.5 p-2 rounded-xl ${isWinner ? 'bg-amber-500/10' : ''}`}>
                <div className="relative"><img src={player.avatar} className={`w-12 h-12 rounded-full border-2 object-cover bg-slate-900 ${isWinner ? 'border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 'border-slate-600'}`} />{isWinner && <Crown size={16} className="absolute -top-2 -right-1 text-amber-400 rotate-12" />}</div>
                <span className={`text-xs ${isWinner ? 'text-amber-400 font-bold' : 'text-slate-300'}`}>{player.name}</span>
                {!isPending && <span className="text-[10px] font-mono font-bold text-amber-400">{isWinner ? `+${reward}C` : `0C`}</span>}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSchedule = () => {
    const selectedDateString = toLocalDateString(selectedDateObj);
    const daySchedules = schedules.filter(s => s.date === selectedDateString);

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold text-white">주간 정기모임</h1>
          <Button onClick={() => setShowAddSchedule(true)}><Plus size={18}/> 일정 추가</Button>
        </div>

        <div className="flex gap-2 p-1 bg-slate-800/50 rounded-xl w-fit mb-6">
          <button onClick={() => setWeekOffset(0)} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${weekOffset === 0 ? 'bg-amber-500 text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}>이번 주</button>
          <button onClick={() => setWeekOffset(1)} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${weekOffset === 1 ? 'bg-amber-500 text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}>다음 주</button>
        </div>

        <Card className="mb-6 border-amber-500/20 bg-slate-900/80">
          <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2"><Users size={16} className="text-amber-400" /> {weekOffset === 0 ? '이번 주' : '다음 주'} 인원 요약</h3>
          <div className="grid grid-cols-7 gap-2">
            {currentWeekDates.map((date, idx) => {
              const dStr = toLocalDateString(date);
              const sches = schedules.filter(s => s.date === dStr);
              const totalAttendees = sches.reduce((sum, s) => sum + (s.attendees?.length || 0), 0);
              const isSelected = selectedDateObj.getTime() === date.getTime();

              return (
                <div key={idx} onClick={() => setSelectedDateObj(date)} className={`flex flex-col items-center justify-center py-3 rounded-xl cursor-pointer transition-all ${isSelected ? 'bg-amber-500 text-slate-900 shadow-[0_0_10px_rgba(251,191,36,0.3)]' : 'bg-slate-800 hover:bg-slate-700 text-slate-400'}`}>
                  <span className={`text-xs ${isSelected ? 'font-bold' : ''}`}>{WEEK_DAYS[date.getDay() === 0 ? 6 : date.getDay() - 1]}</span>
                  <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-slate-700' : 'text-slate-500'}`}>{date.getMonth()+1}.{date.getDate()}</span>
                  <span className={`text-lg font-black mt-1 ${isSelected ? 'text-slate-900' : 'text-amber-400'}`}>{totalAttendees}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-4 mt-6">
          <h3 className="text-xl font-bold text-white mb-4 border-b border-slate-800 pb-2">{selectedDateObj.getMonth()+1}월 {selectedDateObj.getDate()}일 일정</h3>
          {daySchedules.length === 0 && <div className="text-center py-12 text-slate-500 border border-slate-800 rounded-xl bg-slate-900/30">예정된 모임이 없습니다.</div>}
          {daySchedules.map(schedule => {
            const attendeesList = schedule.attendees || [];
            const isFull = attendeesList.length >= schedule.maxAttendees;
            const isAttending = attendeesList.includes(currentUser.id);
            const toggleAttendance = async () => {
              const nextAttendees = isAttending 
                ? attendeesList.filter(id => id !== currentUser.id)
                : (!isFull ? [...attendeesList, currentUser.id] : attendeesList);
              await updateDoc(doc(db, "schedules", schedule.id), { attendees: nextAttendees });
            };

            return (
              <Card key={schedule.id} className="flex flex-col md:flex-row justify-between items-center gap-6 border-l-4 border-l-amber-500">
                <div className="flex-1 space-y-3 w-full">
                  <h3 className="text-xl font-bold text-white">{schedule.title} {isFull && <span className="bg-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded-md">마감</span>}</h3>
                  <div className="flex gap-4 text-sm text-slate-300"><div><Clock size={16} className="inline text-amber-400"/> {schedule.time}</div><div><MapPin size={16} className="inline text-amber-400"/> {schedule.location}</div></div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {attendeesList.map(id => <img key={id} src={userMap[id]?.avatar} className="w-8 h-8 rounded-full border border-slate-600 object-cover bg-slate-800" title={userMap[id]?.name} />)}
                    {attendeesList.length === 0 && <span className="text-xs text-slate-600">아직 참석자가 없습니다.</span>}
                  </div>
                </div>
                <div className="w-full md:w-auto bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 flex flex-col items-end gap-3 min-w-[160px]">
                  <div className="text-sm text-slate-300 w-full flex justify-between"><span>인원</span><span><span className="text-amber-400 font-bold">{attendeesList.length}</span> / {schedule.maxAttendees}</span></div>
                  <Button variant={isAttending ? 'danger' : (isFull ? 'secondary' : 'primary')} disabled={!isAttending && isFull} className="w-full text-sm" onClick={toggleAttendance}>{isAttending ? '참석 취소' : (isFull ? '인원 마감' : '참석 신청')}</Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-slate-200 font-sans selection:bg-amber-500/30">
      {rankingAlert && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-900 px-6 py-3 rounded-full font-bold shadow-lg animate-in slide-in-from-top-4 fade-in duration-300">{rankingAlert}</div>}

      {/* 내 프로필 수정 모달 */}
      {showProfileEdit && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-white"><Edit3 size={20} className="inline text-amber-400"/> 프로필 수정</h3><button onClick={() => setShowProfileEdit(false)} className="text-slate-400"><X size={24} /></button></div>
            <div className="space-y-4">
              <div className="flex justify-center mb-4"><img src={profileEditData.avatar} className="w-20 h-20 rounded-full border-2 border-amber-500 shadow-lg object-cover bg-slate-900" /></div>
              <div>
                <label className="block text-sm text-slate-300 mb-1 font-bold">프로필 사진 첨부</label>
                <label className={`flex flex-col items-center justify-center w-full h-20 border-2 border-slate-700 border-dashed rounded-xl ${isUploading ? 'bg-slate-800 cursor-not-allowed' : 'cursor-pointer bg-slate-900/50 hover:bg-slate-800'} transition-colors`}>
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {isUploading ? (
                      <span className="text-amber-400 font-bold text-xs animate-pulse">사진 압축 및 처리중...</span>
                    ) : (
                      <><ImagePlus size={24} className="text-slate-400 mb-1" /><p className="text-xs text-slate-400">클릭하여 파일 선택 (자동 리사이징 적용)</p></>
                    )}
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                </label>
              </div>
              <div><label className="block text-sm text-slate-300 mb-1">닉네임</label><input type="text" value={profileEditData.name} onChange={e => setProfileEditData({...profileEditData, name: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-amber-500 outline-none" /></div>
              <div className="flex gap-3">
                <div className="flex-1"><label className="block text-sm text-slate-300 mb-1">학과</label><input type="text" value={profileEditData.department} onChange={e => setProfileEditData({...profileEditData, department: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none" /></div>
                <div className="w-1/3"><label className="block text-sm text-slate-300 mb-1">입학 학년</label><input type="number" value={profileEditData.year} onChange={e => setProfileEditData({...profileEditData, year: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none" /></div>
              </div>
              <Button className="w-full mt-4 py-3" onClick={saveProfileEdit} disabled={isUploading}>저장 및 적용</Button>
            </div>
          </div>
        </div>
      )}

      {showAddSchedule && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in zoom-in-95">
          <div className="bg-slate-800 border border-amber-500/50 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-white flex items-center gap-2"><Calendar className="text-amber-400"/> 새로운 일정 추가</h3><button onClick={() => setShowAddSchedule(false)} className="text-slate-400"><X size={24} /></button></div>
            <div className="space-y-4">
              <div><label className="block text-sm text-slate-300 mb-2">모임 제목</label><input type="text" value={newScheduleData.title} onChange={e=>setNewScheduleData({...newScheduleData, title: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-amber-500"/></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-slate-300 mb-2">날짜</label><input type="date" value={newScheduleData.date} onChange={e=>setNewScheduleData({...newScheduleData, date: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-amber-500"/></div>
                <div><label className="block text-sm text-slate-300 mb-2">시간</label><input type="time" value={newScheduleData.time} onChange={e=>setNewScheduleData({...newScheduleData, time: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-amber-500"/></div>
              </div>
              <div><label className="block text-sm text-slate-300 mb-2">장소</label><input type="text" value={newScheduleData.location} onChange={e=>setNewScheduleData({...newScheduleData, location: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-amber-500"/></div>
              <div><label className="block text-sm text-slate-300 mb-2">최대 인원</label><input type="number" value={newScheduleData.maxAttendees} onChange={e=>setNewScheduleData({...newScheduleData, maxAttendees: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-amber-500"/></div>
              <Button className="w-full mt-4" onClick={handleAddSchedule} disabled={!newScheduleData.title || !newScheduleData.date}>일정 개설하기</Button>
            </div>
          </div>
        </div>
      )}

      {showAdminCodeModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-slate-900 border border-red-500/50 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><ShieldAlert className="text-red-500" /> 관리자 보안 코드</h3>
            <p className="text-sm text-slate-400 mb-4">최고 관리자 권한을 활성화하려면 보안 코드를 입력하세요.</p>
            <input type="password" value={adminCodeInput} onChange={e => setAdminCodeInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && verifyAdminCode()} placeholder="보안 코드 입력" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:border-red-500 outline-none mb-4 font-mono tracking-widest text-center" />
            <div className="flex gap-3"><Button variant="secondary" className="flex-1" onClick={() => {setShowAdminCodeModal(false); setAdminCodeInput('');}}>취소</Button><Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" onClick={verifyAdminCode}>인증 확인</Button></div>
          </div>
        </div>
      )}

      {/* 관리자 패널 */}
      {showAdminPanel && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-red-500/50 rounded-2xl p-6 w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative">
            
            {userToDelete && (
              <div className="absolute inset-0 z-[110] bg-slate-900/95 flex flex-col items-center justify-center p-6 backdrop-blur-sm animate-in zoom-in-95 duration-200">
                <AlertTriangle size={48} className="text-red-500 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">정말 탈퇴 처리하시겠습니까?</h3>
                <p className="text-sm text-slate-400 mb-6 text-center">
                  <span className="text-amber-400 font-bold">{userMap[userToDelete]?.name}</span> 유저의 모든 정보와 코인이 삭제되며 되돌릴 수 없습니다.
                </p>
                <div className="flex gap-4 w-full max-w-sm">
                  <Button variant="secondary" className="flex-1" onClick={() => setUserToDelete(null)}>취소</Button>
                  <Button variant="danger" className="flex-1" onClick={confirmDeleteUser}>탈퇴 확정</Button>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-black text-red-500"><ShieldAlert className="inline mr-2"/>최고 관리자 패널</h3><button onClick={() => setShowAdminPanel(false)} className="text-slate-400 hover:text-white"><X size={28} /></button></div>
            <div className="flex bg-slate-800 p-1 rounded-xl mb-6 flex-wrap gap-1 md:flex-nowrap">
              <button onClick={() => setAdminTab('manage')} className={`flex-1 py-2 text-xs md:text-sm md:py-2.5 font-bold rounded-lg transition-all ${adminTab === 'manage' ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-white'}`}>코인 조작</button>
              <button onClick={() => setAdminTab('users')} className={`flex-1 py-2 text-xs md:text-sm md:py-2.5 font-bold rounded-lg transition-all ${adminTab === 'users' ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-white'}`}>회원 관리</button>
              <button onClick={() => setAdminTab('history')} className={`flex-1 py-2 text-xs md:text-sm md:py-2.5 font-bold rounded-lg transition-all ${adminTab === 'history' ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-white'}`}>비밀 장부</button>
              <button onClick={() => setAdminTab('settings')} className={`flex-1 py-2 text-xs md:text-sm md:py-2.5 font-bold rounded-lg transition-all ${adminTab === 'settings' ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-white'}`}>앱 설정</button>
            </div>
            
            {adminTab === 'manage' && (
              <div className="space-y-5 flex-1">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">대상 선택</label>
                  <select value={adminSelectedUser} onChange={e => setAdminSelectedUser(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none">
                    <option value="ALL">🌟 모든 유저 (전체 일괄 적용)</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name} ({(u.coins || 0).toLocaleString()} C)</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">조작할 코인 숫자</label>
                  <input type="number" value={adminCoinAmount} onChange={e => setAdminCoinAmount(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none placeholder:text-slate-600" placeholder="예: 500"/>
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">사유 (선택사항)</label>
                  <input type="text" value={adminCoinReason} onChange={e => setAdminCoinReason(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none placeholder:text-slate-600" placeholder="예: 전체 이벤트 보상"/>
                </div>
                <div className="flex gap-4 pt-4">
                  <Button variant="danger" className="flex-1" onClick={() => handleAdminCoinAdjust(false)}>
                    <ArrowDownCircle size={18} /> 강제 차감
                  </Button>
                  <Button className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => handleAdminCoinAdjust(true)}>
                    <ArrowUpCircle size={18} /> 강제 지급
                  </Button>
                </div>
              </div>
            )}

            {adminTab === 'users' && (
              <div className="space-y-5 flex-1 overflow-y-auto custom-scrollbar pr-2">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">유저 조회 및 선택</label>
                  <select value={adminSelectedUser} onChange={e => setAdminSelectedUser(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none">
                    <option value="ALL">🌟 모든 유저 (위 코인 조작용)</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name} (ID: {u.username})</option>)}
                  </select>
                </div>
                
                {adminSelectedUser === 'ALL' ? (
                  <div className="text-center text-slate-500 py-10 bg-slate-800/50 rounded-xl border border-slate-700/50">
                    상세 정보를 확인할 특정 유저를 위 목록에서 선택해주세요.
                  </div>
                ) : userMap[adminSelectedUser] && (
                  <>
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <img src={userMap[adminSelectedUser].avatar} className="w-12 h-12 rounded-full border-2 border-slate-600 object-cover bg-slate-900" alt="avatar"/>
                          <div>
                            <h4 className="font-bold text-white text-lg flex items-center gap-2">
                              {userMap[adminSelectedUser].name} 
                              <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-500/20">{userMap[adminSelectedUser].role?.toUpperCase()}</span>
                            </h4>
                            <p className="text-xs text-slate-400 mt-1">ID: {userMap[adminSelectedUser].username} | 본명: {userMap[adminSelectedUser].realName || '미입력'}</p>
                          </div>
                        </div>
                        {adminSelectedUser !== currentUser.id && (
                          <Button variant="danger" className="text-xs py-1.5 px-3 border-red-500/50" onClick={() => setUserToDelete(adminSelectedUser)}>강제 탈퇴</Button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-slate-300 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                        <div><span className="text-slate-500 text-[10px] block mb-0.5">학과</span> {userMap[adminSelectedUser].department || '-'}</div>
                        <div><span className="text-slate-500 text-[10px] block mb-0.5">학년 (가입연도)</span> {userMap[adminSelectedUser].year ? getDisplayYear(userMap[adminSelectedUser].year, userMap[adminSelectedUser].joinYear) : '-'} <span className="text-xs text-slate-500">({userMap[adminSelectedUser].joinYear})</span></div>
                        <div className="col-span-2 mt-1 pt-2 border-t border-slate-700/50 flex justify-between items-center">
                          <span className="text-slate-500 text-xs block">현재 보유 코인</span> 
                          <span className="text-amber-400 font-mono font-bold text-lg">{(userMap[adminSelectedUser].coins || 0).toLocaleString()}C</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-white mb-3 flex items-center gap-2"><History size={16} className="text-amber-400"/> 코인 매치 히스토리</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                        {(() => {
                          const userMatches = matches.filter(m => m.playerIds?.includes(adminSelectedUser));
                          if (userMatches.length === 0) return <div className="text-center text-slate-500 py-6 bg-slate-800/50 rounded-xl border border-slate-700/50 text-sm">진행한 매치 기록이 없습니다.</div>;
                          
                          return userMatches.map(m => {
                            const isWinner = m.status === 'completed' && m.winners?.includes(adminSelectedUser);
                            const netChange = m.status === 'completed' ? (isWinner ? m.rewardPerWinner - m.bet : -m.bet) : 0;
                            return (
                              <div key={m.id} className="bg-slate-800 border border-slate-700/50 p-3 rounded-xl flex justify-between items-center text-sm">
                                <div>
                                  <div className="text-white font-bold mb-0.5">{m.gameTitle || '미지정 게임'} <span className="text-[10px] font-normal text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded ml-1 border border-slate-700">{m.type === '1v1' ? '1대1' : '다인원'}</span></div>
                                  <div className="text-xs text-slate-400">{m.status === 'completed' ? '종료됨' : '결과 대기중'} | 베팅: <span className="font-mono text-amber-500/80">{m.bet}C</span></div>
                                </div>
                                <div className={`font-mono font-bold text-right ${m.status === 'completed' ? (netChange > 0 ? 'text-emerald-400' : 'text-red-400') : 'text-slate-400'}`}>
                                  {m.status === 'completed' ? (netChange > 0 ? `+${netChange}C` : `${netChange}C`) : '진행중'}
                                  {isWinner && <Crown size={12} className="inline ml-1 text-amber-400 -mt-1 drop-shadow-md"/>}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {adminTab === 'history' && (
              <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                {coinHistory.length===0 && <div className="text-center text-slate-500 py-10">장부 기록이 없습니다.</div>}
                {coinHistory.map(log => (
                  <div key={log.id} className="flex justify-between items-center bg-slate-800 p-3 rounded-lg">
                    <div className="text-sm">
                      <div className="font-bold text-white flex items-center gap-1">
                        {log.userId === 'ALL' ? <span className="text-amber-400">🌟 모든 유저</span> : userMap[log.userId]?.name} 
                        <span className="text-xs font-normal text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded ml-1 border border-slate-700">{log.desc}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{log.date}</div>
                    </div>
                    <div className={`font-mono font-bold ${log.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {log.amount > 0 ? '+' : ''}{log.amount}C
                    </div>
                  </div>
                ))}
              </div>
            )}

            {adminTab === 'settings' && (
              <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-2">
                <div>
                  <h4 className="font-bold text-white mb-3">전체 앱 로고 변경 (서버 동기화)</h4>
                  <div className="bg-slate-800 p-6 rounded-xl border border-slate-700/50 flex flex-col items-center gap-4">
                    <img src={appLogo} className="w-32 h-32 rounded-2xl object-cover object-center shadow-lg bg-slate-900" alt="Current Logo"/>
                    <label className={`cursor-pointer border px-4 py-2 rounded-xl text-sm font-bold transition-colors ${isUploading ? 'bg-slate-700 border-slate-600 text-slate-400' : 'bg-slate-900 hover:bg-slate-700 border-slate-600 text-slate-300'}`}>
                      {isUploading ? '로고 처리 및 서버 업로드 중...' : '새 로고 이미지 서버에 등록'}
                      <input type="file" className="hidden" accept="image/*" onChange={handleAppLogoUpload} disabled={isUploading} />
                    </label>
                    <p className="text-xs text-slate-500 text-center">모든 사용자 화면의 로고가 즉시 바뀝니다.<br/>자동으로 적절한 크기로 압축되어 데이터베이스에 저장됩니다.</p>
                    <Button variant="outline" className="mt-2 text-xs py-1.5 border-slate-600 text-slate-400 hover:text-white hover:border-slate-400" onClick={restoreDefaultLogo} disabled={isUploading}>기본 로고로 복원</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {resolveMatchData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-slate-800 border border-amber-500/50 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4"><Crown className="inline text-amber-400 mr-2"/>승리자 선택</h3>
            <p className="text-sm text-slate-400 mb-4">승리자를 선택하세요. 여러 명 선택 시 상금이 등분됩니다.</p>
            <div className="grid grid-cols-2 gap-3 mb-6 max-h-60 overflow-y-auto">
              {resolveMatchData.playerIds?.map(id => {
                const isSelected = resolveWinners.includes(id);
                return <button key={id} onClick={() => {setResolveWinners(prev => prev.includes(id) ? prev.filter(w=>w!==id) : [...prev, id])}} className={`p-3 rounded-xl border-2 flex items-center gap-3 ${isSelected ? 'border-amber-500 bg-amber-500/20 text-amber-400' : 'border-slate-700 bg-slate-900 text-slate-300'}`}><img src={userMap[id]?.avatar} className="w-8 h-8 rounded-full object-cover bg-slate-800" />{userMap[id]?.name}</button>;
              })}
            </div>
            <Button className="w-full" onClick={confirmMatchResolve} disabled={resolveWinners.length === 0}>결과 확정 및 분배</Button>
          </div>
        </div>
      )}

      {showTournamentSettings && editTournamentData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
            <h3 className="text-xl font-bold text-white mb-6 shrink-0">대회 설정 관리</h3>
            <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2 flex-1">
              <div><label className="text-sm text-slate-300 block mb-2 font-bold">대회 제목</label><input type="text" value={editTournamentData.title} onChange={e=>setEditTournamentData({...editTournamentData, title: e.target.value})} placeholder="대회 제목을 입력하세요" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-amber-500 transition-colors"/></div>
              <div><label className="text-sm text-slate-300 block mb-2 font-bold">대회 설명</label><textarea value={editTournamentData.description || ''} onChange={e=>setEditTournamentData({...editTournamentData, description: e.target.value})} placeholder="대회에 대한 간단한 규칙이나 설명을 작성해주세요." className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-amber-500 transition-colors resize-none h-24"></textarea></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-slate-300 block mb-2 font-bold">시작일</label><input type="date" value={editTournamentData.startDate} onChange={e=>setEditTournamentData({...editTournamentData, startDate: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-amber-500"/></div>
                <div><label className="text-sm text-slate-300 block mb-2 font-bold">종료일</label><input type="date" value={editTournamentData.endDate} onChange={e=>setEditTournamentData({...editTournamentData, endDate: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-amber-500"/></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-slate-300 block mb-2 font-bold">코인 지급 요일</label><select value={editTournamentData.payoutDay} onChange={e=>setEditTournamentData({...editTournamentData, payoutDay: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-amber-500">{WEEK_DAYS.map(d=><option key={d} value={d}>{d}요일</option>)}</select></div>
                <div><label className="text-sm text-slate-300 block mb-2 font-bold">주간 지급액</label><input type="number" value={editTournamentData.weeklyCoin} onChange={e=>setEditTournamentData({...editTournamentData, weeklyCoin: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-amber-500"/></div>
              </div>
            </div>
            <Button className="w-full mt-6 shrink-0" onClick={async () => { setTournaments([editTournamentData]); await setDoc(doc(db, "tournaments", editTournamentData.id), editTournamentData); setShowTournamentSettings(false); }}>설정 저장</Button>
          </div>
        </div>
      )}

      {/* 메인 레이아웃 */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row min-h-screen">
        <aside className="hidden md:flex flex-col w-64 border-r border-slate-800 p-6 sticky top-0 h-screen bg-[#0a0f1c]/80 backdrop-blur-xl">
          <div onClick={handleLogoClick} className="flex items-center gap-3 mb-12 text-amber-400 cursor-pointer select-none">
            <img src={appLogo} className="w-14 h-14 rounded-xl object-cover object-center shadow-lg shadow-amber-500/10 bg-slate-900" />
            <span className="text-2xl font-black">Avalon</span>
          </div>
          <nav className="flex-1 space-y-2">
            <NavItem id="home" icon={Home} label="홈" />
            <NavItem id="tournaments" icon={Trophy} label="매치" />
            <NavItem id="schedule" icon={Calendar} label="일정" />
          </nav>
          <div className="mt-auto pt-6 border-t border-slate-800">
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:bg-slate-800 transition-colors">
              <div onClick={openProfileEdit} className="flex items-center gap-3 cursor-pointer flex-1 overflow-hidden">
                <img src={currentUser.avatar} alt="Profile" className="w-10 h-10 rounded-full border-2 border-slate-600 object-cover shrink-0 bg-slate-900" />
                <div className="overflow-hidden">
                  <div className="text-sm font-bold text-white truncate">{currentUser.name}</div>
                  <div className="text-xs text-amber-400 font-mono font-bold flex items-center gap-1 mt-0.5"><Coins size={12} /> {(currentUser.coins || 0).toLocaleString()} C</div>
                </div>
              </div>
              <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors ml-2" title="로그아웃">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </aside>

        <header className="md:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-[#0a0f1c]/90 sticky top-0 z-50">
          <div onClick={handleLogoClick} className="flex items-center gap-2 text-amber-400">
            <img src={appLogo} className="w-10 h-10 rounded-lg object-cover object-center bg-slate-900" />
            <span className="font-black text-lg">Avalon</span>
          </div>
          <div className="flex items-center gap-3">
            <div onClick={openProfileEdit} className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700"><Coins size={14} className="text-amber-400" /><span className="text-sm font-mono font-bold text-white">{(currentUser.coins || 0).toLocaleString()}</span></div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-400"><LogOut size={20}/></button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto">
          {currentView === 'home' && renderHome()}
          {currentView === 'schedule' && renderSchedule()}
          {currentView === 'tournaments' && renderTournaments()}
        </main>
        
        <nav className="md:hidden fixed bottom-0 w-full bg-slate-900/90 flex justify-around p-2 z-50 border-t border-slate-800"><NavItem id="home" icon={Home} label="홈" /><NavItem id="tournaments" icon={Trophy} label="매치" /><NavItem id="schedule" icon={Calendar} label="일정" /></nav>
      </div>
    </div>
  );
}