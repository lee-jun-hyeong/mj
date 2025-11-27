import './style.css';
import { auth, db, storage, functions } from './config/firebase';

// Firebase 초기화 확인
console.log('Firebase initialized:', { auth, db, storage, functions });

const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
  <h1>마이클 지저스</h1>
  <p>악보 콘티 앱</p>
  <p>Firebase 연결 완료</p>
`;

