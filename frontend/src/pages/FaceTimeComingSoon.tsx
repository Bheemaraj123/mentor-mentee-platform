import React from 'react';
import { Video } from 'lucide-react';

export const FaceTimeComingSoon: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[80vh] text-center p-6">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
        <Video className="w-10 h-10 text-primary" />
      </div>
      <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full uppercase tracking-wider mb-4">
        Feature Preview
      </span>
      <h1 className="text-3xl font-bold mb-2">FaceTime & Live Meetings</h1>
      <p className="text-gray-600 dark:text-gray-400 max-w-md mb-8">
        We are building integrated real-time video conferencing for Mentors and Mentees.
        Stay tuned for seamless high-definition meetings directly within the platform!
      </p>
      <div className="px-6 py-2 bg-gray-200 dark:bg-gray-800 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300">
        COMING SOON
      </div>
    </div>
  );
};
