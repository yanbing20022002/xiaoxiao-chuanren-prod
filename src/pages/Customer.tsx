import React from 'react';
import PrerollIntro from '../components/PrerollIntro';
import ParallaxScrollH5 from '../components/ParallaxScrollH5';
import { GameLevel, UserPassport, LivePhoto, LevelStatus } from '../types';

// 这里是剥离后的 C端（客户）独立页面逻辑
export default function CustomerPage() {
  const [hasCompletedIntro, setHasCompletedIntro] = React.useState(false);
  const [levels, setLevels] = React.useState([]); // 需从全局状态或API获取
  const [passport, setPassport] = React.useState({}); 

  return (
    <div className="min-h-screen bg-black">
      {!hasCompletedIntro ? (
        <PrerollIntro onComplete={() => setHasCompletedIntro(true)} />
      ) : (
        <ParallaxScrollH5 
          levels={levels}
          passport={passport}
          photos={[]}
          onUpdatePassport={() => {}}
          onClearScore={() => {}}
        />
      )}
    </div>
  );
}
