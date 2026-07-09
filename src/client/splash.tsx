import './index.css';

import { navigateTo } from '@devvit/web/client';
import { context, requestExpandedMode } from '@devvit/web/client';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { usePoll } from './hooks/usePoll';

const formatRemaining = (endsAt: string) => {
  const remaining = new Date(endsAt).getTime() - Date.now();

  if (remaining <= 0) {
    return 'Results are ready';
  }

  const minutes = Math.ceil(remaining / 60000);

  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  }

  const hours = Math.floor(minutes / 60);
  const leftoverMinutes = minutes % 60;

  if (hours < 24) {
    return leftoverMinutes > 0 ? `${hours}h ${leftoverMinutes}m` : `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  const leftoverHours = hours % 24;

  return leftoverHours > 0 ? `${days}d ${leftoverHours}h` : `${days}d`;
};

export const Splash = () => {
  const { poll } = usePoll();

  return (
    <div className="min-h-screen px-4 py-6 text-white bg-[#09070f]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,102,0,0.25),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.08),_transparent_30%)]" />

      <main className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-4xl flex-col justify-between rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl md:p-8">
        <section className="flex flex-1 flex-col justify-center gap-6 text-center">
          <div>
            <span className="inline-flex items-center rounded-full border border-orange-400/30 bg-orange-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-orange-200">
              1-10 social game
            </span>

            <h1 className="mt-5 text-4xl font-black tracking-tight md:text-6xl">
              {poll?.prompt ?? 'Rate it 1-10'}
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-base text-white/75 md:text-lg">
              {poll?.opinion ?? context.username ?? 'A new opinion poll is waiting.'}
            </p>
          </div>

          <div className="mx-auto grid w-full max-w-2xl gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/50">1 means</div>
              <div className="mt-2 text-sm text-white/85">{poll?.oneLabel ?? 'The weaker side of the scale'}</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/50">10 means</div>
              <div className="mt-2 text-sm text-white/85">{poll?.tenLabel ?? 'The stronger side of the scale'}</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/50">Timer</div>
              <div className="mt-2 text-sm text-white/85">
                {poll ? formatRemaining(poll.endsAt) : '24 hours by default'}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              className="rounded-full bg-gradient-to-r from-orange-500 to-amber-300 px-6 py-3 text-sm font-bold text-black transition hover:scale-[1.01]"
              onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
            >
              Tap to vote
            </button>

            <button
              className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-orange-300/50 hover:bg-orange-400/10"
              onClick={() => navigateTo('https://developers.reddit.com/docs')}
            >
              How it works
            </button>
          </div>
        </section>

        <footer className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-4 text-sm text-white/55 md:flex-row md:items-center md:justify-between">
          <span>Creator setup lives in the subreddit menu.</span>
          <button
            className="text-left font-semibold text-white/80 transition hover:text-white"
            onClick={() => navigateTo('https://www.reddit.com/r/Devvit')}
          >
            r/Devvit
          </button>
        </footer>
      </main>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);
