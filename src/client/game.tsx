import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { navigateTo } from '@devvit/web/client';
import { usePoll } from './hooks/usePoll';

export const App = () => {
  const { poll, loading, submitting, error, vote } = usePoll();

  if (loading && !poll) {
    return (
      <div className="min-h-screen px-4 py-6 text-white bg-[#09070f]">
        <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-black/30 backdrop-blur-xl">
          <p className="text-lg text-white/70">Loading the poll...</p>
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="min-h-screen px-4 py-6 text-white bg-[#09070f]">
        <div className="mx-auto flex min-h-[70vh] max-w-4xl flex-col items-center justify-center rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-black/30 backdrop-blur-xl">
          <h1 className="text-3xl font-black tracking-tight">1-10</h1>
          <p className="mt-3 max-w-xl text-white/70">
            This post is missing poll data. Create a new poll from the subreddit menu.
          </p>
        </div>
      </div>
    );
  }

  const scoreLabels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

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

  const resultsVisible = poll.resultsVisible;
  const canVote = poll.canVote && !submitting;
  const remaining = formatRemaining(poll.endsAt);

  return (
    <div className="min-h-screen px-4 py-6 text-white bg-[#09070f]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,102,0,0.25),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.08),_transparent_30%)]" />

      <main className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col gap-6 rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl md:p-8">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex items-center rounded-full border border-orange-400/30 bg-orange-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-orange-200">
              Live poll
            </span>
            <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
              {poll.title}
            </h1>
            <p className="mt-3 text-base text-white/75 md:text-lg">
              {poll.prompt}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/70">
            <div className="font-semibold text-white">
              {resultsVisible ? 'Results are live' : `Results unlock in ${remaining}`}
            </div>
            <div className="mt-1">Created by {poll.creator}</div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[1.5rem] border border-white/10 bg-[#0f1220]/80 p-5 shadow-lg shadow-black/20 md:p-6">
            <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
              <span className="rounded-full bg-white/10 px-3 py-1">1 = {poll.oneLabel}</span>
              <span className="rounded-full bg-white/10 px-3 py-1">10 = {poll.tenLabel}</span>
              <span className="rounded-full bg-white/10 px-3 py-1">Votes: {poll.totalVotes}</span>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-200">Opinion</p>
              <p className="mt-2 text-lg leading-relaxed text-white/90">{poll.opinion}</p>
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
                {error}
              </div>
            ) : null}

            {!resultsVisible ? (
              <div className="mt-6">
                <p className="text-sm text-white/70">
                  Pick a number from 1 to 10. Your vote stays hidden until the timer ends.
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {scoreLabels.map((score) => {
                    const selected = poll.userVote === score;

                    return (
                      <button
                        key={score}
                        type="button"
                        disabled={!canVote}
                        onClick={() => void vote(score)}
                        className={`rounded-2xl border px-4 py-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-orange-300/60 hover:bg-orange-400/10 disabled:cursor-not-allowed disabled:opacity-60 ${selected ? 'border-orange-300 bg-orange-400/20 shadow-[0_0_0_1px_rgba(251,146,60,0.35)]' : 'border-white/10 bg-white/5'}`}
                      >
                        <div className="text-3xl font-black leading-none">{score}</div>
                        <div className="mt-2 text-xs uppercase tracking-[0.2em] text-white/60">
                          {selected ? 'Your vote' : 'Choose'}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {poll.userVote ? (
                  <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                    You voted {poll.userVote}/10. Results unlock in {remaining}.
                  </div>
                ) : null}
              </div>
            ) : null}

            {resultsVisible ? (
              <div className="mt-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-200">Results</p>
                    <p className="mt-1 text-sm text-white/70">
                      Here is how the community ranked the idea.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-orange-300/50 hover:bg-orange-400/10"
                    onClick={() => navigateTo(`https://www.reddit.com/comments/${poll.postId}`)}
                  >
                    Open discussion
                  </button>
                </div>

                <div className="mt-5 space-y-3">
                  {poll.buckets.map((bucket) => (
                    <div key={bucket.score} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <div className="font-semibold text-white">{bucket.score}/10</div>
                        <div className="text-white/70">
                          {bucket.count} vote{bucket.count === 1 ? '' : 's'} · {bucket.percentage}%
                        </div>
                      </div>

                      <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-300 transition-all"
                          style={{
                            width: `${Math.max(bucket.percentage, bucket.count > 0 ? 8 : 0)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <aside className="space-y-4 rounded-[1.5rem] border border-white/10 bg-black/20 p-5 md:p-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-200">
                Scale guide
              </p>
              <div className="mt-3 space-y-3 text-sm text-white/75">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="font-semibold text-white">1</div>
                  <div className="mt-1">{poll.oneLabel}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="font-semibold text-white">10</div>
                  <div className="mt-1">{poll.tenLabel}</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/75">
              <p className="font-semibold text-white">How to use it</p>
              <ul className="mt-3 space-y-2">
                <li>Vote during the timer.</li>
                <li>Results stay hidden until the reveal time.</li>
                <li>After the reveal, jump into the comments and debate the ranking.</li>
              </ul>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
};

      import { usePoll } from './hooks/useCounter';

      const scoreLabels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

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
          return leftoverMinutes > 0
            ? `${hours}h ${leftoverMinutes}m`
            : `${hours}h`;
        }

        const days = Math.floor(hours / 24);
        const leftoverHours = hours % 24;

        return leftoverHours > 0 ? `${days}d ${leftoverHours}h` : `${days}d`;
      };
  <StrictMode>
    <App />
        const { poll, loading, submitting, error, vote } = usePoll();

        if (loading && !poll) {
          return (
            <div className="min-h-screen px-4 py-6 text-white bg-[#09070f]">
              <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-black/30 backdrop-blur-xl">
                <p className="text-lg text-white/70">Loading the poll...</p>
              </div>
            </div>
          );
        }

        if (!poll) {
          return (
            <div className="min-h-screen px-4 py-6 text-white bg-[#09070f]">
              <div className="mx-auto flex min-h-[70vh] max-w-4xl flex-col items-center justify-center rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-black/30 backdrop-blur-xl">
                <h1 className="text-3xl font-black tracking-tight">1-10</h1>
                <p className="mt-3 max-w-xl text-white/70">
                  This post is missing poll data. Create a new poll from the subreddit menu.
                </p>
              </div>
            </div>
          );
        }

        const resultsVisible = poll.resultsVisible;
        const canVote = poll.canVote && !submitting;
        const remaining = formatRemaining(poll.endsAt);
);

          <div className="min-h-screen px-4 py-6 text-white bg-[#09070f]">
            <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,102,0,0.25),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.08),_transparent_30%)]" />

            <main className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col gap-6 rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl md:p-8">
              <header className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
                <div className="max-w-3xl">
                  <span className="inline-flex items-center rounded-full border border-orange-400/30 bg-orange-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-orange-200">
                    Live poll
                  </span>
                  <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
                    {poll.title}
                  </h1>
                  <p className="mt-3 text-base text-white/75 md:text-lg">
                    {poll.prompt}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/70">
                  <div className="font-semibold text-white">{resultsVisible ? 'Results are live' : `Results unlock in ${remaining}`}</div>
                  <div className="mt-1">Created by {poll.creator}</div>
                </div>
              </header>

              <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-[1.5rem] border border-white/10 bg-[#0f1220]/80 p-5 shadow-lg shadow-black/20 md:p-6">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
                    <span className="rounded-full bg-white/10 px-3 py-1">1 = {poll.oneLabel}</span>
                    <span className="rounded-full bg-white/10 px-3 py-1">10 = {poll.tenLabel}</span>
                    <span className="rounded-full bg-white/10 px-3 py-1">Votes: {poll.totalVotes}</span>
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-200">Opinion</p>
                    <p className="mt-2 text-lg leading-relaxed text-white/90">{poll.opinion}</p>
                  </div>

                  {error ? (
                    <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
                      {error}
                    </div>
                  ) : null}

                  {!resultsVisible ? (
                    <div className="mt-6">
                      <p className="text-sm text-white/70">
                        Pick a number from 1 to 10. Your vote stays hidden until the timer ends.
                      </p>

                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                        {scoreLabels.map((score) => {
                          const selected = poll.userVote === score;

                          return (
                            <button
                              key={score}
                              type="button"
                              disabled={!canVote}
                              onClick={() => void vote(score)}
                              className={`rounded-2xl border px-4 py-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-orange-300/60 hover:bg-orange-400/10 disabled:cursor-not-allowed disabled:opacity-60 ${selected ? 'border-orange-300 bg-orange-400/20 shadow-[0_0_0_1px_rgba(251,146,60,0.35)]' : 'border-white/10 bg-white/5'}`}
                            >
                              <div className="text-3xl font-black leading-none">{score}</div>
                              <div className="mt-2 text-xs uppercase tracking-[0.2em] text-white/60">
                                {selected ? 'Your vote' : 'Choose'}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {poll.userVote ? (
                        <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                          You voted {poll.userVote}/10. Results unlock in {remaining}.
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {resultsVisible ? (
                    <div className="mt-6">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-200">Results</p>
                          <p className="mt-1 text-sm text-white/70">
                            Here is how the community ranked the idea.
                          </p>
                        </div>

                        <button
                          type="button"
                          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-orange-300/50 hover:bg-orange-400/10"
                          onClick={() => navigateTo(`https://www.reddit.com/comments/${poll.postId}`)}
                        >
                          Open discussion
                        </button>
                      </div>

                      <div className="mt-5 space-y-3">
                        {poll.buckets.map((bucket) => (
                          <div
                            key={bucket.score}
                            className="rounded-2xl border border-white/10 bg-black/20 p-4"
                          >
                            <div className="flex items-center justify-between gap-4 text-sm">
                              <div className="font-semibold text-white">{bucket.score}/10</div>
                              <div className="text-white/70">
                                {bucket.count} vote{bucket.count === 1 ? '' : 's'} · {bucket.percentage}%
                              </div>
                            </div>

                            <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-300 transition-all"
                                style={{ width: `${Math.max(bucket.percentage, bucket.count > 0 ? 8 : 0)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <aside className="space-y-4 rounded-[1.5rem] border border-white/10 bg-black/20 p-5 md:p-6">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-200">
                      Scale guide
                    </p>
                    <div className="mt-3 space-y-3 text-sm text-white/75">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="font-semibold text-white">1</div>
                        <div className="mt-1">{poll.oneLabel}</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="font-semibold text-white">10</div>
                        <div className="mt-1">{poll.tenLabel}</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/75">
                    <p className="font-semibold text-white">How to use it</p>
                    <ul className="mt-3 space-y-2">
                      <li>Vote during the timer.</li>
                      <li>Results stay hidden until the reveal time.</li>
                      <li>After the reveal, jump into the comments and debate the ranking.</li>
                    </ul>
                  </div>
                </aside>
              </section>
            </main>
