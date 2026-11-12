
import React from 'react';
import { TrendingUp, Target, BookOpen, CheckCircle2 } from 'lucide-react';

export const MenteeProgress: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          My Progress
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Track your learning journey and academic development.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
              <Target size={22} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Learning Goals
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                —
              </h3>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-3 text-green-600">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Completed Tasks
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                —
              </h3>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-3 text-purple-600">
              <TrendingUp size={22} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Overall Progress
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                —
              </h3>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center gap-3">
          <BookOpen size={22} className="text-indigo-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Progress Overview
          </h2>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          Your progress information will appear here as you complete tasks,
          achieve learning goals, and participate in mentoring sessions.
        </p>
      </div>
    </div>
  );
};
